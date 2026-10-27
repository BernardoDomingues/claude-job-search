// Job tracking: dedup, ingestion and the status state machine.
// History is append-only — nothing here ever removes a job or a history entry.

import { createHash } from 'node:crypto';
import { isObject } from './config.mjs';
import { scoreJob } from './scoring.mjs';

export const STATUSES = [
  'found', 'approved', 'prepared', 'applied', 'interviewing', 'offer', 'rejected', 'error',
];

// rejected can be reopened (the user changed their mind); error can recover to any status.
const TRANSITIONS = {
  found: ['approved', 'rejected', 'error'],
  approved: ['prepared', 'rejected', 'error'],
  prepared: ['applied', 'rejected', 'error'],
  applied: ['interviewing', 'offer', 'rejected', 'error'],
  interviewing: ['offer', 'rejected', 'error'],
  offer: ['rejected', 'error'],
  rejected: ['found', 'approved', 'error'],
  error: STATUSES.filter((s) => s !== 'error'),
};

const REQUIRED_FIELDS = ['title', 'company', 'location', 'link', 'source'];

export function emptyTracking() {
  return { schemaVersion: 1, jobs: [] };
}

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function jobHash({ title, company, location }) {
  const key = [title, company, location].map(normalize).join('|');
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

export function slugify(text) {
  return normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

/** Splits candidates into new ones and ones already tracked (by hash). */
export function partitionSeen(tracking, candidates) {
  const known = new Map(tracking.jobs.map((j) => [j.hash, j.id]));
  const fresh = [];
  const seen = [];
  const batch = new Set();
  for (const candidate of candidates) {
    const hash = jobHash(candidate);
    if (known.has(hash)) seen.push({ ...candidate, hash, id: known.get(hash) });
    else if (batch.has(hash)) seen.push({ ...candidate, hash, id: null });
    else {
      batch.add(hash);
      fresh.push({ ...candidate, hash });
    }
  }
  return { fresh, seen };
}

/**
 * Scores and appends new jobs. Duplicates are skipped and reported, never overwritten.
 * Returns { tracking, added, duplicates } — the input tracking is not mutated.
 */
export function addJobs(tracking, candidates, scoring, now = new Date()) {
  const at = now.toISOString();
  for (const [i, c] of candidates.entries()) {
    const missing = REQUIRED_FIELDS.filter((f) => !c?.[f]);
    if (missing.length) throw new Error(`job #${i}: missing ${missing.join(', ')}`);
  }

  const { fresh, seen } = partitionSeen(tracking, candidates);
  const ids = new Set(tracking.jobs.map((j) => j.id));
  const added = fresh.map((c) => {
    const { score, decision } = scoreJob(c.axes, scoring, c.hardReject ?? null);
    const id = uniqueId([slugify(c.company), slugify(c.title)].filter(Boolean).join('-'), ids);
    ids.add(id);
    return {
      id,
      hash: c.hash,
      title: c.title,
      company: c.company,
      location: c.location,
      salary: c.salary ?? null,
      link: c.link,
      source: c.source,
      description: c.description ?? '',
      axes: c.axes,
      hardReject: c.hardReject ?? null,
      score,
      decision,
      status: 'found',
      history: [{ status: 'found', at, note: c.note ?? `scored ${score} → ${decision}` }],
    };
  });

  return {
    tracking: { ...tracking, jobs: [...tracking.jobs, ...added] },
    added,
    duplicates: seen.map(({ title, company, location, id }) => ({ title, company, location, id })),
  };
}

export function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Moves a job to a new status, appending to its history. Throws on invalid moves. */
export function transition(tracking, id, to, note = '', now = new Date()) {
  if (!STATUSES.includes(to)) throw new Error(`unknown status "${to}"`);
  const job = tracking.jobs.find((j) => j.id === id);
  if (!job) throw new Error(`no job with id "${id}"`);
  if (!canTransition(job.status, to)) {
    throw new Error(`cannot move "${id}" from ${job.status} to ${to} (allowed: ${TRANSITIONS[job.status].join(', ')})`);
  }
  const entry = { status: to, at: now.toISOString(), ...(note ? { note } : {}) };
  const updated = { ...job, status: to, history: [...job.history, entry] };
  return { ...tracking, jobs: tracking.jobs.map((j) => (j.id === id ? updated : j)) };
}

export function summarize(tracking) {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const byDecision = { APPROVE: 0, REVIEW: 0, REJECT: 0 };
  for (const job of tracking.jobs) {
    byStatus[job.status] += 1;
    byDecision[job.decision] += 1;
  }
  const active = tracking.jobs
    .filter((j) => ['approved', 'prepared', 'applied', 'interviewing', 'offer'].includes(j.status))
    .map(({ id, title, company, status, score, history }) => ({
      id, title, company, status, score, since: history.at(-1).at,
    }));
  return { total: tracking.jobs.length, byStatus, byDecision, active };
}

/** Returns a list of human-readable problems; empty means valid. */
export function validateTracking(tracking) {
  if (!isObject(tracking)) return ['tracking must be a JSON object'];
  const errors = [];
  if (tracking.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!Array.isArray(tracking.jobs)) return [...errors, 'jobs must be an array'];
  const ids = new Set();
  const hashes = new Set();
  for (const [i, job] of tracking.jobs.entries()) {
    const where = `jobs[${i}]${job?.id ? ` (${job.id})` : ''}`;
    if (!isObject(job)) { errors.push(`${where} must be an object`); continue; }
    if (ids.has(job.id)) errors.push(`${where}: duplicate id`);
    if (hashes.has(job.hash)) errors.push(`${where}: duplicate hash`);
    ids.add(job.id);
    hashes.add(job.hash);
    if (!STATUSES.includes(job.status)) errors.push(`${where}: unknown status "${job.status}"`);
    if (!Array.isArray(job.history) || job.history.length === 0) {
      errors.push(`${where}: history must be a non-empty array`);
    } else if (job.history.at(-1).status !== job.status) {
      errors.push(`${where}: status does not match last history entry`);
    }
  }
  return errors;
}

function uniqueId(base, taken) {
  const root = base || 'job';
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
