# Search strategy

Goal: a short list of **real, current** postings that fit `config.json` — not a long list
of everything that mentions a keyword.

## Where to look

Use the boards in `config.search.boards` first. If empty, pick from these by the user's
market and suggest adding the useful ones to config:

| Kind | Examples | Notes |
|---|---|---|
| General boards | LinkedIn Jobs, Indeed, Glassdoor | largest volume, most duplicates and stale posts |
| Remote-first boards | We Work Remotely, Remote OK, Remotive, Working Nomads | check the region restriction on every "remote" post |
| ATS pages (search them directly) | `boards.greenhouse.io`, `jobs.lever.co`, `jobs.ashbyhq.com`, `apply.workable.com` | the company's own posting — most reliable source |
| Tech-specific | Hacker News "Who is hiring?" (monthly), Wellfound (startups), Stack-specific communities | good signal, less noise |
| Local / national boards | the main boards of the user's country | ask the user which ones matter where they live |
| Company careers pages | targeted companies the user names | best for a shortlist of dream employers |

Prefer the **original posting** (company site or ATS) over aggregators: it has the full
text, the real location rules, and is less likely to be stale.

## Building queries

Web search engines and many boards accept operators. Combine role, stack, location and
exclusions:

```
"backend engineer" (node OR typescript) remote -senior -lead
site:jobs.lever.co "full stack" (react OR next.js) "remote"
site:boards.greenhouse.io "software engineer" "latin america" OR "latam"
intitle:"frontend" "react" remote "brazil" -internship
```

- Quotes for exact phrases; `OR` (uppercase) for alternatives; `-word` to exclude;
  `site:` to search one domain; `intitle:` for words in the page title.
- On LinkedIn's search bar, Boolean `AND` / `OR` / `NOT` must be uppercase and quotes and
  parentheses work; wildcards and brackets do not.
- Run several narrow queries rather than one broad one. Rotate role synonyms
  ("software engineer", "developer", "full stack", the local-language title).
- Add a recency hint when the engine supports it, and always check the posting date.

## Checking each result

Before rating a result, open it and confirm:
1. It is still open (not "no longer accepting applications", not years old).
2. Location rules are compatible — read the whole text, not just the header.
3. The company is real (website, LinkedIn page, other postings).
4. It is not a duplicate of something already tracked (`jobs.mjs seen` does this).

## Fake-remote and location traps

"Remote" in the header often means less. Phrases that usually restrict who can apply:
- "must reside in …", "must be located in …", "eligible locations only"
- "remote (US)", "remote within EMEA", "remote — must overlap 9–5 ET"
- "hybrid", "X days in office", "occasional travel to HQ" (check how occasional)
- "must be authorized to work in …", "no visa sponsorship"
- "contractor via employer-of-record" (fine, but changes salary and benefits)

When a phrase makes the job incompatible with `config.search`, that is a `hardReject`.
When it is unclear, use a low location rating and tell the user what to ask.

## Scam red flags

Treat as a hard reject (and warn the user) when a posting or recruiter:
- asks the candidate to pay for anything — equipment, training, "processing";
- writes from a free webmail address while claiming to be a known company;
- asks for ID documents or bank details before any real interview;
- pushes to decide immediately, or promises high pay for vague work;
- sends a check and asks for part of it back.

Verify through the company's own website or a contact you find independently, never the
one the recruiter gave.

## Reporting back

Tell the user which queries and boards you used, how many results you opened, how many
were new, and the ranked shortlist. If a board blocked automated access, say so and
offer [browser-search.md](browser-search.md) or a manual check.

## Sources

- LinkedIn Help — Use Boolean search on LinkedIn: https://www.linkedin.com/help/linkedin/answer/75814
- Google Search Help — Refine web searches: https://support.google.com/websearch/answer/2466433
- U.S. FTC — How to spot a job scam (2025): https://consumer.ftc.gov/consumer-alerts/2025/09/how-spot-job-scam
