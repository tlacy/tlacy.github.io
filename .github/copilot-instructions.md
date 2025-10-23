<!--
  Guidance for AI coding agents working on tlacy.github.io
  This file intentionally stays short and concrete — list the repo's important patterns,
  workflows, and files the agent should read or edit. Avoid high-level generic advice.
-->

# Copilot / AI agent instructions — tlacy.github.io

Summary
 - Small, static GitHub Pages site. No build toolchain. Primary runtime is plain browser JS that reads `content.json` and renders UI in `index.html`.

Why this matters
 - Changes are typically content edits (`content.json`, `career.md`) or small UI/UX tweaks to `index.html`/`css/main.css`/`js/*`.
 - Avoid adding dependencies or a bundler unless you propose and document the change (update package manifest and CI).

Essential files (read first)
 - `index.html` — main rendering code. Key runtime functions: `loadContentAndFeeds()` and `fetchAndRenderFeed()` (they implement image resolution, passions buttons, and feed fetching).
 - `content.json` — runtime content: hero, bio, `passions:[{label,feed}]`, `social`, `resume`, `profileImage`.
 - `manage.html` — browser-only editor for `career.md` and `content.json` (downloads edits for manual commit).
 - `css/main.css` — site styles and CSS variables (`:root`). Preserve rule order and variables where possible.
 - `js/plugins.js` — small polyfills and helpers (console stub). Keep global side effects minimal.

Primary workflows (how to test locally)
 - Run a static server from repo root and open in a browser:

   ```bash
   python3 -m http.server 8000
   # open http://localhost:8000
   ```

 - Edit `content.json` or `career.md` and verify via `manage.html` or by reloading the served page. Watch the DevTools console for messages like "Could not load content.json" or feed fetch warnings.

Patterns & conventions (concrete)
 - No Node/toolchain assumed: deliver browser-compatible JS (ES5/ES6). If you introduce build tooling, add a clear rationale, `package.json`, and CI changes.
 - Progressive enhancement: treat `content.json` as optional. UI already logs warnings and shows fallback content when it can't load.
 - Image lookup: `index.html` tries a short candidate list (e.g., `img/`, `images/`, `profile.jpg`) before falling back to the placeholder — follow this approach for new image logic.
 - Feeds: the UI uses the public RSS→JSON proxy `https://api.rss2json.com/v1/api.json?rss_url=`. When changing feed behavior consider CORS, rate-limits, and failures (the code filters by recency, 30 days).
 - Comments: Giscus block in `index.html` is a placeholder — don't populate `data-repo` / `data-category` values unless you have correct repo/category IDs.

Small examples (copyable)
 - content.json shape (minimal):

   {
     "name": "Your Name",
     "title": "Short tagline",
     "bio": "Short bio",
     "profileImage": "img/profile.png",
     "resume": "Resume.pdf",
     "passions": [{"label":"Tech","feed":"https://rss.example.com/tech.xml"}],
     "social": {"linkedin":"https://..."}
   }

 - Local preview command:

   ```bash
   python3 -m http.server 8000
   ```

Risk / don't-change notes
 - Do not migrate the repo to a bundler or add Node dependencies without an issue/PR describing the benefits and rollout plan.
 - Do not change GitHub Pages branch/source without coordination; the repo expects Pages from `main` (root). See `README.md` for publishing notes.

Quick actionable improvements you can add (optional)
 - A tiny GitHub Action that validates `content.json` is valid JSON and that referenced `img/` files exist before merge.
 - Client-side caching for feed results to reduce calls to the RSS→JSON proxy.

Workflows added in this repo
 - `.github/workflows/validate-content.yml` — validates `content.json` on push and pull requests. It parses `content.json` and checks that `profileImage` and `resume` (if present) exist in the repo, and performs basic `passions` shape checks.
 - `.github/workflows/deploy-pages.yml` — an opt-in, manual (workflow_dispatch) deploy workflow. It's manual by default to prevent accidental publishes. If you want automatic publishes on push, edit the workflow and set a repo secret `ENABLE_PAGES_DEPLOY` (instructions are commented in the workflow).

Example: add a new passion feed (PR checklist)
 1. Edit `content.json` and add a new entry to `passions`, for example:

      {
         "label": "Photography",
         "feed": "https://rss.example.com/photography.xml"
      }

 2. Run the local preview and verify the feed appears in the page and that clicking the passion button fetches recent posts.
 3. Commit with a clear message (e.g., "content update: add Photography passion feed").
 4. Open a PR — the `validate-content` workflow will run and fail if `content.json` is invalid or references missing files.

