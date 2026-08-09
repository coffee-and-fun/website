/* Dyslexia font tester.
   One state object drives CSS custom properties on .dft-app. Every sample
   inherits them, so the four typefaces are always rendered at identical
   settings. That is the whole argument the tool is making: if you can only
   change one thing at a time, you can see what actually moved the needle. */
(function () {
  'use strict';

  var app = document.querySelector('[data-dft-app]');
  if (!app) return;

  var SAMPLE =
    'Reading is not one skill but several running at once. Your eyes jump ahead, ' +
    'your memory holds the start of the sentence, and somewhere in between the ' +
    'words become meaning.\n\n' +
    'When letters crowd together or flip places, that quiet machinery stalls. ' +
    'Adjust the spacing below and watch how much changes before you have touched ' +
    'the typeface at all.';

  /* WCAG 2.1 SC 1.4.12 Text Spacing. Content must stay readable when a reader
     forces these values, so they double as a sensible starting point. */
  var WCAG_1412 = { letter: 0.12, word: 0.16, line: 1.5 };

  var DEFAULTS = { size: 18, letter: 0, word: 0, line: 1.5, measure: 65 };

  var state = {
    text: SAMPLE,
    size: DEFAULTS.size,
    letter: DEFAULTS.letter,
    word: DEFAULTS.word,
    line: DEFAULTS.line,
    measure: DEFAULTS.measure,
    focus: ''
  };

  var els = {
    text: document.querySelector('[data-dft-text]'),
    samples: [].slice.call(document.querySelectorAll('[data-dft-sample]')),
    share: document.querySelector('[data-dft-share]'),
    shareMsg: document.querySelector('[data-dft-share-msg]'),
    reset: document.querySelector('[data-dft-reset]'),
    wcag: document.querySelector('[data-dft-wcag]'),
    focusSel: document.querySelector('[data-dft-focus]'),
    status: document.querySelector('[data-dft-status]')
  };

  var sliders = {};
  [].slice.call(document.querySelectorAll('[data-dft-slider]')).forEach(function (el) {
    sliders[el.getAttribute('data-dft-slider')] = {
      input: el,
      out: document.querySelector('[data-dft-out="' + el.getAttribute('data-dft-slider') + '"]')
    };
  });

  function fmt(key, v) {
    if (key === 'size') return v + 'px';
    if (key === 'measure') return v + ' characters';
    if (key === 'line') return Number(v).toFixed(2).replace(/\.?0+$/, '');
    return Number(v).toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + 'em';
  }

  function render() {
    app.style.setProperty('--dft-size', state.size + 'px');
    app.style.setProperty('--dft-letter', state.letter + 'em');
    app.style.setProperty('--dft-word', state.word + 'em');
    app.style.setProperty('--dft-line', String(state.line));
    app.style.setProperty('--dft-measure', state.measure + 'ch');

    Object.keys(sliders).forEach(function (k) {
      var s = sliders[k];
      if (s.input.value !== String(state[k])) s.input.value = state[k];
      if (s.out) s.out.textContent = fmt(k, state[k]);
    });

    var text = state.text.length ? state.text : SAMPLE;
    els.samples.forEach(function (el) {
      if (el.textContent !== text) el.textContent = text;
    });

    if (state.focus) app.setAttribute('data-focus', state.focus);
    else app.removeAttribute('data-focus');
    if (els.focusSel && els.focusSel.value !== state.focus) els.focusSel.value = state.focus;

    updateShareLink();
  }

  function say(msg) {
    if (els.status) els.status.textContent = msg;
  }

  /* ---- share link ---- */

  function updateShareLink() {
    var p = new URLSearchParams();
    if (state.size !== DEFAULTS.size) p.set('size', state.size);
    if (state.letter !== DEFAULTS.letter) p.set('ls', state.letter);
    if (state.word !== DEFAULTS.word) p.set('ws', state.word);
    if (state.line !== DEFAULTS.line) p.set('lh', state.line);
    if (state.measure !== DEFAULTS.measure) p.set('m', state.measure);
    if (state.focus) p.set('f', state.focus);
    /* Long pasted documents would blow past the practical URL limit, so the
       text only travels when it is short enough to survive the trip. */
    if (state.text !== SAMPLE && state.text.length && state.text.length <= 1200) {
      p.set('t', state.text);
    }
    var q = p.toString();
    var url = location.origin + location.pathname + (q ? '?' + q : '');
    if (els.share) els.share.value = url;
    return url;
  }

  function readUrl() {
    var p = new URLSearchParams(location.search);
    var num = function (key, min, max, fallback) {
      if (!p.has(key)) return fallback;
      var v = parseFloat(p.get(key));
      if (isNaN(v)) return fallback;
      return Math.min(max, Math.max(min, v));
    };
    state.size = num('size', 12, 40, DEFAULTS.size);
    state.letter = num('ls', 0, 0.4, DEFAULTS.letter);
    state.word = num('ws', 0, 0.6, DEFAULTS.word);
    state.line = num('lh', 1, 3, DEFAULTS.line);
    state.measure = num('m', 20, 120, DEFAULTS.measure);
    var f = p.get('f') || '';
    if (['system', 'opendyslexic', 'lexend', 'atkinson'].indexOf(f) !== -1) state.focus = f;
    var t = p.get('t');
    if (t) state.text = t.slice(0, 1200);
  }

  /* ---- wiring ---- */

  Object.keys(sliders).forEach(function (k) {
    sliders[k].input.addEventListener('input', function () {
      state[k] = parseFloat(this.value);
      render();
    });
  });

  if (els.text) {
    els.text.addEventListener('input', function () {
      state.text = this.value;
      render();
    });
  }

  if (els.focusSel) {
    els.focusSel.addEventListener('change', function () {
      state.focus = this.value;
      render();
      say(this.value ? 'Showing one typeface at full width.' : 'Showing all four typefaces.');
    });
  }

  if (els.wcag) {
    els.wcag.addEventListener('click', function () {
      state.letter = WCAG_1412.letter;
      state.word = WCAG_1412.word;
      state.line = WCAG_1412.line;
      render();
      say('Applied the WCAG 1.4.12 text spacing values.');
    });
  }

  if (els.reset) {
    els.reset.addEventListener('click', function () {
      state.size = DEFAULTS.size;
      state.letter = DEFAULTS.letter;
      state.word = DEFAULTS.word;
      state.line = DEFAULTS.line;
      state.measure = DEFAULTS.measure;
      state.focus = '';
      state.text = SAMPLE;
      if (els.text) els.text.value = SAMPLE;
      render();
      say('Reset to the defaults.');
    });
  }

  var copyBtn = document.querySelector('[data-dft-copy]');
  if (copyBtn && els.share) {
    copyBtn.addEventListener('click', function () {
      var url = updateShareLink();
      var done = function (msg) { if (els.shareMsg) els.shareMsg.textContent = msg; };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(
          function () { done('Link copied'); },
          function () { els.share.select(); done('Selected, now press Ctrl or Cmd and C'); }
        );
      } else {
        els.share.select();
        done('Selected, now press Ctrl or Cmd and C');
      }
    });
  }

  readUrl();
  if (els.text) els.text.value = state.text;
  render();
})();
