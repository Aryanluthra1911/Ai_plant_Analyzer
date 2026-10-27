import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeRateLimit, hashRateLimitKey } from '../lib/rate-limit.mjs';

test('rate limit counters allow the configured number of requests then deny', async () => {
  let count = 0;
  const store = { apiRateLimitWindow: {
    async upsert() { count += 1; return { count }; },
    async deleteMany() { return { count: 0 }; },
  } };
  const first = await consumeRateLimit({ store, key: 'hashed-id', limit: 2, windowMs: 60_000, now: 1_000 });
  const second = await consumeRateLimit({ store, key: 'hashed-id', limit: 2, windowMs: 60_000, now: 2_000 });
  const third = await consumeRateLimit({ store, key: 'hashed-id', limit: 2, windowMs: 60_000, now: 3_000 });
  assert.equal(first.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(third.retryAfterSeconds, 57);
});

test('fixed time windows use separate atomic counters and client identifiers are hashed', async () => {
  const keys = [];
  const store = { apiRateLimitWindow: {
    async upsert(args) { keys.push(args.where.key_bucket); return { count: 1 }; },
    async deleteMany() { return { count: 0 }; },
  } };
  await consumeRateLimit({ store, key: 'client', limit: 5, windowMs: 1000, now: 999 });
  await consumeRateLimit({ store, key: 'client', limit: 5, windowMs: 1000, now: 1000 });
  assert.deepEqual(keys.map(({ bucket }) => bucket), [0, 1]);
  assert.match(hashRateLimitKey('signup', '203.0.113.10'), /^[a-f0-9]{64}$/);
  assert.notEqual(hashRateLimitKey('signup', '203.0.113.10'), '203.0.113.10');
});
