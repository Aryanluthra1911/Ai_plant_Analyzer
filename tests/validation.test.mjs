import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImageMime, validateRegistration } from '../lib/validation.mjs';

test('registration trims and normalizes account details', () => {
  assert.deepEqual(validateRegistration({ name: '  Fern  ', email: '  FERN@EXAMPLE.COM ', password: 'long-password' }), {
    name: 'Fern', email: 'fern@example.com', password: 'long-password',
  });
});

test('registration rejects malformed email and short password', () => {
  assert.match(validateRegistration({ name: 'A', email: 'bad', password: 'long-password' }).error, /valid email/);
  assert.match(validateRegistration({ name: 'A', email: 'a@example.com', password: 'short' }).error, /8 and 128/);
});

test('image validation recognizes supported file signatures', () => {
  assert.equal(detectImageMime(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg');
  assert.equal(detectImageMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  assert.equal(detectImageMime(Buffer.from('RIFFxxxxWEBP')) , 'image/webp');
});

test('image validation rejects unrelated or incomplete content', () => {
  assert.equal(detectImageMime(Buffer.from('<svg></svg>')), null);
  assert.equal(detectImageMime(Buffer.from([0xff, 0xd8])), null);
});
