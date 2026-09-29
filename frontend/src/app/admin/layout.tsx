import type { ReactNode } from "react";

import { AdminAccessGate } from "@/components/auth/admin-access-gate";
import { AdminWalletAuthProvider } from "@/components/wallet/admin-wallet-auth-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminWalletAuthProvider>
      <AdminAccessGate>{children}</AdminAccessGate>
    </AdminWalletAuthProvider>
  );
}
