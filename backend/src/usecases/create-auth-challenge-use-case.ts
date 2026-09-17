import type { AppConfig } from "../../config/env";
import { AuthNonce } from "../entities/auth-nonce";
import type { AuthNonceRepository } from "../repository/auth-nonce-repository";

export type CreateAuthChallengeInput = {
  walletAddress: string;
};

export type AuthChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

type AuthMessageConfig = Pick<
  AppConfig,
  "AUTH_DOMAIN" | "AUTH_URI" | "AUTH_CHAIN_ID" | "AUTH_NONCE_TTL_SECONDS"
>;

export class CreateAuthChallengeUseCase {
  constructor(
    private readonly authNonces: AuthNonceRepository,
    private readonly config: AuthMessageConfig,
  ) {}

  async execute(input: CreateAuthChallengeInput): Promise<AuthChallenge> {
    const authNonce = AuthNonce.create({
      walletAddress: input.walletAddress,
      purpose: "login",
      ttlSeconds: this.config.AUTH_NONCE_TTL_SECONDS,
    });

    await this.authNonces.save(authNonce);

    return {
      challengeId: authNonce.id,
      message: this.buildMessage(authNonce),
      expiresAt: authNonce.expiresAt.toISOString(),
    };
  }

  private buildMessage(authNonce: AuthNonce): string {
    return `${this.config.AUTH_DOMAIN} wants you to sign in with your Ethereum account:
${authNonce.walletAddress}

Sign in to CrowdTube.

URI: ${this.config.AUTH_URI}
Version: 1
Chain ID: ${this.config.AUTH_CHAIN_ID}
Nonce: ${authNonce.nonce}
Issued At: ${authNonce.createdAt.toISOString()}
Expiration Time: ${authNonce.expiresAt.toISOString()}`;
  }
}
