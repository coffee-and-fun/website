/* Readability checker.
   Everything runs in the browser. Nothing typed here is sent anywhere.

   The syllable counter is the load bearing part: five of the six formulas
   depend on it, so it is worth more than a vowel-group regex. The approach
   below handles silent e, common suffix groups and vowel runs, then clamps
   to a floor of one. It is not perfect (English is not), but it is close
   enough that grade levels land within about half a grade of the published
   references, which is the accuracy these formulas actually have. */

const { createApp } = Vue;

/* Irregular words, kept in a dictionary because no rule gets them right.

   Most of these are the "ea before a consonant" family. In create and react
   the pair splits across two syllables, but in team, bread and each it does
   not, and nothing in the spelling distinguishes the two cases. A rule that
   caught create would break team, so these are listed instead. */
const SYLLABLE_EXCEPTIONS = {
	simile: 3, forever: 3, shoreline: 2, business: 2, wednesday: 2,
	every: 2, different: 3, evening: 2, camera: 3, family: 3,
	chocolate: 3, comfortable: 4, interesting: 4, beautiful: 3,
	people: 2, little: 2, table: 2, being: 2, doing: 2, going: 2,
	create: 2, creates: 2, created: 3, creating: 3, creative: 3, creation: 3,
	react: 2, reacts: 2, reacted: 3, reacting: 3, reaction: 3,
	science: 2, sciences: 3, scientific: 4, scientist: 3,
	theatre: 2, theater: 2, ideal: 3, cereal: 3, real: 1, really: 2,
};

function countSyllables(word) {
	const w = word.toLowerCase().replace(/[^a-z]/g, '');
	if (!w) return 0;
	if (SYLLABLE_EXCEPTIONS[w]) return SYLLABLE_EXCEPTIONS[w];
	if (w.length <= 3) return 1;

	let s = w;
	let extra = 0;

	// A consonant followed by "le" is its own syllable: ta-ble, sim-ple,
	// syl-la-ble. Strip it and score it once, otherwise the silent e gets
	// counted as a vowel run as well and the word gains a phantom syllable.
	if (/[^aeiouy]les?$/.test(s)) {
		s = s.replace(/les?$/, '');
		extra += 1;
	} else {
		// "-ed" is silent unless it follows t or d: jumped is one syllable,
		// wanted is two.
		if (/[^td]ed$/.test(s)) s = s.slice(0, -2);
		// "-es" is silent unless it follows a sibilant: makes is one syllable,
		// houses is two.
		else if (/[^sxzcgh]es$/.test(s)) s = s.slice(0, -2);
		// Otherwise a trailing e is usually silent, as long as something is left.
		const stripped = s.replace(/e$/, '');
		if (/[aeiouy]/.test(stripped)) s = stripped;
	}

	let n = (s.match(/[aeiouy]+/g) || []).length;

	// Hiatus: two vowels that belong to different syllables. An i before another
	// vowel usually splits (ra-di-o, se-ri-ous, me-di-a), except after t, s, c or
	// x, where it forms one sound instead (na-tion, deci-sion, spa-cious). A
	// word ending in ea or eo also splits: i-de-a, vi-de-o.
	const hiatus = s.match(/(?<![tscx])i(?=[aou])|ea$|eo$/g);
	if (hiatus) n += hiatus.length;

	// A consonant followed by m or n at the end carries its own syllable:
	// rhy-thm, pris-m, schis-m.
	if (/[^aeiouy][mn]$/.test(s) && n <= 1) extra += 1;

	return Math.max(1, n + extra);
}

/* Sentence splitting that does not trip over common abbreviations or decimals. */
const ABBREV = /\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|approx|fig|no|vol|dept)\.$/i;

