"use client";

import Link from "next/link";
import { MouseEvent, useRef } from "react";

import { useNotifications } from "@/hooks/use-notifications";
import { useLanguage } from "@/i18n/language-provider";
import { formatEther } from "@/lib/web3/campaign-values";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 21h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationCenter() {
  const { intlLocale, t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    notifications,
    unreadCount,
    status,
    error,
    isAvailable,
    load,
    markAllRead,
  } = useNotifications();

  function openNotifications() {
    dialogRef.current?.showModal();
    void markAllRead();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={openNotifications}
        disabled={!isAvailable}
        aria-label={unreadCount > 0
          ? t("notifications.unread", { count: unreadCount })
          : t("notifications.open")}
        title={isAvailable ? t("notifications.title") : t("notifications.authenticate")}
        className="relative grid size-11 place-items-center rounded-xl border border-white/15 text-zinc-300 transition hover:border-emerald-300/50 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-emerald-300 px-1.5 text-[10px] font-bold leading-5 text-zinc-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="notifications-title"
        onClick={handleBackdropClick}
        className="m-auto max-h-[80vh] w-[min(560px,calc(100%-2rem))] overflow-hidden rounded-3xl border border-white/15 bg-zinc-950 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              {t("notifications.updates")}
            </p>
            <h2 id="notifications-title" className="mt-1 text-xl font-semibold">
              {t("notifications.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("notifications.close")}
            className="grid size-10 place-items-center rounded-xl border border-white/10 text-xl text-zinc-400 transition hover:border-white/25 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5">
          {status === "loading" && (
            <p className="py-10 text-center text-sm text-zinc-400">
              {t("notifications.loading")}
            </p>
          )}

          {status === "error" && (
            <div className="rounded-2xl border border-red-300/20 bg-red-300/[0.05] p-4">
              <p role="alert" className="text-sm text-red-200">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 text-sm text-red-100 underline underline-offset-4"
              >
                {t("common.tryAgain")}
              </button>
            </div>
          )}

          {status === "ready" && notifications.length === 0 && (
            <div className="py-10 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-zinc-500">
                <BellIcon />
              </div>
              <p className="mt-4 text-sm text-zinc-300">{t("notifications.empty")}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {t("notifications.emptyDescription")}
              </p>
            </div>
          )}

          {notifications.length > 0 && (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`rounded-2xl border p-4 ${
                    notification.readAt
                      ? "border-white/10 bg-white/[0.025]"
                      : "border-emerald-300/25 bg-emerald-300/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100">
                        {t("notifications.newDonation", {
                          amount: formatEther(BigInt(notification.amountWei)),
                        })}
                      </p>
                      <p className="mt-1 break-words text-sm text-zinc-400">
                        {t("notifications.donationDetails", {
                          campaign: notification.campaignTitle,
                          donor: shortenAddress(notification.donorAddress),
                        })}
                      </p>
                    </div>
                    {!notification.readAt && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-300" />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <time className="text-zinc-500">
                      {formatDate(notification.createdAt, intlLocale)}
                    </time>
                    <Link
                      href={`/admin/campaigns/${notification.campaignId}`}
                      onClick={() => dialogRef.current?.close()}
                      className="text-emerald-300 transition hover:text-emerald-200"
                    >
                      {t("notifications.viewCampaign")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
