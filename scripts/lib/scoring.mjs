// Weighted job scoring. Claude rates each axis 0..1 (judgment, see
// skills/job-search/references/scoring-model.md); this module does the arithmetic.

import { AXES, round } from './config.mjs';

export const DECISIONS = ['REJECT', 'REVIEW', 'APPROVE'];

/**
 * @param {Record<string, number>} axes  one rating in [0, 1] per axis
 * @param {object} scoring               config.scoring ({ weights, thresholds })
 * @param {string|null} hardReject       reason the job fails a hard filter, if any
 * @returns {{ score: number, decision: string }}
 */
export function scoreJob(axes, scoring, hardReject = null) {
  const problems = validateAxes(axes);
  if (problems.length) throw new Error(problems.join('; '));

  const score = round(AXES.reduce((acc, axis) => acc + axes[axis] * scoring.weights[axis], 0));
  if (hardReject) return { score, decision: 'REJECT' };
  return { score, decision: decide(score, scoring.thresholds) };
}

export function decide(score, { review, approve }) {
  if (score >= approve) return 'APPROVE';
  if (score >= review) return 'REVIEW';
  return 'REJECT';
}

export function validateAxes(axes) {
  if (axes === null || typeof axes !== 'object') return ['axes must be an object'];
  const errors = [];
  for (const axis of AXES) {
    const v = axes[axis];
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 1) {
      errors.push(`axes.${axis} must be a number between 0 and 1`);
    }
  }
  return errors;
}
