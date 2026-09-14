"use client";

import { CampaignCard } from "@/components/campaign/campaign-card";
import { useMockCampaigns } from "@/hooks/use-mock-campaigns";

export function AdminCampaignList() {
  const { campaigns, isLoaded } = useMockCampaigns();

  return (
    <section aria-labelledby="campaigns-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {isLoaded ? "Dados locais do protótipo" : "Carregando dados locais"}
          </p>
          <h2 id="campaigns-heading" className="mt-2 text-xl font-semibold">
            Suas campanhas
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
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
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
  );
}
