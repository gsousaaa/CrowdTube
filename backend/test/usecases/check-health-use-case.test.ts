import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DatabaseHealthGateway } from "../../src/database/database-health-gateway";
import { CheckHealthUseCase } from "../../src/usecases/check-health-use-case";

class DatabaseHealthGatewayStub implements DatabaseHealthGateway {
  pingWasCalled = false;

  async ping(): Promise<void> {
    this.pingWasCalled = true;
  }
}

describe("CheckHealthUseCase", () => {
  it("checks the database before reporting a healthy application", async () => {
    const databaseHealth = new DatabaseHealthGatewayStub();
    const checkHealth = new CheckHealthUseCase(databaseHealth);

    const result = await checkHealth.execute();

    assert.equal(databaseHealth.pingWasCalled, true);
    assert.equal(result.status, "ok");
    assert.equal(result.database, "connected");
    assert.equal(Number.isNaN(Date.parse(result.timestamp)), false);
  });
});
