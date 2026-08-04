// .eleventy.mjs (ESM-style config for Eleventy v3)

import { minify as htmlminify } from 'html-minifier-terser';
import svgContents from 'eleventy-plugin-svg-contents';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { formatTitle } from './tools/format-title.js';
import orderCoffeeShopsByRating from './src/_data/sortedReviews.js';
import format from 'date-fns/format/index.js';
import parseISO from 'date-fns/parseISO/index.js';
import postcss from 'postcss';
import markdownIt from 'markdown-it';
import markdownItClass from '@toycode/markdown-it-class';
import markdownItAnchor from 'markdown-it-anchor';
import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';

// Backfill a social/OG card for any blog post whose `img` file is missing, so a
// new post can never ship without one. Existing cards are never touched, which
// keeps hand-made artwork safe. `canvas` is a native module that fails to load
// on some machines, so it is imported lazily inside a try/catch: a broken
// install degrades to "no card generated" rather than breaking the build.
const backfillSocialCards = async () => {
	const postsDir = 'src/pages/blog';
	if (!fs.existsSync(postsDir)) return;

	const wanted = [];
	for (const file of fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))) {
		const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
		const fm = raw.match(/^---\n([\s\S]*?)\n---/);
		if (!fm) continue;
		const img = (fm[1].match(/^img:\s*(.+)$/m) || [])[1];
		const headline = (fm[1].match(/^cardTitle:\s*(.+)$/m) || [])[1];
		if (!img || !headline) continue;
		const target = path.join('src', img.trim().replace(/^["']|["']$/g, ''));
		if (fs.existsSync(target)) continue;
		wanted.push({ target, headline: headline.trim().replace(/^["']|["']$/g, ''), file });
	}
	if (!wanted.length) return;

	try {
		const { renderCard } = await import('./tools/social-card.mjs');
		for (const { target, headline, file } of wanted) {
			await renderCard({ output: target, paragraphs: [headline] });
			console.log(`[social-card] generated ${target} for ${file}`);
		}
	} catch (e) {
		console.warn('[social-card] skipped, could not render:', e.message);
	}
};

export default function (eleventyConfig) {
	// Populated by the eleventy.before hook once the bundles are built.
	const assetVersions = { css: '' };

	eleventyConfig.addPassthroughCopy({ 'src/assets/': '/assets/' });

	eleventyConfig.addLiquidFilter('limit', (arr, limit) => arr.slice(0, limit));

	// JSON-safe stringify for embedding values inside <script type="application/ld+json">
	// blocks. Wraps strings in quotes and escapes quotes/backslashes/control chars, so
	// `"headline": {{ title | json }}` stays valid JSON regardless of frontmatter content.
	eleventyConfig.addLiquidFilter('json', (value) => JSON.stringify(value == null ? '' : value));

	// Real pixel dimensions for og:image:width/height. PNG is parsed directly
	// (IHDR bytes 16-24); other formats fall back to macOS sips, and any
	// failure returns '' so templates simply omit the tags rather than lie.
	const imageDimsCache = new Map();
	const imageDims = (src) => {
		if (!src || typeof src !== 'string') return null;
		const rel = src.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
		if (imageDimsCache.has(rel)) return imageDimsCache.get(rel);
		let dims = null;
		try {
			const file = path.join('src', rel);
			if (fs.existsSync(file)) {
				const buf = fs.readFileSync(file);
				if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
					dims = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
				} else {
					const out = execSync(`sips -g pixelWidth -g pixelHeight ${JSON.stringify(file)}`, {
						encoding: 'utf8'
					});
					const w = out.match(/pixelWidth: (\d+)/);
					const h = out.match(/pixelHeight: (\d+)/);
					if (w && h) dims = { w: Number(w[1]), h: Number(h[1]) };
				}
			}
		} catch {
			dims = null;
		}
		imageDimsCache.set(rel, dims);
		return dims;
	};
	eleventyConfig.addLiquidFilter('imageWidth', (src) => imageDims(src)?.w ?? '');
	eleventyConfig.addLiquidFilter('imageHeight', (src) => imageDims(src)?.h ?? '');

	eleventyConfig.addPlugin(svgContents);

	eleventyConfig.addCollection('orderedCoffeeShops', () => orderCoffeeShopsByRating);

	eleventyConfig.addFilter('date', (date, dateFormat) => {
		let parsed;
		if (date === 'now' || date === 'today') {
			parsed = new Date();
		} else if (typeof date === 'string') {
			parsed = parseISO(date);
		} else {
			parsed = date;
		}
		// Support strftime-style format tokens (e.g. %Y, %m, %d)
		const convertedFormat = dateFormat
			.replace(/%Y/g, 'yyyy')
			.replace(/%m/g, 'MM')
			.replace(/%d/g, 'dd')
			.replace(/%B/g, 'MMMM')
			.replace(/%b/g, 'MMM')
			.replace(/%e/g, 'd')
			.replace(/%H/g, 'HH')
			.replace(/%M/g, 'mm')
			.replace(/%S/g, 'ss');
		return format(parsed, convertedFormat);
	});
	const toDate = (input) => {
		if (input instanceof Date) return input;
		if (typeof input === 'string') return parseISO(input);
		return new Date(input);
	};

	eleventyConfig.addFilter('formatDateWithOrdinal', (dateString) => {
		try {
			return format(toDate(dateString), 'MMMM do, yyyy');
		} catch (error) {
			console.error('Error formatting date:', error);
			return dateString;
		}
	});

	eleventyConfig.addFilter('dateDisplay', (input) => format(toDate(input), 'MMMM do yyyy'));

	// html: true allows raw HTML in markdown. Safe only because all posts in src/pages/blog
	// are authored in-house. If guest contributions or scraped content ever land here, add
	// a sanitizer (e.g. DOMPurify in a transform) before rendering.
	const markdownOptions = {
		html: true,
		breaks: false,
		linkify: true
	};

	// Markdown gets its typography from `prose prose-lg` on the article element,
	// themed with brand colours in coco.css. This map used to carry 22 entries of
	// sizes, margins and colours that duplicated the plugin and lost to it: table
	// cells ended up with zero left padding, lists were indented 48px past the
	// body text with markers inside the box, links rendered blue with an 8px
	// margin either side, and every element carried a `font-display` class that
	// resolves to nothing. Only genuinely additive brand styling belongs here.
	const tagMap = {
		img: 'rounded-2xl border border-stone-200'
	};

	eleventyConfig.setLibrary(
		'md',
		markdownIt(markdownOptions)
			.use(markdownItClass, tagMap)
			.use(markdownItAnchor, { permalink: false })
	);

	eleventyConfig.addTransform('htmlmin', async (content, outputPath) => {
		if (process.env.ELEVENTY_ENV === 'production' && outputPath.endsWith('.html')) {
			try {
				return await htmlminify(content, {
					useShortDoctype: true,
					removeComments: true,
					collapseWhitespace: true,
					// Never delete a space outright. collapseWhitespace around an
					// ignoreCustomFragments placeholder otherwise eats the gap after
					// a tag that ends with a {{ }} expression ("10:06 PMon Sunday").
					conservativeCollapse: true,
					minifyCSS: true,
					minifyJS: true,
					// Skip Vue/Liquid-style template expressions so html-minifier doesn't
					// misparse things like `{{ x <= 5 ? 'a' : 'b' }}` as HTML tags.
					ignoreCustomFragments: [
						/<%[\s\S]*?%>/,
						/<\?[\s\S]*?\?>/,
						/\{\{[\s\S]*?\}\}/,
						/\{%[\s\S]*?%\}/
					]
				});
			} catch (err) {
				console.warn(`⚠️  htmlmin skipped ${outputPath}: ${err.message}`);
				return content;
			}
		}
		return content;
	});

	eleventyConfig.on('eleventy.before', async () => {
		await backfillSocialCards();

		const tailwindInputPath = path.resolve('./src/assets/css/coco.css');
		const tailwindOutputPath = './docs/assets/css/engine.css';
		const cssContent = fs.readFileSync(tailwindInputPath, 'utf8');
		const outputDir = path.dirname(tailwindOutputPath);

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const plugins = [tailwindcss()];
		if (process.env.ELEVENTY_ENV === 'production') {
			// mergeRules corrupts Tailwind v4's nested rules (it swaps `&:focus-within`
			// bodies between selectors), so it must stay off.
			plugins.push(cssnano({ preset: ['default', { mergeRules: false }] }));
		}
		const result = await postcss(plugins).process(cssContent, {
			from: tailwindInputPath,
			to: tailwindOutputPath
		});

		fs.writeFileSync(tailwindOutputPath, result.css);

		// Cache-busting versions for the core bundles. The service worker caches
		// static assets cache-first, so unversioned URLs would never update for
		// returning visitors.
		const hash = (p) =>
			fs.existsSync(p)
				? crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 10)
				: '';
		assetVersions.css = hash(tailwindOutputPath);

		// Service-worker precache list. Only the core shell goes here, everything
		// else is cached at runtime as it's requested. Precaching the whole docs/
		// tree would force every first-time visitor to download the entire site.
		const coreAssets = [
			`/assets/css/engine.css${assetVersions.css ? `?v=${assetVersions.css}` : ''}`,
			'/assets/fonts/Pacifico-Regular.woff2',
			'/assets/fonts/Caveat-Regular.woff2',
			'/assets/fonts/Caveat-SemiBold.woff2',
			'/assets/fonts/Caveat-Bold.woff2',
			'/assets/images/brand/favicon.png',
			'/assets/images/brand/coffee-and-fun-logo-dark.png'
		];
		const outputJsonPath = './docs/cache-assets.json';
		fs.writeFileSync(outputJsonPath, JSON.stringify(coreAssets, null, 2));
	});

	eleventyConfig.setLiquidOptions({
		dynamicPartials: false,
		strictFilters: false
	});

	eleventyConfig.addShortcode('bundledCss', () => {
		const v = assetVersions.css ? `?v=${assetVersions.css}` : '';
		return `<link href="/assets/css/engine.css${v}" rel="stylesheet" />`;
	});
	// Serve the service worker from the site root so its scope covers every page
	// (pages register navigator.serviceWorker.register('/service-worker.js')).
	eleventyConfig.addPassthroughCopy({ 'src/assets/js/service-worker.js': 'service-worker.js' });

	return {
		markdownTemplateEngine: 'liquid',
		dir: {
			data: '../_data',
			includes: '../_includes',
			input: 'src/pages/',
			output: 'docs'
		},
		// 👇 This allows output files like CNAME without extensions
		allowsFileExtensionsOnPermalinks: false
	};
}
