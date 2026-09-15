"use client";

import { useReadContract } from "thirdweb/react";

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
  const campaign = useReadContract({
    contract: crowdTubeCampaignsContract,
    method: "getCampaign",
    params: [BigInt(campaignId)],
  });

  if (campaign.isLoading) {
    return <p className="text-xs text-zinc-500">Carregando progresso...</p>;
  }

  if (campaign.isError || !campaign.data) {
    return <p className="text-xs text-zinc-500">Dados on-chain indisponíveis</p>;
  }

  const { totalRaised, goal, active } = campaign.data;
  const percentage = getProgressPercentage(totalRaised, goal);
  const progressWidth = getProgressBarWidth(totalRaised, goal);
  const goalReached = totalRaised >= goal;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Arrecadado</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">
            {formatEther(totalRaised)} ETH
            <span className="text-sm font-normal text-zinc-500">
              {" "}/ {formatEther(goal)} ETH
            </span>
          </p>
        </div>
        <span className={active ? "text-xs text-emerald-300" : "text-xs text-amber-200"}>
          {active ? "Ativa" : "Inativa"}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={`Progresso da campanha ${campaignId}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressWidth}
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <div className="h-full rounded-full bg-emerald-300" style={{ width: `${progressWidth}%` }} />
      </div>

      <p className="text-xs text-zinc-400">
        {goalReached ? "Meta atingida" : `${percentage.toLocaleString("pt-BR")}% da meta`}
      </p>
    </div>
  );
}
