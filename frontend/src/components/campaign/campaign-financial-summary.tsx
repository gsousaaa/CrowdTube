"use client";

import { useEffect } from "react";
import { useReadContract } from "thirdweb/react";

import { useLanguage } from "@/i18n/language-provider";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import {
  formatEther,
  getProgressBarWidth,
  getProgressPercentage,
} from "@/lib/web3/campaign-values";
import { CONTRACT_DATA_UPDATED_EVENT } from "@/lib/web3/contract-events";

type CampaignFinancialSummaryProps = {
  campaignId: string;
};

function formatDeadline(deadline: bigint, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(Number(deadline) * 1_000));
}

export function CampaignFinancialSummary({
  campaignId,
}: CampaignFinancialSummaryProps) {
  const { intlLocale, t } = useLanguage();
  const campaign = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getCampaign",
    params: [BigInt(campaignId)],
  });
  const { refetch } = campaign;

  useEffect(() => {
    function refreshCampaign() {
      void refetch();
    }

    window.addEventListener(CONTRACT_DATA_UPDATED_EVENT, refreshCampaign);
    return () =>
      window.removeEventListener(CONTRACT_DATA_UPDATED_EVENT, refreshCampaign);
  }, [refetch]);

  if (campaign.isLoading) {
    return (
      <div className="mt-6 text-sm text-zinc-400">
        {t("campaign.loadingFinancial")}
      </div>
    );
  }

  if (campaign.isError || !campaign.data) {
    return (
      <div className="mt-6 text-sm text-red-300">
        {t("campaign.financialError")}
      </div>
    );
  }

  const { totalRaised, goal, deadline, active } = campaign.data;
  const percentage = getProgressPercentage(totalRaised, goal);
  const progressWidth = getProgressBarWidth(totalRaised, goal);
  const goalReached = totalRaised >= goal;

  return (
    <section aria-labelledby="financial-summary-title" className="mt-7 min-w-0 w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            active
              ? "bg-emerald-300/10 text-emerald-200"
              : "bg-amber-300/10 text-amber-200"
          }`}
        >
          {active ? t("campaign.receivingDonations") : t("campaign.donationsPaused")}
        </span>
        <span className="text-sm text-zinc-500">
          {deadline === 0n ? t("campaign.noDeadline") : formatDeadline(deadline, intlLocale)}
        </span>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{t("campaign.raised")}</p>
          <h2 id="financial-summary-title" className="mt-1 break-words text-xl font-semibold text-emerald-300 sm:text-2xl">
            {formatEther(totalRaised)} ETH
            <span className="block text-sm font-normal text-zinc-500 sm:inline sm:text-base">
              <span className="hidden sm:inline"> / </span>
              <span className="sm:hidden">{t("campaign.goal")}</span>{formatEther(goal)} ETH
            </span>
          </h2>
        </div>
        <p className="text-sm font-medium text-zinc-200">
          {goalReached ? t("campaign.goalReached") : `${percentage.toLocaleString(intlLocale)}%`}
        </p>
      </div>

      <div role="progressbar" aria-label={t("campaign.goalProgress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressWidth} className="mt-3 h-2 w-full max-w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-300 transition-[width]" style={{ width: `${progressWidth}%` }} />
      </div>
    </section>
  );
}
