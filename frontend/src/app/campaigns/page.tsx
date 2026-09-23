"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiCampaignCard } from "@/components/campaign/api-campaign-card";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { searchPublicCampaigns, type PublicCampaignSearchResult } from "@/lib/api/campaigns";

export default function PublicCampaignsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PublicCampaignSearchResult>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void searchPublicCampaigns({ search, page }).then((data) => {
        if (active) { setResult(data); setStatus("ready"); }
      }).catch(() => {
        if (active) setStatus("error");
      });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, page]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,78,59,0.45),_transparent_35%),#020403] px-4 py-8 text-zinc-100 sm:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/campaigns" className="text-xl font-bold text-emerald-300">CrowdTube</Link>
          <ConnectWalletButton />
        </header>
        <div className="flex flex-col gap-5 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Apoie uma campanha</h1>
          </div>
          <label className="block w-full sm:max-w-sm">
            <span className="sr-only">Buscar campanhas</span>
            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Buscar campanhas"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/60" />
          </label>
        </div>
        {status === "loading" && <p className="text-zinc-400">Carregando campanhas...</p>}
        {status === "error" && <p role="alert" className="text-red-300">Não foi possível consultar as campanhas. Verifique a API e tente novamente.</p>}
        {status === "ready" && result && (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.campaigns.map((campaign) => <ApiCampaignCard key={campaign.id} campaign={campaign} audience="public" />)}
            </div>
            {result.campaigns.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-zinc-400">Nenhuma campanha publicada foi encontrada.</p>}
            {result.pagination.totalPages > 1 && (
              <nav aria-label="Paginação das campanhas" className="mt-8 flex items-center justify-center gap-4 text-sm">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">Anterior</button>
                <span>Página {page} de {result.pagination.totalPages}</span>
                <button type="button" disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Próxima</button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
