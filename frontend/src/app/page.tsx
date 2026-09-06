import { CampaignCard } from "@/components/campaign/campaign-card";
import { CreateCampaignModal } from "@/components/campaign/create-campaign-modal";
import { DonationVaultStatus } from "@/components/contract/donation-vault-status";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { WalletStatus } from "@/components/wallet/wallet-status";

const campaignExamples = [
  {
    category: "Educação",
    title: "Laboratório aberto de programação",
    description: "Equipamentos para uma nova série gratuita de aulas práticas.",
    raised: "0,24 ETH",
    goal: "0,50 ETH",
    remaining: "7 dias",
    wallet: "0xfa6f...49f5",
  },
  {
    category: "Vlogs",
    title: "Documentário independente",
    description: "Ajude a financiar viagem, captação e edição do próximo vídeo.",
    raised: "0,10 ETH",
    goal: "0,50 ETH",
    remaining: "20 dias",
    wallet: "0x3b21...8a10",
  },
  {
    category: "Ciência",
    title: "Ciência acessível no YouTube",
    description: "Uma temporada de experimentos explicados de forma simples.",
    raised: "0,35 ETH",
    goal: "0,80 ETH",
    remaining: "2 semanas",
    wallet: "0x89bc...11d2",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(6,78,59,0.5),_transparent_38%),#020403] px-3 py-6 text-zinc-100 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-white/15 bg-black/65 shadow-2xl shadow-emerald-950/30 backdrop-blur lg:grid-cols-[76px_1fr]">
        <AppSidebar />

        <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-300">CrowdTube</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Financiamento coletivo Web3
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CreateCampaignModal />
              <ConnectWalletButton />
            </div>
          </header>

          <div className="grid gap-4 py-7">
            <WalletStatus />
            <DonationVaultStatus />
          </div>

          <section aria-labelledby="campaigns-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Dados demonstrativos
                </p>
                <h2 id="campaigns-heading" className="mt-2 text-xl font-semibold">
                  Campanhas em destaque
                </h2>
              </div>

              <label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">Buscar campanhas</span>
                <input
                  type="search"
                  placeholder="Buscar campanhas"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500"
                >
                  ⌕
                </span>
              </label>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {campaignExamples.map((campaign) => (
                <CampaignCard key={campaign.title} {...campaign} />
              ))}
            </div>

            <nav
              aria-label="Paginação das campanhas"
              className="mt-8 flex items-center justify-center gap-4 text-sm text-zinc-400"
            >
              <button type="button" disabled className="disabled:opacity-30">
                Anterior
              </button>
              <span>Página 1 de 1</span>
              <button type="button" disabled className="disabled:opacity-30">
                Próxima
              </button>
            </nav>
          </section>
        </main>
      </div>
    </div>
  );
}
