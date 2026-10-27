import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateRegistration } from '@/lib/validation.mjs';
import { checkApiRateLimit, requestClientKey } from '@/lib/api-rate-limit';

export const runtime = 'nodejs';

export async function POST(request) {
  const limited = await checkApiRateLimit({ request, scope: 'signup', subject: requestClientKey(request), limit: 5, windowMs: 60 * 60_000 });
  if (limited) return limited;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a valid JSON request.' }, { status: 400 });
  }

  const valid = validateRegistration(body);
  if (valid.error) return NextResponse.json({ error: valid.error }, { status: 400 });
  const { name, email, password } = valid;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash }, select: { id: true, name: true, email: true, createdAt: true } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    return NextResponse.json({ error: 'Account creation is temporarily unavailable.' }, { status: 503 });
  }
}
