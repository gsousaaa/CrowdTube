"use client";

import { FormEvent, useState } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { toWei } from "thirdweb/utils";

import { type Translate, useLanguage } from "@/i18n/language-provider";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { notifyContractDataUpdated } from "@/lib/web3/contract-events";

type WithdrawalStatus =
  | "idle"
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

function getWithdrawalError(error: unknown, t: Translate) {
  if (!(error instanceof Error)) return t("withdrawal.error");

  const message = error.message.toLowerCase();

  if (
    message.includes("rejected") ||
    message.includes("denied") ||
    message.includes("cancelled")
  ) {
    return t("withdrawal.cancelled");
  }

  if (message.includes("insufficient campaign balance")) {
    return t("withdrawal.exceedsBalance");
  }

  if (message.includes("only campaign creator")) {
    return t("withdrawal.creatorOnly");
  }

  return error.message;
}

export function CampaignWithdrawalForm({
  campaignId,
}: CampaignWithdrawalFormProps) {
  const { t } = useLanguage();
  const onchainCampaignId = BigInt(campaignId);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<WithdrawalStatus>("idle");
  const [error, setError] = useState<string>();
  const account = useActiveAccount();
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
    status === "awaiting-signature" ||
    status === "sent";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    try {
      if (!account || !campaign.data) {
        throw new Error(t("withdrawal.connectWallet"));
      }

      if (!isCreator) {
        throw new Error(t("withdrawal.creatorOnly"));
      }

      const amountInWei = toWei(amount.trim().replace(",", "."));

      if (amountInWei <= 0n) {
        throw new Error(t("withdrawal.greaterThanZero"));
      }

      if (
        availableBalance.data === undefined ||
        amountInWei > availableBalance.data
      ) {
        throw new Error(t("withdrawal.exceedsBalance"));
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
      setError(getWithdrawalError(withdrawalError, t));
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {t("withdrawal.section")}
      </p>
      <h2 className="mt-1 font-medium">{t("withdrawal.title")}</h2>

      {campaign.isLoading || availableBalance.isLoading ? (
        <p className="mt-4 text-sm text-zinc-400">{t("withdrawal.loading")}</p>
      ) : campaign.isError || availableBalance.isError || !campaign.data ? (
        <p className="mt-4 text-sm text-red-300">
          {t("withdrawal.loadError")}
        </p>
      ) : !account ? (
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          {t("withdrawal.connectCreator", { address: shortAddress(campaign.data.creator) })}
        </p>
      ) : !isCreator ? (
        <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
          <p className="text-sm text-amber-200">{t("withdrawal.unauthorized")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {t("withdrawal.owner", { address: shortAddress(campaign.data.creator) })}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex items-end justify-between gap-4">
            <label htmlFor="withdrawal-amount" className="text-sm text-zinc-300">
              {t("withdrawal.amount")}
            </label>
            <button
              type="button"
              onClick={() =>
                setAmount(formatExactEther(availableBalance.data ?? 0n))
              }
              className="text-xs text-emerald-300 hover:text-emerald-200"
            >
              {t("withdrawal.useMaximum", { amount: formatEther(availableBalance.data ?? 0n) })}
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
            {status === "awaiting-signature" && t("wallet.confirmWallet")}
            {status === "sent" && t("wallet.awaitingConfirmation")}
            {(status === "idle" || status === "confirmed" || status === "error") &&
              t("withdrawal.action")}
          </button>

          <div aria-live="polite" className="mt-3 min-h-6">
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {status === "confirmed" ? (
              <p className="text-sm text-emerald-200">
                {t("withdrawal.confirmed")}
              </p>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}
