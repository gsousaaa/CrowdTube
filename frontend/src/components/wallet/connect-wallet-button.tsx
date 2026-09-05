"use client";

import dynamic from "next/dynamic";
import { sepolia } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

import { thirdwebClient } from "@/lib/thirdweb/client";

const supportedWallets = [createWallet("io.metamask"), createWallet("com.coinbase.wallet")];

const ConnectButton = dynamic(
  () => import("thirdweb/react").then((module) => module.ConnectButton),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        disabled
        className="h-[50px] min-w-[165px] rounded-xl bg-white px-4 font-medium text-zinc-950 opacity-70"
      >
        Carregando carteira...
      </button>
    ),
  },
);

export function ConnectWalletButton() {
  return (
    <ConnectButton
      client={thirdwebClient}
      chain={sepolia}
      chains={[sepolia]}
      wallets={supportedWallets}
      showAllWallets={false}
      connectButton={{ label: "Conectar carteira" }}
      connectModal={{
        size: "compact",
        title: "Conecte sua carteira ao CrowdTube",
      }}
    />
  );
}
