// Blog social/OG card generator: deep-purple background, yellow rounded "blob"
// plates hugging each line, chunky red Bloc Bold headline, Coffee & Fun logo bottom
// left and an optional topic badge bottom right.
//
// Usable two ways.
//
// As a CLI:
//   node tools/social-card.mjs <output.png> "Headline"
//   node tools/social-card.mjs <output.png> "Headline" --icon path/to/mark.png
//
// As a module (this is what the Eleventy build uses to backfill missing cards):
//   import { renderCard } from './tools/social-card.mjs';
//   await renderCard({ output, paragraphs: ['Headline'], icon: null });
//
// Pass the headline as ONE string. Lines wrap automatically and the plates
// overlap into a single sticker. Two strings makes two separate stickers with a
// gap between them, which is occasionally useful but is not the default look.
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bundle the display font so cards render identically on every machine
// (a teammate's laptop, CI, the scheduled launchd job) instead of depending on
// a locally installed copy. Falls back to a system heavy sans if it is missing.
let fontReady = false;
const ensureFont = () => {
	if (fontReady) return;
	try {
		registerFont(path.join(__dirname, 'fonts', 'Bloc-Bold.ttf'), {
			family: 'CoffeeHeadline',
			weight: '900'
		});
	} catch (e) {
		console.warn('social-card: bundled font not registered, using system fallback:', e.message);
	}
	fontReady = true;
};

// 1200x630 is the size social platforms actually want. The house style was
// designed at 800x420, so every measurement below is that design scaled 1.5x.
const W = 1200;
const H = 630;
const PURPLE = '#412070';
const YELLOW = '#fbf2b3';
const RED = '#eb2030';
const CREAM = '#fef5ec';

// Two card families share this renderer. Blog posts get the deep purple field,
// which is the default so the Eleventy backfill keeps producing what it always
// did. Page cards (the /assets/images/social/pages/ set) sit on the site's own
// cream instead, so an OG card looks like the page it belongs to.
const THEMES = {
	blog: { bg: PURPLE, plate: YELLOW, ink: RED, logo: 'coffee-and-fun-logo.png' },
	// The dark logo, not the light one. The light mark is drawn for the purple
	// field and washes out to almost nothing on cream.
	page: { bg: CREAM, plate: YELLOW, ink: RED, logo: 'coffee-and-fun-logo-dark.png' }
};
// Weight 900 to match the reference design; the face is registered at that
// weight so canvas selects it rather than synthesising a fake bold.
const FONT = (size) =>
	`900 ${size}px 'CoffeeHeadline', 'Arial Black', 'Helvetica Neue', Helvetica, sans-serif`;

const MAX_TEXT_WIDTH = 1010;
const PLATE_PAD_X = 34; // "spread": how far the plate reaches past the glyphs
const PLATE_RADIUS = 46; // "roundness"
const GROUP_GAP = 30;
const BOTTOM_ZONE = 168;

