# Exporting drafts to PDF

Drafts are Markdown. When the user wants a PDF (or `output.pdf` is true and they approved
the draft), convert it with pandoc and the plugin's stylesheet.

## Requirements

- [pandoc](https://pandoc.org/installing.html)
- one PDF engine; `weasyprint` is the easiest with CSS (`pip install weasyprint`), and
  `wkhtmltopdf` also works.

Check with `pandoc --version` and `weasyprint --version`. If missing, tell the user how to
install them and offer the Markdown or an HTML export instead — never fail silently.

## Command

```bash
pandoc "<workspace>/generated/<job-id>/resume.md" \
  --css "${CLAUDE_PLUGIN_ROOT}/templates/pdf-style.css" \
  --embed-resources --standalone \
  --metadata title="<Name> — Résumé" \
  --pdf-engine=weasyprint \
  -o "<workspace>/generated/<job-id>/resume.pdf"
```

- With wkhtmltopdf instead: `--pdf-engine=wkhtmltopdf --pdf-engine-opt=--enable-local-file-access`.
- Same command for `cover-letter.md`.
- Strip HTML comments and empty placeholder bullets from the draft first.
- Without a PDF engine, drop `--pdf-engine` and write `.html`; the user can print it to PDF
  from a browser.
- After exporting, tell the user the path and ask them to open it and check page breaks.

## Sources

- Pandoc user's guide: https://pandoc.org/MANUAL.html
