"use client";

import { useState } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";

import { useLanguage } from "@/i18n/language-provider";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { notifyContractDataUpdated } from "@/lib/web3/contract-events";

type CampaignStatusControlProps = {
  campaignId: string;
};

type TransactionStatus =
  | "idle"
  | "awaiting-signature"
  | "sent"
  | "confirmed"
  | "error";

export function CampaignStatusControl({
  campaignId,
}: CampaignStatusControlProps) {
  const { t } = useLanguage();
  const onchainCampaignId = BigInt(campaignId);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("idle");
  const [error, setError] = useState<string>();
  const account = useActiveAccount();
  const sendTransaction = useSendTransaction({ payModal: false });
  const campaign = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getCampaign",
    params: [onchainCampaignId],
  });

  const isCreator =
    account &&
    campaign.data &&
    account.address.toLowerCase() === campaign.data.creator.toLowerCase();
  const isProcessing =
    transactionStatus === "awaiting-signature" ||
    transactionStatus === "sent";

  async function toggleCampaignStatus() {
    setError(undefined);

    try {
      if (!account || !campaign.data || !isCreator) {
        throw new Error(t("campaign.control.creatorOnly"));
      }

      const transaction = prepareContractCall({
        contract: crowdTubeCampaignsContract,
        method: "setCampaignStatus",
        params: [onchainCampaignId, !campaign.data.active],
      });

      setTransactionStatus("awaiting-signature");
      const sentTransaction = await sendTransaction.mutateAsync(transaction);
      setTransactionStatus("sent");
      await waitForReceipt(sentTransaction);

      setTransactionStatus("confirmed");
      await campaign.refetch();
      notifyContractDataUpdated();
    } catch (statusError) {
      setTransactionStatus("error");
      setError(
        statusError instanceof Error
          ? statusError.message
          : t("campaign.control.updateError"),
      );
    }
  }

  if (campaign.isLoading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-zinc-400">{t("campaign.control.loading")}</p>
      </section>
    );
  }

  if (campaign.isError || !campaign.data) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("campaign.control.section")}
          </p>
          <h2 className="mt-1 font-medium">
            {campaign.data.active
              ? t("campaign.control.receiving")
              : t("campaign.control.paused")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            {campaign.data.active
              ? t("campaign.control.receivingDescription")
              : t("campaign.control.pausedDescription")}
          </p>
        </div>

        {isCreator ? (
          <button
            type="button"
            onClick={toggleCampaignStatus}
            disabled={isProcessing}
            className="h-11 rounded-xl border border-white/15 px-5 text-sm font-medium text-zinc-200 transition hover:border-emerald-300/50 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {transactionStatus === "awaiting-signature" && t("campaign.control.confirmWallet")}
            {transactionStatus === "sent" && t("campaign.control.confirming")}
            {(transactionStatus === "idle" ||
              transactionStatus === "confirmed" ||
              transactionStatus === "error") &&
              (campaign.data.active
                ? t("campaign.control.pause")
                : t("campaign.control.resume"))}
          </button>
        ) : (
          <p className="text-xs text-zinc-500">
            {t("campaign.control.creatorHint")}
          </p>
        )}
      </div>

      <div aria-live="polite" className="mt-3 min-h-5">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {transactionStatus === "confirmed" ? (
          <p className="text-sm text-emerald-200">
            {campaign.data.active
              ? t("campaign.control.resumed")
              : t("campaign.control.pausedConfirmation")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
