#!/usr/bin/env node
/* The Algorithm: squad selection.
 *
 * Deliberately NOT a language model's job. Choosing 15 players under a budget
 * with positional quotas and a three-per-club cap is a constrained optimisation
 * problem: it has a right answer, it should give the same answer twice, and a
 * reader should be able to check it. An LLM freehanding this would be slower,
 * unreproducible, and would eventually invent a price.
 *
 * The LLM's job is the write-up, which reads the JSON this produces.
 *
 * Usage:  node tools/fpl/optimise.mjs --in data/week1 [--out picks.json]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : d; };

const IN = opt('--in');
if (!IN) { console.error('need --in data/weekN'); process.exit(2); }
const OUT = opt('--out', path.join(IN, 'picks.json'));

const boot = JSON.parse(fs.readFileSync(path.join(IN, 'bootstrap-static.json'), 'utf8'));
const fixtures = JSON.parse(fs.readFileSync(path.join(IN, 'fixtures.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(IN, 'manifest.json'), 'utf8'));
const GW = manifest.gameweek;

const BUDGET = 1000;                 // FPL tenths of a million
const QUOTA = { 1: 2, 2: 5, 3: 5, 4: 3 };   // GK, DEF, MID, FWD
const MAX_PER_CLUB = 3;
const BENCH_WEIGHT = 0.15;           // a bench point is worth less than a starting one
const POS = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };

const teams = Object.fromEntries(boot.teams.map(t => [t.id, t]));
const finishedGameweeks = boot.events.filter(e => e.finished).length;

/* Rough points per 90 by position. Used only as the target that thin samples
   get pulled toward, never as a prediction on its own. */
const POSITION_MEAN_PER90 = { 1: 3.2, 2: 3.0, 3: 3.1, 4: 3.3 };
const SHRINK_MINUTES = 900;

/* Pull a per-90 rate toward the positional average in proportion to how few
   minutes it rests on. Without it, 300 noisy minutes outrank 3000 solid ones,
   and the squad fills with players who had one good afternoon. */
function shrink(per90, minutes, pos) {
  const mean = POSITION_MEAN_PER90[pos] ?? 3.0;
  return (minutes * per90 + SHRINK_MINUTES * mean) / (minutes + SHRINK_MINUTES);
}

/* ---------------------------------------------------------------- fixtures */

/* Average FPL difficulty for a team's fixtures in the target gameweek. A blank
   gameweek gives no fixtures, and a player who is not playing scores nothing,
   so difficulty null is handled as "expect zero" rather than "expect average". */
const gwFixtures = fixtures.filter(f => f.event === GW);
function fixtureFor(teamId) {
  const fs_ = gwFixtures.filter(f => f.team_h === teamId || f.team_a === teamId);
  if (!fs_.length) return null;
  return fs_.map(f => {
    const home = f.team_h === teamId;
    return {
      opponent: teams[home ? f.team_a : f.team_h].short_name,
      home,
      difficulty: home ? f.team_h_difficulty : f.team_a_difficulty,
    };
  });
}

/* FPL rates difficulty 1 (easiest) to 5. Treat 3 as neutral and scale gently:
   fixtures move expected points, but not as much as newcomers assume. */
const DIFFICULTY_MULT = { 1: 1.25, 2: 1.12, 3: 1.0, 4: 0.88, 5: 0.75 };

/* -------------------------------------------------------- expected points */

/* Deliberately legible rather than clever. Every term is something a reader can
   argue with, which is the whole point of publishing the method. */
