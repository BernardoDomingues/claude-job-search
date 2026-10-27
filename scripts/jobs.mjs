#!/usr/bin/env node
// CLI used by the job-search skill. Every command prints JSON to stdout;
// errors go to stderr with exit code 1.
//
//   node jobs.mjs <command> [args] [--workspace <dir>]   (no command → usage)

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './lib/config.mjs';
import {
  addJobs, partitionSeen, summarize, transition, validateTracking,
} from './lib/tracking.mjs';
import { FILES, initWorkspace, readJson, writeJson } from './lib/workspace.mjs';

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');

const USAGE = {
  init: 'create the workspace from templates (never overwrites)',
  validate: 'check config.json and tracking.json',
  'seen <file|->': 'split candidate postings into fresh / already tracked',
  'add <file|->': 'score and append postings (array of jobs with axes)',
  'move <id> <status> [note]': "change a job's status, appending to its history",
  status: 'pipeline summary',
  'show <id>': 'one job, with full history',
};

export async function run(argv, { stdin = process.stdin, now = new Date() } = {}) {
  const { positional, workspace } = parseArgs(argv);
  const [command, ...args] = positional;
  const paths = {
    config: join(workspace, FILES.config),
    tracking: join(workspace, FILES.tracking),
  };

  switch (command) {
    case 'init': {
      const created = await initWorkspace(workspace, TEMPLATES);
      return { workspace, created };
    }
    case 'validate': {
      const configErrors = validateConfig(await readJson(paths.config));
      const trackingErrors = validateTracking(await readJson(paths.tracking));
      return { valid: !configErrors.length && !trackingErrors.length, configErrors, trackingErrors };
    }
    case 'seen': {
      const tracking = await loadTracking(paths.tracking);
      const { fresh, seen } = partitionSeen(tracking, await readInput(args[0], stdin));
      return { fresh, seen };
    }
    case 'add': {
      const config = await loadConfig(paths.config);
      const tracking = await loadTracking(paths.tracking);
      const result = addJobs(tracking, await readInput(args[0], stdin), config.scoring, now);
      await writeJson(paths.tracking, result.tracking);
      return {
        added: result.added
          .map(({ id, title, company, score, decision, hardReject }) => ({
            id, title, company, score, decision, hardReject,
          }))
          .sort((a, b) => b.score - a.score),
        duplicates: result.duplicates,
      };
    }
    case 'move': {
      const [id, status, ...note] = args;
      if (!id || !status) throw new Error('usage: move <id> <status> [note]');
      const tracking = transition(await loadTracking(paths.tracking), id, status, note.join(' '), now);
      await writeJson(paths.tracking, tracking);
      return tracking.jobs.find((j) => j.id === id);
    }
    case 'status':
      return summarize(await loadTracking(paths.tracking));
    case 'show': {
      const job = (await loadTracking(paths.tracking)).jobs.find((j) => j.id === args[0]);
      if (!job) throw new Error(`no job with id "${args[0]}"`);
      return job;
    }
    case undefined:
    case 'help':
      return { usage: 'node jobs.mjs <command> [args] [--workspace <dir>]', commands: USAGE };
    default:
      throw new Error(`unknown command "${command}" — run with no arguments for usage`);
  }
}

export function parseArgs(argv) {
  const positional = [];
  let workspace = process.env.JOB_SEARCH_WORKSPACE || 'job-search';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--workspace' || argv[i] === '-w') {
      workspace = argv[i + 1];
      i += 1;
    } else {
      positional.push(argv[i]);
    }
  }
  if (!workspace) throw new Error('--workspace needs a directory');
  return { positional, workspace: resolve(workspace) };
}

async function loadConfig(path) {
  const config = await readJson(path);
  const errors = validateConfig(config);
  if (errors.length) throw new Error(`invalid config.json: ${errors.join('; ')}`);
  return config;
}

async function loadTracking(path) {
  const tracking = await readJson(path);
  const errors = validateTracking(tracking);
  if (errors.length) throw new Error(`invalid tracking.json: ${errors.join('; ')}`);
  return tracking;
}

async function readInput(source, stdin) {
  if (!source) throw new Error('expected a JSON file path, or - for stdin');
  const text = source === '-' ? await readStream(stdin) : await readFile(source, 'utf8');
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : [data];
}

async function readStream(stream) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2))
    .then((out) => process.stdout.write(`${JSON.stringify(out, null, 2)}\n`))
    .catch((err) => {
      process.stderr.write(`error: ${err.message}\n`);
      process.exit(1);
    });
}
