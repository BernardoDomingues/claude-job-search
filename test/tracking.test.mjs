import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addJobs, canTransition, emptyTracking, jobHash, partitionSeen, slugify, summarize,
  transition, validateTracking,
} from '../scripts/lib/tracking.mjs';
import { AXES_WEAK, posting, templateConfig } from './helpers.mjs';

const { scoring } = templateConfig();
const T0 = new Date('2026-01-01T00:00:00Z');
const T1 = new Date('2026-01-02T00:00:00Z');

function trackingWith(...postings) {
  return addJobs(emptyTracking(), postings, scoring, T0).tracking;
}

describe('jobHash', () => {
  it('ignores case, accents and extra whitespace', () => {
    const a = jobHash({ title: 'Engenheiro  de Software', company: 'Açaí Ltda', location: 'Remoto' });
    const b = jobHash({ title: 'engenheiro de software', company: 'ACAI LTDA ', location: 'remoto' });
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{16}$/);
  });

  it('differs when location differs', () => {
    assert.notEqual(
      jobHash({ title: 'Dev', company: 'X', location: 'Remote' }),
      jobHash({ title: 'Dev', company: 'X', location: 'Lisbon' }),
    );
  });
});

describe('slugify', () => {
  it('produces url-safe ids', () => {
    assert.equal(slugify('  Senior Full-Stack (Node/React) @ Açaí!  '), 'senior-full-stack-node-react-acai');
  });
});

describe('partitionSeen', () => {
  it('splits tracked, fresh and in-batch duplicates', () => {
    const tracking = trackingWith(posting());
    const { fresh, seen } = partitionSeen(tracking, [
      posting({ title: 'SENIOR backend engineer' }),
      posting({ title: 'Frontend Engineer' }),
      posting({ title: 'Frontend Engineer' }),
    ]);
    assert.equal(fresh.length, 1);
    assert.equal(fresh[0].title, 'Frontend Engineer');
    assert.deepEqual(seen.map((s) => s.id), ['acme-corp-senior-backend-engineer', null]);
  });
});

