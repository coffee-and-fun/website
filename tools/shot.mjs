/**
 * Screenshot pages out of docs/ with real headless Chrome.
 *
 * The editor preview pane suspends timers and rAF while hidden, so its
 * screenshots go stale and scrolling is ignored. This drives actual Chrome
 * instead, which is why it lives in the repo rather than the scratchpad:
 * puppeteer-core and chrome-launcher resolve from node_modules here. Both
 * arrive with Lighthouse, which the SEO gate already depends on.
 *
 *   node tools/shot.mjs <out-dir> <slug> [slug...]
 *   node tools/shot.mjs <out-dir> --full <slug>      # full-page capture
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

const argv = process.argv.slice(2);
const full = argv.includes('--full');
const [outDir, ...slugs] = argv.filter(a => a !== '--full');
if (!outDir || !slugs.length) {
  console.error('usage: node tools/shot.mjs <out-dir> [--full] <slug> [slug...]');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join('docs', p);
  if (p.endsWith('/')) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const chrome = await launch({
  chromeFlags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});
const browser = await puppeteer.connect({
  browserURL: `http://localhost:${chrome.port}`,
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 2 },
});

try {
  for (const slug of slugs) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${port}/${slug}/`, { waitUntil: 'networkidle0' });
    // fonts settle, and the sketch draw-in IntersectionObserver gets a chance to fire
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 900));
    const out = path.join(outDir, `${slug.replace(/\//g, '_') || 'home'}.png`);
    await page.screenshot({ path: out, fullPage: full });
    console.log('  ' + out);
    await page.close();
  }
} finally {
  await browser.disconnect();
  await chrome.kill();
  server.close();
}
