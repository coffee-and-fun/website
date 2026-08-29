/* Listing Watcher.
   Builds Craigslist searches and watches RSS/Atom feeds, entirely in the
   browser. Everything is localStorage, nothing is sent anywhere.

   Styling is daisyUI and Tailwind only, so there is no stylesheet for this
   page: theme is a data-theme swap and text size is a utility class, both
   applied from here.

   The constraint this app is shaped around: browsers refuse cross-site reads
   unless the far end sends Access-Control-Allow-Origin, and almost nothing
   does. Craigslist is worse again, it dropped RSS and 403s non-browser
   traffic. So reading is best-effort and says so when it fails, while building
   and opening a search always works, being only URL construction. */
(function () {
  'use strict';

  var STORE = 'coffeeandfun.listingwatcher.v1';
  var COLOURS = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];

  // Sites and categories are craigslist's own, from reference.craigslist.org,
  // captured at build time into a JSON asset. 707 sites and 175 categories, so
  // they are fetched once rather than inlined into every page load. Same
  // origin, so no CORS wrinkle here.
  var REF_URL = '/assets/data/craigslist-sites.json';

  function blank() {
    return {
      v: 1,
      watches: [],
      seen: {},
      settings: { theme: 'system', size: 1, notifications: false, proxy: '', checkOnLoad: true }
    };
  }

  function load() {
    try {
      var p = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!p || p.v !== 1) return blank();
      var base = blank();
      p.settings = Object.assign(base.settings, p.settings || {});
      p.watches = p.watches || [];
      p.seen = p.seen || {};
      return p;
    } catch (e) { return blank(); }
  }

  function craigslistUrl(w) {
    var site = (w.site || 'sfbay').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    var q = new URLSearchParams();
    if (w.query) q.set('query', w.query);
    if (w.minPrice) q.set('min_price', w.minPrice);
    if (w.maxPrice) q.set('max_price', w.maxPrice);
    if (w.postal) q.set('postal', w.postal);
    if (w.distance) q.set('search_distance', w.distance);
    if (w.hasImage) q.set('hasPic', '1');
    var s = q.toString();
    return 'https://' + site + '.craigslist.org/search/' + (w.category || 'sss') + (s ? '?' + s : '');
  }

  function urlFor(w) {
    return w.kind === 'craigslist' ? craigslistUrl(w) : (w.feedUrl || '').trim();
  }

  function price(text) {
    var m = String(text || '').match(/(?:^|[\s(>])([$£€])\s?([0-9][0-9,]*)/);
    if (!m) return null;
    var n = parseFloat(m[2].replace(/,/g, ''));
    return isFinite(n) ? m[1] + n.toLocaleString() : null;
  }

  function pick(node, names) {
    for (var i = 0; i < names.length; i++) {
      var el = node.querySelector(names[i]);
      if (el && el.textContent) return el.textContent.trim();
    }
    return '';
  }

  // RSS 2.0, RDF and Atom in one pass, since feeds in the wild are too
  // inconsistent to branch on the root element.
  function parseFeed(xml) {
    var doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('That did not parse as RSS or Atom.');
    var nodes = [].slice.call(doc.querySelectorAll('item, entry'));
    if (!nodes.length) throw new Error('No listings in that feed.');

    return nodes.map(function (n) {
      var linkEl = n.querySelector('link');
      var link = linkEl ? (linkEl.getAttribute('href') || linkEl.textContent || '').trim() : '';
      var title = pick(n, ['title']) || 'Untitled listing';
      var desc = pick(n, ['description', 'summary', 'content']).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      var when = Date.parse(pick(n, ['pubDate', 'published', 'updated']));
      return {
        key: (pick(n, ['guid', 'id']) || link || title).trim(),
        title: title,
        link: link || pick(n, ['guid', 'id']),
        desc: desc.slice(0, 180),
        time: isFinite(when) ? when : null,
        price: price(title) || price(desc)
      };
    }).filter(function (i) { return i.key; });
  }

  function ago(ms) {
    if (!ms) return '';
    var m = Math.max(0, (Date.now() - ms) / 60000);
    if (m < 2) return 'just now';
    if (m < 60) return Math.round(m) + ' min ago';
    if (m < 1440) return Math.round(m / 60) + ' hr ago';
    var d = Math.round(m / 1440);
    return d === 1 ? 'yesterday' : d + ' days ago';
  }

  var state = load();

  Vue.createApp({
    data: function () {
      return {
        watches: state.watches,
        seen: state.seen,
        settings: state.settings,
        items: [],
        status: {},
        active: 'all',
        checking: false,
        checkedAt: null,
        editing: null,
        showSettings: false,
        note: '',
        sites: [],
        categoryGroups: {},
        catLabels: {},
        sizes: ['S', 'M', 'L', 'XL']
      };
    },

    computed: {
      shown: function () {
        var id = this.active;
        return (id === 'all' ? this.items : this.items.filter(function (i) { return i.watchId === id; }))
          .slice().sort(function (a, b) {
            if (a.fresh !== b.fresh) return a.fresh ? -1 : 1;
            return (b.time || 0) - (a.time || 0);
          });
      },
      freshCount: function () { return this.items.filter(function (i) { return i.fresh; }).length; },
      counts: function () {
        var out = {};
        this.items.forEach(function (i) {
          var c = out[i.watchId] || (out[i.watchId] = { total: 0, fresh: 0 });
          c.total++; if (i.fresh) c.fresh++;
        });
        return out;
      },
      preview: function () { return this.editing ? urlFor(this.editing) : ''; },
      canSave: function () {
        var e = this.editing;
        if (!e || !e.name.trim()) return false;
        return e.kind === 'craigslist' ? !!e.site.trim() : /^https?:\/\//i.test((e.feedUrl || '').trim());
      },
      blocked: function () {
        var self = this;
        return this.watches.filter(function (w) {
          return (self.status[w.id] || {}).state === 'blocked'
            && (self.active === 'all' || self.active === w.id);
        });
      }
    },

    mounted: function () {
      this.applyTheme();
      this.loadReference();
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) mq.addEventListener('change', this.applyTheme.bind(this));
      }
      if (this.settings.checkOnLoad && this.watches.length) this.checkAll();
    },

    methods: {
      ago: ago,

      loadReference: function () {
        var self = this;
        fetch(REF_URL).then(function (r) { return r.json(); }).then(function (d) {
          self.sites = d.sites || [];
          self.categoryGroups = d.categories || {};
          var labels = {};
          Object.keys(self.categoryGroups).forEach(function (group) {
            self.categoryGroups[group].forEach(function (c) { labels[c[0]] = c[1]; });
          });
          self.catLabels = labels;
        }).catch(function () { /* the fields still work, just without the lists */ });
      },
      urlFor: urlFor,

      // Two letters for the avatar circle, the way a contact list does it.
      initials: function (name) {
        var parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
        return parts.map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || '?';
      },

      // What this watch is actually pointed at, said briefly.
      source: function (w) {
        if (w.kind !== 'craigslist') {
          try { return new URL(w.feedUrl).hostname.replace(/^www\./, ''); }
          catch (e) { return 'Feed'; }
        }
        return [w.site, this.catLabels[w.category] || w.category, w.query || null]
          .filter(Boolean).join(' · ');
      },

      persist: function () {
        try {
          localStorage.setItem(STORE, JSON.stringify({
            v: 1, watches: this.watches, seen: this.seen, settings: this.settings
          }));
        } catch (e) { /* private mode, the session still works */ }
      },

      say: function (m) {
        this.note = m;
        clearTimeout(this._t);
        var self = this;
        this._t = setTimeout(function () { self.note = ''; }, 3200);
      },

      applyTheme: function () {
        var p = this.settings.theme;
        var dark = p === 'dark' || (p === 'system' && window.matchMedia
          && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      },

      setTheme: function (v) { this.settings.theme = v; this.applyTheme(); this.persist(); },
      setSize: function (i) { this.settings.size = i; this.persist(); },

      toggleNotifications: function () {
        var self = this;
        if (this.settings.notifications) {
          this.settings.notifications = false; this.persist(); return;
        }
        if (!('Notification' in window)) return this.say('This browser has no notifications.');
        Notification.requestPermission().then(function (r) {
          self.settings.notifications = r === 'granted';
          self.persist();
          if (r !== 'granted') self.say('The browser kept notifications blocked.');
        });
      },

      newWatch: function (kind) {
        this.editing = {
          id: null, kind: kind, name: '',
          colour: COLOURS[this.watches.length % COLOURS.length],
          site: 'sfbay', category: 'sss', query: '',
          minPrice: '', maxPrice: '', postal: '', distance: '',
          hasImage: false, feedUrl: ''
        };
      },

      editWatch: function (w) { this.editing = Object.assign({}, w); },

      saveWatch: function () {
        if (!this.canSave) return;
        var w = Object.assign({}, this.editing);
        w.name = w.name.trim();
        if (w.id) {
          var i = this.watches.findIndex(function (x) { return x.id === w.id; });
          if (i !== -1) this.watches.splice(i, 1, w);
        } else {
          w.id = 'w' + Date.now().toString(36);
          this.watches.push(w);
        }
        this.persist();
        this.editing = null;
        this.checkOne(w);
      },

      removeWatch: function (w) {
        var i = this.watches.findIndex(function (x) { return x.id === w.id; });
        if (i === -1) return;
        this.watches.splice(i, 1);
        delete this.seen[w.id];
        delete this.status[w.id];
        this.items = this.items.filter(function (x) { return x.watchId !== w.id; });
        if (this.active === w.id) this.active = 'all';
        this.editing = null;
        this.persist();
        this.say('Watch removed.');
      },

      checkAll: function () {
        if (this.checking || !this.watches.length) return;
        var self = this, before = this.freshCount;
        this.checking = true;
        Promise.all(this.watches.map(function (w) { return self.checkOne(w); })).then(function () {
          self.checking = false;
          self.checkedAt = Date.now();
          var gained = self.freshCount - before;
          if (gained > 0) self.notify(gained);
        });
      },

      checkOne: function (w) {
        var self = this;
        var url = urlFor(w);
        if (!url) return Promise.resolve();
        var target = this.settings.proxy
          ? (this.settings.proxy.indexOf('{url}') !== -1
            ? this.settings.proxy.replace('{url}', encodeURIComponent(url))
            : this.settings.proxy + encodeURIComponent(url))
          : url;

        this.status[w.id] = { state: 'checking' };
        return fetch(target)
          .then(function (r) {
            if (!r.ok) throw new Error('The source answered ' + r.status + '.');
            return r.text();
          })
          .then(function (text) {
            var parsed = parseFeed(text);
            self.absorb(w, parsed);
            self.status[w.id] = { state: 'ok', message: parsed.length + ' listings' };
          })
          .catch(function (err) {
            // A cross-origin refusal arrives as a bare TypeError with no status,
            // indistinguishable from being offline, so say the likely thing.
            self.status[w.id] = {
              state: 'blocked',
              message: err instanceof TypeError ? 'Your browser blocked this read' : err.message
            };
          });
      },

      absorb: function (w, parsed) {
        var seen = this.seen[w.id] || (this.seen[w.id] = {});
        var firstRun = Object.keys(seen).length === 0;
        var rows = parsed.map(function (item) {
          var isNew = !seen[item.key];
          if (isNew) seen[item.key] = Date.now();
          return Object.assign({}, item, {
            watchId: w.id, watchName: w.name, colour: w.colour,
            // On a first fetch everything is unseen, and flagging all of it is
            // noise rather than news.
            fresh: isNew && !firstRun
          });
        });
        this.items = this.items.filter(function (i) { return i.watchId !== w.id; }).concat(rows);
        this.persist();
      },

      notify: function (n) {
        if (!this.settings.notifications || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        try {
          new Notification(n + (n === 1 ? ' new listing' : ' new listings'), { tag: 'listing-watcher' });
        } catch (e) { /* some browsers require a service worker here */ }
      },

      markSeen: function () { this.items.forEach(function (i) { i.fresh = false; }); },

      clearAll: function () {
        if (!window.confirm('Delete every watch, setting and record of what you have seen?')) return;
        try { localStorage.removeItem(STORE); } catch (e) { /* nothing to do */ }
        var f = blank();
        this.watches = f.watches; this.seen = f.seen; this.settings = f.settings;
        this.items = []; this.status = {}; this.active = 'all'; this.showSettings = false;
        this.applyTheme();
        this.say('Everything cleared.');
      }
    }
  }).mount('#app');
})();
