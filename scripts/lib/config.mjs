// Workspace configuration validation (the defaults live in templates/config.json).

export const AXES = ['technical', 'salary', 'location', 'seniority', 'quality'];

const EPSILON = 1e-6;

/** Returns a list of human-readable problems; empty means valid. */
export function validateConfig(config) {
  const errors = [];
  if (!isObject(config)) return ['config must be a JSON object'];
  if (config.schemaVersion !== 1) errors.push('schemaVersion must be 1');

  const weights = config.scoring?.weights;
  if (!isObject(weights)) {
    errors.push('scoring.weights must be an object');
  } else {
    for (const axis of AXES) {
      const w = weights[axis];
      if (typeof w !== 'number' || w < 0 || w > 1) {
        errors.push(`scoring.weights.${axis} must be a number between 0 and 1`);
      }
    }
    const unknown = Object.keys(weights).filter((k) => !AXES.includes(k));
    if (unknown.length) errors.push(`scoring.weights has unknown axes: ${unknown.join(', ')}`);
    const sum = AXES.reduce((acc, axis) => acc + (Number(weights[axis]) || 0), 0);
    if (Math.abs(sum - 1) > EPSILON) {
      errors.push(`scoring.weights must sum to 1 (got ${round(sum)})`);
    }
  }

  const t = config.scoring?.thresholds;
  if (!isObject(t) || typeof t.review !== 'number' || typeof t.approve !== 'number') {
    errors.push('scoring.thresholds.review and .approve must be numbers');
  } else if (!(t.review > 0 && t.review < t.approve && t.approve <= 1)) {
    errors.push('scoring.thresholds must satisfy 0 < review < approve <= 1');
  }

  const floor = config.salary?.floor;
  if (floor !== null && floor !== undefined && (typeof floor !== 'number' || floor < 0)) {
    errors.push('salary.floor must be null or a non-negative number');
  }
  return errors;
}

export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function round(n, digits = 3) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
