if (typeof Vue === 'undefined') {
    document.getElementById('load-fallback').hidden = false;
    throw new Error('Vue failed to load');
}
const { createApp } = Vue;

/* =====================================================================
   Basic strategy, 4–8 decks, dealer STANDS on soft 17, double after
   split allowed, late surrender optional. One source of truth: these
   functions grade the drill AND render the chart.
   d = dealer up-card value 2..10, 11 for ace.
===================================================================== */
function hardCode(t, d) {
    if (t >= 17) return 'S';
    if (t >= 13) return d <= 6 ? 'S' : 'H';
    if (t === 12) return (d >= 4 && d <= 6) ? 'S' : 'H';
    if (t === 11) return d <= 10 ? 'D' : 'H';
    if (t === 10) return d <= 9 ? 'D' : 'H';
    if (t === 9) return (d >= 3 && d <= 6) ? 'D' : 'H';
    return 'H';
}
function softCode(t, d) { // t = ace-as-11 total, 13..20
    if (t >= 19) return 'S';
    if (t === 18) {
        if (d >= 3 && d <= 6) return 'Ds';
        if (d === 2 || d === 7 || d === 8) return 'S';
        return 'H';
    }
    if (t === 17) return (d >= 3 && d <= 6) ? 'D' : 'H';
    if (t >= 15) return (d >= 4 && d <= 6) ? 'D' : 'H';
    return (d === 5 || d === 6) ? 'D' : 'H';
}
function pairCode(v, d) { // v = value of each card, 2..10, 11 for A,A
    if (v === 11 || v === 8) return 'P';
    if (v === 10) return 'S';
    if (v === 9) return (d === 7 || d >= 10) ? 'S' : 'P';
    if (v === 7) return d <= 7 ? 'P' : 'H';
    if (v === 6) return d <= 6 ? 'P' : 'H';
    if (v === 5) return hardCode(10, d);
    if (v === 4) return (d === 5 || d === 6) ? 'P' : 'H';
    return d <= 7 ? 'P' : 'H'; // 2,2 and 3,3
}
// Late surrender (S17): hard 16 (but not 8,8) vs 9/10/A; hard 15 vs 10.
function shouldSurrender(isPair, pairV, hardT, isSoft, d) {
    if (isSoft) return false;
    if (isPair && pairV === 8) return false;
    if (hardT === 16 && d >= 9) return true;
    if (hardT === 15 && d === 10) return true;
    return false;
}

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];
const BUST = { 2: 35, 3: 38, 4: 40, 5: 43, 6: 42, 7: 26, 8: 24, 9: 23, 10: 21, 11: 12 };
const PRAISE = ['By the book.', 'Textbook.', 'The pit boss is nervous.', 'Cold-blooded. Correct.', 'That’s the play.', 'Dealer hates to see it.'];

function rankValue(r) {
    if (r === 'A') return 11;
    if (r === 'J' || r === 'Q' || r === 'K') return 10;
    return Number(r);
}
function draw(exceptAce) {
    let r;
    do { r = RANKS[Math.floor(Math.random() * RANKS.length)]; } while (exceptAce && r === 'A');
    return { r, s: SUITS[Math.floor(Math.random() * SUITS.length)] };
}

