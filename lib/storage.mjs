import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

let cachedClient;

export function getStorageConfig() {
  const { S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT } = process.env;
  if (S3_BUCKET) {
    if (!S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
      const error = new Error('Image storage is not configured.');
      error.code = 'STORAGE_NOT_CONFIGURED';
      throw error;
    }
    return { driver: 's3', region: S3_REGION, bucket: S3_BUCKET, endpoint: S3_ENDPOINT || undefined };
  }
  if (process.env.NODE_ENV === 'development') {
    return { driver: 'local', root: path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || '.data/uploads') };
  }
  const error = new Error('Image storage is not configured.');
  error.code = 'STORAGE_NOT_CONFIGURED';
  throw error;
}

function getLocalImagePath(key) {
  const { root } = getStorageConfig();
  const parts = String(key).split('/');
  if (!key || path.isAbsolute(key) || parts.some((part) => !part || part === '.' || part === '..' || part.includes('\\') || part.includes('\0'))) {
    throw new Error('Invalid image key.');
  }
  const filePath = path.resolve(root, ...parts);
  if (!filePath.startsWith(`${root}${path.sep}`)) throw new Error('Invalid image key.');
  return filePath;
}

export function getStorageClient() {
  const config = getStorageConfig();
  if (config.driver !== 's3') throw new Error('The S3 client is unavailable when local development storage is active.');
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: Boolean(config.endpoint),
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
    });
  }
  return { client: cachedClient, bucket: config.bucket };
}

export async function storeImage(key, body, contentType) {
  const config = getStorageConfig();
  if (config.driver === 'local') {
    const filePath = getLocalImagePath(key);
    await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
    await writeFile(filePath, body, { flag: 'wx', mode: 0o600 });
    return;
  }
  const { client, bucket } = getStorageClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'private, no-store',
    ServerSideEncryption: 'AES256',
  }));
}

export async function readImage(key) {
  const config = getStorageConfig();
  if (config.driver === 'local') {
    const filePath = getLocalImagePath(key);
    const metadata = await stat(filePath);
    return {
      ContentLength: metadata.size,
      Body: {
        transformToByteArray: async () => readFile(filePath),
        transformToWebStream: () => Readable.toWeb(createReadStream(filePath)),
      },
    };
  }
  const { client, bucket } = getStorageClient();
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}

export async function removeImage(key) {
  const config = getStorageConfig();
  if (config.driver === 'local') {
    await unlink(getLocalImagePath(key));
    return;
  }
  const { client, bucket } = getStorageClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
