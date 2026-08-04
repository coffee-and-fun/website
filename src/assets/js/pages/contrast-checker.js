/* Color contrast checker.
 *
 * Everything here is WCAG 2.1 arithmetic, which is worth stating precisely
 * because it is easy to get subtly wrong:
 *
 *   - Channels are sRGB, normalised to 0..1, then linearised with the
 *     0.03928 / 12.92 piecewise curve.
 *   - Relative luminance weights the linear channels 0.2126 R, 0.7152 G,
 *     0.0722 B. Green dominates, which is why yellow-on-white fails.
 *   - Contrast is (lighter + 0.05) / (darker + 0.05), so it runs 1..21.
 *
 * The ratio is reported ROUNDED DOWN to two decimals. Rounding to nearest
 * would let 4.497 display as "4.50" and read as a pass when it is not.
 */
const { createApp } = Vue;

const AA_NORMAL = 4.5;
const AA_LARGE = 3;
const AAA_NORMAL = 7;
const AAA_LARGE = 4.5;

function parseHex(value) {
  if (typeof value !== 'string') return null;
  let s = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}

const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* Rounded DOWN, so a displayed 4.50 is always a real pass. */
const show = (n) => (Math.floor(n * 100) / 100).toFixed(2);

/* --- HSL, used only so a suggested color keeps its hue --- */
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/* Nearest color that clears `target` against `fixed`, keeping hue and
 * saturation and moving only lightness. Both directions are searched and the
 * smaller move wins, so a light theme gets a darker text color and a dark
 * theme gets a lighter one without being told which it is.
 * Returns null when even pure black and pure white cannot reach the target,
 * which happens on mid greys at AAA. */
function nudgeToPass(movingRgb, fixedRgb, target) {
  if (contrast(movingRgb, fixedRgb) >= target) return null;
  const [h, s, l0] = rgbToHsl(movingRgb);

  const search = (dir) => {
    const limit = dir < 0 ? 0 : 1;
    if (contrast(hslToRgb([h, s, limit]), fixedRgb) < target) return null;
    let lo = l0, hi = limit;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(hslToRgb([h, s, mid]), fixedRgb) >= target) hi = mid;
      else lo = mid;
    }
    /* hi clears the target in continuous lightness, but the value actually
     * handed to the user is an 8 bit hex. Rounding can push it back under,
     * which produced suggestions like #9b662e at 4.49:1 against a 4.5 target,
     * and, worse, suggestions identical to the failing input. So step toward
     * the limit until the QUANTISED color passes, and verify before returning. */
    for (let l = hi, i = 0; i <= 256; i++, l += dir / 256) {
      if (dir < 0 ? l < 0 : l > 1) break;
      const hex = toHex(hslToRgb([h, s, l]));
      if (contrast(parseHex(hex), fixedRgb) >= target) return { hex, move: Math.abs(l - l0) };
    }
    return null;
  };

  const candidates = [search(-1), search(1)]
    .filter(Boolean)
    .sort((a, b) => a.move - b.move);
  return candidates.length ? candidates[0].hex : null;
}

