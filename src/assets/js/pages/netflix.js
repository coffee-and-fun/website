(function () {
    'use strict';

    var input = document.getElementById('code-search');
    var countEl = document.getElementById('result-count');
    var clearBtn = document.getElementById('clear-search');
    var clearBtn2 = document.getElementById('clear-search-2');
    var chipbar = document.getElementById('chipbar');
    var lettersNav = document.getElementById('letters');
    var noResults = document.getElementById('no-results');
    var noResultsQ = document.getElementById('no-results-q');
    var announceEl = document.getElementById('announce');
    var catalog = document.getElementById('catalog');

    /* Build the search index once from the server-rendered rows. */
    var sections = [];
    var total = 0;
    var sectionEls = catalog.querySelectorAll('.gsec');
    for (var s = 0; s < sectionEls.length; s++) {
        var rowEls = sectionEls[s].querySelectorAll('li');
        var rows = [];
        for (var r = 0; r < rowEls.length; r++) {
            var li = rowEls[r];
            var link = li.querySelector('a');
            var code = li.querySelector('code');
            rows.push({
                el: li,
                text: (link.textContent + ' ' + (code ? code.textContent : '')).toLowerCase(),
                hidden: false
            });
        }
        total += rows.length;
        sections.push({ el: sectionEls[s], rows: rows, hidden: false });
    }
    var totalText = total.toLocaleString('en-US');

    function applyFilter(rawQuery) {
        var query = rawQuery.replace(/\s+/g, ' ').trim().toLowerCase();
        var words = query ? query.split(' ') : [];
        var shown = 0;

        for (var s = 0; s < sections.length; s++) {
            var sec = sections[s];
            var visible = 0;
            for (var r = 0; r < sec.rows.length; r++) {
                var row = sec.rows[r];
                var match = true;
                for (var w = 0; w < words.length; w++) {
                    if (row.text.indexOf(words[w]) === -1) { match = false; break; }
                }
                if (match) visible++;
                if (row.hidden !== !match) {
                    row.hidden = !match;
                    row.el.hidden = !match;
                }
            }
            var secHidden = visible === 0;
            if (sec.hidden !== secHidden) {
                sec.hidden = secHidden;
                sec.el.hidden = secHidden;
            }
            shown += visible;
        }

        var searching = words.length > 0;
        chipbar.hidden = searching;
        lettersNav.hidden = searching;
        clearBtn.hidden = !searching;
        noResults.hidden = shown !== 0;

        var quoted = '“' + query + '”';
        if (!searching) {
            countEl.textContent = 'Showing all ' + totalText + ' categories';
        } else if (shown === 0) {
            noResultsQ.textContent = quoted;
            countEl.textContent = 'No categories match ' + quoted;
        } else {
            countEl.textContent = shown.toLocaleString('en-US') + ' of ' + totalText + ' categories match ' + quoted;
        }
    }

    var debounceTimer = null;
    input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () { applyFilter(input.value); }, 120);
    });

    /* Escape clears the search from inside the field. */
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && input.value) {
            input.value = '';
            applyFilter('');
        }
    });

    function clearSearch() {
        clearTimeout(debounceTimer);
        input.value = '';
        applyFilter('');
        input.focus();
    }
    clearBtn.addEventListener('click', clearSearch);
    clearBtn2.addEventListener('click', clearSearch);

    /* Popular filter chips fill the search box. */
    chipbar.addEventListener('click', function (e) {
        var chip = e.target.closest ? e.target.closest('.chip') : null;
        if (!chip) return;
        clearTimeout(debounceTimer);
        input.value = chip.getAttribute('data-tag');
        applyFilter(input.value);
        input.focus();
    });

    /* Ctrl+K / Cmd+K focuses the search from anywhere. */
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });

    /* Copy links, one delegated handler for all 1,900+ buttons. */
    function announce(msg) {
        announceEl.textContent = '';
        setTimeout(function () { announceEl.textContent = msg; }, 30);
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }

    function flashButton(btn, label, cls, message) {
        btn.textContent = label;
        btn.classList.add(cls);
        announce(message);
        clearTimeout(btn._copyTimer);
        btn._copyTimer = setTimeout(function () {
            btn.textContent = 'Copy link';
            btn.classList.remove('done', 'failed');
        }, 1800);
    }

    catalog.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('button.copy') : null;
        if (!btn) return;
        var li = btn.closest('li');
        var link = li && li.querySelector('a');
        if (!link) return;
        var url = link.href;
        var name = link.textContent;

        function done(ok) {
            if (ok) {
                flashButton(btn, 'Copied ✓', 'done', 'Link for ' + name + ' copied to your clipboard.');
            } else {
                flashButton(btn, 'Copy failed', 'failed', 'Copying didn’t work, you can open the link and copy the address instead.');
            }
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(
                function () { done(true); },
                function () { done(fallbackCopy(url)); }
            );
        } else {
            done(fallbackCopy(url));
        }
    });

    /* Give a copy button a specific accessible name once it's reachable 
       done lazily so 1,900+ aria-labels don't have to ship in the HTML. */
    catalog.addEventListener('focusin', function (e) {
        var btn = e.target;
        if (!btn.classList || !btn.classList.contains('copy') || btn.hasAttribute('aria-label')) return;
        var li = btn.closest('li');
        var link = li && li.querySelector('a');
        if (link) btn.setAttribute('aria-label', 'Copy the Netflix link for ' + link.textContent);
    });
})();
