"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

import { authenticateWallet } from "@/lib/api/auth";

type AuthStatus = "disconnected" | "authenticating" | "ready" | "error";

type AuthState = {
  address: string | null;
  status: AuthStatus;
  error?: string;
};

type AdminWalletAuth = {
  status: AuthStatus;
  error?: string;
  retry: () => Promise<void>;
  clear: () => void;
  markSessionExpired: () => void;
};

const AdminWalletAuthContext = createContext<AdminWalletAuth | null>(null);

export function AdminWalletAuthProvider({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const address = account?.address.toLowerCase() ?? null;
  const accountRef = useRef(account);
  const attemptVersion = useRef(0);
  const [authState, setAuthState] = useState<AuthState>({
    address: null,
    status: "disconnected",
  });

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  const retry = useCallback(async () => {
    const currentAccount = accountRef.current;
    if (!currentAccount) return;

    const version = ++attemptVersion.current;
    const currentAddress = currentAccount.address.toLowerCase();
    setAuthState({ address: currentAddress, status: "authenticating" });

    try {
      await authenticateWallet(currentAccount);
      if (version === attemptVersion.current) {
        setAuthState({ address: currentAddress, status: "ready" });
      }
    } catch (cause) {
      if (version === attemptVersion.current) {
        setAuthState({
          address: currentAddress,
          status: "error",
          error: cause instanceof Error ? cause.message : "Não foi possível autenticar a carteira.",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!address) {
      const timer = window.setTimeout(() => {
        setAuthState({ address: null, status: "disconnected" });
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => { void retry(); }, 0);
    return () => {
      window.clearTimeout(timer);
      attemptVersion.current += 1;
    };
  }, [address, retry]);

  const clear = useCallback(() => {
    attemptVersion.current += 1;
    setAuthState({ address: null, status: "disconnected" });
  }, []);

  const markSessionExpired = useCallback(() => {
    if (!address) return;
    attemptVersion.current += 1;
    setAuthState({
      address,
      status: "error",
      error: "Sua sessão expirou. Autentique a carteira novamente no menu acima.",
    });
  }, [address]);

  const state = !address
    ? { status: "disconnected" as const, error: undefined }
    : authState.address === address
      ? authState
      : { status: "authenticating" as const, error: undefined };

  return (
    <AdminWalletAuthContext.Provider value={{
      status: state.status,
      error: state.error,
      retry,
      clear,
      markSessionExpired,
    }}>
      {children}
    </AdminWalletAuthContext.Provider>
  );
}

export function useAdminWalletAuth() {
  const context = useContext(AdminWalletAuthContext);
  if (!context) throw new Error("AdminWalletAuthProvider não está disponível.");
  return context;
}

export function useOptionalAdminWalletAuth() {
  return useContext(AdminWalletAuthContext);
}
