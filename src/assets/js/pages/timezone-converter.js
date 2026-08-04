if (typeof Vue === 'undefined' || typeof luxon === 'undefined') {
    document.getElementById('load-fallback').hidden = false;
    throw new Error('Vue or luxon failed to load');
}
const { createApp } = Vue;
const { DateTime } = luxon;

const CITIES = [
    { name: 'New York', zone: 'America/New_York' },
    { name: 'Los Angeles', zone: 'America/Los_Angeles' },
    { name: 'Toronto', zone: 'America/Toronto' },
    { name: 'São Paulo', zone: 'America/Sao_Paulo' },
    { name: 'London', zone: 'Europe/London' },
    { name: 'Paris', zone: 'Europe/Paris' },
    { name: 'Berlin', zone: 'Europe/Berlin' },
    { name: 'Dubai', zone: 'Asia/Dubai' },
    { name: 'Mumbai', zone: 'Asia/Kolkata' },
    { name: 'Singapore', zone: 'Asia/Singapore' },
    { name: 'Tokyo', zone: 'Asia/Tokyo' },
    { name: 'Sydney', zone: 'Australia/Sydney' }
];

function detectZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (e) {
        return 'UTC';
    }
}

function listZones() {
    let zones;
    try {
        zones = Intl.supportedValuesOf('timeZone').slice();
    } catch (e) {
        zones = [];
    }
    // Some ICU builds enumerate old aliases (Asia/Calcutta) but not the
    // modern name the chips use (Asia/Kolkata), and vice versa. Make sure
    // every zone the page itself offers is actually in the list.
    const required = CITIES.map(c => c.zone).concat([detectZone(), 'UTC']);
    for (const z of required) {
        if (!zones.includes(z)) zones.push(z);
    }
    return zones.sort();
}

