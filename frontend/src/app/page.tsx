import { LoginPage } from "@/components/auth/login-page";
import { AdminWalletAuthProvider } from "@/components/wallet/admin-wallet-auth-provider";

export default function Home() {
  return (
    <AdminWalletAuthProvider>
      <LoginPage />
    </AdminWalletAuthProvider>
  );
}
