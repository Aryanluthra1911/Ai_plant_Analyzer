import { NextResponse } from 'next/server';
import { hashRateLimitKey, consumeRateLimit } from '@/lib/rate-limit.mjs';
import { prisma } from '@/lib/prisma';

export function requestClientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = request.headers.get('x-real-ip') || forwarded || 'unknown-client';
  return hashRateLimitKey('ip', address.slice(0, 128));
}

export async function checkApiRateLimit({ request, scope, subject, limit, windowMs }) {
  try {
    const key = hashRateLimitKey(scope, subject || requestClientKey(request));
    const rate = await consumeRateLimit({ store: prisma, key, limit, windowMs });
    if (rate.allowed) return null;
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'X-RateLimit-Limit': String(rate.limit), 'X-RateLimit-Remaining': '0' } },
    );
  } catch {
    return NextResponse.json({ error: 'This service is temporarily unavailable.' }, { status: 503 });
  }
}
