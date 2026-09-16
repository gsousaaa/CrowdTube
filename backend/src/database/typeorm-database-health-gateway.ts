import type { DataSource } from "typeorm";

import type { DatabaseHealthGateway } from "./database-health-gateway";

export class TypeOrmDatabaseHealthGateway implements DatabaseHealthGateway {
  constructor(private readonly dataSource: DataSource) {}

  async ping(): Promise<void> {
    await this.dataSource.query("SELECT 1");
  }
}
