(function () {
  'use strict';

  /* 11×11 letter grid. Same vocabulary and shape as always 
     IT IS <minutes> MINUTES PAST/TO <hour> / <hour> O'CLOCK. */
  var ROWS = [
    'ITLISASTHPM',
    'ACFIFTEENDC',
    'TWENTYFIVEX',
    'THIRTYFTENO',
    'MINUTESETOU',
    'PASTORUFOUR',
    'SEVENTWELVE',
    'NINEFIVETWO',
    'EIGHTELEVEN',
    'SIXTHREEONE',
    "TENSO'CLOCK"
  ];

  /* Each word is [row, startCol, endColExclusive]. */
  var WORDS = {
    IT: [0, 0, 2], IS: [0, 3, 5],
    M_FIVE: [2, 6, 10], M_TEN: [3, 7, 10], M_FIFTEEN: [1, 2, 9],
    M_TWENTY: [2, 0, 6], M_THIRTY: [3, 0, 6],
    MINUTES: [4, 0, 7], PAST: [5, 0, 4], TO: [4, 8, 10],
    H1: [9, 8, 11], H2: [7, 8, 11], H3: [9, 3, 8], H4: [5, 7, 11],
    H5: [7, 4, 8], H6: [9, 0, 3], H7: [6, 0, 5], H8: [8, 0, 5],
    H9: [7, 0, 4], H10: [10, 0, 3], H11: [8, 5, 11], H12: [6, 5, 11],
    OCLOCK: [10, 4, 11]
  };

  var HOUR_NAMES = [null, 'one', 'two', 'three', 'four', 'five', 'six',
    'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

  var MINUTE_WORDS = {
    5:  { keys: ['M_FIVE'],             label: 'five' },
    10: { keys: ['M_TEN'],              label: 'ten' },
    15: { keys: ['M_FIFTEEN'],          label: 'fifteen' },
    20: { keys: ['M_TWENTY'],           label: 'twenty' },
    25: { keys: ['M_TWENTY', 'M_FIVE'], label: 'twenty-five' },
    30: { keys: ['M_THIRTY'],           label: 'thirty' }
  };

  /* Which words are lit at h24:m, plus the same thing as a sentence. */
  function wordsFor(h24, m) {
    var block = Math.floor(m / 5) * 5;
    var keys = ['IT', 'IS'];
    var phrase = 'It is ';
    var hourShift = 0;

    if (block !== 0) {
      var mw = MINUTE_WORDS[block <= 30 ? block : 60 - block];
      keys = keys.concat(mw.keys, 'MINUTES');
      if (block <= 30) {
        keys.push('PAST');
        phrase += mw.label + ' minutes past ';
      } else {
        keys.push('TO');
        phrase += mw.label + ' minutes to ';
        hourShift = 1;
      }
    }

    var hour = (h24 + hourShift) % 12 || 12;
    keys.push('H' + hour);
    phrase += HOUR_NAMES[hour];
    if (block === 0) {
      keys.push('OCLOCK');
      phrase += " o'clock";
    }
    return { keys: keys, phrase: phrase + '.' };
  }

  var lettersEl = document.getElementById('letters');
  var timeEl = document.getElementById('digital-time');
  var dateEl = document.getElementById('digital-date');
  var spokenEl = document.getElementById('spoken-time');
  var toggle24 = document.getElementById('opt-24h');
  var toggleSmooth = document.getElementById('opt-smooth');
  var fsBtn = document.getElementById('btn-fullscreen');
  var card = document.getElementById('clock-card');

  /* Build the grid once. */
  var cells = [];
  ROWS.forEach(function (row) {
    for (var i = 0; i < row.length; i++) {
      var s = document.createElement('span');
      s.className = 'letter';
      s.textContent = row.charAt(i);
      lettersEl.appendChild(s);
      cells.push(s);
    }
  });

  function cellsFor(key) {
    var d = WORDS[key];
    var out = [];
    for (var c = d[1]; c < d[2]; c++) out.push(d[0] * 11 + c);
    return out;
  }

  /* Settings, same localStorage key as before, so saved
     preferences carry over. */
  var settings = { use24Hour: false, smoothTransitions: true };
  try {
    var saved = JSON.parse(localStorage.getItem('wordClockSettings') || '{}');
    settings.use24Hour = saved.use24Hour === true;
    settings.smoothTransitions = saved.smoothTransitions !== false;
  } catch (e) { /* first visit or blocked storage */ }

  function saveSettings() {
    try {
      localStorage.setItem('wordClockSettings', JSON.stringify(settings));
    } catch (e) { /* storage blocked, settings just won't persist */ }
  }

  function applySmooth() {
    lettersEl.classList.toggle('smooth', settings.smoothTransitions);
  }

  var litMinute = -1;
  function tick(force) {
    var now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: !settings.use24Hour
    });
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    var minuteStamp = now.getHours() * 60 + now.getMinutes();
    if (minuteStamp !== litMinute || force) {
      litMinute = minuteStamp;
      var result = wordsFor(now.getHours(), now.getMinutes());
      var active = {};
      result.keys.forEach(function (key) {
        cellsFor(key).forEach(function (i) { active[i] = true; });
      });
      cells.forEach(function (cell, i) {
        cell.classList.toggle('on', active[i] === true);
      });
      spokenEl.textContent = result.phrase;
    }
  }

  toggle24.checked = settings.use24Hour;
  toggleSmooth.checked = settings.smoothTransitions;
  applySmooth();

  toggle24.addEventListener('change', function () {
    settings.use24Hour = toggle24.checked;
    saveSettings();
    tick(true);
  });
  toggleSmooth.addEventListener('change', function () {
    settings.smoothTransitions = toggleSmooth.checked;
    saveSettings();
    applySmooth();
  });

  /* Full screen: the card becomes the whole display. Hidden where the
     Fullscreen API isn't available (e.g. iPhone Safari). */
  if (typeof card.requestFullscreen !== 'function') {
    fsBtn.hidden = true;
  } else {
    fsBtn.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        card.requestFullscreen().catch(function () { /* denied, no-op */ });
      }
    });
    document.addEventListener('fullscreenchange', function () {
      fsBtn.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    });
  }

  tick();
  setInterval(tick, 1000);
  /* Re-sync immediately when the tab wakes up. */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tick();
  });
})();
