---
description: Draft a tailored résumé (and cover letter) for an approved job
argument-hint: "<job-id> [--no-letter]"
---

Tailor the user's material to one job, using the `job-search` skill.

- Arguments: $ARGUMENTS (first word is the job id; `--no-letter` skips the cover letter).
- Workspace: `JOB_SEARCH_WORKSPACE` or `./job-search`.

Steps:
1. `jobs.mjs show <job-id>`. If it is not `approved` (or `prepared`, for a redo), ask the
   user to confirm they want to pursue it, then `move` it to `approved` with a note.
2. Re-open the posting link for the full text if the stored description is not enough.
3. Follow `references/resume-and-cover-letter.md` → "Tailoring to a posting": write
   `generated/<job-id>/resume.md` and, unless skipped, `cover-letter.md`, in the posting's
   language. Facts come only from `profile/resume.md` — ask the user about anything
   missing instead of inventing it.
4. Show the user what changed and the gaps to prepare for. Apply their edits.
5. When they approve the draft: export to PDF if `output.pdf` is true
   (`references/pdf-export.md`), then `jobs.mjs move <job-id> prepared`.
6. Remind them that applying is theirs to do, and to tell you when they apply so you can
   record `applied`.
