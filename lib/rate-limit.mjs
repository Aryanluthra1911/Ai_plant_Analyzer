import { createHash } from 'node:crypto';

export function hashRateLimitKey(scope, subject) {
  return createHash('sha256').update(`${scope}:${subject}`).digest('hex');
}

export async function consumeRateLimit({ store, key, limit, windowMs, now = Date.now() }) {
  const bucket = Math.floor(now / windowMs);
  const result = await store.apiRateLimitWindow.upsert({
    where: { key_bucket: { key, bucket } },
    create: { key, bucket, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  // Keep at most two days of buckets for this hashed client identifier.
  const bucketsPerDay = Math.max(1, Math.floor(24 * 60 * 60_000 / windowMs));
  if (bucket % bucketsPerDay === 0) {
    const retainedBuckets = Math.ceil(48 * 60 * 60_000 / windowMs);
    await store.apiRateLimitWindow.deleteMany({ where: { key, bucket: { lt: bucket - retainedBuckets } } });
  }

  return {
    allowed: result.count <= limit,
    limit,
    remaining: Math.max(0, limit - result.count),
    retryAfterSeconds: Math.max(1, Math.ceil(((bucket + 1) * windowMs - now) / 1000)),
  };
}
