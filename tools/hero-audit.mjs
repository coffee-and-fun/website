/**
 * Measure the shared tool hero as it actually computes on every page that uses
 * it. Tailwind v4 emits utilities inside @layer utilities, and unlayered page
 * CSS beats any layered rule regardless of specificity, so a page with its own
 * bare `h1 { font-size }` silently overrides the hero's sizing. Reading the
 * class list off the HTML would not catch that, only the computed value does.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join('docs', p);
  if (p.endsWith('/')) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('nope');
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const chrome = await launch({ chromeFlags: ['--headless=new', '--disable-gpu', '--hide-scrollbars'] });
const browser = await puppeteer.connect({
  browserURL: `http://localhost:${chrome.port}`,
  defaultViewport: { width: 1280, height: 900 },
});

const hero = JSON.parse(fs.readFileSync('src/_data/toolHero.json', 'utf8'));
const urls = Object.keys(hero).filter(k => k.startsWith('/')).sort();
const rows = [];

for (const url of urls) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}${url}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const h1s = [...document.querySelectorAll('h1')];
    const h1 = h1s[0];
    if (!h1) return { err: 'no h1' };
    const sec = h1.closest('section');
    const eyebrow = sec?.querySelector('p');
    const sub = sec ? [...sec.querySelectorAll('p')].pop() : null;
    const cs = getComputedStyle(h1);
    // does any doodle escape the hero's own box?
    const box = sec?.getBoundingClientRect();
    let escaped = 0;
    sec?.querySelectorAll('.sketch-note').forEach(n => {
      const b = n.getBoundingClientRect();
      if (b.left < box.left - 2 || b.right > box.right + 2 || b.bottom > box.bottom + 2) escaped++;
    });
    return {
      h1count: h1s.length,
      size: Math.round(parseFloat(cs.fontSize)),
      colour: cs.color,
      bg: getComputedStyle(sec || document.body).backgroundColor,
      eyebrowColour: eyebrow ? getComputedStyle(eyebrow).color : null,
      subSize: sub ? Math.round(parseFloat(getComputedStyle(sub).fontSize)) : null,
      doodles: sec?.querySelectorAll('.sketch-note').length ?? 0,
      escaped,
      align: cs.textAlign,
    };
  });
  rows.push([url, r]);
  await page.close();
}

// 1280px viewport is the lg breakpoint, so the title should be text-6xl = 60px
const WANT = 60, WANT_SUB = 20;
console.log('page'.padEnd(34) + 'h1  size  sub  align   doodles  esc  colour');
let bad = 0;
for (const [url, r] of rows) {
  if (r.err) { console.log('  ' + url.padEnd(32) + r.err); bad++; continue; }
  const off = r.size !== WANT || r.subSize !== WANT_SUB || r.h1count !== 1 || r.escaped > 0 || r.align !== 'center';
  if (off) bad++;
  console.log(
    (off ? '! ' : '  ') + url.padEnd(32) +
    String(r.h1count).padEnd(4) + String(r.size).padEnd(6) +
    String(r.subSize ?? '-').padEnd(5) + String(r.align).padEnd(8) +
    String(r.doodles).padEnd(9) + String(r.escaped).padEnd(5) + r.colour
  );
}
console.log('\n  off-spec pages: ' + bad + ' / ' + rows.length + '   (want h1 60px, sub 20px, centered, 4 doodles, 0 escaped)');

await browser.disconnect();
await chrome.kill();
server.close();
