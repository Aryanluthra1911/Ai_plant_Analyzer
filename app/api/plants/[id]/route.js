import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function text(value, max) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to update a plant profile.' }, { status: 401 });
  const { id } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Send valid profile details.' }, { status: 400 }); }
  const name = text(body?.name, 100);
  if (!name) return NextResponse.json({ error: 'A plant name is required.' }, { status: 400 });
  try {
    const result = await prisma.plantProfile.updateMany({
      where: { id, userId: session.user.id },
      data: { name, species: text(body.species, 120), category: text(body.category, 60), location: text(body.location, 120), notes: text(body.notes, 2000) },
    });
    if (!result.count) return NextResponse.json({ error: 'Plant profile not found.' }, { status: 404 });
    const profile = await prisma.plantProfile.findFirst({ where: { id, userId: session.user.id }, select: { id: true, name: true, species: true, category: true, location: true, notes: true } });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: 'The profile could not be updated.' }, { status: 503 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to delete a plant profile.' }, { status: 401 });
  const { id } = await params;
  const result = await prisma.plantProfile.deleteMany({ where: { id, userId: session.user.id } });
  if (!result.count) return NextResponse.json({ error: 'Plant profile not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
