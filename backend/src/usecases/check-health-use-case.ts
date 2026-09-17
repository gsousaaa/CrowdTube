import type { DatabaseHealthGateway } from "../database/database-health-gateway";

export type HealthStatus = {
  status: "ok";
  database: "connected";
  timestamp: string;
};

export class CheckHealthUseCase {
  constructor(private readonly databaseHealth: DatabaseHealthGateway) {}

  async execute(): Promise<HealthStatus> {
    await this.databaseHealth.ping();

    return {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  }
}
