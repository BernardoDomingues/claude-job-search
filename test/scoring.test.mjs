import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decide, scoreJob, validateAxes } from '../scripts/lib/scoring.mjs';
import { AXES_MID, AXES_STRONG, AXES_WEAK, templateConfig } from './helpers.mjs';

const { scoring } = templateConfig();

describe('scoreJob', () => {
  it('computes the weighted sum with the default weights', () => {
    // 0.6*0.7 + 0.7*0.1 + 0.7*0.1 + 1*0.05 + 0.6*0.05 = 0.64
    assert.deepEqual(scoreJob(AXES_MID, scoring), { score: 0.64, decision: 'REVIEW' });
  });

  it('approves a strong match and rejects a weak one', () => {
    assert.deepEqual(scoreJob(AXES_STRONG, scoring), { score: 1, decision: 'APPROVE' });
    assert.equal(scoreJob(AXES_WEAK, scoring).decision, 'REJECT');
  });

  it('forces REJECT on a hard filter but still reports the score', () => {
    assert.deepEqual(scoreJob(AXES_STRONG, scoring, 'must reside in Berlin'), {
      score: 1,
      decision: 'REJECT',
    });
  });

  it('honors custom weights', () => {
    const custom = {
      ...scoring,
      weights: { technical: 0, salary: 1, location: 0, seniority: 0, quality: 0 },
    };
    assert.equal(scoreJob({ ...AXES_WEAK, salary: 0.9 }, custom).score, 0.9);
  });

  it('throws on invalid axes', () => {
    assert.throws(() => scoreJob({ ...AXES_MID, technical: 1.5 }, scoring), /axes\.technical/);
    assert.throws(() => scoreJob(undefined, scoring), /axes must be an object/);
  });
});

describe('decide', () => {
  const thresholds = { review: 0.5, approve: 0.75 };
  it('treats thresholds as inclusive lower bounds', () => {
    assert.equal(decide(0.75, thresholds), 'APPROVE');
    assert.equal(decide(0.749, thresholds), 'REVIEW');
    assert.equal(decide(0.5, thresholds), 'REVIEW');
    assert.equal(decide(0.499, thresholds), 'REJECT');
  });
});

describe('validateAxes', () => {
  it('flags missing and NaN axes', () => {
    const errors = validateAxes({ technical: Number.NaN });
    assert.equal(errors.length, 5);
  });
});
