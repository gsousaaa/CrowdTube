"use client";

import { useRef, useState } from "react";
import { sepolia } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useConnectModal,
  useDisconnect,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import { thirdwebClient } from "@/lib/thirdweb/client";
import { hardhatLocalChain } from "@/lib/web3/hardhat-chain";

const metamaskWallet = createWallet("io.metamask");
const coinbaseWallet = createWallet("com.coinbase.wallet");

type ConnectWalletButtonProps = {
  network?: "sepolia" | "hardhat";
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton({
  network = "sepolia",
}: ConnectWalletButtonProps) {
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [connectionError, setConnectionError] = useState<string>();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const selectedChain = network === "hardhat" ? hardhatLocalChain : sepolia;
  const supportedWallets =
    network === "hardhat"
      ? [metamaskWallet]
      : [metamaskWallet, coinbaseWallet];

  async function openWalletSelector() {
    setConnectionError(undefined);

    try {
      await connect({
        client: thirdwebClient,
        chain: selectedChain,
        wallets: supportedWallets,
        showAllWallets: false,
        size: "compact",
        title: "Conecte sua carteira ao CrowdTube",
      });
    } catch {
      setConnectionError(
        "A conexão foi cancelada ou não pôde ser concluída.",
      );
    }
  }

  async function handleSwitchWallet() {
    if (activeWallet) {
      disconnect(activeWallet);
    }

    if (menuRef.current) {
      menuRef.current.open = false;
    }

    await openWalletSelector();
  }

  function handleDisconnect() {
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
      <div>
        <button
          type="button"
          onClick={openWalletSelector}
          disabled={isConnecting}
          className="h-[50px] min-w-[165px] rounded-xl bg-white px-4 font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isConnecting ? "Conectando..." : "Conectar carteira"}
        </button>
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
        <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
        {shortenAddress(account.address)}
      </summary>

      <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
        <p
          className="truncate px-3 py-2 font-mono text-xs text-zinc-500"
          title={account.address}
        >
          {account.address}
        </p>
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
