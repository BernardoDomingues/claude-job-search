---
description: Create or update your job-search workspace (profile, preferences, scoring)
argument-hint: "[workspace-dir]"
---

Set up the user's job-search workspace using the `job-search` skill.

1. Workspace folder: `$ARGUMENTS` if given, else `JOB_SEARCH_WORKSPACE`, else
   `./job-search`. Confirm the path with the user before creating anything.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/jobs.mjs" init --workspace <dir>`. It never
   overwrites existing files — if the workspace exists, this command updates it instead.
3. Interview the user in their language, a few questions at a time (use structured
   questions when available). Skip what `config.json` already answers unless they want to
   change it:
   - target roles and seniority level(s)
   - primary stack (what they want to be hired for) and secondary/acceptable stack
   - years of experience
   - where they can work: remote global, remote in specific regions, countries, on-site
     cities; whether on-site/hybrid is a dealbreaker
   - contract types they accept, in order of preference (employee, contractor, …)
   - salary floor, currency and period (month/year) — optional
   - languages they work in, and the default language for generated material
   - preferred job boards (offer the list in the search-strategy reference)
   - any other dealbreaker (industry, company size, travel, on-call)
   - whether they want PDF export (and check if pandoc is installed)
4. Write the answers into `<dir>/config.json`, keeping its structure. Only change the
   scoring weights if the user asks; explain the defaults (technical fit 70%).
5. Résumé: ask the user to paste their current résumé (or point to a file) and convert
   it into `<dir>/profile/resume.md` following the template's structure. Use only what
   they provide — leave sections empty rather than guessing. Offer a review afterwards.
6. Run `validate` and fix anything it reports.
7. Finish with a short summary of the configuration and the next step
   (`/job-search:search`). Suggest adding the workspace folder to `.gitignore` if it sits
   inside a repository — it contains personal data.
