import assert from "node:assert/strict";
import { it } from "node:test";
import type { DataSource, EntityManager } from "typeorm";

import { CampaignCreationIndexer } from "../../../src/adapters/onchain/campaign-creation-indexer";
import type { CampaignCreationEventReader } from "../../../src/usecases/campaign/campaign-creation-event-reader";

it("advances a durable cursor in bounded confirmed batches", async () => {
  let cursor: bigint | undefined;
  const ranges: Array<[bigint, bigint]> = [];
  const query = (sql: string, params: unknown[] = []) => {
    if (sql.includes("INSERT INTO")) {
      cursor ??= BigInt(params[3] as string);
      return Promise.resolve([]);
    }
    if (sql.includes("SELECT")) {
      return Promise.resolve([{ last_processed_block: cursor!.toString() }]);
    }
    if (sql.includes("UPDATE")) {
      cursor = BigInt(params[3] as string);
      return Promise.resolve([]);
    }
    throw new Error(`Unexpected query: ${sql}`);
  };
  const dataSource = {
    query,
    transaction: (operation: (manager: EntityManager) => Promise<unknown>) =>
      operation({ query, getRepository: () => ({}) } as unknown as EntityManager),
  } as unknown as DataSource;
  const reader: CampaignCreationEventReader = {
    getChainId: () => Promise.resolve(31_337),
    getBlockNumber: () => Promise.resolve(10n),
    hasContract: () => Promise.resolve(true),
    getCreatedEvents: (fromBlock, toBlock) => {
      ranges.push([fromBlock, toBlock]);
      return Promise.resolve([]);
    },
  };
  const config = {
    chainId: 31_337,
    contractAddress: "0x0000000000000000000000000000000000000001",
    deployBlock: 5n,
    confirmations: 2,
    batchSize: 3n,
  };
  const logger = { info: () => {}, warn: () => {}, error: () => {} };
  const indexer = new CampaignCreationIndexer(dataSource, reader, config, logger);

  await indexer.syncOnce();
  assert.equal(cursor, 7n);
  await indexer.syncOnce();
  assert.equal(cursor, 9n);

  const restarted = new CampaignCreationIndexer(dataSource, reader, config, logger);
  await restarted.syncOnce();

  assert.deepEqual(ranges, [[5n, 7n], [8n, 9n]]);
  assert.equal(cursor, 9n);
});
