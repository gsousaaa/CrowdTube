import { makeRedisClient } from "../redis/make-redis-client";

type WorkerLogger = {
  info: (details: object, message: string) => void;
  error: (details: unknown, message: string) => void;
};

export type RecurringWorkerOptions = {
  queueName: string;
  jobName: string;
  everyMs: number;
  redisUrl: string;
  globalConcurrency: number;
  workerConcurrency: number;
  attempts: number;
  backoffDelayMs: number;
  retainedJobCount: number;
  processJob: () => Promise<void>;
  logger: WorkerLogger;
};

export async function startRecurringWorker(options: RecurringWorkerOptions) {
  const { Queue, Worker } = await import("bullmq");
  const redis = await makeRedisClient(options.redisUrl);
  let queue: InstanceType<typeof Queue> | undefined;
  let worker: InstanceType<typeof Worker> | undefined;

  const close = async () => {
    await worker?.close();
    await queue?.close();
    await redis.quit();
  };

  try {
    queue = new Queue(options.queueName, { connection: redis });
    await queue.setGlobalConcurrency(options.globalConcurrency);
    await queue.upsertJobScheduler(
      options.jobName,
      { every: options.everyMs },
      {
        name: options.jobName,
        data: {},
        opts: {
          attempts: options.attempts,
          backoff: { type: "exponential", delay: options.backoffDelayMs },
          removeOnComplete: options.retainedJobCount,
          removeOnFail: options.retainedJobCount,
        },
      },
    );

    worker = new Worker(
      options.queueName,
      async (job) => {
        if (job.name !== options.jobName) {
          throw new Error(`Unknown job: ${job.name}`);
        }

        await options.processJob();
      },
      { connection: redis, concurrency: options.workerConcurrency },
    );

    worker.on("failed", (job, error) => {
      options.logger.error(
        { jobId: job?.id, attemptsMade: job?.attemptsMade, error },
        "Recurring worker job failed",
      );
    });
    worker.on("error", (error) => {
      options.logger.error(error, "Recurring worker error");
    });
    redis.on("error", (error: Error) => {
      options.logger.error(error, "Redis connection error");
    });

    await worker.waitUntilReady();
    options.logger.info({ queueName: options.queueName }, "Recurring worker started");

    return { close };
  } catch (error) {
    await close();
    throw error;
  }
}
