import type { AppConfig } from "../config/env";
import { ViemWalletSignatureVerifier } from "../common/lib/viem/viem-wallet-signature-verifier";
import { makeCheckHealthAdapter } from "./adapters/check-health-adapter";
import { makeCreateAuthChallengeAdapter } from "./adapters/auth/create-auth-challenge-adapter";
import { makeVerifyAuthChallengeAdapter } from "./adapters/auth/verify-auth-challenge-adapter";
import { NodeSessionTokenManager } from "./adapters/security/node-session-token-manager";
import { makeControllers } from "./controllers/controller-factory";
import { TypeOrmDatabaseHealthGateway } from "./database/typeorm-database-health-gateway";
import { TypeOrmAuthUnitOfWork } from "./database/typeorm-auth-unit-of-work";
import { makeTypeOrmDataSource } from "./database/typeorm-data-source";
import { AuthNonce } from "./entities/auth-nonce";
import { AuthSession } from "./entities/auth-session";
import { User } from "./entities/user";
import { UserWallet } from "./entities/user-wallet";
import { TypeOrmUserRepository } from "./repository/typeorm/typeorm-user-repository";
import { TypeOrmUserWalletRepository } from "./repository/typeorm/typeorm-user-wallet-repository";
import { TypeOrmAuthNonceRepository } from "./repository/typeorm/typeorm-auth-nonce-repository";
import { TypeOrmAuthSessionRepository } from "./repository/typeorm/typeorm-auth-session-repository";
import { CheckHealthUseCase } from "./usecases/check-health-use-case";
import { CreateAuthChallengeUseCase } from "./usecases/auth/create-auth-challenge-use-case";
import { VerifyAuthChallengeUseCase } from "./usecases/auth/verify-auth-challenge-use-case";

export function makeContainer(config: AppConfig) {
  const dataSource = makeTypeOrmDataSource(config);

  const databaseHealth = new TypeOrmDatabaseHealthGateway(dataSource);
  const authUnitOfWork = new TypeOrmAuthUnitOfWork(dataSource);
  const walletSignatureVerifier = new ViemWalletSignatureVerifier();
  const sessionTokens = new NodeSessionTokenManager();

  const repositories = {
    authNonces: new TypeOrmAuthNonceRepository(
      dataSource.getRepository(AuthNonce),
    ),
    authSessions: new TypeOrmAuthSessionRepository(
      dataSource.getRepository(AuthSession),
    ),
    users: new TypeOrmUserRepository(dataSource.getRepository(User)),
    userWallets: new TypeOrmUserWalletRepository(
      dataSource.getRepository(UserWallet),
    ),
  };

  const useCases = {
    checkHealth: new CheckHealthUseCase(databaseHealth),
    auth: {
      createAuthChallenge: new CreateAuthChallengeUseCase(
        repositories.authNonces,
        config,
      ),
      verifyAuthChallenge: new VerifyAuthChallengeUseCase(
        repositories.authNonces,
        authUnitOfWork,
        walletSignatureVerifier,
        sessionTokens,
        config,
      ),
    },
  };

  const adapters = {
    checkHealth: makeCheckHealthAdapter({
      checkHealth: useCases.checkHealth,
    }),
    auth: {
      createAuthChallenge: makeCreateAuthChallengeAdapter({
        createAuthChallenge: useCases.auth.createAuthChallenge,
      }),
      verifyAuthChallenge: makeVerifyAuthChallengeAdapter({
        verifyAuthChallenge: useCases.auth.verifyAuthChallenge,
        config,
      }),
    },
  };

  const controllers = makeControllers({ adapters });
  return {
    controllers,
    dataSource,
    repositories,
  };
}

export type AppContainer = ReturnType<typeof makeContainer>;
