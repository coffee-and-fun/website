// Run with: node --test tools/citizenship-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../src/assets/js/pages/citizenship-study.js');
const read = name => JSON.parse(fs.readFileSync(new URL(`../src/assets/data/civics-${name}.json`, import.meta.url)));
const old = read('2008'), modern = read('2025'), refs = read('officials');
refs.representatives = read('representatives');
const question = (data, n) => data.questions.find(q => q.n === n);

test('both official banks are complete, clean, and have exactly 20 senior questions', () => {
  for (const [data, size] of [[old, 100], [modern, 128]]) {
    assert.deepEqual(data.questions.map(q => q.n), Array.from({ length: size }, (_, i) => i + 1));
    assert.equal(data.questions.filter(q => q.seniorSet).length, 20);
    for (const q of data.questions) {
      assert.ok(q.q && q.hint && q.section && q.topic);
      assert.ok(q.answers.length && q.answers.every(a => a.trim()));
      assert.ok(!/[\x00-\x1f]|marked with an asterisk|\d+ of 19/.test(q.q + q.answers.join(' ')), `PDF debris in Q${q.n}`);
      assert.ok(q.required >= 1 && q.required <= 5);
    }
  }
  assert.equal(question(old, 9).required, 2);
  assert.equal(question(old, 3).required, 1); // The three words form one phrase.
  assert.equal(question(old, 64).required, 3);
  assert.equal(question(modern, 81).required, 5);
  assert.equal(question(modern, 126).required, 3);
});

test('a mistake stays in review until two consecutive unaided correct answers', () => {
  let s = C.record(null, false, false, 1);
  assert.equal(s.wrong, 1);
  s = C.record(s, true, false, 2);
  assert.equal(s.needsReview, true);
  s = C.record(s, true, true, 3);
  assert.equal(s.streak, 0);
  assert.equal(s.needsReview, true);
  s = C.record(s, true, false, 4);
  s = C.record(s, true, false, 5);
  assert.equal(s.needsReview, false);
  assert.equal(s.wrong, 1); // Mistake history is never erased by mastery.
  assert.equal(s.assisted, 1);
  s = C.record(s, false, false, 6);
  assert.equal(s.needsReview, true);
  assert.equal(s.streak, 0);
});

test('filters respect test bank, topic, senior eligibility, and bookmarks', () => {
  const p = C.blank(); p.senior = true;
  const q = question(modern, 2); p.q[C.key(q, p)] = C.record(null, false);
  p.bookmarks = ['2025:2', '2008:3'];
  assert.equal(C.pool(modern.questions, p).length, 20);
  assert.deepEqual(C.pool(modern.questions, p, 'missed').map(q => q.n), [2]);
  assert.deepEqual(C.pool(modern.questions, p, 'saved').map(q => q.n), [2]);
  assert.equal(C.pool(modern.questions, p, 'unseen').length, 19);
  assert.equal(C.pool(modern.questions, p, 'missed', 'Holidays').length, 0);
  const hinted = question(modern, 7); p.q[C.key(hinted, p)] = C.record(null, true, true);
  assert.deepEqual(C.pool(modern.questions, p, 'missed').map(q => q.n), [2]);
  assert.deepEqual(C.pool(modern.questions, p, 'review').map(q => q.n), [2, 7]);
});

test('mixed study reaches all unseen cards even when every answer is wrong', () => {
  const p = C.blank();
  for (let i = 0; i < 25; i++) {
    const ids = C.queue(modern.questions, p, 'all', '', 10);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      const q = question(modern, id), k = C.key(q, p);
      p.q[k] = C.record(p.q[k], false, false, i + 1);
    }
  }
  assert.equal(C.pool(modern.questions, p, 'unseen').length, 0);
});

test('exam stops correctly for 2008, 2025, and 65/20, including failure threshold', () => {
  for (const [version, senior, size, pass] of [['2008', false, 10, 6], ['2025', false, 20, 12], ['2025', true, 10, 6]]) {
    const rules = C.examRules({ version, senior }); assert.deepEqual(rules, { size, pass });
    const rights = Array.from({ length: pass - 1 }, () => ({ correct: true }));
    assert.equal(C.examOutcome(rights, rules), null);
    assert.equal(C.examOutcome([...rights, { correct: true }], rules), 'passed');
    const wrongs = Array.from({ length: size - pass }, () => ({ correct: false }));
    assert.equal(C.examOutcome(wrongs, rules), null);
    assert.equal(C.examOutcome([...wrongs, { correct: false }], rules), 'practice');
  }
});

