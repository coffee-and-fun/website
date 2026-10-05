// Structural release checks for every generated HTML page. Run after npm run build.
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
const root = path.resolve('docs');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []);
const failures = [], warnings = [], pages = walk(root);
const titles = new Map();
const productPaths = ['/stillkeys/', '/markdown-editor/', '/procrastinot/', '/immersive-reader/', '/hide-spoilers-extension/', '/instant-incognito/', '/flash-cards/'];
for (const file of pages) {
  const relative = path.relative(root, file);
  const url = '/' + relative.replace(/index\.html$/, '');
  const $ = load(fs.readFileSync(file, 'utf8'));
  const check = (ok, issue) => { if (!ok) failures.push({ url, issue }); };
  check($('.cf-header').length === 1, 'Expected exactly one shared header');
  check($('.cf-site-footer').length === 1, 'Expected exactly one shared footer');
  const skip = $('.cf-skip').attr('href');
  check(skip && $('[id]').toArray().some(e => $(e).attr('id') === skip.slice(1)), 'Skip link must target a real element');
  check($('html').attr('lang') === 'en', 'Missing document language');
  check($('title').text().trim().length > 0, 'Missing page title');
  check($('meta[name="description"]').attr('content')?.length > 0, 'Missing description');
  if (!['/private-line/', '/drop-dungeon/'].includes(url)) check($('h1').length === 1, 'Expected exactly one H1');
  const canonical = $('link[rel="canonical"]').attr('href');
  if (url !== '/404.html') check(canonical === 'https://www.coffeeandfun.com' + url, `Unexpected canonical: ${canonical}`);
  $('script[type="application/ld+json"]').each((_, e) => {
    try { JSON.parse($(e).text()); } catch { failures.push({ url, issue: 'Invalid JSON-LD' }); }
  });
  const title = $('title').text();
  if (titles.has(title)) warnings.push({ url, issue: 'Duplicate title with ' + titles.get(title) });
  titles.set(title, url);
  for (const element of $('img').toArray()) {
    check($(element).attr('alt') !== undefined, 'Image missing alt: ' + $(element).attr('src'));
  }
  // Crawl all first-party content links, including absolute same-origin links.
  $('main a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href.startsWith('/') && !href.startsWith('https://www.coffeeandfun.com/')) return;
    const target = new URL(href, 'https://www.coffeeandfun.com');
    const destination = path.join(root, target.pathname, path.extname(target.pathname) ? '' : 'index.html');
    check(fs.existsSync(destination), 'Broken first-party content link: ' + href);
  });
  // Check first-party destinations in shared chrome and redesigned product pages.
  const links = $('.cf-header a, .cf-site-footer a' + (productPaths.includes(url) || url === '/resources/' ? ', main a' : ''));
  links.each((_, element) => {
    const href = $(element).attr('href');
    check(href && href !== '#', 'Empty link destination');
    if (!href || !href.startsWith('/')) return;
    const [route, hash] = href.split('#');
    const destination = path.join(root, route, path.extname(route) ? '' : 'index.html');
    check(fs.existsSync(destination), 'Missing local destination: ' + href);
    if (hash && fs.existsSync(destination)) {
      const target = load(fs.readFileSync(destination, 'utf8'));
      check(target('[id]').toArray().some(e => target(e).attr('id') === hash), 'Missing destination anchor: ' + href);
    }
  });
}
const report = { pages: pages.length, failures, warnings };
fs.mkdirSync('audits', { recursive: true });
fs.writeFileSync('audits/site-quality.json', JSON.stringify(report, null, 2) + '\n');
console.log(`${pages.length} pages checked; ${failures.length} failures; ${warnings.length} warnings.`);
for (const failure of failures) console.log(failure.url, failure.issue);
process.exitCode = failures.length ? 1 : 0;
