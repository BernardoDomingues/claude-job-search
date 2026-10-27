import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function templateConfig() {
  return JSON.parse(readFileSync(join(ROOT, 'templates', 'config.json'), 'utf8'));
}

export const AXES_STRONG = { technical: 1, salary: 1, location: 1, seniority: 1, quality: 1 };
export const AXES_MID = { technical: 0.6, salary: 0.7, location: 0.7, seniority: 1, quality: 0.6 };
export const AXES_WEAK = { technical: 0.2, salary: 0.4, location: 0.7, seniority: 0.7, quality: 0.3 };

export function posting(overrides = {}) {
  return {
    title: 'Senior Backend Engineer',
    company: 'Acme Corp',
    location: 'Remote — LATAM',
    salary: null,
    link: 'https://example.com/jobs/1',
    source: 'Example Board',
    description: 'Build APIs.',
    axes: AXES_STRONG,
    ...overrides,
  };
}
