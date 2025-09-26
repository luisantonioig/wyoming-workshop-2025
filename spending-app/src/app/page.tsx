"use client";
import { useState } from "react";
import { useWallet } from "@meshsdk/react";
import Spend from "./_components/Spend";
import Navbar from "./_components/Navbar";

export type SetMessageFn = (msg: string | null) => void;
export type SetMessageTypeFn = (
  msg: "success" | "error" | "warning" | null,
) => void;

export default function Home() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<string | null>(null);

  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  async function getAssets() {
    if (wallet) {
      setLoading(true);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <header>
        <Navbar setMessage={setMessage} setMessageType={setMessageType} />
      </header>

      <main className="flex-1 bg-gradient-to-b from-neutral-950 to-neutral-900/70 px-4 py-6">
        <Spend
          message={message}
          messageType={messageType}
          setMessage={setMessage}
          setMessageType={setMessageType}
        />
      </main>

      {/* Footer opcional */}
    </div>
  );
}
