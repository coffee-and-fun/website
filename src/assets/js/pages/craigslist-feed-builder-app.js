/* The Vue layer. Kept apart from the parsing and storage core so that half can
   be reasoned about, and tested, without a component tree around it. */
(function () {
  'use strict';

  var LW = window.ListingWatcher;
  if (!LW || !window.Vue) return;

  Vue.createApp({
    data: function () {
      var state = LW.load();
      return {
        watches: state.watches,
        seen: state.seen,
        settings: state.settings,
        items: [],
        status: {},            /* watchId -> { state, message, count } */
        activeId: 'all',
        checking: false,
        lastChecked: null,
        showSettings: false,
        showEditor: false,
        editing: null,
        sites: LW.SITES,
        categories: LW.CATEGORIES,
        swatches: LW.SWATCHES,
        toast: ''
      };
    },

    computed: {
      visibleItems: function () {
        var id = this.activeId;
        var list = id === 'all' ? this.items : this.items.filter(function (i) { return i.watchId === id; });
        return list.slice().sort(function (a, b) {
          if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
          return (b.time || 0) - (a.time || 0);
        });
      },
      newCount: function () {
        return this.items.filter(function (i) { return i.isNew; }).length;
      },
      countsByWatch: function () {
        var out = {};
        this.items.forEach(function (i) {
          out[i.watchId] = out[i.watchId] || { total: 0, fresh: 0 };
          out[i.watchId].total++;
          if (i.isNew) out[i.watchId].fresh++;
        });
        return out;
      },
      editorUrl: function () {
        return this.editing ? LW.watchUrl(this.editing) : '';
      },
      canSaveEditor: function () {
        if (!this.editing) return false;
        if (!this.editing.name.trim()) return false;
        return this.editing.kind === 'craigslist'
          ? !!this.editing.site.trim()
          : /^https?:\/\//i.test((this.editing.feedUrl || '').trim());
      }
    },

    mounted: function () {
      this.applyTheme();
      this.applyScale();
      if (this.settings.checkOnLoad && this.watches.length) this.checkAll();
      // System theme changes should follow through while the page is open.
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var handler = this.applyTheme.bind(this);
        if (mq.addEventListener) mq.addEventListener('change', handler);
      }
    },

    methods: {
      ago: LW.ago,
      urlFor: LW.watchUrl,

      persist: function () {
        LW.save({ v: 1, watches: this.watches, seen: this.seen, settings: this.settings });
      },

      say: function (message) {
        this.toast = message;
        var self = this;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(function () { self.toast = ''; }, 3200);
      },

      /* ---------------------------------------------------------- appearance */

      applyTheme: function () {
        var pref = this.settings.theme;
        var dark = pref === 'dark' || (pref === 'system' &&
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', dark ? '#131314' : '#f1f3f4');
      },

      applyScale: function () {
        document.documentElement.style.setProperty('--lw-scale', String(this.settings.textScale || 1));
      },

      setTheme: function (v) { this.settings.theme = v; this.applyTheme(); this.persist(); },
      setScale: function (v) { this.settings.textScale = v; this.applyScale(); this.persist(); },

      /* -------------------------------------------------------- notifications */

      toggleNotifications: function () {
        var self = this;
        if (this.settings.notifications) {
          this.settings.notifications = false;
          this.persist();
          return;
        }
        if (!('Notification' in window)) {
          this.say('This browser has no notification support.');
          return;
        }
        Notification.requestPermission().then(function (result) {
          self.settings.notifications = result === 'granted';
          self.persist();
          if (result !== 'granted') self.say('Notifications stayed blocked in the browser.');
        });
      },

      notify: function (count) {
        if (!this.settings.notifications || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        try {
          new Notification(count + (count === 1 ? ' new listing' : ' new listings'), {
            body: 'Fresh matches for your watches.',
            tag: 'listing-watcher'
          });
        } catch (e) { /* Some browsers only allow this from a service worker. */ }
      },

      /* ---------------------------------------------------------- the watches */

      newWatch: function (kind) {
        this.editing = {
          id: null,
          kind: kind || 'craigslist',
          name: '',
          colour: this.swatches[this.watches.length % this.swatches.length],
          site: 'sfbay',
          category: 'sss',
          query: '',
          minPrice: '',
          maxPrice: '',
          postal: '',
          distance: '',
          hasImage: false,
          feedUrl: ''
        };
        this.showEditor = true;
      },

      editWatch: function (w) {
        this.editing = Object.assign({}, w);
        this.showEditor = true;
      },

      saveWatch: function () {
        if (!this.canSaveEditor) return;
        var w = Object.assign({}, this.editing);
        w.name = w.name.trim();
        if (w.id) {
          var idx = this.watches.findIndex(function (x) { return x.id === w.id; });
          if (idx !== -1) this.watches.splice(idx, 1, w);
        } else {
          w.id = LW.uid();
          this.watches.push(w);
        }
        this.persist();
        this.showEditor = false;
        this.editing = null;
        this.checkOne(w);
      },

      deleteWatch: function (w) {
        var idx = this.watches.findIndex(function (x) { return x.id === w.id; });
        if (idx === -1) return;
        this.watches.splice(idx, 1);
        delete this.seen[w.id];
        delete this.status[w.id];
        this.items = this.items.filter(function (i) { return i.watchId !== w.id; });
        if (this.activeId === w.id) this.activeId = 'all';
        this.persist();
        this.say('Watch removed.');
      },

      /* ------------------------------------------------------------ checking */

      checkAll: function () {
        if (!this.watches.length || this.checking) return;
        var self = this;
        this.checking = true;
        var before = this.newCount;
        Promise.all(this.watches.map(function (w) { return self.checkOne(w, true); }))
          .then(function () {
            self.checking = false;
            self.lastChecked = Date.now();
            var gained = self.newCount - before;
            if (gained > 0) self.notify(gained);
          });
      },

      checkOne: function (w, quiet) {
        var self = this;
        var url = LW.watchUrl(w);
        if (!url) return Promise.resolve();

        this.status[w.id] = { state: 'checking', message: 'Checking…' };

        return LW.fetchUrl(url, this.settings.proxy)
          .then(function (text) {
            var parsed = LW.parseFeed(text);
            self.absorb(w, parsed);
            self.status[w.id] = { state: 'ok', message: parsed.length + ' listings' };
          })
          .catch(function (err) {
            // A cross-origin block surfaces as a TypeError with no status, which
            // is indistinguishable from being offline, so say what is most
            // likely and what to do rather than printing the raw error.
            var blocked = err instanceof TypeError;
            self.status[w.id] = {
              state: 'blocked',
              message: blocked
                ? 'Your browser blocked this read'
                : err.message
            };
            if (!quiet && blocked) {
              self.say('The browser blocked that read. Set a proxy in settings, or open the search directly.');
            }
          });
      },

      // Merge a fetch into the list, marking anything not already recorded for
      // this watch as new. First sight is stored so "new" survives a reload.
      absorb: function (w, parsed) {
        var seenForWatch = this.seen[w.id] || (this.seen[w.id] = {});
        var firstEver = Object.keys(seenForWatch).length === 0;
        var self = this;

        var fresh = parsed.map(function (item) {
          var isNew = !seenForWatch[item.key];
          if (isNew) seenForWatch[item.key] = Date.now();
          return Object.assign({}, item, {
            watchId: w.id,
            watchName: w.name,
            colour: w.colour,
            // On the very first fetch everything is technically unseen, and
            // flagging all of it as new is noise rather than news.
            isNew: isNew && !firstEver
          });
        });

        this.items = this.items
          .filter(function (i) { return i.watchId !== w.id; })
          .concat(fresh);
        this.persist();
      },

      markAllRead: function () {
        this.items.forEach(function (i) { i.isNew = false; });
      },

      openWatch: function (w) {
        window.open(LW.watchUrl(w), '_blank', 'noopener');
      },

      /* ------------------------------------------------------------ settings */

      clearEverything: function () {
        if (!window.confirm('Delete every watch, all settings and the record of what you have seen? This cannot be undone.')) return;
        try { localStorage.removeItem(LW.STORE); } catch (e) { /* nothing to do */ }
        var fresh = LW.blank();
        this.watches = fresh.watches;
        this.seen = fresh.seen;
        this.settings = fresh.settings;
        this.items = [];
        this.status = {};
        this.activeId = 'all';
        this.showSettings = false;
        this.applyTheme();
        this.applyScale();
        this.say('Everything cleared.');
      },

      money: function (price) {
        if (!price) return '';
        return price.symbol + price.amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
      }
    }
  }).mount('#app');
})();
