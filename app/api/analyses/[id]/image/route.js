import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { readImage } from '@/lib/storage.mjs';
import { checkApiRateLimit } from '@/lib/api-rate-limit';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to view this image.' }, { status: 401 });
  const limited = await checkApiRateLimit({ request, scope: 'analysis-image', subject: session.user.id, limit: 120, windowMs: 60_000 });
  if (limited) return limited;
  const { id } = await params;

  try {
    const analysis = await prisma.plantAnalysis.findFirst({ where: { id, userId: session.user.id }, select: { imageKey: true, imageMimeType: true } });
    if (!analysis) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    const object = await readImage(analysis.imageKey);
    if (!object.Body) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    const headers = {
      'Content-Type': analysis.imageMimeType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    };
    if (Number.isFinite(object.ContentLength)) headers['Content-Length'] = String(object.ContentLength);
    return new Response(object.Body.transformToWebStream(), { headers });
  } catch (error) {
    if (error?.code === 'STORAGE_NOT_CONFIGURED') return NextResponse.json({ error: 'Image storage is not configured on this server.' }, { status: 503 });
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    return NextResponse.json({ error: 'The image is temporarily unavailable.' }, { status: 503 });
  }
}
