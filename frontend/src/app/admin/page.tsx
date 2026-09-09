import { CampaignCard } from "@/components/campaign/campaign-card";
import { CreateCampaignModal } from "@/components/campaign/create-campaign-modal";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { campaigns } from "@/data/campaigns";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(6,78,59,0.5),_transparent_38%),#020403] text-zinc-100">
      <div className="grid min-h-screen w-full overflow-hidden bg-black/65 backdrop-blur lg:grid-cols-[76px_1fr]">
        <AppSidebar />
        <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-300">CrowdTube Admin</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Painel de campanhas</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CreateCampaignModal />
              <ConnectWalletButton />
            </div>
          </header>
          <div className="py-7"><WalletStatus /></div>
          <section aria-labelledby="campaigns-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Dados demonstrativos</p>
                <h2 id="campaigns-heading" className="mt-2 text-xl font-semibold">Suas campanhas</h2>
              </div>
              <label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">Buscar campanhas</span>
                <input type="search" placeholder="Buscar campanhas" className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10" />
                <span aria-hidden="true" className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500">⌕</span>
              </label>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
            </div>
            <nav aria-label="Paginação das campanhas" className="mt-8 flex items-center justify-center gap-4 text-sm text-zinc-400">
              <button type="button" disabled className="disabled:opacity-30">Anterior</button>
              <span>Página 1 de 1</span>
              <button type="button" disabled className="disabled:opacity-30">Próxima</button>
            </nav>
          </section>
        </main>
      </div>
    </div>
  );
}
