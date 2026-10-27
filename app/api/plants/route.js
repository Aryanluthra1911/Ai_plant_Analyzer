import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function text(value, max) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to view plant profiles.' }, { status: 401 });
  const profiles = await prisma.plantProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, species: true, category: true, location: true, _count: { select: { analyses: true } } },
  });
  return NextResponse.json({ profiles });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to create a plant profile.' }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Send valid profile details.' }, { status: 400 }); }
  const name = text(body?.name, 100);
  if (!name) return NextResponse.json({ error: 'A plant name is required.' }, { status: 400 });
  try {
    const profile = await prisma.plantProfile.create({
      data: { userId: session.user.id, name, species: text(body.species, 120), category: text(body.category, 60), location: text(body.location, 120), notes: text(body.notes, 2000) },
      select: { id: true, name: true, species: true, category: true, location: true, notes: true, createdAt: true },
    });
    return NextResponse.json({ profile }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'The profile could not be saved.' }, { status: 503 });
  }
}
