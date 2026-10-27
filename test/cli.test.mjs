import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { parseArgs, run } from '../scripts/jobs.mjs';
import { readJson } from '../scripts/lib/workspace.mjs';
import { ROOT, posting } from './helpers.mjs';

const NOW = new Date('2026-01-01T00:00:00Z');

describe('jobs CLI', () => {
  let dir;
  let ws;
  const cli = (...argv) => run([...argv, '--workspace', ws], { now: NOW });

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'job-search-'));
    ws = join(dir, 'ws');
  });
  after(() => rmSync(dir, { recursive: true, force: true }));

  it('init creates the workspace and never overwrites', async () => {
    const first = await cli('init');
    assert.deepEqual(first.created, ['config.json', 'tracking.json', join('profile', 'resume.md')]);
    writeFileSync(join(ws, 'profile', 'resume.md'), 'mine');
    assert.deepEqual((await cli('init')).created, []);
    assert.equal(readFileSync(join(ws, 'profile', 'resume.md'), 'utf8'), 'mine');
  });

  it('validate reports a fresh workspace as valid', async () => {
    assert.deepEqual(await cli('validate'), { valid: true, configErrors: [], trackingErrors: [] });
  });

  it('add scores from a file, persists, and sorts by score', async () => {
    const file = join(dir, 'batch.json');
    writeFileSync(file, JSON.stringify([
      posting({ title: 'Weak', axes: { technical: 0.1, salary: 0.1, location: 0.1, seniority: 0.1, quality: 0.1 } }),
      posting(),
    ]));
    const out = await cli('add', file);
    assert.deepEqual(out.added.map((j) => j.decision), ['APPROVE', 'REJECT']);
    assert.equal((await readJson(join(ws, 'tracking.json'))).jobs.length, 2);
  });

  it('add reads a single object from stdin and reports duplicates', async () => {
    const out = await run(['add', '-', '-w', ws], { stdin: Readable.from([JSON.stringify(posting())]), now: NOW });
    assert.equal(out.added.length, 0);
    assert.equal(out.duplicates[0].id, 'acme-corp-senior-backend-engineer');
  });

  it('seen splits fresh from tracked without writing', async () => {
    const file = join(dir, 'candidates.json');
    writeFileSync(file, JSON.stringify([posting(), posting({ title: 'New one' })]));
    const out = await cli('seen', file);
    assert.deepEqual(out.fresh.map((j) => j.title), ['New one']);
    assert.equal(out.seen.length, 1);
    assert.equal((await readJson(join(ws, 'tracking.json'))).jobs.length, 2);
  });

  it('move, show and status', async () => {
    const moved = await cli('move', 'acme-corp-senior-backend-engineer', 'approved', 'go', 'for', 'it');
    assert.equal(moved.history.at(-1).note, 'go for it');
    assert.equal((await cli('show', 'acme-corp-senior-backend-engineer')).status, 'approved');
    const status = await cli('status');
    assert.equal(status.total, 2);
    assert.equal(status.active.length, 1);
  });

  it('fails loudly on bad input', async () => {
    await assert.rejects(cli('move'), /usage: move/);
    await assert.rejects(cli('show', 'ghost'), /no job with id "ghost"/);
    await assert.rejects(cli('add'), /expected a JSON file path/);
    await assert.rejects(cli('frobnicate'), /unknown command "frobnicate"/);
    assert.ok((await cli()).commands.status);
    assert.ok((await cli('help')).commands.init);
    await assert.rejects(run(['status', '-w', join(dir, 'missing')]), /not found — run \/job-search:setup/);
  });

  it('refuses to work on an invalid config or tracking', async () => {
    const bad = join(dir, 'bad');
    await run(['init', '-w', bad]);
    writeFileSync(join(bad, 'config.json'), JSON.stringify({ schemaVersion: 1 }));
    writeFileSync(join(dir, 'one.json'), JSON.stringify(posting()));
    await assert.rejects(run(['add', join(dir, 'one.json'), '-w', bad]), /invalid config\.json/);
    writeFileSync(join(bad, 'tracking.json'), '{ nope');
    await assert.rejects(run(['status', '-w', bad]), /is not valid JSON/);
    writeFileSync(join(bad, 'tracking.json'), JSON.stringify({ schemaVersion: 1, jobs: 'x' }));
    await assert.rejects(run(['status', '-w', bad]), /invalid tracking\.json/);
  });

  it('runs as an executable and exits 1 with a message on error', () => {
    const script = join(ROOT, 'scripts', 'jobs.mjs');
    const ok = execFileSync(process.execPath, [script, 'status', '-w', ws], { encoding: 'utf8' });
    assert.equal(JSON.parse(ok).total, 2);
    assert.throws(
      () => execFileSync(process.execPath, [script, 'nope', '-w', ws], { stdio: 'pipe' }),
      (err) => err.status === 1 && /unknown command/.test(err.stderr.toString()),
    );
  });
});

describe('parseArgs', () => {
  it('defaults the workspace to ./job-search and honors the env var', () => {
    const saved = process.env.JOB_SEARCH_WORKSPACE;
    delete process.env.JOB_SEARCH_WORKSPACE;
    assert.equal(parseArgs(['status']).workspace, join(process.cwd(), 'job-search'));
    process.env.JOB_SEARCH_WORKSPACE = '/tmp/elsewhere';
    assert.equal(parseArgs(['status']).workspace, '/tmp/elsewhere');
    if (saved === undefined) delete process.env.JOB_SEARCH_WORKSPACE;
    else process.env.JOB_SEARCH_WORKSPACE = saved;
  });

  it('rejects a dangling --workspace flag', () => {
    assert.throws(() => parseArgs(['status', '--workspace']), /--workspace needs a directory/);
  });
});
