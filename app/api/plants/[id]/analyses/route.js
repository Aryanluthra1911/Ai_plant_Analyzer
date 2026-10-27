import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to organize your analyses.' }, { status: 401 });
  const { id: profileId } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Choose an analysis to add.' }, { status: 400 }); }
  if (typeof body?.analysisId !== 'string') return NextResponse.json({ error: 'Choose an analysis to add.' }, { status: 400 });
  const [profile, analysis] = await Promise.all([
    prisma.plantProfile.findFirst({ where: { id: profileId, userId: session.user.id }, select: { id: true } }),
    prisma.plantAnalysis.findFirst({ where: { id: body.analysisId, userId: session.user.id }, select: { id: true } }),
  ]);
  if (!profile || !analysis) return NextResponse.json({ error: 'That profile or analysis could not be found.' }, { status: 404 });
  await prisma.plantAnalysis.update({ where: { id: analysis.id }, data: { plantProfileId: profile.id } });
  return NextResponse.json({ success: true });
}
