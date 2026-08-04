if (typeof Vue === 'undefined') {
    document.getElementById('load-fallback').hidden = false;
    throw new Error('Vue failed to load');
}
const { createApp } = Vue;
const EXIF_OK = typeof ExifReader !== 'undefined';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// How much of you each finding gives away. The list is sorted by this, so the
// thing that can point at your front door is never buried under the name of
// your photo editor. Array#sort is stable, so equal risks keep the order below.
const RISK_RANK = { high: 0, medium: 1, low: 2 };

const GROUP_ORDER = [
    ['gps', 'Location (decoded)'],
    ['exif', 'Photo details (EXIF)'],
    ['jfif', 'JPEG basics (JFIF)'],
    ['xmp', 'Editing info (XMP)'],
    ['iptc', 'Press info (IPTC)'],
    ['icc', 'Color profile (ICC)'],
    ['png', 'PNG details'],
    ['riff', 'WebP details'],
    ['mpf', 'Multi-picture data'],
    ['photoshop', 'Photoshop data'],
    ['Thumbnail', 'Hidden thumbnail'],
    ['file', 'File basics']
];

createApp({
    data() {
        return {
            img: null,
            tags: null,
            exifOk: EXIF_OK,
            readFailed: false,
            dragging: false,
            busy: false,
            cleaned: null,
            error: '',
            announcement: '',
            gen: 0
        };
    },
    computed: {
        findings() {
            if (!this.tags) return [];
            const t = this.tags;
            const out = [];
            const desc = (group, key) => {
                const g = t[group];
                const v = g && g[key];
                return v && v.description !== undefined && v.description !== '' ? String(v.description) : '';
            };

            // Location
            const gps = t.gps;
            if (gps && typeof gps.Latitude === 'number' && typeof gps.Longitude === 'number'
                && (gps.Latitude !== 0 || gps.Longitude !== 0)) {
                const lat = gps.Latitude, lon = gps.Longitude;
                const pretty = Math.abs(lat).toFixed(5) + '° ' + (lat >= 0 ? 'N' : 'S') + ', '
                             + Math.abs(lon).toFixed(5) + '° ' + (lon >= 0 ? 'E' : 'W');
                // The headline is plain words. A decimal coordinate pair is not
                // something a non-technical person can read, so it moves down to
                // the sub line, wording intact, where it still gets indexed.
                let sub = 'It quietly records where it was taken: ' + pretty + '.';
                if (typeof gps.Altitude === 'number' && isFinite(gps.Altitude) && Math.abs(gps.Altitude) > 1) {
                    sub = sub.slice(0, -1) + ', about ' + Math.round(Math.abs(gps.Altitude)) + ' m '
                        + (gps.Altitude >= 0 ? 'above' : 'below') + ' sea level.';
                }
                out.push({
                    kind: 'gps', risk: 'high',
                    text: 'This photo pins the exact spot it was taken.',
                    sub,
                    map: 'https://www.openstreetmap.org/?mlat=' + lat.toFixed(6) + '&mlon=' + lon.toFixed(6) + '&zoom=16'
                });
            }

            // When
            const when = desc('exif', 'DateTimeOriginal') || desc('exif', 'DateTimeDigitized') || desc('exif', 'DateTime');
            if (when) {
                const human = this.humanExifDate(when);
                out.push({ kind: 'date', risk: 'medium', text: human
                    ? 'It says exactly when: ' + human + '.'
                    : 'It carries the exact date and time it was taken.' });
            }

            // Camera
            const make = desc('exif', 'Make'), model = desc('exif', 'Model');
            if (make || model) {
                let cam = model && make && model.toLowerCase().startsWith(make.toLowerCase())
                    ? model : [make, model].filter(Boolean).join(' ');
                const lens = desc('exif', 'LensModel');
                out.push({ kind: 'camera', risk: 'low', text: 'It names the camera: ' + cam + '.', sub: lens ? 'Lens: ' + lens : '' });
            }

            // Software
            const sw = desc('exif', 'Software') || desc('xmp', 'CreatorTool');
            if (sw) out.push({ kind: 'software', risk: 'low', text: 'It admits it was edited: ' + sw + '.' });

            // A person
            const person = desc('exif', 'Artist') || desc('iptc', 'By-line') || desc('xmp', 'creator') || desc('exif', 'Copyright');
            if (person) out.push({ kind: 'person', risk: 'medium', text: 'It carries a name: ' + person + '.' });

            // Hidden thumbnail
            if (t.Thumbnail) {
                out.push({ kind: 'thumb', risk: 'low', text: 'There’s a hidden mini-copy of the photo tucked inside, sometimes an older or uncropped version.' });
            }

            // Worst first. The reader meets the thing that can locate them
            // before the name of the app that touched the file.
            out.sort((a, b) => RISK_RANK[a.risk] - RISK_RANK[b.risk]);
            return out;
        },
        verdictHead() {
            if (!this.exifOk) {
                return 'This page couldn’t load its metadata reader, so it can’t show what’s inside, but the clean copy below still works and still removes everything.';
            }
            if (this.readFailed) {
                return 'This photo’s hidden data couldn’t be read, the file may be unusual or very large. The clean copy below still removes everything.';
            }
            const n = this.findings.length;
            if (n === 0) return 'Good news, this photo keeps its secrets. Nothing personal found inside.';
            if (n === 1) return 'This photo is telling people one thing:';
            const words = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
            return 'This photo is telling people ' + (words[n] || n) + ' things:';
        },
        fieldGroups() {
            if (!this.tags) return [];
            const groups = [];
            for (const pair of GROUP_ORDER) {
                const key = pair[0], label = pair[1];
                const g = this.tags[key];
                if (!g) continue;
                const rows = [];
                for (const name of Object.keys(g)) {
                    if (name === 'image' || name === 'base64') continue; // raw thumbnail bytes
                    const v = g[name];
                    if (typeof v === 'number' && key === 'gps') {
                        // expanded gps group holds computed plain numbers
                        rows.push({ key: name, value: String(Math.round(v * 1e5) / 1e5) });
                        continue;
                    }
                    if (!v || typeof v !== 'object') continue;
                    rows.push({ key: name, value: this.prettyValue(v) });
                }
                if (rows.length) groups.push({ label, rows });
            }
            return groups;
        },
        fieldCount() {
            return this.fieldGroups.reduce((sum, g) => sum + g.rows.length, 0);
        }
    },
    mounted() {
        // Without these, a photo dropped outside the drop zone (or after
        // one is already loaded, the natural "replace it" gesture)
        // navigates the whole tab to the image file.
        this.onDocDragover = (e) => e.preventDefault();
        this.onDocDrop = (e) => {
            e.preventDefault();
            const files = e.dataTransfer && e.dataTransfer.files;
            if (files && files.length) this.accept(files[0], files.length);
        };
        document.addEventListener('dragover', this.onDocDragover);
        document.addEventListener('drop', this.onDocDrop);
    },
    beforeUnmount() {
        document.removeEventListener('dragover', this.onDocDragover);
        document.removeEventListener('drop', this.onDocDrop);
    },
    methods: {
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },
        prettySize(bytes) {
            if (!bytes) return '0 B';
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
            return (bytes / 1048576).toFixed(1) + ' MB';
        },
        prettyType(mime) {
            return ({ 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP' })[mime] || mime;
        },
        prettyValue(v) {
            if (Array.isArray(v.value) && v.value.length > 24) {
                return '[' + v.value.length + ' values of raw data]';
            }
            let s = v.description !== undefined && v.description !== '' ? String(v.description) : String(v.value);
            if (s.length > 140) s = s.slice(0, 140) + '…';
            return s;
        },
        humanExifDate(raw) {
            // EXIF format: 'YYYY:MM:DD HH:MM:SS'
            const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/.exec(raw);
            if (!m) return '';
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
            if (isNaN(d)) return '';
            return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
                 + ' at ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        },
        onPick(e) {
            const files = e.target.files;
            if (files && files.length) this.accept(files[0], files.length);
        },
        onDrop(e) {
            this.dragging = false;
            const files = e.dataTransfer.files;
            if (files && files.length) this.accept(files[0], files.length);
        },
        rejectFile(message) {
            this.error = message;
            this.announce(message);
            const input = this.$refs.fileInput;
            if (input) input.value = ''; // so picking the same file again re-fires change
        },
        async accept(file, count) {
            const gen = ++this.gen; // stale async work checks this before touching state
            this.error = '';
            if (!ALLOWED.includes(file.type)) {
                this.rejectFile(file.type === 'image/heic' || /\.heic$/i.test(file.name)
                    ? 'That’s a HEIC photo, this browser can’t open it here. Export it as a JPEG first.'
                    : 'That doesn’t look like a photo this tool can read, try a JPG, PNG, or WEBP.');
                return;
            }
            const url = URL.createObjectURL(file);
            const probe = new Image();
            const decoded = await new Promise(res => {
                probe.onload = () => res(true);
                probe.onerror = () => res(false);
                probe.src = url;
            });
            if (gen !== this.gen) { URL.revokeObjectURL(url); return; }
            if (!decoded) {
                URL.revokeObjectURL(url);
                this.rejectFile('That photo couldn’t be opened, the file may be damaged. Try another one.');
                return;
            }
            if (this.img) URL.revokeObjectURL(this.img.url);
            this.cleaned = null;
            this.tags = null;
            this.readFailed = false;
            this.img = { file, name: file.name, size: file.size, type: file.type, url, w: probe.naturalWidth, h: probe.naturalHeight };

            if (this.exifOk) {
                let tags = null;
                try {
                    tags = await Promise.race([
                        ExifReader.load(file, { expanded: true }),
                        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
                    ]);
                } catch (err) {
                    tags = null;
                }
                if (gen !== this.gen) return;
                if (tags) {
                    this.tags = tags;
                } else {
                    this.tags = {};
                    this.readFailed = true;
                }
            }

            let summary;
            if (!this.exifOk) {
                summary = 'Photo added. The metadata reader didn’t load, but you can still make a clean copy.';
            } else if (this.readFailed) {
                summary = 'Photo added, but its hidden data couldn’t be read. The clean copy still removes everything.';
            } else if (this.findings.length === 0) {
                summary = 'Photo read. It reveals nothing personal, ' + this.fieldCount + ' fields in all.';
            } else {
                const kinds = { gps: 'your location', date: 'when it was taken', camera: 'your camera', software: 'your editing software', person: 'a name', thumb: 'a hidden thumbnail' };
                const list = this.findings.map(f => kinds[f.kind]).filter(Boolean);
                summary = 'Photo read. It reveals ' + list.join(', ') + ', ' + this.fieldCount + ' fields in all.';
            }
            if (count > 1) summary = 'One photo at a time, reading the first one. ' + summary;
            this.announce(summary);
        },
        async makeClean() {
            if (this.busy || !this.img) return;
            const source = this.img;   // survives a mid-scrub reset/replace
            const gen = this.gen;
            this.busy = true;
            this.error = '';
            this.announce('Removing the hidden data…');
            try {
                const image = new Image();
                await new Promise((res, rej) => {
                    image.onload = res;
                    image.onerror = rej;
                    image.src = source.url;
                });
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                if (!canvas.width || !canvas.height) throw new Error('empty canvas');
                canvas.getContext('2d').drawImage(image, 0, 0);

                // Only two output formats, anything else silently falls back
                // to PNG inside toBlob, which would mislabel the download.
                const outType = source.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                const blob = await new Promise(res => canvas.toBlob(res, outType, 0.95));
                if (gen !== this.gen) { this.busy = false; return; } // photo changed meanwhile
                if (!blob) throw new Error('encode failed');

                const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
                const base = source.name.replace(/\.[^/.]+$/, '') || 'photo';
                this.cleaned = {
                    blob,
                    type: blob.type,
                    name: base + '-clean.' + ext,
                    size: blob.size,
                    changedFormat: blob.type !== source.type
                };
                this.busy = false;
                this.announce('Done. The clean copy is ' + this.prettySize(blob.size) + ' and says nothing at all. The download button is just below.');
            } catch (err) {
                this.busy = false;
                if (gen !== this.gen) return; // user cleared the photo mid-scrub, not an error
                this.error = 'Scrubbing didn’t work, that photo may be too large for this browser. Try a smaller one.';
                this.announce(this.error);
            }
        },
        download() {
            if (!this.cleaned) return;
            const url = URL.createObjectURL(this.cleaned.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.cleaned.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.announce('Downloaded ' + this.cleaned.name + ', the clean copy without the hidden data.');
        },
        reset() {
            this.gen++; // invalidate any in-flight read or scrub
            this.busy = false;
            if (this.img) URL.revokeObjectURL(this.img.url);
            this.img = null;
            this.tags = null;
            this.cleaned = null;
            this.error = '';
            this.announce('Cleared. Drop in the next photo.');
            this.$nextTick(() => {
                const input = document.getElementById('mi-file');
                if (input) { input.value = ''; input.focus(); }
            });
        }
    }
}).mount('#main-content');
