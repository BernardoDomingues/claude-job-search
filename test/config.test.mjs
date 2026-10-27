import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { round, validateConfig } from '../scripts/lib/config.mjs';
import { templateConfig } from './helpers.mjs';

describe('validateConfig', () => {
  it('accepts the shipped template', () => {
    assert.deepEqual(validateConfig(templateConfig()), []);
  });

  it('rejects non-objects', () => {
    assert.deepEqual(validateConfig(null), ['config must be a JSON object']);
    assert.deepEqual(validateConfig([]), ['config must be a JSON object']);
  });

  it('requires schemaVersion 1', () => {
    const config = { ...templateConfig(), schemaVersion: 2 };
    assert.ok(validateConfig(config).includes('schemaVersion must be 1'));
  });

  it('requires weights that sum to 1', () => {
    const config = templateConfig();
    config.scoring.weights.technical = 0.5;
    assert.match(validateConfig(config).join(), /must sum to 1 \(got 0\.8\)/);
  });

  it('rejects out-of-range, missing and unknown weights', () => {
    const config = templateConfig();
    config.scoring.weights = { technical: 1.2, salary: -0.2, location: 0, seniority: 0, culture: 0 };
    const errors = validateConfig(config).join('\n');
    assert.match(errors, /weights\.technical must be a number between 0 and 1/);
    assert.match(errors, /weights\.salary must be/);
    assert.match(errors, /weights\.quality must be/);
    assert.match(errors, /unknown axes: culture/);
  });

  it('requires a weights object', () => {
    const config = templateConfig();
    delete config.scoring.weights;
    assert.ok(validateConfig(config).includes('scoring.weights must be an object'));
  });

  it('requires ordered thresholds', () => {
    const config = templateConfig();
    config.scoring.thresholds = { review: 0.8, approve: 0.7 };
    assert.match(validateConfig(config).join(), /0 < review < approve <= 1/);
    config.scoring.thresholds = { review: '0.5' };
    assert.match(validateConfig(config).join(), /must be numbers/);
  });

  it('accepts a null or positive salary floor, rejects negatives and strings', () => {
    const config = templateConfig();
    config.salary.floor = 5000;
    assert.deepEqual(validateConfig(config), []);
    config.salary.floor = -1;
    assert.match(validateConfig(config).join(), /salary\.floor/);
    config.salary.floor = '5000';
    assert.match(validateConfig(config).join(), /salary\.floor/);
  });
});

describe('round', () => {
  it('rounds to 3 digits by default', () => {
    assert.equal(round(0.1 + 0.2), 0.3);
    assert.equal(round(0.12345, 2), 0.12);
  });
});
