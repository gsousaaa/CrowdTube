import { sepolia } from "thirdweb/chains";

import { hardhatLocalChain } from "@/lib/web3/hardhat-chain";

export type CrowdTubeNetwork = "hardhat" | "sepolia";

const configuredNetwork =
  process.env.NEXT_PUBLIC_WEB3_NETWORK?.toLowerCase() ?? "hardhat";

if (configuredNetwork !== "hardhat" && configuredNetwork !== "sepolia") {
  throw new Error(
    "NEXT_PUBLIC_WEB3_NETWORK deve ser 'hardhat' ou 'sepolia'.",
  );
}

export const crowdTubeNetwork = configuredNetwork as CrowdTubeNetwork;
export const crowdTubeChain =
  crowdTubeNetwork === "sepolia" ? sepolia : hardhatLocalChain;
export const crowdTubeNetworkName =
  crowdTubeNetwork === "sepolia" ? "Sepolia" : "Hardhat local";
export const isHardhatNetwork = crowdTubeNetwork === "hardhat";
