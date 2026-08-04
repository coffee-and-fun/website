// Blog social-card generator, purple background, cream "blob" text plates,
// chunky red uppercase headline, Coffee & Fun logo at the bottom.
//
// Usage:
//   node tools/social-card.mjs <output.png> "First headline" ["Second headline"]
//
// Each headline becomes its own cream blob; lines wrap automatically.
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bundle a heavy display font so cards render identically on every machine
// (a teammate's laptop, CI, the scheduled launchd job) instead of depending on
// a system "Arial Black" that may or may not be installed. Falls back to a
// system heavy sans if the bundled file is ever missing.
try {
	registerFont(path.join(__dirname, 'fonts', 'ArchivoBlack.ttf'), { family: 'CoffeeHeadline' });
} catch (e) {
	console.warn('social-card: bundled font not registered, using system fallback:', e.message);
}

const [, , output, ...paragraphs] = process.argv;
if (!output || paragraphs.length === 0) {
	console.error('Usage: node tools/social-card.mjs <output.png> "Headline one" ["Headline two"]');
	process.exit(1);
}

const W = 1200;
const H = 630;
const PURPLE = '#41206f';
const CREAM = '#faf0c4';
const RED = '#e8261d';
const FONT = (size) =>
	`${size}px 'CoffeeHeadline', 'Arial Black', 'Helvetica Neue', Helvetica, sans-serif`;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

ctx.fillStyle = PURPLE;
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
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
};

// Pick a font size that lets everything fit above the logo zone.
const MAX_TEXT_WIDTH = 980;
const PLATE_PAD_X = 40;
const PLATE_PAD_Y = 14;
const GROUP_GAP = 44;
const LOGO_ZONE = 150;

let size = 84;
let groups;
let totalTextHeight;
const measure = () => {
	const LINE_H = size * 1.22;
	totalTextHeight =
		groups.reduce((sum, g) => sum + g.length * (LINE_H + PLATE_PAD_Y) + PLATE_PAD_Y, 0) +
		GROUP_GAP * (groups.length - 1);
	return totalTextHeight;
};
do {
	groups = paragraphs.map((p) => wrap(p, size, MAX_TEXT_WIDTH));
	if (measure() <= H - LOGO_ZONE - 60) break;
	size -= 4;
} while (size > 40);

const LINE_H = size * 1.22;
let y = Math.max(40, (H - LOGO_ZONE - totalTextHeight) / 2);

ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

for (const lines of groups) {
	ctx.font = FONT(size);
	// One rounded cream plate per line (overlapping lines merge into a blob),
	// drawn with a soft drop shadow so the sticker lifts off the purple.
	ctx.save();
	ctx.shadowColor = 'rgba(30,8,50,0.32)';
	ctx.shadowBlur = 28;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 13;
	ctx.fillStyle = CREAM;
	lines.forEach((line, i) => {
		const w = ctx.measureText(line).width + PLATE_PAD_X * 2;
		const x = (W - w) / 2;
		roundRect(x, y + i * LINE_H - 4, w, LINE_H + PLATE_PAD_Y, 34);
		ctx.fill();
	});
	ctx.restore();
	ctx.fillStyle = RED;
	lines.forEach((line, i) => {
		ctx.fillText(line, W / 2, y + i * LINE_H + (LINE_H + PLATE_PAD_Y) / 2 - 6);
	});
	y += lines.length * LINE_H + PLATE_PAD_Y * 2 + GROUP_GAP - PLATE_PAD_Y;
}

// Logo bottom-center (resolved relative to this file so cwd doesn't matter).
const logo = await loadImage(
	path.join(__dirname, '..', 'src', 'assets', 'images', 'brand', 'coffee-and-fun-logo-dark.png')
);
const logoH = 96;
const logoW = (logo.width / logo.height) * logoH;
ctx.drawImage(logo, (W - logoW) / 2, H - logoH - 30, logoW, logoH);

fs.writeFileSync(output, canvas.toBuffer('image/png'));
console.log('wrote', output);
