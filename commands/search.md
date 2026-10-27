---
description: Search for real job postings, score them and show a ranked shortlist
argument-hint: "[extra focus, e.g. 'react roles in Portugal']"
---

Run the **search → approve** part of the `job-search` skill's flow.

- Workspace: `JOB_SEARCH_WORKSPACE` or `./job-search`. If it does not exist, stop and
  suggest `/job-search:setup`.
- Extra focus for this run (may be empty): $ARGUMENTS

Steps:
1. Read `config.json` and `profile/resume.md`.
2. Follow `references/search-strategy.md` to run real searches (WebSearch/WebFetch;
   `references/browser-search.md` only if a browser MCP is available and needed).
   Open every result you intend to keep. Never include a posting you did not open.
3. Normalize, run `jobs.mjs seen` and skip what is already tracked.
4. Rate the axes with `references/scoring-model.md`, then `jobs.mjs add` every fresh job,
   rejects included.
5. Present the ranked shortlist: APPROVE first, then REVIEW, each with title, company,
   location, salary (if known), score, one line on fit/gaps, and the link. Summarize the
   rejects (count and main reasons) and the queries/boards used.
6. Ask which jobs to pursue. For each one chosen, `jobs.mjs move <id> approved` and offer
   `/job-search:tailor <id>`. Do not draft anything the user did not choose.
