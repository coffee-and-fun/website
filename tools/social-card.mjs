// Blog social/OG card generator: forest-green background, yellow rounded "blob"
// plates hugging each line, chunky red BlocC headline, Coffee & Fun logo bottom
// left and an optional topic badge bottom right.
//
// Usage:
//   node tools/social-card.mjs <output.png> "First headline" ["Second headline"]
//   node tools/social-card.mjs <output.png> "Headline" --icon src/assets/images/blog/foo.png
//
// Each headline becomes its own group of plates; lines wrap automatically and
// overlapping plates merge into one sticker, which is the look we want.
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bundle the display font so cards render identically on every machine
// (a teammate's laptop, CI, the scheduled launchd job) instead of depending on
// a locally installed copy. Falls back to a system heavy sans if it is missing.
try {
	registerFont(path.join(__dirname, 'fonts', 'BlocC-Regular.ttf'), { family: 'CoffeeHeadline' });
} catch (e) {
	console.warn('social-card: bundled font not registered, using system fallback:', e.message);
}

const argv = process.argv.slice(2);
const iconFlag = argv.indexOf('--icon');
const iconPath = iconFlag === -1 ? null : argv[iconFlag + 1];
const rest = iconFlag === -1 ? argv : argv.slice(0, iconFlag).concat(argv.slice(iconFlag + 2));
const [output, ...paragraphs] = rest;

if (!output || paragraphs.length === 0) {
	console.error(
		'Usage: node tools/social-card.mjs <output.png> "Headline one" ["Headline two"] [--icon <image>]'
	);
	process.exit(1);
}

// 1200x630 is the size social platforms actually want. The house style was
// designed at 800x420, so every measurement below is that design scaled 1.5x.
const W = 1200;
const H = 630;
const GREEN = '#3b563e';
const YELLOW = '#fbf2b3';
const RED = '#eb2030';
const FONT = (size) =>
	`${size}px 'CoffeeHeadline', 'Arial Black', 'Helvetica Neue', Helvetica, sans-serif`;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

ctx.fillStyle = GREEN;
ctx.fillRect(0, 0, W, H);

// Wrap text into lines that fit maxWidth at the given font size.
const wrap = (text, size, maxWidth) => {
	ctx.font = FONT(size);
	const words = text.toUpperCase().split(/\s+/);
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

// Leave room for the logo strip along the bottom.
const MAX_TEXT_WIDTH = 1010;
const PLATE_PAD_X = 34; // "spread": how far the plate reaches past the glyphs
const PLATE_RADIUS = 46; // "roundness"
const GROUP_GAP = 30;
const BOTTOM_ZONE = 168;

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
	ctx.fillStyle = YELLOW;
	lines.forEach((line, i) => {
		const w = ctx.measureText(line).width + PLATE_PAD_X * 2;
		const cy = y + i * LINE_H + LINE_H / 2;
		roundRect((W - w) / 2, cy - PLATE_H / 2, w, PLATE_H, PLATE_RADIUS);
		ctx.fill();
	});

	ctx.fillStyle = RED;
	lines.forEach((line, i) => {
		// Nudge down a touch: BlocC sits high in its em box.
		ctx.fillText(line, W / 2, y + i * LINE_H + LINE_H / 2 + size * 0.04);
	});

	y += lines.length * LINE_H + GROUP_GAP;
}

// Logo bottom left (resolved relative to this file so cwd does not matter).
const logo = await loadImage(
	path.join(__dirname, '..', 'src', 'assets', 'images', 'brand', 'coffee-and-fun-logo.png')
);
const logoH = 132;
const logoW = (logo.width / logo.height) * logoH;
ctx.drawImage(logo, 58, H - logoH - 34, logoW, logoH);

// Optional topic badge bottom right, dropped into a cream circle so any
// artwork sits on a consistent shape.
if (iconPath) {
	try {
		const icon = await loadImage(path.resolve(iconPath));
		const D = 138;
		const cx = W - 58 - D / 2;
		const cy = H - 34 - D / 2;
		ctx.save();
		ctx.fillStyle = '#fdfaf0';
		ctx.beginPath();
		ctx.arc(cx, cy, D / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.clip();
		const scale = Math.min((D * 0.72) / icon.width, (D * 0.72) / icon.height);
		const iw = icon.width * scale;
		const ih = icon.height * scale;
		ctx.drawImage(icon, cx - iw / 2, cy - ih / 2, iw, ih);
		ctx.restore();
	} catch (e) {
		console.warn('social-card: icon skipped:', e.message);
	}
}

fs.writeFileSync(output, canvas.toBuffer('image/png'));
console.log('wrote', output, `${W}x${H}`, `type ${size}px`);
