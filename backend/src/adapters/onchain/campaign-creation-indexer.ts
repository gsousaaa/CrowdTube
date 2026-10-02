import { IsNull, Not, type DataSource, type EntityManager } from "typeorm";

import { Campaign } from "../../entities/campaign";
import { UserWallet } from "../../entities/user-wallet";
import { TypeOrmCampaignRepository } from "../../repository/typeorm/typeorm-campaign-repository";
import { TypeOrmUserWalletRepository } from "../../repository/typeorm/typeorm-user-wallet-repository";
import {
  ApplyCampaignCreatedEventUseCase,
  type ApplyCampaignCreatedResult,
  type CampaignCreatedEvent,
} from "../../usecases/campaign/apply-campaign-created-event-use-case";
import type { CampaignCreationEventReader } from "../../usecases/campaign/campaign-creation-event-reader";

type SyncStateRow = { last_processed_block: string };
const streamName = "campaign_creation";

export type CampaignIndexerConfig = {
  chainId: number;
  contractAddress: string;
  deployBlock: bigint;
  confirmations: number;
  batchSize?: bigint;
  receiptBatchSize?: number;
  maxHistoricalBatchesPerRun?: number;
};

type IndexerLogger = {
  info: (details: object, message: string) => void;
  warn: (details: object, message: string) => void;
};

export class CampaignCreationIndexer {
  constructor(
    private readonly dataSource: DataSource,
    private readonly reader: CampaignCreationEventReader,
    private readonly config: CampaignIndexerConfig,
    private readonly logger: IndexerLogger,
  ) {}

  async syncOnce(): Promise<void> {
    const actualChainId = await this.reader.getChainId();
    if (actualChainId !== this.config.chainId) {
      throw new Error(
        `Campaign indexer RPC is on chain ${actualChainId}, expected ${this.config.chainId}.`,
      );
    }

    if (!(await this.reader.hasContract())) {
      throw new Error("Campaign indexer contract has no bytecode at the configured address.");
    }

    const contractAddress = this.config.contractAddress.toLowerCase();
    const initialCursor = this.config.deployBlock - 1n;
    await this.dataSource.query(
      `INSERT INTO "chain_sync_state"
         ("chain_id", "contract_address", "stream_name", "last_processed_block")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("chain_id", "contract_address", "stream_name") DO NOTHING`,
      [
        this.config.chainId,
        contractAddress,
        streamName,
        initialCursor.toString(),
      ],
    );

    const rows = (await this.dataSource.query(
      `SELECT "last_processed_block" FROM "chain_sync_state"
       WHERE "chain_id" = $1 AND "contract_address" = $2 AND "stream_name" = $3`,
      [this.config.chainId, contractAddress, streamName],
    )) as SyncStateRow[];
    const cursor = BigInt(rows[0]!.last_processed_block);
    const head = await this.reader.getBlockNumber();
    const safeHead = head - BigInt(this.config.confirmations - 1);

    if (head < cursor) {
      throw new Error(
        "Campaign indexer cursor is ahead of the chain. Was the local node restarted?",
      );
    }

    await this.processPendingTransactions(contractAddress, safeHead);

    if (safeHead <= cursor) return;

    const batchSize = this.config.batchSize ?? 500n;
    const maxHistoricalBatches =
      this.config.maxHistoricalBatchesPerRun ?? 10;
    await this.processRecentWindow(
      cursor,
      safeHead,
      batchSize,
      maxHistoricalBatches,
    );
    await this.processHistoricalBatches(
      contractAddress,
      cursor,
      safeHead,
      batchSize,
      maxHistoricalBatches,
    );
  }

  private async processRecentWindow(
    cursor: bigint,
    safeHead: bigint,
    windowSize: bigint,
    maxHistoricalBatches: number,
  ): Promise<void> {
    const candidateFromBlock = safeHead - windowSize + 1n;
    const fromBlock = candidateFromBlock > this.config.deployBlock
      ? candidateFromBlock
      : this.config.deployBlock;
    const historicalCapacity = windowSize * BigInt(maxHistoricalBatches);

    // Skip the additional RPC call when the historical loop can reach or
    // overlap the recent window during this same execution.
    if (cursor + historicalCapacity >= fromBlock) return;

    const events = await this.reader.getCreatedEvents(fromBlock, safeHead);
    await this.dataSource.transaction((manager) =>
      this.applyEvents(manager, events),
    );

    if (events.length > 0) {
      this.logger.info(
        {
          fromBlock: fromBlock.toString(),
          toBlock: safeHead.toString(),
          events: events.length,
        },
        "Recent campaign creation events synchronized",
      );
    }
  }

