"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { campaignCategoryLabels } from "@/components/campaign/api-campaign-card";
import { CampaignImage } from "@/components/campaign/campaign-image";
import { DonationForm } from "@/components/campaign/donation-form";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { getPublicCampaign, type ApiCampaign } from "@/lib/api/campaigns";
import { ApiError } from "@/lib/api/client";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { crowdTubeChain } from "@/lib/web3/network";

export default function PublicCampaignPage() {
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
    return <main className="grid min-h-screen place-items-center bg-[#020403] text-zinc-400">Carregando campanha...</main>;
  }
  if (status === "not-found") notFound();
  if (status === "error" || !campaign) {
    return <main role="alert" className="grid min-h-screen place-items-center bg-[#020403] text-red-300">Não foi possível carregar esta campanha. Tente novamente mais tarde.</main>;
  }

  const isConfiguredContract = campaign.chainId === crowdTubeChain.id &&
    campaign.contractAddress?.toLowerCase() === crowdTubeCampaignsContract.address.toLowerCase();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,78,59,0.45),_transparent_35%),#020403] px-4 py-8 text-zinc-100 sm:px-8 lg:py-12">
      <div className="mx-auto min-w-0 max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/campaigns" className="text-xl font-bold text-emerald-300">CrowdTube</Link>
          <ConnectWalletButton />
        </header>
        <article className="py-7 sm:py-10">
          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">{campaignCategoryLabels[campaign.category]}</span>
              <h1 className="mt-5 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">{campaign.title}</h1>
              <p className="mt-4 max-w-3xl break-words text-base leading-7 text-zinc-400 [overflow-wrap:anywhere] sm:mt-5 sm:text-lg sm:leading-8">{campaign.description}</p>
              <a href={campaign.youtubeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-emerald-300 hover:text-emerald-200">Assistir no YouTube ↗</a>
            </div>
            <aside aria-label="Imagem da campanha" className="min-w-0 w-full">
              <div className="relative flex aspect-video w-full items-end overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#27272a,#111827)] p-4 lg:aspect-auto lg:h-40">
                <CampaignImage objectKey={campaign.imageObjectKey} alt={`Capa de ${campaign.title}`} />
              </div>
            </aside>
          </div>

          <div className="mt-8 space-y-5">
            {isConfiguredContract && campaign.onchainCampaignId ? (
              <DonationForm campaignId={campaign.onchainCampaignId} />
            ) : (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-medium">Doações indisponíveis nesta configuração</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">A campanha foi publicada em outra rede ou contrato. Selecione a configuração correspondente para doar.</p>
              </section>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
