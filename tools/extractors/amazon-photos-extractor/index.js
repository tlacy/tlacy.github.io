#!/usr/bin/env node
const puppeteer = require('puppeteer');
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

async function extract(url, headless = true) {
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Amazon Photos uses dynamic loading; try to expand content and collect image urls
    // Wait a bit for lazy-loaded images
    await page.waitForTimeout(2000);

    // Attempt to click "Show more" or similar buttons if present
    const moreButtons = await page.$x("//button[contains(., 'Show more') or contains(., 'Load more') or contains(., 'Show all')]");
    for (const btn of moreButtons) {
      try { await btn.click(); await page.waitForTimeout(500); } catch (e) {}
    }

    // Collect potential image sources from <img> tags and background-image styles
    const images = await page.evaluate(() => {
      const urls = new Set();
      // img tags
      document.querySelectorAll('img').forEach(img => {
        if (img.src && (img.src.startsWith('http') || img.src.startsWith('//'))) {
          urls.add(img.src.replace(/^\/{2}/, window.location.protocol + '//'));
        }
      });
      // elements with inline background-image
      document.querySelectorAll('*').forEach(el => {
        const bg = window.getComputedStyle(el).getPropertyValue('background-image');
        if (bg && bg !== 'none') {
          const m = bg.match(/url\(["']?(.*?)["']?\)/);
          if (m && m[1]) {
            let u = m[1];
            if (u.startsWith('//')) u = window.location.protocol + u;
            urls.add(u);
          }
        }
      });
      return Array.from(urls);
    });

    // Heuristic filter: keep likely image files (jpg, jpeg, png, webp)
    const filtered = images.filter(u => /\.(jpe?g|png|webp)(?:\?|$)/i.test(u));

    await browser.close();
    return Array.from(new Set(filtered));
  } catch (err) {
    await browser.close();
    throw err;
  }
}

async function main() {
  const url = argv._[0] || argv.url || argv.u;
  const doDownload = !!(argv.download || argv.d);
  if (!url) {
    console.error('Usage: node index.js <amazon-photos-shared-album-url>');
    process.exit(2);
  }

  try {
    const images = await extract(url, true);
    if (!doDownload) {
      console.log(JSON.stringify(images, null, 2));
      return;
    }

    // Download each image into repo img/gallery/
    const outDir = path.resolve(__dirname, '..', '..', 'img', 'gallery');
    fs.mkdirSync(outDir, { recursive: true });

    async function downloadFile(fileUrl, outPath) {
      return new Promise((resolve, reject) => {
        const u = new URL(fileUrl);
        const getter = u.protocol === 'https:' ? https : http;
        getter.get(u, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // follow redirect
            return downloadFile(res.headers.location, outPath).then(resolve).catch(reject);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode} for ${fileUrl}`));
          }
          const file = fs.createWriteStream(outPath);
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', reject);
        }).on('error', reject);
      });
    }

    const localPaths = [];
    for (let i = 0; i < images.length; i++) {
      const src = images[i];
      try {
        const extMatch = src.match(/\.(jpe?g|png|webp)(?:\?|$)/i);
        const ext = extMatch ? extMatch[1] : 'jpg';
        const fname = `photo-${Date.now()}-${i}.${ext}`;
        const outPath = path.join(outDir, fname);
        await downloadFile(src, outPath);
        localPaths.push(path.relative(path.resolve(__dirname, '..', '..'), outPath).replace(/\\/g, '/'));
      } catch (e) {
        console.error('Failed to download', src, e.message || e);
      }
    }
    console.log(JSON.stringify(localPaths, null, 2));
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) main();
