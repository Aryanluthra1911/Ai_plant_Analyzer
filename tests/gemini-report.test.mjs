import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGeminiReport } from '../lib/gemini.mjs';

function report(overrides = {}) {
  return {
    summary: 'A preliminary visual review.',
    imageAssessment: { status: 'suitable', notes: 'The leaf is in focus.' },
    plantIdentification: { commonName: 'Unknown plant', scientificName: 'Not identifiable', confidence: 'low' },
    possibleDiseases: [], nutrientDeficiencies: [], potentialPests: [], treatment: [], prevention: [],
    care: { watering: 'Check soil first.', sunlight: 'Bright indirect light.', soil: 'Well-draining mix.', temperature: 'Avoid cold drafts.', fertilizer: 'Follow product directions.' },
    additionalInformationNeeded: [], uncertainty: 'Image evidence is limited.', disclaimer: 'This is not a guaranteed diagnosis.',
    ...overrides,
  };
}

test('report validator preserves a valid structured assessment', () => {
  const result = validateGeminiReport(report());
  assert.equal(result.imageAssessment.status, 'suitable');
  assert.equal(result.care.watering, 'Check soil first.');
});

test('unsuitable images cannot retain disease or treatment claims', () => {
  const result = validateGeminiReport(report({
    imageAssessment: { status: 'not_plant', notes: 'No plant is visible.' },
    possibleDiseases: [{ name: 'Made-up disease', likelihood: 'high', severity: 'severe', symptoms: [], visualEvidence: [], possibleCauses: [] }],
    treatment: ['Apply a fungicide.'],
  }));
  assert.deepEqual(result.possibleDiseases, []);
  assert.deepEqual(result.treatment, []);
  assert.equal(result.care.watering, 'Not assessed from this image.');
});

test('report validator rejects unsupported confidence values', () => {
  assert.throws(() => validateGeminiReport(report({ plantIdentification: { commonName: 'Plant', scientificName: 'Species', confidence: 'certain' } })), /plant-identification/);
});
