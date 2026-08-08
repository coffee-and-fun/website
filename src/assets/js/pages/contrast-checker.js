(function () {
  'use strict';

  /* WCAG 2.1 contrast, the exact formula from the specification. The piecewise
     sRGB conversion below is the part naive implementations skip, and skipping
     it produces ratios that disagree with audit tooling in the second decimal.
     Sanity anchor: #ffffff on #1e293b must come out at 14.63:1. */
  function channel(c) {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminance(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }
  function ratio(a, b) {
    var la = luminance(a);
    var lb = luminance(b);
    var hi = Math.max(la, lb);
    var lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }
  /* Display rounds to two decimals; pass or fail never does. 4.4996 must fail
     AA even though it prints as 4.50. */
  function fmt(r) {
    return (Math.round(r * 100) / 100).toFixed(2) + ':1';
  }

  /* Accepts #abc, abc, #aabbcc, aabbcc. Returns normalised #aabbcc or null. */
  function normaliseHex(raw) {
    var v = String(raw || '').trim().toLowerCase().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/.test(v)) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
    return /^[0-9a-f]{6}$/.test(v) ? '#' + v : null;
  }

  /* HSL round trip for the quick fixes: keep the hue, walk the lightness. */
  function hexToHsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToHex(h, s, l) {
    function f(n) {
      var k = (n + h * 12) % 12;
      var a = s * Math.min(l, 1 - l);
      var c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(c * 255).toString(16).padStart(2, '0');
    }
    return '#' + f(0) + f(8) + f(4);
  }

  /* Walk lightness away from the background until the target ratio is met.
     Tries the natural direction first, then the other, then falls back to
     whichever of black or white does better. Returns a hex or null when the
     color already passes. */
  function suggestFix(fg, bg, target) {
    if (ratio(fg, bg) >= target) return null;
    var hsl = hexToHsl(fg);
    var darkFirst = luminance(bg) > 0.5;
    var directions = darkFirst ? [-1, 1] : [1, -1];
    for (var d = 0; d < 2; d++) {
      for (var step = 1; step <= 100; step++) {
        var l = hsl[2] + directions[d] * step / 100;
        if (l < 0 || l > 1) break;
        var candidate = hslToHex(hsl[0], hsl[1], l);
        if (ratio(candidate, bg) >= target) return candidate;
      }
    }
    var fallback = ratio('#000000', bg) >= ratio('#ffffff', bg) ? '#000000' : '#ffffff';
    /* The fallback gets no free pass. On a mid luminance background no text
       color of any lightness reaches 7:1, and claiming otherwise would make a
       WCAG checker assert a false compliance result. Null means unreachable,
       and the caller says so honestly. */
    return ratio(fallback, bg) >= target ? fallback : null;
  }

  /* ---- State ---- */
  var state = {
    text: '#3d2b1f',
    bg: '#fef5ec',
    link: '#7a4e31',
    palette: []
  };

  var $ = function (id) { return document.getElementById(id); };
  var fields = {
    text: { hex: $('cc-text-hex'), pick: $('cc-text-pick'), eye: $('cc-text-eye') },
    bg: { hex: $('cc-bg-hex'), pick: $('cc-bg-pick'), eye: $('cc-bg-eye') },
    link: { hex: $('cc-link-hex'), pick: $('cc-link-pick'), eye: $('cc-link-eye') }
  };
  var preview = $('cc-preview');
  var live = $('cc-live');

  var CARDS = [
    { el: $('cc-aa-n'), min: 4.5, label: 'AA normal' },
    { el: $('cc-aa-l'), min: 3, label: 'AA large' },
    { el: $('cc-aaa-n'), min: 7, label: 'AAA normal' },
    { el: $('cc-aaa-l'), min: 4.5, label: 'AAA large' }
  ];

  function setBadge(el, pass, label) {
    el.textContent = label + (pass ? ' Pass' : ' Fail');
    if (pass) el.removeAttribute('data-state');
    else el.setAttribute('data-state', 'fail');
  }

  /* ---- URL sharing ---- */
  var urlTimer = null;
  function buildShareUrl() {
    var params = new URLSearchParams();
    params.set('text', state.text.slice(1));
    params.set('bg', state.bg.slice(1));
    params.set('link', state.link.slice(1));
    if (state.palette.length) params.set('palette', state.palette.map(function (c) { return c.slice(1); }).join('-'));
    return location.origin + location.pathname + '?' + params.toString();
  }
  function syncUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(function () {
      var url = buildShareUrl();
      $('cc-share-url').value = url;
      try { history.replaceState(null, '', url); } catch (e) { /* file:// etc */ }
    }, 250);
  }

  /* ---- Announcements ---- */
  var liveTimer = null;
  function announce() {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      var r = ratio(state.text, state.bg);
      var passes = CARDS.filter(function (c) { return r >= c.min; }).map(function (c) { return c.label; });
      var msg = 'Text on background ' + fmt(r).replace(':1', ' to one') + '. ';
      msg += passes.length === 4 ? 'Passes AA and AAA at every size.'
        : passes.length === 0 ? 'Fails every WCAG level.'
        : 'Passes ' + passes.join(', ') + ' only.';
      live.textContent = msg;
    }, 700);
  }

  /* ---- Quick fixes ---- */
  function renderFixes() {
    var chips = [];
    var unreachable = [];
    var defs = [
      { target: 4.5, color: state.text, label: 'Text passes AA', bgLabel: 'Background for text AA', apply: 'text', name: 'AA for text (4.5:1)' },
      { target: 7, color: state.text, label: 'Text passes AAA', bgLabel: 'Background for text AAA', apply: 'text', name: 'AAA for text (7:1)' },
      { target: 4.5, color: state.link, label: 'Link passes AA', bgLabel: 'Background for link AA', apply: 'link', name: 'AA for links (4.5:1)' }
    ];
    defs.forEach(function (d) {
      if (ratio(d.color, state.bg) >= d.target) return;
      var fix = suggestFix(d.color, state.bg, d.target);
      if (fix) { chips.push({ label: d.label, hex: fix, apply: d.apply }); return; }
      /* The foreground cannot get there. The ratio is symmetric, so walk the
         background's lightness instead, holding the foreground still. */
      var bgFix = suggestFix(state.bg, d.color, d.target);
      if (bgFix) chips.push({ label: d.bgLabel, hex: bgFix, apply: 'bg' });
      else unreachable.push(d.name);
    });

    var wrap = $('cc-fixes');
    var host = $('cc-fix-chips');
    var impossible = $('cc-fix-impossible');
    host.textContent = '';
    impossible.textContent = unreachable.length
      ? 'Out of reach by changing any single color: ' + unreachable.join(', ') + '. Both colors would need to move.'
      : '';
    impossible.hidden = !unreachable.length;
    if (!chips.length && !unreachable.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    chips.forEach(function (c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cc-fix';
      var sw = document.createElement('span');
      sw.className = 'cc-fix-swatch';
      sw.style.background = c.hex;
      sw.setAttribute('aria-hidden', 'true');
      var text = document.createElement('span');
      text.textContent = c.label + ': ';
      var hex = document.createElement('span');
      hex.className = 'cc-mono';
      hex.textContent = c.hex;
      btn.appendChild(sw);
      btn.appendChild(text);
      btn.appendChild(hex);
      btn.addEventListener('click', function () {
        setColor(c.apply, c.hex);
      });
      host.appendChild(btn);
    });
  }

  /* ---- Render ---- */
  function render() {
    preview.style.setProperty('--pv-text', state.text);
    preview.style.setProperty('--pv-bg', state.bg);
    preview.style.setProperty('--pv-link', state.link);

    var rTB = ratio(state.text, state.bg);
    $('cc-ratio-big').textContent = fmt(rTB);
    CARDS.forEach(function (c) {
      var pass = rTB >= c.min;
      c.el.querySelector('.cc-card-verdict').textContent = pass ? 'Pass' : 'Fail';
      if (pass) c.el.removeAttribute('data-state');
      else c.el.setAttribute('data-state', 'fail');
    });

    var rLB = ratio(state.link, state.bg);
    var rLT = ratio(state.link, state.text);
    $('cc-linkbg-ratio').textContent = fmt(rLB);
    setBadge($('cc-linkbg-aa'), rLB >= 4.5, 'AA');
    setBadge($('cc-linkbg-aaa'), rLB >= 7, 'AAA');
    $('cc-linktext-ratio').textContent = fmt(rLT);
    setBadge($('cc-linktext-badge'), rLT >= 3, '3:1');

    var underlined = $('cc-underline').checked;
    preview.classList.toggle('cc-no-underline', !underlined);
    $('cc-linktext-note').textContent = underlined
      ? 'Your links are underlined, so the 3:1 check against surrounding text is informational. It only becomes a requirement when color is the one thing marking a link as a link.'
      : 'Your links are not underlined, so they need at least 3:1 against the surrounding text as well as passing against the background. If that is hard to reach, the honest fix is to keep the underline.';

    renderFixes();
    syncUrl();
    announce();
  }

  function setColor(which, hex) {
    state[which] = hex;
    fields[which].hex.value = hex;
    fields[which].pick.value = hex;
    if (fields[which].clearInvalid) fields[which].clearInvalid();
    else fields[which].hex.removeAttribute('aria-invalid');
    render();
  }

  /* ---- Input wiring ---- */
  Object.keys(fields).forEach(function (key) {
    var f = fields[key];
    f.hint = $('cc-' + key + '-hint');
    f.hintDefault = f.hint.textContent;
    function markInvalid() {
      f.hex.setAttribute('aria-invalid', 'true');
      f.hint.textContent = 'Not a valid hex. Results still show the last valid color.';
      f.hint.classList.add('cc-hint-error');
    }
    function clearInvalid() {
      f.hex.removeAttribute('aria-invalid');
      f.hint.textContent = f.hintDefault;
      f.hint.classList.remove('cc-hint-error');
    }
    f.clearInvalid = clearInvalid;
    f.pick.addEventListener('input', function () { setColor(key, f.pick.value); });
    f.hex.addEventListener('input', function () {
      var norm = normaliseHex(f.hex.value);
      if (norm) {
        state[key] = norm;
        f.pick.value = norm;
        clearInvalid();
        render();
      } else {
        markInvalid();
      }
    });
    f.hex.addEventListener('blur', function () {
      /* Tidy shorthand into the canonical form once the field loses focus. */
      var norm = normaliseHex(f.hex.value);
      if (norm) f.hex.value = norm;
      else f.hex.value = state[key];
      clearInvalid();
    });
  });

  $('cc-swap').addEventListener('click', function () {
    var t = state.text;
    setColor('text', state.bg);
    setColor('bg', t);
  });

  $('cc-underline').addEventListener('change', render);

  /* Color vision simulation. The classes swap SVG filters onto the preview
     samples only; the verdicts always judge the true colors, and the note
     under the control says so. */
  document.querySelectorAll('input[name="cc-cvd"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      preview.classList.remove('cc-cvd-prot', 'cc-cvd-deuter', 'cc-cvd-trit');
      if (radio.value !== 'none') preview.classList.add('cc-cvd-' + radio.value);
      live.textContent = radio.value === 'none'
        ? 'Preview showing typical color vision.'
        : 'Preview simulating ' + radio.dataset.name + '. Pass and fail still judge the real colors.';
    });
  });

  document.querySelectorAll('.cc-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setColor('text', '#' + btn.dataset.text);
      setColor('bg', '#' + btn.dataset.bg);
      setColor('link', '#' + btn.dataset.link);
    });
  });

  /* EyeDropper is Chromium only; the buttons stay hidden elsewhere. */
  if ('EyeDropper' in window) {
    Object.keys(fields).forEach(function (key) {
      var btn = fields[key].eye;
      btn.hidden = false;
      btn.addEventListener('click', function () {
        new window.EyeDropper().open().then(function (result) {
          var norm = normaliseHex(result.sRGBHex);
          if (norm) setColor(key, norm);
        }).catch(function () { /* user pressed Escape, nothing to do */ });
      });
    });
  }

  /* ---- Share ---- */
  $('cc-share-btn').addEventListener('click', function () {
    var url = buildShareUrl();
    var btn = $('cc-share-btn');
    function done() {
      btn.textContent = 'Copied ✓';
      setTimeout(function () { btn.textContent = 'Copy link'; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () {
        $('cc-share-url').select();
      });
    } else {
      $('cc-share-url').select();
      document.execCommand('copy');
      done();
    }
  });

  /* ---- Palette matrix ---- */
  var MAX_PALETTE = 12;
  function parsePalette(text) {
    var seen = {};
    var out = [];
    var invalid = 0;
    String(text).split(/[\s,]+/).forEach(function (token) {
      if (!token) return;
      var norm = normaliseHex(token);
      if (!norm) { invalid++; return; }
      if (!seen[norm]) { seen[norm] = true; out.push(norm); }
    });
    return { colors: out, invalid: invalid };
  }

  function renderMatrix() {
    var parsed = parsePalette($('cc-palette').value);
    var colors = parsed.colors;
    var note = [];
    if (parsed.invalid) note.push(parsed.invalid + ' value' + (parsed.invalid === 1 ? '' : 's') + ' skipped, not valid hex');
    if (colors.length > MAX_PALETTE) {
      note.push('showing the first ' + MAX_PALETTE + ' of ' + colors.length + ' colors');
      colors = colors.slice(0, MAX_PALETTE);
    }
    $('cc-matrix-note').textContent = note.join('. ');

    var host = $('cc-matrix');
    host.textContent = '';
    if (colors.length < 2) {
      var p = document.createElement('p');
      p.className = 'cc-note';
      p.textContent = 'Add at least two colors to build a matrix.';
      host.appendChild(p);
      state.palette = [];
      syncUrl();
      live.textContent = 'Add at least two colors to build a matrix.';
      return;
    }
    state.palette = colors;
    syncUrl();
    live.textContent = 'Palette checked: ' + colors.length + ' colors, ' + (colors.length * colors.length - colors.length) + ' pairs.' + (note.length ? ' ' + note.join('. ') + '.' : '');

    var table = document.createElement('table');
    table.className = 'cc-matrix-table';
    var caption = document.createElement('caption');
    caption.className = 'sr-only';
    caption.textContent = 'Contrast ratio for every foreground and background pair in your palette. Rows are foreground colors, columns are backgrounds.';
    table.appendChild(caption);

    var thead = document.createElement('thead');
    var hrow = document.createElement('tr');
    var corner = document.createElement('th');
    corner.scope = 'col';
    corner.textContent = 'FG \\ BG';
    hrow.appendChild(corner);
    colors.forEach(function (bg) {
      var th = document.createElement('th');
      th.scope = 'col';
      var sw = document.createElement('span');
      sw.className = 'cc-swatch';
      sw.style.background = bg;
      sw.setAttribute('aria-hidden', 'true');
      th.appendChild(sw);
      th.appendChild(document.createTextNode(bg));
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    colors.forEach(function (fg) {
      var row = document.createElement('tr');
      var th = document.createElement('th');
      th.scope = 'row';
      var sw = document.createElement('span');
      sw.className = 'cc-swatch';
      sw.style.background = fg;
      sw.setAttribute('aria-hidden', 'true');
      th.appendChild(sw);
      th.appendChild(document.createTextNode(fg));
      row.appendChild(th);
      colors.forEach(function (bg) {
        var td = document.createElement('td');
        if (fg === bg) {
          var same = document.createElement('span');
          same.className = 'cc-cell-same';
          same.textContent = '·';
          same.setAttribute('aria-hidden', 'true');
          td.appendChild(same);
        } else {
          var r = ratio(fg, bg);
          var band = r >= 7 ? 'aaa' : r >= 4.5 ? 'aa' : r >= 3 ? 'aal' : 'fail';
          var bandText = band === 'aaa' ? 'passes AAA' : band === 'aa' ? 'passes AA' : band === 'aal' ? 'passes AA for large text only' : 'fails WCAG';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cc-cell cc-band-' + band;
          btn.textContent = (Math.round(r * 100) / 100).toFixed(2);
          btn.setAttribute('aria-label', fg + ' on ' + bg + ', ratio ' + fmt(r) + ', ' + bandText + '. Load this pair into the checker.');
          btn.addEventListener('click', function () {
            setColor('text', fg);
            setColor('bg', bg);
            document.getElementById('tool').scrollIntoView();
            live.textContent = 'Loaded ' + fg + ' on ' + bg + ' into the checker.';
          });
          td.appendChild(btn);
        }
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  }

  $('cc-matrix-btn').addEventListener('click', renderMatrix);

  /* ---- Load state from a share link ---- */
  (function initFromUrl() {
    var params = new URLSearchParams(location.search);
    ['text', 'bg', 'link'].forEach(function (key) {
      var norm = normaliseHex(params.get(key));
      if (norm) {
        state[key] = norm;
        fields[key].hex.value = norm;
        fields[key].pick.value = norm;
      }
    });
    var palette = params.get('palette');
    if (palette) {
      var parsed = parsePalette(palette.split('-').join('\n'));
      if (parsed.colors.length >= 2) {
        $('cc-palette').value = parsed.colors.join('\n');
      }
    }
  })();

  render();
  renderMatrix();
})();
