"use client";

import { sepolia } from "thirdweb/chains";
import { ConnectButton } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import { thirdwebClient } from "@/lib/thirdweb/client";

const supportedWallets = [createWallet("io.metamask"), createWallet("com.coinbase.wallet")];

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
