# Resume opens in a new tab

## What
- All 10 links to resume.pdf (header nav on every page, homepage footer, 404) now have `target="_blank" rel="noopener"`.

## Why
Opening the resume should not navigate away from the site.

## Decisions
- `rel="noopener"` only. The link is same-origin, so `noreferrer` adds nothing.
- No other links changed.

## Follow-ups
- None.
