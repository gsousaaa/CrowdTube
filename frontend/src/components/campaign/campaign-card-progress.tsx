"use client";

import { useReadContract } from "thirdweb/react";

import { useLanguage } from "@/i18n/language-provider";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import {
  formatEther,
  getProgressBarWidth,
  getProgressPercentage,
} from "@/lib/web3/campaign-values";

type CampaignCardProgressProps = {
  campaignId: string;
};

export function CampaignCardProgress({ campaignId }: CampaignCardProgressProps) {
  const { intlLocale, t } = useLanguage();
  const campaign = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getCampaign",
    params: [BigInt(campaignId)],
  });

  if (campaign.isLoading) {
    return <p className="text-xs text-zinc-500">{t("campaign.loadingProgress")}</p>;
  }

  if (campaign.isError || !campaign.data) {
    return <p className="text-xs text-zinc-500">{t("campaign.onchainUnavailable")}</p>;
  }

  const { totalRaised, goal, active } = campaign.data;
  const percentage = getProgressPercentage(totalRaised, goal);
  const progressWidth = getProgressBarWidth(totalRaised, goal);
  const goalReached = totalRaised >= goal;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">{t("campaign.raised")}</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">
            {formatEther(totalRaised)} ETH
            <span className="text-sm font-normal text-zinc-500">
              {" "}/ {formatEther(goal)} ETH
            </span>
          </p>
        </div>
        <span className={active ? "text-xs text-emerald-300" : "text-xs text-amber-200"}>
          {active ? t("campaign.active") : t("campaign.inactive")}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={t("campaign.progressLabel", { id: campaignId })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressWidth}
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <div className="h-full rounded-full bg-emerald-300" style={{ width: `${progressWidth}%` }} />
      </div>

      <p className="text-xs text-zinc-400">
        {goalReached
          ? t("campaign.goalReached")
          : t("campaign.goalPercentage", { percentage: percentage.toLocaleString(intlLocale) })}
      </p>
    </div>
  );
}
