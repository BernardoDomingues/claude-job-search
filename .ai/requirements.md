# claude-job-search — requirements (approved 2026-10-27)

Generic, open-source Claude Code plugin extracted from the maintainer's private
`job-search` skill. This file is the approved spec; implement against it.

## Goal

Ship the real workflow (real search → scoring → human approval → tailored material →
tracking → interview/negotiation prep) as an installable, user-configurable plugin with
**no personal data** and **no third-party course content**.

## Scope

In: plugin + marketplace manifest, one skill, slash commands, a deterministic
scoring/dedup/tracking script, guided onboarding, PDF export, optional browser search,
references rewritten in English from public sources, README in EN and PT-BR, a
fictional demo workspace.

Out: company/platform-specific interview notes; technical-interview skills
(coding / system design); auto-applying; authenticated scraping; migrating the
maintainer's own workspace; creating/pushing the GitHub repo.

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR01 | `/job-search:setup` interviews the user (stack, seniority, salary floor + currency, locations, contract types, language) and creates a workspace (`config.json`, `tracking.json`, `profile/resume.md`, `generated/`) | Must |
| FR02 | `/job-search:search` finds real postings via WebSearch/WebFetch following `search-strategy.md`, normalized to `{title, company, location, salary, link, description, source}` | Must |
| FR03 | The script deduplicates against `tracking.json` by `hash(title+company+location)` | Must |
| FR04 | Claude rates each axis 0–1 against a documented rubric; the script applies hard rejects, the weighted sum (weights from `config.json`) and the REJECT/REVIEW/APPROVE thresholds | Must |
| FR05 | Ranked list shown to the user; material is generated only for jobs the user explicitly approves | Must |
| FR06 | `/job-search:tailor <job-id>` drafts résumé + cover letter in `generated/<id>/`, in the posting's language | Must |
| FR07 | The script records status transitions (`found→approved→prepared→applied→interviewing→offer`, plus `rejected`/`error`) with timestamps, refuses invalid ones, never deletes history | Must |
| FR08 | `/job-search:status` summarizes the pipeline from `tracking.json` | Should |
| FR09 | PDF export via pandoc + CSS; degrades gracefully when pandoc is missing | Should |
| FR10 | References rewritten from cited public sources: résumé/cover letter (XYZ, ATS), LinkedIn, search strategy (boards, boolean search, fake-remote red flags), behavioral interviews (STAR, pre-interview kit), negotiation | Must |
| FR11 | Optional browser-based search guide (Chrome DevTools MCP), OS-agnostic | Could |
| FR12 | Fictional demo workspace (config, tracking, résumé) | Should |

## Non-functional requirements

| ID | Requirement |
|---|---|
| NFR01 | Privacy: a denylist grep (kept outside the repo) over the tree returns 0 hits before handoff |
| NFR02 | Copyright: 0 passages from the paid course, never cited; every reference ends with a `Sources` section of public links |
| NFR03 | Zero runtime dependencies: Node ≥ 18 only; pandoc optional |
| NFR04 | `node:test` suite, ≥ 90% line coverage on `scripts/lib` |
| NFR05 | `claude plugin validate` passes on plugin and marketplace |
| NFR06 | Code, skill and references in English; conversation and generated material in the user's / posting's language |
| NFR07 | User data lives only in the user's workspace; the plugin never writes inside its own folder |

## Invariants

1. Never applies on the user's behalf — everything generated is a draft.
2. Never fabricates experience — only reorders/emphasizes what is in the user's résumé.
3. Never fabricates postings — every job comes from a real search, with a link.
4. Never loses tracking history.

## Decisions

- License MIT; scripts are zero-dependency Node ESM (Claude Code already requires Node).
- Scoring split: rating each axis is judgment (Claude, rubric in `scoring-model.md`);
  aggregation, hard rejects, thresholds, dedup and state machine are code (`scripts/lib`).
- Score decision (REJECT/REVIEW/APPROVE) is advisory and separate from status — the user
  can approve a REJECT.
- The maintainer's private workspace is untouched; migrating it to this plugin
  is a separate, later decision.
