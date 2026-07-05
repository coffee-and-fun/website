// .eleventy.mjs (ESM-style config for Eleventy v3)

import { minify as htmlminify } from 'html-minifier-terser';
import svgContents from 'eleventy-plugin-svg-contents';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

const createSocialImageForArticle = async (input, output) => {
	try {
		// `canvas` is a native module that frequently fails to load (missing
		// system libs like libpixman on fresh machines / CI). Import it lazily
		// so a broken canvas install can never take down the whole build — this
		// helper is opt-in and not wired into the default build.
		const { createCanvas, loadImage } = await import('canvas');

		const data = fs.readFileSync(input, 'utf-8');
		const match = data.match(/cardTitle:(.*)/);
		if (!match) {
			console.warn(`⚠️  Skipping social image: no "cardTitle:" frontmatter in ${input}`);
			return;
		}

		const post = {
			title: match[1],
			author: 'coffeeandfun.com'
		};

		const width = 1200;
		const height = 627;
		const canvas = createCanvas(width, height);
		const context = canvas.getContext('2d');

		const splashSolid = await loadImage('./tools/images/splash-1.png');
		const splashStriped = await loadImage('./tools/images/splash-2.png');
		const helperbirdLogo = await loadImage('./tools/images/helperbird-logo.png');

		context.fillStyle = '#450a75';
		context.fillRect(0, 0, width, height);

		const titleText = formatTitle(post.title);
		context.font = "bold 50pt 'PT Sans'";
		context.textAlign = 'center';
		context.fillStyle = '#ffffff';
		context.fillText(titleText[0], 600, 260);
		if (titleText[1]) {
			context.fillText(titleText[1], 600, 360);
		}

		context.font = "25pt 'PT Sans'";
		context.fillText(`${post.author}`, 650, 525);

		context.drawImage(helperbirdLogo, 455, 475, 70, 70);
		context.drawImage(splashSolid, 1000, 0, 403, 409);
		context.drawImage(splashSolid, 200, 500, 403, 409);
		context.drawImage(splashStriped, -80, 48, 348, 252);
		context.drawImage(splashStriped, 1000, 400, 348, 252);
		context.drawImage(splashStriped, 100, 600, 348, 252);

		const outputDir = path.dirname(output);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		await new Promise((resolve, reject) => {
			const stream = fs.createWriteStream(output);
			stream.on('finish', resolve);
			stream.on('error', reject);
			canvas.createPNGStream({ quality: 1.0 }).pipe(stream);
		});
	} catch (e) {
		console.error(`❌ Error generating social image for ${input}:`, e);
		throw e;
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

	const tagMap = {
		h1: 'leading-relaxed font-display text-pretty text-3xl mb-8 font-bold text-gray-900',
		h2: 'leading-relaxed font-display text-pretty text-2xl mb-6 mt-12 font-semibold text-gray-800',
		h3: 'leading-relaxed font-display text-pretty text-xl mb-4 mt-10 font-semibold text-gray-700',
		h4: 'leading-relaxed font-display text-pretty text-lg mb-4 mt-8 font-semibold text-gray-600',
		p: 'leading-relaxed font-display mb-4 mt-4 text-pretty text-lg text-gray-900',
		strong: 'text-lg font-semibold text-pretty text-gray-800',
		bold: 'font-bold text-pretty text-gray-900',
		ul: 'list-disc list-inside mt-4 space-y-2 pl-6 text-pretty text-lg font-display ml-6 mb-8 text-gray-900',
		ol: 'list-decimal list-inside mt-4 space-y-2 pl-6 text-pretty text-lg font-display ml-6 mb-8 text-gray-900',
		li: 'mb-2 text-pretty text-lg font-display text-gray-900 items-center',
		table:
			'table-auto w-full border-collapse border border-gray-300 text-pretty text-lg font-display text-gray-900 mt-4 mb-8',
		thead: 'bg-gray-100',
		th: 'border border-gray-300 px-6 py-4 text-pretty text-left text-gray-700 font-medium',
		tr: 'odd:bg-gray-50 even:bg-white',
		td: 'border border-gray-300 px-6 py-4 text-pretty text-gray-900',
		img: 'w-full h-auto rounded-2xl mb-8 border-gray-300 border-2',
		hr: 'divider divider-neutral my-10',
		a: 'text-lg text-pretty text-blue-600 hover:text-blue-800 underline mx-2',
		iframe: 'w-full h-96 rounded-2xl shadow-lg my-10',
		blockquote: 'border-l-4 border-gray-300 pl-4 italic text-pretty text-gray-700 my-4',
		code: 'bg-gray-100 text-pretty text-gray-800 rounded p-2 text-sm font-mono',
		pre: 'bg-gray-100 p-4 rounded overflow-x-auto'
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

		// Service-worker precache list. Only the core shell goes here — everything
		// else is cached at runtime as it's requested. Precaching the whole docs/
		// tree would force every first-time visitor to download the entire site.
		const coreAssets = [
			`/assets/css/engine.css${assetVersions.css ? `?v=${assetVersions.css}` : ''}`,
			'/assets/fonts/Pacifico-Regular.woff2',
			'/assets/fonts/Caveat-Regular.woff2',
			'/assets/fonts/Caveat-SemiBold.woff2',
			'/assets/fonts/Caveat-Bold.woff2',
			'/assets/images/favicon.png',
			'/assets/images/coffee-and-fun-logo-dark.png'
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
