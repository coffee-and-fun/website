const { createApp } = Vue;

/* Shared tokenizer: split camelCase humps (both fooBar and HTMLParser
   shapes), then take letter/mark/number runs. Unicode-aware, accented
   letters and combining marks are word characters, not separators. */
function toWords(t) {
    return t.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
            .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
            .match(/[\p{L}\p{M}\p{N}]+/gu) || [];
}

/* Uppercase the first letter of a word without splitting surrogate pairs. */
function capFirst(w) {
    const first = Array.from(w)[0] || '';
    return first.toUpperCase() + w.slice(first.length);
}

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']);

const TRANSFORMS = {
    sentence(t) {
        return t.toLowerCase()
            .replace(/(^[^\p{L}]*|[.!?…]+["'”’)\]]*\s+|\n\s*)(\p{L})/gu, (m, pre, ch) => pre + ch.toUpperCase())
            // Standalone pronoun I only, not i18n, i-beam, or i.e.
            .replace(/(^|[^\p{L}\p{N}])i(?=$|[^\p{L}\p{N}.\-])/gu, '$1I');
    },
    lower(t) { return t.toLowerCase(); },
    upper(t) { return t.toUpperCase(); },
    title(t) {
        return t.split('\n').map(line => {
            const lc = line.toLowerCase();
            // Tokens start with a letter/number (never an apostrophe) and
            // include combining marks so accents can't split a word.
            const tokens = Array.from(lc.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’]*/gu));
            if (!tokens.length) return line;
            let res = '', last = 0;
            tokens.forEach((m, i) => {
                const w = m[0];
                const cap = i === 0 || i === tokens.length - 1
                    || /:\s*$/.test(lc.slice(0, m.index))
                    || !SMALL_WORDS.has(w);
                res += lc.slice(last, m.index) + (cap ? capFirst(w) : w);
                last = m.index + w.length;
            });
            return res + lc.slice(last);
        }).join('\n');
    },
    alternating(t) {
        let out = '', up = false;
        for (const ch of t) {
            if (/\p{L}/u.test(ch)) {
                out += up ? ch.toUpperCase() : ch.toLowerCase();
                up = !up;
            } else {
                out += ch;
            }
        }
        return out;
    },
    camel(t) {
        return toWords(t).map((w, i) => i === 0
            ? w.toLowerCase()
            : capFirst(w.toLowerCase())).join('');
    },
    snake(t) { return toWords(t).map(w => w.toLowerCase()).join('_'); },
    kebab(t) { return toWords(t).map(w => w.toLowerCase()).join('-'); }
};

/* Intl.Segmenter for accurate counts; regex fallbacks for old browsers. */
let segGrapheme = null, segWord = null, segSentence = null;
try {
    segGrapheme = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    segWord = new Intl.Segmenter(undefined, { granularity: 'word' });
    segSentence = new Intl.Segmenter('en', { granularity: 'sentence' });
} catch (e) { /* fallbacks below */ }

createApp({
    data() {
        return {
            inputText: '',
            caseChoice: 'upper',
            tidySpaces: false,
            joinLines: false,
            copied: false,
            copyFailed: false,
            copyTimer: null,
            undoAvailable: false,
            lastCleared: '',
            announcement: '',
            revealedResult: false,
            cases: [
                { key: 'sentence', name: 'Sentence case', eg: 'Like this.' },
                { key: 'lower', name: 'Lowercase', eg: 'like this' },
                { key: 'upper', name: 'Uppercase', eg: 'LIKE THIS' },
                { key: 'title', name: 'Title Case', eg: 'Like This' },
                { key: 'alternating', name: 'Alternating case', eg: 'lIkE tHiS', desc: 'Every other letter switches between capitals and small letters.' },
                { key: 'camel', name: 'Camel case', eg: 'likeThis', desc: 'Words joined together, each new word starting with a capital, like variable names in code.' },
                { key: 'snake', name: 'Snake case', eg: 'like_this', desc: 'Small letters joined with underscores.' },
                { key: 'kebab', name: 'Kebab case', eg: 'like-this', desc: 'Small letters joined with dashes, like web addresses.' }
            ]
        };
    },
    watch: {
        inputText(nv) {
            // Typing new text supersedes both the undo buffer and any
            // lingering copy feedback from the previous text.
            if (nv && this.undoAvailable) this.undoAvailable = false;
            this.copyFailed = false;
            if (!nv && this.copied) {
                this.copied = false;
                if (this.copyTimer) clearTimeout(this.copyTimer);
            }
            // First time there is anything to convert, make sure the result box
            // is actually on screen. Once only, and 'nearest' with no smooth
            // behaviour, so it never yanks the page around under a typing user.
            if (nv && !this.revealedResult) {
                this.revealedResult = true;
                this.$nextTick(() => this.revealResult());
            }
        }
    },
    computed: {
        result() {
            if (!this.inputText) return '';
            // NFC-normalize so decomposed accents (macOS paste) behave
            // like their composed twins in every transform.
            let t = this.inputText.normalize('NFC');
            if (this.tidySpaces) {
                t = t.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n');
            }
            if (this.joinLines) {
                t = t.split(/\n\s*\n/)
                     .map(p => p.split('\n').map(l => l.trim()).filter(Boolean).join(' '))
                     .join('\n\n');
            }
            const fn = TRANSFORMS[this.caseChoice];
            return fn ? fn(t) : t;
        },
        statsLine() {
            const text = this.inputText;
            if (!text) return '0 characters · 0 words · 0 sentences · 0 lines';
            let chars, words, sentences;
            if (segGrapheme) {
                chars = Array.from(segGrapheme.segment(text)).length;
                words = Array.from(segWord.segment(text)).filter(s => s.isWordLike).length;
                sentences = Array.from(segSentence.segment(text)).filter(s => /\S/.test(s.segment)).length;
            } else {
                chars = Array.from(text).length;
                words = text.trim() ? text.trim().split(/\s+/).length : 0;
                sentences = (text.match(/[^.!?\s][^.!?]*(?:[.!?]+|$)/g) || []).length;
            }
            const lines = text.split('\n').filter((l, i, a) => i < a.length - 1 || l !== '').length;
            const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
            return [plural(chars, 'character'), plural(words, 'word'),
                    plural(sentences, 'sentence'), plural(lines, 'line')].join(' · ');
        }
    },
    methods: {
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },
        /* Scroll the result into view only if it isn't already. block: 'nearest'
           is a no-op when the box is on screen, and behavior is forced to
           'instant' because <html> carries scroll-smooth: a running animation
           would fight anyone still typing. */
        revealResult() {
            this.$refs.output?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        },
        fillExample() {
            this.inputText = 'the quick BROWN fox  jumps over\nthe lazy dog.';
            this.announce('Example filled in.');
            this.revealedResult = true;
            this.$nextTick(() => this.revealResult());
        },
        clearText() {
            if (!this.inputText) return;
            this.lastCleared = this.inputText;
            this.inputText = '';
            // No expiry timer: a timed disappearance would yank the button out
            // from under keyboard focus (WCAG 2.2.1). Undo stays until it's
            // used or the user types something new (see the watcher).
            this.undoAvailable = true;
            this.announce('Text cleared. Press Undo clear to get it back.');
            this.$nextTick(() => { if (this.$refs.input) this.$refs.input.focus(); });
        },
        undoClear() {
            this.undoAvailable = false;
            this.inputText = this.lastCleared;
            this.announce('Your text is back.');
            this.$nextTick(() => { if (this.$refs.input) this.$refs.input.focus(); });
        },
        markCopied() {
            this.copied = true;
            this.copyFailed = false;
            this.announce('Copied to clipboard.');
            if (this.copyTimer) clearTimeout(this.copyTimer);
            this.copyTimer = setTimeout(() => { this.copied = false; }, 2000);
        },
        async copyResult() {
            if (!this.result) return;
            const text = this.result;
            try {
                await Promise.race([
                    navigator.clipboard.writeText(text),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
                ]);
                this.markCopied();
            } catch (e) {
                const out = this.$refs.output;
                let ok = false;
                if (out) {
                    out.focus();
                    out.select();
                    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
                }
                if (ok) {
                    this.markCopied();
                } else {
                    this.copyFailed = true;
                    this.announce('Copy didn’t work. The text is selected, press Control C or Command C.');
                }
            }
        },
        downloadResult() {
            if (!this.result) return;
            const names = {
                sentence: 'sentence-case', lower: 'lowercase', upper: 'uppercase',
                title: 'title-case', alternating: 'alternating-case',
                camel: 'camel-case', snake: 'snake-case', kebab: 'kebab-case'
            };
            const filename = (names[this.caseChoice] || 'converted-text') + '.txt';
            const blob = new Blob([this.result], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.announce('Downloaded as ' + filename + '.');
        }
    }
}).mount('#main-content');
