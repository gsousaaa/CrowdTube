import Link from "next/link";
import { notFound } from "next/navigation";

import { DonationForm } from "@/components/campaign/donation-form";
import { DonationVaultStatus } from "@/components/contract/donation-vault-status";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { campaigns, findCampaignById } from "@/data/campaigns";

type PublicCampaignPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return campaigns.map((campaign) => ({ id: campaign.id }));
}

export default async function PublicCampaignPage({ params }: PublicCampaignPageProps) {
  const { id } = await params;
  const campaign = findCampaignById(id);

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
            </div>
            <aside aria-label="Imagem da campanha">
              <div className="flex h-40 items-end rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.3),_transparent_42%),linear-gradient(145deg,_#27272a,_#111827)] p-4">
                <p className="text-xs leading-5 text-zinc-300">Imagem da campanha será carregada pelo backend/S3</p>
              </div>
            </aside>
          </div>

          <div className="mt-8 space-y-5">
            {campaign.hasLocalContract ? (
              <>
                <DonationForm goal={campaign.goal} remaining={campaign.remaining} />
                <DonationVaultStatus />
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
