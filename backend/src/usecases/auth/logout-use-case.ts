import type { AuthSessionRepository } from "../../repository/auth-session-repository";
import type { SessionTokenManager } from "./session-token-manager";

export class LogoutUseCase {
  constructor(
    private readonly authSessions: AuthSessionRepository,
    private readonly sessionTokens: SessionTokenManager,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;

    const session = await this.authSessions.findByTokenHash(
      this.sessionTokens.hash(rawToken),
    );

    if (!session || session.isRevoked()) return;

    session.revoke(this.now());
    await this.authSessions.save(session);
  }
}
