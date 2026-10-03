"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/i18n/language-provider";
import {
  getAdminCampaignDonations,
  getPublicCampaignDonations,
  type CampaignDonationHistory,
} from "@/lib/api/donations";
import { formatEther } from "@/lib/web3/campaign-values";
import { CONTRACT_DATA_UPDATED_EVENT } from "@/lib/web3/contract-events";

type CampaignDonationHistoryProps = {
  campaignId: string;
  admin?: boolean;
};

const pageSize = 10;

function shortenHash(value: string, startLength = 6, endLength = 4) {
  if (value.length <= startLength + endLength + 3) return value;
  return `${value.slice(0, startLength)}...${value.slice(-endLength)}`;
}

function getTransactionUrl(chainId: number, transactionHash: string) {
  if (chainId === 11_155_111) {
    return `https://sepolia.etherscan.io/tx/${transactionHash}`;
  }

  return null;
}

export function CampaignDonationHistorySection({
  campaignId,
  admin = false,
}: CampaignDonationHistoryProps) {
  const { intlLocale, t } = useLanguage();
  const [pageState, setPageState] = useState({ campaignId, page: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadState, setLoadState] = useState<{
    requestKey: string;
    status: "ready" | "error";
    history?: CampaignDonationHistory;
  }>({ requestKey: "", status: "ready" });
  const page = pageState.campaignId === campaignId ? pageState.page : 1;
  const requestKey = `${admin}:${campaignId}:${page}:${refreshKey}`;

  useEffect(() => {
    const controller = new AbortController();
    const getDonations = admin
      ? getAdminCampaignDonations
      : getPublicCampaignDonations;

    void getDonations(campaignId, {
      page,
      pageSize,
      signal: controller.signal,
    })
      .then((result) => {
        setLoadState({ requestKey, status: "ready", history: result });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadState({ requestKey, status: "error" });
      });

    return () => controller.abort();
  }, [admin, campaignId, page, refreshKey, requestKey]);

  useEffect(() => {
    function refreshHistory() {
      setRefreshKey((current) => current + 1);
    }

    window.addEventListener(CONTRACT_DATA_UPDATED_EVENT, refreshHistory);
    return () =>
      window.removeEventListener(CONTRACT_DATA_UPDATED_EVENT, refreshHistory);
  }, []);

  const isCurrentRequest = loadState.requestKey === requestKey;
  const status = isCurrentRequest ? loadState.status : "loading";
  const history = isCurrentRequest ? loadState.history : undefined;
  const totalPages = history?.pagination.totalPages ?? 0;
  const donations = history?.donations ?? [];

  return (
    <section
      aria-labelledby="campaign-donation-history-title"
      className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
            {t("donation.history.eyebrow")}
          </p>
          <h2
            id="campaign-donation-history-title"
            className="mt-2 text-lg font-semibold text-zinc-100"
          >
            {t("donation.history.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
            {t("donation.history.description")}
          </p>
        </div>
        {history && (
          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
            {history.pagination.total === 1
              ? t("donation.history.totalOne")
              : t("donation.history.total", {
                  count: history.pagination.total,
                })}
          </span>
        )}
      </div>

      {status === "loading" && (
        <p className="px-5 py-8 text-sm text-zinc-400 sm:px-6" role="status">
          {t("donation.history.loading")}
        </p>
      )}

      {status === "error" && (
        <div className="px-5 py-8 sm:px-6" role="alert">
          <p className="text-sm text-red-300">{t("donation.history.error")}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/30 hover:text-emerald-200"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {status === "ready" && donations.length === 0 && (
        <div className="px-5 py-9 sm:px-6">
          <p className="font-medium text-zinc-200">
            {t("donation.history.empty")}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {t("donation.history.emptyDescription")}
          </p>
        </div>
      )}

      {status === "ready" && donations.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium sm:px-6">
                    {t("donation.history.amount")}
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    {t("donation.history.donor")}
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    {t("donation.history.date")}
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium sm:px-6">
                    {t("donation.history.transaction")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {donations.map((donation) => {
                  const transactionUrl = getTransactionUrl(
                    donation.chainId,
                    donation.transactionHash,
                  );

                  return (
                    <tr
                      key={`${donation.transactionHash}:${donation.logIndex}`}
                      className="text-zinc-300"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-emerald-300 sm:px-6">
                        {formatEther(BigInt(donation.amountWei), 6)} ETH
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-400">
                        <span title={donation.donorAddress}>
                          {shortenHash(donation.donorAddress)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-zinc-400">
                        {new Intl.DateTimeFormat(intlLocale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(donation.occurredAt))}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        {transactionUrl ? (
                          <a
                            href={transactionUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={donation.transactionHash}
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-300 transition hover:text-emerald-200"
                          >
                            {shortenHash(donation.transactionHash)}
                            <span aria-hidden="true">↗</span>
                            <span className="sr-only">
                              {t("donation.history.viewTransaction")}
                            </span>
                          </a>
                        ) : (
                          <span
                            title={donation.transactionHash}
                            className="font-mono text-xs text-zinc-500"
                          >
                            {shortenHash(donation.transactionHash)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav
              aria-label={t("donation.history.pagination")}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-6"
            >
              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPageState({
                    campaignId,
                    page: Math.max(1, page - 1),
                  })
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-emerald-300/30 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("donation.history.previous")}
              </button>
              <span className="text-xs text-zinc-500">
                {t("donation.history.page", { page, total: totalPages })}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPageState({
                    campaignId,
                    page: Math.min(totalPages, page + 1),
                  })
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-emerald-300/30 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("donation.history.next")}
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
