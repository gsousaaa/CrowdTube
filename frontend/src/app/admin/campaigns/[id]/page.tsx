import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignPublicLink } from "@/components/campaign/campaign-public-link";
import { CampaignContractStatus } from "@/components/contract/campaign-contract-status";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { campaigns, findCampaignById } from "@/data/campaigns";

type AdminCampaignDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return campaigns.map((campaign) => ({ id: campaign.id }));
}

export default async function AdminCampaignDetailsPage({
  params,
}: AdminCampaignDetailsPageProps) {
  const { id } = await params;
  const campaign = findCampaignById(id);

  if (!campaign) notFound();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(6,78,59,0.5),_transparent_38%),#020403] text-zinc-100">
      <div className="grid min-h-screen w-full overflow-hidden bg-black/65 backdrop-blur lg:grid-cols-[76px_1fr]">
        <AppSidebar />
        <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-7">
            <Link href="/admin" className="text-sm text-zinc-400 transition hover:text-emerald-300">← Voltar para campanhas</Link>
            <ConnectWalletButton />
          </header>
          <article className="py-8">
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">{campaign.category}</span>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{campaign.title}</h1>
                <p className="mt-4 max-w-3xl leading-7 text-zinc-400">{campaign.description} Nesta fase, esse conteúdo ainda é demonstrativo e será fornecido pelo backend futuramente.</p>
              </div>

              <aside aria-label="Imagem da campanha">
                <div className="flex h-40 items-end rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.3),_transparent_42%),linear-gradient(145deg,_#27272a,_#111827)] p-4">
                  <p className="text-xs leading-5 text-zinc-300">
                    Imagem da campanha será carregada pelo backend/S3
                  </p>
                </div>
              </aside>
            </div>

            <div className="mt-8 space-y-5">
              <CampaignPublicLink
                campaignId={campaign.id}
                goal={campaign.goal}
                remaining={campaign.remaining}
              />
              {campaign.hasLocalContract ? (
                <CampaignContractStatus campaignId={campaign.id} />
              ) : (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Contrato</p>
                  <h2 className="mt-1 font-medium">Ainda não implantado</h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">Esta campanha demonstrativa ainda não possui dados financeiros on-chain.</p>
                </section>
              )}
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
