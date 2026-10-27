// Filesystem access to a user's workspace. The plugin never writes inside its own folder.

import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const FILES = {
  config: 'config.json',
  tracking: 'tracking.json',
  resume: join('profile', 'resume.md'),
  generated: 'generated',
};

export async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error(`${path} not found — run /job-search:setup first`);
    if (err instanceof SyntaxError) throw new Error(`${path} is not valid JSON: ${err.message}`);
    throw err;
  }
}

/** Writes via a temp file + rename so a crash never leaves a half-written file. */
export async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tmp, path);
}

/**
 * Creates a workspace from the templates. Existing files are kept, never overwritten.
 * Returns the list of files created.
 */
export async function initWorkspace(workspace, templatesDir) {
  const created = [];
  await mkdir(join(workspace, FILES.generated), { recursive: true });
  for (const [template, target] of [
    ['config.json', FILES.config],
    ['tracking.json', FILES.tracking],
    ['resume.md', FILES.resume],
  ]) {
    const dest = join(workspace, target);
    if (existsSync(dest)) continue;
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(join(templatesDir, template), dest);
    created.push(target);
  }
  return created;
}
