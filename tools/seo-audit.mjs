// Lighthouse SEO audit across every built page.
//
// The goal is a 100 on Lighthouse's SEO category for every indexable page, and
// this is how you check that it is still true after a change. It builds the URL
// list from docs/ itself, so a new page is covered the moment it is built, with
// nothing to remember to add here.
//
//   node tools/serve-docs.mjs &        # must be running first
//   node tools/seo-audit.mjs           # audits everything
//   node tools/seo-audit.mjs /apps/ /  # or just these
//
// Exits non-zero if any page scores below 100, so it can gate a release.
//
// Lighthouse 12's SEO category is eleven audits, ten scored and one manual:
//   is-crawlable, document-title, meta-description, http-status-code, link-text,
//   crawlable-anchors, robots-txt, image-alt, hreflang, canonical
//   ...plus structured-data, which is manual and does not affect the score.
// See architecture.md, "Structured data", for the JSON-LD side of SEO.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const PORT = Number(process.env.SEO_AUDIT_PORT) || 8743;
const ORIGIN = `http://localhost:${PORT}`;
const ROOT = path.resolve('docs');
const CONCURRENCY = Number(process.env.SEO_AUDIT_CONCURRENCY) || 4;

// Pages that are meant to be invisible to search engines. Lighthouse marks
// `is-crawlable` as a failure on these, which is the correct result: we do not
// want a "website blocked" interstitial or a 404 turning up in Google. They are
// audited anyway, and only the is-crawlable failure is forgiven.
const INTENTIONALLY_NOINDEX = new Set(['/stop-wasting/', '/404.html']);

function collectUrls(dir = ROOT) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...collectUrls(full));
		else if (entry.name.endsWith('.html')) {
			const rel = path.relative(ROOT, full).split(path.sep).join('/');
			out.push(rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, ''));
		}
	}
	return out.sort();
}

function runLighthouse(url) {
	return new Promise((resolve) => {
		const args = [
			ORIGIN + url,
			'--only-categories=seo',
			'--output=json',
			'--output-path=stdout',
			'--chrome-flags=--headless=new --no-sandbox --disable-gpu',
			'--quiet',
		];
		const bin = path.resolve('node_modules/.bin/lighthouse');
		const proc = spawn(bin, args, { stdio: ['ignore', 'pipe', 'ignore'] });
		let buf = '';
		proc.stdout.on('data', (d) => (buf += d));
		proc.on('close', () => {
			try {
				const r = JSON.parse(buf);
				const failed = r.categories.seo.auditRefs
					.filter((ref) => {
						const a = r.audits[ref.id];
						return a && a.score !== null && a.score < 1;
					})
					.map((ref) => ref.id);
				resolve({ url, score: Math.round(r.categories.seo.score * 100), failed });
			} catch {
				resolve({ url, score: null, failed: ['could-not-run'] });
			}
		});
		proc.on('error', () => resolve({ url, score: null, failed: ['could-not-spawn'] }));
	});
}

const urls = process.argv.slice(2).length ? process.argv.slice(2) : collectUrls();

const probe = await fetch(ORIGIN + '/').catch(() => null);
if (!probe || !probe.ok) {
	console.error(`No server on ${ORIGIN}. Start one first:\n  node tools/serve-docs.mjs`);
	process.exit(2);
}

console.log(`Auditing ${urls.length} page${urls.length === 1 ? '' : 's'} on ${ORIGIN}\n`);

const results = [];
for (let i = 0; i < urls.length; i += CONCURRENCY) {
	const batch = urls.slice(i, i + CONCURRENCY);
	results.push(...(await Promise.all(batch.map(runLighthouse))));
	process.stderr.write(`  ${Math.min(i + CONCURRENCY, urls.length)}/${urls.length}\r`);
}
process.stderr.write('\n');

const real = results.filter((r) => {
	if (r.score === 100) return false;
	if (!INTENTIONALLY_NOINDEX.has(r.url)) return true;
	// Forgiven only for is-crawlable; anything else on these pages is still a bug.
	return r.failed.some((f) => f !== 'is-crawlable');
});
const forgiven = results.filter((r) => r.score !== 100 && !real.includes(r));

for (const r of forgiven) {
	console.log(`  ${String(r.score).padStart(3)}  ${r.url}  (noindex by design: ${r.failed.join(', ')})`);
}
if (real.length) {
	console.log('\nFAILURES:');
	for (const r of real) console.log(`  ${String(r.score ?? 'ERR').padStart(3)}  ${r.url}  ->  ${r.failed.join(', ')}`);
} else {
	console.log('\nEvery indexable page scores 100 on Lighthouse SEO.');
}

console.log(`\n${results.filter((r) => r.score === 100).length}/${results.length} at 100`);
process.exit(real.length ? 1 : 0);
