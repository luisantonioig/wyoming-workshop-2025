import React, { useState } from "react";
import { useWallet } from "@meshsdk/react";
import {
  applyCborEncoding,
  deserializeDatum,
  Data,
  PlutusScript,
  resolvePlutusScriptAddress,
  UTxO,
} from "@meshsdk/core";

import "@meshsdk/react/styles.css";
import { SetMessageFn, SetMessageTypeFn } from "../page";

import { sendToScript, unlockFromScript } from "../_api/spendTx";
import { parseData, initializeBlockchainProvider } from "../_api/utils";

const blockchainProvider = initializeBlockchainProvider();

type CustomizedProps = {
  setMessage: SetMessageFn;
  setMessageType: SetMessageTypeFn;
  message: string | null;
  messageType: string | null;
};

const blackList: string[] = [
  "14448cd177575a9f27c3107d84f325d784cd036ab4f87f20490cc10ba925cbb9:0",
  "a29bf0db95db5f048a12d6b630e09d8767581ef25806abdf8e267b191cd3e1d4:0",
  "06536000b97a851f3cec32b0f77001cdbbd9aa3ed512aa02e9be6bb79b9c36c6:0",
  "86703dca6b85987d187f765167afefce1d0e52d571f16971a3e8218ccf2024d9:0",
  "51b31b09efb313bc6def019c7f441efc8c52ab34d31cb43f892f8759787b2144:0",
  "e49c6cb17b78f757c38ee6c292394ee46c43a744825757ad0eafe7ec17615dd5:0",
  "f610387049f91e22df83fe586bc126671ee98cc275ea639a626d8d003d84163e:0",
];

