"use client";

import dynamic from "next/dynamic";
import { sepolia } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

import { thirdwebClient } from "@/lib/thirdweb/client";
import { hardhatLocalChain } from "@/lib/web3/hardhat-chain";

const metamaskWallet = createWallet("io.metamask");
const coinbaseWallet = createWallet("com.coinbase.wallet");

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

type ConnectWalletButtonProps = {
  network?: "sepolia" | "hardhat";
};

export function ConnectWalletButton({
  network = "sepolia",
}: ConnectWalletButtonProps) {
  const selectedChain = network === "hardhat" ? hardhatLocalChain : sepolia;
  const supportedWallets =
    network === "hardhat"
      ? [metamaskWallet]
      : [metamaskWallet, coinbaseWallet];

  return (
    <ConnectButton
      client={thirdwebClient}
      chain={selectedChain}
      chains={[selectedChain]}
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
