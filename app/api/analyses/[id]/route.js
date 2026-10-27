import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { removeImage } from '@/lib/storage.mjs';
import { checkApiRateLimit } from '@/lib/api-rate-limit';

export const runtime = 'nodejs';

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to delete this analysis.' }, { status: 401 });

  const limited = await checkApiRateLimit({ request, scope: 'analysis-delete', subject: session.user.id, limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
    }
  }

  const { id } = await params;
  try {
    const analysis = await prisma.plantAnalysis.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, imageKey: true },
    });
    if (!analysis) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 });

    // Remove the private object before deleting the row so storage failures leave the report retryable.
    try {
      await removeImage(analysis.imageKey);
    } catch (error) {
      if (error?.name !== 'NoSuchKey' && error?.code !== 'ENOENT' && error?.$metadata?.httpStatusCode !== 404) {
        if (error?.code === 'STORAGE_NOT_CONFIGURED') return NextResponse.json({ error: 'Image storage is not configured on this server.' }, { status: 503 });
        return NextResponse.json({ error: 'The saved image could not be removed. Please try again.' }, { status: 503 });
      }
    }
    await prisma.plantAnalysis.delete({ where: { id: analysis.id, userId: session.user.id } });
    return NextResponse.json({ deleted: true, id: analysis.id });
  } catch {
    return NextResponse.json({ error: 'The analysis could not be deleted. Please try again.' }, { status: 503 });
  }
}