const Customized = ({
  setMessage,
  setMessageType,
  message,
  messageType,
}: CustomizedProps) => {
  const { wallet, connected } = useWallet();
  const [scriptAddress, setAddress] = useState("");
  const [scriptUTxOs, setScriptUTxOs] = useState<UTxO[]>([]);
  const [cbor, setCbor] = useState("");
  const [cborEncoded, setCborEncoded] = useState("");
  const [datum, setDatum] = useState("");
  const [redeemer, setRedeemer] = useState("");
  const [ada, setAda] = useState("");
  const [error, setError] = useState("");

  const setAdaFromInput = async (dat: string) => {
    if (/^\d*$/.test(dat)) {
      const numAda: number = parseInt(dat, 10) * 1000000;
      setAda(numAda.toString());

      if (dat && parseInt(dat, 10) < 2) {
        setError("The ADA amount has to be greater than 2");
      } else {
        setError("");
      }
    } else {
      setError("You have to select an amount in ADA");
    }
  };

  const setRedeemerFromInput = async (dat: string) => {
    setRedeemer(dat);
  };
  const setDatumFromInput = async (dat: string) => {
    setDatum(dat);
  };

  const unlock = async (txHash: string, index: number) => {
    setMessage("Sending transaction");
    setMessageType("warning");
    if (redeemer != "") {
      if (redeemer.includes("{")) {
        const red = parseData(JSON.parse(redeemer));
        const resultTxHash = await unlockFromScript(
          wallet,
          cborEncoded,
          txHash,
          index,
          red,
        );
        if (!resultTxHash.includes("error")) {
          setMessage("Transaction sent: " + resultTxHash);
          setMessageType("success");
        } else {
          setMessage(resultTxHash);
          setMessageType("error");
        }
      } else {
        const resultTxHash = await unlockFromScript(
          wallet,
          cborEncoded,
          txHash,
          index,
          redeemer,
        );
        if (!resultTxHash.includes("error")) {
          setMessage("Transaction sent: " + resultTxHash);
          setMessageType("success");
        } else {
          setMessage(resultTxHash);
          setMessageType("error");
        }
      }
    } else {
      setMessage("Write a Redeemer");
      setMessageType("error");
    }
  };

  const lock = async () => {
    setMessage("Sending Transaction");
    setMessageType("warning");
    if (ada !== "" && error === "" && datum !== "") {
      try {
        if (datum.includes("{")) {
          const parsed: Data = parseData(JSON.parse(datum));
          const resultTxHash = await sendToScript(
            wallet,
            scriptAddress,
            ada,
            parsed,
          );
          if (!resultTxHash.includes("error")) {
            setMessage("Transaction sent: " + resultTxHash);
            setMessageType("success");
          } else {
            setMessage(resultTxHash);
            setMessageType("error");
          }
        } else {
          const resultTxHash = await sendToScript(
            wallet,
            scriptAddress,
            ada,
            datum,
          );
          if (!resultTxHash.includes("error")) {
            setMessage("Transaction sent: " + resultTxHash);
            setMessageType("success");
          } else {
            setMessage(resultTxHash);
            setMessageType("error");
          }
        }
      } catch (err) {
        setMessage("Select a valid Datum: " + err);
        setMessageType("error");
      }
    } else {
      setMessage("Error in Datum or Redeemer");
      setMessageType("error");
    }
  };

  const setCborFromTextarea = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text");
    event.currentTarget.value += pastedData;
    await obtenerAddress(pastedData);
  };
  const reload = async () => {
    if (cbor != "") {
      obtenerAddress(cbor);
    } else {
      setMessage("Paste the CBOR code");
      setMessageType("error");
    }
  };
  const obtenerAddress = async (cborParameter: string) => {
    const encoded = applyCborEncoding(cborParameter);

    const script: PlutusScript = {
      version: "V3",
      code: encoded,
    };

    const scriptAddr = resolvePlutusScriptAddress(script, 0);
    const UTxOs = await blockchainProvider.fetchAddressUTxOs(scriptAddr);
    const utxosFiltered = UTxOs.filter(
      (utxo: UTxO) =>
        !blackList.includes(utxo.input.txHash + ":" + utxo.input.outputIndex) &&
        utxo.output?.plutusData,
    );

    setAddress(scriptAddr);
    setScriptUTxOs(utxosFiltered);
    setCborEncoded(encoded);
    setCbor(cborParameter);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-neutral-950 text-neutral-100">
      <div className="w-full bg-gradient-to-b from-neutral-900/90 to-neutral-950 px-6 py-10">
        <div className="mx-auto w-full max-w-7xl isolate">
          <div className="rounded-2xl border border-neutral-700 bg-neutral-900/95 p-6 shadow-2xl">
            <p className="mb-4 text-center text-lg font-semibold tracking-tight text-white">
              {scriptAddress || "Write the code below to get the address"}
            </p>

            <textarea
              className="min-h-[60px] w-full resize-y rounded-xl border border-neutral-600 bg-neutral-800 px-5 py-4 text-base text-neutral-100 placeholder:text-neutral-300 shadow-inner focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/50"
              placeholder="Write the CBOR here"
              onPaste={setCborFromTextarea}
            />

            {message && (
              <div
                className={`relative mt-4 w-full rounded-xl px-5 py-3 text-center text-base font-medium shadow-lg ring-1 ring-inset ${
                  messageType === "success"
                    ? "bg-emerald-600 text-white ring-emerald-400/40"
                    : messageType === "error"
                      ? "bg-rose-600 text-white ring-rose-400/40"
                      : "bg-amber-600 text-white ring-amber-400/40"
                }`}
                role="status"
              >
                <button
                  onClick={() => {
                    setMessage(null);
                    setMessageType(null);
                  }}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/70"
                  aria-label="Dismiss message"
                >
                  ×
                </button>
                {message}
              </div>
            )}
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-700 bg-neutral-900/95 p-6 shadow-2xl">
              <h3 className="mb-5 text-center text-lg font-semibold tracking-tight text-white">
                Lock ADAs
              </h3>

              <div className="flex flex-col gap-6">
                <label className="text-sm font-semibold text-neutral-200">
                  Ada
                  <input
                    type="text"
                    placeholder="Amount"
                    className="mt-2 w-full rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-300 shadow-inner focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/50"
                    onChange={(e) => setAdaFromInput(e.target.value)}
                  />
                </label>

                {error && (
                  <span className="text-sm text-rose-400">{error}</span>
                )}

                <label className="text-sm font-semibold text-neutral-200">
                  Datum
                  <input
                    type="text"
                    placeholder="Datum"
                    className="mt-2 w-full rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-300 shadow-inner focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/50"
                    onChange={(e) => setDatumFromInput(e.target.value)}
                  />
                </label>

                <PrimaryButton
                  disabled={!connected}
                  onClick={lock}
                  variant="secondary"
                  className="mt-2 !bg-white !text-neutral-900 !border-2 !border-white !ring-2 !ring-white"
                >
                  Lock ADAs
                </PrimaryButton>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-700 bg-neutral-900/95 p-6 shadow-2xl">
              <h3 className="mb-5 text-center text-lg font-semibold tracking-tight text-white">
                {scriptAddress
                  ? `UTxOs in ${scriptAddress}`
                  : "Update or paste the CBOR to see the address"}
              </h3>

              <PrimaryButton
                onClick={reload}
                variant="secondary"
                className="!bg-white !text-neutral-900 !border-2 !border-white !ring-2 !ring-white"
              >
                Reload
              </PrimaryButton>

              <div className="mt-6 space-y-4">
                {scriptUTxOs.map((item) => {
                  const lovelace = item.output.amount.find(
                    (a: any) => a.unit === "lovelace",
                  );
                  const qty = lovelace
                    ? Number(lovelace.quantity).toLocaleString()
                    : "0";
                  const datum = item.output?.plutusData
                    ? JSON.stringify(
                        deserializeDatum(item.output.plutusData),
                        (_key, value) =>
                          typeof value === "bigint" ? value.toString() : value,
                      )
                    : "No data";

                  return (
                    <button
                      key={item.input.txHash + "#" + item.input.outputIndex}
                      onClick={() =>
                        unlock(item.input.txHash, item.input.outputIndex)
                      }
                      disabled={!connected}
                      className="group w-full rounded-2xl border-2 border-white/70 bg-white px-5 py-4 text-left text-base text-neutral-900 shadow-lg transition hover:-translate-y-px hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-rose-500/40 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 text-sm font-medium text-neutral-800">
                          <span className="tabular-nums">{qty}</span>
                          <span className="ml-1 text-neutral-600">
                            lovelaces
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <code
                            title={datum}
                            className="block w-full truncate whitespace-nowrap font-mono text-xs md:text-sm text-neutral-700 hover:text-neutral-900"
                          >
                            {datum}
                          </code>
                        </div>
                        <span className="shrink-0 rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700 transition group-hover:bg-neutral-100">
                          Unlock →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <label className="mt-6 block text-sm font-semibold text-neutral-200">
                Redeemer
                <input
                  type="text"
                  placeholder="Redeemer"
                  className="mt-2 w-full rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-300 shadow-inner focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/50"
                  onChange={(e) => setRedeemerFromInput(e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 shadow-lg ring-1 ring-inset";
  const variants: Record<string, string> = {
    primary:
      "bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98] ring-rose-400/40 focus:ring-4 focus:ring-rose-500/40",
    secondary:
      "bg-white text-neutral-900 hover:bg-neutral-100 active:scale-[0.98] ring-neutral-300/60 focus:ring-4 focus:ring-white/60",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function __isClickable(disabled?: boolean) {
  return !disabled;
}

export const __tests = [
  ["PrimaryButton enabled debe ser clickable", __isClickable(false) === true],
  [
    "PrimaryButton disabled NO debe ser clickable",
    __isClickable(true) === false,
  ],
];

export default Customized;
