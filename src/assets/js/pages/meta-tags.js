const { createApp } = Vue;

const SAMPLE = {
    title: 'How to brew better coffee at home',
    desc: 'Six small changes that make your morning cup dramatically better, no fancy gear needed.',
    url: 'https://example.com/better-coffee',
    site: 'Example',
    domain: 'example.com',
    crumb: 'https://example.com › better-coffee'
};

const SAMPLE_IMG = 'data:image/svg+xml,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'>" +
    "<rect width='1200' height='630' fill='#3d2b1f'/>" +
    "<circle cx='930' cy='315' r='220' fill='none' stroke='#fef5ec' stroke-width='2.5' opacity='.85'/>" +
    "<circle cx='930' cy='315' r='150' fill='none' stroke='#fef5ec' stroke-width='2.5' opacity='.5'/>" +
    "<circle cx='930' cy='315' r='80' fill='#fef5ec' opacity='.9'/>" +
    "<text x='90' y='320' font-family='Georgia,serif' font-size='58' fill='#fef5ec'>Your picture here</text>" +
    "<text x='92' y='378' font-family='Menlo,monospace' font-size='26' fill='#c9bcae'>1200 × 630 works best</text>" +
    "</svg>"
);

createApp({
    data() {
        return {
            meta: {
                title: '',
                description: '',
                url: '',
                image: '',
                siteName: '',
                handle: '',
                imageAlt: '',
                pageType: 'website'
            },
            previewTab: 'google',
            copied: false,
            copyFailed: false,
            copyTimer: null,
            probeTimer: null,
            announcement: '',
            imgFailed: false,
            imgDims: null
        };
    },
    watch: {
        'meta.image'() {
            this.imgFailed = false;
            this.imgDims = null;
            if (this.probeTimer) clearTimeout(this.probeTimer);
            // Debounced off-DOM probe: measures the picture (for og:image
            // width/height) even when no preview tab is showing an <img>.
            this.probeTimer = setTimeout(() => this.probeImage(), 400);
        }
    },
    computed: {
        cleanTitle() { return this.clean(this.meta.title); },
        cleanDesc() { return this.clean(this.meta.description); },
        cleanUrl() { return this.clean(this.meta.url); },
        cleanImage() { return this.clean(this.meta.image); },
        cleanSite() { return this.clean(this.meta.siteName); },
        cleanAlt() { return this.clean(this.meta.imageAlt); },

        urlObj() { return this.parseHttpUrl(this.cleanUrl); },
        urlOk() { return !!this.urlObj; },
        urlWarning() {
            if (!this.cleanUrl || this.urlOk) return '';
            return 'That doesn’t look like a full web address, it should start with https://';
        },

        imageObj() { return this.parseHttpUrl(this.cleanImage); },
        imageOk() { return !!this.imageObj; },
        imageWarning() {
            if (!this.cleanImage || this.imageOk) return '';
            if (this.cleanImage.toLowerCase().startsWith('data:')) {
                return 'This needs to be a link to a picture that’s already online, social sites can’t read uploaded or pasted image data.';
            }
            return 'That doesn’t look like a full web address, it should start with https://';
        },

        handleClean() {
            let h = this.clean(this.meta.handle);
            h = h.replace(/^(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\//i, '');
            h = h.replace(/[/?#].*$/, '');
            h = h.replace(/^@+/, '');
            return h;
        },
        handleOk() {
            // Reserved X paths, pasting x.com/intent/... or x.com/home would
            // otherwise normalize to a plausible-looking but wrong handle.
            const reserved = ['home', 'search', 'explore', 'intent', 'share', 'hashtag', 'i',
                'notifications', 'messages', 'settings', 'compose', 'login', 'signup', 'about'];
            return /^[A-Za-z0-9_]{1,15}$/.test(this.handleClean)
                && !reserved.includes(this.handleClean.toLowerCase());
        },
        handleWarning() {
            if (!this.clean(this.meta.handle) || this.handleOk) return '';
            return 'That doesn’t look like an X handle, just the username, like yourname.';
        },

        /* ---- Preview values (fall back to the sample, never into the code) ---- */
        pTitle() { return this.cleanTitle || SAMPLE.title; },
        pDesc() { return this.cleanDesc || SAMPLE.desc; },
        pDomain() { return this.urlOk ? this.urlObj.hostname : SAMPLE.domain; },
        pCrumb() {
            if (!this.urlOk) return SAMPLE.crumb;
            const u = this.urlObj;
            const parts = u.pathname.split('/').filter(Boolean).map(p => {
                // A bare % in the path is legal to type but not decodable.
                try { return decodeURIComponent(p); } catch { return p; }
            });
            return [u.protocol + '//' + u.hostname].concat(parts).join(' › ');
        },
        pSite() {
            if (this.cleanSite) return this.cleanSite;
            if (this.urlOk) {
                const label = this.urlObj.hostname.replace(/^www\./, '').split('.')[0];
                return label.charAt(0).toUpperCase() + label.slice(1);
            }
            return SAMPLE.site;
        },
        pMonogram() { return (this.pSite.charAt(0) || 'E').toUpperCase(); },
        pImage() {
            return (this.imageOk && !this.imgFailed) ? this.cleanImage : SAMPLE_IMG;
        },
        usingSample() {
            return !this.cleanTitle || !this.cleanDesc || !this.urlOk || !(this.imageOk && !this.imgFailed);
        },
        // Nothing typed yet. fillExample overwrites four fields with no undo, so
        // the button that calls it is only offered while there is nothing to lose.
        formEmpty() {
            return !this.cleanTitle && !this.cleanDesc && !this.cleanUrl
                && !this.cleanImage && !this.cleanSite;
        },
        sampleNote() {
            return this.formEmpty
                ? 'An example, so you can see what this does'
                : 'Anything you have not filled in is still the example';
        },

        /* ---- Generated code: real input only ---- */
        generatedCode() {
            const esc = (v) => this.escapeHtml(v);
            const t = this.cleanTitle;
            const d = this.cleanDesc;
            // Emit the parser-normalized href, not the raw string, the WHATWG
            // parser quietly accepts forms like "https:/site.com" or paths with
            // spaces, and .href is the corrected version of what was typed.
            const u = this.urlOk ? this.urlObj.href : '';
            const img = this.imageOk ? this.imageObj.href : '';
            const site = this.cleanSite;
            const alt = this.cleanAlt;
            const handle = this.handleOk ? this.handleClean : '';

            if (!t && !d && !u && !img) return '';

            const out = [];

            if (t || d) {
                out.push('<!-- What search engines read -->');
                if (t) out.push('<title>' + esc(t) + '</title>');
                if (d) out.push('<meta name="description" content="' + esc(d) + '">');
            }

            if (u) {
                if (out.length) out.push('');
                out.push('<!-- The official address of this page -->');
                out.push('<link rel="canonical" href="' + esc(u) + '">');
            }

            if (out.length) out.push('');
            out.push('<!-- How Facebook, LinkedIn and iMessage show your link -->');
            out.push('<meta property="og:type" content="' + this.meta.pageType + '">');
            if (u) out.push('<meta property="og:url" content="' + esc(u) + '">');
            if (t) out.push('<meta property="og:title" content="' + esc(t) + '">');
            if (d) out.push('<meta property="og:description" content="' + esc(d) + '">');
            if (site) out.push('<meta property="og:site_name" content="' + esc(site) + '">');
            if (img) {
                out.push('<meta property="og:image" content="' + esc(img) + '">');
                if (this.imgDims) {
                    out.push('<meta property="og:image:width" content="' + this.imgDims.w + '">');
                    out.push('<meta property="og:image:height" content="' + this.imgDims.h + '">');
                }
                if (alt) out.push('<meta property="og:image:alt" content="' + esc(alt) + '">');
            }

            out.push('');
            out.push('<!-- How X (Twitter) shows your link -->');
            out.push('<meta name="twitter:card" content="' + (img ? 'summary_large_image' : 'summary') + '">');
            if (handle) out.push('<meta name="twitter:site" content="@' + handle + '">');
            if (t) out.push('<meta name="twitter:title" content="' + esc(t) + '">');
            if (d) out.push('<meta name="twitter:description" content="' + esc(d) + '">');
            if (img) {
                out.push('<meta name="twitter:image" content="' + esc(img) + '">');
                if (alt) out.push('<meta name="twitter:image:alt" content="' + esc(alt) + '">');
            }

            return out.join('\n');
        },
        hasCode() { return this.generatedCode.length > 0; }
    },
    methods: {
        clean(v) {
            return String(v || '').replace(/\s+/g, ' ').trim();
        },
        escapeHtml(text) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return String(text).replace(/[&<>"']/g, m => map[m]);
        },
        parseHttpUrl(value) {
            if (!value) return null;
            try {
                const u = new URL(value);
                return (u.protocol === 'https:' || u.protocol === 'http:') ? u : null;
            } catch {
                return null;
            }
        },
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },
        onTabKey(e) {
            const order = ['google', 'facebook', 'x'];
            const i = order.indexOf(this.previewTab);
            let next = null;
            if (e.key === 'ArrowRight') next = order[(i + 1) % order.length];
            else if (e.key === 'ArrowLeft') next = order[(i + order.length - 1) % order.length];
            else if (e.key === 'Home') next = order[0];
            else if (e.key === 'End') next = order[order.length - 1];
            if (next) {
                e.preventDefault();
                this.previewTab = next;
                this.$nextTick(() => {
                    const el = document.getElementById('tab-' + next);
                    if (el) el.focus();
                });
            }
        },
        probeImage() {
            const src = this.imageOk ? this.cleanImage : '';
            if (!src) return;
            const probe = new Image();
            probe.onload = () => {
                if (this.cleanImage !== src) return; // stale, field changed since
                this.imgFailed = false;
                // Some SVGs report 0×0 (no intrinsic size), don't emit that.
                this.imgDims = (probe.naturalWidth > 0 && probe.naturalHeight > 0)
                    ? { w: probe.naturalWidth, h: probe.naturalHeight }
                    : null;
            };
            probe.onerror = () => {
                if (this.cleanImage !== src) return;
                this.imgFailed = true;
            };
            probe.src = src;
        },
        onImgError(e) {
            if (e.target.src.startsWith('data:')) return;
            this.imgFailed = true;
        },
        fillExample() {
            this.meta.title = SAMPLE.title;
            this.meta.description = SAMPLE.desc;
            this.meta.url = SAMPLE.url;
            this.meta.siteName = SAMPLE.site;
            this.announce('Example filled in. Add your own preview image link when you’re ready.');
        },
        selectCode() {
            const pre = this.$refs.codePre;
            if (!pre) return;
            const range = document.createRange();
            range.selectNodeContents(pre);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },
        markCopied() {
            this.copied = true;
            this.copyFailed = false;
            this.announce('Code copied to clipboard.');
            if (this.copyTimer) clearTimeout(this.copyTimer);
            this.copyTimer = setTimeout(() => { this.copied = false; }, 2000);
        },
        async copyCode() {
            if (!this.hasCode) return;
            const text = this.generatedCode;
            try {
                await Promise.race([
                    navigator.clipboard.writeText(text),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
                ]);
                this.markCopied();
            } catch {
                this.selectCode();
                let ok = false;
                try { ok = document.execCommand('copy'); } catch { ok = false; }
                if (ok) {
                    this.markCopied();
                } else {
                    this.copyFailed = true;
                    this.announce('Copy didn’t work. The code is selected, press Control C or Command C.');
                }
            }
        }
    }
}).mount('#main-content');
