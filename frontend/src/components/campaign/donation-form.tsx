"use client";

import { FormEvent, useState } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import {
  useActiveAccount,
  useActiveWalletChain,
  useSendTransaction,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import { toWei } from "thirdweb/utils";

import { donationVaultContract } from "@/lib/web3/donation-vault-contract";
import { hardhatLocalChain } from "@/lib/web3/hardhat-chain";

function parseEtherInput(input: string) {
  const normalizedInput = input.trim().replace(",", ".");
  const match = normalizedInput.match(/^(0|[1-9]\d*)(?:\.(\d{1,18}))?$/);

  if (!match) {
    throw new Error("Informe um valor com no máximo 18 casas decimais.");
  }

  const amountInWei = toWei(normalizedInput);

  if (amountInWei === BigInt(0)) {
    throw new Error("A doação deve ser maior que zero.");
  }

  return amountInWei;
}

type DonationFormProps = {
  goal: string;
  remaining: string;
};

type TransactionStatus =
  | "idle"
  | "switching-chain"
  | "awaiting-signature"
  | "sent"
  | "confirmed"
  | "error";

function getTransactionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Não foi possível concluir a doação.";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("rejected") ||
    message.includes("denied") ||
    message.includes("cancelled")
  ) {
    return "A assinatura foi cancelada na carteira.";
  }

  if (message.includes("insufficient funds")) {
    return "A carteira não possui ETH suficiente para a doação e o gas.";
  }

  if (
    message.includes("wallet_switchethereumchain") ||
    message.includes("method is not supported") ||
    message.includes("método não é aceito")
  ) {
    return "A Coinbase Wallet não aceita a rede Hardhat local. Desconecte-a e use a MetaMask para este teste.";
  }

  return "Não foi possível concluir a doação. Verifique a rede e tente novamente.";
}

export function DonationForm({ goal, remaining }: DonationFormProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string>();
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("idle");
  const [transactionHash, setTransactionHash] = useState<string>();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const sendTransaction = useSendTransaction({ payModal: false });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setTransactionHash(undefined);

    try {
      const amountInWei = parseEtherInput(amount);

      if (!account) {
        throw new Error("Conecte sua carteira antes de realizar a doação.");
      }

      if (activeChain?.id !== hardhatLocalChain.id) {
        setTransactionStatus("switching-chain");
        await switchChain(hardhatLocalChain);
      }

      const transaction = prepareContractCall({
        contract: donationVaultContract,
        method: "donate",
        value: amountInWei,
      });

      setTransactionStatus("awaiting-signature");
      const sentTransaction = await sendTransaction.mutateAsync(transaction);
      setTransactionHash(sentTransaction.transactionHash);
      setTransactionStatus("sent");

      await waitForReceipt(sentTransaction);
      setTransactionStatus("confirmed");
      setAmount("");
    } catch (transactionError) {
      setTransactionStatus("error");
      setError(getTransactionErrorMessage(transactionError));
    }
  }

  const isProcessing =
    transactionStatus === "switching-chain" ||
    transactionStatus === "awaiting-signature" ||
    transactionStatus === "sent";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            Apoie esta campanha
          </p>
          <label
            htmlFor="donation-amount"
            className="mt-1 block text-xl font-semibold"
          >
            Valor da doação
          </label>
        </div>

        <div className="min-w-36 sm:text-right">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Meta da campanha
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{goal}</p>
          <p className="mt-1 text-sm text-zinc-400">Restam {remaining}</p>
        </div>
      </div>

      <div className="relative mt-2">
        <input
          id="donation-amount"
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,01"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setError(undefined);
            setTransactionStatus("idle");
            setTransactionHash(undefined);
          }}
          aria-describedby="donation-amount-help donation-amount-feedback"
          aria-invalid={Boolean(error)}
          className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 pr-16 text-lg outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium text-zinc-400">
          ETH
        </span>
      </div>
      <p id="donation-amount-help" className="mt-2 text-xs text-zinc-500">
        Use ponto ou vírgula e até 18 casas decimais.
      </p>

      <button
        type="submit"
        disabled={isProcessing}
        className="mt-5 h-11 w-full rounded-xl bg-emerald-300 font-semibold text-zinc-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {transactionStatus === "switching-chain" && "Trocando para Hardhat..."}
        {transactionStatus === "awaiting-signature" && "Confirme na carteira..."}
        {transactionStatus === "sent" && "Aguardando confirmação..."}
        {(transactionStatus === "idle" ||
          transactionStatus === "confirmed" ||
          transactionStatus === "error") &&
          "Doar ETH"}
      </button>

      <div id="donation-amount-feedback" aria-live="polite" className="mt-3 min-h-10">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {transactionStatus === "confirmed" ? (
          <p className="text-sm leading-5 text-emerald-200">
            Doação confirmada no contrato. Obrigado pelo apoio!
          </p>
        ) : null}
        {transactionHash && transactionStatus === "sent" ? (
          <p className="break-all font-mono text-xs leading-5 text-zinc-400">
            Transação enviada: {transactionHash}
          </p>
        ) : null}
      </div>
    </form>
  );
}
