# Searching with a real browser (optional)

Some boards render results with JavaScript or block plain HTTP fetching, so WebFetch sees
an empty page. If the user has a browser MCP server configured, you can drive a real
browser instead. This is optional — everything else works without it.

## Setup (user's side)

The Chrome DevTools MCP server is one option:

```bash
claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest
```

Other browser-automation MCP servers work the same way; use whatever tools are
available in the session (look for tools to open a page, take a text snapshot, click,
fill a field).

If Claude Code runs inside WSL, a container or a remote machine, the browser usually runs
on the host and must expose a remote-debugging port the MCP server can reach — check the
MCP server's documentation for connecting to an existing browser.

## Rules

- **Public pages only.** Do not log in on the user's behalf or type their credentials.
  If a board requires login, ask the user to log in themselves in that browser first, or
  skip the board.
- **Read, don't act.** Never click "Apply", "Easy Apply", "Message" or anything that
  sends data. Applying is the user's job (invariant 1).
- Respect the site: open a reasonable number of pages, no aggressive pagination loops.
- Prefer a text/accessibility snapshot over screenshots — cheaper and easier to parse.
- Copy the canonical posting URL into `link`, not a tracking redirect.

## Flow

1. Open the board's search URL with the query in the URL when possible.
2. Snapshot the results; collect title, company, location, link.
3. Open each promising posting, snapshot it, normalize it as in
   [search-strategy.md](search-strategy.md#checking-each-result).
4. Continue with `jobs.mjs seen` / `add` as usual.

## Sources

- Chrome DevTools MCP: https://github.com/ChromeDevTools/chrome-devtools-mcp
