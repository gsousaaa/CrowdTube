import assert from "node:assert/strict";
import { it } from "node:test";
import type { DataSource, EntityManager } from "typeorm";

import { DonationNotificationIndexer } from "../../../src/adapters/onchain/donation-notification-indexer";
import type { DonationEventReader } from "../../../src/usecases/notification/donation-event-reader";

it("uses an independent durable cursor for donation notifications", async () => {
  let cursor: bigint | undefined;
  const ranges: Array<[bigint, bigint]> = [];
  const streams = new Set<string>();
  const query = (sql: string, params: unknown[] = []) => {
    if (params[2]) streams.add(String(params[2]));
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
  const queryBuilder = {
    where() { return this; },
    orderBy() { return this; },
    addOrderBy() { return this; },
    take() { return this; },
    getMany: () => Promise.resolve([]),
  };
  const dataSource = {
    query,
    transaction: (operation: (manager: EntityManager) => Promise<unknown>) =>
      operation({
        query,
        getRepository: () => ({ createQueryBuilder: () => queryBuilder }),
      } as unknown as EntityManager),
  } as unknown as DataSource;
  const reader: DonationEventReader = {
    getChainId: () => Promise.resolve(31_337),
    getBlockNumber: () => Promise.resolve(10n),
    hasContract: () => Promise.resolve(true),
    getDonationEvents: (fromBlock, toBlock) => {
      ranges.push([fromBlock, toBlock]);
      return Promise.resolve([]);
    },
  };
  const indexer = new DonationNotificationIndexer(
    dataSource,
    reader,
    {
      chainId: 31_337,
      contractAddress: "0x0000000000000000000000000000000000000001",
      deployBlock: 5n,
      confirmations: 2,
      batchSize: 3n,
      maxHistoricalBatchesPerRun: 1,
    },
    { info: () => {}, warn: () => {} },
  );

  await indexer.syncOnce();
  assert.equal(cursor, 7n);
  await indexer.syncOnce();

  assert.equal(cursor, 9n);
  assert.deepEqual(ranges, [[5n, 7n], [8n, 9n]]);
  assert.deepEqual([...streams], ["donation_notifications"]);
});

it("dispatches recent donations before recovering multiple historical batches", async () => {
  let cursor = 4n;
  const ranges: Array<[bigint, bigint]> = [];
  const operations: string[] = [];
  const query = (sql: string, params: unknown[] = []) => {
    if (sql.includes("INSERT INTO")) return Promise.resolve([]);
    if (sql.includes("SELECT")) {
      return Promise.resolve([{ last_processed_block: cursor.toString() }]);
    }
    if (sql.includes("UPDATE")) {
      cursor = BigInt(params[3] as string);
      return Promise.resolve([]);
    }
    throw new Error(`Unexpected query: ${sql}`);
  };
  const queryBuilder = {
    where() { return this; },
    orderBy() { return this; },
    addOrderBy() { return this; },
    take() { return this; },
    getMany: () => {
      operations.push("dispatch");
      return Promise.resolve([]);
    },
  };
  const dataSource = {
    query,
    transaction: (operation: (manager: EntityManager) => Promise<unknown>) =>
      operation({
        query,
        getRepository: () => ({ createQueryBuilder: () => queryBuilder }),
      } as unknown as EntityManager),
  } as unknown as DataSource;
  const reader: DonationEventReader = {
    getChainId: () => Promise.resolve(31_337),
    getBlockNumber: () => Promise.resolve(100n),
    hasContract: () => Promise.resolve(true),
    getDonationEvents: (fromBlock, toBlock) => {
      ranges.push([fromBlock, toBlock]);
      operations.push(`read:${fromBlock}-${toBlock}`);
      return Promise.resolve([]);
    },
  };
  const indexer = new DonationNotificationIndexer(
    dataSource,
    reader,
    {
      chainId: 31_337,
      contractAddress: "0x0000000000000000000000000000000000000001",
      deployBlock: 5n,
      confirmations: 2,
      batchSize: 5n,
      maxHistoricalBatchesPerRun: 2,
    },
    { info: () => {}, warn: () => {} },
  );

  await indexer.syncOnce();

  assert.deepEqual(ranges, [[95n, 99n], [5n, 9n], [10n, 14n]]);
  assert.deepEqual(operations, [
    "read:95-99",
    "dispatch",
    "read:5-9",
    "read:10-14",
    "dispatch",
  ]);
  assert.equal(cursor, 14n);
});
