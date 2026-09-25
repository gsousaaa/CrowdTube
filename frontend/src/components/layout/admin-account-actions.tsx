"use client";

import { NotificationCenter } from "@/components/notification/notification-center";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

export function AdminAccountActions() {
  return (
    <div className="flex items-center gap-3">
      <NotificationCenter />
      <ConnectWalletButton />
    </div>
  );
}