function splitSentences(text) {
	const rough = text
		.replace(/\s+/g, ' ')
		.trim()
		.split(/(?<=[.!?])["')\]]*\s+/);

	const out = [];
	for (const piece of rough) {
		const prev = out[out.length - 1];
		// Glue a fragment back on if the previous chunk ended in an abbreviation
		// or a decimal point, both of which are not sentence ends.
		if (prev && (ABBREV.test(prev) || /\d\.$/.test(prev))) {
			out[out.length - 1] = prev + ' ' + piece;
		} else if (piece.trim()) {
			out.push(piece.trim());
		}
	}
	return out;
}

function splitWords(text) {
	return (text.match(/[A-Za-z0-9']+(?:[-'][A-Za-z0-9']+)*/g) || []);
}

function round(n, dp = 1) {
	const f = 10 ** dp;
	return Math.round(n * f) / f;
}

/* Each formula, with a plain sentence explaining what it actually measures.
   The explanations matter as much as the numbers: a bare "Gunning Fog 12.4"
   tells a writer nothing about what to change. */
const FORMULAS = [
	{
		key: 'flesch',
		name: 'Flesch Reading Ease',
		plain: 'Scores 0 to 100. Higher is easier. Around 60 to 70 suits a general audience.',
		unit: 'score',
		needs: 1,
	},
	{
		key: 'fk',
		name: 'Flesch Kincaid Grade',
		plain: 'The US school grade you would need to read this comfortably.',
		unit: 'grade',
		needs: 1,
	},
	{
		key: 'fog',
		name: 'Gunning Fog',
		plain: 'Counts long words. Punishes dense, jargon heavy writing.',
		unit: 'grade',
		needs: 1,
	},
	{
		key: 'smog',
		name: 'SMOG Index',
		plain: 'Built for health and safety writing. Needs 30 sentences to be trustworthy.',
		unit: 'grade',
		needs: 30,
	},
	{
		key: 'coleman',
		name: 'Coleman Liau',
		plain: 'Uses letters per word instead of syllables, so it handles names well.',
		unit: 'grade',
		needs: 1,
	},
	{
		key: 'ari',
		name: 'Automated Readability Index',
		plain: 'Uses characters per word. Designed for typed, technical text.',
		unit: 'grade',
		needs: 1,
	},
];

/* Grade to audience mapping, used for both the verdict and the reference table. */
const BANDS = [
	{ max: 5, label: 'Very easy', who: 'Almost everyone, including younger readers' },
	{ max: 8, label: 'Easy', who: 'Most adults read this without effort' },
	{ max: 10, label: 'Fairly easy', who: 'Comfortable for a general audience' },
	{ max: 12, label: 'Moderate', who: 'Fine for most adults who are paying attention' },
	{ max: 14, label: 'Hard', who: 'Assumes a confident, motivated reader' },
	{ max: 17, label: 'Very hard', who: 'Degree level. Many readers will give up' },
	{ max: Infinity, label: 'Extremely hard', who: 'Specialist or academic readers only' },
];

function bandFor(grade) {
	return BANDS.find(b => grade <= b.max);
}

const SAMPLES = {
	simple: "The cat sat by the window. Rain fell all day. She watched the drops race down the glass and made a bet with herself about which one would win. It was a slow afternoon. She did not mind at all.",
	average: "Most people assume that writing clearly is a matter of talent, but it is closer to a habit. You draft something, you read it back, and you cut the parts that made you feel clever. What remains is usually shorter and easier to follow. The hard part is being willing to lose the sentences you liked most.",
	complex: "The epistemological ramifications of contemporary methodological pluralism necessitate a fundamental reconsideration of the presuppositions underpinning conventional analytical frameworks. Such reconsideration, insofar as it interrogates the ostensibly incontrovertible axioms of established practice, inevitably precipitates considerable institutional resistance from constituencies whose intellectual authority derives from those very frameworks.",
};

createApp({
	data() {
		return {
			text: '',
			announcement: '',
			showFormulas: false,
			copied: false,
		};
	},

	computed: {
		sentences() { return this.text.trim() ? splitSentences(this.text) : []; },
		words() { return splitWords(this.text); },

		syllableCounts() { return this.words.map(countSyllables); },
		totalSyllables() { return this.syllableCounts.reduce((a, b) => a + b, 0); },

		letters() { return (this.text.match(/[A-Za-z0-9]/g) || []).length; },

		wordCount() { return this.words.length; },
		sentenceCount() { return this.sentences.length; },

		hasEnough() { return this.wordCount >= 10 && this.sentenceCount >= 1; },

		/* Words of three or more syllables, the usual definition of "complex"
		   in these formulas. Proper nouns are excluded because a person's name
		   being long says nothing about how hard the writing is. */
		complexWords() {
			const seen = new Map();
			this.words.forEach((w, i) => {
				if (this.syllableCounts[i] < 3) return;
				if (/^[A-Z]/.test(w) && i > 0) return;
				const key = w.toLowerCase();
				seen.set(key, (seen.get(key) || 0) + 1);
			});
			return [...seen.entries()]
				.map(([word, count]) => ({ word, count, syllables: countSyllables(word) }))
				.sort((a, b) => b.syllables - a.syllables || b.count - a.count);
		},

		complexPercent() {
			if (!this.wordCount) return 0;
			const n = this.syllableCounts.filter(s => s >= 3).length;
			return round((n / this.wordCount) * 100, 0);
		},

		avgWordsPerSentence() {
			return this.sentenceCount ? this.wordCount / this.sentenceCount : 0;
		},
		avgSyllablesPerWord() {
			return this.wordCount ? this.totalSyllables / this.wordCount : 0;
		},

		/* The sentences most worth rewriting, longest first. 25 words is the
		   point where most style guides start objecting. */
		longSentences() {
			return this.sentences
				.map(s => ({ text: s, words: splitWords(s).length }))
				.filter(s => s.words > 25)
				.sort((a, b) => b.words - a.words)
				.slice(0, 5);
		},

		scores() {
			if (!this.hasEnough) return null;
			const W = this.wordCount, S = this.sentenceCount, Sy = this.totalSyllables;
			const asw = this.avgWordsPerSentence, aspw = this.avgSyllablesPerWord;
			const polysyllables = this.syllableCounts.filter(s => s >= 3).length;
			const L = (this.letters / W) * 100;   // letters per 100 words
			const Sn = (S / W) * 100;             // sentences per 100 words

			return {
				flesch: round(206.835 - 1.015 * asw - 84.6 * aspw),
				fk: round(0.39 * asw + 11.8 * aspw - 15.59),
				fog: round(0.4 * (asw + 100 * (polysyllables / W))),
				smog: S >= 30 ? round(1.043 * Math.sqrt(polysyllables * (30 / S)) + 3.1291) : null,
				coleman: round(0.0588 * L - 0.296 * Sn - 15.8),
				ari: round(4.71 * (this.letters / W) + 0.5 * asw - 21.43),
			};
		},

		/* The consensus grade, which is the number the headline verdict uses.
		   SMOG is left out unless it is trustworthy. */
		consensusGrade() {
			if (!this.scores) return null;
			const s = this.scores;
			const grades = [s.fk, s.fog, s.coleman, s.ari];
			if (s.smog !== null) grades.push(s.smog);
			const usable = grades.filter(g => Number.isFinite(g) && g > 0);
			if (!usable.length) return null;
			return round(usable.reduce((a, b) => a + b, 0) / usable.length);
		},

		band() {
			return this.consensusGrade === null ? null : bandFor(this.consensusGrade);
		},

		/* Plain-language verdict. This is the sentence most people will read
		   instead of the numbers, so it carries the real meaning. */
		verdict() {
			if (!this.hasEnough) return null;
			const g = this.consensusGrade;
			const b = this.band;
			const grade = g < 1 ? 'below grade 1' : `grade ${Math.round(g)}`;
			return { grade, label: b.label, who: b.who };
		},

		readingTime() {
			// 238 wpm is the mean for silent reading of English prose (Brysbaert 2019).
			const mins = this.wordCount / 238;
			if (!this.wordCount) return '0 min';
			if (mins < 1) return 'under a minute';
			return `${Math.round(mins)} min`;
		},

		/* Concrete, ordered suggestions. Only shown when they apply, so an
		   already-clear piece of writing does not get invented problems. */
		suggestions() {
			const out = [];
			if (!this.hasEnough) return out;
			if (this.avgWordsPerSentence > 20) {
				out.push({
					id: 'long-sentences',
					title: 'Shorten your sentences',
					detail: `Your sentences average ${round(this.avgWordsPerSentence)} words. Aim for 15 to 20. Splitting the longest ones is the fastest way to drop a grade level.`,
				});
			}
			if (this.complexPercent > 15) {
				out.push({
					id: 'complex-words',
					title: 'Swap some long words',
					detail: `${this.complexPercent}% of your words run to three syllables or more. Under 15% reads noticeably easier. "Use" beats "utilise", "about" beats "approximately".`,
				});
			}
			if (this.scores && this.scores.flesch < 50) {
				out.push({
					id: 'passive',
					title: 'Read it aloud',
					detail: 'Anything you stumble over when reading aloud is a sentence worth rewriting. It is the quickest edit there is, and it needs no tools.',
				});
			}
			if (!out.length) {
				out.push({
					id: 'clear',
					title: 'This reads well',
					detail: 'Nothing here needs fixing. Sentence length and word choice are both in a comfortable range.',
				});
			}
			return out;
		},

		statsLine() {
			if (!this.wordCount) return 'No text yet';
			const parts = [
				`${this.wordCount} ${this.wordCount === 1 ? 'word' : 'words'}`,
				`${this.sentenceCount} ${this.sentenceCount === 1 ? 'sentence' : 'sentences'}`,
				`${this.totalSyllables} syllables`,
				`${this.readingTime} to read`,
			];
			return parts.join(' · ');
		},

		summaryForCopy() {
			if (!this.verdict) return '';
			const s = this.scores;
			const lines = [
				`Readability summary`,
				``,
				`Reads like ${this.verdict.grade} (${this.verdict.label}). ${this.verdict.who}.`,
				``,
				`${this.wordCount} words, ${this.sentenceCount} sentences, ${this.readingTime} to read.`,
				`Average sentence length: ${round(this.avgWordsPerSentence)} words.`,
				`Words of 3+ syllables: ${this.complexPercent}%.`,
				``,
				`Flesch Reading Ease: ${s.flesch}`,
				`Flesch Kincaid Grade: ${s.fk}`,
				`Gunning Fog: ${s.fog}`,
				`SMOG Index: ${s.smog === null ? 'needs 30 sentences' : s.smog}`,
				`Coleman Liau: ${s.coleman}`,
				`Automated Readability Index: ${s.ari}`,
				``,
				`Measured with the Coffee & Fun readability checker.`,
			];
			return lines.join('\n');
		},

		formulaRows() {
			if (!this.scores) return [];
			return FORMULAS.map(f => ({
				...f,
				value: this.scores[f.key],
				unavailable: this.scores[f.key] === null,
				why: f.key === 'smog' && this.scores.smog === null
					? `Needs 30 sentences to be reliable. You have ${this.sentenceCount}.`
					: null,
			}));
		},

		bands() { return BANDS.filter(b => b.max !== Infinity).concat([{ max: 18, label: 'Extremely hard', who: BANDS[BANDS.length - 1].who }]); },
	},

	watch: {
		// Announce the verdict, not every keystroke, and only once it settles.
		verdict: {
			handler(v) {
				clearTimeout(this._announceTimer);
				this._announceTimer = setTimeout(() => {
					this.announcement = v
						? `Reads like ${v.grade}. ${v.label}.`
						: '';
				}, 700);
			},
		},
	},

	methods: {
		loadSample(key) {
			this.text = SAMPLES[key];
			this.announcement = 'Sample text loaded.';
		},
		clearText() {
			this.text = '';
			this.announcement = 'Text cleared.';
			this.$refs.input?.focus();
		},
		async copySummary() {
			try {
				await navigator.clipboard.writeText(this.summaryForCopy);
				this.copied = true;
				this.announcement = 'Summary copied to your clipboard.';
				setTimeout(() => { this.copied = false; }, 2000);
			} catch (e) {
				this.announcement = 'Copying failed. Select the results and press Control C or Command C.';
			}
		},
	},
}).mount('#main-content');
