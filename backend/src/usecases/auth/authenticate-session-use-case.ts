import type { AuthSessionRepository } from "../../repository/auth-session-repository";
import type { UserWalletRepository } from "../../repository/user-wallet-repository";
import { AppError } from "../../errors/app-error";
import type { AuthenticatedPrincipal } from "./authenticated-principal";
import type { SessionTokenManager } from "./session-token-manager";

export class AuthenticateSessionUseCase {
  constructor(
    private readonly authSessions: AuthSessionRepository,
    private readonly userWallets: UserWalletRepository,
    private readonly sessionTokens: SessionTokenManager,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(rawToken: string | undefined): Promise<AuthenticatedPrincipal> {
    if (!rawToken) this.throwUnauthenticated();

    const tokenHash = this.sessionTokens.hash(rawToken);
    const session = await this.authSessions.findByTokenHash(tokenHash);

    if (!session || !session.isActive(this.now())) {
      this.throwUnauthenticated();
    }

    const wallet = await this.userWallets.findById(session.walletId);

    if (!wallet || wallet.userId !== session.userId) {
      this.throwUnauthenticated();
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      walletId: wallet.id,
      walletAddress: wallet.walletAddress,
    };
  }

  private throwUnauthenticated(): never {
    throw new AppError(
      "A valid authentication session is required.",
      401,
      "UNAUTHENTICATED",
    );
  }
}
