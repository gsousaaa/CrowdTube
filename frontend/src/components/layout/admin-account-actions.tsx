"use client";

import { NotificationCenter } from "@/components/notification/notification-center";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { LanguageSelector } from "@/components/layout/language-selector";

export function AdminAccountActions() {
  return (
    <div className="flex items-center gap-3">
      <LanguageSelector />
      <NotificationCenter />
      <ConnectWalletButton />
    </div>
  );
}
