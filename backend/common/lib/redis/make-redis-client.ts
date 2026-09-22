export async function makeRedisClient(redisUrl: string) {
  const { Redis } = await import("ioredis");

  return new Redis(redisUrl, { maxRetriesPerRequest: null });
}
