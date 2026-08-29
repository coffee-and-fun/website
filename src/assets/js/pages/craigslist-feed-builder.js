/* Listing Watcher.
   Builds Craigslist searches and watches RSS/Atom feeds, entirely in the
   browser. Everything lives in localStorage, nothing is sent anywhere.

   The honest constraint, surfaced in the UI rather than hidden: browsers block
   cross-site reads unless the far end sends Access-Control-Allow-Origin, and
   almost no feed does. Craigslist is worse again, it 403s non-browser traffic
   and dropped RSS altogether. So checking is best-effort: it tries a direct
   fetch, and if the user has set a proxy in settings it goes through that.
   When it cannot read a source it says so plainly instead of showing an empty
   list that looks like "no results". Building and opening searches always
   works, since that is just URL construction. */
(function () {
  'use strict';

  var STORE = 'coffeeandfun.listingwatcher.v1';

  // Craigslist search categories, the ones people actually use.
  var CATEGORIES = [
    { id: 'sss', label: 'All for sale' },
    { id: 'fua', label: 'Furniture' },
    { id: 'ela', label: 'Electronics' },
    { id: 'sya', label: 'Computers' },
    { id: 'vga', label: 'Video gaming' },
    { id: 'msa', label: 'Musical instruments' },
    { id: 'bia', label: 'Bicycles' },
    { id: 'cta', label: 'Cars & trucks' },
    { id: 'tla', label: 'Tools' },
    { id: 'ppa', label: 'Appliances' },
    { id: 'zip', label: 'Free stuff' },
    { id: 'apa', label: 'Apartments / housing' },
    { id: 'jjj', label: 'Jobs' },
    { id: 'ggg', label: 'Gigs' }
  ];

  // A starter list for the datalist. Craigslist has hundreds of sites, so the
  // field stays free text and this is only a shortcut for the common ones.
  var SITES = [
    'sfbay', 'newyork', 'losangeles', 'chicago', 'seattle', 'boston', 'austin',
    'denver', 'portland', 'atlanta', 'miami', 'dallas', 'houston', 'phoenix',
    'sandiego', 'philadelphia', 'washingtondc', 'detroit', 'minneapolis',
    'sacramento', 'lasvegas', 'orlando', 'sanantonio', 'columbus', 'nashville',
    'raleigh', 'pittsburgh', 'stlouis', 'kansascity', 'cleveland', 'newjersey',
    'longisland', 'inlandempire', 'orangecounty', 'vancouver', 'toronto',
    'montreal', 'calgary', 'ottawa', 'edmonton', 'london', 'manchester',
    'birmingham', 'dublin', 'sydney', 'melbourne', 'brisbane', 'perth'
  ];

  var SWATCHES = [
    '#1a73e8', '#d93025', '#f9ab00', '#1e8e3e', '#9334e6',
    '#e8710a', '#12b5cb', '#e52592', '#5f6368'
  ];

  function uid() {
    return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function blank() {
    return {
      v: 1,
      watches: [],
      seen: {},          /* watchId -> { itemKey: firstSeenMillis } */
      settings: {
        theme: 'system',
        textScale: 1,
        notifications: false,
        proxy: '',
        checkOnLoad: true
      }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return blank();
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1) return blank();
      var base = blank();
      parsed.settings = Object.assign(base.settings, parsed.settings || {});
      parsed.watches = parsed.watches || [];
      parsed.seen = parsed.seen || {};
      return parsed;
    } catch (e) {
      return blank();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------- craigslist */

  function craigslistUrl(w) {
    var site = (w.site || 'sfbay').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    var cat = w.category || 'sss';
    var params = new URLSearchParams();
    if (w.query) params.set('query', w.query);
    if (w.minPrice) params.set('min_price', w.minPrice);
    if (w.maxPrice) params.set('max_price', w.maxPrice);
    if (w.postal) params.set('postal', w.postal);
    if (w.distance) params.set('search_distance', w.distance);
    if (w.hasImage) params.set('hasPic', '1');
    var qs = params.toString();
    return 'https://' + site + '.craigslist.org/search/' + cat + (qs ? '?' + qs : '');
  }

  function watchUrl(w) {
    return w.kind === 'craigslist' ? craigslistUrl(w) : (w.feedUrl || '').trim();
  }

  /* ------------------------------------------------------------------ feeds */

  // Pull a price out of a title or description. Craigslist puts it in the
  // title, most other feeds do not have one at all, hence the null.
  function parsePrice(text) {
    if (!text) return null;
    var m = String(text).match(/(?:^|[\s(>])([$£€])\s?([0-9][0-9,]*(?:\.[0-9]{2})?)/);
    if (!m) return null;
    var n = parseFloat(m[2].replace(/,/g, ''));
    if (!isFinite(n)) return null;
    return { symbol: m[1], amount: n };
  }

  function textOf(node, names) {
    for (var i = 0; i < names.length; i++) {
      var el = node.querySelector(names[i]);
      if (el && el.textContent) return el.textContent.trim();
    }
    return '';
  }

  // RSS 2.0, RDF and Atom in one pass. Feeds in the wild are inconsistent
  // enough that guessing by root element alone is not reliable.
  function parseFeed(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('That did not parse as RSS or Atom.');

    var nodes = [].slice.call(doc.querySelectorAll('item, entry'));
    if (!nodes.length) throw new Error('No listings found in that feed.');

    return nodes.map(function (n) {
      var title = textOf(n, ['title']);
      var link = '';
      var linkEl = n.querySelector('link');
      if (linkEl) link = (linkEl.getAttribute('href') || linkEl.textContent || '').trim();
      if (!link) link = textOf(n, ['guid', 'id']);

      var desc = textOf(n, ['description', 'summary', 'content']);
      var when = textOf(n, ['pubDate', 'published', 'updated', 'date']);
      var stamp = when ? Date.parse(when) : NaN;

      return {
        key: (textOf(n, ['guid', 'id']) || link || title).trim(),
        title: title || 'Untitled listing',
        link: link,
        desc: desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220),
        time: isFinite(stamp) ? stamp : null,
        price: parsePrice(title) || parsePrice(desc)
      };
    }).filter(function (i) { return i.key; });
  }

  function fetchUrl(url, proxy) {
    var target = url;
    if (proxy) {
      // Two shapes cover nearly every proxy people run: a {url} placeholder,
      // or a prefix the target is appended to.
      target = proxy.indexOf('{url}') !== -1
        ? proxy.replace('{url}', encodeURIComponent(url))
        : proxy + encodeURIComponent(url);
    }
    return fetch(target, { redirect: 'follow' }).then(function (res) {
      if (!res.ok) throw new Error('The source answered ' + res.status + '.');
      return res.text();
    });
  }

  /* ------------------------------------------------------------------- time */

  function ago(ms) {
    if (!ms) return '';
    var s = Math.max(0, (Date.now() - ms) / 1000);
    if (s < 90) return 'just now';
    var m = s / 60;
    if (m < 60) return Math.round(m) + ' min ago';
    var h = m / 60;
    if (h < 24) return Math.round(h) + ' hr ago';
    var d = Math.round(h / 24);
    return d === 1 ? 'yesterday' : d + ' days ago';
  }

  window.ListingWatcher = {
    STORE: STORE,
    CATEGORIES: CATEGORIES,
    SITES: SITES,
    SWATCHES: SWATCHES,
    uid: uid,
    blank: blank,
    load: load,
    save: save,
    craigslistUrl: craigslistUrl,
    watchUrl: watchUrl,
    parseFeed: parseFeed,
    parsePrice: parsePrice,
    fetchUrl: fetchUrl,
    ago: ago
  };
})();
