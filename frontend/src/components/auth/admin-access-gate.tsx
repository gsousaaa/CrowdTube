"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import { useLanguage } from "@/i18n/language-provider";

export function AdminAccessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { status } = useAdminWalletAuth();

  useEffect(() => {
    if (status === "disconnected" || status === "error") {
      router.replace("/");
    }
  }, [router, status]);

  if (status === "ready") return children;

  return (
    <main className="grid min-h-screen place-items-center bg-[#020403] px-6 text-center text-zinc-100">
      <div>
        <span className="mx-auto block size-9 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300" />
        <p className="mt-5 text-sm text-zinc-400">
          {status === "authenticating"
            ? t("login.validatingAccess")
            : t("login.returningToLogin")}
        </p>
      </div>
    </main>
  );
}
