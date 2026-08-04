/**
 * Builds docs/sitemap.xml from the pages Eleventy actually produced.
 *
 * Why this is a post-build step and not a template:
 *
 * The old src/pages/sitemap.njk looped over `collections.all`, which is a list of
 * source files. That is one step removed from what ships, so it could not see two
 * things that matter:
 *
 *   1. Whether a page is actually indexable. `stop-wasting` carries
 *      <meta name="robots" content="noindex, nofollow"> and was still listed,
 *      which tells Google "index this" and "do not index this" at the same time.
 *   2. What the page claims as its canonical URL. The sitemap built its own URLs
 *      from `site.url + item.url`, so a canonical that disagreed would go unnoticed.
 *
 * Reading the built HTML fixes both by construction: the URL in the sitemap IS the
 * page's canonical, and a noindex page can never appear.
 *
 * About lastmod. Google only trusts lastmod if it is consistently accurate, and
 * ignores the whole signal when it is not. Two obvious sources are both wrong here:
 *
 *   - Frontmatter `date` is the publication date. Edit a 2015 post today and the
 *     sitemap still says 2015.
 *   - Git commit date inflates. A site-wide sweep (an em dash pass, a schema
 *     injection) touches every file, which would claim all 104 pages changed.
 *
 * So lastmod is driven by the rendered output instead. Each page's HTML is hashed
 * with the volatile parts stripped, and the date only moves when that hash moves.
 * The ledger lives in tools/sitemap-lastmod.json and is committed, so dates survive
 * across builds and across machines.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SITE = 'https://www.coffeeandfun.com';
const DOCS = 'docs';
const LEDGER = 'tools/sitemap-lastmod.json';

/** Every .html file under docs/, recursively. */
function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.name.endsWith('.html')) out.push(full);
	}
	return out;
}

/**
 * Strip the parts of a page that change between builds without the page itself
 * having changed. Without this, editing one CSS file would bump the asset version
 * query string on every page and claim the entire site was modified.
 */
function stableHash(html) {
	const normalised = html
		.replace(/\?v=[a-f0-9]+/g, '') // hashed asset URLs
		.replace(/<!--[\s\S]*?-->/g, '') // build comments
		.replace(/\s+/g, ' ') // whitespace churn from the minifier
		.trim();
	return crypto.createHash('sha256').update(normalised).digest('hex');
}

function isNoIndex(html) {
	const meta = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
	return !!meta && /noindex/i.test(meta[1]);
}

function canonicalOf(html) {
	const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
	return m ? m[1] : null;
}

const xmlEscape = (s) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildSitemap({ persist = false, today = new Date() } = {}) {
	if (!fs.existsSync(DOCS)) return { skipped: 'no docs directory' };

	const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : {};
	const stamp = today.toISOString().slice(0, 10);

	const pages = [];
	const problems = [];
	const skipped = [];

	for (const file of walk(DOCS).sort()) {
		const html = fs.readFileSync(file, 'utf8');
		const rel = path.relative(DOCS, file);

		if (isNoIndex(html)) {
			skipped.push({ file: rel, reason: 'noindex' });
			continue;
		}

		const canonical = canonicalOf(html);
		if (!canonical) {
			// A page that is indexable but declares no canonical cannot be placed in
			// the sitemap without guessing its URL, and guessing is how the old
			// template drifted. Surface it instead.
			problems.push(`${rel} is indexable but has no <link rel="canonical">`);
			continue;
		}
		if (!canonical.startsWith(SITE)) {
			problems.push(`${rel} canonical points off-site: ${canonical}`);
			continue;
		}

		const hash = stableHash(html);
		const previous = ledger[canonical];
		const lastmod = previous && previous.hash === hash ? previous.lastmod : stamp;

		pages.push({ url: canonical, lastmod, hash, changed: !previous || previous.hash !== hash });
	}

	// Two pages resolving to one canonical is a real duplicate-content signal, not
	// something to silently de-duplicate.
	const seen = new Map();
	for (const p of pages) {
		if (seen.has(p.url)) problems.push(`duplicate canonical ${p.url}`);
		seen.set(p.url, p);
	}

	if (problems.length) {
		throw new Error(`Sitemap build failed:\n  - ${problems.join('\n  - ')}`);
	}

	pages.sort((a, b) => a.url.localeCompare(b.url));

	const xml =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		pages
			.map(
				(p) =>
					`\t<url>\n\t\t<loc>${xmlEscape(p.url)}</loc>\n\t\t<lastmod>${p.lastmod}</lastmod>\n\t</url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	fs.writeFileSync(path.join(DOCS, 'sitemap.xml'), xml);

	if (persist) {
		const next = {};
		for (const p of pages) next[p.url] = { hash: p.hash, lastmod: p.lastmod };
		fs.writeFileSync(LEDGER, JSON.stringify(next, null, '\t') + '\n');
	}

	return {
		urls: pages.length,
		changed: pages.filter((p) => p.changed).map((p) => p.url),
		skipped,
		persisted: persist
	};
}
