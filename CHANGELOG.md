# Changelog

## 0.1.0 — unreleased

- `job-search` skill with references: search strategy, scoring model, résumé & cover
  letter, LinkedIn, behavioral interview prep, offer negotiation, browser search, PDF
  export.
- Commands: `/job-search:setup`, `/job-search:search`, `/job-search:tailor`,
  `/job-search:status`.
- `scripts/jobs.mjs`: zero-dependency CLI for dedup, weighted scoring and the status
  state machine, with append-only history.
- Workspace templates and a fictional demo workspace.
