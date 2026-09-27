"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { campaignCategoryLabels, campaignStatusLabels } from "@/components/campaign/api-campaign-card";
import { CampaignFinancialSummary } from "@/components/campaign/campaign-financial-summary";
import { CampaignImage } from "@/components/campaign/campaign-image";
import { CampaignPublicLink } from "@/components/campaign/campaign-public-link";
import { CampaignStatusControl } from "@/components/campaign/campaign-status-control";
import { CampaignWithdrawalForm } from "@/components/campaign/campaign-withdrawal-form";
import { AdminAccountActions } from "@/components/layout/admin-account-actions";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAdminCampaigns } from "@/hooks/use-admin-campaigns";
import { crowdTubeCampaignsContract } from "@/lib/web3/crowdtube-campaigns-contract";
import { crowdTubeChain } from "@/lib/web3/network";

export default function AdminCampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { campaigns, status, error } = useAdminCampaigns();
  const campaign = campaigns.find((item) => item.id === id);

  if (status === "loading") {
    return <main className="grid min-h-screen place-items-center bg-[#020403] text-zinc-400">Carregando campanha...</main>;
  }
  if (status === "ready" && !campaign) notFound();

  const isConfiguredContract = campaign?.chainId === crowdTubeChain.id &&
    campaign.contractAddress?.toLowerCase() === crowdTubeCampaignsContract.address.toLowerCase();
  const onchainId = campaign?.status === "published" && isConfiguredContract
    ? campaign.onchainCampaignId
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(6,78,59,0.5),_transparent_38%),#020403] text-zinc-100">
      <div className="grid min-h-screen w-full overflow-hidden bg-black/65 backdrop-blur lg:grid-cols-[76px_1fr]">
        <AppSidebar />
        <main className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-7">
            <Link href="/admin" className="text-sm text-zinc-400 transition hover:text-emerald-300">← Voltar para campanhas</Link>
            <AdminAccountActions />
          </header>
          {!campaign ? (
            <section className="py-8 text-zinc-300">
              {status === "disconnected" && <p>Conecte sua carteira para ver a campanha.</p>}
              {status === "sign-in-required" && (
                <>
                  <p>Abra o menu da carteira acima para autenticar novamente ou trocar de carteira.</p>
                  {error && <p role="alert" className="mt-2 text-amber-200">{error}</p>}
                </>
              )}
              {status === "error" && <p role="alert" className="text-red-300">{error}</p>}
            </section>
          ) : (
            <article className="py-7 sm:py-8">
              <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">{campaignCategoryLabels[campaign.category]}</span>
                  <h1 className="mt-5 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-4xl">{campaign.title}</h1>
                  <p className="mt-4 max-w-3xl break-words leading-7 text-zinc-400 [overflow-wrap:anywhere]">{campaign.description}</p>
                  <a href={campaign.youtubeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-emerald-300 hover:text-emerald-200">Abrir conteúdo no YouTube ↗</a>
                  {onchainId && <CampaignFinancialSummary campaignId={onchainId} />}
                </div>
                <aside aria-label="Imagem da campanha" className="min-w-0 w-full">
                  <div className="relative flex aspect-video w-full items-end overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#27272a,#111827)] p-4 lg:aspect-auto lg:h-40">
                    <CampaignImage objectKey={campaign.imageObjectKey} alt={`Capa de ${campaign.title}`} />
                  </div>
                </aside>
              </div>

              <div className="mt-8 space-y-5">
                {onchainId ? (
                  <>
                    <CampaignPublicLink campaignId={campaign.id} />
                    <CampaignStatusControl campaignId={onchainId} />
                    <CampaignWithdrawalForm campaignId={onchainId} />
                  </>
                ) : (
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="font-medium">{campaignStatusLabels[campaign.status]}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {campaign.status === "published"
                        ? "Esta campanha foi criada em outra rede ou contrato. Ajuste a configuração do frontend para consultar os dados on-chain."
                        : "A página pública e as operações financeiras estarão disponíveis depois que o indexador publicar a campanha."}
                    </p>
                    {campaign.creationTransactionHash && <p className="mt-3 break-all font-mono text-xs text-zinc-500">Transação: {campaign.creationTransactionHash}</p>}
                  </section>
                )}
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
