import type { AppConfig } from "../../../config/env";
import { AuthNonce } from "../../entities/auth-nonce";
import type { AuthNonceRepository } from "../../repository/auth-nonce-repository";
import { buildAuthMessage, type AuthMessageConfig } from "./build-auth-message";

export type CreateAuthChallengeInput = {
  walletAddress: string;
};

export type AuthChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

type CreateAuthChallengeConfig = AuthMessageConfig &
  Pick<AppConfig, "AUTH_NONCE_TTL_SECONDS">;

export class CreateAuthChallengeUseCase {
  constructor(
    private readonly authNonces: AuthNonceRepository,
    private readonly config: CreateAuthChallengeConfig,
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
      message: buildAuthMessage(authNonce, this.config),
      expiresAt: authNonce.expiresAt.toISOString(),
    };
  }
}
