if (typeof Vue === 'undefined') {
    document.getElementById('load-fallback').hidden = false;
    throw new Error('Vue failed to load');
}
const { createApp } = Vue;
const PEER_OK = typeof Peer !== 'undefined';

/* ---------- Deterministic RNG (host seeds, both sides replay) ---------- */
function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/* ---------- Floor definitions ---------- */
const FLOORS = [
    { name: 'The Doorstep', flavor: 'A classic board. The dungeon is being polite. It won’t last.', w: 7, h: 6, need: 4, twist: 'none', depth: 2 },
    { name: 'The Wide Cavern', flavor: 'Nine columns of nothing. Plenty of room to make mistakes.', w: 9, h: 6, need: 4, twist: 'none', depth: 2 },
    { name: 'The Rubble Room', flavor: 'Stones litter the board. They belong to no one.', w: 7, h: 6, need: 4, twist: 'stones', depth: 3 },
    { name: 'The Gem Hollow', flavor: 'Wild gems count for whoever needs them. Including them.', w: 7, h: 6, need: 4, twist: 'wilds', depth: 3 },
    { name: 'The Crumbling Deep', flavor: 'Every tenth disc, the bottom row gives way.', w: 7, h: 6, need: 4, twist: 'crumble', depth: 4 },
    { name: 'The Tall Shaft', flavor: 'A narrow climb. Watch your head.', w: 6, h: 9, need: 4, twist: 'none', depth: 4 },
    { name: 'The Long Count', flavor: 'Four isn’t enough down here. Connect five.', w: 9, h: 7, need: 5, twist: 'none', depth: 4 }
];

const RELICS = {
    boulder: { icon: '💣', name: 'Boulder', desc: 'Drop a stone into a column. It blocks the path and belongs to no one.' },
    smash: { icon: '🔨', name: 'Smash', desc: 'Shatter the top disc of any column, yours or theirs.' },
    undermine: { icon: '🕳️', name: 'Undermine', desc: 'Pull the bottom disc out of a column. Everything above falls one row.' },
    timewarp: { icon: '⏳', name: 'Time warp', desc: 'Play it, then drop as usual, your opponent loses their next turn.' }
};
const RELIC_KINDS = Object.keys(RELICS);
const EMOTES = ['👋', '😄', '😱', '☕'];
const CRUMBLE_EVERY = 10;

let uid = 1;

