/* Player-level xG for the big five, from Understat.
   The scraping libraries all look for `var playersData = JSON.parse(...)` inline
   in the league page. Understat has moved that behind an XHR, so this posts to
   the same endpoint the page's own league.min.js calls. Responses are gzipped,
   hence --compressed / fetch's automatic decoding. Throttled at 2s. */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.env.HOME, 'Downloads', 'fpl-week0', 'understat');
const UA = 'coffeeandfun-fpl-research/1.0 (robert.gabriel@helperbird.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const LEAGUES = { EPL: 'premier-league', La_liga: 'la-liga', Bundesliga: 'bundesliga', Serie_A: 'serie-a', Ligue_1: 'ligue-1' };
const SEASONS = [2020, 2021, 2022, 2023, 2024, 2025];

let files = 0, players = 0;
const failures = [];

for (const [code, slug] of Object.entries(LEAGUES)) {
  for (const season of SEASONS) {
    try {
      const res = await fetch('https://understat.com/main/getPlayersStats/', {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `league=${code}&season=${season}`,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      const arr = j.players;
      if (!Array.isArray(arr) || !arr.length) throw new Error('no players in payload');
      const dest = path.join(OUT, slug, `${season}.json`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, JSON.stringify(arr, null, 1));
      files++; players += arr.length;
      console.log(`  ${slug.padEnd(16)} ${season}  ${String(arr.length).padStart(4)} players`);
    } catch (e) {
      failures.push(`${slug} ${season}: ${e.message}`);
      console.log(`  ${slug.padEnd(16)} ${season}  FAILED ${e.message}`);
    }
    await sleep(2000);
  }
}

console.log('\n  files:', files, '| player-season rows:', players);
if (failures.length) { console.log('  failures:'); failures.forEach(f => console.log('   ', f)); }