createApp({
    data() {
        let stats;
        try { stats = JSON.parse(localStorage.getItem('bjTrainer')) || null; } catch (e) { stats = null; }
        if (!stats || typeof stats.t !== 'number') {
            stats = { t: 0, c: 0, streak: 0, best: 0,
                      kinds: { hard: { t: 0, c: 0 }, soft: { t: 0, c: 0 }, pair: { t: 0, c: 0 } },
                      misses: {} };
        }
        return {
            DEALERS: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            HARD_ROWS: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            SOFT_ROWS: [13, 14, 15, 16, 17, 18, 19, 20],
            PAIR_ROWS: [2, 3, 4, 6, 7, 8, 9, 10, 11],
            FOCUSES: [
                { key: 'all', name: 'Everything' },
                { key: 'hard', name: 'Hard totals' },
                { key: 'soft', name: 'Soft totals' },
                { key: 'pair', name: 'Pairs' }
            ],
            KINDS: [
                { key: 'hard', name: 'Hard totals' },
                { key: 'soft', name: 'Soft totals' },
                { key: 'pair', name: 'Pairs' }
            ],
            BUST,
            view: 'play',
            focus: localStorage.getItem('bjFocus') || 'all',
            surrenderAllowed: localStorage.getItem('bjSurr') !== '0',
            p1: { r: 'A', s: '♠' }, p2: { r: 'K', s: '♥' }, up: { r: '6', s: '♦' },
            phase: 'decide',
            dealAnim: true,
            lastResult: null,
            feedbackPraise: PRAISE[0],
            hot: null,           // {tbl, row, col}, highlighted chart cell
            stats,
            resetArmed: false,
            resetTimer: null,
            announcement: '',
            muted: localStorage.getItem('bjMuted') === '1',
            audioCtx: null
        };
    },
    computed: {
        isPair() { return rankValue(this.p1.r) === rankValue(this.p2.r); },
        isSoft() { return !this.isPair && (this.p1.r === 'A' || this.p2.r === 'A'); },
        handTotal() {
            let t = rankValue(this.p1.r) + rankValue(this.p2.r);
            if (t > 21) t -= 10; // two aces handled as pair anyway
            return t;
        },
        handLabel() {
            if (this.isPair) return this.p1.r === 'A' ? 'A pair of aces' : 'A pair of ' + this.p1.r + 's';
            if (this.isSoft) return 'Soft ' + this.handTotal;
            return 'Hard ' + this.handTotal;
        },
        upValue() { return rankValue(this.up.r); },
        upLabel() { return this.up.r === 'A' ? 'ace' : (rankValue(this.up.r) === 10 ? this.up.r + ' (10)' : this.up.r); },
        bestAction() {
            const d = this.upValue;
            const pairV = rankValue(this.p1.r);
            if (this.surrenderAllowed && shouldSurrender(this.isPair, pairV, this.handTotal, this.isSoft, d)) {
                return 'surrender';
            }
            let code;
            if (this.isPair) {
                code = pairCode(pairV, d);
                if (code === 'P') return 'split';
            } else if (this.isSoft) {
                code = softCode(this.handTotal, d);
            } else {
                code = hardCode(this.handTotal, d);
            }
            if (!code) code = this.isSoft ? softCode(this.handTotal, d) : hardCode(this.handTotal, d);
            if (code === 'D' || code === 'Ds') return 'double';
            if (code === 'S') return 'stand';
            return 'hit';
        },
        accuracy() { return this.stats.t === 0 ? 0 : Math.round(100 * this.stats.c / this.stats.t); },
        missList() {
            return Object.entries(this.stats.misses)
                .map(([key, v]) => ({ key, count: v.count, best: v.best }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 6);
        }
    },
    watch: {
        focus(v) { localStorage.setItem('bjFocus', v); if (this.phase === 'decide') this.deal(); },
        surrenderAllowed(v) { localStorage.setItem('bjSurr', v ? '1' : '0'); }
    },
    mounted() {
        this.deal();
        window.addEventListener('keydown', this.onKey);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.onKey);
    },
    methods: {
        /* ---------- deck + dealing ---------- */
        isRed(s) { return s === '♥' || s === '♦'; },
        cardName(c) {
            const names = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
            const suits = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
            return (names[c.r] || c.r) + ' of ' + suits[c.s];
        },
        deal() {
            let kind = this.focus;
            if (kind === 'all') {
                const roll = Math.random();
                kind = roll < 0.45 ? 'hard' : roll < 0.7 ? 'soft' : 'pair';
            }
            if (kind === 'pair') {
                const c = draw(false);
                let s2;
                do { s2 = SUITS[Math.floor(Math.random() * SUITS.length)]; } while (s2 === c.s);
                this.p1 = c;
                this.p2 = { r: c.r, s: s2 };
            } else if (kind === 'soft') {
                const other = draw(true);
                // keep soft totals interesting: 2-9 kicker
                while (rankValue(other.r) === 10) { const n = draw(true); other.r = n.r; other.s = n.s; }
                if (Math.random() < 0.5) { this.p1 = { r: 'A', s: SUITS[Math.floor(Math.random() * 4)] }; this.p2 = other; }
                else { this.p2 = { r: 'A', s: SUITS[Math.floor(Math.random() * 4)] }; this.p1 = other; }
            } else {
                // hard: no aces, not a pair
                let a = draw(true), b = draw(true);
                while (rankValue(a.r) === rankValue(b.r)) b = draw(true);
                this.p1 = a; this.p2 = b;
            }
            this.up = draw(false);
            this.phase = 'decide';
            this.lastResult = null;
            this.dealAnim = false;
            requestAnimationFrame(() => { this.dealAnim = true; });
            this.sfx('deal');
        },
        nextHand() {
            this.deal();
            this.announce('New hand: ' + this.handLabel + ' against dealer ' + this.upLabel + '.');
        },
        onKey(e) {
            if (this.view !== 'play') return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if (this.phase === 'decide') {
                if (k === 'h') this.answer('hit');
                else if (k === 's') this.answer('stand');
                else if (k === 'd') this.answer('double');
                else if (k === 'p' && this.isPair) this.answer('split');
                else if (k === 'u' && this.surrenderAllowed) this.answer('surrender');
            } else if (k === 'n' || k === 'enter') {
                this.nextHand();
            }
        },

        /* ---------- grading ---------- */
        actionName(a) {
            return { hit: 'Hit', stand: 'Stand', double: 'Double down', split: 'Split', surrender: 'Surrender' }[a];
        },
        scenarioKey() {
            if (this.isPair) return (this.p1.r === 'A' ? 'A,A' : this.p1.r + ',' + this.p1.r) + ' vs ' + (this.up.r === 'A' ? 'A' : (this.upValue === 10 ? '10' : this.up.r));
            const d = this.up.r === 'A' ? 'A' : (this.upValue === 10 ? '10' : this.up.r);
            return (this.isSoft ? 'Soft ' : 'Hard ') + this.handTotal + ' vs ' + d;
        },
        kindKey() { return this.isPair ? 'pair' : (this.isSoft ? 'soft' : 'hard'); },
        answer(chosen) {
            if (this.phase !== 'decide') return;
            const best = this.bestAction;
            const correct = chosen === best;
            const why = this.explain(best);
            this.lastResult = { correct, best, chosen, why };
            this.feedbackPraise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
            this.phase = 'feedback';

            // stats
            const kk = this.kindKey();
            this.stats.t++; this.stats.kinds[kk].t++;
            if (correct) {
                this.stats.c++; this.stats.kinds[kk].c++;
                this.stats.streak++;
                if (this.stats.streak > this.stats.best) this.stats.best = this.stats.streak;
            } else {
                this.stats.streak = 0;
                const key = this.scenarioKey();
                if (!this.stats.misses[key]) this.stats.misses[key] = { count: 0, best: this.actionName(best).toLowerCase() };
                this.stats.misses[key].count++;
            }
            try { localStorage.setItem('bjTrainer', JSON.stringify(this.stats)); } catch (e) { /* private mode */ }

            this.sfx(correct ? 'good' : 'bad');
            const plain = this.lastResult.why.replace(/<[^>]+>/g, '');
            this.announce((correct ? 'Correct. ' : 'Not quite, the book says ' + this.actionName(best).toLowerCase() + '. ') + plain);
        },

        /* ---------- explanations ---------- */
        explain(best) {
            const d = this.upValue;
            const dName = this.up.r === 'A' ? 'an ace' : 'a ' + (d === 10 ? this.up.r + ' (worth 10)' : this.up.r);
            const bust = BUST[d];
            const t = this.handTotal;
            const b = (s) => '<strong>' + s + '</strong>';

            if (best === 'surrender') {
                return 'Hard ' + t + ' against ' + dName + ' is one of the worst spots in blackjack, you win barely one hand in four. ' +
                       b('Giving up half the bet loses less than playing it out.') + ' No surrender at the table? Hit instead.';
            }
            if (best === 'split') {
                const v = rankValue(this.p1.r);
                if (v === 11) return 'Two aces is a lousy 2 or 12, but split them and you have ' + b('two hands that each start with 11') + ', the best card in the game. Always split aces.';
                if (v === 8) return 'Sixteen is the worst total there is. Split the 8s and you have ' + b('two decent starts instead of one disaster') + '. Always split eights, yes, even against a ten.';
                if (v === 9) return 'Eighteen is good, but against ' + dName + ' it isn’t good enough to sit on, ' + b('two hands of 9 earn more') + ' with the dealer in trouble.';
                if (v === 4) return 'Only correct because you can double after splitting: against ' + dName + ', the weakest cards in the deck, ' + b('two hands starting from 4 print money') + '.';
                return 'One weak hand becomes ' + b('two hands against a dealer in trouble') + ', ' + dName + ' busts about ' + bust + '% of the time.';
            }
            if (best === 'double') {
                if (this.isSoft) return 'Soft ' + t + ' can’t bust with one card, and ' + dName + ' busts about ' + bust + '% of the time. ' + b('Push more money out while you’re safe and they’re not.');
                if (t === 11 || t === 10 || (this.isPair && rankValue(this.p1.r) === 5)) return 'With ' + b((this.isPair ? '10' : t) + ' in hand, one ten makes you a monster') + ', and the deck is a third tens. You’re the favorite: get more money on the table.';
                return 'A 9 against ' + dName + ' has you ahead, ' + b('one good card and the hand is yours') + '. Double while the odds lean your way.';
            }
            if (best === 'stand') {
                if (this.isPair && rankValue(this.p1.r) === 10) return 'Twenty. ' + b('Never split tens') + ', greed turns one winning hand into two coin flips.';
                if (this.isPair && rankValue(this.p1.r) === 9 && (d === 7 || d >= 10)) return 'Against a 7 your 18 already beats the dealer’s most likely 17, and against ' + dName + ', splitting nines just doubles your trouble. ' + b('Stand.');
                if (this.isSoft) return 'Soft ' + t + ' is already a made hand. ' + b('Nineteen and twenty don’t get improved, they get protected.');
                if (t >= 17) return 'Hard ' + t + ' busts far too often to touch. ' + b('Stand on hard 17 or better, always.');
                return 'The dealer’s ' + dName.replace('a ', '').replace('an ', '') + ' is in the bust zone, they break about ' + b(bust + '% of the time') + '. Don’t risk busting first; stand back and let them.';
            }
            // hit
            if (t <= 8 && !this.isSoft) return 'You can’t bust, this card is free. ' + b('Always hit 8 or less.');
            if (this.isSoft) return 'Soft ' + t + ' is weaker than it looks, and you ' + b('can’t bust a soft hand') + ', take the card and try to improve.';
            if (t === 12 && (d === 2 || d === 3)) return 'The exception to the bust-zone rule: ' + dName + ' breaks less often than the middle cards, and only a ten busts your 12. ' + b('Take one.');
            if (t >= 12 && d >= 7) return 'With ' + dName + ' showing, the dealer finishes on 17+ far more often than they bust (' + bust + '%). ' + b('Your ' + t + ' can’t win by standing, you have to improve it.');
            return 'Doubling would lock you into one card against ' + dName + ', too strong an up-card for that. ' + b('Just hit.');
        },

        /* ---------- chart ---------- */
        dLabel(d) { return d === 11 ? 'A' : d; },
        pairLabel(v) { return v === 11 ? 'A + A' : v + ' + ' + v; },
        chartCode(tbl, row, d) {
            if (tbl === 'hard') {
                if (this.surrChart(row, d)) return 'Su';
                return hardCode(row, d);
            }
            if (tbl === 'soft') return softCode(row, d);
            return pairCode(row, d);
        },
        surrChart(t, d) { return (t === 16 && d >= 9) || (t === 15 && d === 10); },
        cellId(tbl, row, d) { return 'cell-' + tbl + '-' + row + '-' + d; },
        isHot(tbl, row, d) {
            return this.hot && this.hot.tbl === tbl && this.hot.row === row && this.hot.col === d;
        },
        showOnChart() {
            const d = this.upValue;
            let tbl, row;
            if (this.isPair) { tbl = 'pair'; row = rankValue(this.p1.r); }
            else if (this.isSoft) { tbl = 'soft'; row = this.handTotal; }
            else { tbl = 'hard'; row = Math.min(Math.max(this.handTotal, 8), 17); }
            this.hot = { tbl, row, col: d };
            this.view = 'chart';
            this.$nextTick(() => {
                const el = document.getElementById(this.cellId(tbl, row, d));
                if (el) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
            });
        },

        /* ---------- stats ---------- */
        kindPct(k) {
            const s = this.stats.kinds[k];
            return s.t === 0 ? 0 : Math.round(100 * s.c / s.t);
        },
        armReset() {
            this.resetArmed = true;
            if (this.resetTimer) clearTimeout(this.resetTimer);
            this.resetTimer = setTimeout(() => { this.resetArmed = false; }, 5000);
        },
        doReset() {
            this.resetArmed = false;
            if (this.resetTimer) clearTimeout(this.resetTimer);
            this.stats = { t: 0, c: 0, streak: 0, best: 0,
                           kinds: { hard: { t: 0, c: 0 }, soft: { t: 0, c: 0 }, pair: { t: 0, c: 0 } },
                           misses: {} };
            try { localStorage.setItem('bjTrainer', JSON.stringify(this.stats)); } catch (e) {}
            this.announce('Stats wiped. Fresh shoe.');
        },

        /* ---------- misc ---------- */
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },
        toggleMute() {
            this.muted = !this.muted;
            localStorage.setItem('bjMuted', this.muted ? '1' : '0');
        },
        sfx(kind) {
            if (this.muted) return;
            try {
                if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const ctx = this.audioCtx;
                if (ctx.state === 'suspended') ctx.resume();
                const t = ctx.currentTime;
                const play = (freq, start, dur, type, vol) => {
                    const o = ctx.createOscillator(), g = ctx.createGain();
                    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t + start);
                    g.gain.setValueAtTime(vol || 0.1, t + start);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
                    o.connect(g).connect(ctx.destination);
                    o.start(t + start); o.stop(t + start + dur + 0.02);
                };
                if (kind === 'deal') { play(1400, 0, 0.03, 'triangle', 0.05); play(900, 0.05, 0.04, 'triangle', 0.05); }
                else if (kind === 'good') { play(660, 0, 0.1); play(880, 0.09, 0.18); }
                else if (kind === 'bad') { play(220, 0, 0.16, 'triangle', 0.12); play(165, 0.13, 0.24, 'triangle', 0.1); }
            } catch (e) { /* audio is garnish */ }
        }
    }
}).mount('#app');
