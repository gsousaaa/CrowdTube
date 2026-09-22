"use client";

import { useState } from "react";

import { ApiCampaignCard } from "@/components/campaign/api-campaign-card";
import { useAdminCampaigns } from "@/hooks/use-admin-campaigns";

function normalizeSearchText(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ").trim().toLocaleLowerCase("pt-BR");
}

export function AdminCampaignList() {
  const { campaigns, status, error } = useAdminCampaigns();
  const [search, setSearch] = useState("");
  const normalizedSearch = normalizeSearchText(search);
  const visibleCampaigns = campaigns.filter((campaign) =>
    !normalizedSearch || [campaign.title, campaign.description, campaign.category]
      .some((field) => normalizeSearchText(field).includes(normalizedSearch)),
  );

  return (
    <section aria-labelledby="campaigns-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="campaigns-heading" className="mt-2 text-xl font-semibold">Suas campanhas</h2>
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Buscar campanhas</span>
          <input type="search" placeholder="Buscar campanhas" value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10" />
          <span aria-hidden="true" className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500">⌕</span>
        </label>
      </div>

      {status === "loading" && <p className="mt-6 text-zinc-400">Carregando campanhas...</p>}
      {status === "disconnected" && <p className="mt-6 text-zinc-400">Conecte sua carteira para acessar suas campanhas.</p>}
      {status === "sign-in-required" && (
        <div className="mt-6 rounded-2xl border border-white/10 p-5">
          <p className="text-zinc-300">Não foi possível entrar no painel. Abra o menu da carteira acima para tentar novamente ou trocar de carteira.</p>
          {error && <p role="alert" className="mt-2 text-sm text-amber-200">{error}</p>}
        </div>
      )}
      {status === "error" && <p role="alert" className="mt-6 text-red-300">{error ?? "Ocorreu um erro ao buscar as campanhas."}</p>}

      {status === "ready" && (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCampaigns.map((campaign) => <ApiCampaignCard key={campaign.id} campaign={campaign} />)}
          </div>
          {visibleCampaigns.length === 0 && (
            <p className="mt-6 rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-zinc-400">
              {search ? "Nenhuma campanha corresponde à busca." : "Você ainda não criou campanhas."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
