import Link from "next/link";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { CreatorBalancePanel } from "@/components/wallet/creator-balance-panel";

export default function AdminWalletPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(6,78,59,0.5),_transparent_38%),#020403] text-zinc-100">
      <div className="grid min-h-screen w-full overflow-hidden bg-black/65 backdrop-blur lg:grid-cols-[76px_1fr]">
        <AppSidebar />
        <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-7">
            <div>
              <Link
                href="/admin"
                className="text-sm text-zinc-400 transition hover:text-emerald-300"
              >
                ← Voltar para campanhas
              </Link>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Carteira do criador
              </h1>
            </div>
            <ConnectWalletButton />
          </header>

          <div className="py-8">
            <CreatorBalancePanel />
          </div>
        </main>
      </div>
    </div>
  );
}