function expectedPoints(p) {
  const reasons = [];

  /* 1. availability. status: a available, d doubtful, i injured, s suspended,
        u unavailable, n on loan / not in squad. */
  let avail = 1;
  if (p.status !== 'a') {
    const chance = p.chance_of_playing_next_round;
    avail = chance === null || chance === undefined ? 0 : chance / 100;
    reasons.push(`availability ${p.status}${chance !== null ? ` (${chance}%)` : ''}`);
  }
  if (avail === 0) return { ep: 0, avail, reasons: reasons.concat('ruled out') };

  /* 2. base scoring rate. Prefer this season once there are minutes on the
        board; before that, last season. A player with neither is genuinely
        unknown, and unknown must not silently become zero, or every new signing
        is written off forever. */
  let per90 = null, basis = null;
  if (p.minutes >= 270) {
    per90 = shrink((p.total_points / p.minutes) * 90, p.minutes, p.element_type);
    basis = `${p.minutes} min on record`;
  } else {
    const sum = readHistory(p.id);
    if (sum && sum.minutes >= 450) {
      per90 = shrink((sum.points / sum.minutes) * 90, sum.minutes, p.element_type);
      basis = `last season, ${sum.minutes} min`;
    }
  }
  if (per90 === null) {
    /* No record. Fall back to a price-implied prior: FPL prices carry the
       market's own expectation, and a 4.5m player and a 9.0m player are not
       equally likely to return. Flagged so the write-up can say so. */
    per90 = pricePrior(p);
    basis = 'no history, price-implied prior';
    reasons.push('no prior data, using price prior');
  }

  /* 3. minutes expectation. Starts per appearance is the honest proxy for the
        predicted-lineup data this project does not have. */
  const mins = expectedMinutes(p);

  /* 4. fixtures */
  const fx = fixtureFor(p.team);
  if (!fx) return { ep: 0, avail, per90, basis, minutes: mins, fixture: null,
                    reasons: reasons.concat('no fixture this gameweek') };
  const fxMult = fx.reduce((a, f) => a + (DIFFICULTY_MULT[f.difficulty] ?? 1), 0) / fx.length;
  const ep = per90 * (mins / 90) * fxMult * avail * fx.length;

  return { ep, avail, per90, basis, minutes: mins, fixture: fx, fixtureMult: fxMult, reasons };
}

function pricePrior(p) {
  /* Rough per-90 returns implied by price, by position. Blunt on purpose: it
     only ever applies to players with no record at all. */
  const price = p.now_cost / 10;
  const slope = { 1: 0.55, 2: 0.62, 3: 0.58, 4: 0.55 }[p.element_type];
  return Math.max(1.2, (price - 3.7) * slope + 1.6);
}

const summaryCache = new Map();
function readHistory(id) {
  if (summaryCache.has(id)) return summaryCache.get(id);
  const f = path.join(IN, 'element-summary', `${id}.json`);
  let out = null;
  if (fs.existsSync(f)) {
    const past = JSON.parse(fs.readFileSync(f, 'utf8')).history_past;
    if (past && past.length) {
      const last = past.at(-1);
      out = { points: last.total_points, minutes: last.minutes, season: last.season_name };
    }
  }
  summaryCache.set(id, out);
  return out;
}

/* Minutes per TEAM GAME, not per start. Dividing by starts asks "how long does
   he play when he plays", which reads a substitute who completed the three
   matches he started as a nailed 90-minute player. Dividing by games asks how
   much of the season he actually plays, which is the question that matters. */
function expectedMinutes(p) {
  const played = finishedGameweeks || 38;
  if (p.minutes >= 270) return Math.min(90, p.minutes / played);
  const h = readHistory(p.id);
  if (h && h.minutes >= 450) return Math.min(90, h.minutes / 38);
  return 25;   // unknown: assume a fringe role rather than a starting one
}

/* ------------------------------------------------------------ the players */

const pool = boot.elements.map(p => {
  const e = expectedPoints(p);
  return {
    id: p.id, name: p.web_name, pos: p.element_type, posName: POS[p.element_type],
    team: p.team, club: teams[p.team].short_name, cost: p.now_cost,
    owned: parseFloat(p.selected_by_percent),
    ...e,
  };
}).filter(p => p.ep > 0);

console.log(`GW${GW}: ${pool.length} selectable players of ${boot.elements.length}`);

/* --------------------------------------------------------------- solver */

function valid(sq) {
  if (sq.length !== 15) return false;
  if (sq.reduce((a, p) => a + p.cost, 0) > BUDGET) return false;
  const byPos = {}, byClub = {};
  for (const p of sq) {
    byPos[p.pos] = (byPos[p.pos] || 0) + 1;
    byClub[p.team] = (byClub[p.team] || 0) + 1;
    if (byClub[p.team] > MAX_PER_CLUB) return false;
  }
  return Object.entries(QUOTA).every(([k, v]) => byPos[k] === v);
}

/* Every legal outfield split, so the XI is chosen by what scores most rather
   than by a formation picked in advance. */
