import Link from "next/link";

import { CampaignCardProgress } from "@/components/campaign/campaign-card-progress";
import { CampaignImage } from "@/components/campaign/campaign-image";
import { CampaignOptionsMenu } from "@/components/campaign/campaign-options-menu";
import { type TranslationKey, useLanguage } from "@/i18n/language-provider";
import type { ApiCampaign } from "@/lib/api/campaigns";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { crowdTubeChain } from "@/lib/web3/network";

export const campaignCategoryLabelKeys: Record<ApiCampaign["category"], TranslationKey> = {
  education: "campaign.category.education",
  entertainment: "campaign.category.entertainment",
  science: "campaign.category.science",
  games: "campaign.category.games",
  other: "campaign.category.other",
};

export const campaignStatusLabelKeys: Record<ApiCampaign["status"], TranslationKey> = {
  draft: "campaign.status.draft",
  pending_onchain: "campaign.status.pending",
  published: "campaign.status.published",
  failed: "campaign.status.failed",
};

export function ApiCampaignCard({
  campaign,
  audience = "admin",
}: {
  campaign: ApiCampaign;
  audience?: "admin" | "public";
}) {
  const { t } = useLanguage();
  const isConfiguredContract = campaign.chainId === crowdTubeChain.id &&
    campaign.contractAddress?.toLowerCase() === crowdTubeCampaignsContract.address.toLowerCase();

  return (
    <article className="group relative h-full rounded-3xl border border-white/10 bg-white/[0.035] transition hover:z-20 hover:-translate-y-1 hover:border-emerald-300/40 focus-within:z-30">
      <Link href={audience === "admin" ? `/admin/campaigns/${campaign.id}` : `/campaigns/${campaign.id}`}
        className="block h-full overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
        <div className="relative flex h-40 items-end bg-[linear-gradient(145deg,#27272a,#111827)] p-5">
          {campaign.imageObjectKey ? <CampaignImage objectKey={campaign.imageObjectKey} alt={t("common.campaignCover", { title: campaign.title })} /> : null}
          <span className="relative rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs text-zinc-200 backdrop-blur">
            {t(campaignCategoryLabelKeys[campaign.category])}
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
                ? t("campaign.status.otherNetwork")
                : t(campaignStatusLabelKeys[campaign.status])}
            </p>
          )}
          <span className="inline-flex text-sm font-medium text-emerald-300 transition group-hover:text-emerald-200">
            {audience === "admin" ? t("campaign.viewDetails") : t("campaign.support")}
          </span>
        </div>
      </Link>
      {audience === "admin" && <CampaignOptionsMenu campaign={campaign} />}
    </article>
  );
}
