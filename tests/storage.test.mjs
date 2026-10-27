import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getStorageConfig, readImage, removeImage, storeImage } from '../lib/storage.mjs';

async function withLocalStorage(callback) {
  const original = {
    nodeEnv: process.env.NODE_ENV,
    bucket: process.env.S3_BUCKET,
    localDir: process.env.LOCAL_STORAGE_DIR,
  };
  const directory = await mkdtemp(path.join(tmpdir(), 'verdant-storage-'));
  process.env.NODE_ENV = 'development';
  process.env.S3_BUCKET = '';
  process.env.LOCAL_STORAGE_DIR = directory;
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
    if (original.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original.nodeEnv;
    if (original.bucket === undefined) delete process.env.S3_BUCKET; else process.env.S3_BUCKET = original.bucket;
    if (original.localDir === undefined) delete process.env.LOCAL_STORAGE_DIR; else process.env.LOCAL_STORAGE_DIR = original.localDir;
  }
}

test('development image storage writes, streams, reads, and removes private local files', async () => {
  await withLocalStorage(async () => {
    const bytes = Buffer.from('private development photo');
    const key = 'users/user-1/photo.png';
    assert.equal(getStorageConfig().driver, 'local');
    await storeImage(key, bytes, 'image/png');
    const image = await readImage(key);
    assert.deepEqual(Buffer.from(await image.Body.transformToByteArray()), bytes);
    assert.deepEqual(Buffer.from(await new Response(image.Body.transformToWebStream()).arrayBuffer()), bytes);
    await removeImage(key);
    await assert.rejects(readImage(key), { code: 'ENOENT' });
  });
});

test('local development storage rejects path traversal keys', async () => {
  await withLocalStorage(async () => {
    await assert.rejects(readImage('users/../outside.png'), /Invalid image key/);
  });
});

test('local image storage is never used as the production fallback', async () => {
  await withLocalStorage(async () => {
    process.env.NODE_ENV = 'production';
    assert.throws(getStorageConfig, { code: 'STORAGE_NOT_CONFIGURED' });
  });
});
