import type { AuthNonceRepository } from "../../repository/auth-nonce-repository";
import type { AuthSessionRepository } from "../../repository/auth-session-repository";
import type { UserRepository } from "../../repository/user-repository";
import type { UserWalletRepository } from "../../repository/user-wallet-repository";

export type AuthUnitOfWorkRepositories = {
  authNonces: AuthNonceRepository;
  authSessions: AuthSessionRepository;
  users: UserRepository;
  userWallets: UserWalletRepository;
};

export interface AuthUnitOfWork {
  run<TResult>(
    operation: (
      repositories: AuthUnitOfWorkRepositories,
    ) => Promise<TResult>,
  ): Promise<TResult>;
}
