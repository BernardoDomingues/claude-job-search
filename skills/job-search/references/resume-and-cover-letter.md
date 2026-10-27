# Résumé and cover letter

The résumé in `profile/resume.md` is the source of truth. Reviewing it improves that
file (with the user's approval); tailoring produces a copy in `generated/<job-id>/` and
never changes the source.

## Writing strong bullets

Each bullet should show an outcome, not a duty. A practical shape, popularized by
Google's former head of People Operations Laszlo Bock:

> **Accomplished [X], as measured by [Y], by doing [Z].**

- **X** — the result (what changed because of you)
- **Y** — the evidence: a number, a percentage, a before/after, a scale
- **Z** — what you actually did (the technical or human work)

| Weak | Stronger |
|---|---|
| Responsible for the checkout API | Cut checkout API p95 latency from 900 ms to 250 ms by adding query caching and removing N+1 calls |
| Worked on onboarding | Reduced new-customer onboarding from 5 days to 1 by building a self-service setup flow |

When there is no number, use scale (users, requests, team size), a comparison, or a
concrete consequence. **Never invent a number.** If a strong bullet needs a metric the
user did not give, ask for it.

## Review checklist

- Starts with name, contact, location/time zone, LinkedIn/GitHub.
- A 2–3 line summary that states role, years, core stack, and what kind of problems.
- Reverse-chronological; most recent role gets the most bullets.
- Bullets start with a verb, show outcomes, and use the vocabulary of the target roles.
- One to two pages; no photo, age, marital status or full address unless the target
  market expects it.
- Consistent dates, tenses and formatting; no typos.
- Skills section mirrors real experience — nothing listed that the user could not
  discuss in an interview.

## Applicant tracking systems (ATS)

Many companies parse résumés automatically before a human reads them:
- Use a simple single-column layout and standard section titles ("Experience",
  "Education", "Skills").
- Avoid text inside images, tables or text boxes for important content.
- Use the exact terms from the posting where they are true for the user
  ("PostgreSQL", not only "SQL databases").
- Export to PDF from the Markdown source ([pdf-export.md](pdf-export.md)) or plain .docx
  if the posting asks for it.

## Tailoring to a posting

Produce `generated/<job-id>/resume.md` (and `cover-letter.md` when useful):
1. List the posting's must-haves and nice-to-haves.
2. Map each to evidence in `profile/resume.md`. Mark gaps honestly.
3. Reorder: put the most relevant role/project bullets first; trim unrelated ones.
4. Rephrase using the posting's vocabulary **only where it describes what the user really
   did**.
5. Adjust the summary to the role.
6. Write in the posting's language.
7. Tell the user what you changed and which gaps remain (to prepare for in interviews).

## Cover letter

Short — three paragraphs, under one page, no repeated résumé.
1. **Why this company / role** — something specific from the posting or company.
2. **Why you** — two or three pieces of evidence that match their must-haves, with
   results.
3. **Close** — availability, interest in a conversation, thanks.

Avoid generic openings ("I am writing to apply…") and inflated adjectives. The tone should
sound like the user — if they gave writing samples, follow them.

## Sources

- Laszlo Bock, "My Personal Formula for a Winning Resume", LinkedIn (2014), as reported in:
  https://www.govexec.com/management/2016/03/google-just-revealed-incredibly-simple-formula-killer-resumes/126536