test('all 50 states have capitals, two senators, governors, and sources', () => {
  assert.equal(old.places.length, 56);
  for (const place of old.places.filter(p => p.hasSenators)) {
    assert.ok(place.capital);
    assert.equal(refs.places[place.code].senators.length, 2);
    assert.ok(refs.places[place.code].senators.every(s => s.name && s.source.startsWith('https://')));
    assert.ok(refs.places[place.code].governor.name);
    assert.ok(refs.places[place.code].governor.source.startsWith('https://www.nga.org/'));
  }
});

test('state answers are scoped by location; territories and D.C. have valid exceptions', () => {
  const p = C.blank(); p.place = 'IL';
  const representative = question(modern, 29), senator = question(modern, 23);
  p.mine[C.answerKey('representative', 'IL')] = 'My district representative';
  assert.equal(C.resolve(representative, p, old.places, refs).answers[0], 'My district representative');
  const ilKey = C.key(senator, p);
  p.place = 'CA';
  assert.equal(C.resolve(representative, p, old.places, refs).ready, false);
  assert.notEqual(C.key(senator, p), ilKey);
  assert.equal(C.resolve(question(modern, 62), p, old.places, refs).answers[0], 'Sacramento');
  for (const place of old.places.filter(p => !p.hasSenators)) {
    p.place = place.code;
    assert.match(C.resolve(senator, p, old.places, refs).answers[0], /no U.S. senators/);
    assert.equal(C.resolve(representative, p, old.places, refs).ready, true);
    assert.equal(C.resolve(question(modern, 61), p, old.places, refs).ready, true);
  }
  p.place = 'DC';
  assert.match(C.resolve(question(modern, 62), p, old.places, refs).answers[0], /does not have a capital/);
});

test('old progress migrates to 2008 only, with national and local answer ownership preserved', () => {
  const legacy = { v: 1, place: 'IL', q: { 20: { right: 1, wrong: 2, last: 100 } }, mine: { 20: 'Saved senator', 28: 'Saved president', 40: 'Saved Chief Justice' } };
  const p = C.migrate(legacy, old.questions);
  assert.equal(p.version, '2008');
  assert.equal(p.q['2008:20:IL'].wrong, 2);
  assert.equal(p.q['2008:20:IL'].needsReview, true);
  assert.equal(p.mine['senators:IL'], 'Saved senator');
  assert.equal(p.mine.president, 'Saved president');
  assert.equal(p.mine.chiefJustice, 'Saved Chief Justice');
  assert.equal(p.q['2025:23:IL'], undefined);
});

test('corrupt storage is normalized; undo snapshots do not mutate the prior record', () => {
  const p = C.normalize({ v: 2, version: 'future', q: { '2025:1': { right: -1, wrong: 'oops', last: null } }, bookmarks: 'bad' });
  assert.equal(p.version, '2025'); assert.equal(p.q['2025:1'].right, 0); assert.deepEqual(p.bookmarks, []);
  const before = { ...C.emptyStat(), right: 2, streak: 2 };
  const after = C.record(before, false);
  assert.equal(before.wrong, 0); assert.equal(after.wrong, 1);
  assert.equal(JSON.parse(JSON.stringify(before)).streak, 2);
});

test('every dynamic question has a resolver, including the previously missing Chief Justice', () => {
  const p = C.blank();
  for (const data of [old, modern]) for (const q of data.questions.filter(q => q.variable)) {
    const r = C.resolve(q, p, old.places, refs);
    assert.ok(r.answers.length);
    if (!['senators', 'governor', 'capital', 'representative'].includes(q.variable)) assert.equal(r.ready, true);
  }
  assert.equal(question(old, 40).variable, 'chiefJustice');
});

test('House roster covers every district and distinguishes vacancies from officeholders', () => {
  const roster = refs.representatives;
  assert.equal(Object.keys(roster.places).length, 56);
  assert.equal(old.places.filter(p => p.hasSenators).reduce((n, p) => n + roster.places[p.code].length, 0), 435);
  for (const place of old.places) {
    const seats = roster.places[place.code];
    assert.ok(seats.length);
    assert.equal(new Set(seats.map(s => s.district)).size, seats.length);
    for (const seat of seats) {
      assert.match(seat.district, /^\d{2}$/);
      assert.equal(seat.vacant, seat.name === '');
      assert.equal(seat.source, 'https://www.house.gov/representatives');
    }
  }
});

