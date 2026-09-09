import { getContract } from "thirdweb";

import { thirdwebClient } from "@/lib/thirdweb/client";
import { donationVaultAbi } from "@/lib/web3/donation-vault-abi";
import { hardhatLocalChain } from "@/lib/web3/hardhat-chain";

const donationVaultAddress = process.env.NEXT_PUBLIC_DONATION_VAULT_ADDRESS;

if (!donationVaultAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error(
    "A variavel NEXT_PUBLIC_DONATION_VAULT_ADDRESS deve conter um endereco Ethereum valido.",
  );
}

export const donationVaultContract = getContract({
  client: thirdwebClient,
  chain: hardhatLocalChain,
  address: donationVaultAddress,
  abi: donationVaultAbi,
});
