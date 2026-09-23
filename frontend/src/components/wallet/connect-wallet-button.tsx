"use client";

import { useRef, useState } from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useConnect,
  useDisconnect,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import { thirdwebClient } from "@/lib/thirdweb/client";
import { logoutSession } from "@/lib/api/auth";
import { crowdTubeChain, isHardhatNetwork } from "@/lib/web3/network";
import { useOptionalAdminWalletAuth } from "./admin-wallet-auth-provider";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const adminAuth = useOptionalAdminWalletAuth();
  const [connectionError, setConnectionError] = useState<string>();
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  async function connectWallet(walletType: "metamask" | "coinbase") {
    setConnectionError(undefined);
    setIsWalletSelectorOpen(false);
    const selectedWallet =
      walletType === "metamask"
        ? createWallet("io.metamask")
        : createWallet("com.coinbase.wallet");

    try {
      await connect(async () => {
        await selectedWallet.connect({
          client: thirdwebClient,
          chain: crowdTubeChain,
        });

        return selectedWallet;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";

      setConnectionError(
        message.includes("no accounts available")
          ? "Nenhuma conta foi liberada. Desbloqueie a extensão e autorize uma conta para este site."
          : "A conexão foi cancelada ou não pôde ser concluída.",
      );
    }
  }

  async function handleSwitchWallet() {
    await logoutSession().catch(() => undefined);
    adminAuth?.clear();
    if (activeWallet) {
      disconnect(activeWallet);
    }

    if (menuRef.current) {
      menuRef.current.open = false;
    }

    setIsWalletSelectorOpen(true);
  }

  async function handleDisconnect() {
    await logoutSession().catch(() => undefined);
    adminAuth?.clear();
    if (activeWallet) {
      disconnect(activeWallet);
    }

    if (menuRef.current) {
      menuRef.current.open = false;
    }

    setConnectionError(undefined);
  }

  if (!account || !activeWallet) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsWalletSelectorOpen((isOpen) => !isOpen)}
          disabled={isConnecting}
          className="h-[50px] min-w-[165px] rounded-xl bg-white px-4 font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isConnecting ? "Conectando..." : "Conectar carteira"}
        </button>

        {isWalletSelectorOpen ? (
          <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
            <p className="px-3 py-2 text-xs uppercase tracking-wider text-zinc-500">
              Escolha uma carteira
            </p>
            <button
              type="button"
              onClick={() => void connectWallet("metamask")}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/10"
            >
              MetaMask
            </button>
            {!isHardhatNetwork ? (
              <button
                type="button"
                onClick={() => void connectWallet("coinbase")}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Coinbase Wallet
              </button>
            ) : null}
          </div>
        ) : null}

        {connectionError ? (
          <p role="alert" className="mt-2 max-w-64 text-xs text-red-300">
            {connectionError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <details ref={menuRef} className="relative">
      <summary className="flex h-[50px] cursor-pointer list-none items-center gap-2 rounded-xl bg-white px-4 font-medium text-zinc-950 transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
        <span className={`size-2 rounded-full ${adminAuth?.status === "error" ? "bg-amber-500" : adminAuth?.status === "authenticating" ? "bg-amber-300" : "bg-emerald-500"}`} aria-hidden="true" />
        {shortenAddress(account.address)}
        {adminAuth?.status === "authenticating" && <span className="text-xs">Entrando...</span>}
      </summary>

      <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
        <p
          className="truncate px-3 py-2 font-mono text-xs text-zinc-500"
          title={account.address}
        >
          {account.address}
        </p>
        {adminAuth?.status === "error" && (
          <>
            <p role="alert" className="px-3 py-2 text-xs text-amber-200">{adminAuth.error}</p>
            <button
              type="button"
              onClick={() => void adminAuth.retry()}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-emerald-300 transition hover:bg-white/10"
            >
              Tentar autenticar novamente
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleSwitchWallet}
          disabled={isConnecting}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/10 disabled:opacity-60"
        >
          {isConnecting ? "Abrindo carteiras..." : "Trocar carteira"}
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-400/10"
        >
          Desconectar
        </button>
      </div>
    </details>
  );
}
