# claude-job-search

[Português](README.pt-BR.md)

A [Claude Code](https://claude.com/claude-code) plugin for running a job search with
Claude as your assistant, while you make every decision.

It searches for **real** postings, scores them against **your** criteria, keeps a
tracked pipeline, and drafts a tailored résumé and cover letter for the jobs **you**
approve. It also helps with your LinkedIn profile, behavioral interviews and offer
negotiation.

It will never apply for you, invent experience you don't have, or make up postings.

## What you get

| | |
|---|---|
| `/job-search:setup` | short interview → your workspace with preferences, salary floor, stack and résumé |
| `/job-search:search` | real web search → dedup → weighted score → ranked shortlist for you to approve |
| `/job-search:tailor <id>` | résumé + cover letter drafted for one job, in the posting's language, optional PDF |
| `/job-search:status` | your pipeline at a glance; record applied / interviewing / offer / rejected |
| the `job-search` skill | ask in plain words: "review my résumé", "prep me for Thursday's interview", "is this offer good?" |

## Install

Inside Claude Code:

```
/plugin marketplace add BernardoDomingues/claude-job-search
/plugin install job-search@claude-job-search
```

Requirements: Claude Code (which already brings Node.js ≥ 18). Optional: `pandoc` plus
`weasyprint` or `wkhtmltopdf` for PDF export, and a browser MCP server (for example
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)) for job
boards that need a real browser.

## Quick start

1. Open Claude Code in the folder where you want to keep your job search.
2. Run `/job-search:setup` and answer the questions. Paste your résumé when asked.
3. Run `/job-search:search`, then pick the jobs you like from the shortlist.
4. Run `/job-search:tailor <job-id>` for each one, review the draft, and apply yourself.
5. Tell Claude when things change ("I applied to …", "got an interview with …"), or use
   `/job-search:status`.

Want to see it first? [`examples/demo-workspace`](examples/demo-workspace) has a
fictional person's config, résumé and pipeline. Try
`JOB_SEARCH_WORKSPACE=examples/demo-workspace` and ask for the status.

## Your data

Everything about you lives in **your workspace**: `./job-search` by default, or the
folder in `JOB_SEARCH_WORKSPACE`.

```
job-search/
  config.json        what you want: roles, stack, locations, salary floor, scoring weights
  tracking.json      every job seen, its score and full status history
  profile/resume.md  your résumé, the only source of facts about you
  generated/<id>/    tailored drafts per job
```

Nothing is sent anywhere except the web searches Claude runs. If the workspace sits
inside a git repository, add it to `.gitignore` because it holds personal data.

## How scoring works

Claude rates each posting from 0 to 1 on five axes, following a written rubric:
technical fit, salary, location, seniority and posting quality. A small script does the
math: it applies your weights (default 70 / 10 / 10 / 5 / 5), your hard filters (on-site
only, "must reside in …", scams) and your thresholds (≥ 0.75 approve, ≥ 0.50 review). The
same posting is never scored twice. Change weights and thresholds in `config.json`.
Details: [scoring-model.md](skills/job-search/references/scoring-model.md).

Statuses follow `found → approved → prepared → applied → interviewing → offer`, plus
`rejected` and `error`. History is append-only.

## Customize

- **Preferences**: edit `config.json` or run `/job-search:setup` again.
- **Scoring**: change `scoring.weights` (must sum to 1) and `scoring.thresholds`.
- **PDF look**: copy `templates/pdf-style.css`, edit it, and ask Claude to use your copy.
- **Language**: Claude talks in your language and writes drafts in the posting's
  language. Set `output.defaultLanguage` for the fallback.

## Development

```bash
npm test            # node:test, no dependencies
npm run coverage    # fails under 90% line coverage on scripts/lib
claude plugin validate .
```

The CLI the skill uses is `scripts/jobs.mjs` (run it with no arguments to see its
commands). Pure logic lives in `scripts/lib/`. The approved spec lives in
[.ai/requirements.md](.ai/requirements.md).

## Credits & license

Reference material is written from public sources, cited at the end of each file in
[`skills/job-search/references`](skills/job-search/references).
MIT © Bernardo Domingues. See [LICENSE](LICENSE).
