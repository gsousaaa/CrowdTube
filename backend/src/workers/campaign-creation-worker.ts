import type { DataSource } from "typeorm";

import { startRecurringWorker } from "../../common/lib/bullmq/start-recurring-worker";
import { ViemCampaignCreationEventReader } from "../../common/lib/viem/viem-campaign-creation-event-reader";
import type { CampaignWorkerConfig } from "../../config/env";
import { CampaignCreationIndexer } from "../adapters/onchain/campaign-creation-indexer";

export function startCampaignCreationWorker(
  config: CampaignWorkerConfig,
  dataSource: DataSource,
) {
  const indexer = new CampaignCreationIndexer(
    dataSource,
    new ViemCampaignCreationEventReader(
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
    },
    console,
  );

  const queueName =
    `crowdtube-campaign-created-${config.chainId}-${config.contractAddress.slice(2).toLowerCase()}`;
  return startRecurringWorker({
    queueName,
    jobName: "sync-campaign-created",
    everyMs: config.app.CAMPAIGN_INDEXER_POLL_MS,
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
