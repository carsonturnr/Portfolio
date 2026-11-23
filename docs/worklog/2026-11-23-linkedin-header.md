# LinkedIn header and share image

## What
- New img/linkedin-header.png (1200 × 627) for the LinkedIn Featured card.
- New img/og.png (1200 × 630) replaces img/og.jpg; og:image tags on every page point at it.
- Source page docs/linkedin-header.html draws one koi with the site's own koi.js and fonts.

## Why
Share previews still showed the old site, and the LinkedIn card needed an image in the site's style.

## Decisions
- Just a koi and the URL, no name or role: the card is shown about 240 px wide next to the profile, and the title already carries the name.
- One koi instead of two; two crowded the frame and read worse at thumbnail size.
- The koi code runs unchanged except its last line, so the image matches the live pond.
- New filename (og.png) so link-preview caches fetch it fresh.

## How to re-render
Serve the repo root (python3 -m http.server 8765), open docs/linkedin-header.html (add ?h=630 for the og size) in a 1200-wide headless Chromium, wait for document.title to be "done", then screenshot.

## Follow-ups
- Refresh LinkedIn's cached preview with its Post Inspector if the old image still shows.
