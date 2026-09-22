import type { ReactNode } from "react";

import { AdminWalletAuthProvider } from "@/components/wallet/admin-wallet-auth-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminWalletAuthProvider>{children}</AdminWalletAuthProvider>;
}