const FORMATIONS = [];
for (let d = 3; d <= 5; d++) for (let m = 2; m <= 5; m++) for (let f = 1; f <= 3; f++)
  if (d + m + f === 10) FORMATIONS.push({ 2: d, 3: m, 4: f });

function bestXI(sq) {
  const byPos = { 1: [], 2: [], 3: [], 4: [] };
  for (const p of sq) byPos[p.pos].push(p);
  for (const k of Object.keys(byPos)) byPos[k].sort((a, b) => b.ep - a.ep);
  let best = null;
  for (const f of FORMATIONS) {
    const xi = [byPos[1][0], ...byPos[2].slice(0, f[2]), ...byPos[3].slice(0, f[3]), ...byPos[4].slice(0, f[4])];
    if (xi.some(x => !x)) continue;
    const total = xi.reduce((a, p) => a + p.ep, 0);
    if (!best || total > best.total) best = { xi, total, formation: `${f[2]}-${f[3]}-${f[4]}` };
  }
  return best;
}

function score(sq) {
  const b = bestXI(sq);
  if (!b) return -Infinity;
  const bench = sq.filter(p => !b.xi.includes(p)).reduce((a, p) => a + p.ep, 0);
  /* The armband doubles somebody, so the best player in the XI is worth twice
     what the objective would otherwise pay for. Leave this out and the solver
     has no reason to own a premium at all: it buys eleven mid-price starters,
     which optimises the floor and quietly gives up the ceiling. */
  const captainBonus = Math.max(...b.xi.map(p => p.ep));
  return b.total + captainBonus + BENCH_WEIGHT * bench;
}

/* Greedy seed by value per million, then hill-climb with single swaps until no
   swap improves. Not a proof of global optimality, but it is deterministic and
   it converges: identical input gives an identical squad every run. */
function solve() {
  const squad = [];
  const byPos = {};
  for (const p of pool) (byPos[p.pos] ||= []).push(p);
  for (const k of Object.keys(byPos)) byPos[k].sort((a, b) => (b.ep / b.cost) - (a.ep / a.cost));

  for (const [posKey, need] of Object.entries(QUOTA)) {
    for (const cand of byPos[posKey]) {
      if (squad.filter(p => p.pos === +posKey).length >= need) break;
      const clubCount = squad.filter(p => p.team === cand.team).length;
      if (clubCount >= MAX_PER_CLUB) continue;
      const spend = squad.reduce((a, p) => a + p.cost, 0) + cand.cost;
      const remaining = 15 - squad.length - 1;
      if (spend + remaining * 40 > BUDGET) continue;   // leave 4.0m for each slot still to fill
      squad.push(cand);
    }
  }
  if (!valid(squad)) { console.error('greedy seed is not a valid squad'); process.exit(5); }

  let current = squad, currentScore = score(current);

  /* Phase 1: single swaps. */
  let improved = true, passes = 0;
  while (improved && passes < 40) {
    improved = false; passes++;
    for (let i = 0; i < current.length; i++) {
      for (const cand of pool) {
        if (cand.pos !== current[i].pos) continue;
        if (current.some(p => p.id === cand.id)) continue;
        const trial = current.slice();
        trial[i] = cand;
        if (!valid(trial)) continue;
        const s = score(trial);
        if (s > currentScore + 1e-9) { current = trial; currentScore = s; improved = true; }
      }
    }
  }

  /* Phase 2: upgrade one, downgrade another.
     Single swaps can never reach a premium. Haaland outscores a mid-price
     midfielder but costs seven million more, and with half a million spare no
     one-for-one move is affordable, so phase 1 converges having never
     considered him. Funding an upgrade by cutting elsewhere is a two-player
     move, and it is the only way this squad ever owns a captaincy candidate.
     Candidates are capped per position to keep the pass to a few seconds. */
  const TOP = 30;
  const byPosSorted = {};
  for (const p of pool) (byPosSorted[p.pos] ||= []).push(p);
  for (const k of Object.keys(byPosSorted)) byPosSorted[k].sort((a, b) => b.ep - a.ep);

  improved = true; let pairPasses = 0;
  while (improved && pairPasses < 10) {
    improved = false; pairPasses++;
    outer:
    for (let i = 0; i < current.length; i++) {
      const up = byPosSorted[current[i].pos].slice(0, TOP)
        .filter(c => c.ep > current[i].ep && !current.some(p => p.id === c.id));
      for (const cand of up) {
        for (let j = 0; j < current.length; j++) {
          if (j === i) continue;
          const down = byPosSorted[current[j].pos].slice(0, TOP)
            .filter(c => c.cost < current[j].cost && !current.some(p => p.id === c.id) && c.id !== cand.id);
          for (const cheap of down) {
            const trial = current.slice();
            trial[i] = cand; trial[j] = cheap;
            if (!valid(trial)) continue;
            const s = score(trial);
            if (s > currentScore + 1e-9) {
              current = trial; currentScore = s; improved = true;
              continue outer;
            }
          }
        }
      }
    }
  }

  console.log(`  converged: ${passes} single-swap pass(es), ${pairPasses} pair pass(es)`);
  return current;
}