describe('addJobs', () => {
  it('scores, assigns ids and starts at found with history', () => {
    const { tracking, added, duplicates } = addJobs(emptyTracking(), [posting()], scoring, T0);
    assert.equal(duplicates.length, 0);
    assert.equal(added.length, 1);
    const [job] = tracking.jobs;
    assert.equal(job.id, 'acme-corp-senior-backend-engineer');
    assert.equal(job.status, 'found');
    assert.equal(job.decision, 'APPROVE');
    assert.equal(job.salary, null);
    assert.deepEqual(job.history, [
      { status: 'found', at: '2026-01-01T00:00:00.000Z', note: 'scored 1 → APPROVE' },
    ]);
  });

  it('never overwrites a tracked job and reports the duplicate', () => {
    const before = trackingWith(posting());
    const { tracking, added, duplicates } = addJobs(before, [posting({ axes: AXES_WEAK })], scoring, T1);
    assert.equal(added.length, 0);
    assert.equal(duplicates[0].id, 'acme-corp-senior-backend-engineer');
    assert.deepEqual(tracking.jobs, before.jobs);
  });

  it('suffixes ids that collide but have different hashes', () => {
    const tracking = trackingWith(posting(), posting({ location: 'Lisbon' }), posting({ location: 'Porto' }));
    assert.deepEqual(tracking.jobs.map((j) => j.id), [
      'acme-corp-senior-backend-engineer',
      'acme-corp-senior-backend-engineer-2',
      'acme-corp-senior-backend-engineer-3',
    ]);
  });

  it('records hard rejects and custom notes', () => {
    const [job] = trackingWith(posting({ hardReject: 'on-site only', note: 'from referral' })).jobs;
    assert.equal(job.decision, 'REJECT');
    assert.equal(job.hardReject, 'on-site only');
    assert.equal(job.history[0].note, 'from referral');
  });

  it('requires link and source — no posting without a real origin', () => {
    assert.throws(() => addJobs(emptyTracking(), [posting({ link: '' })], scoring), /job #0: missing link/);
    assert.throws(() => addJobs(emptyTracking(), [{ title: 'x' }], scoring), /missing company, location, link, source/);
  });

  it('falls back to a generic id for unsluggable names', () => {
    const [job] = trackingWith(posting({ company: '!!!', title: '???' })).jobs;
    assert.equal(job.id, 'job');
  });

  it('does not mutate the input tracking', () => {
    const before = emptyTracking();
    addJobs(before, [posting()], scoring, T0);
    assert.deepEqual(before, emptyTracking());
  });
});

describe('transition', () => {
  const id = 'acme-corp-senior-backend-engineer';

  it('appends to history and updates status', () => {
    const tracking = transition(trackingWith(posting()), id, 'approved', 'looks great', T1);
    const job = tracking.jobs[0];
    assert.equal(job.status, 'approved');
    assert.equal(job.history.length, 2);
    assert.deepEqual(job.history[1], { status: 'approved', at: '2026-01-02T00:00:00.000Z', note: 'looks great' });
  });

  it('omits empty notes', () => {
    const job = transition(trackingWith(posting()), id, 'approved', '', T1).jobs[0];
    assert.deepEqual(Object.keys(job.history[1]), ['status', 'at']);
  });

  it('walks the full happy path', () => {
    let tracking = trackingWith(posting());
    for (const status of ['approved', 'prepared', 'applied', 'interviewing', 'offer']) {
      tracking = transition(tracking, id, status, '', T1);
    }
    assert.deepEqual(tracking.jobs[0].history.map((h) => h.status), [
      'found', 'approved', 'prepared', 'applied', 'interviewing', 'offer',
    ]);
  });

  it('refuses skipping steps, unknown statuses and unknown ids', () => {
    const tracking = trackingWith(posting());
    assert.throws(() => transition(tracking, id, 'applied'), /cannot move .* from found to applied/);
    assert.throws(() => transition(tracking, id, 'hired'), /unknown status "hired"/);
    assert.throws(() => transition(tracking, 'nope', 'approved'), /no job with id "nope"/);
  });

  it('lets the user reopen a rejected job and recover from error', () => {
    let tracking = transition(trackingWith(posting()), id, 'rejected', '', T1);
    tracking = transition(tracking, id, 'approved', 'changed my mind', T1);
    tracking = transition(tracking, id, 'error', 'link died', T1);
    tracking = transition(tracking, id, 'prepared', '', T1);
    assert.equal(tracking.jobs[0].status, 'prepared');
    assert.equal(tracking.jobs[0].history.length, 5);
  });
});

describe('canTransition', () => {
  it('rejects unknown origins', () => {
    assert.equal(canTransition('ghost', 'found'), false);
    assert.equal(canTransition('error', 'error'), false);
  });
});

describe('summarize', () => {
  it('counts by status and decision and lists active jobs', () => {
    let tracking = trackingWith(posting(), posting({ title: 'Frontend', axes: AXES_WEAK }));
    tracking = transition(tracking, 'acme-corp-senior-backend-engineer', 'approved', '', T1);
    const summary = summarize(tracking);
    assert.equal(summary.total, 2);
    assert.equal(summary.byStatus.found, 1);
    assert.equal(summary.byStatus.approved, 1);
    assert.deepEqual(summary.byDecision, { APPROVE: 1, REVIEW: 0, REJECT: 1 });
    assert.deepEqual(summary.active, [{
      id: 'acme-corp-senior-backend-engineer',
      title: 'Senior Backend Engineer',
      company: 'Acme Corp',
      status: 'approved',
      score: 1,
      since: '2026-01-02T00:00:00.000Z',
    }]);
  });
});

describe('validateTracking', () => {
  it('accepts an empty and a populated tracking', () => {
    assert.deepEqual(validateTracking(emptyTracking()), []);
    assert.deepEqual(validateTracking(trackingWith(posting())), []);
  });

  it('rejects malformed roots', () => {
    assert.deepEqual(validateTracking('x'), ['tracking must be a JSON object']);
    assert.deepEqual(validateTracking({ schemaVersion: 2 }), ['schemaVersion must be 1', 'jobs must be an array']);
  });

  it('flags duplicates, bad statuses and broken history', () => {
    const [job] = trackingWith(posting()).jobs;
    const errors = validateTracking({
      schemaVersion: 1,
      jobs: [job, job, { ...job, id: 'b', hash: 'h', status: 'hired' }, { ...job, id: 'c', hash: 'i', history: [] }, 42],
    }).join('\n');
    assert.match(errors, /duplicate id/);
    assert.match(errors, /duplicate hash/);
    assert.match(errors, /unknown status "hired"/);
    assert.match(errors, /history must be a non-empty array/);
    assert.match(errors, /jobs\[4\] must be an object/);
  });

  it('flags a status that disagrees with history', () => {
    const [job] = trackingWith(posting()).jobs;
    const errors = validateTracking({ schemaVersion: 1, jobs: [{ ...job, status: 'applied' }] });
    assert.match(errors.join(), /does not match last history entry/);
  });
});
