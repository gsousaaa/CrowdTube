"use client";

import { FormEvent, useState } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import {
  useActiveAccount,
  useActiveWalletChain,
  useReadContract,
  useSendTransaction,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import { toWei } from "thirdweb/utils";

import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { notifyContractDataUpdated } from "@/lib/web3/contract-events";
import { hardhatLocalChain } from "@/lib/web3/hardhat-chain";

type WithdrawalStatus =
  | "idle"
  | "switching-chain"
  | "awaiting-signature"
  | "sent"
  | "confirmed"
  | "error";

type CampaignWithdrawalFormProps = {
  campaignId: string;
};

function formatEther(value: bigint) {
  const formatted = value.toString().padStart(19, "0");
  const wholePart = formatted.slice(0, -18);
  const decimalPart = formatted.slice(-18).replace(/0+$/, "").slice(0, 6);

  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart;
}

function formatExactEther(value: bigint) {
  const formatted = value.toString().padStart(19, "0");
  const wholePart = formatted.slice(0, -18);
  const decimalPart = formatted.slice(-18).replace(/0+$/, "");

  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getWithdrawalError(error: unknown) {
  if (!(error instanceof Error)) return "Não foi possível concluir o saque.";

  const message = error.message.toLowerCase();

  if (
    message.includes("rejected") ||
    message.includes("denied") ||
    message.includes("cancelled")
  ) {
    return "A assinatura do saque foi cancelada na carteira.";
  }

  if (message.includes("insufficient campaign balance")) {
    return "O valor solicitado é maior que o saldo disponível da campanha.";
  }

  if (message.includes("only campaign creator")) {
    return "Somente a carteira criadora da campanha pode realizar o saque.";
  }

  return error.message;
}

export function CampaignWithdrawalForm({
  campaignId,
}: CampaignWithdrawalFormProps) {
  const onchainCampaignId = BigInt(campaignId);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<WithdrawalStatus>("idle");
  const [error, setError] = useState<string>();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const sendTransaction = useSendTransaction({ payModal: false });
  const campaign = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getCampaign",
    params: [onchainCampaignId],
  });
  const availableBalance = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getAvailableBalance",
    params: [onchainCampaignId],
  });

  const isCreator =
    account &&
    campaign.data &&
    account.address.toLowerCase() === campaign.data.creator.toLowerCase();
  const isProcessing =
    status === "switching-chain" ||
    status === "awaiting-signature" ||
    status === "sent";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    try {
      if (!account || !campaign.data) {
        throw new Error("Conecte a carteira criadora da campanha.");
      }

      if (!isCreator) {
        throw new Error("Somente a carteira criadora da campanha pode realizar o saque.");
      }

      const amountInWei = toWei(amount.trim().replace(",", "."));

      if (amountInWei <= 0n) {
        throw new Error("O valor do saque deve ser maior que zero.");
      }

      if (
        availableBalance.data === undefined ||
        amountInWei > availableBalance.data
      ) {
        throw new Error("O valor solicitado é maior que o saldo disponível da campanha.");
      }

      if (activeChain?.id !== hardhatLocalChain.id) {
        setStatus("switching-chain");
        await switchChain(hardhatLocalChain);
      }

      const transaction = prepareContractCall({
        contract: crowdTubeCampaignsContract,
        method: "withdraw",
        params: [onchainCampaignId, amountInWei],
      });

      setStatus("awaiting-signature");
      const sentTransaction = await sendTransaction.mutateAsync(transaction);
      setStatus("sent");
      await waitForReceipt(sentTransaction);

      setStatus("confirmed");
      setAmount("");
      await Promise.all([campaign.refetch(), availableBalance.refetch()]);
      notifyContractDataUpdated();
    } catch (withdrawalError) {
      setStatus("error");
      setError(getWithdrawalError(withdrawalError));
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        Gestão financeira
      </p>
      <h2 className="mt-1 font-medium">Sacar doações</h2>

      {campaign.isLoading || availableBalance.isLoading ? (
        <p className="mt-4 text-sm text-zinc-400">Consultando autorização e saldo...</p>
      ) : campaign.isError || availableBalance.isError || !campaign.data ? (
        <p className="mt-4 text-sm text-red-300">
          Não foi possível consultar os dados necessários para o saque.
        </p>
      ) : !account ? (
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Conecte a carteira criadora para acessar o saque. Criador registrado: {" "}
          <span className="font-mono text-zinc-300">
            {shortAddress(campaign.data.creator)}
          </span>
        </p>
      ) : !isCreator ? (
        <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
          <p className="text-sm text-amber-200">Carteira sem autorização para sacar.</p>
          <p className="mt-1 text-xs text-zinc-500">
            A campanha pertence a {shortAddress(campaign.data.creator)}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex items-end justify-between gap-4">
            <label htmlFor="withdrawal-amount" className="text-sm text-zinc-300">
              Valor do saque
            </label>
            <button
              type="button"
              onClick={() =>
                setAmount(formatExactEther(availableBalance.data ?? 0n))
              }
              className="text-xs text-emerald-300 hover:text-emerald-200"
            >
              Usar saldo máximo: {formatEther(availableBalance.data ?? 0n)} ETH
            </button>
          </div>

          <div className="relative mt-2">
            <input
              id="withdrawal-amount"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(undefined);
                setStatus("idle");
              }}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,01"
              className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-4 pr-16 outline-none focus:border-emerald-300/60"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-zinc-400">
              ETH
            </span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || availableBalance.data === 0n}
            className="mt-4 h-11 w-full rounded-xl bg-emerald-300 font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "switching-chain" && "Trocando para Hardhat..."}
            {status === "awaiting-signature" && "Confirme na carteira..."}
            {status === "sent" && "Aguardando confirmação..."}
            {(status === "idle" || status === "confirmed" || status === "error") &&
              "Sacar ETH"}
          </button>

          <div aria-live="polite" className="mt-3 min-h-6">
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {status === "confirmed" ? (
              <p className="text-sm text-emerald-200">
                Saque confirmado. O ETH foi transferido para a carteira criadora.
              </p>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}
