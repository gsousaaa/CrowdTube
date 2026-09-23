import Link from "next/link";

import { CampaignCardProgress } from "@/components/campaign/campaign-card-progress";
import { CampaignImage } from "@/components/campaign/campaign-image";
import type { ApiCampaign } from "@/lib/api/campaigns";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { crowdTubeChain } from "@/lib/web3/network";

export const campaignCategoryLabels: Record<ApiCampaign["category"], string> = {
  education: "Educação",
  entertainment: "Entretenimento",
  science: "Ciência e tecnologia",
  games: "Games",
  other: "Outra",
};

export const campaignStatusLabels: Record<ApiCampaign["status"], string> = {
  draft: "Rascunho: transação não enviada",
  pending_onchain: "Aguardando confirmação na blockchain",
  published: "Publicada",
  failed: "Criação não concluída",
};

export function ApiCampaignCard({
  campaign,
  audience = "admin",
}: {
  campaign: ApiCampaign;
  audience?: "admin" | "public";
}) {
  const isConfiguredContract = campaign.chainId === crowdTubeChain.id &&
    campaign.contractAddress?.toLowerCase() === crowdTubeCampaignsContract.address.toLowerCase();

  return (
    <Link href={audience === "admin" ? `/admin/campaigns/${campaign.id}` : `/campaigns/${campaign.id}`}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
      <article className="h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition group-hover:-translate-y-1 group-hover:border-emerald-300/40">
        <div className="relative flex h-40 items-end bg-[linear-gradient(145deg,#27272a,#111827)] p-5">
          {campaign.imageObjectKey ? <CampaignImage objectKey={campaign.imageObjectKey} alt={`Capa de ${campaign.title}`} /> : null}
          <span className="relative rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs text-zinc-200 backdrop-blur">
            {campaignCategoryLabels[campaign.category]}
          </span>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">{campaign.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{campaign.description}</p>
          </div>
          {campaign.status === "published" && campaign.onchainCampaignId && isConfiguredContract ? (
            <CampaignCardProgress campaignId={campaign.onchainCampaignId} />
          ) : (
            <p className="text-sm text-amber-200">
              {campaign.status === "published" && !isConfiguredContract
                ? "Publicada em outra rede ou contrato"
                : campaignStatusLabels[campaign.status]}
            </p>
          )}
          <span className="inline-flex text-sm font-medium text-emerald-300 transition group-hover:text-emerald-200">
            {audience === "admin" ? "Ver detalhes da campanha →" : "Apoiar campanha →"}
          </span>
        </div>
      </article>
    </Link>
  );
}
