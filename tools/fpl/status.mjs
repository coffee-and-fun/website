#!/usr/bin/env node
/* Should anything happen today?
 *
 * The scheduled tasks run daily and ask this rather than assuming a weekday.
 * They have to: of the 38 deadlines in 2026/27, 27 fall on a Saturday, 4 on a
 * Friday, 2 on a Sunday and 5 on a WEDNESDAY. A fixed Wednesday-generate plus
 * Thursday-publish would try to publish those five after the deadline had gone,
 * and the publish guard would correctly refuse, so five gameweeks would simply
 * never appear.
 *
 * Deciding here rather than in the prompt also keeps date arithmetic out of the
 * model's hands, which is where it would eventually go wrong quietly.
 *
 * Prints JSON. Exit code is always 0; read the booleans.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const GENERATE_WINDOW = { minHours: 36, maxHours: 120 };  // 1.5 to 5 days out
const MIN_PUBLISH_HOURS = 2;

const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
  headers: { 'User-Agent': 'coffeeandfun-the-algorithm/1.0' },
});
if (!res.ok) {
  console.log(JSON.stringify({ error: `bootstrap HTTP ${res.status}`, shouldGenerate: false, shouldPublish: false }, null, 2));
  process.exit(0);
}
const boot = await res.json();

const now = Date.now();
const next = boot.events
  .filter(e => new Date(e.deadline_time).getTime() > now)
  .sort((a, b) => a.deadline_time.localeCompare(b.deadline_time))[0];

if (!next) {
  console.log(JSON.stringify({ seasonOver: true, shouldGenerate: false, shouldPublish: false }, null, 2));
  process.exit(0);
}

const gw = next.id;
const hours = (new Date(next.deadline_time).getTime() - now) / 3600000;
const postPath = path.join(REPO, 'src/pages/blog', `the-algorithm-gameweek-${gw}.md`);
const postExists = fs.existsSync(postPath);

/* Is there a committed but unpushed gameweek post? */
import { execSync } from 'node:child_process';
const sh = c => { try { return execSync(c, { cwd: REPO, encoding: 'utf8' }).trim(); } catch { return ''; } };
const unpushed = sh('git log --oneline origin/main..main').split('\n').filter(Boolean);
const pendingCommit = unpushed.find(l => /The Algorithm: gameweek/i.test(l)) || null;

const deadlineLocal = new Date(next.deadline_time).toLocaleString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  timeZone: 'Europe/London',
});

const out = {
  gameweek: gw,
  deadlineUtc: next.deadline_time,
  deadlineLondon: deadlineLocal,
  hoursUntilDeadline: +hours.toFixed(1),
  postExists,
  postPath: path.relative(REPO, postPath),
  pendingUnpushedCommit: pendingCommit,

  shouldGenerate: !postExists && hours >= GENERATE_WINDOW.minHours && hours <= GENERATE_WINDOW.maxHours,
  shouldPublish: !!pendingCommit && hours > MIN_PUBLISH_HOURS,

  why: (() => {
    if (postExists && pendingCommit && hours > MIN_PUBLISH_HOURS) return 'post written and awaiting push';
    if (postExists) return 'post already written for this gameweek';
    if (hours > GENERATE_WINDOW.maxHours) return `too early, ${hours.toFixed(0)}h out (window opens at ${GENERATE_WINDOW.maxHours}h)`;
    if (hours < GENERATE_WINDOW.minHours) return `inside the generate window's lower bound, ${hours.toFixed(1)}h left`;
    return 'ready to generate';
  })(),
};

console.log(JSON.stringify(out, null, 2));
