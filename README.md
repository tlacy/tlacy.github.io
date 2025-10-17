# tlacy.github.io

This repository contains the static website for tomlacy.net.

## Overview
- `index.html` — Main landing page (bio, passions, feeds, comment placeholder, chat placeholder).
- `career.md` / `TomL-career.md` — Career content and notes.
- `content.json` — Editable JSON used by `index.html` for hero, profile image, resume link, and passions.
- `css/main.css` — Site styles.
- `manage.html` — Local browser-based editor to edit `career.md` and `content.json` and download updated copies for manual commit.
- `TomALacy.pdf` — Resume referenced from the hero section.
- `img/` — Profile images and site images.

## How to edit
1. Locally edit `content.json` and `career.md` using your editor, or open `manage.html` in a browser for a simple in-browser editor.
2. Commit changes and push to `main`.

## Run locally

The easiest way to preview the site locally is to run a simple HTTP server in the repo root (Python 3):

```bash
cd /path/to/tlacy.github.io
python3 -m http.server 8000
# open http://localhost:8000 in your browser
```

## Publish

This repo is set up for GitHub Pages. When the `main` branch is selected as the Pages source (root), the site will be available at `https://tlacy.github.io`.

## How I published

I initialized a local git repository, committed the site files, and pushed them to the GitHub repository `tlacy/tlacy.github.io` on the `main` branch. The repository is configured to serve Pages from the `main` branch (root). If GitHub Pages is selected in Settings → Pages, the site will appear at `https://tlacy.github.io` within a few minutes.

If you want automatic CI/CD instead of manual pushes, I can add a GitHub Actions workflow that builds and deploys to Pages on each push to `main`.

## Notes & next steps
- Comments: a Giscus placeholder is included in `index.html`. To enable, create a GitHub Discussions category and update the Giscus attributes.
- Chat/LLM: chat is currently a placeholder; to add a personal LLM you'd add a serverless backend to index `career.md` and `content.json` into embeddings and serve a chat UI.
- Privacy: IP-collection was intentionally removed. No analytics are enabled by default.

If you'd like, I can add a small GitHub Actions workflow to automatically publish the site or run HTML checks on PRs.
Just my initial website
