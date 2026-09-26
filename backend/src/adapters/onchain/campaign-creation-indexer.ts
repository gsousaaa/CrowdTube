import type { DataSource, EntityManager } from "typeorm";

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
    if (safeHead <= cursor) return;

    const fromBlock = cursor + 1n;
    const batchSize = this.config.batchSize ?? 500n;
    const toBlock =
      fromBlock + batchSize - 1n < safeHead
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

    if (processed) {
      this.logger.info(
        { fromBlock: fromBlock.toString(), toBlock: toBlock.toString() },
        "Campaign creation events synchronized",
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
