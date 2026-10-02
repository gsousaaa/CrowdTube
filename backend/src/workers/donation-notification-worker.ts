import type { DataSource } from "typeorm";

import { startRecurringWorker } from "../../common/lib/bullmq/start-recurring-worker";
import { ViemDonationEventReader } from "../../common/lib/viem/viem-donation-event-reader";
import type { CampaignWorkerConfig } from "../../config/env";
import { DonationNotificationIndexer } from "../adapters/onchain/donation-notification-indexer";

export function startDonationNotificationWorker(
  config: CampaignWorkerConfig,
  dataSource: DataSource,
) {
  const indexer = new DonationNotificationIndexer(
    dataSource,
    new ViemDonationEventReader(
      config.rpcUrl,
      config.chainId,
      config.contractAddress,
    ),
    {
      chainId: config.chainId,
      contractAddress: config.contractAddress,
      deployBlock: config.deployBlock,
      confirmations: config.app.CAMPAIGN_CONFIRMATIONS,
      batchSize: BigInt(config.app.CAMPAIGN_LOG_BATCH_SIZE),
      maxHistoricalBatchesPerRun:
        config.app.CAMPAIGN_MAX_HISTORICAL_BATCHES_PER_RUN,
    },
    console,
  );
  const queueName =
    `crowdtube-donations-${config.chainId}-${config.contractAddress.slice(2).toLowerCase()}`;
  return startRecurringWorker({
    queueName,
    jobName: "sync-donation-notifications",
    everyMs: config.app.DONATION_NOTIFICATION_POLL_MS,
    redisUrl: config.redisUrl,
    globalConcurrency: 1,
    workerConcurrency: 1,
    attempts: 3,
    backoffDelayMs: 1_000,
    retainedJobCount: 100,
    processJob: () => indexer.syncOnce(),
    logger: console,
  });
}
