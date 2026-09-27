"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { campaignCategoryLabelKeys } from "@/components/campaign/api-campaign-card";
import { CampaignImage } from "@/components/campaign/campaign-image";
import { DonationForm } from "@/components/campaign/donation-form";
import { LanguageSelector } from "@/components/layout/language-selector";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useLanguage } from "@/i18n/language-provider";
import { getPublicCampaign, type ApiCampaign } from "@/lib/api/campaigns";
import { ApiError } from "@/lib/api/client";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { crowdTubeChain } from "@/lib/web3/network";

export default function PublicCampaignPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<ApiCampaign>();
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");

  useEffect(() => {
    let active = true;
    void getPublicCampaign(id).then((result) => {
      if (active) { setCampaign(result); setStatus("ready"); }
    }).catch((error: unknown) => {
      if (!active) return;
      setStatus(error instanceof ApiError && error.status === 404 ? "not-found" : "error");
    });
    return () => { active = false; };
  }, [id]);

  if (status === "loading") {
    return <main className="grid min-h-screen place-items-center bg-[#020403] text-zinc-400">{t("common.loadingCampaign")}</main>;
  }
  if (status === "not-found") notFound();
  if (status === "error" || !campaign) {
    return <main role="alert" className="grid min-h-screen place-items-center bg-[#020403] text-red-300">{t("campaign.public.loadError")}</main>;
  }

  const isConfiguredContract = campaign.chainId === crowdTubeChain.id &&
    campaign.contractAddress?.toLowerCase() === crowdTubeCampaignsContract.address.toLowerCase();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,78,59,0.45),_transparent_35%),#020403] px-4 py-8 text-zinc-100 sm:px-8 lg:py-12">
      <div className="mx-auto min-w-0 max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/campaigns" className="text-xl font-bold text-emerald-300">CrowdTube</Link>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelector />
            <ConnectWalletButton />
          </div>
        </header>
        <article className="py-7 sm:py-10">
          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">{t(campaignCategoryLabelKeys[campaign.category])}</span>
              <h1 className="mt-5 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">{campaign.title}</h1>
              <p className="mt-4 max-w-3xl break-words text-base leading-7 text-zinc-400 [overflow-wrap:anywhere] sm:mt-5 sm:text-lg sm:leading-8">{campaign.description}</p>
              <a href={campaign.youtubeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-emerald-300 hover:text-emerald-200">{t("campaign.public.watchYoutube")}</a>
            </div>
            <aside aria-label={t("common.campaignImage")} className="min-w-0 w-full">
              <div className="relative flex aspect-video w-full items-end overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#27272a,#111827)] p-4 lg:aspect-auto lg:h-40">
                <CampaignImage objectKey={campaign.imageObjectKey} alt={t("common.campaignCover", { title: campaign.title })} />
              </div>
            </aside>
          </div>

          <div className="mt-8 space-y-5">
            {isConfiguredContract && campaign.onchainCampaignId ? (
              <DonationForm campaignId={campaign.onchainCampaignId} />
            ) : (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-medium">{t("campaign.public.donationsUnavailable")}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{t("campaign.public.donationsUnavailableDescription")}</p>
              </section>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
