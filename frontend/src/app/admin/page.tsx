import Link from "next/link";

import { AdminCampaignList } from "@/components/campaign/admin-campaign-list";
import { CreateCampaignModal } from "@/components/campaign/create-campaign-modal";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { WalletStatus } from "@/components/wallet/wallet-status";

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
          <AdminCampaignList />
        </main>
      </div>
    </div>
  );
}
