"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { DonationForm } from "@/components/campaign/donation-form";
import { CampaignContractStatus } from "@/components/contract/campaign-contract-status";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useMockCampaigns } from "@/hooks/use-mock-campaigns";

export default function PublicCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const { campaigns, isLoaded } = useMockCampaigns();
  const campaign = campaigns.find((item) => item.id === id);

  if (!isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#020403] text-zinc-400">
        Carregando campanha...
      </main>
    );
  }

  if (!campaign) notFound();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,78,59,0.45),_transparent_35%),#020403] px-4 py-8 text-zinc-100 sm:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href={`/campaigns/${campaign.id}`} className="text-xl font-bold text-emerald-300">CrowdTube</Link>
          <ConnectWalletButton network="hardhat" />
        </header>
        <article className="py-10">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">{campaign.category}</span>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">{campaign.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">{campaign.description}</p>
              {campaign.youtubeUrl ? (
                <a
                  href={campaign.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm text-emerald-300 hover:text-emerald-200"
                >
                  Assistir no YouTube ↗
                </a>
              ) : null}
            </div>
            <aside aria-label="Imagem da campanha">
              <div className="flex h-40 items-end rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.3),_transparent_42%),linear-gradient(145deg,_#27272a,_#111827)] p-4">
                <p className="text-xs leading-5 text-zinc-300">
                  {campaign.imageReference
                    ? `Imagem: ${campaign.imageReference}`
                    : "Imagem da campanha será carregada pelo backend/S3"}
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-8 space-y-5">
            {campaign.hasLocalContract ? (
              <>
                <DonationForm
                  campaignId={campaign.id}
                  goal={campaign.goal}
                  remaining={campaign.remaining}
                />
                <CampaignContractStatus campaignId={campaign.id} />
              </>
            ) : (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-medium">Doações ainda indisponíveis</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Esta campanha ainda não possui um contrato implantado.</p>
              </section>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