PR checklist for content changes
 - [ ] `content.json` is valid JSON (no trailing commas).
 - [ ] Any referenced local files (images, resume) exist in `img/` or repo root.
 - [ ] New feed URLs are valid (optional: check in a browser or via rss2json proxy).
 - [ ] Previewed locally via `python3 -m http.server 8000`.


Commit message examples
 - content update: "Update content.json — change hero text / passions"
 - style tweak: "Tweak hero spacing in css/main.css"
 - small feature: "Add client-side recent-feed caching to index.html (no build)"

Where to ask questions
 - If something in the runtime or publishing flow is unclear, edit the README or ask for exact `data-repo` and `data-category` values before enabling comments (Giscus).

If you'd like, I can expand this with a publish workflow (GitHub Actions) or provide a ready-to-add JSON validator Action — tell me which and I'll add it.
<!--
  Guidance for AI coding agents working on tlacy.github.io
  Keep this file concise and specific to the repository structure and workflows.
-->

# Copilot / AI agent instructions — tlacy.github.io

This is a small, static GitHub Pages site (plain HTML/CSS/JS). Below are the concrete, repo-specific facts an AI agent should know to be productive without human hand-holding.

1. Big picture
   - The site is a static single-site layout served from the repo root via GitHub Pages. See `index.html` (hero, passions, feeds, comments) and `css/main.css` for styling.
   - Dynamic content is driven by `content.json` (hero text, profile image, passions, social links, resume). `index.html` loads `content.json` at runtime and renders hero, passions, and feeds in client-side JS.
   - `manage.html` is a local browser-based editor allowing non-destructive editing of `career.md` and `content.json`. It does not write to the repo — users download changed files and commit manually.
   - JavaScript is lightweight and browser-first: `js/plugins.js` contains console/polyfill helpers; `js/main.js` is intentionally minimal/empty (placeholder); `js/alert.js` and `js/button.js` contain small bits of behavior/React examples. Avoid introducing build tools unless adding a clear benefit.

2. Primary workflows an agent will perform
   - Local preview: run a simple static server from repo root (e.g. `python3 -m http.server 8000`) and open `http://localhost:8000` to verify pages and `content.json` changes.
   - Editing content: modify `content.json` (examples in repo) and `career.md`; verify changes in `manage.html` and in `index.html` when served locally.
   - Comments: `index.html` includes a Giscus placeholder — do not enable or change it unless you have valid `data-repo` and `data-category` values. See `README.md` for setup steps.

3. Code and conventions to follow
   - Keep the site static: assume no Node toolchain present. New JS should be browser-compatible ES5/ES6 and avoid imports that require bundling unless you add a package manifest and CI changes.
   - Use progressive enhancement: add features that degrade gracefully if `content.json` is missing or feeds fail (the page already logs warnings and shows fallback content). Example: `loadContentAndFeeds()` in `index.html` demonstrates this pattern.
   - Profile image resolution: `index.html` attempts several candidate paths before falling back to `img/` default; follow the same candidate-list approach if adding alternate image lookups.
   - Feed fetching uses a public RSS-to-JSON proxy (`https://api.rss2json.com/v1/api.json?rss_url=`). If you modify feed logic, keep CORS and rate-limits in mind.

4. Files and places to edit for common tasks (examples)
   - Change hero text or passions: edit `content.json`. The shape is { name, title, bio, profileImage, resume, passions:[{label,feed}], social:{...} }.
   - Add an image: place files under `img/` and reference them from `content.json` or `index.html`.
   - Fix CSS: `css/main.css` is the single stylesheet. Keep rule order and existing CSS variables (`:root`) consistent.
   - Add interactivity: prefer small, self-contained scripts under `js/`; keep global side-effects minimal and use feature-detection (see `js/plugins.js` polyfill pattern).

5. Tests / validation (manual checks)
   - Preview site locally with a static server and spot-check `index.html`, `manage.html`, and `career.html` after edits.
   - Validate `content.json` is parseable JSON; `index.html` will silently fail if it is invalid. Example quick check: open developer console and look for "Could not load content.json" warnings.

6. Dont change without coordination
   - Do not migrate the repo to a bundler (webpack/rollup/Vite) or add Node dependencies without opening an issue/PR describing why — the site is intentionally simple.
   - Do not change GitHub Pages settings (branch/source) — the README documents current behavior (Pages served from `main` root).

7. Example commit message templates
   - content update: "Update content.json — change hero text / passions"
   - style tweak: "Tweak hero spacing in css/main.css"
   - small feature: "Add client-side recent-feed caching to index.html (no build)"

If anything in this file is unclear or you want instructions expanded (e.g., add a GitHub Actions publish workflow or tests), tell me which section to expand and I'll iterate.
