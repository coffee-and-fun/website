(function () {
    'use strict';

    var DEFAULT_TITLE = document.title;
    var MODES = {
        focus: { label: 'Focus', color: '#c2255c', msg: 'Time to focus!', readySub: 'Press start when you’re ready' },
        short: { label: 'Short Break', color: '#10808a', msg: 'Time for a break!', readySub: 'Stand up, stretch, look out a window' },
        long:  { label: 'Long Break', color: '#5133ad', msg: 'Time for a long break!', readySub: 'Properly step away, you did the work' }
    };
    var STORE_KEY = 'cfFocusTimer';
    var INTENT_KEY = 'cfFocusIntention';

    /* ---------- state ---------- */
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) {}
    if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) saved = {};
    var clampNum = function (v, lo, hi, dflt) { if (String(v).trim() === '') return dflt; v = Math.round(Number(v)); return isNaN(v) ? dflt : Math.min(hi, Math.max(lo, v)); };

    var s = {
        mode: 'focus',
        focusMin: clampNum(saved.focusMin, 1, 90, 25),
        shortMin: clampNum(saved.shortMin, 1, 30, 5),
        longMin: clampNum(saved.longMin, 1, 60, 15),
        longEvery: clampNum(saved.longEvery, 2, 8, 4),
        autoStartBreaks: !!saved.autoStartBreaks,
        autoStartFocus: !!saved.autoStartFocus,
        soundOn: saved.soundOn !== false,
        keysOn: saved.keysOn !== false,
        notifyOn: false,
        running: false,
        started: false,
        remaining: 0,
        sessionTotal: 0,
        endAt: 0,
        ticker: null,
        cycleCount: 0,
        celebrate: null,
        audioCtx: null
    };
    s.remaining = s.sessionTotal = s.focusMin * 60;

    /* ---------- elements ---------- */
    var $ = function (id) { return document.getElementById(id); };
    var els = {
        appRoot: $('app-root'), topProgress: $('top-progress'), barFill: $('bar-fill'),
        digits: $('digits'), startBtn: $('start-btn'),
        sprintCount: $('sprint-count'), sessionMsg: $('session-msg'), sessionSub: $('session-sub'),
        beansCaption: $('beans-caption'),
        announce: $('announce'), presetsBlock: $('presets-block'),
        intention: $('intention'), oneThing: $('one-thing'), clearIntention: $('clear-intention'),
        dialog: $('settings-dialog'), notifyBlocked: $('notify-blocked'),
        soundBtn: $('sound-btn'), soundLabel: $('sound-label'),
        themeMeta: $('theme-color-meta')
    };
    var presetBtns = Array.prototype.slice.call(document.querySelectorAll('.preset-btn'));

    /* ---------- helpers ---------- */
    function modeMinutes() { return s.mode === 'focus' ? s.focusMin : s.mode === 'short' ? s.shortMin : s.longMin; }
    function totalSeconds() { return Math.max(1, modeMinutes() * 60); }
    function fmt(sec) {
        sec = Math.max(0, Math.ceil(sec));
        return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
    }
    function clockTime(ms) {
        try { return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
        catch (e) { return ''; }
    }
    function announce(msg) {
        els.announce.textContent = '';
        window.setTimeout(function () { els.announce.textContent = msg; }, 50);
    }
    function persist() {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify({
                focusMin: s.focusMin, shortMin: s.shortMin, longMin: s.longMin, longEvery: s.longEvery,
                autoStartBreaks: s.autoStartBreaks, autoStartFocus: s.autoStartFocus,
                soundOn: s.soundOn, keysOn: s.keysOn, notifyOn: s.notifyOn
            }));
        } catch (e) {}
    }

    /* ---------- rendering ---------- */
    function sessionProgress() {
        var t = s.sessionTotal || totalSeconds();
        return Math.min(1, Math.max(0, 1 - s.remaining / t));
    }
    function render() {
        var m = MODES[s.mode];
        els.appRoot.className = 'app theme-' + s.mode;
        document.documentElement.style.background = m.color;
        if (els.themeMeta) els.themeMeta.setAttribute('content', m.color);
        var pct = (sessionProgress() * 100).toFixed(1) + '%';
        els.topProgress.style.width = pct;
        els.barFill.style.width = pct;

        els.digits.textContent = fmt(s.remaining);
        els.digits.setAttribute('aria-label', fmt(s.remaining) + ' remaining, ' + m.label);

        // "#N", which focus sprint of the round you're on
        var sprintNo = s.mode === 'focus' ? s.cycleCount + 1 : Math.max(1, s.cycleCount);
        els.sprintCount.textContent = '#' + sprintNo;
        var msg = m.msg;
        if (s.celebrate && s.mode !== 'focus') {
            msg = s.celebrate.type === 'round'
                ? 'Round complete, ' + s.celebrate.n + ' sprints! \uD83C\uDFC6'
                : 'Sprint ' + s.celebrate.n + ' done, nice work! \uD83C\uDF89';
        }
        if (els.sessionMsg.textContent !== msg) {
            els.sessionMsg.textContent = msg;
            els.sessionMsg.classList.remove('msg-pop');
            void els.sessionMsg.offsetWidth; // restart the animation
            els.sessionMsg.classList.add('msg-pop');
        }

        if (s.running) {
            els.sessionSub.textContent = 'Done around ' + clockTime(s.endAt);
        } else if (s.started) {
            els.sessionSub.textContent = 'Paused, about ' + Math.max(1, Math.ceil(s.remaining / 60)) + ' min left';
        } else {
            els.sessionSub.textContent = m.readySub;
        }

        var doneCount = Math.min(s.cycleCount, s.longEvery);
        var leftCount = s.longEvery - doneCount;
        els.beansCaption.textContent =
            s.mode === 'long' ? 'The sprint counter resets after this break'
            : leftCount <= 0 ? 'Long break is next!'
            : 'Long break after ' + leftCount + (leftCount === 1 ? ' more sprint' : ' more sprints');

        els.startBtn.textContent = s.running ? 'Pause' : (s.started ? 'Resume' : 'Start');
        els.startBtn.classList.toggle('is-running', s.running);

        presetBtns.forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.mins) === s.focusMin ? 'true' : 'false'); });

        // While a sprint runs, hide the length picker, fewer decisions mid-focus.
        var hidePresets = s.running || s.mode !== 'focus';
        if (hidePresets && !els.presetsBlock.hidden && els.presetsBlock.contains(document.activeElement)) {
            els.startBtn.focus({ preventScroll: true });
        }
        els.presetsBlock.hidden = hidePresets;

        document.title = (s.running || s.started)
            ? fmt(s.remaining) + ' · ' + m.label + ', Focus Timer'
            : DEFAULT_TITLE;
    }

    /* ---------- timer core ---------- */
    function stopTicker() { if (s.ticker) { clearInterval(s.ticker); s.ticker = null; } }
    function tick() {
        if (!s.running) return;
        s.remaining = Math.max(0, (s.endAt - Date.now()) / 1000);
        render();
        if (s.remaining <= 0) complete();
    }
    function start() {
        if (s.running) return;
        if (s.remaining <= 0) { s.remaining = totalSeconds(); s.sessionTotal = totalSeconds(); }
        s.running = true; s.started = true;
        s.endAt = Date.now() + s.remaining * 1000;
        stopTicker(); s.ticker = setInterval(tick, 500);
        warmAudio();
        var mins = Math.ceil(s.remaining / 60);
        announce(MODES[s.mode].label + ' started, ' + mins + (mins === 1 ? ' minute' : ' minutes') + ', done around ' + clockTime(s.endAt) + '.');
        render();
    }
    function pause() {
        if (!s.running) return;
        var endBefore = s.endAt;
        tick(); // settle remaining from the clock, may complete + advance
        if (!s.running || s.endAt !== endBefore) return; // session ended/auto-advanced; don't stomp it
        s.running = false; stopTicker();
        announce('Paused, ' + fmt(s.remaining) + ' left.');
        render();
    }
    function reset() {
        stopTicker(); s.running = false; s.started = false;
        s.remaining = s.sessionTotal = totalSeconds();
        announce(MODES[s.mode].label + ' reset to ' + fmt(s.remaining) + '.');
        render();
    }
    function complete() {
        stopTicker(); s.running = false; s.remaining = 0;
        if (s.soundOn) chime();
        advance(true);
    }
    function advance(fromComplete) {
        var next, auto = false;
        if (s.mode === 'focus') {
            if (fromComplete) s.cycleCount++;
            next = s.cycleCount >= s.longEvery ? 'long' : 'short';
            auto = s.autoStartBreaks;
        } else {
            if (s.mode === 'long') s.cycleCount = 0; // the round ends once the long break is done
            next = 'focus';
            auto = s.autoStartFocus;
        }
        if (fromComplete && s.mode === 'focus') {
            s.celebrate = { type: next === 'long' ? 'round' : 'sprint', n: s.cycleCount };
        }
        if (next === 'focus') s.celebrate = null;
        if (fromComplete) {
            var doneLabel = MODES[s.mode].label, nextLabel = MODES[next].label;
            announce(doneLabel + ' finished, nice work! ' + (next === 'focus' ? 'Back to focus when you’re ready.' : 'Time for a ' + nextLabel.toLowerCase() + '.'));
            if (s.notifyOn) notify(doneLabel + ' finished', next === 'focus' ? 'Ready for another sprint?' : 'Take a ' + nextLabel.toLowerCase() + ', you earned it.');
        }
        setMode(next, { silent: true, autostart: auto, keepCelebration: true });
        if (!fromComplete) announce('Skipped, ' + MODES[s.mode].label + ', ' + fmt(s.remaining) + '.');
    }
    function setMode(mode, opts) {
        opts = opts || {};
        if (!opts.keepCelebration) s.celebrate = null;
        if (s.mode === 'long' && mode === 'focus') s.cycleCount = 0; // new round
        stopTicker(); s.running = false; s.started = false;
        s.mode = mode;
        s.remaining = s.sessionTotal = totalSeconds();
        if (!opts.silent) announce(MODES[mode].label + ' selected, ' + fmt(s.remaining) + '.');
        render();
        if (opts.autostart) start();
    }

    /* ---------- audio + notifications ---------- */
    function warmAudio() {
        try {
            if (!s.audioCtx) s.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (s.audioCtx.state === 'suspended') s.audioCtx.resume();
        } catch (e) {}
    }
    function chime() {
        try {
            warmAudio();
            var ctx = s.audioCtx; if (!ctx) return;
            var t = ctx.currentTime;
            [880, 1174, 1568].forEach(function (f, i) {
                var o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(0.0001, t + i * 0.18);
                g.gain.exponentialRampToValueAtTime(0.22, t + i * 0.18 + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.4);
                o.connect(g); g.connect(ctx.destination);
                o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.42);
            });
        } catch (e) {}
    }
    function notify(title, body) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        var opts = { body: body, icon: '/assets/images/brand/favicon.png', tag: 'cf-focus-timer' };
        try {
            new Notification(title, opts);
        } catch (e) {
            // Chrome for Android: page-created notifications throw; go through the SW.
            try {
                if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(function (reg) {
                    if (reg) reg.showNotification(title, opts);
                }).catch(function () {});
            } catch (e2) {}
        }
    }

    /* ---------- settings dialog ---------- */
    function openSettings() {
        $('set-focus').value = s.focusMin;
        $('set-short').value = s.shortMin;
        $('set-long').value = s.longMin;
        $('set-every').value = s.longEvery;
        $('set-auto-breaks').checked = s.autoStartBreaks;
        $('set-auto-focus').checked = s.autoStartFocus;
        $('set-keys').checked = s.keysOn;
        $('set-notify').checked = s.notifyOn;
        els.notifyBlocked.hidden = true;
        els.dialog.showModal();
    }
    function applySettings() {
        var beforeTotal = totalSeconds();
        s.focusMin = clampNum($('set-focus').value, 1, 90, 25);
        s.shortMin = clampNum($('set-short').value, 1, 30, 5);
        s.longMin = clampNum($('set-long').value, 1, 60, 15);
        s.longEvery = clampNum($('set-every').value, 2, 8, 4);
        s.autoStartBreaks = $('set-auto-breaks').checked;
        s.autoStartFocus = $('set-auto-focus').checked;
        s.keysOn = $('set-keys').checked;
        persist();
        // Re-arm only when the current mode's length changed, never wipe a paused sprint.
        if (!s.running && (totalSeconds() !== beforeTotal || !s.started)) {
            s.remaining = s.sessionTotal = totalSeconds();
            s.started = false;
        }
        render();
    }
    var MSG_BLOCKED = 'Notifications are blocked for this site, you can allow them from the address bar. The chime still works.';
    var MSG_UNSUPPORTED = 'This browser doesn’t support desktop notifications. The chime still works.';
    function onNotifyToggle(e) {
        var want = e.target.checked;
        els.notifyBlocked.hidden = true;
        if (!('Notification' in window)) { e.target.checked = false; els.notifyBlocked.textContent = MSG_UNSUPPORTED; els.notifyBlocked.hidden = false; return; }
        els.notifyBlocked.textContent = MSG_BLOCKED;
        if (!want) { s.notifyOn = false; persist(); return; }
        if (Notification.permission === 'granted') { s.notifyOn = true; persist(); return; }
        if (Notification.permission === 'denied') { s.notifyOn = false; persist(); e.target.checked = false; els.notifyBlocked.hidden = false; return; }
        Notification.requestPermission().then(function (p) {
            s.notifyOn = p === 'granted';
            persist();
            if (p !== 'granted') { e.target.checked = false; }
            if (p === 'denied') els.notifyBlocked.hidden = false;
        }).catch(function () { e.target.checked = false; });
    }

    /* ---------- task line ---------- */
    function syncIntentionUI() { els.oneThing.classList.toggle('has-text', els.intention.value.trim().length > 0); }
    try { els.intention.value = localStorage.getItem(INTENT_KEY) || ''; } catch (e) {}
    syncIntentionUI();
    els.intention.addEventListener('input', function () {
        try { localStorage.setItem(INTENT_KEY, els.intention.value); } catch (e) {}
        syncIntentionUI();
    });
    els.clearIntention.addEventListener('click', function () {
        els.intention.value = '';
        try { localStorage.removeItem(INTENT_KEY); } catch (e) {}
        syncIntentionUI();
        els.intention.focus();
    });

    /* ---------- wiring ---------- */
    els.startBtn.addEventListener('click', function () { s.running ? pause() : start(); });
    $('reset-btn').addEventListener('click', reset);
    $('skip-btn').addEventListener('click', function () { stopTicker(); s.running = false; advance(false); });
    els.soundBtn.addEventListener('click', function () {
        s.soundOn = !s.soundOn; persist();
        els.soundBtn.setAttribute('aria-pressed', s.soundOn ? 'true' : 'false');
        els.soundLabel.textContent = s.soundOn ? 'Chime on' : 'Chime off';
        announce(s.soundOn ? 'Chime on.' : 'Chime off.');
        if (s.soundOn) chime(); // a little preview so you know what to expect
    });
    $('settings-btn').addEventListener('click', openSettings);
    // Apply on BOTH submit (the Done button) and close (Esc / backdrop) 
    // some browsers skip the dialog's close event after a method="dialog" submit.
    els.dialog.querySelector('form').addEventListener('submit', applySettings);
    els.dialog.addEventListener('close', applySettings);
    $('set-notify').addEventListener('change', onNotifyToggle);
    var backdropPress = false;
    els.dialog.addEventListener('pointerdown', function (e) { backdropPress = e.target === els.dialog; });
    els.dialog.addEventListener('click', function (e) { if (backdropPress && e.target === els.dialog) els.dialog.close(); backdropPress = false; });

    presetBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            var newMin = clampNum(b.dataset.mins, 1, 90, 25);
            var changed = newMin !== s.focusMin;
            s.focusMin = newMin;
            persist();
            if (s.mode === 'focus' && !s.running && (changed || !s.started)) {
                s.remaining = s.sessionTotal = totalSeconds();
                s.started = false;
            }
            announce('Focus length set to ' + s.focusMin + ' minutes.');
            render();
        });
    });

    window.addEventListener('keydown', function (e) {
        if (els.dialog.open) return;
        var t = e.target || {};
        var tag = t.tagName || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
        // Shortcuts never fire while a control has focus (Space must activate it
        // natively, WCAG 2.1.1), never with Shift, and can be turned off in
        // Settings (WCAG 2.1.4).
        var onControl = tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || tag === 'SUMMARY';
        if (!s.keysOn || onControl || e.shiftKey) return;
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            s.running ? pause() : start();
        } else if (e.key === 'r' || e.key === 'R') { reset(); }
        else if (e.key === 's' || e.key === 'S') { stopTicker(); s.running = false; advance(false); }
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && s.running) tick(); });

    if ('Notification' in window && Notification.permission === 'granted' && saved.notifyOn !== false) s.notifyOn = true;
    els.soundBtn.setAttribute('aria-pressed', s.soundOn ? 'true' : 'false');
    els.soundLabel.textContent = s.soundOn ? 'Chime on' : 'Chime off';
    render();
})();