createApp({
    data() {
        return {
            FLOORS, RELICS, EMOTES,
            peerOk: PEER_OK,
            screen: 'menu',
            mode: 'solo',          // solo | duel
            isHost: true,
            mePlayer: 1,           // 1 = coral, 2 = amber
            myName: localStorage.getItem('ddName') || '',
            oppName: 'Rival',
            // net
            peer: null, conn: null, peerId: '', joinId: '',
            connecting: false, netError: '', copied: false, copyTimer: null,
            rematchOffered: false,
            // run
            seed: 0,
            floor: 0,
            crowns: { 1: 0, 2: 0 },
            relics: { 1: {}, 2: {} },   // kind -> charges
            relicsCollected: 0,
            totalMoves: 0,
            attempt: 0,                 // bumps on floor draw-replays
            boardEpoch: 0,              // forces column re-render between floors
            // floor state
            cols: [],                   // array of stacks; cell = {o, id, fresh}
            bw: 7, bh: 6, need: 4,
            turn: 1, moveNum: 0,
            skipNext: { 1: false, 2: false },
            over: false, winner: 0, winCells: [],
            starter: 1,
            // ui
            hoverCol: -1,
            targeting: null,
            aiThinking: false,
            shaking: false,
            draftOpen: false, draftOffer: [], iAmDrafting: false,
            floorResult: null,
            runEnd: null,
            emoteShown: '', emoteTimer: null,
            announcement: '',
            muted: localStorage.getItem('ddMuted') === '1',
            audioCtx: null
        };
    },
    computed: {
        isDuel() { return this.mode === 'duel'; },
        oppPlayer() { return this.mePlayer === 1 ? 2 : 1; },
        floorDef() { return FLOORS[this.floor]; },
        inviteLink() {
            return window.location.origin + window.location.pathname + '?gameId=' + this.peerId;
        },
        myTurn() {
            if (this.over) return false;
            if (this.isDuel) return this.turn === this.mePlayer;
            return this.turn === 1 && !this.aiThinking;
        },
        boardMaxW() {
            // Keep header + board + relic tray on one screen: tall shafts
            // go narrow, wide caverns get a bit more room.
            if (this.bh > this.bw) return '330px';
            if (this.bw >= 9) return '560px';
            return '470px';
        },
        ghostClass() {
            if (this.targeting === 'boulder') return 'stone';
            return this.mePlayer === 1 ? 'p1' : 'p2';
        },
        myRelicList() {
            const mine = this.relics[this.mePlayer] || {};
            return RELIC_KINDS.filter(k => mine[k] > 0).map(k => ({ kind: k, count: mine[k] }));
        },
        statusText() {
            if (this.over) {
                if (this.winner === 0) return 'A draw?! The dungeon demands a rematch.';
                return this.winner === this.mePlayer || (!this.isDuel && this.winner === 1)
                    ? 'Floor cleared!' : (this.isDuel ? this.nameOf(this.winner) + ' takes the floor.' : 'The dungeon takes the floor.');
            }
            if (this.targeting) return RELICS[this.targeting].icon + ' ' + RELICS[this.targeting].name + ' armed, pick a column.';
            if (this.aiThinking) return 'The dungeon is thinking…';
            if (this.myTurn) return 'Your move.';
            return this.isDuel ? 'Waiting on ' + this.oppName + '…' : 'The dungeon is thinking…';
        },
        statusSub() {
            if (this.over || this.targeting) return '';
            if (this.floorDef.twist === 'crumble' && !this.over) {
                const left = CRUMBLE_EVERY - (this.moveNum % CRUMBLE_EVERY);
                return left <= 3 ? 'The floor crumbles in ' + left + ' disc' + (left === 1 ? '' : 's') + '…' : '';
            }
            const meP = this.isDuel ? this.mePlayer : 1;
            if (this.skipNext[meP]) return '⏳ You’re frozen in time, you’ll lose your next turn.';
            if (this.skipNext[meP === 1 ? 2 : 1]) return '⏳ Time warp is set, they lose their next turn.';
            return '';
        }
    },
    mounted() {
        const params = new URLSearchParams(window.location.search);
        const gid = params.get('gameId');
        if (gid && PEER_OK) {
            this.joinId = gid;
            this.screen = 'join';
        }
        window.addEventListener('beforeunload', this.cleanupPeer);
    },
    beforeUnmount() {
        this.cleanupPeer();
        window.removeEventListener('beforeunload', this.cleanupPeer);
    },
    methods: {
        /* ---------- helpers ---------- */
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },
        nameOf(p) {
            if (!this.isDuel) return p === 1 ? (this.myName || 'You') : 'The Dungeon';
            if (p === this.mePlayer) return this.myName || 'You';
            return this.oppName;
        },
        crownStr(p) {
            if (!this.isDuel) return p === 1 ? '⚑ floor ' + (this.floor + 1) : '';
            return '👑'.repeat(this.crowns[p]) || ', ';
        },
        oppTurnPlayer() { return this.turn === 1 ? 2 : 1; },
        rng(tag) {
            // deterministic per (seed, floor, attempt, tag)
            let h = this.seed ^ (this.floor * 2654435761) ^ (this.attempt * 40503) ^ tag;
            return mulberry32(h);
        },

        /* ---------- audio ---------- */
        toggleMute() {
            this.muted = !this.muted;
            localStorage.setItem('ddMuted', this.muted ? '1' : '0');
        },
        sfx(kind, opt) {
            if (this.muted) return;
            try {
                if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const ctx = this.audioCtx;
                if (ctx.state === 'suspended') ctx.resume();
                const t = ctx.currentTime;
                const play = (freq, start, dur, type, vol) => {
                    const o = ctx.createOscillator(), g = ctx.createGain();
                    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t + start);
                    g.gain.setValueAtTime(vol || 0.12, t + start);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
                    o.connect(g).connect(ctx.destination);
                    o.start(t + start); o.stop(t + start + dur + 0.02);
                };
                if (kind === 'drop') play(240 + (opt || 0) * 36, 0, 0.12, 'sine', 0.14);
                else if (kind === 'win') { play(523, 0, 0.14); play(659, 0.12, 0.14); play(784, 0.24, 0.28); }
                else if (kind === 'lose') { play(330, 0, 0.2, 'triangle'); play(233, 0.18, 0.34, 'triangle'); }
                else if (kind === 'smash') { play(120, 0, 0.18, 'sawtooth', 0.16); play(90, 0.04, 0.2, 'sawtooth', 0.12); }
                else if (kind === 'crumble') { play(70, 0, 0.5, 'sawtooth', 0.14); play(55, 0.1, 0.5, 'sawtooth', 0.1); }
                else if (kind === 'draft') { play(660, 0, 0.1); play(880, 0.09, 0.16); }
                else if (kind === 'emote') play(740, 0, 0.09, 'triangle', 0.08);
            } catch (e) { /* audio is garnish */ }
        },

        /* ---------- run / floor setup ---------- */
        startSolo() {
            this.mode = 'solo';
            this.isHost = true;
            this.mePlayer = 1;
            this.seed = (Math.random() * 0xFFFFFFFF) >>> 0;
            this.beginRun();
        },
        beginRun() {
            this.floor = 0;
            this.crowns = { 1: 0, 2: 0 };
            this.relics = { 1: {}, 2: {} };
            this.relicsCollected = 0;
            this.totalMoves = 0;
            this.runEnd = null;
            this.floorResult = null;
            this.draftOpen = false;
            this.rematchOffered = false;
            this.starter = 1;
            this.screen = 'game';
            this.setupFloor();
            this.announce('Run started. ' + this.floorDef.name + '. ' + (this.turn === this.mePlayer || !this.isDuel ? 'Your move.' : this.oppName + ' moves first.'));
        },
        setupFloor() {
            const def = FLOORS[this.floor];
            this.bw = def.w; this.bh = def.h; this.need = def.need;
            this.cols = Array.from({ length: def.w }, () => []);
            this.turn = this.starter;
            this.moveNum = 0;
            this.skipNext = { 1: false, 2: false };
            this.over = false; this.winner = 0; this.winCells = [];
            this.targeting = null;
            this.hoverCol = -1;
            this.boardEpoch++;

            // Twist seeding, deterministic on both peers
            const rnd = this.rng(97);
            if (def.twist === 'stones') {
                for (let i = 0; i < 5; i++) {
                    const c = Math.floor(rnd() * def.w);
                    if (this.cols[c].length < def.h - 2) this.cols[c].push({ o: 4, id: uid++, fresh: false });
                }
            } else if (def.twist === 'wilds') {
                let placed = 0, guard = 0;
                while (placed < 3 && guard++ < 40) {
                    const c = Math.floor(rnd() * def.w);
                    if (this.cols[c].length < def.h - 2) { this.cols[c].push({ o: 3, id: uid++, fresh: false }); placed++; }
                }
            }

            if (!this.isDuel && this.turn === 2) this.scheduleAi();
        },

        /* ---------- board reads ---------- */
        cellAt(c, r) { return this.cols[c] ? this.cols[c][r] || null : null; },
        discClass(cell) { return cell.o === 1 ? 'p1' : cell.o === 2 ? 'p2' : cell.o === 4 ? 'stone' : 'wild'; },
        isWinCell(c, r) { return this.winCells.some(w => w[0] === c && w[1] === r); },
        colFull(c) { return this.cols[c].length >= this.bh; },
        colLabel(c) {
            const n = this.cols[c] ? this.cols[c].length : 0;
            let base = 'Column ' + (c + 1) + ' of ' + this.bw + ', ' + n + ' of ' + this.bh + ' filled.';
            if (this.targeting) return RELICS[this.targeting].name + ': ' + base;
            return base + (this.myTurn ? ' Drop here.' : '');
        },
        canActOnColumn(c) {
            if (this.over || this.draftOpen || this.floorResult || this.runEnd) return false;
            if (!this.myTurn) return false;
            if (this.targeting === 'smash') return this.cols[c].length > 0 && this.cols[c][this.cols[c].length - 1].o !== 4;
            if (this.targeting === 'undermine') return this.cols[c].length > 0 && this.cols[c][0].o !== 4;
            return !this.colFull(c);
        },
        columnDisabled(c) {
            // Buttons stay enabled during the opponent's turn so keyboard focus
            // isn't dumped to <body> after every move, clicks no-op via
            // canActOnColumn. Only hard-disable when the floor is done.
            return this.over || !!this.floorResult || !!this.runEnd || this.draftOpen;
        },
        showGhostAt(c, r) {
            if (this.hoverCol !== c || !this.myTurn || this.over) return false;
            if (this.targeting === 'smash' || this.targeting === 'undermine') return false;
            return this.cols[c].length === r && r < this.bh;
        },
        showSmashMarkAt(c, r) {
            return this.targeting === 'smash' && this.hoverCol === c && this.myTurn
                && this.cols[c].length - 1 === r && this.cols[c].length > 0;
        },
        showMineMarkAt(c, r) {
            return this.targeting === 'undermine' && this.hoverCol === c && this.myTurn && r === 0 && this.cols[c].length > 0;
        },

        /* ---------- core rules ---------- */
        grid() {
            // owner grid[c][r]: 0 empty, 1, 2, 3 wild, 4 stone
            return this.cols.map(stack => {
                const col = new Array(this.bh).fill(0);
                stack.forEach((cell, r) => { col[r] = cell.o; });
                return col;
            });
        },
        findWin(g, p) {
            const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
            const okCell = (v) => v === p || v === 3;
            for (let c = 0; c < this.bw; c++) {
                for (let r = 0; r < this.bh; r++) {
                    if (!okCell(g[c][r])) continue;
                    for (const [dc, dr] of dirs) {
                        const cells = [[c, r]];
                        let cc = c + dc, rr = r + dr;
                        while (cc >= 0 && cc < this.bw && rr >= 0 && rr < this.bh && okCell(g[cc][rr])) {
                            cells.push([cc, rr]);
                            if (cells.length === this.need) {
                                // a line of pure wilds shouldn't win for anyone
                                if (cells.some(([x, y]) => g[x][y] === p)) return cells;
                            }
                            cc += dc; rr += dr;
                        }
                    }
                }
            }
            return null;
        },
        boardFull() {
            return this.cols.every((s, c) => this.colFull(c));
        },
        clearFresh() {
            this.cols.forEach(s => s.forEach(cell => { cell.fresh = false; }));
        },

        /* ---------- actions (applied identically on both peers) ---------- */
        clickColumn(c) {
            if (!this.canActOnColumn(c)) return;
            if (this.targeting) {
                const kind = this.targeting;
                this.targeting = null;
                this.doAction({ t: 'relic', kind, col: c }, true);
            } else {
                this.doAction({ t: 'move', col: c }, true);
            }
        },
        armRelic(kind) {
            if (!this.canUseRelic(kind)) return;
            if (kind === 'timewarp') {
                this.doAction({ t: 'relic', kind: 'timewarp' }, true);
                return;
            }
            this.targeting = this.targeting === kind ? null : kind;
        },
        canUseRelic(kind) {
            if (this.over || !this.myTurn || this.draftOpen || this.floorResult) return false;
            if (!(this.relics[this.mePlayer][kind] > 0)) return false;
            if (kind === 'timewarp') return !this.skipNext[this.oppPlayer];
            if (kind === 'boulder') return this.cols.some((s, c) => !this.colFull(c));
            if (kind === 'smash') return this.cols.some(s => s.length > 0 && s[s.length - 1].o !== 4);
            if (kind === 'undermine') return this.cols.some(s => s.length > 0 && s[0].o !== 4);
            return false;
        },
        doAction(action, mine) {
            // mine=true → local player initiated: send to peer first
            if (mine && this.isDuel && this.conn && this.conn.open) {
                this.conn.send(action);
            }
            this.applyAction(action, mine ? this.mePlayer : (this.isDuel ? this.oppPlayer : 2));
        },
        applyAction(action, byPlayer) {
            if (this.over) return;
            if (byPlayer !== this.turn) return; // stale or out-of-turn message
            if (action.t === 'move') {
                const c = Number(action.col);
                if (!(c >= 0 && c < this.bw)) return;
                this.applyDrop(c, byPlayer);
            } else if (action.t === 'relic') {
                this.applyRelic(action, byPlayer);
            }
        },
        applyDrop(c, by) {
            if (this.colFull(c)) return;
            this.clearFresh();
            const row = this.cols[c].length;
            this.cols[c].push({ o: by, id: uid++, fresh: true });
            this.moveNum++;
            this.totalMoves++;
            this.sfx('drop', row);
            this.announce((by === this.mePlayer || (!this.isDuel && by === 1) ? 'You dropped' : this.nameOf(by) + ' dropped') + ' in column ' + (c + 1) + '.');
            this.afterMutation(by, true);
        },
        applyRelic(action, by) {
            const kind = action.kind;
            if (!(this.relics[by][kind] > 0)) return;
            this.relics[by][kind]--;
            if (kind === 'timewarp') {
                this.skipNext[by === 1 ? 2 : 1] = true;
                this.sfx('draft');
                this.announce(this.nameOf(by) + ' played Time warp, ' + this.nameOf(by === 1 ? 2 : 1) + ' will lose their next turn.');
                return; // free action; turn continues
            }
            this.clearFresh();
            const c = action.col;
            if (kind === 'boulder') {
                if (this.colFull(c)) return;
                this.cols[c].push({ o: 4, id: uid++, fresh: true });
                this.sfx('drop', this.cols[c].length);
                this.announce(this.nameOf(by) + ' dropped a boulder in column ' + (c + 1) + '.');
                // A boulder is a dropped piece: it advances (and can trigger) the crumble count.
                this.moveNum++;
                this.afterMutation(by, true);
                return;
            }
            if (kind === 'smash') {
                if (!this.cols[c].length) return;
                this.cols[c].pop();
                this.sfx('smash');
                this.shakeBoard();
                this.announce(this.nameOf(by) + ' smashed the top disc of column ' + (c + 1) + '.');
            } else if (kind === 'undermine') {
                if (!this.cols[c].length) return;
                this.cols[c].shift();
                this.sfx('smash');
                this.shakeBoard();
                this.announce(this.nameOf(by) + ' undermined column ' + (c + 1) + ', everything fell one row.');
            }
            // Removals aren't drops: the "every tenth disc" crumble count doesn't move.
            this.afterMutation(by, false);
        },
        afterMutation(by, wasDrop) {
            // crumble check (drops only count the counter, but any mutation can trigger win)
            if (this.floorDef.twist === 'crumble' && wasDrop && this.moveNum > 0 && this.moveNum % CRUMBLE_EVERY === 0) {
                const anyBottom = this.cols.some(s => s.length > 0);
                if (anyBottom) {
                    this.cols.forEach(s => s.shift());
                    this.sfx('crumble');
                    this.shakeBoard();
                    this.announce('The floor crumbles! The bottom row is gone.');
                }
            }
            const g = this.grid();
            // acting player checked first, smash/undermine/crumble can gift lines
            const mineWin = this.findWin(g, by);
            const other = by === 1 ? 2 : 1;
            const theirWin = mineWin ? null : this.findWin(g, other);
            if (mineWin || theirWin) {
                this.finishFloor(mineWin ? by : other, mineWin || theirWin);
                return;
            }
            if (this.boardFull()) {
                this.finishFloor(0, []);
                return;
            }
            // next turn (honoring time warp)
            let next = other;
            if (this.skipNext[next]) {
                this.skipNext[next] = false;
                this.announce(this.nameOf(next) + ' is frozen in time, ' + this.nameOf(by) + ' goes again.');
                next = by;
            }
            this.turn = next;
            if (!this.isDuel && this.turn === 2 && !this.over) this.scheduleAi();
        },
        shakeBoard() {
            this.shaking = false;
            requestAnimationFrame(() => { this.shaking = true; setTimeout(() => { this.shaking = false; }, 500); });
        },

        /* ---------- floor + run resolution ---------- */
        finishFloor(winner, cells) {
            this.over = true;
            this.winner = winner;
            this.winCells = cells || [];
            this.targeting = null;
            // Compute the draft offer NOW, deterministically, both peers derive
            // the same list from the shared seed, so a {draft, idx} message maps
            // correctly even if this peer hasn't clicked through the overlay yet.
            if (winner !== 0) {
                const rnd = this.rng(211);
                const pool = RELIC_KINDS.slice();
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(rnd() * (i + 1));
                    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
                }
                this.draftOffer = pool.slice(0, 3);
            }

            if (winner === 0) {
                this.sfx('lose');
                this.announce('A draw. The dungeon insists you settle it, same floor, fresh board.');
                setTimeout(() => {
                    this.floorResult = {
                        emoji: '🤝', title: 'A draw?!',
                        sub: 'The dungeon refuses ambiguity. Same floor, fresh board.',
                        cta: 'Replay the floor', kind: 'draw'
                    };
                }, 700);
                return;
            }

            const iWon = this.isDuel ? winner === this.mePlayer : winner === 1;
            this.sfx(iWon ? 'win' : 'lose');
            this.announce(iWon ? 'You cleared the floor!' : (this.isDuel ? this.oppName + ' took the floor.' : 'The dungeon took the floor. The run is over.'));

            if (this.isDuel) {
                this.crowns[winner]++;
                const champ = this.crowns[winner] >= 4;
                setTimeout(() => {
                    if (champ) {
                        this.showRunEnd(winner === this.mePlayer);
                    } else {
                        this.floorResult = {
                            emoji: iWon ? '🎉' : '🪦',
                            title: iWon ? 'Floor yours!' : this.oppName + ' takes it',
                            sub: iWon
                                ? 'They loot the room for a relic, then the descent continues.'
                                : 'You loot the room, pick a relic on the next screen.',
                            cta: 'Continue', kind: 'duel-next'
                        };
                    }
                }, 900);
            } else {
                setTimeout(() => {
                    if (!iWon) {
                        this.showRunEnd(false);
                    } else if (this.floor === FLOORS.length - 1) {
                        this.showRunEnd(true);
                    } else {
                        this.floorResult = {
                            emoji: '🎉', title: 'Floor cleared!',
                            sub: 'Grab a relic before the stairs, the next floor is meaner.',
                            cta: 'Loot the room', kind: 'solo-next'
                        };
                    }
                }, 900);
            }
        },
        floorResultContinue() {
            const kind = this.floorResult.kind;
            this.floorResult = null;
            if (kind === 'draw') {
                this.attempt++;
                this.setupFloor();
                return;
            }
            if (kind === 'solo-next') {
                this.openDraft(true);
                return;
            }
            if (kind === 'duel-next') {
                const loser = this.winner === 1 ? 2 : 1;
                this.openDraft(loser === this.mePlayer);
            }
        },
        openDraft(mine) {
            // Offer was computed in finishFloor (deterministic on both peers).
            this.iAmDrafting = mine;
            this.draftOpen = true;
            if (mine) this.announce('Choose a relic: ' + this.draftOffer.map(k => RELICS[k].name).join(', ') + '.');
        },
        pickDraft(idx) {
            const kind = this.draftOffer[idx];
            if (this.isDuel && this.conn && this.conn.open) {
                this.conn.send({ t: 'draft', idx });
            }
            this.applyDraft(idx, this.mePlayer);
        },
        applyDraft(idx, byPlayer) {
            const kind = this.draftOffer[idx];
            if (!kind) return; // defensive: bad index or no offer
            this.relics[byPlayer][kind] = (this.relics[byPlayer][kind] || 0) + 1;
            if (byPlayer === this.mePlayer) this.relicsCollected++;
            this.sfx('draft');
            this.announce(this.nameOf(byPlayer) + ' took ' + RELICS[kind].name + '.');
            this.draftOpen = false;
            this.floorResult = null; // peer may still be on the floor-result overlay
            this.nextFloor();
        },
        nextFloor() {
            if (this.isDuel) {
                // loser of the previous floor starts the next
                this.starter = this.winner === 1 ? 2 : 1;
                this.floor = Math.min(this.floor + 1, FLOORS.length - 1);
            } else {
                this.floor++;
                this.starter = (this.floor % 2 === 0) ? 1 : 2; // player starts even-index floors
            }
            this.attempt = 0;
            this.setupFloor();
            this.announce(this.floorDef.name + '. ' + (this.turn === this.mePlayer || (!this.isDuel && this.turn === 1) ? 'Your move.' : this.nameOf(this.turn) + ' moves first.'));
        },
        showRunEnd(won) {
            const floors = this.isDuel ? this.crowns[this.mePlayer] : this.floor + (won ? 1 : 0);
            this.runEnd = {
                won,
                title: won
                    ? (this.isDuel ? 'You win the run!' : 'You reached the bottom!')
                    : (this.isDuel ? this.oppName + ' wins the run' : 'The dungeon claims you'),
                sub: won
                    ? (this.isDuel ? 'Four floors, fair and square-ish. The dungeon applauds politely.' : 'Seven floors, one legend. The dungeon will be telling stories about you.')
                    : (this.isDuel ? 'First to four floors, they got there. Demand a rematch.' : 'Dungeon law: one loss ends the run. It was floor ' + (this.floor + 1) + ' that got you.'),
                floors,
                relics: this.relicsCollected,
                moves: this.totalMoves
            };
        },
        abandonRun() {
            if (!this.over && this.moveNum > 0) {
                this.showRunEnd(false);
                this.runEnd.title = 'Run abandoned';
                this.runEnd.sub = 'The dungeon shrugs. It has seen braver.';
                if (this.isDuel && this.conn && this.conn.open) this.conn.send({ t: 'abandon' });
            } else {
                this.backToMenu();
            }
        },

        /* ---------- AI ---------- */
        scheduleAi() {
            this.aiThinking = true;
            const delay = 550 + Math.random() * 650;
            setTimeout(() => {
                if (this.over || this.screen !== 'game' || this.isDuel) { this.aiThinking = false; return; }
                const col = this.aiPick();
                this.aiThinking = false;
                if (col >= 0) this.applyAction({ t: 'move', col }, 2);
            }, delay);
        },
        aiPick() {
            const open = [];
            for (let c = 0; c < this.bw; c++) if (!this.colFull(c)) open.push(c);
            if (!open.length) return -1;
            const g = this.grid();
            // 1. win now
            for (const c of open) if (this.wouldWin(g, c, 2)) return c;
            // 2. block player win
            for (const c of open) if (this.wouldWin(g, c, 1)) return c;
            // 3. negamax
            const depth = this.floorDef.depth;
            let best = -Infinity, bestCols = [];
            const order = open.slice().sort((a, b) => Math.abs(this.bw / 2 - a) - Math.abs(this.bw / 2 - b));
            for (const c of order) {
                this.simDrop(g, c, 2);
                const v = -this.negamax(g, depth - 1, -Infinity, Infinity, 1);
                this.simUndo(g, c);
                if (v > best + 0.001) { best = v; bestCols = [c]; }
                else if (Math.abs(v - best) <= 0.001) bestCols.push(c);
            }
            return bestCols[Math.floor(Math.random() * bestCols.length)];
        },
        simTop(g, c) { let r = 0; while (r < this.bh && g[c][r] !== 0) r++; return r; },
        simDrop(g, c, p) { g[c][this.simTop(g, c)] = p; },
        simUndo(g, c) { let r = this.bh - 1; while (r >= 0 && g[c][r] === 0) r--; if (r >= 0) g[c][r] = 0; },
        wouldWin(g, c, p) {
            const r = this.simTop(g, c);
            if (r >= this.bh) return false;
            g[c][r] = p;
            const win = this.findWin(g, p) !== null;
            g[c][r] = 0;
            return win;
        },
        negamax(g, depth, alpha, beta, p) {
            const opp = p === 1 ? 2 : 1;
            if (this.findWin(g, opp)) return -10000 - depth;
            const open = [];
            for (let c = 0; c < this.bw; c++) if (this.simTop(g, c) < this.bh) open.push(c);
            if (!open.length) return 0;
            if (depth === 0) return this.evalBoard(g, p);
            let best = -Infinity;
            const order = open.slice().sort((a, b) => Math.abs(this.bw / 2 - a) - Math.abs(this.bw / 2 - b));
            for (const c of order) {
                this.simDrop(g, c, p);
                const v = -this.negamax(g, depth - 1, -beta, -alpha, opp);
                this.simUndo(g, c);
                if (v > best) best = v;
                if (best > alpha) alpha = best;
                if (alpha >= beta) break;
            }
            return best;
        },
        evalBoard(g, p) {
            const opp = p === 1 ? 2 : 1;
            const score = (who) => {
                let s = 0;
                const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
                for (let c = 0; c < this.bw; c++) {
                    for (let r = 0; r < this.bh; r++) {
                        for (const [dc, dr] of dirs) {
                            let own = 0, empty = 0, dead = false;
                            for (let k = 0; k < this.need; k++) {
                                const cc = c + dc * k, rr = r + dr * k;
                                if (cc < 0 || cc >= this.bw || rr < 0 || rr >= this.bh) { dead = true; break; }
                                const v = g[cc][rr];
                                if (v === who || v === 3) own++;
                                else if (v === 0) empty++;
                                else { dead = true; break; }
                            }
                            if (!dead && own > 1) s += own * own;
                        }
                    }
                }
                return s;
            };
            return score(p) - score(opp);
        },

        /* ---------- PeerJS duel ---------- */
        startHost() {
            if (!PEER_OK) return;
            this.cleanupPeer();
            this.mode = 'duel';
            this.isHost = true;
            this.mePlayer = 1;
            this.netError = '';
            this.peerId = '';
            this.screen = 'lobby';
            this.peer = new Peer({
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });
            this.peer.on('open', (id) => {
                this.peerId = id;
                try {
                    const url = new URL(window.location);
                    url.searchParams.set('gameId', id);
                    window.history.replaceState({}, document.title, url.toString());
                } catch (e) { /* cosmetic */ }
            });
            this.peer.on('connection', (incoming) => {
                if (this.conn && this.conn.open) { incoming.close(); return; } // one rival at a time
                incoming.on('open', () => {
                    this.conn = incoming;
                    this.wireConnection();
                    this.seed = (Math.random() * 0xFFFFFFFF) >>> 0;
                    this.conn.send({ t: 'setup', seed: this.seed, name: (this.myName || 'Dungeon Keeper').slice(0, 20) });
                });
            });
            this.peer.on('error', (err) => this.netFail(err));
            this.peer.on('disconnected', () => {
                if (this.peer && !this.peer.destroyed) this.peer.reconnect();
            });
        },
        connectToHost() {
            if (!PEER_OK || !this.joinId.trim()) return;
            this.cleanupPeer();
            this.mode = 'duel';
            this.isHost = false;
            this.mePlayer = 2;
            this.netError = '';
            this.connecting = true;
            localStorage.setItem('ddName', this.myName || '');
            this.peer = new Peer({
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });
            const timeout = setTimeout(() => {
                if (this.connecting) this.netFail({ type: 'timeout' });
            }, 25000);
            this.peer.on('open', () => {
                this.conn = this.peer.connect(this.joinId.trim());
                if (!this.conn) { clearTimeout(timeout); this.netFail({ type: 'network' }); return; }
                this.conn.on('open', () => {
                    clearTimeout(timeout);
                    this.connecting = false;
                    this.wireConnection();
                    this.conn.send({ t: 'hello', name: (this.myName || 'The Challenger').slice(0, 20) });
                });
                this.conn.on('error', (err) => { clearTimeout(timeout); this.netFail(err); });
            });
            this.peer.on('error', (err) => { clearTimeout(timeout); this.netFail(err); });
        },
        wireConnection() {
            this.conn.on('data', (data) => {
                if (!data || typeof data.t !== 'string') return;
                this.handleMessage(data);
            });
            this.conn.on('close', () => {
                if (this.screen === 'game' || this.draftOpen || this.floorResult) {
                    this.netError = this.oppName + ' left the dungeon. The run ends here.';
                    this.showRunEnd(true);
                    this.runEnd.title = this.oppName + ' fled!';
                    this.runEnd.sub = 'Your rival disconnected. The dungeon awards you the run by default.';
                } else if (this.screen !== 'menu') {
                    this.netError = 'The connection closed.';
                }
            });
        },
        handleMessage(data) {
            switch (data.t) {
                case 'hello': // host receives joiner's name
                    this.oppName = String(data.name || 'The Challenger').slice(0, 20);
                    localStorage.setItem('ddName', this.myName || '');
                    this.beginRun();
                    break;
                case 'setup': // joiner receives seed + host name
                    this.seed = data.seed >>> 0;
                    this.oppName = String(data.name || 'Dungeon Keeper').slice(0, 20);
                    this.beginRun();
                    break;
                case 'move':
                case 'relic':
                    this.applyAction(data, this.oppPlayer);
                    break;
                case 'draft':
                    this.applyDraft(data.idx, this.oppPlayer);
                    break;
                case 'emote':
                    this.showEmote(String(data.e).slice(0, 4));
                    this.sfx('emote');
                    break;
                case 'rematch': // host offers a new run
                    this.seed = data.seed >>> 0;
                    this.rematchOffered = true;
                    this.announce(this.oppName + ' wants a rematch!');
                    break;
                case 'rematch-accept': // joiner accepted, host starts too
                    this.rematchOffered = false;
                    this.beginRun();
                    break;
                case 'abandon':
                    this.showRunEnd(true);
                    this.runEnd.title = this.oppName + ' fled!';
                    this.runEnd.sub = 'Your rival abandoned the run. The dungeon awards it to you.';
                    break;
            }
        },
        hostRematch() {
            this.seed = (Math.random() * 0xFFFFFFFF) >>> 0;
            this.rematchOffered = true; // reused as "offer sent, waiting" on the host
            if (this.conn && this.conn.open) {
                this.conn.send({ t: 'rematch', seed: this.seed });
            }
        },
        joinerAcceptRematch() {
            this.rematchOffered = false;
            if (this.conn && this.conn.open) this.conn.send({ t: 'rematch-accept' });
            this.beginRun();
        },
        sendEmote(e) {
            if (this.conn && this.conn.open) this.conn.send({ t: 'emote', e });
            this.sfx('emote');
        },
        showEmote(e) {
            this.emoteShown = e;
            if (this.emoteTimer) clearTimeout(this.emoteTimer);
            this.emoteTimer = setTimeout(() => { this.emoteShown = ''; }, 2400);
        },
        copyInvite() {
            const link = this.inviteLink;
            navigator.clipboard.writeText(link).then(() => {
                this.copied = true;
                this.announce('Invite link copied.');
                if (this.copyTimer) clearTimeout(this.copyTimer);
                this.copyTimer = setTimeout(() => { this.copied = false; }, 2000);
            }).catch(() => {
                this.announce('Copy didn’t work, select the link and copy it yourself.');
            });
        },
        netFail(err) {
            this.connecting = false;
            const type = err && err.type;
            if (type === 'peer-unavailable') this.netError = 'No dungeon found at that code, double-check the invite link.';
            else if (type === 'timeout') this.netError = 'Couldn’t reach them, the host may have closed the page.';
            else if (type === 'network') this.netError = 'Network hiccup, check your connection and try again.';
            else this.netError = 'The connection failed. Try again in a moment.';
            this.announce(this.netError);
        },
        cleanupPeer() {
            if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
            if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
        },
        backToMenu() {
            this.cleanupPeer();
            localStorage.setItem('ddName', this.myName || '');
            this.screen = 'menu';
            this.runEnd = null;
            this.floorResult = null;
            this.draftOpen = false;
            this.netError = '';
            this.connecting = false;
            this.rematchOffered = false;
            this.mode = 'solo';
            this.mePlayer = 1;
            try {
                const url = new URL(window.location);
                url.searchParams.delete('gameId');
                window.history.replaceState({}, document.title, url.toString());
            } catch (e) { /* cosmetic */ }
        }
    }
}).mount('#app');
