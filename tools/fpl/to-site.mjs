#!/usr/bin/env node
/* Push a gameweek's picks into the site's data layer.
 *
 * data/ is gitignored and holds ~9MB a week. The site needs a fraction of that,
 * so this writes a slimmed record into src/_data/fplPicks.json, which IS
 * committed. That file drives /fpl/ and the per-gameweek archive pages.
 *
 * Re-running for the same gameweek replaces that week rather than appending, so
 * a corrected rerun does not produce two of them.
 *
 * Usage:  node tools/fpl/to-site.mjs --in data/week1
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : d; };

const IN = opt('--in');
if (!IN) { console.error('need --in data/weekN'); process.exit(2); }

const SITE_DATA = path.join(process.cwd(), 'src/_data/fplPicks.json');
const picks = JSON.parse(fs.readFileSync(path.join(IN, 'picks.json'), 'utf8'));

const slimPlayer = p => ({
  name: p.name, position: p.position, club: p.club,
  price: p.price, owned: p.owned, xP: p.expectedPoints,
  fixture: p.fixture, flags: p.flags && p.flags.length ? p.flags : undefined,
});

const week = {
  gameweek: picks.gameweek,
  deadline: picks.deadline,
  generatedAt: picks.generatedAt,
  formation: picks.formation,
  budget: picks.budget,
  expectedPoints: picks.expectedPoints,
  captain: { name: picks.captain.name, club: picks.captain.club, owned: picks.captain.owned, xP: picks.captain.expectedPoints },
  viceCaptain: { name: picks.viceCaptain.name, club: picks.viceCaptain.club },
  wentDifferential: picks.captaincy.wentDifferential,
  safestPick: { name: picks.captaincy.safestPick.name, owned: picks.captaincy.safestPick.owned },
  transfers: picks.transfers,
  startingXI: picks.startingXI.map(slimPlayer),
  bench: picks.bench.map(slimPlayer),
  /* The post is written after this runs, so the link is predicted rather than
     verified. It is the one field here that can be wrong. */
  postUrl: `/blog/the-algorithm-gameweek-${picks.gameweek}/`,
};

let all = [];
if (fs.existsSync(SITE_DATA)) {
  try { all = JSON.parse(fs.readFileSync(SITE_DATA, 'utf8')); } catch { all = []; }
  if (!Array.isArray(all)) all = [];
}

const existing = all.findIndex(w => w.gameweek === week.gameweek);
if (existing > -1) { all[existing] = week; console.log(`  replaced existing gameweek ${week.gameweek}`); }
else { all.push(week); console.log(`  added gameweek ${week.gameweek}`); }

all.sort((a, b) => a.gameweek - b.gameweek);

fs.mkdirSync(path.dirname(SITE_DATA), { recursive: true });
fs.writeFileSync(SITE_DATA, JSON.stringify(all, null, 2) + '\n');

const kb = (fs.statSync(SITE_DATA).size / 1024).toFixed(1);
console.log(`  src/_data/fplPicks.json now holds ${all.length} gameweek(s), ${kb} KB`);
console.log(`  /fpl/ will show GW${all.at(-1).gameweek}; archive pages exist for all of them`);
