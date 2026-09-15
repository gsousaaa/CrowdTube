"use client";

import {
  useActiveAccount,
  useActiveWalletChain,
  useActiveWalletConnectionStatus,
  useWalletBalance,
} from "thirdweb/react";

import { thirdwebClient } from "@/lib/thirdweb/client";
import { crowdTubeChain, crowdTubeNetworkName } from "@/lib/web3/network";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletStatus() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const connectionStatus = useActiveWalletConnectionStatus();

  const isTargetNetwork = activeChain?.id === crowdTubeChain.id;
  const {
    data: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useWalletBalance({
    client: thirdwebClient,
    chain: crowdTubeChain,
    address: account?.address,
  });

  if (!account) {
    return (
      <section className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-left dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Carteira desconectada
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Conecte uma carteira para consultar conta, rede e saldo.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-left dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Conta</p>
          <p className="mt-1 font-mono text-sm" title={account.address}>
            {shortenAddress(account.address)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Rede</p>
          <p className="mt-1 text-sm">
            {activeChain?.name ?? "Rede desconhecida"}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Saldo em {crowdTubeNetworkName}
          </p>
          <p className="mt-1 text-sm">
            {isBalanceLoading && "Consultando..."}
            {!isBalanceLoading && balanceError && "Não foi possível consultar"}
            {!isBalanceLoading && !balanceError && balance
              ? `${Number(balance.displayValue).toFixed(4)} ${balance.symbol}`
              : null}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">
          Estado da conexão: {connectionStatus}
        </p>

        <p
          className={`text-sm font-medium ${
            isTargetNetwork
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {isTargetNetwork
            ? `Pronto para usar ${crowdTubeNetworkName}`
            : `Carteira conectada em outra rede`}
        </p>
      </div>
    </section>
  );
}
