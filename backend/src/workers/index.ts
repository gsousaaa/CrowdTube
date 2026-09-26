import { loadCampaignWorkerConfig } from "../../config/env";
import { makeTypeOrmDataSource } from "../database/typeorm-data-source";
import { startCampaignCreationWorker } from "./campaign-creation-worker";
import { startDonationNotificationWorker } from "./donation-notification-worker";

async function start(): Promise<void> {
  const config = loadCampaignWorkerConfig();
  const dataSource = makeTypeOrmDataSource(config.app);
  let campaignWorker:
    | Awaited<ReturnType<typeof startCampaignCreationWorker>>
    | undefined;
  let donationWorker:
    | Awaited<ReturnType<typeof startDonationNotificationWorker>>
    | undefined;
  let shuttingDown = false;

  const close = async (): Promise<void> => {
    await donationWorker?.close();
    await campaignWorker?.close();
    if (dataSource.isInitialized) await dataSource.destroy();
  };

  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.info({ signal }, "Shutting down CrowdTube workers");
    void close().catch((error: unknown) => {
      console.error(error, "Could not close CrowdTube workers cleanly");
      process.exitCode = 1;
    });
  };

  try {
    await dataSource.initialize();
    campaignWorker = await startCampaignCreationWorker(config, dataSource);
    donationWorker = await startDonationNotificationWorker(config, dataSource);

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

    console.info(
      { workers: ["campaign-creation", "donation-notification"] },
      "CrowdTube workers started",
    );
  } catch (error) {
    await close();
    throw error;
  }
}

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
