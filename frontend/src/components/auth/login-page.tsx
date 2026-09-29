"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";

import { LanguageSelector } from "@/components/layout/language-selector";
import { ProfileOnboarding } from "@/components/profile/profile-onboarding";
import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useLanguage, type TranslationKey } from "@/i18n/language-provider";

const benefitKeys: Array<{
  title: TranslationKey;
  description: TranslationKey;
}> = [
  {
    title: "login.benefitOwnershipTitle",
    description: "login.benefitOwnershipDescription",
  },
  {
    title: "login.benefitTransparencyTitle",
    description: "login.benefitTransparencyDescription",
  },
  {
    title: "login.benefitCommunityTitle",
    description: "login.benefitCommunityDescription",
  },
];

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path d="M4 6.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 11h5v4h-5a2 2 0 1 1 0-4Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="13" r=".7" fill="currentColor" />
    </svg>
  );
}

export function LoginPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { t } = useLanguage();
  const { status, error, needsProfileSetup, retry } = useAdminWalletAuth();

  useEffect(() => {
    if (status === "ready" && !needsProfileSetup) {
      router.replace("/admin");
    }
  }, [needsProfileSetup, router, status]);

  const isPreparingDashboard = status === "ready" && !needsProfileSetup;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020403] text-zinc-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-52 left-[-8%] size-[520px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute right-[-12%] bottom-[-18rem] size-[620px] rounded-full bg-emerald-800/20 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex h-24 items-center justify-between border-b border-white/10">
          <Link href="/" className="text-xl font-bold tracking-tight text-emerald-300">
            CrowdTube
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {account ? <ConnectWalletButton /> : null}
          </div>
        </header>

        {status === "ready" && needsProfileSetup ? (
          <ProfileOnboarding />
        ) : (
          <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] lg:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                {t("login.eyebrow")}
              </div>
              <h1 className="mt-7 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                {t("login.title")}
                <span className="block text-emerald-300">{t("login.titleHighlight")}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                {t("login.description")}
              </p>

              <ul className="mt-10 grid gap-4 sm:grid-cols-3">
                {benefitKeys.map(({ title, description }, index) => (
                  <li key={title} className="border-l border-emerald-300/30 pl-4">
                    <p className="text-sm font-medium text-zinc-100">
                      <span className="mr-2 font-mono text-xs text-emerald-300">0{index + 1}</span>
                      {t(title)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {t(description)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mr-0">
              <div aria-hidden="true" className="absolute -inset-px rounded-[29px] bg-gradient-to-b from-emerald-300/35 via-white/10 to-transparent" />
              <div className="relative rounded-[28px] bg-zinc-950/95 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-8">
                <div className="grid size-12 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                  <WalletIcon />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  {t("login.creatorAccess")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {t("login.cardTitle")}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {t("login.cardDescription")}
                </p>

                <div className="mt-7">
                  <ConnectWalletButton connectLabel={t("login.connectWallet")} />
                </div>

                <div aria-live="polite" className="mt-5 min-h-12 border-t border-white/10 pt-4 text-sm">
                  {status === "disconnected" && (
                    <p className="text-zinc-500">{t("login.signatureHint")}</p>
                  )}
                  {status === "authenticating" && (
                    <p className="flex items-center gap-2 text-amber-200">
                      <span className="size-2 animate-pulse rounded-full bg-amber-300" />
                      {t("login.authenticating")}
                    </p>
                  )}
                  {status === "error" && (
                    <div>
                      <p role="alert" className="text-red-300">{error}</p>
                      <button
                        type="button"
                        onClick={() => void retry()}
                        className="mt-2 text-sm font-medium text-emerald-300 underline underline-offset-4"
                      >
                        {t("wallet.retryAuthentication")}
                      </button>
                    </div>
                  )}
                  {isPreparingDashboard && (
                    <p className="flex items-center gap-2 text-emerald-200">
                      <span className="size-2 animate-pulse rounded-full bg-emerald-300" />
                      {t("login.openingDashboard")}
                    </p>
                  )}
                </div>

                <Link
                  href="/campaigns"
                  className="mt-4 inline-flex text-sm text-zinc-400 transition hover:text-emerald-300"
                >
                  {t("login.exploreCampaigns")}
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
