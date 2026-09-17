import type { AppConfig } from "../config/env";
import { makeCheckHealthAdapter } from "./adapters/check-health-adapter";
import { makeCreateAuthChallengeAdapter } from "./adapters/create-auth-challenge-adapter";
import { makeControllers } from "./controllers/controller-factory";
import { TypeOrmDatabaseHealthGateway } from "./database/typeorm-database-health-gateway";
import { makeTypeOrmDataSource } from "./database/typeorm-data-source";
import { AuthNonce } from "./entities/auth-nonce";
import { User } from "./entities/user";
import { UserWallet } from "./entities/user-wallet";
import { TypeOrmUserRepository } from "./repository/typeorm/typeorm-user-repository";
import { TypeOrmUserWalletRepository } from "./repository/typeorm/typeorm-user-wallet-repository";
import { TypeOrmAuthNonceRepository } from "./repository/typeorm/typeorm-auth-nonce-repository";
import { CheckHealthUseCase } from "./usecases/check-health-use-case";
import { CreateAuthChallengeUseCase } from "./usecases/create-auth-challenge-use-case";

export function makeContainer(config: AppConfig) {
  const dataSource = makeTypeOrmDataSource(config);

  const databaseHealth = new TypeOrmDatabaseHealthGateway(dataSource);

  const repositories = {
    authNonces: new TypeOrmAuthNonceRepository(
      dataSource.getRepository(AuthNonce),
    ),
    users: new TypeOrmUserRepository(dataSource.getRepository(User)),
    userWallets: new TypeOrmUserWalletRepository(
      dataSource.getRepository(UserWallet),
    ),
  };

  const useCases = {
    checkHealth: new CheckHealthUseCase(databaseHealth),
    createAuthChallenge: new CreateAuthChallengeUseCase(
      repositories.authNonces,
      config,
    ),
  };

  const adapters = {
    checkHealth: makeCheckHealthAdapter({
      checkHealth: useCases.checkHealth,
    }),
    createAuthChallenge: makeCreateAuthChallengeAdapter({
      createAuthChallenge: useCases.createAuthChallenge,
    }),
  };

  const controllers = makeControllers({ adapters });

  return {
    controllers,
    dataSource,
    repositories,
  };
}

export type AppContainer = ReturnType<typeof makeContainer>;
