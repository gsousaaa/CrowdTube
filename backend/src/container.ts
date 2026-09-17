import type { AppConfig } from "../config/env";
import { makeCheckHealthAdapter } from "./adapters/check-health-adapter";
import { makeControllers } from "./controllers/controller-factory";
import { TypeOrmDatabaseHealthGateway } from "./database/typeorm-database-health-gateway";
import { makeTypeOrmDataSource } from "./database/typeorm-data-source";
import { CheckHealthUseCase } from "./usecases/check-health-use-case";

export function makeContainer(config: AppConfig) {
  const dataSource = makeTypeOrmDataSource(config);

  const databaseHealth = new TypeOrmDatabaseHealthGateway(dataSource);

  const useCases = {
    checkHealth: new CheckHealthUseCase(databaseHealth),
  };

  const adapters = {
    checkHealth: makeCheckHealthAdapter({
      checkHealth: useCases.checkHealth,
    }),
  };

  const controllers = makeControllers({ adapters });

  return {
    controllers,
    dataSource,
  };
}

export type AppContainer = ReturnType<typeof makeContainer>;
