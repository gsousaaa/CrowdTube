import { loadConfig } from "../config/env";
import { makeApp } from "./app";
import { makeContainer } from "./container";

async function start(): Promise<void> {
  const config = loadConfig();
  const container = makeContainer(config);

  await container.dataSource.initialize();

  const app = await makeApp(config, container);

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, "Shutting down application");
    await app.close();

    if (container.dataSource.isInitialized) {
      await container.dataSource.destroy();
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({
    host: config.HOST,
    port: config.PORT,
  });
}

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
