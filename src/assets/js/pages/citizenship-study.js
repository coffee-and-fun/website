/* Shared, dependency-free study rules. Also used by tools/citizenship-test.mjs. */
(function (scope) {
  'use strict';
  const localRoles = ['senators', 'representative', 'governor', 'capital'];
  const blank = () => ({ v: 2, version: '2025', place: '', districts: {}, senior: false, q: {}, mine: {}, bookmarks: [], session: null });
  const districtFor = prefs => prefs.districts?.[prefs.place] || '';
  const key = (q, prefs) => `${prefs.version}:${q.n}${localRoles.includes(q.variable) ? ':' + prefs.place : ''}${q.variable === 'representative' && districtFor(prefs) ? ':' + districtFor(prefs) : ''}`;
  const answerKey = (role, place, district = '') => localRoles.includes(role) ? `${role}:${place}${role === 'representative' && district ? ':' + district : ''}` : role;
  const emptyStat = () => ({ right: 0, wrong: 0, streak: 0, assisted: 0, needsReview: false, last: 0, lastResult: null });
  function normalize(raw) {
    const data = blank();
    if (!raw || raw.v !== 2) return data;
    data.version = raw.version === '2008' ? '2008' : '2025';
    data.place = typeof raw.place === 'string' ? raw.place : '';
    data.senior = raw.senior === true;
    if (raw.districts && typeof raw.districts === 'object') Object.entries(raw.districts).forEach(([place, district]) => {
      if (/^[A-Z]{2}$/.test(place) && typeof district === 'string' && /^\d{2}$/.test(district)) data.districts[place] = district;
    });
    if (raw.q && typeof raw.q === 'object' && !Array.isArray(raw.q)) {
      Object.entries(raw.q).forEach(([id, stat]) => {
        if (!/^(2008|2025):\d+(:[A-Z]{0,2}(:\d{2})?)?$/.test(id) || !stat || typeof stat !== 'object') return;
        const safe = emptyStat();
        ['right', 'wrong', 'streak', 'assisted', 'last'].forEach(k => { safe[k] = Number.isFinite(stat[k]) && stat[k] >= 0 ? stat[k] : 0; });
        safe.needsReview = stat.needsReview === true;
        safe.lastResult = ['correct', 'hinted', 'wrong'].includes(stat.lastResult) ? stat.lastResult : null;
        data.q[id] = safe;
      });
    }
    if (raw.mine && typeof raw.mine === 'object') Object.entries(raw.mine).forEach(([k, v]) => {
      if (/^(senators|representative|governor|capital|president|vicePresident|party|speaker|chiefJustice|justices)(:[A-Z]{0,2}(:\d{2})?)?$/.test(k) && typeof v === 'string') data.mine[k] = v.slice(0, 250);
    });
    data.bookmarks = Array.isArray(raw.bookmarks) ? raw.bookmarks.filter(k => /^(2008|2025):\d+$/.test(k)) : [];
    // Sessions are validated against the loaded question bank by the UI.
    data.session = raw.session && typeof raw.session === 'object' ? raw.session : null;
    return data;
  }
  function migrate(legacy, oldBank) {
    const data = blank();
    if (!legacy || legacy.v !== 1) return data;
    data.version = '2008';
    data.place = typeof legacy.place === 'string' ? legacy.place : '';
    oldBank.forEach(q => {
      const stat = legacy.q && legacy.q[q.n];
      if (stat) data.q[key(q, data)] = { ...emptyStat(), right: stat.right || 0, wrong: stat.wrong || 0, needsReview: stat.wrong > 0, last: stat.last || 0 };
      const own = legacy.mine && legacy.mine[q.n];
      if (q.variable && typeof own === 'string') data.mine[answerKey(q.variable, data.place)] = own;
    });
    return normalize(data);
  }
  function record(previous, correct, assisted = false, now = Date.now()) {
    const stat = { ...emptyStat(), ...previous, last: now, lastResult: correct ? assisted ? 'hinted' : 'correct' : 'wrong' };
    if (correct) {
      stat.right++;
      if (assisted) { stat.assisted++; stat.streak = 0; stat.needsReview = true; }
      else { stat.streak++; if (stat.streak >= 2) stat.needsReview = false; }
    } else { stat.wrong++; stat.streak = 0; stat.needsReview = true; }
    return stat;
  }
  function pool(bank, prefs, mode = 'all', topic = '') {
    return bank.filter(q => {
      const stat = prefs.q[key(q, prefs)];
      return (!prefs.senior || q.seniorSet) && (!topic || q.topic === topic) &&
        (mode !== 'missed' || (stat?.needsReview && stat.wrong > 0)) &&
        (mode !== 'review' || stat?.needsReview) &&
        (mode !== 'unseen' || !stat || stat.right + stat.wrong === 0) &&
        (mode !== 'saved' || prefs.bookmarks.includes(`${prefs.version}:${q.n}`));
    });
  }
  function queue(bank, prefs, mode = 'all', topic = '', size = 10, random = Math.random) {
    // Ordered study is one resumable run through the entire selected set.
    if (mode === 'ordered') return pool(bank, prefs, mode, topic).map(q => q.n).sort((a, b) => a - b);
    const items = pool(bank, prefs, mode, topic).map(q => ({ q, jitter: random(), stat: prefs.q[key(q, prefs)] || emptyStat() }));
    if (mode === 'exam') return items.sort((a, b) => a.jitter - b.jitter).slice(0, size).map(x => x.q.n);
    // Reserve most cards for unseen questions so difficult cards cannot starve the rest of the bank.
    const unseen = items.filter(x => !x.stat.right && !x.stat.wrong).sort((a, b) => a.jitter - b.jitter);
    const review = items.filter(x => x.stat.needsReview).sort((a, b) => a.stat.last - b.stat.last || a.jitter - b.jitter);
    const selected = mode === 'all' ? [...review.slice(0, 3), ...unseen] : [];
    const rest = items.sort((a, b) => a.stat.last - b.stat.last || a.jitter - b.jitter);
    return [...new Set([...selected, ...rest].map(x => x.q.n))].slice(0, size);
  }
  function history(bank, prefs, repeatedOnly = false) {
    return pool(bank, prefs).map(question => ({ question, stat: prefs.q[key(question, prefs)] || emptyStat() }))
      .filter(({ stat }) => stat.right + stat.wrong > 0 && (!repeatedOnly || stat.wrong >= 2))
      .sort((a, b) => (repeatedOnly ? b.stat.wrong - a.stat.wrong : 0) || b.stat.last - a.stat.last || a.question.n - b.question.n);
  }
  function sheetPool(bank, prefs, scope = 'all') {
    if (scope === 'all') return pool(bank, prefs);
    return history(bank, prefs, scope === 'repeated').filter(({ stat }) => stat.wrong > 0)
      .sort((a, b) => b.stat.wrong - a.stat.wrong || b.stat.last - a.stat.last || a.question.n - b.question.n)
      .map(({ question }) => question);
  }
  function resolve(q, prefs, places, refs) {
    if (!q.variable) return { answers: q.answers, ready: true, source: '', custom: false };
    const role = q.variable;
    const own = prefs.mine[answerKey(role, prefs.place, districtFor(prefs))];
    if (own) return { answers: [own], ready: true, custom: true, source: '' };
    const place = places.find(p => p.code === prefs.place);
    let answers = [], source = '', dated = false, verifiedOn = refs.verifiedOn;
    if (localRoles.includes(role)) {
      if (place) {
        const ref = refs.places[place.code];
        if (role === 'capital') answers = [place.capital || 'D.C. is not a state and does not have a capital.'];
        if (role === 'senators') {
          answers = place.hasSenators ? (ref?.senators || []).map(s => s.name) : [`${place.name} has no U.S. senators.`];
          source = refs.senateSource; dated = place.hasSenators;
        }
        if (role === 'governor') {
          answers = place.hasGovernor ? (ref?.governor ? [ref.governor.name] : []) : ['D.C. does not have a governor.'];
          source = ref?.governor?.source || refs.governorSource; dated = place.hasGovernor;
        }
        if (role === 'representative') {
          const seats = refs.representatives?.places[place.code] || [];
          const seat = seats.length === 1 ? seats[0] : seats.find(s => s.district === districtFor(prefs));
          if (seat) {
            source = seat.source; dated = true; verifiedOn = refs.representatives.verifiedOn;
            if (seat.vacant) return { answers: ['This district’s House seat is vacant in the reference roster. Check the official directory before your interview.'], ready: false, source, dated, verifiedOn, custom: false };
            answers = [seat.name];
          } else if (!place.hasSenators) answers = [`${place.name} has no voting U.S. representative.`];
        }
      }
    } else if (refs.national[role]) {
      answers = [refs.national[role].name]; source = refs.national[role].source; dated = true;
    }
    return { answers: answers.length ? answers : [role === 'representative' ? 'Choose your state and congressional district in Set up to fill in your representative.' : 'Choose your state in Set up to fill in this answer.'], ready: answers.length > 0, source, dated, verifiedOn, custom: false };
  }
  function examRules(prefs) { return prefs.version === '2025' && !prefs.senior ? { size: 20, pass: 12 } : { size: 10, pass: 6 }; }
  function examOutcome(answers, rules) {
    const correct = answers.filter(a => a.correct).length;
    if (correct >= rules.pass) return 'passed';
    if (answers.length - correct > rules.size - rules.pass || answers.length >= rules.size) return 'practice';
    return null;
  }
  const api = { blank, normalize, migrate, key, answerKey, districtFor, emptyStat, record, pool, queue, history, sheetPool, resolve, examRules, examOutcome };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else scope.CivicsStudy = api;
})(globalThis);
