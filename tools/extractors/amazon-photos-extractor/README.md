# Amazon Photos extractor (local)

This small script attempts to extract direct image-file URLs from a public Amazon Photos shared album page. It uses Puppeteer and is intended to be run locally (it may not work on non-public or JS-protected albums).

Caveats:
- Amazon Photos pages are not designed as image-hosting endpoints and may render images through dynamic scripts, obfuscated URLs, or short-lived tokens. This script is best-effort and may not return every image or may return page-level assets.
- Use this locally. Do not run in untrusted CI environments because it fetches third-party content.

Usage:

1. Install dependencies (from this folder):

```bash
cd tools/extractors/amazon-photos-extractor
npm install
```

2. Run the extractor and write results to a file:

```bash
node index.js "https://www.amazon.com/photos/shared/...." > images.json
```

3. Inspect `images.json` and then use the repo helper `tools/update-content.js` to insert the list into `content.json`.

Optional: download extracted images into the repo

If you prefer to host thumbnails locally (so they always render), the extractor can download the discovered image files into `img/gallery/` inside the repo and print the local paths instead of remote URLs:

```bash
# from this folder
node index.js "https://www.amazon.com/photos/shared/..." --download > local-images.json
```

`local-images.json` will contain paths like `img/gallery/photo-...jpg` which you can then pass to `tools/update-content.js`.
