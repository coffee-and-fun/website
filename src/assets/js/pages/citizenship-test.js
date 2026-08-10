/* US citizenship civics practice, 2008 test.
   Self-assessed rather than multiple choice, because the real test is oral: an
   officer asks and you answer out loud. Picking from four options teaches
   recognition, and recognition is not what gets tested.
   Everything is localStorage. Nothing leaves the device. */
(function () {
  'use strict';

  var root = document.querySelector('[data-ct]');
  if (!root) return;

  var STORE = 'coffeeandfun.civics2008.v1';
  var SET_SIZE = 10;
  var PASS_MARK = 6;

  var data = null, bank = [], places = [];
  var state = { queue: [], i: 0, answers: [], revealed: false };

  var el = function (s) { return root.querySelector(s); };
  var els = function (s) { return [].slice.call(root.querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* --------------------------------------------------------------- storage */

  function blank() { return { v: 1, place: '', mine: {}, q: {}, sets: [] }; }
  function load() {
    try { var r = localStorage.getItem(STORE); if (!r) return blank();
      var p = JSON.parse(r); return p && p.v === 1 ? p : blank(); } catch (e) { return blank(); }
  }
  function save(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); return true; } catch (e) { return false; } }

  /* ----------------------------------------------------------- your answers */

  /* The nine that change. Four depend on where you live, five on who currently
     holds office. USCIS prints neither, so neither does this: you fill them in
     and the app quizzes you on what you wrote. A hardcoded name would be wrong
     the moment an election happened. */
  function myAnswerFor(n) {
    var store = load();
    if (n === 44) {
      var p = places.find(function (x) { return x.code === store.place; });
      if (p) return p.capital ? p.capital : (p.note || 'Not a state, so no capital');
    }
    return (store.mine && store.mine[n]) || '';
  }

  function renderMine() {
    var store = load();
    var host = el('[data-ct-mine]');
    var place = places.find(function (p) { return p.code === store.place; });
    var variable = bank.filter(function (q) { return q.variable; });

    host.innerHTML = variable.map(function (q) {
      var v = q.variable;
      var auto = q.n === 44;
      var val = myAnswerFor(q.n);
      var na = place && ((v.kind === 'state' && q.n === 20 && !place.hasSenators) ||
                         (q.n === 43 && !place.hasGovernor));
      return '<div class="ct-mine-row">' +
        '<label for="ct-mine-' + q.n + '"><span class="ct-mine-n">' + q.n + '</span> ' + esc(q.q) + '</label>' +
        (auto
          ? '<p class="ct-auto">' + (val ? esc(val) : 'Pick where you live above') + '<span> filled in for you, capitals do not change</span></p>'
          : '<input id="ct-mine-' + q.n + '" type="text" data-ct-mineinput="' + q.n + '" value="' + esc(val) + '" placeholder="' + esc(v.label) + '" />') +
        (na ? '<p class="ct-na">' + esc(place.note) + '</p>' : '') +
        (v.lookup && !auto ? '<p class="ct-look"><a href="' + v.lookup + '" target="_blank" rel="noopener">Look this up<span class="sr-only"> (opens in a new tab)</span></a></p>' : '') +
        '</div>';
    }).join('');

    els('[data-ct-mineinput]').forEach(function (input) {
      input.addEventListener('change', function () {
        var s = load();
        s.mine[this.getAttribute('data-ct-mineinput')] = this.value.trim();
        save(s);
        renderReady();
      });
    });
    renderReady();
  }

  function renderReady() {
    var store = load();
    var missing = bank.filter(function (q) { return q.variable && !myAnswerFor(q.n); });
    var note = el('[data-ct-ready]');
    if (!store.place) {
      note.textContent = 'Pick where you live to start.';
      note.className = 'ct-ready is-warn';
    } else if (missing.length) {
      note.textContent = missing.length + ' of your own answers still blank. You can practise without them, and those questions will be skipped.';
      note.className = 'ct-ready is-warn';
    } else {
      note.textContent = 'All set. Every one of the 100 questions is ready to practise.';
      note.className = 'ct-ready is-ok';
    }
  }

  /* ------------------------------------------------------------------- quiz */

  function show(name) {
    els('[data-screen]').forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== name; });
  }

  function priority(q, store) {
    var s = store.q[q.n];
    if (!s) return 60;
    var tries = s.right + s.wrong;
    if (!tries) return 60;
    return 100 - (s.right / tries) * 100 + Math.min(15, (Date.now() - (s.last || 0)) / 86400000);
  }

  function start() {
    var store = load();
    var seniorOnly = el('[data-ct-senior]').checked;
    var pool = bank.filter(function (q) {
      if (seniorOnly && !q.seniorSet) return false;
      if (q.variable && !myAnswerFor(q.n)) return false;   /* skip what we cannot mark */
      return true;
    });
    if (pool.length < 1) { alert('Nothing to practise yet. Pick your state and fill in a few answers.'); return; }

    var scored = pool.map(function (q) { return { q: q, p: priority(q, store) }; });
    scored.sort(function (a, b) { return b.p - a.p; });
    var slice = scored.slice(0, Math.min(scored.length, SET_SIZE * 3)).map(function (x) { return x.q; });
    for (var i = slice.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)); var t = slice[i]; slice[i] = slice[j]; slice[j] = t;
    }
    state.queue = slice.slice(0, Math.min(SET_SIZE, pool.length));
    state.i = 0; state.answers = [];
    show('quiz'); renderQ();
  }

  function renderQ() {
    var q = state.queue[state.i];
    state.revealed = false;
    el('[data-ct-count]').textContent = 'Question ' + (state.i + 1) + ' of ' + state.queue.length;
    el('[data-ct-num]').textContent = 'Official question ' + q.n;
    el('[data-ct-q]').textContent = q.q;
    el('[data-ct-bar]').style.width = (state.i / state.queue.length * 100) + '%';
    el('[data-ct-answer]').hidden = true;
    el('[data-ct-reveal]').hidden = false;
    el('[data-ct-mark]').hidden = true;
    el('[data-ct-reveal]').focus();
  }

  function reveal() {
    var q = state.queue[state.i];
    state.revealed = true;
    var list;
    if (q.variable) {
      list = '<li><strong>' + esc(myAnswerFor(q.n)) + '</strong> <span class="ct-yours">your answer</span></li>';
    } else {
      list = q.answers.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
    }
    el('[data-ct-answer]').innerHTML =
      '<p class="ct-alabel">' + (q.answers.length > 1 && !q.variable ? 'Any one of these is accepted' : 'Accepted answer') + '</p>' +
      '<ul class="ct-alist">' + list + '</ul>';
    el('[data-ct-answer]').hidden = false;
    el('[data-ct-reveal]').hidden = true;
    el('[data-ct-mark]').hidden = false;
    el('[data-ct-right]').focus();
  }

  function mark(right) {
    state.answers.push({ n: state.queue[state.i].n, right: right });
    state.i++;
    if (state.i >= state.queue.length) finish(); else renderQ();
  }

  function finish() {
    var store = load();
    state.answers.forEach(function (a) {
      var s = store.q[a.n] || { right: 0, wrong: 0, last: 0 };
      if (a.right) s.right++; else s.wrong++;
      s.last = Date.now();
      store.q[a.n] = s;
    });
    var right = state.answers.filter(function (a) { return a.right; }).length;
    store.sets.push({ at: Date.now(), total: state.answers.length, right: right });
    if (store.sets.length > 200) store.sets = store.sets.slice(-200);
    var ok = save(store);

    var passed = right >= PASS_MARK && state.answers.length >= SET_SIZE;
    el('[data-ct-score]').textContent = right + ' of ' + state.answers.length;
    el('[data-ct-pass]').textContent = passed ? 'That would pass' : 'That would not pass';
    el('[data-ct-pass]').className = 'ct-pass ' + (passed ? 'is-ok' : 'is-warn');
    el('[data-ct-passnote]').textContent = state.answers.length >= SET_SIZE
      ? 'The real test asks up to 10 and you need ' + PASS_MARK + ' correct.'
      : 'A full set is 10 questions, and you need ' + PASS_MARK + ' of them.';

    var missed = state.answers.filter(function (a) { return !a.right; });
    el('[data-ct-missedwrap]').hidden = !missed.length;
    el('[data-ct-missed]').innerHTML = missed.map(function (a) {
      var q = bank.find(function (x) { return x.n === a.n; });
      var ans = q.variable ? myAnswerFor(q.n) : q.answers.join(' / ');
      return '<li><p class="ct-missed-q"><span class="ct-mine-n">' + q.n + '</span> ' + esc(q.q) + '</p>' +
             '<p class="ct-missed-a">' + esc(ans) + '</p></li>';
    }).join('');

    el('[data-ct-savewarn]').hidden = ok;
    renderStats();
    show('results');
  }

  /* ------------------------------------------------------------------ stats */

  function renderStats() {
    var store = load();
    var seen = Object.keys(store.q);
    var hosts = els('[data-ct-stats]');
    var paint = function (h) { hosts.forEach(function (x) { x.innerHTML = h; }); };

    if (!seen.length) {
      paint('<p class="ct-empty">No history yet. Finish a set and the questions you keep missing will be listed here.</p>');
      return;
    }
    var tries = 0, right = 0;
    seen.forEach(function (n) { tries += store.q[n].right + store.q[n].wrong; right += store.q[n].right; });

    var weak = seen.map(function (n) {
      var s = store.q[n], t = s.right + s.wrong;
      return { n: +n, pct: Math.round(s.right / t * 100), t: t };
    }).filter(function (x) { return x.pct < 100; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 12);

    paint(
      '<div class="ct-stat-head">' +
        '<div><span class="ct-stat-num">' + Math.round(right / tries * 100) + '%</span><span class="ct-stat-lab">correct, ' + tries + ' answers over ' + store.sets.length + ' set(s)</span></div>' +
        '<div><span class="ct-stat-num">' + seen.length + '</span><span class="ct-stat-lab">of 100 questions seen</span></div>' +
      '</div>' +
      (weak.length
        ? '<p class="ct-weaklead">The ones you keep missing:</p><ul class="ct-weak">' + weak.map(function (w) {
            var q = bank.find(function (x) { return x.n === w.n; });
            return '<li><span class="ct-mine-n">' + w.n + '</span> ' + esc(q ? q.q : '') + ' <span class="ct-weakpct">' + w.pct + '%</span></li>';
          }).join('') + '</ul>'
        : '<p class="ct-weaklead">Every question you have seen, you have got right at least once.</p>')
    );
  }

  /* ------------------------------------------------------------------- wire */

  el('[data-ct-start]').addEventListener('click', start);
  el('[data-ct-reveal]').addEventListener('click', reveal);
  el('[data-ct-right]').addEventListener('click', function () { mark(true); });
  el('[data-ct-wrong]').addEventListener('click', function () { mark(false); });
  el('[data-ct-again]').addEventListener('click', start);
  el('[data-ct-home]').addEventListener('click', function () { show('setup'); renderStats(); });
  el('[data-ct-quit]').addEventListener('click', function () { show('setup'); renderStats(); });
  el('[data-ct-reset]').addEventListener('click', function () {
    if (!confirm('Delete your place, your answers and all your progress?')) return;
    try { localStorage.removeItem(STORE); } catch (e) {}
    el('[data-ct-place]').value = '';
    renderMine(); renderStats();
  });

  el('[data-ct-place]').addEventListener('change', function () {
    var code = this.value;                 /* capture, rather than binding `this` into the find */
    var s = load(); s.place = code; save(s);
    var p = places.find(function (x) { return x.code === code; });
    el('[data-ct-placenote]').textContent = p && p.note ? p.note : '';
    el('[data-ct-placenote]').hidden = !(p && p.note);
    renderMine();
  });

  /* ------------------------------------------------------------------- boot */

  fetch('/assets/data/civics-2008.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      data = d; bank = d.questions; places = d.places;
      var store = load();
      var sel = el('[data-ct-place]');
      places.forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.code; o.textContent = p.name;
        if (p.code === store.place) o.selected = true;
        sel.appendChild(o);
      });
      var cur = places.find(function (p) { return p.code === store.place; });
      el('[data-ct-placenote]').textContent = cur && cur.note ? cur.note : '';
      el('[data-ct-placenote]').hidden = !(cur && cur.note);
      el('[data-ct-start]').disabled = false;
      renderMine();
      renderStats();
    })
    .catch(function (e) {
      var w = el('[data-ct-loaderr]');
      w.hidden = false;
      w.textContent = 'Could not load the questions (' + e.message + '). Try refreshing.';
    });
})();
