/* Real estate exam prep.
   Everything lives in localStorage. No account, no server, nothing leaves the
   device. That also means clearing site data wipes the history, which the page
   says out loud rather than burying. */
(function () {
  'use strict';

  var root = document.querySelector('[data-rep]');
  if (!root) return;

  var STORE = 'coffeeandfun.realtor-exam.v1';
  var SESSION_SIZE = 15;

  var bank = [];
  var state = { queue: [], index: 0, answers: [], size: SESSION_SIZE, topic: 'all' };

  var el = function (sel) { return root.querySelector(sel); };
  var els = function (sel) { return [].slice.call(root.querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- storage */

  function blank() { return { version: 1, sessions: [], q: {} }; }

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return blank();
      var parsed = JSON.parse(raw);
      return parsed && parsed.version === 1 ? parsed : blank();
    } catch (e) { return blank(); }
  }

  function save(data) {
    try { localStorage.setItem(STORE, JSON.stringify(data)); return true; }
    catch (e) { return false; }   /* private mode, or quota. Never break the quiz over it. */
  }

  /* ---------------------------------------------------------------- picking */

  /* Weakest first. A question you have got wrong is worth far more revision
     than one you have never seen, and one you have never seen is worth more
     than one you keep getting right. Ties break by how long ago you saw it. */
  function priority(q, store) {
    var s = store.q[q.id];
    if (!s) return 50;                       /* unseen */
    var attempts = s.right + s.wrong;
    if (!attempts) return 50;
    var accuracy = s.right / attempts;
    var base = 100 - accuracy * 100;         /* 0 correct -> 100, all correct -> 0 */
    var stale = Math.min(20, (Date.now() - (s.last || 0)) / 86400000);
    return base + stale;
  }

  function buildQueue() {
    var store = load();
    var pool = bank.filter(function (q) {
      return state.topic === 'all' || q.topic === state.topic;
    });
    var scored = pool.map(function (q) { return { q: q, p: priority(q, store) }; });
    /* Sort by priority, then take a slightly larger slice and shuffle it, so two
       sessions in a row are not identical while still favouring weak areas. */
    scored.sort(function (a, b) { return b.p - a.p; });
    var slice = scored.slice(0, Math.min(scored.length, state.size * 2)).map(function (x) { return x.q; });
    for (var i = slice.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = slice[i]; slice[i] = slice[j]; slice[j] = t;
    }
    return slice.slice(0, Math.min(state.size, pool.length));
  }

  /* ------------------------------------------------------------------- quiz */

  function show(screen) {
    els('[data-screen]').forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== screen; });
  }

  function startSession() {
    state.queue = buildQueue();
    state.index = 0;
    state.answers = [];
    if (!state.queue.length) { alert('No questions available for that topic.'); return; }
    show('quiz');
    renderQuestion();
    el('[data-rep-quiz]').focus();
  }

  function renderQuestion() {
    var q = state.queue[state.index];
    el('[data-rep-progress]').textContent = 'Question ' + (state.index + 1) + ' of ' + state.queue.length;
    el('[data-rep-topic]').textContent = q.topic;
    el('[data-rep-question]').textContent = q.q;
    el('[data-rep-bar]').style.width = ((state.index) / state.queue.length * 100) + '%';

    var list = el('[data-rep-choices]');
    list.innerHTML = '';
    q.choices.forEach(function (choice, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rep-choice';
      btn.innerHTML = '<span class="rep-letter">' + 'ABCD'[i] + '</span><span>' + escapeHtml(choice) + '</span>';
      btn.addEventListener('click', function () { answer(i); });
      li.appendChild(btn);
      list.appendChild(li);
    });

    el('[data-rep-feedback]').hidden = true;
    el('[data-rep-next]').hidden = true;
  }

  function answer(picked) {
    var q = state.queue[state.index];
    var correct = picked === q.answer;
    state.answers.push({ id: q.id, picked: picked, correct: correct });

    els('.rep-choice').forEach(function (b, i) {
      b.disabled = true;
      if (i === q.answer) b.classList.add('is-right');
      else if (i === picked) b.classList.add('is-wrong');
    });

    var fb = el('[data-rep-feedback]');
    fb.className = 'rep-feedback ' + (correct ? 'is-right' : 'is-wrong');
    fb.innerHTML =
      '<p class="rep-verdict">' + (correct ? 'Correct' : 'Not quite') + '</p>' +
      '<p>' + escapeHtml(q.why) + '</p>' +
      (q.tip ? '<p class="rep-tip"><strong>Remember:</strong> ' + escapeHtml(q.tip) + '</p>' : '');
    fb.hidden = false;

    var next = el('[data-rep-next]');
    next.textContent = state.index + 1 >= state.queue.length ? 'See results' : 'Next question';
    next.hidden = false;
    next.focus();
  }

  function nextQuestion() {
    state.index++;
    if (state.index >= state.queue.length) { finish(); return; }
    renderQuestion();
  }

  /* ---------------------------------------------------------------- results */

  function finish() {
    var store = load();
    var byTopic = {};

    state.answers.forEach(function (a) {
      var q = bank.find(function (x) { return x.id === a.id; });
      if (!q) return;
      var s = store.q[a.id] || { right: 0, wrong: 0, last: 0 };
      if (a.correct) s.right++; else s.wrong++;
      s.last = Date.now();
      store.q[a.id] = s;
      if (!byTopic[q.topic]) byTopic[q.topic] = { right: 0, total: 0 };
      byTopic[q.topic].total++;
      if (a.correct) byTopic[q.topic].right++;
    });

    var right = state.answers.filter(function (a) { return a.correct; }).length;
    store.sessions.push({ at: Date.now(), total: state.answers.length, right: right });
    if (store.sessions.length > 200) store.sessions = store.sessions.slice(-200);
    var saved = save(store);

    var pct = Math.round(right / state.answers.length * 100);
    el('[data-rep-score]').textContent = right + ' of ' + state.answers.length;
    el('[data-rep-pct]').textContent = pct + '%';
    el('[data-rep-verdict]').textContent =
      pct >= 80 ? 'Comfortably above a typical 70 to 75 percent pass mark.'
        : pct >= 70 ? 'Around the usual pass mark. Worth pushing higher before exam day.'
        : 'Below a typical pass mark. The topic breakdown below shows where to spend your time.';

    /* topic breakdown for this session */
    var tb = el('[data-rep-topics]');
    tb.innerHTML = '';
    Object.keys(byTopic).sort(function (a, b) {
      return (byTopic[a].right / byTopic[a].total) - (byTopic[b].right / byTopic[b].total);
    }).forEach(function (t) {
      var d = byTopic[t];
      var p = Math.round(d.right / d.total * 100);
      var li = document.createElement('li');
      li.innerHTML = '<span class="rep-topic-name">' + escapeHtml(t) + '</span>' +
        '<span class="rep-topic-bar"><span style="width:' + p + '%"></span></span>' +
        '<span class="rep-topic-num">' + d.right + '/' + d.total + '</span>';
      tb.appendChild(li);
    });

    /* what you got wrong, with the explanation again */
    var missed = state.answers.filter(function (a) { return !a.correct; });
    var mw = el('[data-rep-missed-wrap]');
    var ml = el('[data-rep-missed]');
    ml.innerHTML = '';
    if (!missed.length) {
      mw.hidden = true;
    } else {
      mw.hidden = false;
      missed.forEach(function (a) {
        var q = bank.find(function (x) { return x.id === a.id; });
        var li = document.createElement('li');
        li.innerHTML =
          '<p class="rep-missed-topic">' + escapeHtml(q.topic) + '</p>' +
          '<p class="rep-missed-q">' + escapeHtml(q.q) + '</p>' +
          '<p class="rep-missed-you"><strong>You chose:</strong> ' + escapeHtml(q.choices[a.picked]) + '</p>' +
          '<p class="rep-missed-right"><strong>Correct:</strong> ' + escapeHtml(q.choices[q.answer]) + '</p>' +
          '<p>' + escapeHtml(q.why) + '</p>' +
          (q.tip ? '<p class="rep-tip"><strong>Remember:</strong> ' + escapeHtml(q.tip) + '</p>' : '');
        ml.appendChild(li);
      });
    }

    el('[data-rep-savewarn]').hidden = saved;
    renderLifetime();
    show('results');
    el('[data-rep-results]').focus();
  }

  /* --------------------------------------------------------------- lifetime */

  function renderLifetime() {
    var store = load();
    var ids = Object.keys(store.q);
    var attempted = 0, right = 0;
    var topics = {};

    ids.forEach(function (id) {
      var q = bank.find(function (x) { return x.id === id; });
      if (!q) return;
      var s = store.q[id];
      attempted += s.right + s.wrong;
      right += s.right;
      if (!topics[q.topic]) topics[q.topic] = { right: 0, total: 0, seen: 0 };
      topics[q.topic].right += s.right;
      topics[q.topic].total += s.right + s.wrong;
      topics[q.topic].seen++;
    });

    /* There are two of these, one on the start screen and one on results, so
       write to all of them rather than just the first querySelector match. */
    var hosts = els('[data-rep-lifetime]');
    var paint = function (html) { hosts.forEach(function (h) { h.innerHTML = html; }); };

    if (!attempted) {
      paint('<p class="rep-empty">No history yet. Finish a set and your weak areas will show up here.</p>');
      return;
    }

    var overall = Math.round(right / attempted * 100);
    var counts = bank.reduce(function (acc, q) { acc[q.topic] = (acc[q.topic] || 0) + 1; return acc; }, {});
    var rows = Object.keys(topics).map(function (t) {
      return { topic: t, pct: Math.round(topics[t].right / topics[t].total * 100), seen: topics[t].seen, of: counts[t] || 0, total: topics[t].total };
    }).sort(function (a, b) { return a.pct - b.pct; });

    var weakest = rows.slice(0, 3).filter(function (r) { return r.pct < 80; });

    paint(
      '<div class="rep-life-head">' +
        '<div><span class="rep-life-num">' + overall + '%</span><span class="rep-life-lab">overall, ' + attempted + ' answers across ' + store.sessions.length + ' set(s)</span></div>' +
        '<div><span class="rep-life-num">' + ids.length + '</span><span class="rep-life-lab">of ' + bank.length + ' questions seen</span></div>' +
      '</div>' +
      (weakest.length
        ? '<p class="rep-focus"><strong>Where to spend your next session:</strong> ' +
          weakest.map(function (r) { return escapeHtml(r.topic) + ' (' + r.pct + '%)'; }).join(', ') +
          '. Use the topic picker above to drill just those.</p>'
        : '<p class="rep-focus">Every topic is above 80 percent. Keep mixing full sets to hold it there.</p>') +
      '<ul class="rep-topic-list">' + rows.map(function (r) {
        return '<li><span class="rep-topic-name">' + escapeHtml(r.topic) + '</span>' +
          '<span class="rep-topic-bar"><span style="width:' + r.pct + '%"></span></span>' +
          '<span class="rep-topic-num">' + r.pct + '%</span></li>';
      }).join('') + '</ul>');
  }

  /* ------------------------------------------------------------------ utils */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------- wire */

  el('[data-rep-start]').addEventListener('click', startSession);
  el('[data-rep-next]').addEventListener('click', nextQuestion);
  el('[data-rep-again]').addEventListener('click', function () { show('start'); renderLifetime(); });
  el('[data-rep-restart]').addEventListener('click', startSession);

  el('[data-rep-quit]').addEventListener('click', function () {
    if (state.answers.length && !confirm('Leave this set? Your answers so far will not be saved.')) return;
    show('start');
    renderLifetime();
  });

  el('[data-rep-size]').addEventListener('change', function () { state.size = parseInt(this.value, 10) || SESSION_SIZE; });
  el('[data-rep-topicpick]').addEventListener('change', function () { state.topic = this.value; });

  el('[data-rep-reset]').addEventListener('click', function () {
    if (!confirm('Delete all your progress and start fresh? This cannot be undone.')) return;
    try { localStorage.removeItem(STORE); } catch (e) { /* nothing to do */ }
    renderLifetime();
  });

  /* ------------------------------------------------------------------- boot */

  fetch('/assets/data/realtor-exam.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      bank = data.questions || [];
      el('[data-rep-count]').textContent = bank.length;

      var topics = {};
      bank.forEach(function (q) { topics[q.topic] = (topics[q.topic] || 0) + 1; });
      var pick = el('[data-rep-topicpick]');
      Object.keys(topics).sort().forEach(function (t) {
        var o = document.createElement('option');
        o.value = t;
        o.textContent = t + ' (' + topics[t] + ')';
        pick.appendChild(o);
      });

      el('[data-rep-start]').disabled = false;
      renderLifetime();
    })
    .catch(function (e) {
      el('[data-rep-loaderr]').hidden = false;
      el('[data-rep-loaderr]').textContent = 'Could not load the question bank (' + e.message + '). Try refreshing.';
    });
})();
