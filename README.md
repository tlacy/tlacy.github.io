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

If you'd like, I can add a small GitHub Actions workflow to automatically publish the site or run HTML checks on PRs.
## Enabling Giscus comments

1. Create a GitHub Discussions category in this repository (Settings → Discussions → Categories). Note the category name.
2. Install and authorize Giscus by visiting the Giscus site or follow the steps at https://giscus.app/ — it will generate the `data-repo`, `data-repo-id`, `data-category`, and `data-category-id` values for you.
3. Replace the placeholder attributes in `index.html` in the Giscus `<div class="giscus">` block with the values returned by Giscus.

If you'd like, I can set this for you if you provide the repository and category details (or allow me to create the discussion category).
Just my initial website
