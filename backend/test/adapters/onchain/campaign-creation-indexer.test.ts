import assert from "node:assert/strict";
import { it } from "node:test";
import type { DataSource, EntityManager } from "typeorm";

import { CampaignCreationIndexer } from "../../../src/adapters/onchain/campaign-creation-indexer";
import { Campaign } from "../../../src/entities/campaign";
import { UserWallet } from "../../../src/entities/user-wallet";
import type { CampaignCreationEventReader } from "../../../src/usecases/campaign/campaign-creation-event-reader";

it("advances a durable cursor across multiple bounded confirmed batches", async () => {
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
    getRepository: () => ({ find: () => Promise.resolve([]) }),
    transaction: (operation: (manager: EntityManager) => Promise<unknown>) =>
      operation({ query, getRepository: () => ({}) } as unknown as EntityManager),
  } as unknown as DataSource;
  const reader: CampaignCreationEventReader = {
    getChainId: () => Promise.resolve(31_337),
    getBlockNumber: () => Promise.resolve(13n),
    hasContract: () => Promise.resolve(true),
    getTransactionReceipt: () => Promise.resolve(null),
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
    maxHistoricalBatchesPerRun: 2,
  };
  const logger = { info: () => {}, warn: () => {}, error: () => {} };
  const indexer = new CampaignCreationIndexer(dataSource, reader, config, logger);

  await indexer.syncOnce();
  assert.equal(cursor, 10n);
  await indexer.syncOnce();
  assert.equal(cursor, 12n);

  const restarted = new CampaignCreationIndexer(dataSource, reader, config, logger);
  await restarted.syncOnce();

  assert.deepEqual(ranges, [
    [5n, 7n],
    [8n, 10n],
    [11n, 12n],
  ]);
  assert.equal(cursor, 12n);
});

it("prioritizes a recent confirmed window while the historical cursor is behind", async () => {
  let cursor = 4n;
  const ranges: Array<[bigint, bigint]> = [];
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
  const dataSource = {
    query,
    getRepository: () => ({ find: () => Promise.resolve([]) }),
    transaction: (operation: (manager: EntityManager) => Promise<unknown>) =>
      operation({ query, getRepository: () => ({}) } as unknown as EntityManager),
  } as unknown as DataSource;
  const reader: CampaignCreationEventReader = {
    getChainId: () => Promise.resolve(31_337),
    getBlockNumber: () => Promise.resolve(100n),
    hasContract: () => Promise.resolve(true),
    getTransactionReceipt: () => Promise.resolve(null),
    getCreatedEvents: (fromBlock, toBlock) => {
      ranges.push([fromBlock, toBlock]);
      return Promise.resolve([]);
    },
  };
  const indexer = new CampaignCreationIndexer(
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
  assert.equal(cursor, 14n);
});

it("publishes a pending campaign from its confirmed transaction receipt", async () => {
  const contractAddress = "0x0000000000000000000000000000000000000001";
  const creatorAddress = "0x0000000000000000000000000000000000000002";
  const transactionHash = `0x${"a".repeat(64)}`;
  const metadataId = `0x${"b".repeat(64)}`;
  let cursor = 4n;
  const scannedRanges: Array<[bigint, bigint]> = [];
  const campaign = {
    id: "campaign-id",
    creatorId: "creator-id",
    metadataId,
    chainId: 31_337,
    contractAddress,
    onchainCampaignId: null,
    creationTransactionHash: transactionHash,
    status: "pending_onchain",
  } as Campaign;
  const wallet = {
    userId: campaign.creatorId,
    walletAddress: creatorAddress,
  } as UserWallet;

  const campaignRepository = {
    find: () => Promise.resolve([campaign]),
    findOneBy: () => Promise.resolve(campaign),
    save: (entity: Campaign) => Promise.resolve(entity),
  };
  const walletRepository = {
    findOneBy: () => Promise.resolve(wallet),
  };
  const getRepository = (entity: unknown) => {
    if (entity === Campaign) return campaignRepository;
    if (entity === UserWallet) return walletRepository;
    throw new Error("Unexpected repository");
  };
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
  const dataSource = {
    query,
    getRepository,
    transaction: (operation: (manager: EntityManager) => Promise<unknown>) =>
      operation({ query, getRepository } as unknown as EntityManager),
  } as unknown as DataSource;
  const receiptRequests: string[] = [];
  const reader: CampaignCreationEventReader = {
    getChainId: () => Promise.resolve(31_337),
    getBlockNumber: () => Promise.resolve(100n),
    hasContract: () => Promise.resolve(true),
    getTransactionReceipt: (hash) => {
      receiptRequests.push(hash);
      return Promise.resolve({
        blockNumber: 90n,
        status: "success",
        events: [{
          chainId: 31_337,
          contractAddress,
          campaignId: "42",
          creator: creatorAddress,
          metadataId,
          transactionHash,
        }],
      });
    },
    getCreatedEvents: (fromBlock, toBlock) => {
      scannedRanges.push([fromBlock, toBlock]);
      return Promise.resolve([]);
    },
  };
  const logger = { info: () => {}, warn: () => {} };
  const indexer = new CampaignCreationIndexer(
    dataSource,
    reader,
    {
      chainId: 31_337,
      contractAddress,
      deployBlock: 5n,
      confirmations: 2,
      batchSize: 3n,
      maxHistoricalBatchesPerRun: 1,
    },
    logger,
  );

  await indexer.syncOnce();

  assert.deepEqual(receiptRequests, [transactionHash]);
  assert.equal(campaign.status, "published");
  assert.equal(campaign.onchainCampaignId, "42");
  assert.deepEqual(scannedRanges, [[97n, 99n], [5n, 7n]]);
  assert.equal(cursor, 7n);
});

it("waits for the configured confirmations before applying a transaction receipt", async () => {
  const contractAddress = "0x0000000000000000000000000000000000000001";
  const transactionHash = `0x${"a".repeat(64)}`;
  const metadataId = `0x${"b".repeat(64)}`;
  const campaign = {
    metadataId,
    chainId: 31_337,
    contractAddress,
    creationTransactionHash: transactionHash,
    status: "pending_onchain",
  } as Campaign;
  let cursor = 99n;
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
  let transactionCount = 0;
  const dataSource = {
    query,
    getRepository: () => ({ find: () => Promise.resolve([campaign]) }),
    transaction: (operation: (manager: EntityManager) => Promise<unknown>) => {
      transactionCount += 1;
      return operation({ query, getRepository: () => ({}) } as unknown as EntityManager);
    },
  } as unknown as DataSource;
  const reader: CampaignCreationEventReader = {
    getChainId: () => Promise.resolve(31_337),
    getBlockNumber: () => Promise.resolve(100n),
    hasContract: () => Promise.resolve(true),
    getTransactionReceipt: () => Promise.resolve({
      blockNumber: 100n,
      status: "success",
      events: [],
    }),
    getCreatedEvents: () => Promise.resolve([]),
  };
  const indexer = new CampaignCreationIndexer(
    dataSource,
    reader,
    {
      chainId: 31_337,
      contractAddress,
      deployBlock: 5n,
      confirmations: 2,
    },
    { info: () => {}, warn: () => {} },
  );

  await indexer.syncOnce();

  assert.equal(campaign.status, "pending_onchain");
  assert.equal(transactionCount, 0);
});
