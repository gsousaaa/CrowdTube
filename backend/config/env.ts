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
});

export type AppConfig = z.infer<typeof envSchema>;

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
