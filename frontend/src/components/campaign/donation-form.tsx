"use client";

import { FormEvent, useEffect, useState } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { toWei } from "thirdweb/utils";

import { type Translate, useLanguage } from "@/i18n/language-provider";
import { confirmDonationTransaction } from "@/lib/api/donations";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import {
  formatEther,
  getProgressBarWidth,
  getProgressPercentage,
} from "@/lib/web3/campaign-values";
import {
  CONTRACT_DATA_UPDATED_EVENT,
  notifyContractDataUpdated,
} from "@/lib/web3/contract-events";

function parseEtherInput(input: string, t: Translate) {
  const normalizedInput = input.trim().replace(",", ".");
  const match = normalizedInput.match(/^(0|[1-9]\d*)(?:\.(\d{1,18}))?$/);

  if (!match) {
    throw new Error(t("donation.invalidFormat"));
  }

  const amountInWei = toWei(normalizedInput);

  if (amountInWei === BigInt(0)) {
    throw new Error(t("donation.greaterThanZero"));
  }

  return amountInWei;
}

type DonationFormProps = {
  campaignId: string;
};

function formatRemaining(deadline: bigint, t: Translate): string {
  if (deadline === 0n) return t("donation.noDeadline");
  const days = Math.max(0, Math.ceil((Number(deadline) * 1_000 - Date.now()) / 86_400_000));
  return days === 0
    ? t("donation.deadlineEnded")
    : days === 1
      ? t("donation.oneDayLeft")
      : t("donation.daysLeft", { count: days });
}

type TransactionStatus =
  | "idle"
  | "awaiting-signature"
  | "sent"
  | "confirmed"
  | "error";

function getTransactionErrorMessage(error: unknown, t: Translate) {
  if (!(error instanceof Error)) {
    return t("donation.error");
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("rejected") ||
    message.includes("denied") ||
    message.includes("cancelled")
  ) {
    return t("donation.cancelled");
  }

  if (message.includes("insufficient funds")) {
    return t("donation.insufficientFunds");
  }

  return t("donation.networkError");
}

export function DonationForm({ campaignId }: DonationFormProps) {
  const { intlLocale, t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string>();
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("idle");
  const [transactionHash, setTransactionHash] = useState<string>();
  const account = useActiveAccount();
  const sendTransaction = useSendTransaction({ payModal: false });
  const campaign = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getCampaign",
    params: [BigInt(campaignId)],
  });
  const { refetch: refetchCampaign } = campaign;
  const isCampaignInactive = campaign.data?.active === false;
  const goalReached = campaign.data
    ? campaign.data.totalRaised >= campaign.data.goal
    : false;
  const progressPercentage = campaign.data
    ? getProgressPercentage(campaign.data.totalRaised, campaign.data.goal)
    : 0;
  const progressWidth = campaign.data
    ? getProgressBarWidth(campaign.data.totalRaised, campaign.data.goal)
    : 0;

  useEffect(() => {
    function refreshCampaign() {
      void refetchCampaign();
    }

    window.addEventListener(CONTRACT_DATA_UPDATED_EVENT, refreshCampaign);

    return () => {
      window.removeEventListener(CONTRACT_DATA_UPDATED_EVENT, refreshCampaign);
    };
  }, [refetchCampaign]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setTransactionHash(undefined);

    try {
      const amountInWei = parseEtherInput(amount, t);

      if (!account) {
        throw new Error(t("donation.connectWallet"));
      }

      if (isCampaignInactive) {
        throw new Error(t("donation.inactiveError"));
      }

      const transaction = prepareContractCall({
        contract: crowdTubeCampaignsContract,
        method: "donate",
        params: [BigInt(campaignId)],
        value: amountInWei,
      });

      setTransactionStatus("awaiting-signature");
      const sentTransaction = await sendTransaction.mutateAsync(transaction);
      setTransactionHash(sentTransaction.transactionHash);
      setTransactionStatus("sent");

      await waitForReceipt(sentTransaction);
      setTransactionStatus("confirmed");
      setAmount("");
      await Promise.allSettled([
        campaign.refetch(),
        confirmDonationTransaction(sentTransaction.transactionHash),
      ]);
      notifyContractDataUpdated();
    } catch (transactionError) {
      setTransactionStatus("error");
      setError(getTransactionErrorMessage(transactionError, t));
    }
  }

  const isProcessing =
    transactionStatus === "awaiting-signature" ||
    transactionStatus === "sent";

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4 sm:p-8"
    >
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            {t("donation.support")}
          </p>
          {isCampaignInactive ? (
            <span className="mt-2 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
              {t("donation.inactive")}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 sm:min-w-36 sm:text-right">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {t("donation.goal")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">
            {campaign.data ? `${formatEther(campaign.data.goal)} ETH` : t("wallet.querying")}
          </p>
          {campaign.data ? (
            <p className="mt-1 text-xs text-zinc-500">
              {t("donation.raised", { amount: formatEther(campaign.data.totalRaised) })}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-zinc-400">
            {campaign.data ? formatRemaining(campaign.data.deadline, t) : t("donation.loadingDeadline")}
          </p>
        </div>
      </div>

      {campaign.data ? (
        <div className="mt-5">
          <div className="mb-2 flex justify-end">
            <span className="text-sm font-medium text-emerald-200">
              {goalReached
                ? t("campaign.goalReached")
                : `${progressPercentage.toLocaleString(intlLocale)}%`}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={t("donation.goalProgress")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressWidth}
            className="h-2 w-full max-w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-emerald-300 transition-[width]"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>
      ) : null}

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
        {t("donation.amountHelp")}
      </p>

      <button
        type="submit"
        disabled={isProcessing || isCampaignInactive || !campaign.data}
        className="mt-5 h-11 w-full rounded-xl bg-emerald-300 font-semibold text-zinc-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {transactionStatus === "awaiting-signature" && t("wallet.confirmWallet")}
        {transactionStatus === "sent" && t("wallet.awaitingConfirmation")}
        {(transactionStatus === "idle" ||
          transactionStatus === "confirmed" ||
          transactionStatus === "error") &&
          t("donation.action")}
      </button>

      <div id="donation-amount-feedback" aria-live="polite" className="mt-3 min-h-10">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {transactionStatus === "confirmed" ? (
          <p className="text-sm leading-5 text-emerald-200">
            {t("donation.confirmed")}
          </p>
        ) : null}
        {transactionHash && transactionStatus === "sent" ? (
          <p className="break-all font-mono text-xs leading-5 text-zinc-400">
            {t("donation.transactionSent", { hash: transactionHash })}
          </p>
        ) : null}
      </div>
    </form>
  );
}
