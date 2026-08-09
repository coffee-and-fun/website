#!/usr/bin/env node
/* The Algorithm: weekly data pull.
 *
 * Writes everything into data/week{N}/ where N is the upcoming gameweek, so a
 * rerun overwrites its own week rather than accumulating junk.
 *
 * Refuses to run if the next deadline has already passed. That is not defensive
 * padding: the scheduled task can fire late (the Claude app runs a missed task
 * on next launch), and publishing a squad for a gameweek that has already
 * kicked off is the one failure the project promises cannot happen.
 *
 * Usage:  node tools/fpl/fetch.mjs [--out DIR] [--force]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : d; };

const ROOT = opt('--out', path.join(process.cwd(), 'data'));
const UA = 'coffeeandfun-the-algorithm/1.0 (personal FPL research)';
const LEAGUE_ID = 626428;
const ENTRY_ID = 3065962;   // the squad the algorithm actually manages
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function json(url, { throttle = 220 } = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const body = await res.json();
  await sleep(throttle);
  return body;
}

function write(dir, name, obj) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 1));
  return fs.statSync(p).size;
}

/* ---------- 1. bootstrap, and work out which gameweek we are aiming at ---------- */

console.log('fetching bootstrap-static');
const boot = await json('https://fantasy.premierleague.com/api/bootstrap-static/');

const now = Date.now();
const upcoming = boot.events
  .filter(e => new Date(e.deadline_time).getTime() > now)
  .sort((a, b) => a.deadline_time.localeCompare(b.deadline_time))[0];

if (!upcoming) {
  console.error('No gameweek deadline left in the season. Nothing to do.');
  process.exit(3);
}

const hoursToDeadline = (new Date(upcoming.deadline_time).getTime() - now) / 3600000;
console.log(`next deadline: GW${upcoming.id} at ${upcoming.deadline_time} (${hoursToDeadline.toFixed(1)}h away)`);

/* A run that lands inside the last two hours is almost certainly a late fire
   rather than the Wednesday slot. Generating then is worse than not generating,
   because the write-up would go out claiming to predate a deadline it did not. */
if (hoursToDeadline < 2 && !flag('--force')) {
  console.error(`Only ${hoursToDeadline.toFixed(1)}h until the GW${upcoming.id} deadline.`);
  console.error('Refusing to generate this close. Pass --force to override deliberately.');
  process.exit(4);
}

const OUT = path.join(ROOT, `week${upcoming.id}`);
let bytes = write(OUT, 'bootstrap-static.json', boot);

/* ---------- 2. the rest ---------- */

console.log('fetching fixtures');
bytes += write(OUT, 'fixtures.json', await json('https://fantasy.premierleague.com/api/fixtures/'));

console.log('fetching league standings');
try {
  bytes += write(OUT, 'league-standings.json',
    await json(`https://fantasy.premierleague.com/api/leagues-classic/${LEAGUE_ID}/standings/`));
} catch (e) { console.warn('  league standings failed:', e.message); }

/* The actual squad, so week 2 onward can plan a transfer instead of pretending
   it gets to pick fifteen fresh players. entry/{id}/ carries the bank and squad
   value; the picks endpoint only exists once a gameweek has been played, so it
   legitimately 404s before the season starts. */
console.log('fetching entry state');
try {
  bytes += write(OUT, 'entry.json',
    await json(`https://fantasy.premierleague.com/api/entry/${ENTRY_ID}/`));
  bytes += write(OUT, 'entry-history.json',
    await json(`https://fantasy.premierleague.com/api/entry/${ENTRY_ID}/history/`));
} catch (e) { console.warn('  entry state failed:', e.message); }

const finishedGws = boot.events.filter(e => e.finished).map(e => e.id);
const lastFinished = finishedGws.at(-1);
if (lastFinished) {
  console.log(`fetching live data for the last finished gameweek (GW${lastFinished})`);
  try {
    bytes += write(OUT, `live-gw${lastFinished}.json`,
      await json(`https://fantasy.premierleague.com/api/event/${lastFinished}/live/`));
  } catch (e) { console.warn('  live data failed:', e.message); }
  console.log(`fetching our own picks for GW${lastFinished}`);
  try {
    bytes += write(OUT, 'entry-picks.json',
      await json(`https://fantasy.premierleague.com/api/entry/${ENTRY_ID}/event/${lastFinished}/picks/`));
  } catch (e) { console.warn('  own picks failed:', e.message); }
} else {
  console.log('no finished gameweeks yet, so no live data and no existing squad');
  console.log('  (gameweek 1 is a free pick: the optimiser builds from scratch)');
}

console.log(`fetching per-player history for ${boot.elements.length} players (throttled, a few minutes)`);
const sumDir = path.join(OUT, 'element-summary');
let done = 0, failed = 0;
for (const p of boot.elements) {
  try {
    bytes += write(sumDir, `${p.id}.json`,
      await json(`https://fantasy.premierleague.com/api/element-summary/${p.id}/`));
  } catch { failed++; }
  if (++done % 100 === 0) console.log(`  ${done}/${boot.elements.length}`);
}

/* ---------- 3. manifest ---------- */

const manifest = {
  gameweek: upcoming.id,
  deadline: upcoming.deadline_time,
  fetchedAt: new Date().toISOString(),
  players: boot.elements.length,
  elementSummaryFailures: failed,
  totalMB: +(bytes / 1048576).toFixed(2),
};
write(OUT, 'manifest.json', manifest);

console.log(`\ndone. GW${upcoming.id} -> ${OUT}`);
console.log(`  ${manifest.totalMB} MB, ${failed} player files failed`);
