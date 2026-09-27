"use client";

import Link from "next/link";
import { useState } from "react";

import { useLanguage } from "@/i18n/language-provider";

type CampaignPublicLinkProps = {
  campaignId: string;
};

export function CampaignPublicLink({ campaignId }: CampaignPublicLinkProps) {
  const { t } = useLanguage();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const publicPath = `/campaigns/${campaignId}`;

  async function copyPublicLink() {
    try {
      const publicUrl = new URL(publicPath, window.location.origin).toString();
      await navigator.clipboard.writeText(publicUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section
      aria-labelledby="public-link-heading"
      className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-6 sm:p-8"
    >
      <div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
            {t("campaign.publicPage")}
          </p>
          <h2 id="public-link-heading" className="mt-1 text-xl font-semibold">
            {t("campaign.publicLinkTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {t("campaign.publicLinkDescription")}
          </p>
        </div>

      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          aria-label={t("campaign.publicPathLabel")}
          value={publicPath}
          readOnly
          className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 font-mono text-sm text-zinc-300 outline-none"
        />
        <button
          type="button"
          onClick={copyPublicLink}
          aria-label={t("campaign.copyPublicLink")}
          title={t("campaign.copyPublicLink")}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 text-zinc-300 transition hover:border-emerald-300/40 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
        <Link
          href={publicPath}
          target="_blank"
          rel="noreferrer"
          aria-label={t("campaign.openPublicNewTab")}
          title={t("campaign.openPublicPage")}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 text-zinc-300 transition hover:border-emerald-300/40 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
            <path d="M14 5h5v5M19 5l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-zinc-500">
        {copyStatus === "copied" ? t("campaign.linkCopied") : null}
        {copyStatus === "error" ? t("campaign.linkCopyError") : null}
      </p>
    </section>
  );
}