createApp({
  data() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = (key, fallback) => {
      const raw = params.get(key);
      return raw && parseHex(raw) ? '#' + raw.trim().replace(/^#/, '').toLowerCase() : fallback;
    };
    return {
      // Defaults are the site's own ink on its own page color, which passes.
      textInput: fromUrl('text', '#3d2b1f'),
      bgInput: fromUrl('bg', '#fef5ec'),
      copiedCss: false,
      copiedLink: false,
      announcement: '',
      lastSpoken: '',
    };
  },

  computed: {
    textRgb() { return parseHex(this.textInput); },
    bgRgb() { return parseHex(this.bgInput); },

    /* The last good value is kept so the preview does not flash while
     * someone is midway through typing a hex code. */
    textHex() { return this.textRgb ? toHex(this.textRgb) : this.lastText || '#3d2b1f'; },
    bgHex() { return this.bgRgb ? toHex(this.bgRgb) : this.lastBg || '#fef5ec'; },

    parseError() {
      if (!this.textRgb && this.textInput.trim()) return 'That text color is not a hex value. Try something like #3d2b1f.';
      if (!this.bgRgb && this.bgInput.trim()) return 'That background color is not a hex value. Try something like #fef5ec.';
      return '';
    },

    ratio() { return contrast(parseHex(this.textHex), parseHex(this.bgHex)); },
    ratioText() { return show(this.ratio); },

    passesAANormal() { return this.ratio >= AA_NORMAL; },

    levels() {
      const r = this.ratio;
      return [
        { key: 'aa-n', name: 'AA, normal text', need: AA_NORMAL, pass: r >= AA_NORMAL },
        { key: 'aa-l', name: 'AA, large text', need: AA_LARGE, pass: r >= AA_LARGE },
        { key: 'aaa-n', name: 'AAA, normal text', need: AAA_NORMAL, pass: r >= AAA_NORMAL },
        { key: 'aaa-l', name: 'AAA, large text', need: AAA_LARGE, pass: r >= AAA_LARGE },
      ];
    },

    verdictClass() {
      if (this.ratio >= AAA_NORMAL) return 'is-best';
      if (this.ratio >= AA_NORMAL) return 'is-pass';
      if (this.ratio >= AA_LARGE) return 'is-partial';
      return 'is-fail';
    },

    verdictSentence() {
      const r = this.ratio;
      if (r >= AAA_NORMAL) return 'Passes everything, AA and AAA, at any text size.';
      if (r >= AA_NORMAL) return 'Passes AA at any text size. Normal text is fine.';
      if (r >= AA_LARGE) return 'Passes AA for large text only. Too low for normal body text.';
      return 'Fails AA. Not enough contrast for text at any size.';
    },

    /* Suggest a fix for whichever color is likelier to be the flexible one:
     * the text. If text cannot be moved far enough, try the background. */
    suggestion() {
      if (this.ratio >= AA_NORMAL) return null;
      const text = parseHex(this.textHex), bg = parseHex(this.bgHex);
      const target = AA_NORMAL;

      const newText = nudgeToPass(text, bg, target);
      if (newText) {
        return {
          which: 'text', hex: newText, target,
          ratio: show(contrast(parseHex(newText), bg)),
          previewBg: this.bgHex, previewFg: newText,
        };
      }
      const newBg = nudgeToPass(bg, text, target);
      if (newBg) {
        return {
          which: 'background', hex: newBg, target,
          ratio: show(contrast(parseHex(newBg), text)),
          previewBg: newBg, previewFg: this.textHex,
        };
      }
      return null;
    },

    /* A border so the preview panel is never invisible against the page,
     * whatever colors are chosen. Mid greys are the awkward case. */
    previewBorder() {
      return luminance(parseHex(this.bgHex)) > 0.5 ? 'rgba(61,43,31,0.35)' : 'rgba(255,255,255,0.45)';
    },

    cssText() { return `color: ${this.textHex};\nbackground-color: ${this.bgHex};`; },

    shareUrl() {
      const u = new URL(window.location.href);
      u.search = '';
      u.searchParams.set('text', this.textHex.replace('#', ''));
      u.searchParams.set('bg', this.bgHex.replace('#', ''));
      return u.toString();
    },
  },

  watch: {
    textInput(v) { if (parseHex(v)) { this.lastText = toHex(parseHex(v)); this.sync(); } },
    bgInput(v) { if (parseHex(v)) { this.lastBg = toHex(parseHex(v)); this.sync(); } },
  },

  mounted() {
    this.lastText = this.textHex;
    this.lastBg = this.bgHex;
    this.speak();
  },

  methods: {
    /* Keep the address bar in step so the page can be shared or reloaded,
     * without pushing a history entry per keystroke. */
    sync() {
      /* shareUrl is a computed string, not a method. Calling it threw on every
       * keystroke, which silently killed both the address bar sync and the
       * live region announcement. */
      window.history.replaceState(null, '', this.shareUrl);
      this.copiedCss = false;
      this.copiedLink = false;
      this.speak();
    },

    /* One announcement per meaningful change. Re-announcing the same
     * sentence on every keystroke makes a screen reader unusable. */
    speak() {
      const msg = `Contrast ratio ${this.ratioText} to 1. ${this.verdictSentence}`;
      if (msg === this.lastSpoken) return;
      this.lastSpoken = msg;
      this.announcement = msg;
    },

    swap() {
      const t = this.textHex;
      this.textInput = this.bgHex;
      this.bgInput = t;
      this.$nextTick(() => this.speak());
    },

    applySuggestion() {
      const s = this.suggestion;
      if (!s) return;
      if (s.which === 'text') this.textInput = s.hex;
      else this.bgInput = s.hex;
      this.$nextTick(() => {
        this.announcement = `Applied ${s.hex}. New contrast ratio ${this.ratioText} to 1. ${this.verdictSentence}`;
        this.lastSpoken = this.announcement;
      });
    },

    async copy(text, flag) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) { /* nothing else to try */ }
        ta.remove();
      }
      this[flag] = true;
      this.announcement = flag === 'copiedCss' ? 'CSS copied to your clipboard.' : 'Link copied to your clipboard.';
      this.lastSpoken = this.announcement;
      setTimeout(() => { this[flag] = false; }, 2200);
    },

    copyCss() { this.copy(this.cssText, 'copiedCss'); },
    copyLink() { this.copy(this.shareUrl, 'copiedLink'); },
  },
}).mount('#main-content');
