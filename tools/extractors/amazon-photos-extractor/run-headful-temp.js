#!/usr/bin/env node
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const puppeteer = require('puppeteer');

const INDEX = require('./index.js');

async function run(url) {
  const puppeteerOptions = { headless: false };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  // copy of extract logic but with headful launch
  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    // try to expand and gather images like index.js
    const moreButtons = await page.$x("//button[contains(., 'Show more') or contains(., 'Load more') or contains(., 'Show all')]");
    for (const btn of moreButtons) { try { await btn.click(); await page.waitForTimeout(500); } catch(e){} }

    const images = await page.evaluate(() => {
      const urls = new Set();
      document.querySelectorAll('img').forEach(img => {
        if (img.src && (img.src.startsWith('http') || img.src.startsWith('//'))) urls.add(img.src.replace(/^\/\//, window.location.protocol + '//'));
      });
      document.querySelectorAll('*').forEach(el => {
        const bg = window.getComputedStyle(el).getPropertyValue('background-image');
        if (bg && bg !== 'none') {
          const m = bg.match(/url\(["']?(.*?)["']?\)/);
          if (m && m[1]) {
            let u = m[1]; if (u.startsWith('//')) u = window.location.protocol + u; urls.add(u);
          }
        }
      });
      return Array.from(urls);
    });

    const filtered = images.filter(u => /(jpe?g|png|webp)(?:\?|$)/i.test(u));

    if (argv.download || argv.d) {
      const outDir = path.resolve(__dirname, '..', '..', 'img', 'gallery');
      fs.mkdirSync(outDir, { recursive: true });
      const https = require('https');
      const http = require('http');
      const { URL } = require('url');
      const local = [];
      for (let i=0;i<filtered.length;i++){
        const src = filtered[i];
        try{
          const ext = (src.match(/\.(jpe?g|png|webp)(?:\?|$)/i)||[])[1]||'jpg';
          const fn = `hf-${Date.now()}-${i}.${ext}`;
          const out = path.join(outDir, fn);
          await new Promise((resolve,reject)=>{
            const u = new URL(src);
            const getter = u.protocol==='https:'?https:http;
            getter.get(u, (res)=>{
              if (res.statusCode>=300 && res.statusCode<400 && res.headers.location) return resolve();
              if (res.statusCode!==200) return reject(new Error('HTTP '+res.statusCode));
              const f = fs.createWriteStream(out); res.pipe(f); f.on('finish', ()=>{ f.close(resolve); }); f.on('error', reject);
            }).on('error', reject);
          });
          local.push(path.relative(path.resolve(__dirname, '..', '..'), out).replace(/\\/g,'/'));
        }catch(e){ console.error('dl failed', src, e && e.message); }
      }
      console.log(JSON.stringify(local, null, 2));
    } else {
      console.log(JSON.stringify(filtered, null, 2));
    }

    console.log('Keeping browser open 6s for inspection...');
    await page.waitForTimeout(6000);
    await browser.close();
  } catch (e) {
    console.error('Headful run failed:', e && e.message || e);
    try{ await browser.close(); }catch(e){}
    process.exit(1);
  }
}

const url = process.argv[2];
if (!url) { console.error('Usage: node run-headful-temp.js <url> [--download]'); process.exit(2); }
run(url).catch(e=>{ console.error(e); process.exit(1); });
