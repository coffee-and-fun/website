// Build-time shaping of netflix.json for /netflix/ — sorts the 1,900+ genre
// codes alphabetically, groups them into A–Z sections, and pre-computes the
// "popular filter" chips so the page ships zero of this work to the browser.
const raw = require('./netflix.json');

// netflix.json is an array holding a single { "code": "Category name" } object.
const source = Array.isArray(raw) ? raw[0] : raw;

// A handful of scraped names carry trailing menu junk after a newline
// ("TV Shows\n ... Subgenres ..."); the first line is the real name.
function cleanName(value) {
	return String(value == null ? '' : value)
		.split('\n')[0]
		.replace(/\s+/g, ' ')
		.trim();
}

const items = Object.keys(source)
	.map((id) => ({ id: id, name: cleanName(source[id]) }))
	.filter((item) => item.name)
	.sort((a, b) => a.name.localeCompare(b.name, 'en'));

// A–Z sections. Every current name starts with A–Z; anything else would land
// in a leading "#" group (digits sort before letters).
const groups = [];
for (const item of items) {
	const first = item.name.charAt(0).toUpperCase();
	const isLetter = first >= 'A' && first <= 'Z';
	const label = isLetter ? first : '#';
	const slug = isLetter ? first : 'other';
	let group = groups[groups.length - 1];
	if (!group || group.label !== label) {
		group = { label: label, slug: slug, items: [] };
		groups.push(group);
	}
	group.items.push(item);
}

// Popular filter chips — same keyword extraction the old page ran in the
// browser. Every tag is a substring of the names it was pulled from, so a
// plain text search for the tag finds the same rows.
const DECADES = /\b(1920s|1930s|1940s|1950s|1960s|1970s|1980s)\b/gi;
const GENRES = [
	'action', 'comedy', 'drama', 'horror', 'thriller', 'sci-fi', 'fantasy',
	'documentary', 'romance', 'crime', 'war', 'western', 'anime'
];
const LANGUAGES = ['british', 'french', 'japanese', 'chinese', 'spanish', 'italian', 'korean', 'indian'];

const tagCounts = new Map();
function bump(tag) {
	tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
}
for (const item of items) {
	const seen = new Set();
	const decades = item.name.match(DECADES);
	if (decades) decades.forEach((d) => seen.add(d.toLowerCase()));
	for (const genre of GENRES) {
		if (new RegExp('\\b' + genre + '\\b|\\b' + genre + 's\\b', 'i').test(item.name)) seen.add(genre);
	}
	const lower = item.name.toLowerCase();
	for (const lang of LANGUAGES) {
		if (lower.includes(lang)) seen.add(lang);
	}
	seen.forEach(bump);
}

const popularTags = [...tagCounts.entries()]
	.sort((a, b) => b[1] - a[1])
	.slice(0, 20)
	.map(([tag]) => tag);

module.exports = {
	total: items.length,
	totalText: items.length.toLocaleString('en-US'),
	groups: groups,
	popularTags: popularTags
};
