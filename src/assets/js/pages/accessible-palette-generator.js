/* Accessible palette generator.

   Most palette tools pick pretty colours and leave contrast to chance, so you
   generate a scale and then go hunting for which steps are safe on white.

   This one runs backwards. Each step is defined by the contrast ratio it must
   hit against white, and the generator solves for the lightness that lands on
   it. So step 600 is always around 4.6:1 and step 700 around 7.2:1, for every
   hue you feed it. The scale is accessible by construction.

   WCAG contrast is a pure function of relative luminance, and contrast against
   white is 1.05 / (L + 0.05). That inverts cleanly: a target ratio gives a
   target luminance directly, and luminance rises monotonically with HSL
   lightness for a fixed hue and saturation, so one binary search finds it. */
(function () {
  'use strict';

  var root = document.querySelector('[data-apg]');
  if (!root) return;

  var STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  /* Chosen so the two steps people actually reach for are safe by default:
     600 clears AA body text on white, 700 clears AAA. */
  var TARGETS = [1.05, 1.15, 1.4, 1.9, 2.8, 3.6, 4.6, 7.2, 10.4, 13.6, 16.8];

  /* ---------- colour maths ---------- */

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function hexToRgb(hex) {
    hex = String(hex).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/./g, function (c) { return c + c; });
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map(function (c) {
      var s = Math.round(clamp(c, 0, 255)).toString(16);
      return s.length === 1 ? '0' + s : s;
    }).join('');
  }

  function rgbToHsl(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    var d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    if (s === 0) { var v = Math.round(l * 255); return [v, v, v]; }
    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    ];
  }

  function channel(c) {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /* Solve HSL lightness for a target relative luminance at fixed hue and
     saturation. 24 halvings is well past the precision a 24-bit channel can
     represent, so this always converges before it runs out. */
  function lightnessForLuminance(h, s, targetLum) {
    var lo = 0, hi = 1, mid = 0.5;
    for (var i = 0; i < 24; i++) {
      mid = (lo + hi) / 2;
      if (luminance(hslToRgb(h, s, mid)) < targetLum) lo = mid; else hi = mid;
    }
    return mid;
  }

  function buildRamp(seedHex, desaturate) {
    var rgb = hexToRgb(seedHex) || [79, 70, 229];
    var hsl = rgbToHsl(rgb);
    var h = hsl[0];
    var s = desaturate ? clamp(hsl[1] * 0.14, 0.02, 0.12) : hsl[1];
    return STEPS.map(function (step, i) {
      var target = TARGETS[i];
      var targetLum = 1.05 / target - 0.05;
      var l = lightnessForLuminance(h, s, clamp(targetLum, 0, 1));
      var c = hslToRgb(h, s, l);
      var onWhite = contrast(c, [255, 255, 255]);
      var onBlack = contrast(c, [0, 0, 0]);
      return {
        step: step,
        hex: rgbToHex(c),
        rgb: c,
        onWhite: onWhite,
        onBlack: onBlack,
        textOn: onBlack >= onWhite ? '#000000' : '#ffffff',
        textRatio: Math.max(onBlack, onWhite)
      };
    });
  }

  /* ---------- state ---------- */

  var state = {
    seed: '#4f46e5',
    name: 'brand',
    level: 'AA',
    sim: '',
    neutral: true
  };

  var els = {
    seed: root.querySelector('[data-apg-seed]'),
    seedHex: root.querySelector('[data-apg-seed-hex]'),
    name: root.querySelector('[data-apg-name]'),
    ramp: root.querySelector('[data-apg-ramp]'),
    neutralRamp: root.querySelector('[data-apg-neutral]'),
    neutralWrap: root.querySelector('[data-apg-neutral-wrap]'),
    neutralToggle: root.querySelector('[data-apg-neutral-toggle]'),
    matrix: root.querySelector('[data-apg-matrix]'),
    code: root.querySelector('[data-apg-code]'),
    status: root.querySelector('[data-apg-status]'),
    share: root.querySelector('[data-apg-share]'),
    shareMsg: root.querySelector('[data-apg-share-msg]'),
    summary: root.querySelector('[data-apg-summary]')
  };

  var ramp = [], neutral = [], format = 'css';

  function say(msg) { if (els.status) els.status.textContent = msg; }

  /* ---------- rendering ---------- */

  function renderRamp(list, host) {
    host.innerHTML = '';
    list.forEach(function (c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'apg-swatch apg-simulate';
      btn.setAttribute('data-hex', c.hex);
      btn.title = 'Copy ' + c.hex;
      btn.setAttribute('aria-label',
        'Step ' + c.step + ', ' + c.hex + '. ' + c.onWhite.toFixed(2) + ' to 1 on white, ' +
        c.onBlack.toFixed(2) + ' to 1 on black. Copy hex.');
      btn.innerHTML =
        '<span class="apg-chip" style="background:' + c.hex + ';color:' + c.textOn + '">' +
          '<span class="apg-chip-step">' + c.step + '</span>' +
          '<span class="apg-chip-hex">' + c.hex.toUpperCase() + '</span>' +
        '</span>' +
        '<span class="apg-meta">' +
          '<span>on white <strong>' + c.onWhite.toFixed(2) + '</strong></span>' +
          '<span>on black <strong>' + c.onBlack.toFixed(2) + '</strong></span>' +
        '</span>';
      host.appendChild(btn);
    });
  }

  function renderSummary() {
    if (!els.summary) return;
    var need = state.level === 'AAA' ? 7 : 4.5;
    var onWhite = ramp.filter(function (c) { return c.onWhite >= need; }).map(function (c) { return c.step; });
    var onBlack = ramp.filter(function (c) { return c.onBlack >= need; }).map(function (c) { return c.step; });
    els.summary.innerHTML =
      '<p class="text-[#4a3a2c]"><strong>Body text on white</strong> at ' + state.level + ' (' + need +
      ':1): steps ' + (onWhite.length ? onWhite.join(', ') : 'none') + '.</p>' +
      '<p class="mt-2 text-[#4a3a2c]"><strong>Body text on black</strong> at ' + state.level + ': steps ' +
      (onBlack.length ? onBlack.join(', ') : 'none') + '.</p>';
  }

  function renderMatrix() {
    if (!els.matrix) return;
    var need = state.level === 'AAA' ? 7 : 4.5;
    var needLarge = state.level === 'AAA' ? 4.5 : 3;
    var html = '<table class="apg-matrix"><caption class="sr-only">Contrast ratio for every pair of steps. ' +
      'Rows are text colour, columns are background.</caption><thead><tr><th scope="col"><span class="sr-only">Text step</span></th>';
    ramp.forEach(function (c) { html += '<th scope="col">' + c.step + '</th>'; });
    html += '</tr></thead><tbody>';
    ramp.forEach(function (fg) {
      html += '<tr><th scope="row">' + fg.step + '</th>';
      ramp.forEach(function (bg) {
        var r = contrast(fg.rgb, bg.rgb);
        var pass = r >= need, large = r >= needLarge;
        var bgc = pass ? '#dcfce7' : large ? '#fef3c7' : '#fee2e2';
        var fgc = pass ? '#14532d' : large ? '#713f12' : '#7f1d1d';
        var label = pass ? 'passes ' + state.level : large ? 'large text only' : 'fails';
        html += '<td><button type="button" class="apg-cell" style="background:' + bgc + ';color:' + fgc +
          '" data-pair="' + fg.hex + '|' + bg.hex + '" aria-label="Text ' + fg.step + ' on background ' +
          bg.step + ', ' + r.toFixed(2) + ' to 1, ' + label + '. Open in the contrast checker.">' +
          r.toFixed(1) + '</button></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    els.matrix.innerHTML = html;
  }

  function renderCode() {
    if (!els.code) return;
    var n = (state.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand';
    var out = '';
    if (format === 'css') {
      out = ':root {\n' + ramp.map(function (c) {
        return '  --color-' + n + '-' + c.step + ': ' + c.hex + ';';
      }).join('\n');
      if (state.neutral) out += '\n' + neutral.map(function (c) {
        return '  --color-' + n + '-neutral-' + c.step + ': ' + c.hex + ';';
      }).join('\n');
      out += '\n}';
    } else if (format === 'tailwind') {
      out = '@theme {\n' + ramp.map(function (c) {
        return '  --color-' + n + '-' + c.step + ': ' + c.hex + ';';
      }).join('\n');
      if (state.neutral) out += '\n' + neutral.map(function (c) {
        return '  --color-' + n + '-neutral-' + c.step + ': ' + c.hex + ';';
      }).join('\n');
      out += '\n}';
    } else if (format === 'scss') {
      out = ramp.map(function (c) { return '$' + n + '-' + c.step + ': ' + c.hex + ';'; }).join('\n');
      if (state.neutral) out += '\n' + neutral.map(function (c) {
        return '$' + n + '-neutral-' + c.step + ': ' + c.hex + ';';
      }).join('\n');
    } else {
      var obj = {};
      obj[n] = {};
      ramp.forEach(function (c) { obj[n][c.step] = c.hex; });
      if (state.neutral) {
        obj[n + '-neutral'] = {};
        neutral.forEach(function (c) { obj[n + '-neutral'][c.step] = c.hex; });
      }
      out = JSON.stringify(obj, null, 2);
    }
    els.code.textContent = out;
  }

  function updateShare() {
    var p = new URLSearchParams();
    p.set('seed', state.seed.replace('#', ''));
    if (state.name !== 'brand') p.set('name', state.name);
    if (state.level !== 'AA') p.set('level', state.level);
    if (!state.neutral) p.set('neutral', '0');
    var url = location.origin + location.pathname + '?' + p.toString();
    if (els.share) els.share.value = url;
    return url;
  }

  function render() {
    ramp = buildRamp(state.seed, false);
    neutral = buildRamp(state.seed, true);
    renderRamp(ramp, els.ramp);
    if (els.neutralRamp) renderRamp(neutral, els.neutralRamp);
    if (els.neutralWrap) els.neutralWrap.hidden = !state.neutral;
    renderSummary();
    renderMatrix();
    renderCode();
    updateShare();
    root.className = root.className.replace(/\bapg-sim-\w+/g, '').trim();
    if (state.sim) root.className += ' apg-sim-' + state.sim;
  }

  /* ---------- wiring ---------- */

  function setSeed(hex, from) {
    var rgb = hexToRgb(hex);
    if (!rgb) return false;
    state.seed = rgbToHex(rgb);
    if (from !== 'picker' && els.seed) els.seed.value = state.seed;
    if (from !== 'text' && els.seedHex) els.seedHex.value = state.seed.toUpperCase();
    render();
    return true;
  }

  if (els.seed) els.seed.addEventListener('input', function () { setSeed(this.value, 'picker'); });
  if (els.seedHex) els.seedHex.addEventListener('input', function () { setSeed(this.value, 'text'); });
  if (els.name) els.name.addEventListener('input', function () { state.name = this.value; renderCode(); updateShare(); });

  root.querySelectorAll('[data-apg-level]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.level = this.getAttribute('data-apg-level');
      root.querySelectorAll('[data-apg-level]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      render();
      say('Now judging against ' + state.level + '.');
    });
  });

  root.querySelectorAll('[data-apg-format]').forEach(function (b) {
    b.addEventListener('click', function () {
      format = this.getAttribute('data-apg-format');
      root.querySelectorAll('[data-apg-format]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      renderCode();
    });
  });

  root.querySelectorAll('[data-apg-sim]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = this.getAttribute('data-apg-sim');
      state.sim = state.sim === v ? '' : v;
      root.querySelectorAll('[data-apg-sim]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x.getAttribute('data-apg-sim') === state.sim));
      });
      render();
      say(state.sim ? 'Simulating ' + state.sim + '. The ratios still describe your real colours.' : 'Simulation off.');
    });
  });

  if (els.neutralToggle) {
    els.neutralToggle.addEventListener('change', function () {
      state.neutral = this.checked;
      render();
    });
  }

  root.addEventListener('click', function (e) {
    var sw = e.target.closest ? e.target.closest('.apg-swatch') : null;
    if (sw) {
      var hex = sw.getAttribute('data-hex');
      if (navigator.clipboard) navigator.clipboard.writeText(hex).then(function () { say(hex + ' copied.'); },
        function () { say('Could not copy. The hex is ' + hex + '.'); });
      else say('The hex is ' + hex + '.');
      return;
    }
    var cell = e.target.closest ? e.target.closest('.apg-cell') : null;
    if (cell) {
      /* The contrast checker reads text/bg/palette, not fg/bg. Hand it the pair
         AND the whole ramp, so its own palette matrix arrives populated. */
      var pair = cell.getAttribute('data-pair').split('|');
      var pal = ramp.concat(state.neutral ? neutral : [])
        .map(function (c) { return c.hex.replace('#', ''); }).join('-');
      window.open(
        '/contrast-checker/?text=' + pair[0].replace('#', '') +
        '&bg=' + pair[1].replace('#', '') +
        '&palette=' + pal,
        '_blank', 'noopener');
    }
  });

  var randomBtn = root.querySelector('[data-apg-random]');
  if (randomBtn) {
    randomBtn.addEventListener('click', function () {
      /* Not Math.random on a fixed set: step the hue so repeated presses walk
         the wheel instead of occasionally repeating the same colour. */
      var hsl = rgbToHsl(hexToRgb(state.seed));
      var h = (hsl[0] + 0.137) % 1;
      setSeed(rgbToHex(hslToRgb(h, clamp(hsl[1] || 0.7, 0.45, 0.9), 0.5)));
      say('New hue.');
    });
  }

  var copyCode = root.querySelector('[data-apg-copy-code]');
  if (copyCode) {
    copyCode.addEventListener('click', function () {
      var text = els.code.textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(
        function () { say('Palette code copied.'); },
        function () { say('Could not copy, select the code manually.'); });
    });
  }

  var copyShare = root.querySelector('[data-apg-copy-share]');
  if (copyShare && els.share) {
    copyShare.addEventListener('click', function () {
      var url = updateShare();
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(
        function () { if (els.shareMsg) els.shareMsg.textContent = 'Link copied'; },
        function () { els.share.select(); if (els.shareMsg) els.shareMsg.textContent = 'Selected, press Ctrl or Cmd and C'; });
      else { els.share.select(); if (els.shareMsg) els.shareMsg.textContent = 'Selected, press Ctrl or Cmd and C'; }
    });
  }

  /* ---------- boot ---------- */

  var q = new URLSearchParams(location.search);
  if (q.get('seed')) { var s = hexToRgb(q.get('seed')); if (s) state.seed = rgbToHex(s); }
  if (q.get('name')) state.name = q.get('name').slice(0, 32);
  if (q.get('level') === 'AAA') state.level = 'AAA';
  if (q.get('neutral') === '0') state.neutral = false;

  if (els.seed) els.seed.value = state.seed;
  if (els.seedHex) els.seedHex.value = state.seed.toUpperCase();
  if (els.name) els.name.value = state.name;
  if (els.neutralToggle) els.neutralToggle.checked = state.neutral;
  root.querySelectorAll('[data-apg-level]').forEach(function (x) {
    x.setAttribute('aria-pressed', String(x.getAttribute('data-apg-level') === state.level));
  });
  render();
})();