test('district selection prefills the right representative and never guesses from a multi-district state', () => {
  const p = C.blank(); p.place = 'AR';
  const q = question(modern, 29);
  assert.equal(C.resolve(q, p, old.places, refs).ready, false);
  p.districts.AR = '01';
  const first = C.resolve(q, p, old.places, refs);
  assert.equal(first.answers[0], 'Eric A. "Rick" Crawford');
  assert.equal(first.custom, false); assert.equal(first.dated, true);
  assert.equal(first.verifiedOn, refs.representatives.verifiedOn);
  const firstKey = C.key(q, p);
  p.mine[C.answerKey('representative', 'AR', '01')] = 'An updated answer';
  assert.equal(C.resolve(q, p, old.places, refs).answers[0], 'An updated answer');
  p.districts.AR = '02';
  assert.equal(C.resolve(q, p, old.places, refs).answers[0], 'J. French Hill');
  assert.notEqual(C.key(q, p), firstKey);
  p.place = 'CA';
  assert.equal(C.resolve(q, p, old.places, refs).ready, false);
  p.place = 'AR';
  assert.equal(C.resolve(q, p, old.places, refs).answers[0], 'J. French Hill');
  const saved = C.normalize(JSON.parse(JSON.stringify(p)));
  assert.equal(saved.districts.AR, '02');
  assert.equal(saved.mine['representative:AR:01'], 'An updated answer');
});

test('single-seat states and territories prefill automatically; vacant seats stay ungradable', () => {
  const p = C.blank(), q = question(modern, 29);
  for (const place of old.places.filter(p => refs.representatives.places[p.code].length === 1)) {
    p.place = place.code;
    const seat = refs.representatives.places[p.place][0];
    const answer = C.resolve(q, p, old.places, refs);
    assert.equal(answer.ready, !seat.vacant);
    if (!seat.vacant) assert.equal(answer.answers[0], seat.name);
  }
  for (const [place, seats] of Object.entries(refs.representatives.places)) for (const seat of seats.filter(s => s.vacant)) {
    p.place = place; p.districts[place] = seat.district;
    const answer = C.resolve(q, p, old.places, refs);
    assert.equal(answer.ready, false);
    assert.match(answer.answers[0], /vacant/);
  }
});

test('answered history includes correct and missed cards, sorted by last practice', () => {
  const p = C.blank();
  const first = question(modern, 1), second = question(modern, 2);
  p.q[C.key(first, p)] = C.record(null, true, false, 100);
  p.q[C.key(second, p)] = C.record(null, false, false, 200);
  assert.deepEqual(C.history(modern.questions, p).map(x => x.question.n), [2, 1]);
  assert.equal(C.history(modern.questions, p)[0].stat.lastResult, 'wrong');
  p.q[C.key(first, p)] = C.record(p.q[C.key(first, p)], true, true, 300);
  const restored = C.normalize(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(C.history(modern.questions, restored).map(x => x.question.n), [1, 2]);
  assert.equal(restored.q['2025:1'].lastResult, 'hinted');
  assert.equal(restored.q['2025:1'].right, 2);
  assert.equal(C.history(old.questions, { ...p, version: '2008' }).length, 0);
});

test('repeated misses stay in history after learning, with most missed first', () => {
  const p = C.blank();
  for (const [n, misses] of [[1, 2], [2, 3], [3, 1]]) {
    const k = C.key(question(modern, n), p);
    for (let i = 0; i < misses; i++) p.q[k] = C.record(p.q[k], false, false, 100 + i);
  }
  p.q['2025:1'] = C.record(p.q['2025:1'], true, false, 300);
  p.q['2025:1'] = C.record(p.q['2025:1'], true, false, 400);
  const history = C.history(modern.questions, p, true);
  assert.deepEqual(history.map(x => x.question.n), [2, 1]);
  assert.equal(history[1].stat.needsReview, false);
  assert.equal(history[1].stat.wrong, 2);
  assert.equal(history[1].stat.lastResult, 'correct');
  assert.deepEqual(C.pool(modern.questions, p, 'missed').map(q => q.n), [2, 3]);
});

test('older saved history preserves totals without inventing a latest result; undo restores history', () => {
  const p = C.normalize({ v: 2, q: { '2025:1': { right: 2, wrong: 3, last: 100 } } });
  const before = p.q['2025:1'];
  assert.equal(before.lastResult, null);
  assert.equal(C.history(modern.questions, p)[0].stat.wrong, 3);
  p.q['2025:1'] = C.record(before, true, false, 200);
  assert.equal(C.history(modern.questions, p)[0].stat.lastResult, 'correct');
  p.q['2025:1'] = before;
  assert.equal(C.history(modern.questions, p)[0].stat.last, 100);
  assert.equal(C.history(modern.questions, p)[0].stat.right, 2);
  assert.equal(C.normalize({ v: 2, q: { '2025:1': { lastResult: 'bogus' } } }).q['2025:1'].lastResult, null);
});
