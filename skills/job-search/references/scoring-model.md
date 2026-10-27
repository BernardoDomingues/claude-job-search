# Scoring model

Scoring is split on purpose: **rating each axis is judgment** (you, using the rubric
below), **everything else is arithmetic** (`scripts/lib/scoring.mjs`). Never compute or
round the final score yourself — pass the axes to `jobs.mjs add` and report what it
returns.

## Formula

```
score = Σ axis_rating × weight      (weights from config.scoring.weights, sum = 1)
```

Default weights: technical 0.70 · salary 0.10 · location 0.10 · seniority 0.05 ·
quality 0.05. Technical fit dominates because a posting that does not match the
person's skills is not worth their time however good the rest looks. Users can change the
weights in `config.json`; the script refuses weights that do not sum to 1.

## Decision

| Score | Decision | What to do |
|---|---|---|
| ≥ `thresholds.approve` (0.75) | APPROVE | present as a strong match |
| ≥ `thresholds.review` (0.50) | REVIEW | present, saying what is borderline |
| below | REJECT | store, mention the count and main reasons, do not list |

A `hardReject` forces REJECT whatever the score.

## Hard filters → `hardReject`

Set `hardReject` to a short reason (e.g. `"on-site in Austin required"`) when:
- the job requires presence somewhere the user cannot be (see the fake-remote phrases in
  [search-strategy.md](search-strategy.md#fake-remote-and-location-traps)), or it is
  on-site/hybrid and `search.excludeOnSite` is true;
- the posting is clearly a scam ([search-strategy.md](search-strategy.md#scam-red-flags));
- any other dealbreaker the user stated during setup.

## Axis rubric (each 0–1)

**technical** — overlap between the posting's required stack/skills and
`profile.primaryStack` / `secondaryStack`, judged against the résumé (real experience
counts more than a listed keyword).
- 0.9–1.0: core requirements are the user's primary stack
- 0.6–0.8: most requirements match; one or two gaps that are learnable or secondary
- 0.3–0.5: partial match; the central requirement is outside the user's stack
- 0–0.2: different field

**salary** — against `salary.floor` (convert currency/period roughly; say so when you do).
- 1.0: at or above the floor
- 0.4: below the floor
- 0.7: not disclosed (neutral — missing data is not a penalty)
- no floor configured: 0.7

**location** — against `search.locations` / `countries`.
- 1.0: clearly remote from where the user lives (or in a target country)
- 0.7: ambiguous ("remote" with no region stated)
- 0.3: restricted region the user may or may not qualify for — explain
- hard filter instead when clearly incompatible

**seniority** — against `profile.seniority`.
- 1.0: matches
- 0.8: one level above (stretch roles are worth showing)
- 0.7: one level below
- 0.3: two or more levels away

**quality** — how much the posting tells you.
- 1.0: clear responsibilities, explicit stack, salary range, hiring process
- 0.5: generic but real
- 0.2: vague, no stack, no responsibilities, recruiter-agency boilerplate

## Example input to `add`

```json
[{
  "title": "Senior Backend Engineer",
  "company": "Example Inc",
  "location": "Remote — Americas",
  "salary": "USD 5,000–6,500/month",
  "link": "https://example.com/careers/123",
  "source": "Company careers page",
  "description": "Short summary in your own words (2–4 lines).",
  "axes": { "technical": 0.9, "salary": 1, "location": 1, "seniority": 1, "quality": 0.9 },
  "hardReject": null,
  "note": "optional — why it scored this way"
}]
```

Keep `description` a short paraphrase, not a copy of the full posting.
