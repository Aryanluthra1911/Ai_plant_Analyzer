import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePlantImage } from '../lib/gemini.mjs';

const sampleReport = {
  summary: 'A cautious visual assessment.',
  imageAssessment: { status: 'suitable', notes: 'The image is clear enough to inspect.' },
  plantIdentification: { commonName: 'Unknown plant', scientificName: 'Not identified', confidence: 'unknown' },
  possibleDiseases: [], nutrientDeficiencies: [], potentialPests: [], treatment: [], prevention: [],
  care: { watering: 'Check soil moisture.', sunlight: 'Observe current light.', soil: 'Use a well-draining mix.', temperature: 'Avoid extremes.', fertilizer: 'Follow label directions.' },
  additionalInformationNeeded: [], uncertainty: 'A photo cannot show growing conditions.', disclaimer: 'Not a guaranteed diagnosis.',
};

async function withGeminiConfig(callback) {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'unit-test-key';
  process.env.GEMINI_MODEL = 'gemini-test-model';
  try { return await callback(); }
  finally {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = oldModel;
  }
}

test('Gemini service sends image bytes to its server endpoint and validates JSON', async (t) => {
  await withGeminiConfig(async () => {
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      assert.match(String(url), /models\/gemini-test-model:generateContent$/);
      assert.equal(options.headers['x-goog-api-key'], 'unit-test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      assert.equal(body.contents[0].parts[0].inlineData.data, Buffer.from([1, 2, 3]).toString('base64'));
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(sampleReport) }] } }] }), { status: 200 });
    });
    const response = await analyzePlantImage({ bytes: Buffer.from([1, 2, 3]), mimeType: 'image/png' });
    assert.equal(response.report.imageAssessment.status, 'suitable');
    assert.equal(response.report.disclaimer, 'This is a preliminary image-based suggestion, not a guaranteed diagnosis or a substitute for local expert advice.');
  });
});

test('Gemini rate limits return a retryable service error', async (t) => {
  await withGeminiConfig(async () => {
    t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED' } }), { status: 429 }));
    await assert.rejects(analyzePlantImage({ bytes: Buffer.from([1]), mimeType: 'image/png' }), (error) => error.code === 'GEMINI_RATE_LIMITED' && error.status === 429);
  });
});

test('Gemini request timeouts return a clear 504 service error', async (t) => {
  await withGeminiConfig(async () => {
    t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Timed out', 'TimeoutError'); });
    await assert.rejects(analyzePlantImage({ bytes: Buffer.from([1]), mimeType: 'image/png' }), (error) => error.code === 'GEMINI_TIMEOUT' && error.status === 504);
  });
});
