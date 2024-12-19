const lodash = require('lodash');
const htmlmin = require('html-minifier');
const svgContents = require('eleventy-plugin-svg-contents');
const pluginPWA = require('./tools/eleventy-plugin-pwa');
const fs = require('fs');
const path = require('path');
const eleventyVue = require("@11ty/eleventy-plugin-vue");
const { createCanvas, loadImage } = require('canvas');
const { formatTitle } = require('./tools/format-title');
const orderCoffeeShopsByRating = require('./src/_data/sortedReviews.js');
const moment = require('moment');


const createSocialImageForArticle = (input, output) =>
	new Promise(async (resolve, reject) => {
		// read data from input file
		try {
			const data = fs.readFileSync(input, {
				encoding: 'utf-8'
			});

			// get title from file data
			const [, title] = data.match(/cardTitle:(.*)/);

			const post = {
				title: title,
				author: 'coffeeandfun.com'
			};

			const width = 1200;
			const height = 627;
			// Set the coordinates for the image position.
			const imagePosition = {
				w: 70,
				h: 70,
				x: 455,
				y: 475
			};
			// Because we are putting the image near the top (y: 75)
			// move the title down.
			const titleY = 260;
			const titleLineHeight = 100;
			// Bring up the author's Y value as well to make it all
			// fit together nicely.
			const authorY = 525;

			const canvas = createCanvas(width, height);
			const context = canvas.getContext('2d');

			const splashSolid = await loadImage('./tools/images/splash-1.png');
			const splashStriped = await loadImage('./tools/images/splash-2.png');
			const helperbirdLogo = await loadImage('./tools/images/helperbird-logo.png');

			context.fillStyle = '#450a75';
			context.fillRect(0, 0, width, height);

			context.font = "bold 50pt 'PT Sans'";
			context.textAlign = 'center';
			context.fillStyle = '#ffffff';

			const titleText = formatTitle(post.title);
			context.fillText(titleText[0], 600, titleY);
			if (titleText[1]) {
				context.fillText(titleText[1], 600, titleY + titleLineHeight);
			}

			context.font = "25pt 'PT Sans'";
			context.textAlign = 'center';
			context.fillStyle = '#ffffff';
			context.fillText(`${post.author}`, 650, authorY);

			const { w, h, x, y } = imagePosition;
			context.drawImage(helperbirdLogo, x, y, w, h);
			context.drawImage(splashSolid, 1000, 0, 403, 409);
			context.drawImage(splashSolid, 200, 500, 403, 409);
			context.drawImage(splashStriped, -80, 48, 348, 252);
			context.drawImage(splashStriped, 1000, 400, 348, 252);
			context.drawImage(splashStriped, 100, 600, 348, 252);

			const outputDir = path.dirname(output);
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			// write the output image

			const stream = fs.createWriteStream(output);
			stream.on('finish', resolve);
			stream.on('error', reject);
			canvas
				.createPNGStream({
					quailty: 1.0
				})
				.pipe(stream);
		} catch (e) {
			console.error(this.inputPath, e);
			console.error(e);
		}
	});

const manifest = {
	'main.js': '/assets/js/main.bundle.js',
	'main.css': '/assets/js/main.css'
};
const format = require('date-fns/format');

const { tr } = require('date-fns/locale');

