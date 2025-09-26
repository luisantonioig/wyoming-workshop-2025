import {
  IWallet,
  Transaction,
  Data,
  deserializeAddress,
  unixTimeToEnclosingSlot,
  SLOT_CONFIG_NETWORK,
} from "@meshsdk/core";
import { initializeBlockchainProvider } from "../_api/utils";

const blockchainProvider = initializeBlockchainProvider();

export async function sendToScript(
  wallet: IWallet,
  scriptAddress: string,
  lovelace: string,
  datum: Data,
) {
  const tx = new Transaction({ initiator: wallet })
    .sendLovelace(
      {
        address: scriptAddress,
        datum: {
          value: datum,
          inline: true,
        },
      },
      lovelace,
    )
    .setChangeAddress(await wallet.getChangeAddress());

  const txCruda = await tx.build();
  const txFirmada = await wallet.signTx(txCruda);

  const txHash = await wallet.submitTx(txFirmada);
  if (txHash != null) {
    return txHash;
  }

  return "error: your transaction was not sent.";
}

export async function unlockFromScript(
  wallet: IWallet,
  code: string,
  txHash: string,
  index: number,
  redeemer: string | Data,
) {
  function calculateInvalidBefore(): number {
    return (
      unixTimeToEnclosingSlot(Date.now() - 30000, SLOT_CONFIG_NETWORK.preprod) +
      1
    );
  }

  const ownUtxo = await wallet.getUtxos();
  const collaterals = await wallet.getCollateral();
  if (collaterals.length == 0) {
    return "error: set the collateral in your wallet.";
  }

  const num: number = Number(redeemer);
  const { pubKeyHash } = deserializeAddress(await wallet.getChangeAddress());
  if (isNaN(num)) {
    const invalidBefore = calculateInvalidBefore();
    const tx = await new Transaction({
      initiator: wallet,
      fetcher: blockchainProvider,
      verbose: true,
    }).txBuilder
      .setNetwork("preprod")
      .spendingPlutusScriptV3()
      .txIn(txHash, index)
      .txInInlineDatumPresent()
      .txInRedeemerValue(redeemer)
      .txInScript(code)
      .selectUtxosFrom(ownUtxo)
      .changeAddress(await wallet.getChangeAddress())
      .txInCollateral(
        collaterals[0].input.txHash,
        collaterals[0].input.outputIndex,
      )
      .invalidBefore(invalidBefore)
      .requiredSignerHash(pubKeyHash)
      .setNetwork("preprod")

      .complete();
    const txFirmada = wallet.signTx(tx, true);
    try {
      const newTxHash = await wallet.submitTx(await txFirmada);
      return newTxHash;
    } catch {
      return "error sending the transaction";
    }
  } else {
    const tx = await new Transaction({
      initiator: wallet,
      fetcher: blockchainProvider,
      evaluator: blockchainProvider,
      verbose: true,
    }).txBuilder
      .setNetwork("preprod")
      .spendingPlutusScriptV3()
      .txIn(txHash, index)
      .txInInlineDatumPresent()
      .txInRedeemerValue(num)
      .txInScript(code)
      .selectUtxosFrom(ownUtxo)
      .changeAddress(await wallet.getChangeAddress())
      .txInCollateral(
        collaterals[0].input.txHash,
        collaterals[0].input.outputIndex,
      )
      .setNetwork("preprod")

      .complete();
    const txFirmada = wallet.signTx(tx, true);
    try {
      const newTxHash = await wallet.submitTx(await txFirmada);
      return newTxHash;
    } catch (error) {
      return "error sending the transaction";
    }
  }
}