export async function renderCard({ output, paragraphs, icon = null, theme = 'blog' }) {
	const palette = THEMES[theme] || THEMES.blog;
	ensureFont();

	const canvas = createCanvas(W, H);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = palette.bg;
	ctx.fillRect(0, 0, W, H);

	const wrap = (text, size, maxWidth) => {
		ctx.font = FONT(size);
		const words = String(text).toUpperCase().split(/\s+/);
		const lines = [];
		let line = '';
		for (const word of words) {
			const probe = line ? line + ' ' + word : word;
			if (ctx.measureText(probe).width > maxWidth && line) {
				lines.push(line);
				line = word;
			} else {
				line = probe;
			}
		}
		if (line) lines.push(line);
		return lines;
	};

	const roundRect = (x, y, w, h, r) => {
		const rad = Math.min(r, h / 2, w / 2);
		ctx.beginPath();
		ctx.moveTo(x + rad, y);
		ctx.arcTo(x + w, y, x + w, y + h, rad);
		ctx.arcTo(x + w, y + h, x, y + h, rad);
		ctx.arcTo(x, y + h, x, y, rad);
		ctx.arcTo(x, y, x + w, y, rad);
		ctx.closePath();
	};

	// Shrink until the whole headline fits above the logo strip.
	let size = 96;
	let groups;
	let totalTextHeight;
	const measure = () => {
		const lh = size * 1.16;
		totalTextHeight =
			groups.reduce((sum, g) => sum + g.length * lh, 0) + GROUP_GAP * (groups.length - 1);
		return totalTextHeight;
	};
	do {
		groups = paragraphs.map((p) => wrap(p, size, MAX_TEXT_WIDTH));
		if (measure() <= H - BOTTOM_ZONE - 56) break;
		size -= 4;
	} while (size > 34);

	const LINE_H = size * 1.16;
	const PLATE_H = size * 1.3; // taller than the line so consecutive plates merge
	let y = Math.max(46, (H - BOTTOM_ZONE - totalTextHeight) / 2);

	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	for (const lines of groups) {
		ctx.font = FONT(size);

		// One rounded yellow plate per line. Because PLATE_H exceeds LINE_H they
		// overlap and read as a single hand-cut sticker, which is the whole effect.
		ctx.fillStyle = palette.plate;
		lines.forEach((line, i) => {
			const w = ctx.measureText(line).width + PLATE_PAD_X * 2;
			const cy = y + i * LINE_H + LINE_H / 2;
			roundRect((W - w) / 2, cy - PLATE_H / 2, w, PLATE_H, PLATE_RADIUS);
			ctx.fill();
		});

		ctx.fillStyle = palette.ink;
		lines.forEach((line, i) => {
			// Nudge down a touch: Bloc Bold sits high in its em box.
			ctx.fillText(line, W / 2, y + i * LINE_H + LINE_H / 2 + size * 0.04);
		});

		y += lines.length * LINE_H + GROUP_GAP;
	}

	// Logo bottom left (resolved relative to this file so cwd does not matter).
	const logo = await loadImage(
		path.join(__dirname, '..', 'src', 'assets', 'images', 'brand', palette.logo)
	);
	const logoH = 132;
	const logoW = (logo.width / logo.height) * logoH;
	ctx.drawImage(logo, 58, H - logoH - 34, logoW, logoH);

	// Optional topic badge bottom right, dropped into a cream circle so any
	// artwork sits on a consistent shape.
	if (icon) {
		try {
			const mark = await loadImage(path.resolve(icon));
			const D = 138;
			const cx = W - 58 - D / 2;
			const cy = H - 34 - D / 2;
			ctx.save();
			ctx.fillStyle = '#fdfaf0';
			ctx.beginPath();
			ctx.arc(cx, cy, D / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.clip();
			const scale = Math.min((D * 0.72) / mark.width, (D * 0.72) / mark.height);
			ctx.drawImage(
				mark,
				cx - (mark.width * scale) / 2,
				cy - (mark.height * scale) / 2,
				mark.width * scale,
				mark.height * scale
			);
			ctx.restore();
		} catch (e) {
			console.warn('social-card: icon skipped:', e.message);
		}
	}

	fs.mkdirSync(path.dirname(output), { recursive: true });
	fs.writeFileSync(output, canvas.toBuffer('image/png'));
	return { output, width: W, height: H, size };
}

// CLI entry point, only when this file is run directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const argv = process.argv.slice(2);
	const themeFlag = argv.indexOf('--theme');
	const theme = themeFlag === -1 ? 'blog' : argv[themeFlag + 1];
	if (themeFlag !== -1) argv.splice(themeFlag, 2);
	const iconFlag = argv.indexOf('--icon');
	const icon = iconFlag === -1 ? null : argv[iconFlag + 1];
	const rest = iconFlag === -1 ? argv : argv.slice(0, iconFlag).concat(argv.slice(iconFlag + 2));
	const [output, ...paragraphs] = rest;

	if (!output || paragraphs.length === 0) {
		console.error(
			'Usage: node tools/social-card.mjs <output.png> "Headline" [--icon <image>] [--theme blog|page]'
		);
		process.exit(1);
	}
	const r = await renderCard({ output, paragraphs, icon, theme });
	console.log('wrote', r.output, `${r.width}x${r.height}`, `type ${r.size}px`);
}
