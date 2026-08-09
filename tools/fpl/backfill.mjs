/* Week 0 data pull for The Algorithm.
   Every source here is free and directly downloadable. Nothing paid, nothing
   behind a ToS that bars automated access. Throttled deliberately: these are
   free services and hammering them is how they stop being free. */
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'fpl-week0');
const UA = 'coffeeandfun-fpl-research/1.0 (personal project; contact robert.gabriel@helperbird.com)';

const manifest = { generated: null, sources: [], failures: [] };
let bytes = 0;

function dir(p) { fs.mkdirSync(path.join(OUT, p), { recursive: true }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function grab(url, rel, { throttle = 250, optional = false } = {}) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error('empty body');
    fs.writeFileSync(dest, buf);
    bytes += buf.length;
    manifest.sources.push({ url, file: rel, bytes: buf.length });
    return true;
  } catch (e) {
    (optional ? manifest.sources : manifest.failures).push(
      optional ? { url, file: rel, skipped: e.message } : { url, file: rel, error: e.message });
    return false;
  } finally {
    await sleep(throttle);
  }
}

console.log('writing to', OUT);
dir('.');

/* ---- 1. FPL API ---- */
console.log('\n[1/4] FPL API');
await grab('https://fantasy.premierleague.com/api/bootstrap-static/', 'fpl/bootstrap-static.json');
await grab('https://fantasy.premierleague.com/api/fixtures/', 'fpl/fixtures.json');

let ids = [];
try {
  const boot = JSON.parse(fs.readFileSync(path.join(OUT, 'fpl/bootstrap-static.json'), 'utf8'));
  ids = boot.elements.map(e => e.id);
  console.log('  players to pull:', ids.length);
} catch (e) { console.log('  could not read bootstrap:', e.message); }

let done = 0;
for (const id of ids) {
  await grab(`https://fantasy.premierleague.com/api/element-summary/${id}/`,
    `fpl/element-summary/${id}.json`, { throttle: 220, optional: true });
  if (++done % 100 === 0) console.log('  ' + done + '/' + ids.length);
}

/* ---- 2. Vaastav historical ---- */
console.log('\n[2/4] Vaastav historical seasons');
const seasons = ['2016-17','2017-18','2018-19','2019-20','2020-21','2021-22','2022-23','2023-24','2024-25','2025-26'];
for (const s of seasons) {
  const base = `https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data/${s}`;
  await grab(`${base}/players_raw.csv`, `vaastav/${s}/players_raw.csv`, { optional: true });
  await grab(`${base}/gws/merged_gw.csv`, `vaastav/${s}/merged_gw.csv`, { optional: true });
  await grab(`${base}/teams.csv`, `vaastav/${s}/teams.csv`, { optional: true });
  await grab(`${base}/fixtures.csv`, `vaastav/${s}/fixtures.csv`, { optional: true });
  console.log('  ' + s);
}

/* ---- 3. Football-Data.co.uk ---- */
console.log('\n[3/4] Football-Data.co.uk');
const divs = { E0: 'premier-league', E1: 'championship', D1: 'bundesliga', SP1: 'la-liga', I1: 'serie-a', F1: 'ligue-1' };
const fdSeasons = ['1920','2021','2122','2223','2324','2425','2526','2627'];
for (const [code, name] of Object.entries(divs)) {
  for (const s of fdSeasons) {
    await grab(`https://www.football-data.co.uk/mmz4281/${s}/${code}.csv`,
      `football-data/${name}/${s}.csv`, { optional: true });
  }
  console.log('  ' + name);
}

/* ---- 4. ClubElo ---- */
console.log('\n[4/4] ClubElo');
const today = '2026-08-09';
await grab(`http://api.clubelo.com/${today}`, `clubelo/all-clubs-${today}.csv`);
const clubs = ['Arsenal','Aston Villa','Bournemouth','Brentford','Brighton','Chelsea','Coventry',
  'Crystal Palace','Everton','Fulham','Hull','Ipswich','Leeds','Liverpool','Man City','Man United',
  'Newcastle','Forest','Tottenham','Sunderland'];
for (const c of clubs) {
  await grab(`http://api.clubelo.com/${encodeURIComponent(c.replace(/ /g, ''))}`,
    `clubelo/history/${c.replace(/ /g, '-').toLowerCase()}.csv`, { optional: true });
}
console.log('  ' + clubs.length + ' club histories attempted');

/* ---- manifest ---- */
manifest.generated = new Date().toISOString();
const ok = manifest.sources.filter(s => !s.skipped);
manifest.summary = {
  filesWritten: ok.length,
  skipped: manifest.sources.filter(s => s.skipped).length,
  failures: manifest.failures.length,
  totalBytes: bytes,
  totalMB: +(bytes / 1048576).toFixed(2)
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('\n=== done ===');
console.log('  files written :', manifest.summary.filesWritten);
console.log('  skipped       :', manifest.summary.skipped);
console.log('  hard failures :', manifest.summary.failures);
console.log('  total size    :', manifest.summary.totalMB, 'MB');
if (manifest.failures.length) {
  console.log('\n  failures:');
  for (const f of manifest.failures.slice(0, 10)) console.log('   ', f.file, f.error);
}
