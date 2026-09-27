import type { DataSource, EntityManager } from "typeorm";

import { Campaign } from "../../entities/campaign";
import { DonationEvent } from "../../entities/donation-event";
import { Notification } from "../../entities/notification";
import { TypeOrmCampaignRepository } from "../../repository/typeorm/typeorm-campaign-repository";
import { TypeOrmDonationEventRepository } from "../../repository/typeorm/typeorm-donation-event-repository";
import { TypeOrmNotificationRepository } from "../../repository/typeorm/typeorm-notification-repository";
import { DispatchDonationNotificationsUseCase } from "../../usecases/notification/dispatch-donation-notifications-use-case";
import type { DonationEventReader } from "../../usecases/notification/donation-event-reader";
import { RecordDonationEventsUseCase } from "../../usecases/notification/record-donation-events-use-case";

const streamName = "donation_notifications";
type SyncStateRow = { last_processed_block: string };

export type DonationNotificationIndexerConfig = {
  chainId: number;
  contractAddress: string;
  deployBlock: bigint;
  confirmations: number;
  batchSize?: bigint;
  dispatchBatchSize?: number;
};

type IndexerLogger = {
  info: (details: object, message: string) => void;
  warn: (details: object, message: string) => void;
};

export class DonationNotificationIndexer {
  constructor(
    private readonly dataSource: DataSource,
    private readonly reader: DonationEventReader,
    private readonly config: DonationNotificationIndexerConfig,
    private readonly logger: IndexerLogger,
  ) {}

  async syncOnce(): Promise<void> {
    await this.validateChain();

    const contractAddress = this.config.contractAddress.toLowerCase();
    const cursor = await this.getOrCreateCursor(contractAddress);
    const head = await this.reader.getBlockNumber();
    const safeHead = head - BigInt(this.config.confirmations - 1);

    if (head < cursor) {
      throw new Error(
        "Donation notification cursor is ahead of the chain. Was the local node restarted?",
      );
    }

    if (safeHead > cursor) {
      await this.ingestNextBatch(contractAddress, cursor, safeHead);
    }

    await this.dispatchPendingEvents();
  }

  private async validateChain(): Promise<void> {
    const actualChainId = await this.reader.getChainId();
    if (actualChainId !== this.config.chainId) {
      throw new Error(
        `Donation worker RPC is on chain ${actualChainId}, expected ${this.config.chainId}.`,
      );
    }
    if (!(await this.reader.hasContract())) {
      throw new Error(
        "Donation worker contract has no bytecode at the configured address.",
      );
    }
  }

  private async getOrCreateCursor(contractAddress: string): Promise<bigint> {
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

    return BigInt(rows[0]!.last_processed_block);
  }

  private async ingestNextBatch(
    contractAddress: string,
    cursor: bigint,
    safeHead: bigint,
  ): Promise<void> {
    const fromBlock = cursor + 1n;
    const batchSize = this.config.batchSize ?? 500n;
    const toBlock = fromBlock + batchSize - 1n < safeHead
      ? fromBlock + batchSize - 1n
      : safeHead;
    const events = await this.reader.getDonationEvents(fromBlock, toBlock);

    const processed = await this.dataSource.transaction(async (manager) => {
      const currentRows = (await manager.query(
        `SELECT "last_processed_block" FROM "chain_sync_state"
         WHERE "chain_id" = $1 AND "contract_address" = $2 AND "stream_name" = $3
         FOR UPDATE`,
        [this.config.chainId, contractAddress, streamName],
      )) as SyncStateRow[];
      if (BigInt(currentRows[0]!.last_processed_block) !== cursor) return false;

      const donationEvents = new TypeOrmDonationEventRepository(
        manager.getRepository(DonationEvent),
      );
      await new RecordDonationEventsUseCase(donationEvents).execute(events);
      await manager.query(
        `UPDATE "chain_sync_state" SET "last_processed_block" = $4
         WHERE "chain_id" = $1 AND "contract_address" = $2 AND "stream_name" = $3`,
        [this.config.chainId, contractAddress, streamName, toBlock.toString()],
      );
      return true;
    });

    if (processed) {
      this.logger.info(
        {
          fromBlock: fromBlock.toString(),
          toBlock: toBlock.toString(),
          events: events.length,
        },
        "Donation events synchronized",
      );
    }
  }

  private async dispatchPendingEvents(): Promise<void> {
    const result = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        const useCase = new DispatchDonationNotificationsUseCase(
          new TypeOrmDonationEventRepository(
            manager.getRepository(DonationEvent),
          ),
          new TypeOrmCampaignRepository(manager.getRepository(Campaign)),
          new TypeOrmNotificationRepository(
            manager.getRepository(Notification),
          ),
        );
        return useCase.execute(this.config.dispatchBatchSize ?? 100);
      },
    );

    if (result.processed > 0) {
      this.logger.info(
        { processed: result.processed },
        "Donation notifications created",
      );
    }
    if (result.pending > 0) {
      this.logger.warn(
        { pending: result.pending },
        "Donation events are waiting for matching campaigns",
      );
    }
  }
}