createApp({
    data() {
        return {
            now: DateTime.now(),
            detectedZone: detectZone(),
            fromZone: detectZone(),
            toZone: 'Asia/Tokyo',
            showFromPicker: false,
            planOpen: false,
            planDate: '',
            planTime: '',
            anchor: 'mine',
            copied: false,
            copyFailed: false,
            copyTimer: null,
            tickTimeout: null,
            tickInterval: null,
            announcement: '',
            cities: CITIES,
            allZones: listZones()
        };
    },
    computed: {
        zoneGroups() {
            // No 'Popular' group here, the chips are the popular picker, and
            // duplicate <option> values make Vue's v-model display the first
            // match ('Mumbai') instead of the one the user clicked ('Kolkata').
            const groups = {};
            for (const z of this.allZones) {
                const slash = z.indexOf('/');
                const region = slash === -1 ? 'Other' : z.slice(0, slash);
                const label = ['America', 'Europe', 'Asia', 'Africa', 'Australia', 'Pacific', 'Atlantic', 'Indian', 'Antarctica', 'Arctic'].includes(region) ? region : 'Other';
                if (!groups[label]) groups[label] = [];
                groups[label].push({ value: z, label: this.prettyZone(z) });
            }
            const order = ['America', 'Europe', 'Asia', 'Africa', 'Australia', 'Pacific', 'Atlantic', 'Indian', 'Antarctica', 'Arctic', 'Other'];
            return order.filter(l => groups[l]).map(l => ({ label: l, items: groups[l] }));
        },
        myNow() { return this.now.setZone(this.fromZone); },

        /* The instant being displayed: live now, or the pinned plan time. */
        pinnedDT() {
            if (!this.planOpen || !this.planDate || !this.planTime) return null;
            const zone = this.anchor === 'mine' ? this.fromZone : this.toZone;
            const dt = DateTime.fromISO(this.planDate + 'T' + this.planTime, { zone });
            return dt.isValid ? dt : null;
        },
        pinned() { return this.pinnedDT !== null; },
        baseInstant() { return this.pinned ? this.pinnedDT : this.now; },
        myDT() { return this.baseInstant.setZone(this.fromZone); },
        theirDT() { return this.baseInstant.setZone(this.toZone); },
        isNightThere() {
            const h = this.theirDT.hour;
            return h >= 21 || h < 7;
        },
        dayDelta() {
            // setUTCFullYear (not Date.UTC) so years 0-99 aren't remapped to 19xx.
            const utcDay = (dt) => { const d = new Date(0); d.setUTCFullYear(dt.year, dt.month - 1, dt.day); return d.getTime(); };
            return Math.round((utcDay(this.theirDT) - utcDay(this.myDT)) / 864e5);
        },
        diffText() {
            // Round: pre-1900s zones used local mean time with fractional
            // minute offsets (Paris 9.35), nobody needs the seconds.
            const mins = Math.round(this.theirDT.offset - this.myDT.offset);
            if (mins === 0) return 'the same time as you, no maths needed';
            const abs = Math.abs(mins);
            const h = Math.trunc(abs / 60);
            const m = abs % 60;
            const dir = mins > 0 ? 'ahead of you' : 'behind you';
            const frac = { 15: '¼', 30: '½', 45: '¾' }[m];
            let amount;
            if (m === 0) {
                amount = h + (h === 1 ? ' hour' : ' hours');
            } else if (frac) {
                amount = (h > 0 ? h + frac : frac) + ' hours';
            } else {
                amount = h > 0 ? h + ' hr ' + m + ' min' : m + ' min';
            }
            return amount + ' ' + dir;
        },
        dayClause() {
            const d = this.dayDelta;
            if (d === 0) return '';
            const wd = this.fmtWeekday(this.theirDT);
            if (d === 1) return ' It’s already ' + wd + ' for them.';
            if (d === -1) return ' It’s still ' + wd + ' for them.';
            if (d > 1) return ' They’re ' + d + ' days ahead, ' + wd + ' for them.';
            return ' They’re ' + Math.abs(d) + ' days back, ' + wd + ' for them.';
        },
        sentenceHtml() {
            const esc = (s) => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
            const theirTime = esc(this.fmtTime(this.theirDT));
            const theirCity = esc(this.cityName(this.toZone));
            const myCity = esc(this.cityName(this.fromZone));
            const diff = esc(this.diffText);
            const day = esc(this.dayClause);
            if (!this.pinned) {
                return 'It’s <strong>' + theirTime + '</strong> in ' + theirCity + ', ' + diff + '.' + day;
            }
            const myTime = esc(this.fmtTime(this.myDT));
            const myDay = esc(this.fmtWeekday(this.myDT));
            const theirDay = esc(this.fmtWeekday(this.theirDT));
            if (this.anchor === 'mine') {
                return 'When it’s <strong>' + myTime + '</strong> on ' + myDay + ' for you in ' + myCity +
                       ', it’s <strong>' + theirTime + '</strong> in ' + theirCity + ', ' + diff + '.' + day;
            }
            let myDayClause = '';
            if (this.dayDelta === 1) myDayClause = ' It’s still ' + myDay + ' for you.';
            else if (this.dayDelta === -1) myDayClause = ' It’s already ' + myDay + ' for you.';
            return 'When it’s <strong>' + theirTime + '</strong> on ' + theirDay + ' for them in ' + theirCity +
                   ', it’s <strong>' + myTime + '</strong> for you in ' + myCity + ', they’re ' + diff + '.' + myDayClause;
        },
        sentencePlain() {
            const div = this.sentenceHtml.replace(/<[^>]+>/g, '');
            const txt = document.createElement('textarea');
            txt.innerHTML = div;
            return txt.value;
        },
        statusText() {
            const h = this.theirDT.hour;
            const weekend = this.theirDT.weekday >= 6;
            if (h >= 23 || h < 6) return 'The middle of the night there, they’re almost certainly asleep.';
            if (h >= 6 && h < 7) return 'Very early there, maybe give it an hour.';
            if (h >= 7 && h < 9) return 'Early morning there, coffee hours.';
            if (h >= 9 && h < 17) {
                return weekend
                    ? 'Daytime on their weekend, fine for friends, maybe not for work.'
                    : 'The middle of their workday, a good time to call.';
            }
            if (h >= 17 && h < 21) return 'Evening there, fine for friends and family.';
            return 'Late evening there, they’re probably winding down.';
        },
        zoneMeta() {
            const dt = this.theirDT;
            return this.cityName(this.toZone) + ' · UTC' + dt.toFormat('Z') + ' · ' + dt.toFormat('ZZZZZ');
        },
        gapNote() {
            if (!this.planOpen || !this.planDate || !this.planTime || !this.pinnedDT) return '';
            const zone = this.anchor === 'mine' ? this.fromZone : this.toZone;
            // Whole-day skip (e.g. Samoa jumped over 30 Dec 2011 entirely).
            if (this.pinnedDT.toFormat('yyyy-MM-dd') !== this.planDate) {
                return 'Heads up: that date was skipped in ' + this.cityName(zone) +
                       ', the calendar jumped straight past it, so we used ' +
                       this.pinnedDT.toLocaleString(DateTime.DATE_MED) + ' instead.';
            }
            const typed = this.planTime.split(':');
            const typedMins = Number(typed[0]) * 60 + Number(typed[1]);
            const gotMins = this.pinnedDT.hour * 60 + this.pinnedDT.minute;
            if (typedMins === gotMins) return '';
            const typedDT = DateTime.fromISO('2000-01-01T' + this.planTime);
            const typedLabel = typedDT.isValid ? this.fmtTime(typedDT) : this.planTime;
            return 'Heads up: ' + typedLabel + ' doesn’t exist in ' + this.cityName(zone) +
                   ' that night, the clocks jump forward, so we used ' + this.fmtTime(this.pinnedDT) + ' instead.';
        }
    },
    mounted() {
        if (this.fromZone === this.toZone) {
            this.toZone = this.fromZone === 'Asia/Tokyo' ? 'America/New_York' : 'Asia/Tokyo';
        }
        this.startTicking();
        document.addEventListener('visibilitychange', this.onVisibility);
    },
    beforeUnmount() {
        this.stopTicking();
        document.removeEventListener('visibilitychange', this.onVisibility);
    },
    methods: {
        fmtTime(dt) { return dt.toLocaleString(DateTime.TIME_SIMPLE); },
        fmtWeekday(dt) { return dt.toLocaleString({ weekday: 'long' }); },
        zoneNowISO(zone) { return this.now.setZone(zone).toISO(); },
        cityName(zone) {
            const c = CITIES.find(x => x.zone === zone);
            if (c) return c.name;
            const last = zone.split('/').pop() || zone;
            return last.replace(/_/g, ' ');
        },
        prettyZone(zone) {
            const parts = zone.split('/');
            return parts.slice(1).join(' / ').replace(/_/g, ' ') || zone;
        },
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },
        announcePick() {
            this.announce('In ' + this.cityName(this.toZone) + ' it’s ' + this.fmtTime(this.theirDT) +
                          ' on ' + this.fmtWeekday(this.theirDT) + ', ' + this.diffText + '. ' + this.statusText);
        },
        announceAnchor() {
            this.announce(this.anchor === 'mine'
                ? 'Times you type now mean your local time.'
                : 'Times you type now mean the local time in ' + this.cityName(this.toZone) + '.');
        },
        onPlanToggle(e) {
            if (e.target.open === this.planOpen) return; // programmatic no-op toggle
            this.planOpen = e.target.open;
            if (this.planOpen && (!this.planDate || !this.planTime)) {
                // Prefill with the anchor zone's current wall clock, never
                // the user's wall clock parsed as another zone's time.
                const zone = this.anchor === 'mine' ? this.fromZone : this.toZone;
                const nowThere = DateTime.now().setZone(zone);
                this.planDate = nowThere.toFormat('yyyy-MM-dd');
                this.planTime = nowThere.toFormat('HH:mm');
            }
            if (!this.planOpen) this.announce('Showing the time right now.');
        },
        backToNow() {
            this.planDate = '';
            this.planTime = '';
            if (this.$refs.plan) this.$refs.plan.open = false;
            this.planOpen = false;
            this.announce('Showing the time right now.');
        },
        startTicking() {
            this.stopTicking(); // never stack timers (background-tab load + visibilitychange)
            this.now = DateTime.now();
            const msToMinute = 60000 - (Date.now() % 60000);
            this.tickTimeout = setTimeout(() => {
                this.now = DateTime.now();
                this.tickInterval = setInterval(() => { this.now = DateTime.now(); }, 60000);
            }, msToMinute);
        },
        stopTicking() {
            if (this.tickTimeout) clearTimeout(this.tickTimeout);
            if (this.tickInterval) clearInterval(this.tickInterval);
            this.tickTimeout = null;
            this.tickInterval = null;
        },
        onVisibility() {
            if (document.hidden) {
                this.stopTicking();
            } else {
                this.startTicking();
            }
        },
        markCopied() {
            this.copied = true;
            this.copyFailed = false;
            this.announce('Copied to clipboard.');
            if (this.copyTimer) clearTimeout(this.copyTimer);
            this.copyTimer = setTimeout(() => { this.copied = false; }, 2000);
        },
        async copyLine() {
            const text = this.sentencePlain;
            try {
                await Promise.race([
                    navigator.clipboard.writeText(text),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
                ]);
                this.markCopied();
            } catch (e) {
                this.copyFailed = true;
                this.announce('Copy didn’t work. Select the sentence and copy it yourself.');
            }
        }
    }
}).mount('#app');
