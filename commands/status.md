---
description: Show your job-search pipeline, or record a status change
argument-hint: "[<job-id> <status> [note]]"
---

Pipeline view and updates for the `job-search` skill.
Workspace: `JOB_SEARCH_WORKSPACE` or `./job-search`.

- With no arguments: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/jobs.mjs" status` and
  present a compact summary — totals by status, then the active jobs (approved →
  offer) with how long each has been in its current status. Point out jobs that look
  stale (for example, applied more than two weeks ago with no update) and suggest a
  follow-up.
- With arguments `$ARGUMENTS`: treat them as `<job-id> <status> [note]` and run
  `jobs.mjs move`. If the script refuses the transition, explain the allowed next
  statuses. When the new status is `interviewing`, offer to prepare
  (`references/interview-prep.md`); when it is `offer`, offer to evaluate it
  (`references/negotiation.md`).
