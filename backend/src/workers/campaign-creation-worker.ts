import { startRecurringWorker } from "../../common/lib/bullmq/start-recurring-worker";
import { ViemCampaignCreationEventReader } from "../../common/lib/viem/viem-campaign-creation-event-reader";
import { loadCampaignWorkerConfig } from "../../config/env";
import { CampaignCreationIndexer } from "../adapters/onchain/campaign-creation-indexer";
import { makeTypeOrmDataSource } from "../database/typeorm-data-source";

async function start(): Promise<void> {
  const config = loadCampaignWorkerConfig();
  const dataSource = makeTypeOrmDataSource(config.app);
  let recurringWorker: Awaited<ReturnType<typeof startRecurringWorker>> | undefined;

  const close = async () => {
    await recurringWorker?.close();
    if (dataSource.isInitialized) await dataSource.destroy();
  };

  try {
    await dataSource.initialize();

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
      },
      console,
    );

    const queueName =
      `crowdtube-campaign-created-${config.chainId}-${config.contractAddress.slice(2).toLowerCase()}`;
    recurringWorker = await startRecurringWorker({
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

    let shuttingDown = false;
    const shutdown = (signal: NodeJS.Signals) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.info({ signal }, "Shutting down campaign creation worker");
      void close().catch((error: unknown) => {
        console.error(error, "Could not close campaign creation worker cleanly");
        process.exitCode = 1;
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    await close();
    throw error;
  }
}

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