  private async processHistoricalBatches(
    contractAddress: string,
    initialCursor: bigint,
    safeHead: bigint,
    batchSize: bigint,
    maxBatches: number,
  ): Promise<void> {
    let cursor = initialCursor;
    let processedBatches = 0;
    let processedEvents = 0;

    while (cursor < safeHead && processedBatches < maxBatches) {
      const result = await this.processHistoricalBatch(
        contractAddress,
        cursor,
        safeHead,
        batchSize,
      );
      if (!result) break;

      cursor = result.toBlock;
      processedEvents += result.events;
      processedBatches += 1;
    }

    if (processedBatches > 0) {
      this.logger.info(
        {
          fromBlock: (initialCursor + 1n).toString(),
          toBlock: cursor.toString(),
          batches: processedBatches,
          events: processedEvents,
        },
        "Historical campaign creation events synchronized",
      );
    }
  }

  private async processHistoricalBatch(
    contractAddress: string,
    cursor: bigint,
    safeHead: bigint,
    batchSize: bigint,
  ): Promise<{ toBlock: bigint; events: number } | null> {
    const fromBlock = cursor + 1n;
    const toBlock = fromBlock + batchSize - 1n < safeHead
      ? fromBlock + batchSize - 1n
      : safeHead;
    const events = await this.reader.getCreatedEvents(fromBlock, toBlock);

    const processed = await this.dataSource.transaction(async (manager) => {
      const currentRows = (await manager.query(
        `SELECT "last_processed_block" FROM "chain_sync_state"
         WHERE "chain_id" = $1 AND "contract_address" = $2 AND "stream_name" = $3
         FOR UPDATE`,
        [this.config.chainId, contractAddress, streamName],
      )) as SyncStateRow[];

      // Another worker may have processed this batch while the RPC request ran.
      if (BigInt(currentRows[0]!.last_processed_block) !== cursor) return false;

      await this.applyEvents(manager, events);
      await manager.query(
        `UPDATE "chain_sync_state" SET "last_processed_block" = $4
         WHERE "chain_id" = $1 AND "contract_address" = $2 AND "stream_name" = $3`,
        [this.config.chainId, contractAddress, streamName, toBlock.toString()],
      );
      return true;
    });

    return processed ? { toBlock, events: events.length } : null;
  }

  private async processPendingTransactions(
    contractAddress: string,
    safeHead: bigint,
  ): Promise<void> {
    const pendingCampaigns = await this.dataSource.getRepository(Campaign).find({
      select: {
        metadataId: true,
        creationTransactionHash: true,
      },
      where: {
        status: "pending_onchain",
        chainId: this.config.chainId,
        contractAddress,
        creationTransactionHash: Not(IsNull()),
      },
      order: { updatedAt: "DESC" },
      take: this.config.receiptBatchSize ?? 50,
    });

    for (const campaign of pendingCampaigns) {
      const transactionHash = campaign.creationTransactionHash;
      if (!transactionHash) continue;

      const receipt = await this.reader
        .getTransactionReceipt(transactionHash)
        .catch((error: unknown) => {
          this.logger.warn(
            { error, metadataId: campaign.metadataId, transactionHash },
            "Could not read campaign creation transaction receipt",
          );
          return null;
        });
      if (!receipt || receipt.blockNumber > safeHead) continue;

      if (receipt.status === "reverted") {
        this.logger.warn(
          { metadataId: campaign.metadataId, transactionHash },
          "Campaign creation transaction was reverted",
        );
        continue;
      }

      const matchingEvents = receipt.events.filter(
        (event) =>
          event.metadataId.toLowerCase() === campaign.metadataId.toLowerCase() &&
          event.transactionHash.toLowerCase() === transactionHash.toLowerCase(),
      );

      if (matchingEvents.length !== 1) {
        this.logger.warn(
          {
            metadataId: campaign.metadataId,
            transactionHash,
            matchingEventCount: matchingEvents.length,
          },
          "Campaign creation receipt did not contain exactly one matching event",
        );
        continue;
      }

      await this.dataSource.transaction((manager) =>
        this.applyEvents(manager, matchingEvents),
      );
      this.logger.info(
        {
          metadataId: campaign.metadataId,
          transactionHash,
          blockNumber: receipt.blockNumber.toString(),
        },
        "Campaign creation transaction synchronized by receipt",
      );
    }
  }

  private async applyEvents(
    manager: EntityManager,
    events: CampaignCreatedEvent[],
  ): Promise<void> {
    const applyEvent = new ApplyCampaignCreatedEventUseCase(
      new TypeOrmCampaignRepository(manager.getRepository(Campaign)),
      new TypeOrmUserWalletRepository(manager.getRepository(UserWallet)),
    );

    for (const event of events) {
      const result: ApplyCampaignCreatedResult = await applyEvent.execute(event);
      if (result.status === "unmatched" || result.status === "creator_mismatch" || result.status === "conflict") {
        this.logger.warn(
          { metadataId: event.metadataId, transactionHash: event.transactionHash, reason: result.status },
          "Campaign creation event was not associated with a draft",
        );
      }
    }
  }
}
