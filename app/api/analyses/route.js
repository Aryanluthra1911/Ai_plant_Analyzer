import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getStorageConfig, readImage, removeImage, storeImage } from '@/lib/storage.mjs';
import { detectImageMime } from '@/lib/validation.mjs';
import { analyzePlantImage, GeminiServiceError, getGeminiConfig } from '@/lib/gemini.mjs';
import { checkApiRateLimit } from '@/lib/api-rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to view your analyses.' }, { status: 401 });
  const limited = await checkApiRateLimit({ request, scope: 'analysis-list', subject: session.user.id, limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const params = new URL(request.url).searchParams;
    const requestedPage = Math.min(10_000, Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1));
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(params.get('limit') || '12', 10) || 12));
    const query = (params.get('q') || '').trim().slice(0, 100);
    const requestedStatus = params.get('status') || '';
    const status = ['completed', 'needs_better_image', 'uploaded'].includes(requestedStatus) ? requestedStatus : '';
    const where = {
      userId: session.user.id,
      ...(status ? { status } : {}),
      ...(query ? { OR: [
        { plantName: { contains: query, mode: 'insensitive' } },
        { plantCategory: { contains: query, mode: 'insensitive' } },
        { symptomDescription: { contains: query, mode: 'insensitive' } },
      ] } : {}),
    };
    const total = await prisma.plantAnalysis.count({ where });
    const totalPages = Math.ceil(total / pageSize);
    const page = Math.min(requestedPage, Math.max(1, totalPages));
    const analyses = await prisma.plantAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, plantName: true, plantCategory: true, symptomDescription: true, imageMimeType: true, imageSize: true, status: true, createdAt: true },
    });
    return NextResponse.json({ analyses, page, pageSize, total, totalPages });
  } catch {
    return NextResponse.json({ error: 'Analysis history is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in before uploading a plant photo.' }, { status: 401 });
  const limited = await checkApiRateLimit({ request, scope: 'analysis-upload', subject: session.user.id, limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES + 256 * 1024) {
    return NextResponse.json({ error: 'Choose an image smaller than 10 MB.' }, { status: 413 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Send a valid multipart form with a plant photo.' }, { status: 400 });
  }

  const file = form.get('image');
  if (typeof File === 'undefined' || !(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Choose a plant photo to continue.' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Choose an image smaller than 10 MB.' }, { status: 413 });
  const requestedType = file.type.toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(requestedType)) return NextResponse.json({ error: 'Upload a JPG, PNG, or WEBP image.' }, { status: 415 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageMime(bytes);
  if (!detectedType || detectedType !== requestedType) return NextResponse.json({ error: 'The file contents do not match a supported image format.' }, { status: 415 });

  const requestId = randomUUID();
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[detectedType];
  const imageKey = `users/${session.user.id}/${randomUUID()}.${extension}`;
  const originalFileName = file.name.replace(/[\\/\0-\x1f]/g, '_').slice(0, 160) || `plant-photo.${extension}`;
  let imageStored = false;

  try {
    getGeminiConfig();
    getStorageConfig();
    await storeImage(imageKey, bytes, detectedType);
    imageStored = true;
    const savedObject = await readImage(imageKey);
    if (!savedObject.Body) throw new Error('Stored image could not be read.');
    const availableBytes = Buffer.from(await savedObject.Body.transformToByteArray());
    if (availableBytes.length !== bytes.length || detectImageMime(availableBytes) !== detectedType) throw new Error('Stored image failed its availability check.');
    const { report } = await analyzePlantImage({
      bytes: availableBytes,
      mimeType: detectedType,
      plantName: cleanText(form.get('plantName'), 100),
      plantCategory: cleanText(form.get('plantCategory'), 60),
      symptomDescription: cleanText(form.get('symptomDescription'), 2000),
    });
    const analysis = await prisma.plantAnalysis.create({
      data: {
        userId: session.user.id,
        plantName: cleanText(form.get('plantName'), 100),
        plantCategory: cleanText(form.get('plantCategory'), 60),
        symptomDescription: cleanText(form.get('symptomDescription'), 2000),
        imageKey,
        originalFileName,
        imageMimeType: detectedType,
        imageSize: bytes.byteLength,
        status: report.imageAssessment.status === 'suitable' ? 'completed' : 'needs_better_image',
        result: report,
      },
      select: { id: true, plantName: true, plantCategory: true, status: true, createdAt: true, result: true },
    });
    return NextResponse.json({ analysis }, { status: 201 });
  } catch (error) {
    if (imageStored) {
      try { await removeImage(imageKey); } catch { /* Keep the original failure response; the object key is unguessable. */ }
    }
    if (error instanceof GeminiServiceError) {
      const details = {
        requestId,
        code: error.code,
        ...(Number.isInteger(error.upstreamStatus) ? { upstreamStatus: error.upstreamStatus } : {}),
        ...(typeof error.networkCode === 'string' && /^[A-Z0-9_-]{1,40}$/.test(error.networkCode) ? { networkCode: error.networkCode } : {}),
      };
      console.warn('[plant-analysis] Gemini request failed', details);
      return NextResponse.json({ error: error.message, ...details }, { status: error.status });
    }
    if (error?.code === 'STORAGE_NOT_CONFIGURED') {
      console.error('[plant-analysis] storage configuration missing', { requestId });
      return NextResponse.json({ error: 'Image storage is not configured on this server.', requestId }, { status: 503 });
    }
    if (error?.name === 'NoSuchBucket' || error?.$metadata?.httpStatusCode === 403) {
      console.error('[plant-analysis] storage unavailable', { requestId, status: error?.$metadata?.httpStatusCode || 503 });
      return NextResponse.json({ error: 'Image storage is unavailable. Check the server storage configuration.', requestId }, { status: 503 });
    }
    const diagnosticCode = typeof error?.code === 'string' && /^[A-Z0-9_-]{1,40}$/.test(error.code) ? error.code : 'ANALYSIS_FAILED';
    console.error('[plant-analysis] request failed', { requestId, code: diagnosticCode });
    return NextResponse.json({ error: 'The photo could not be saved. Please try again.', code: diagnosticCode, requestId }, { status: 503 });
  }
}
