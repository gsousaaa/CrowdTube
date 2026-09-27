"use client";

import Link from "next/link";
import { type RefObject, useMemo, useRef, useState } from "react";

import { useCreatorAnalytics } from "@/hooks/use-creator-analytics";
import { formatEther } from "@/lib/web3/campaign-values";

const presets = [7, 30, 90] as const;
const minimumTimelineWidth = 620;
const timelineDayWidth = 56;
const timelineGap = 12;
const timelineHorizontalPadding = 16;

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 3v3m10-3v3M4.5 9.5h15M6.5 5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function openDatePicker(inputRef: RefObject<HTMLInputElement | null>) {
  const input = inputRef.current;
  if (!input) return;

  input.focus();
  input.showPicker?.();
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makePreset(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from: formatDateInput(from), to: formatDateInput(to) };
}

function toApiPeriod(range: { from: string; to: string }) {
  const exclusiveTo = new Date(`${range.to}T00:00:00.000Z`);
  exclusiveTo.setUTCDate(exclusiveTo.getUTCDate() + 1);
  return {
    from: `${range.from}T00:00:00.000Z`,
    to: exclusiveTo.toISOString(),
  };
}

function formatEth(value: string) {
  return `${formatEther(BigInt(value), 5)} ETH`;
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function MetricCard({
  label,
  value,
  helper,
  featured = false,
}: {
  label: string;
  value: string;
  helper: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 sm:p-6 ${
        featured
          ? "border-emerald-300/30 bg-emerald-300/[0.08]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-3 break-words text-2xl font-semibold sm:text-3xl ${featured ? "text-emerald-300" : "text-zinc-100"}`}>
        {value}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{helper}</p>
    </article>
  );
}

export function CreatorAnalyticsDashboard() {
  const [range, setRange] = useState(() => makePreset(7));
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const apiPeriod = useMemo(() => toApiPeriod(range), [range]);
  const { analytics, status, error, refresh } = useCreatorAnalytics(apiPeriod);
  const activePreset = presets.find((days) => {
    const preset = makePreset(days);
    return preset.from === range.from && preset.to === range.to;
  });
  const maximumAmount = analytics?.timeline.reduce(
    (maximum, item) => {
      const amount = BigInt(item.amountWei);
      return amount > maximum ? amount : maximum;
    },
    0n,
  ) ?? 0n;
  const timelineWidth = Math.max(
    minimumTimelineWidth,
    (analytics?.timeline.length ?? 0) * timelineDayWidth
      + Math.max((analytics?.timeline.length ?? 0) - 1, 0) * timelineGap
      + timelineHorizontalPadding,
  );

  if (status === "sign-in-required") {
    return (
      <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Autentique sua carteira</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Os relatórios são privados e mostram somente as campanhas associadas à sua conta.
          Abra o menu da carteira acima para entrar novamente.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              Período analisado
            </p>
            <h2 className="mt-2 text-xl font-semibold">Filtre suas doações</h2>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={status === "loading"}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-emerald-300/40 hover:text-emerald-200 disabled:opacity-50"
          >
            {status === "loading" ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {presets.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(makePreset(days))}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                activePreset === days
                  ? "bg-emerald-300 font-medium text-zinc-950"
                  : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="analytics-from" className="text-sm text-zinc-400">
              Data inicial
            </label>
            <div className="relative">
              <input
                ref={fromInputRef}
                id="analytics-from"
                type="date"
                value={range.from}
                max={range.to}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setRange((current) => ({
                    ...current,
                    from: event.target.value,
                  }));
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 pr-12 text-zinc-100 outline-none [color-scheme:dark] focus:border-emerald-300/50 [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <button
                type="button"
                aria-label="Abrir seletor da data inicial"
                onClick={() => openDatePicker(fromInputRef)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-zinc-400 transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300/70"
              >
                <CalendarIcon />
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="analytics-to" className="text-sm text-zinc-400">
              Data final
            </label>
            <div className="relative">
              <input
                ref={toInputRef}
                id="analytics-to"
                type="date"
                value={range.to}
                min={range.from}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setRange((current) => ({
                    ...current,
                    to: event.target.value,
                  }));
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 pr-12 text-zinc-100 outline-none [color-scheme:dark] focus:border-emerald-300/50 [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <button
                type="button"
                aria-label="Abrir seletor da data final"
                onClick={() => openDatePicker(toInputRef)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-zinc-400 transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300/70"
              >
                <CalendarIcon />
              </button>
            </div>
          </div>
        </div>
      </section>

      {status === "error" ? (
        <section className="rounded-2xl border border-red-300/20 bg-red-300/[0.05] p-5">
          <p role="alert" className="text-sm text-red-200">{error}</p>
        </section>
      ) : null}

      <section aria-busy={status === "loading"} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total arrecadado"
          value={analytics ? formatEth(analytics.summary.totalRaisedWei) : "—"}
          helper="Todas as doações confirmadas"
          featured
        />
        <MetricCard
          label="No período"
          value={analytics ? formatEth(analytics.summary.periodRaisedWei) : "—"}
          helper={`${range.from.split("-").reverse().join("/")} a ${range.to.split("-").reverse().join("/")}`}
        />
        <MetricCard
          label="Doações"
          value={analytics ? String(analytics.summary.periodDonationCount) : "—"}
          helper="Transações confirmadas no período"
        />
        <MetricCard
          label="Doação média"
          value={analytics ? formatEth(analytics.summary.periodAverageDonationWei) : "—"}
          helper="Média por transação no período"
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-7">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
            Evolução
          </p>
          <h2 className="mt-2 text-xl font-semibold">Total arrecadado</h2>
        </div>

        {analytics && analytics.timeline.length > 0 ? (
          <div
            aria-label="Gráfico de arrecadação diária. Role horizontalmente para consultar todo o período."
            className="mt-8 overflow-x-auto overscroll-x-contain pb-3"
            tabIndex={0}
          >
            <div
              className="flex h-64 items-end gap-3 border-b border-white/10 px-2"
              style={{ minWidth: timelineWidth }}
            >
              {analytics.timeline.map((item, index) => {
                const amount = BigInt(item.amountWei);
                const height = maximumAmount === 0n
                  ? 0
                  : Number((amount * 100n) / maximumAmount);
                const tooltipId = `daily-donation-summary-${item.date}`;
                const tooltipPosition = index < 2
                  ? "left-0"
                  : index >= analytics.timeline.length - 2
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2";
                return (
                  <div
                    key={item.date}
                    className="grid h-full w-14 flex-none grid-rows-[minmax(0,1fr)_auto] gap-2"
                  >
                    <div className="relative flex min-h-0 flex-col">
                      <div aria-hidden="true" className="h-25 shrink-0" />
                      <div className="relative flex min-h-0 flex-1 items-end justify-center">
                        <span
                          role="img"
                          tabIndex={0}
                          aria-describedby={tooltipId}
                          aria-label={`${formatChartDate(item.date)}: ${formatEth(item.amountWei)}, ${item.donationCount} doações`}
                          className="group/bar relative block w-7 cursor-help rounded-t-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          style={{ height: amount === 0n ? 4 : `${Math.max(height, 4)}%` }}
                        >
                          <span
                            aria-hidden="true"
                            className={`block h-full w-full rounded-t-lg transition ${
                              amount === 0n
                                ? "bg-white/10"
                                : "bg-gradient-to-t from-emerald-700 to-emerald-300 group-hover/bar:brightness-125"
                            }`}
                          />
                          <span
                            id={tooltipId}
                            role="tooltip"
                            className={`pointer-events-none absolute bottom-full z-20 mb-3 min-w-48 rounded-xl border border-white/10 bg-zinc-900/95 p-3 text-left opacity-0 shadow-2xl backdrop-blur transition duration-150 group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100 ${tooltipPosition}`}
                          >
                            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-300">
                              {formatChartDate(item.date)}
                            </span>
                            <span className="mt-2 flex items-center justify-between gap-4 text-xs text-zinc-400">
                              <span>Total arrecadado</span>
                              <strong className="font-semibold text-zinc-100">
                                {formatEth(item.amountWei)}
                              </strong>
                            </span>
                            <span className="mt-1.5 flex items-center justify-between gap-4 text-xs text-zinc-400">
                              <span>Quantidade de doações</span>
                              <strong className="font-semibold text-zinc-100">
                                {item.donationCount}
                              </strong>
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                    <time
                      className="block whitespace-nowrap pb-2 text-center text-[11px] text-zinc-500"
                      dateTime={item.date}
                    >
                      {formatChartDate(item.date)}
                    </time>
                  </div>
                );
              })}
            </div>
          </div>
        ) : status === "ready" ? (
          <p className="mt-8 rounded-2xl bg-white/[0.025] px-4 py-10 text-center text-sm text-zinc-500">
            Nenhuma doação confirmada nesse período.
          </p>
        ) : (
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-white/[0.035]" />
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
          Campanhas
        </p>
        <h2 className="mt-2 text-xl font-semibold">Arrecadação por campanha</h2>

        {analytics && analytics.campaigns.length > 0 ? (
          <div className="mt-6 space-y-3">
            {analytics.campaigns.map((campaign) => (
              <article
                key={campaign.campaignId}
                className="grid gap-4 rounded-2xl border border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(120px,auto))] sm:items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/campaigns/${campaign.campaignId}`}
                    className="font-medium text-zinc-100 transition hover:text-emerald-300"
                  >
                    {campaign.title}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">
                    Campanha #{campaign.onchainCampaignId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">No período</p>
                  <p className="mt-1 text-sm text-emerald-200">{formatEth(campaign.periodRaisedWei)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Doações</p>
                  <p className="mt-1 text-sm text-zinc-200">{campaign.periodDonationCount}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total histórico</p>
                  <p className="mt-1 text-sm text-zinc-200">{formatEth(campaign.totalRaisedWei)}</p>
                </div>
              </article>
            ))}
          </div>
        ) : status === "ready" ? (
          <p className="mt-6 text-sm text-zinc-500">
            Ainda não há arrecadação indexada para suas campanhas.
          </p>
        ) : null}
      </section>
    </div>
  );
}
