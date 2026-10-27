---
name: job-search
description: >-
  Human-in-the-loop job search assistant. Use when the user asks to find or search for
  job openings, score/rank postings, track applications, tailor a résumé or cover letter
  to a posting, review a résumé or LinkedIn profile, prepare for a (behavioral) interview,
  or evaluate and negotiate a job offer. Works from the user's own workspace
  (config.json, tracking.json, profile/resume.md).
---

# Job Search

Helps one person run a disciplined job search: find **real** postings, score them
against **their** criteria, keep a tracked pipeline, and draft tailored material for the
ones **they** approve. Talk to the user in their language; write generated material in
the language of the posting (or `output.defaultLanguage` when unclear).

## The four invariants (override everything else)

1. **Never apply on the user's behalf.** Every résumé, letter or answer is a draft for
   them to review and send.
2. **Never fabricate experience.** Tailoring means choosing, ordering and rephrasing what
   is already in `profile/resume.md`. If a posting asks for something the résumé does not
   show, say so — do not invent it. Asking the user "have you done X?" is fine; adding X
   without their confirmation is not.
3. **Never fabricate postings.** Every job comes from a real search result with a link you
   actually opened. If search returns nothing useful, report that.
4. **Never lose history.** Change `tracking.json` only through `scripts/jobs.mjs`; never
   edit it by hand or delete entries.

## Workspace

User data lives outside the plugin, in a workspace folder (default `./job-search`, or the
`JOB_SEARCH_WORKSPACE` env var):

| File | What it is |
|---|---|
| `config.json` | profile, search preferences, salary floor, scoring weights/thresholds |
| `tracking.json` | every job ever seen, its score and its full status history |
| `profile/resume.md` | the user's résumé — the only source of facts about them |
| `generated/<job-id>/` | tailored drafts per job |

If the workspace does not exist, run the setup flow (`/job-search:setup`) first.

## The tracking script

`node "${CLAUDE_PLUGIN_ROOT}/scripts/jobs.mjs" <command> [--workspace <dir>]` — prints JSON.

| Command | Use |
|---|---|
| `init` | create the workspace from templates (never overwrites) |
| `validate` | check config and tracking |
| `seen <file\|->` | before scoring: which candidates are already tracked |
| `add <file\|->` | score and store new jobs (each needs `axes`, see scoring model) |
| `move <id> <status> [note]` | change status: `found → approved → prepared → applied → interviewing → offer`, or `rejected` / `error` |
| `status` / `show <id>` | pipeline summary / one job with history |

Pass JSON on stdin with `-` (heredoc) or write a temp file in the scratchpad — never
inside the plugin folder.

## Routing

| The user wants to… | Read |
|---|---|
| find openings (boards, queries, red flags) | [references/search-strategy.md](references/search-strategy.md) |
| score or rank postings | [references/scoring-model.md](references/scoring-model.md) |
| search a board that needs a real browser | [references/browser-search.md](references/browser-search.md) |
| write or review a résumé / cover letter, tailor to a job | [references/resume-and-cover-letter.md](references/resume-and-cover-letter.md) |
| improve their LinkedIn profile | [references/linkedin.md](references/linkedin.md) |
| prepare for an interview | [references/interview-prep.md](references/interview-prep.md) |
| evaluate or negotiate an offer | [references/negotiation.md](references/negotiation.md) |
| export a draft to PDF | [references/pdf-export.md](references/pdf-export.md) |

## Flow: search → approve → tailor

1. Read `config.json` and `profile/resume.md`.
2. Search for real postings ([search-strategy.md](references/search-strategy.md)); open
   each promising result and normalize it to
   `{title, company, location, salary, link, description, source}`.
3. Run `seen` and drop what is already tracked.
4. Rate the five axes for each fresh job ([scoring-model.md](references/scoring-model.md)),
   set `hardReject` when a hard filter fails, then `add` them all — rejects included, so
   they are never re-evaluated.
5. Show the ranked list (APPROVE, then REVIEW; mention how many were rejected and why).
   Ask which ones to pursue.
6. For each job the user picks: `move <id> approved`, draft material in
   `generated/<id>/` ([resume-and-cover-letter.md](references/resume-and-cover-letter.md)),
   then `move <id> prepared`.
7. Later status changes (applied, interviewing, offer, rejected) come from the user —
   record them with `move` and a short note.

The score's decision (REJECT/REVIEW/APPROVE) is advice. The user may pursue a REJECT;
record it with a note explaining why.
