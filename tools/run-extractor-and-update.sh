#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXTRACTOR_DIR="$ROOT_DIR/tools/extractors/amazon-photos-extractor"
OUT_JSON="$ROOT_DIR/tools/local-images.json"

if [ -z "$1" ]; then
  echo "Usage: $0 <amazon-photos-shared-album-url>"
  exit 2
fi

ALBUM_URL="$1"

echo "Running extractor in $EXTRACTOR_DIR"
cd "$EXTRACTOR_DIR"

echo "Installing extractor dependencies (this may download Chromium)"
npm install --no-audit --no-fund

echo "Extracting and downloading images for: $ALBUM_URL"
node index.js --download "$ALBUM_URL" > "$OUT_JSON"

echo "Updating content.json with extracted images"
cd "$ROOT_DIR/tools"
node update-content.js --images "$OUT_JSON"

echo "Done. Backups of content.json are saved with .bak.<timestamp>. Check $OUT_JSON for the image list."
#!/usr/bin/env bash
# Convenience script: run the Puppeteer extractor locally, download images into img/gallery,
# then update content.json with the produced local image paths.
# Run this from the repo root on your machine where Node and Puppeteer can install/run.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXTRACTOR_DIR="$ROOT_DIR/tools/extractors/amazon-photos-extractor"
OUT_JSON="$ROOT_DIR/tools/local-images.json"

if [ -z "$1" ]; then
  echo "Usage: $0 <amazon-photos-shared-album-url>"
  exit 2
fi

ALBUM_URL="$1"

echo "Running extractor in $EXTRACTOR_DIR"
cd "$EXTRACTOR_DIR"

echo "Installing extractor dependencies (this may download Chromium)"
npm install --no-audit --no-fund

echo "Extracting and downloading images for: $ALBUM_URL"
node index.js --download "$ALBUM_URL" > "$OUT_JSON"

echo "Updating content.json with extracted images"
cd "$ROOT_DIR/tools"
node update-content.js --images "$OUT_JSON"

echo "Done. Backups of content.json are saved with .bak.<timestamp>. Check $OUT_JSON for the image list."
