import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "test", "prd"]).default("dev"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().max(65_535).default(3333),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive().max(65_535).default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  FRONTEND_ORIGIN: z.url().default("http://localhost:3000"),
  AUTH_DOMAIN: z.string().min(1).default("localhost:3000"),
  AUTH_URI: z.url().default("http://localhost:3000"),
  AUTH_CHAIN_ID: z.coerce.number().int().positive().default(31_337),
  AUTH_NONCE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  AUTH_SESSION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7),
  AUTH_SESSION_COOKIE_NAME: z.string().min(1).default("crowdtube_session"),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET_NAME: z.string().min(1),
  AWS_S3_UPLOAD_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .max(3_600)
    .default(300),
  AWS_S3_READ_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .max(3_600)
    .default(300),
  REDIS_URL: z.url().refine(
    (value) => value.startsWith("redis://") || value.startsWith("rediss://"),
  ).optional(),
  CAMPAIGN_RPC_URL: z.url().optional(),
  CAMPAIGN_CHAIN_ID: z.coerce.number().int().positive().optional(),
  CAMPAIGN_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  CAMPAIGN_DEPLOY_BLOCK: z.coerce.bigint().nonnegative().optional(),
  CAMPAIGN_CONFIRMATIONS: z.coerce.number().int().positive().default(1),
  CAMPAIGN_INDEXER_POLL_MS: z.coerce.number().int().min(1_000).default(10_000),
  DONATION_NOTIFICATION_POLL_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .default(10_000),
});

export type AppConfig = z.infer<typeof envSchema>;

export type CampaignWorkerConfig = {
  app: AppConfig;
  redisUrl: string;
  rpcUrl: string;
  chainId: number;
  contractAddress: `0x${string}`;
  deployBlock: bigint;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(environment);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(`Invalid environment configuration: ${fields}`);
  }

  return result.data;
}

export function loadCampaignWorkerConfig(
  environment: NodeJS.ProcessEnv = process.env,
): CampaignWorkerConfig {
  const app = loadConfig(environment);
  const {
    REDIS_URL: redisUrl,
    CAMPAIGN_RPC_URL: rpcUrl,
    CAMPAIGN_CHAIN_ID: chainId,
    CAMPAIGN_CONTRACT_ADDRESS: contractAddress,
    CAMPAIGN_DEPLOY_BLOCK: deployBlock,
  } = app;

  if (!redisUrl || !rpcUrl || !chainId || !contractAddress || deployBlock === undefined) {
    throw new Error(
      "Campaign worker requires REDIS_URL, CAMPAIGN_RPC_URL, CAMPAIGN_CHAIN_ID, CAMPAIGN_CONTRACT_ADDRESS and CAMPAIGN_DEPLOY_BLOCK.",
    );
  }

  return {
    app,
    redisUrl,
    rpcUrl,
    chainId,
    contractAddress: contractAddress as `0x${string}`,
    deployBlock,
  };
}
