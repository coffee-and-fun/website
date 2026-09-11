/* Citizenship study UI. Data and progress stay in this browser. */
(function () {
  'use strict';
  const root = document.querySelector('[data-ct]');
  if (!root || !window.CivicsStudy) return;
  const C = window.CivicsStudy;
  const STORE = 'coffeeandfun.civics.v2';
  const LEGACY = 'coffeeandfun.civics2008.v1';
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const list = answers => '<ul>' + answers.map(a => `<li>${esc(a)}</li>`).join('') + '</ul>';
  const bookmarkKey = q => `${prefs.version}:${q.n}`;
  let banks, places, refs, prefs, view = 'study', historyFilter = 'all', loading = false, revealed = false, hinted = false, gesture = null;
  const bank = () => banks[prefs.version].questions;
  const current = () => bank().find(q => q.n === prefs.session?.queue[prefs.session.i]);
  const stat = q => prefs.q[C.key(q, prefs)] || C.emptyStat();
  const resolved = q => C.resolve(q, prefs, places, refs);
  const announce = text => { $('[data-status]').textContent = text; };
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(prefs)); $('[data-save-error]').hidden = true; }
    catch (_) { $('[data-save-error]').hidden = false; }
  }
  function stopSpeech() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  function restoreSession() {
    const s = prefs.session;
    const valid = s && ['all', 'missed', 'review', 'saved', 'unseen', 'exam', 'repeat'].includes(s.mode) &&
      Array.isArray(s.queue) && s.queue.length <= 128 && new Set(s.queue).size === s.queue.length &&
      s.queue.every(n => bank().some(q => q.n === n && (!prefs.senior || q.seniorSet))) &&
      Number.isInteger(s.i) && s.i >= 0 && s.i <= s.queue.length && Array.isArray(s.answers) && s.answers.length === s.i &&
      s.answers.every((a, i) => a && a.n === s.queue[i] && typeof a.correct === 'boolean' && typeof a.skipped === 'boolean' && typeof a.assisted === 'boolean' && (a.before === null || (a.before && typeof a.before === 'object')));
    if (!valid) { prefs.session = null; return false; }
    // Do not let modified storage supply markup or an arbitrary filter.
    s.topic = typeof s.topic === 'string' && bank().some(q => q.topic === s.topic) ? s.topic : '';
    s.hinted = s.hinted === true;
    s.answers.forEach(a => {
      if (a.before) a.before = C.normalize({ v: 2, q: { '2025:1': a.before } }).q['2025:1'];
    });
    return true;
  }
  function begin(mode = $('#ct-mode').value, ids = null) {
    stopSpeech();
    const rules = C.examRules(prefs);
    const topic = mode === 'exam' || mode === 'repeat' ? '' : $('#ct-topic').value;
    prefs.session = { mode, topic, queue: ids || C.queue(bank(), prefs, mode, topic, mode === 'exam' ? rules.size : 10), i: 0, answers: [], hinted: false };
    save(); renderStudy(view === 'study' && !$('#ct-settings-dialog').open); renderTotals();
  }
  function settings() {
    $('#ct-version').value = prefs.version;
    $('#ct-place').value = prefs.place;
    $('#ct-senior').checked = prefs.senior;
    const rules = C.examRules(prefs);
    $('[data-test-label]').textContent = `${prefs.version} test · ${prefs.version === '2025' ? 'Filed Oct 20, 2025 or later' : 'Filed before Oct 20, 2025'}${prefs.senior ? ' · 65/20' : ''} ›`;
    $('[data-version-note]').textContent = `${prefs.version} test${prefs.senior ? ' · 65/20 set' : ''}: ${prefs.senior ? 20 : bank().length} questions to study · Up to ${rules.size} asked · ${rules.pass} correct to pass. Choose by filing date, not interview date.`;
    const previous = $('#ct-topic').value;
    $('#ct-topic').innerHTML = '<option value="">All topics</option>' + [...new Set(C.pool(bank(), prefs).map(q => q.topic))].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    $('#ct-topic').value = [...$('#ct-topic').options].some(o => o.value === previous) ? previous : '';
    $('[data-reference-date]').textContent = `Officeholder reference checked ${refs.verifiedOn}. This is a saved snapshot, not a live feed. Check the sources before your interview; names can change. You can enter an updated answer below.`;
    const place = places.find(p => p.code === prefs.place);
    $('[data-place-note]').textContent = place?.note || 'Your U.S. representative depends on your home address. A state or ZIP code alone may cover more than one congressional district.';
  }
  function totals() {
    const pool = C.pool(bank(), prefs);
    return { total: pool.length, seen: pool.filter(q => stat(q).right + stat(q).wrong > 0).length, review: pool.filter(q => stat(q).needsReview).length, learned: pool.filter(q => stat(q).streak >= 2).length };
  }
  function renderTotals() {
    const t = totals();
    $('[data-totals]').innerHTML = `<div><strong>${t.seen}<span>of ${t.total} tried</span></strong></div><div><strong>${t.review}<span>to practice</span></strong></div><div><strong>${t.learned}<span>learned</span></strong></div>`;
    $('[data-review-count]').textContent = t.review;
    $('[data-review-count]').hidden = !t.review;
  }
  function switchView(name, focus = true) {
    if (name === 'state') { openSettings(); return; }
    stopSpeech(); view = name;
    $$('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== name; });
    $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
    renderTotals();
    if (name === 'study') renderStudy(focus);
    if (name === 'review') renderReview();
    if (name === 'sheet') renderSheet();
    if (focus && name !== 'study') $(`[data-panel="${name}"] h2`).focus({ preventScroll: true });
    if (focus) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function isDone() {
    const s = prefs.session;
    return !s || s.i >= s.queue.length || (s.mode === 'exam' && C.examOutcome(s.answers, C.examRules(prefs)) !== null);
  }
  function renderStudy(focus = false) {
    const s = prefs.session;
    revealed = false; hinted = s?.hinted === true; gesture = null;
    $('[data-card]').classList.remove('ct-swipe-left', 'ct-swipe-right');
    const done = isDone();
    $('[data-card-area]').hidden = done;
    $('[data-result]').hidden = !done;
    $('[data-session-name]').textContent = s?.mode === 'exam' ? 'Practice interview · self-assessed' : ({ all: 'Study cards', missed: 'Missed questions', review: 'Missed + hinted cards', unseen: 'New questions', saved: 'Saved cards', repeat: 'Repeat missed cards' }[s?.mode] || 'Study cards');
    $('[data-count]').textContent = s?.queue.length ? `${Math.min(s.i + (done ? 0 : 1), s.queue.length)} / ${s.queue.length}` : 'No cards in this set';
    $('[data-session-progress]').max = s?.queue.length || 1;
    $('[data-session-progress]').value = s?.i || 0;
    if (done) { renderResult(focus); return; }
    const q = current();
    $('[data-card-topic]').textContent = q.topic;
    $('[data-question-number]').textContent = `${prefs.version} · Official question ${q.n}${q.required > 1 ? ' · Give ' + q.required + ' items' : ''}${q.seniorSet ? ' · 65/20' : ''}`;
    $('[data-question]').textContent = q.q;
    $('[data-answer]').hidden = true;
    $('[data-answer]').innerHTML = '';
    $('[data-reveal]').hidden = false;
    $('[data-grade]').hidden = true;
    $('[data-hint]').textContent = q.hint;
    $('[data-hint]').hidden = !hinted;
    $('[data-hint-button]').hidden = s.mode === 'exam';
    $('[data-hint-button]').setAttribute('aria-expanded', String(hinted));
    $('[data-hint-button]').textContent = hinted ? 'Hide hint' : 'Need a hint?';
    $('[data-undo]').disabled = s.answers.length === 0;
    $('[data-skip]').textContent = s.mode === 'exam' ? 'I don’t know' : 'Skip';
    $('[data-gesture-help]').textContent = 'Reveal, then swipe ← or →';
    renderBookmark();
    if (focus) $('[data-question]').focus({ preventScroll: true });
  }
  function renderBookmark() {
    const saved = prefs.bookmarks.includes(bookmarkKey(current()));
    $('[data-bookmark]').setAttribute('aria-pressed', String(saved));
    $('[data-bookmark]').setAttribute('aria-label', saved ? 'Remove this card from saved cards' : 'Save this card');
    $('[data-bookmark]').textContent = saved ? '★' : '☆';
  }
  function showHint() {
    if (isDone() || prefs.session.mode === 'exam') return;
    const box = $('[data-hint]');
    if (box.hidden) {
      hinted = true; prefs.session.hinted = true; save();
      box.hidden = false; announce(current().hint);
    } else box.hidden = true;
    $('[data-hint-button]').setAttribute('aria-expanded', String(!box.hidden));
    $('[data-hint-button]').textContent = box.hidden ? 'Need a hint?' : 'Hide hint';
  }
  function answerHtml(q, includeTip = true) {
    const answer = resolved(q);
    const label = q.required > 1 ? `Give ${q.required} items. Accepted answers / alternatives:` : answer.answers.length > 1 ? 'Any one of these answers is accepted' : 'Accepted answer';
    return `<h3>${answer.ready ? label : 'Your local answer is needed'}</h3>${list(answer.answers)}${answer.custom ? '<p class="ct-small">Your saved answer. Check it against an official source.</p>' : ''}${answer.dated ? `<p class="ct-small">Reference checked ${esc(refs.verifiedOn)}. Verify before your interview.</p>` : ''}${answer.source ? `<a class="ct-small" href="${esc(answer.source)}" target="_blank" rel="noopener">Check the source<span class="ct-sr-only"> (opens in a new tab)</span> ↗</a>` : ''}${!answer.ready ? '<button type="button" class="ct-text-btn" data-open-state>Add my local answer ↗</button>' : ''}${includeTip && prefs.session?.mode !== 'exam' ? `<details><summary>Memory tip · Coffee &amp; Fun</summary><p class="ct-small">${esc(q.hint)}</p></details>` : ''}`;
  }
  function reveal() {
    if (isDone() || revealed) return;
    revealed = true;
    $('[data-answer]').innerHTML = answerHtml(current());
    $('[data-answer]').hidden = false;
    $('[data-reveal]').hidden = true;
    $('[data-grade]').hidden = false;
    $('[data-right]').disabled = !resolved(current()).ready;
    $('[data-right]').innerHTML = `${hinted ? 'Got it with a hint' : 'Got it'} <span aria-hidden="true">✓</span>`;
    $('[data-gesture-help]').textContent = resolved(current()).ready ? '← Study again · Got it →' : 'Add your local answer, or skip this card for now.';
    $('[data-wrong]').focus({ preventScroll: true });
    announce(`Answer: ${resolved(current()).answers.join('; ')}. ${current().required > 1 ? `Give ${current().required} items.` : ''}`);
  }
  function mark(correct, skipped = false) {
    if (isDone() || (!skipped && !revealed)) return;
    const q = current();
    if (correct && !resolved(q).ready) { announce('Add your local answer before marking this card correct.'); return; }
    const k = C.key(q, prefs), s = prefs.session;
    const before = prefs.q[k] ? { ...prefs.q[k] } : null;
    const examSkip = skipped && s.mode === 'exam';
    if (!skipped || examSkip) prefs.q[k] = C.record(before, correct, hinted);
    s.answers.push({ n: q.n, correct, skipped: skipped && !examSkip, assisted: hinted, before });
    s.i++; s.hinted = false;
    stopSpeech(); save(); renderTotals(); renderStudy(true);
    announce(skipped && !examSkip ? 'Skipped. Your score for that card did not change.' : correct ? hinted ? 'Correct with a hint. This card stays in review.' : 'Marked correct.' : 'Saved for more practice.');
  }
  function undo() {
    const s = prefs.session;
    if (!s?.answers.length) return;
    const previous = s.answers.pop(); s.i--; s.hinted = previous.assisted;
    const q = bank().find(q => q.n === previous.n), k = C.key(q, prefs);
    if (previous.before) prefs.q[k] = previous.before; else delete prefs.q[k];
    stopSpeech(); save(); renderTotals(); renderStudy(true); announce('Last answer undone. Try this card again.');
  }
  function renderResult(focus) {
    const s = prefs.session, answers = s?.answers || [];
    const right = answers.filter(a => a.correct).length;
    const wrong = answers.filter(a => !a.correct && !a.skipped).length;
    const skipped = answers.filter(a => a.skipped).length;
    const empty = !s?.queue.length;
    $('[data-result-title]').textContent = empty ? 'You’re all caught up.' : s.mode === 'exam' ? (C.examOutcome(answers, C.examRules(prefs)) === 'passed' ? 'Practice target reached.' : 'Keep practicing.') : 'Nice work. Set complete.';
    $('[data-result-copy]').textContent = empty ? ({ missed: 'No cards need review in this selection. Try new questions or choose another topic.', saved: 'Save a card with the star and it will appear here.', unseen: 'You’ve tried every question in this selection. Keep practicing the ones you want to strengthen.' }[s?.mode] || 'There are no cards for these filters. Try all topics.') : s.mode === 'exam' ? `You marked ${right} answers correct. This self-assessed practice stops at ${C.examRules(prefs).pass} correct or when the pass target is out of reach. It is not an official result.` : 'Every answer is saved. Come back later and test what you remember without the hints.';
    $('[data-result-stats]').textContent = empty ? '' : `${right} correct · ${wrong} to revisit${skipped ? ' · ' + skipped + ' skipped' : ''}`;
    $('[data-repeat]').hidden = !wrong;
    $('[data-result-undo]').hidden = !answers.length;
    $('[data-next]').textContent = empty ? 'Study all questions' : 'Keep studying';
    if (focus) $('[data-result-title]').focus({ preventScroll: true });
  }
  function renderReview() {
    const t = totals();
    $('[data-review-summary]').textContent = `${prefs.version} test${prefs.senior ? ' · 65/20' : ''}${prefs.place ? ' · ' + prefs.place : ''}. Saved as you study, on this device.`;
    const pool = C.pool(bank(), prefs);
    const sections = [...new Set(pool.map(q => q.section))];
    $('[data-review-topics]').innerHTML = sections.map(section => {
      const qs = pool.filter(q => q.section === section), learned = qs.filter(q => stat(q).streak >= 2).length;
      return `<article><h3>${esc(section)}</h3><p>${learned} of ${qs.length} learned</p><progress max="${qs.length}" value="${learned}" aria-label="${esc(section)} questions learned"></progress></article>`;
    }).join('');
    const repeated = historyFilter === 'repeated';
    const history = C.history(bank(), prefs, repeated);
    const mistakes = repeated ? history.map(entry => entry.question) : pool.filter(q => stat(q).needsReview && stat(q).wrong > 0);
    $('[data-review-start]').disabled = !mistakes.length;
    $('[data-review-start]').textContent = mistakes.length ? repeated ? `Practice these ${mistakes.length} cards` : `Review ${mistakes.length} missed ${mistakes.length === 1 ? 'card' : 'cards'}` : repeated ? 'No repeated misses yet' : 'No missed cards to review';
    $$('[data-history-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.historyFilter === historyFilter)));
    $('[data-history-summary]').textContent = repeated ? `${history.length} questions missed at least twice, most missed first. Learned cards stay in this history.` : `${history.length} answered questions, most recent first. Counts include all your saved attempts for these study settings.`;
    $('[data-review-list]').innerHTML = history.length ? history.map(({ question: q, stat: record }) => {
      const status = record.needsReview ? 'Needs practice' : record.streak >= 2 ? 'Learned' : 'Getting there';
      const latest = { correct: 'Correct', hinted: 'Correct with a hint', wrong: 'Missed' }[record.lastResult] || 'Not recorded in older progress';
      const date = new Date(record.last);
      const when = record.last > 0 && Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Date not available';
      return `<details class="ct-review-item ct-history-item"><summary><strong>${q.n}. ${esc(q.q)}</strong><span class="ct-history-counts">${record.right} correct · ${record.wrong} missed<span class="ct-history-status${record.needsReview ? ' ct-history-needs-practice' : ''}">${status}</span></span></summary><p class="ct-small">${record.right + record.wrong} attempts · ${record.assisted} correct with a hint<br />Last answer: ${latest}<br />Last practiced: ${esc(when)}</p><h4>Current accepted answer${q.required > 1 ? ' · Give ' + q.required + ' items' : ''}</h4>${list(resolved(q).answers)}<p class="ct-small">Memory tip: ${esc(q.hint)}</p><button type="button" class="ct-text-btn" data-practice-one="${q.n}">Practice this card</button></details>`;
    }).join('') : `<p class="ct-empty">${repeated ? 'No questions missed twice yet. If one keeps catching you out, it will appear here.' : 'Your answered questions will appear here as you study. Skipped cards do not count as answered.'}</p>`;
  }
  const roleLabels = { senators: 'One of your U.S. senators', representative: 'Your U.S. representative', governor: 'Your governor', capital: 'Your state capital', president: 'President', vicePresident: 'Vice president', party: 'President’s political party', speaker: 'Speaker of the House', chiefJustice: 'Chief Justice', justices: 'Supreme Court justices' };
  const localRoles = ['senators', 'representative', 'governor', 'capital'];
  function officialSource(role) {
    if (role === 'representative') return 'https://www.house.gov/representatives/find-your-representative';
    if (role === 'senators') return 'https://www.senate.gov/senators/senators-contact.htm';
    if (role === 'governor') return refs.places[prefs.place]?.governor?.source || refs.governorSource;
    return refs.national[role]?.source || 'https://www.usa.gov/states-and-territories';
  }
  function renderRepresentative() {
    const place = places.find(p => p.code === prefs.place);
    if (!place) { $('[data-representative-setup]').innerHTML = ''; return; }
    const seats = refs.representatives.places[place.code] || [];
    const q = bank().find(q => q.variable === 'representative');
    const r = resolved(q), district = C.districtFor(prefs);
    const own = prefs.mine[C.answerKey('representative', prefs.place, district)] || '';
    const picker = seats.length > 1 ? `<div class="ct-field"><label for="ct-district">Your congressional district</label><select id="ct-district" data-district aria-describedby="ct-district-help"><option value="">Choose your district</option>${seats.map(seat => `<option value="${seat.district}"${district === seat.district ? ' selected' : ''}>District ${Number(seat.district)} · ${esc(seat.vacant ? 'Vacant seat' : seat.name)}</option>`).join('')}</select><p id="ct-district-help" class="ct-small">Not sure? <a href="https://www.house.gov/representatives/find-your-representative" target="_blank" rel="noopener">Find your district by address<span class="ct-sr-only"> (opens in a new tab)</span> ↗</a></p></div>` : '<p class="ct-small">One House member serves your whole state or territory. Filled in for you.</p>';
    $('[data-representative-setup]').innerHTML = `${picker}<div class="ct-field"><label for="ct-representative-answer">${place.hasSenators ? 'Your U.S. representative' : seats[0]?.label === 'Resident Commissioner' ? 'Your resident commissioner' : 'Your House delegate'}</label><input id="ct-representative-answer" data-representative-value type="text" readonly value="${esc(r.ready ? r.answers.join(' / ') : district ? 'Vacant seat — check the official directory' : '')}" placeholder="Choose a district above to fill this in" aria-describedby="ct-representative-note" /><p id="ct-representative-note" class="ct-small">${r.custom ? 'Your saved answer.' : 'Official House roster checked ' + esc(refs.representatives.verifiedOn) + '.'} <a href="https://www.house.gov/representatives" target="_blank" rel="noopener">View source<span class="ct-sr-only"> (opens in a new tab)</span> ↗</a></p></div><details class="ct-representative-edit"><summary>Need to correct this answer?</summary><div class="ct-field"><label for="ct-own-representative">Your updated answer</label><input id="ct-own-representative" type="text" data-own="representative" maxlength="250" autocomplete="off" value="${esc(own)}" /></div><p class="ct-small">Only needed if the roster has changed. Clear your entry to use the prefilled answer.</p></details>`;
  }
  function renderOfficials() {
    const representative = bank().find(q => q.variable === 'representative');
    const place = places.find(p => p.code === prefs.place);
    renderRepresentative();
    const questions = bank().filter(q => q.variable && q !== representative).sort((a, b) => (localRoles.includes(a.variable) ? 0 : 1) - (localRoles.includes(b.variable) ? 0 : 1));
    $('[data-officials]').innerHTML = questions.map(q => {
      const role = q.variable, r = resolved(q), localMissing = localRoles.includes(role) && !prefs.place;
      const own = prefs.mine[C.answerKey(role, prefs.place)] || '';
      return `<article class="ct-official"><h3>${esc(roleLabels[role])}</h3><p class="ct-official-answer">${esc(r.ready ? r.answers.join(' / ') : localMissing ? 'Choose your state above' : 'Find your congressional district')}</p><p class="ct-small">${r.custom ? 'Your saved answer' : r.dated ? 'Reference checked ' + esc(refs.verifiedOn) : r.ready ? 'Location-specific answer' : 'Use the official lookup, then save the name below.'}</p><a href="${esc(officialSource(role))}" target="_blank" rel="noopener">${role === 'representative' ? 'Find my representative' : 'Check source'}<span class="ct-sr-only"> (opens in a new tab)</span> ↗</a>${role !== 'capital' ? `<details><summary>Update this answer</summary><div class="ct-field"><label for="ct-own-${role}">Your answer</label><input type="text" id="ct-own-${role}" data-own="${role}" value="${esc(own)}" maxlength="250" ${localMissing ? 'disabled' : ''} autocomplete="off" /></div></details>` : ''}</article>`;
    }).join('');
  }
  function sheetQuestions() {
    const search = $('#ct-search').value.trim().toLocaleLowerCase();
    return C.pool(bank(), prefs, $('#ct-sheet-missed').checked ? 'missed' : 'all').filter(q => !search || `${q.n} ${q.q} ${resolved(q).answers.join(' ')} ${q.topic}`.toLocaleLowerCase().includes(search));
  }
  function sheetHtml(questions) {
    if (!questions.length) return '<p class="ct-empty">No questions match. Try another search or turn off the practice-only filter.</p>';
    return [...new Set(questions.map(q => q.topic))].map(topic => `<div class="ct-sheet-group"><h3>${esc(topic)}</h3>${questions.filter(q => q.topic === topic).map(q => `<article class="ct-sheet-item"><h4>${q.n}. ${esc(q.q)}</h4><p>${q.required > 1 ? '<strong>Give ' + q.required + ' items.</strong> ' : ''}${esc(resolved(q).answers.join(' • '))}</p>${q.variable ? `<p class="ct-small">${resolved(q).custom ? 'Your saved answer; verify before your interview.' : resolved(q).dated ? 'Reference checked ' + esc(refs.verifiedOn) + '; verify before your interview.' : 'Answer depends on where you live.'}</p>` : ''}<p class="ct-small">Memory tip: ${esc(q.hint)}</p></article>`).join('')}</div>`).join('');
  }
  function renderSheet() {
    const questions = sheetQuestions();
    $('[data-sheet-count]').textContent = `${questions.length} questions · ${prefs.version} test${prefs.senior ? ' · 65/20 set' : ''}.`;
    $('[data-sheet-date]').textContent = `Reference checked ${refs.verifiedOn}. Verify names before your interview.`;
    $('[data-sheet-officials]').innerHTML = bank().filter(q => q.variable).map(q => `<p><strong>${esc(roleLabels[q.variable])}</strong><span>${esc(resolved(q).ready ? resolved(q).answers.join(' / ') : 'Add in Set up')}${resolved(q).custom ? ' (your answer)' : ''}</span></p>`).join('');
    $('[data-sheet-content]').innerHTML = sheetHtml(questions);
    preparePrint();
  }
  function preparePrint() {
    if (!prefs) return;
    const place = places.find(p => p.code === prefs.place);
    const rules = C.examRules(prefs), questions = sheetQuestions(), includeQuestions = $('#ct-print-questions').checked;
    $('[data-print-content]').innerHTML = `<h1>US citizenship · study cheat sheet</h1><p>${prefs.version} test${prefs.senior ? ' · 65/20 set' : ''} · ${esc(place?.name || 'No state selected')}${includeQuestions ? ' · ' + questions.length + ' questions included' : ''}</p><p>Interview: up to ${rules.size} questions; ${rules.pass} correct to pass. Answer out loud and give the number of items requested. Officeholder reference checked ${esc(refs.verifiedOn)}; verify before your interview.</p><div class="ct-facts">${$('.ct-facts').innerHTML}</div><h2>Your local &amp; current answers</h2>${bank().filter(q => q.variable).map(q => `<p><strong>${esc(roleLabels[q.variable])}:</strong> ${esc(resolved(q).answers.join(' / '))}${resolved(q).custom ? ' (your saved answer)' : ''}</p>`).join('')}${includeQuestions ? '<h2>Questions &amp; memory tips</h2>' + sheetHtml(questions) : ''}<h2>Sources</h2><p>Official questions: ${esc(banks[prefs.version]._sourceUrl)}</p><p>Officeholders: senate.gov · nga.org/governors · whitehouse.gov · speaker.gov · supremecourt.gov. Representative lookup: house.gov/representatives/find-your-representative.</p><p>Memory tips by Coffee &amp; Fun are study aids, not USCIS wording. Independent tool; not endorsed by USCIS. coffeeandfun.com/citizenship-test/</p>`;
    root.classList.add('ct-print-ready');
  }
  function openSettings() {
    if (!prefs) return;
    $('[data-panel="state"]').hidden = false;
    renderOfficials();
    if (!$('#ct-settings-dialog').open) $('#ct-settings-dialog').showModal();
    $('#ct-version').focus({ preventScroll: true });
  }
  async function init() {
    if (loading) return; loading = true;
    $('[data-load-error]').hidden = true; $('[data-loading]').hidden = false;
    try {
      const responses = await Promise.all(['2008', '2025', 'officials', 'representatives'].map(async name => {
        const response = await fetch(`/assets/data/civics-${name}.json?v=20260910-house`);
        if (!response.ok) throw new Error('Study data unavailable');
        return response.json();
      }));
      if (responses[0].questions?.length !== 100 || responses[1].questions?.length !== 128 || !responses[2].places || !responses[3].places) throw new Error('Incomplete study data');
      banks = { '2008': responses[0], '2025': responses[1] }; places = responses[0].places; refs = responses[2];
      refs.representatives = responses[3];
      try {
        const saved = localStorage.getItem(STORE);
        prefs = saved ? C.normalize(JSON.parse(saved)) : C.migrate(JSON.parse(localStorage.getItem(LEGACY) || 'null'), banks['2008'].questions);
      } catch (_) { prefs = C.blank(); }
      if (!places.some(p => p.code === prefs.place)) prefs.place = '';
      Object.entries(prefs.districts).forEach(([place, district]) => {
        if (!refs.representatives.places[place]?.some(s => s.district === district)) {
          delete prefs.districts[place]; prefs.session = null;
        }
      });
      $('#ct-place').innerHTML = '<option value="">Choose when you’re ready</option>' + places.map(p => `<option value="${p.code}">${esc(p.name)}</option>`).join('');
      settings();
      if (!restoreSession()) prefs.session = { mode: 'all', topic: '', queue: C.queue(bank(), prefs), i: 0, answers: [], hinted: false };
      $('#ct-mode').value = ['exam', 'repeat'].includes(prefs.session.mode) ? 'all' : prefs.session.mode;
      $('#ct-topic').value = prefs.session.topic;
      save(); renderTotals(); renderStudy(); renderOfficials(); renderSheet();
      $('[data-workspace]').hidden = false;
      $('[data-listen]').hidden = !('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    } catch (_) { $('[data-load-error]').hidden = false; }
    finally { loading = false; $('[data-loading]').hidden = true; }
  }
  $$('[data-view]').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));
  $$('[data-open-settings]').forEach(b => b.addEventListener('click', openSettings));
  $('[data-close-settings]').addEventListener('click', () => $('#ct-settings-dialog').close());
  $$('[data-setting]').forEach(input => input.addEventListener('change', () => {
    if (!prefs) return;
    prefs[input.dataset.setting] = input.type === 'checkbox' ? input.checked : input.value;
    settings(); begin(); renderOfficials(); renderSheet();
    if (view === 'review') renderReview();
    announce('Study settings updated. A fresh set is ready; your previous answers are saved.');
  }));
  $('[data-new]').addEventListener('click', () => { begin(); switchView('study'); });
  $('[data-exam]').addEventListener('click', () => { begin('exam'); switchView('study'); announce('Practice interview started. Hints are off. Say your answer before revealing, then assess it honestly.'); });
  $('[data-reveal]').addEventListener('click', reveal);
  $('[data-hint-button]').addEventListener('click', showHint);
  $('[data-wrong]').addEventListener('click', () => mark(false));
  $('[data-right]').addEventListener('click', () => mark(true));
  $('[data-skip]').addEventListener('click', () => mark(false, true));
  $('[data-undo]').addEventListener('click', undo);
  $('[data-result-undo]').addEventListener('click', undo);
  $('[data-next]').addEventListener('click', () => {
    const mode = prefs.session.mode;
    if (!prefs.session.queue.length) { $('#ct-mode').value = 'all'; $('#ct-topic').value = ''; begin('all'); }
    else begin(mode === 'repeat' ? 'missed' : mode);
  });
  $('[data-repeat]').addEventListener('click', () => begin('repeat', prefs.session.answers.filter(a => !a.correct && !a.skipped).map(a => a.n)));
  $$('[data-history-filter]').forEach(button => button.addEventListener('click', () => { historyFilter = button.dataset.historyFilter; renderReview(); }));
  $('[data-review-start]').addEventListener('click', () => {
    $('#ct-mode').value = 'missed'; $('#ct-topic').value = '';
    if (historyFilter === 'repeated') begin('repeat', C.history(bank(), prefs, true).slice(0, 10).map(entry => entry.question.n));
    else begin('missed');
    switchView('study');
  });
  $('[data-bookmark]').addEventListener('click', () => {
    const id = bookmarkKey(current());
    prefs.bookmarks = prefs.bookmarks.includes(id) ? prefs.bookmarks.filter(k => k !== id) : [...prefs.bookmarks, id];
    save(); renderBookmark(); announce(prefs.bookmarks.includes(id) ? 'Card saved.' : 'Card removed from saved cards.');
  });
  root.addEventListener('click', event => {
    if (event.target.closest('[data-open-state]')) switchView('state');
    const practice = event.target.closest('[data-practice-one]');
    if (practice) { begin('repeat', [Number(practice.dataset.practiceOne)]); switchView('study'); }
  });
  root.addEventListener('change', event => {
    if (event.target.matches('[data-district]')) {
      const value = event.target.value;
      if (value && !refs.representatives.places[prefs.place]?.some(s => s.district === value)) return;
      if (value) prefs.districts[prefs.place] = value; else delete prefs.districts[prefs.place];
      prefs.session = null; begin(); renderRepresentative(); renderSheet();
      if (view === 'review') renderReview();
      $('#ct-district').focus({ preventScroll: true });
      const representative = resolved(bank().find(q => q.variable === 'representative'));
      announce(value ? representative.ready ? 'District saved. Your representative is filled in on your cards and cheat sheet.' : 'District saved. This seat is vacant in the reference roster; check the official directory.' : 'Choose a district to fill in your representative.');
      return;
    }
    const role = event.target.dataset.own;
    if (!role) return;
    const ownKey = C.answerKey(role, prefs.place, C.districtFor(prefs));
    prefs.mine[ownKey] = event.target.value.trim();
    // Relearn changed answers without deleting the learner's question history.
    Object.entries(banks).forEach(([version, data]) => data.questions.filter(q => q.variable === role).forEach(q => {
      const key = C.key(q, { ...prefs, version }), previous = prefs.q[key];
      if (previous) prefs.q[key] = { ...previous, streak: 0, needsReview: previous.right + previous.wrong > 0 };
    }));
    prefs.session = null; save(); begin(); renderTotals(); renderSheet();
    // Refresh only the displayed answer, preserving the user's focus in the input.
    const article = event.target.closest('.ct-official');
    const q = bank().find(q => q.variable === role);
    if (article) {
      article.querySelector('.ct-official-answer').textContent = resolved(q).answers.join(' / ');
      article.querySelector('.ct-small').textContent = resolved(q).custom ? 'Your saved answer' : resolved(q).dated ? 'Reference checked ' + refs.verifiedOn : 'Use the official lookup, then save the name below.';
    }
    if (role === 'representative') {
      $('[data-representative-value]').value = resolved(q).ready ? resolved(q).answers.join(' / ') : '';
      $('#ct-representative-note').textContent = resolved(q).custom ? 'Your saved answer.' : 'Official House roster checked ' + refs.representatives.verifiedOn + '.';
    }
    if (view === 'review') renderReview();
    announce('Answer saved. This card needs practice again; your answer history is kept.');
  });
  $('#ct-search').addEventListener('input', renderSheet);
  $('#ct-sheet-missed').addEventListener('change', renderSheet);
  $('#ct-print-questions').addEventListener('change', preparePrint);
  $('[data-print]').addEventListener('click', () => { preparePrint(); window.print(); });
  window.addEventListener('beforeprint', preparePrint);
  $('[data-listen]').addEventListener('click', () => {
    if (isDone()) return;
    stopSpeech();
    const speech = new SpeechSynthesisUtterance(current().q);
    speech.lang = 'en-US'; speech.rate = .88;
    speech.onerror = () => announce('Audio is unavailable. You can still read the question on the card.');
    window.speechSynthesis.speak(speech);
  });
  $('[data-card-area]').addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    // Space retains native activation on buttons and links.
    const space = event.code === 'Space' && !event.target.closest('button, a, summary');
    if (space) { event.preventDefault(); reveal(); }
    else if (event.key === 'ArrowLeft' && revealed) { event.preventDefault(); mark(false); }
    else if (event.key === 'ArrowRight' && revealed) { event.preventDefault(); mark(true); }
    else if (event.key.toLowerCase() === 'h') { event.preventDefault(); showHint(); }
    else if (event.key.toLowerCase() === 'u') { event.preventDefault(); undo(); }
  });
  const card = $('[data-card]');
  card.addEventListener('pointerdown', event => {
    if (!revealed || !event.isPrimary || event.button !== 0 || event.target.closest('button, a, summary, input')) return;
    gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  card.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    card.classList.toggle('ct-swipe-left', dx < -45 && Math.abs(dx) > Math.abs(dy) * 1.5);
    card.classList.toggle('ct-swipe-right', dx > 45 && Math.abs(dx) > Math.abs(dy) * 1.5 && resolved(current()).ready);
  });
  window.addEventListener('pointerup', event => {
    const start = gesture; gesture = null;
    card.classList.remove('ct-swipe-left', 'ct-swipe-right');
    if (!start || event.pointerId !== start.id || window.getSelection()?.toString()) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) >= 85 && Math.abs(dx) > Math.abs(dy) * 1.5) mark(dx > 0);
  });
  window.addEventListener('pointercancel', () => { gesture = null; card.classList.remove('ct-swipe-left', 'ct-swipe-right'); });
  window.addEventListener('pagehide', stopSpeech);
  $('[data-reset]').addEventListener('click', () => { $('[data-reset-confirm]').hidden = false; $('[data-reset-yes]').focus(); });
  $('[data-reset-no]').addEventListener('click', () => { $('[data-reset-confirm]').hidden = true; $('[data-reset]').focus(); });
  $('[data-reset-yes]').addEventListener('click', () => {
    try { localStorage.removeItem(LEGACY); } catch (_) { /* New store still takes precedence. */ }
    prefs = C.blank(); settings(); $('#ct-mode').value = 'all'; $('#ct-topic').value = ''; begin();
    $('[data-reset-confirm]').hidden = true; renderOfficials(); renderSheet(); $('#ct-settings-dialog').close(); switchView('study'); announce('Study data reset. A fresh start is ready.');
  });
  $('[data-retry]').addEventListener('click', init);
  init();
})();
