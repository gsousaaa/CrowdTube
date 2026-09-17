import type { AppConfig } from "../../../config/env";
import type { AuthNonce } from "../../entities/auth-nonce";

export type AuthMessageConfig = Pick<
  AppConfig,
  "AUTH_DOMAIN" | "AUTH_URI" | "AUTH_CHAIN_ID"
>;

export function buildAuthMessage(
  authNonce: AuthNonce,
  config: AuthMessageConfig,
): string {
  return `${config.AUTH_DOMAIN} wants you to sign in with your Ethereum account:
${authNonce.walletAddress}

Sign in to CrowdTube.

URI: ${config.AUTH_URI}
Version: 1
Chain ID: ${config.AUTH_CHAIN_ID}
Nonce: ${authNonce.nonce}
Issued At: ${authNonce.createdAt.toISOString()}
Expiration Time: ${authNonce.expiresAt.toISOString()}`;
}
