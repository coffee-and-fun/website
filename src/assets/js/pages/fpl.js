/* FPL overview page. Both features are progressive enhancements: the join code and
   the season start date are in the HTML and readable with JavaScript off. */
(function () {
  'use strict';

  /* ---- copy the league code ---- */
  var copyBtn = document.querySelector('[data-fpl-copy]');
  var status = document.querySelector('[data-fpl-copied]');

  /* If the clipboard write is refused (no user activation, permissions policy, an
     older browser) select the code instead, so "press Ctrl and C" is advice that
     actually works rather than advice that only sounds helpful. */
  function selectCode() {
    var code = document.querySelector('[data-fpl-code]');
    if (!code || !window.getSelection || !document.createRange) {
      status.textContent = 'Could not copy, select the code manually';
      return;
    }
    var range = document.createRange();
    range.selectNodeContents(code);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    status.textContent = 'Selected, now press Ctrl or Cmd and C';
  }

  if (copyBtn && status && navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.getAttribute('data-fpl-copy')).then(
        function () {
          status.textContent = 'Copied';
        },
        selectCode
      );
    });
  }

  /* ---- days until the first deadline ---- */
  var el = document.querySelector('[data-fpl-countdown]');
  if (!el) return;

  var start = new Date(el.getAttribute('data-fpl-countdown'));
  if (isNaN(start.getTime())) return;

  var days = Math.ceil((start.getTime() - Date.now()) / 86400000);

  if (days > 1) {
    el.textContent = days + ' days to go.';
  } else if (days === 1) {
    el.textContent = 'Tomorrow.';
  } else if (days === 0) {
    el.textContent = 'Today.';
  }
  /* Past the date the element stays empty rather than counting negatives. */
})();
