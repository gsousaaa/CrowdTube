import type { DataSource } from "typeorm";

import { AuthNonce } from "../entities/auth-nonce";
import { AuthSession } from "../entities/auth-session";
import { User } from "../entities/user";
import { UserWallet } from "../entities/user-wallet";
import { TypeOrmAuthNonceRepository } from "../repository/typeorm/typeorm-auth-nonce-repository";
import { TypeOrmAuthSessionRepository } from "../repository/typeorm/typeorm-auth-session-repository";
import { TypeOrmUserRepository } from "../repository/typeorm/typeorm-user-repository";
import { TypeOrmUserWalletRepository } from "../repository/typeorm/typeorm-user-wallet-repository";
import type {
  AuthUnitOfWork,
  AuthUnitOfWorkRepositories,
} from "../usecases/auth/auth-unit-of-work";

export class TypeOrmAuthUnitOfWork implements AuthUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<TResult>(
    operation: (
      repositories: AuthUnitOfWorkRepositories,
    ) => Promise<TResult>,
  ): Promise<TResult> {
    return this.dataSource.transaction(async (manager) =>
      operation({
        authNonces: new TypeOrmAuthNonceRepository(
          manager.getRepository(AuthNonce),
        ),
        authSessions: new TypeOrmAuthSessionRepository(
          manager.getRepository(AuthSession),
        ),
        users: new TypeOrmUserRepository(manager.getRepository(User)),
        userWallets: new TypeOrmUserWalletRepository(
          manager.getRepository(UserWallet),
        ),
      }),
    );
  }
}