module.exports = function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy({ 'src/assets/': '/assets/' });
	eleventyConfig.addLiquidFilter('limit', (arr, limit) => arr.slice(0, limit));
	eleventyConfig.addPlugin(eleventyVue);
	eleventyConfig.addPlugin(pluginPWA, {
		swDest: './docs/service-worker.js',
		globDirectory: './docs'
	});
	eleventyConfig.addPlugin(svgContents);

	eleventyConfig.addCollection('orderedCoffeeShops', function (collectionApi) {

		let filler = orderCoffeeShopsByRating;
		 	console.log('filler',filler);
	    return filler;
	  });


	  
	// add `date` filter
	eleventyConfig.addFilter('date', function (date, dateFormat) {
		return format(date, dateFormat);
	});

	eleventyConfig.addFilter('formatDateWithOrdinal', function (dateString) {
		console.log(dateString);
		try {
			const date2 = moment(dateString);
			const formattedDate = date2.format('MMMM Do, YYYY');

			return formattedDate;
		} catch (error) {
			console.error('Error formatting date:', error);
			return dateString; // Fallback to returning the original string
		}
	});
	// Random Filter: With the help from google search engine
	eleventyConfig.addFilter('shuffle', (arr) => lodash.shuffle(arr));

	eleventyConfig.addFilter('dateDisplay', function (input) {
		let xx = moment(input).format('MMMM Do YYYY');
		return xx;
	});

	let markdownIt = require('markdown-it');
	let markdownItClass = require('@toycode/markdown-it-class');
	let markdownItAnchor = require('markdown-it-anchor');
	let options = {
		html: true,
		breaks: false,
		linkify: true
	};

	const mapping = {
	
		h1: 'leading-relaxed font-display text-3xl mb-8 font-bold text-gray-900',
		h2: 'leading-relaxed font-display text-2xl mb-6 mt-12 font-semibold text-gray-800',
		h3: 'leading-relaxed font-display text-xl mb-4 mt-10 font-semibold text-gray-700',
		h4: 'leading-relaxed font-display text-lg mb-4 mt-8 font-semibold text-gray-600',
		p: 'leading-relaxed font-display mb-4 mt-4 text-lg text-gray-900',
		strong: 'text-lg font-semibold text-gray-800',
		bold: 'font-bold text-gray-900',
		ul: "leading-relaxed list-disc list-inside mt-4 space-y-2 pl-6 text-lg font-display ml-6 mb-8 text-gray-900",
		ol: "leading-relaxed list-decimal list-inside mt-4 space-y-2 pl-6 text-lg font-display ml-6 mb-8 text-gray-900",
		li: "leading-relaxed mb-2 text-lg font-display text-gray-900 flex items-center",
		table: "table-auto w-full border-collapse border border-gray-300 text-lg font-display text-gray-900 mt-4 mb-8",
		thead: "bg-gray-100",
		th: "border border-gray-300 px-4 py-2 text-left text-gray-700 font-medium",
		tbody: "",
		tr: "odd:bg-gray-50 even:bg-white",
		td: "border border-gray-300 px-4 py-2 text-gray-900",
		img: 'aspect-square rounded-2xl mb-8 shadow-lg',
		hr: 'divider divider-neutral my-10',
		a: 'leading-relaxed font-sans text-lg text-blue-500 hover:text-blue-700 underline',
		iframe: 'w-full h-96 rounded-xl shadow-lg my-10',
		blockquote: 'border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4',
		code: 'bg-gray-100 text-gray-800 rounded p-2 text-sm font-mono',
		pre: 'bg-gray-100 p-4 rounded overflow-x-auto'

	  
};
eleventyConfig.addTransform('htmlmin', function (content, outputPath) {
	if (process.env.ELEVENTY_ENV === 'production' && outputPath.endsWith('.html')) {
		return htmlmin.minify(content, {
			useShortDoctype: true,
			removeComments: true,
			collapseWhitespace: true
		});
	}
	return content;
});
eleventyConfig.setLibrary('md', markdownIt(options).use(markdownItClass, mapping)
.use(markdownItAnchor, {
	permalink: false // or true if you want automatic anchor links
})
);

	eleventyConfig.addShortcode("youtubeEmbed", function(id) {
		return `
		<div class="mt-2 mb-8 bg-stone-200 rounded-2xl aspect-w-16 aspect-h-9">
			<iframe id="videos" class="rounded-md shadow-2xl ring-1 ring-gray-900/10" src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
		</div>`;
	  });


	eleventyConfig.setLibrary('md', markdownIt(options).use(markdownItClass, mapping));
	eleventyConfig.setLiquidOptions({
		dynamicPartials: false,
		strictFilters: false // renamed from `strict_filters` in Eleventy 1.0
	});
	// Add a shortcode for bundled CSS.
	eleventyConfig.addShortcode('bundledCss', function () {
		return manifest['main.css'] ? `<link href="${manifest['main.css']}" rel="stylesheet" />` : '';
	});

	// Add a shortcode for bundled JS.
	eleventyConfig.addShortcode('bundledJs', function () {
		return manifest['main.js'] ? `<script src="${manifest['main.js']}"></script>` : '';
	});
	return {
		markdownTemplateEngine: 'liquid',
		dir: {
			data: '../_data',
			includes: '../_includes',
			input: 'src/pages/',
			output: 'docs'
		}
	};
};
