import { getContract } from "thirdweb";

import { thirdwebClient } from "@/lib/thirdweb/client";
import { crowdTubeCampaignsAbi } from "@/lib/web3/crowdtube-campaigns-abi";
import { hardhatLocalChain } from "@/lib/web3/hardhat-chain";

const crowdTubeCampaignsAddress =
  process.env.NEXT_PUBLIC_CROWDTUBE_CAMPAIGNS_ADDRESS;

if (!crowdTubeCampaignsAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error(
    "A variavel NEXT_PUBLIC_CROWDTUBE_CAMPAIGNS_ADDRESS deve conter um endereco Ethereum valido.",
  );
}

export const crowdTubeCampaignsContract = getContract({
  client: thirdwebClient,
  chain: hardhatLocalChain,
  address: crowdTubeCampaignsAddress,
  abi: crowdTubeCampaignsAbi,
});
