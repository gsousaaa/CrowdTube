import type { AuthNonce } from "../../entities/auth-nonce";
import { User } from "../../entities/user";
import { UserWallet } from "../../entities/user-wallet";
import { AppError } from "../../errors/app-error";
import type { AuthNonceRepository } from "../../repository/auth-nonce-repository";
import type { AuthUnitOfWork } from "./auth-unit-of-work";
import { buildAuthMessage, type AuthMessageConfig } from "./build-auth-message";
import type { WalletSignatureVerifier } from "./wallet-signature-verifier";

export type VerifyAuthChallengeInput = {
  challengeId: string;
  signature: string;
};

export type AuthenticatedUser = {
  userId: string;
  walletAddress: string;
  isNewUser: boolean;
};

export class VerifyAuthChallengeUseCase {
  constructor(
    private readonly authNonces: AuthNonceRepository,
    private readonly transaction: AuthUnitOfWork,
    private readonly signatureVerifier: WalletSignatureVerifier,
    private readonly config: AuthMessageConfig,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: VerifyAuthChallengeInput,
  ): Promise<AuthenticatedUser> {
    const authNonce = await this.authNonces.findById(input.challengeId);
    const verificationTime = this.now();

    this.assertChallengeCanBeUsed(authNonce, verificationTime);

    const signatureIsValid = await this.signatureVerifier.verify({
      walletAddress: authNonce.walletAddress,
      message: buildAuthMessage(authNonce, this.config),
      signature: input.signature,
    });

    if (!signatureIsValid) {
      throw new AppError(
        "The wallet signature is invalid.",
        401,
        "INVALID_WALLET_SIGNATURE",
      );
    }

    return this.transaction.run(async (repositories) => {
      const lockedNonce = await repositories.authNonces.findByIdForUpdate(
        input.challengeId,
      );
      const consumptionTime = this.now();

      this.assertChallengeCanBeUsed(lockedNonce, consumptionTime);
      lockedNonce.markAsUsed(consumptionTime);
      await repositories.authNonces.save(lockedNonce);

      const existingWallet =
        await repositories.userWallets.findByWalletAddress(
          lockedNonce.walletAddress,
        );

      if (existingWallet) {
        const user = await repositories.users.findById(existingWallet.userId);

        if (!user) {
          throw new AppError(
            "The wallet owner could not be found.",
            500,
            "WALLET_OWNER_NOT_FOUND",
          );
        }

        return {
          userId: user.id,
          walletAddress: existingWallet.walletAddress,
          isNewUser: false,
        };
      }

      const user = await repositories.users.save(User.create());
      const wallet = await repositories.userWallets.save(
        UserWallet.create({
          userId: user.id,
          walletAddress: lockedNonce.walletAddress,
          isPrimary: true,
          verifiedAt: consumptionTime,
        }),
      );

      return {
        userId: user.id,
        walletAddress: wallet.walletAddress,
        isNewUser: true,
      };
    });
  }

  private assertChallengeCanBeUsed(
    authNonce: AuthNonce | null,
    now: Date,
  ): asserts authNonce is AuthNonce {
    if (!authNonce || authNonce.purpose !== "login") {
      throw new AppError(
        "The authentication challenge was not found.",
        404,
        "AUTH_CHALLENGE_NOT_FOUND",
      );
    }

    if (authNonce.isUsed()) {
      throw new AppError(
        "The authentication challenge has already been used.",
        409,
        "AUTH_CHALLENGE_ALREADY_USED",
      );
    }

    if (authNonce.isExpired(now)) {
      throw new AppError(
        "The authentication challenge has expired.",
        401,
        "AUTH_CHALLENGE_EXPIRED",
      );
    }
  }
}