const squad = solve();
const xi = bestXI(squad);
const bench = squad.filter(p => !xi.xi.includes(p)).sort((a, b) => b.ep - a.ep);

/* ------------------------------------------------------------- captaincy */

/* The project's stated philosophy is a high floor with permission to be brave.
   So: take the highest expected points, but if a materially less owned player
   is within BRAVERY of the top, prefer them. Owning what everyone else owns
   cannot gain rank, however many points it scores. */
const BRAVERY = 0.90;
const capPool = xi.xi.slice().sort((a, b) => b.ep - a.ep);
const safest = capPool[0];
const differentials = capPool.filter(p => p.ep >= safest.ep * BRAVERY && p.owned < safest.owned / 2);
const captain = differentials.length
  ? differentials.sort((a, b) => b.ep - a.ep)[0]
  : safest;
const vice = capPool.find(p => p.id !== captain.id);

/* ---------------------------------------------------------------- output */

const strip = p => ({
  id: p.id, name: p.name, position: p.posName, club: p.club,
  price: +(p.cost / 10).toFixed(1), owned: p.owned,
  expectedPoints: +p.ep.toFixed(2), per90: p.per90 ? +p.per90.toFixed(2) : null,
  basis: p.basis, expectedMinutes: Math.round(p.minutes),
  fixture: p.fixture ? p.fixture.map(f => `${f.home ? 'v' : 'at'} ${f.opponent} (FDR ${f.difficulty})`).join(', ') : null,
  flags: p.reasons,
});

const picks = {
  gameweek: GW,
  deadline: manifest.deadline,
  generatedAt: new Date().toISOString(),
  formation: xi.formation,
  budget: { spent: +(squad.reduce((a, p) => a + p.cost, 0) / 10).toFixed(1), cap: BUDGET / 10 },
  expectedPoints: {
    startingXI: +xi.total.toFixed(2),
    withCaptainDoubled: +(xi.total + captain.ep).toFixed(2),
  },
  captain: strip(captain),
  viceCaptain: strip(vice),
  captaincy: {
    safestPick: strip(safest),
    wentDifferential: captain.id !== safest.id,
    rule: `differential chosen when within ${Math.round(BRAVERY * 100)}% of the safest option and under half its ownership`,
  },
  startingXI: xi.xi.map(strip),
  bench: bench.map(strip),
  model: {
    note: 'expected points = base per 90 x expected minutes x fixture difficulty x availability',
    benchWeight: BENCH_WEIGHT,
    difficultyMultipliers: DIFFICULTY_MULT,
    knownLimitations: [
      'No predicted lineups. Minutes are inferred from starts per appearance, which misses a manager signalling a rest on the Friday.',
      'Players with no prior record fall back to a price-implied prior, flagged per player in flags[].',
      'Promoted-club players are judged on volume rather than shot quality, since free Championship data has no xG.',
    ],
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(picks, null, 2));

console.log(`\n  ${xi.formation}, £${picks.budget.spent}m of £100.0m`);
console.log(`  XI expected points: ${picks.expectedPoints.startingXI}`);
console.log(`  captain: ${captain.name} (${captain.club}) ${captain.ep.toFixed(2)}xP, ${captain.owned}% owned${picks.captaincy.wentDifferential ? '  <- differential over ' + safest.name : ''}`);
console.log(`\n  written: ${OUT}`);
