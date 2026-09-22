import type { Account } from "thirdweb/wallets";

import { ApiError, apiRequest } from "./client";
import { crowdTubeChain } from "@/lib/web3/network";

export type CurrentUser = {
  id: string;
  authenticatedWalletAddress: string;
};

export function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest("/auth/me");
}

export function logoutSession(): Promise<void> {
  return apiRequest("/auth/logout", {
    method: "POST",
    signal: AbortSignal.timeout(3_000),
  });
}

export async function authenticateWallet(account: Account): Promise<CurrentUser> {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser.authenticatedWalletAddress.toLowerCase() === account.address.toLowerCase()) {
      return currentUser;
    }
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }

  const challenge = await apiRequest<{ challengeId: string; message: string }>(
    "/auth/challenge",
    { method: "POST", body: JSON.stringify({ walletAddress: account.address }) },
  );
  const challengeChainId = challenge.message.match(/^Chain ID: (\d+)$/m)?.[1];
  if (Number(challengeChainId) !== crowdTubeChain.id) {
    throw new Error("A rede de autenticação da API não corresponde à rede configurada no frontend.");
  }
  const signature = await account.signMessage({ message: challenge.message });
  await apiRequest("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId: challenge.challengeId, signature }),
  });

  const user = await getCurrentUser();
  if (user.authenticatedWalletAddress.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error("A sessão criada não corresponde à carteira conectada.");
  }
  return user;
}
