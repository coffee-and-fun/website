/* ============================================================
   Inline container parsers, no CDN parser library needed.
   Everything reads the raw bytes locally:
     - ISO BMFF (MP4 / MOV / M4V / 3GP): boxes, udta, meta/ilst,
       QuickTime keys, GPS (©xyz / ISO 6709), codecs, timestamps
     - RIFF (AVI): LIST INFO tags, IDIT recording date
     - EBML (MKV / WebM): Title, apps, DateUTC, Tags
   Cleaning never re-encodes: metadata boxes are renamed to
   padding (free / JUNK / EBML Void) and their bytes zeroed, so
   every offset in the file stays valid and quality is untouched.
   ============================================================ */

const TD_UTF8 = new TextDecoder('utf-8');

function fourcc(view, off) {
    return String.fromCharCode(view.getUint8(off), view.getUint8(off + 1), view.getUint8(off + 2), view.getUint8(off + 3));
}

function cleanText(s) {
    return s.replace(/\u0000+$/g, '')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
            .trim();
}

function decodeBytes(view, off, len) {
    if (len <= 0 || off < 0 || off + len > view.byteLength) return '';
    try {
        return cleanText(TD_UTF8.decode(new Uint8Array(view.buffer, off, len)));
    } catch (e) {
        return '';
    }
}

/* Mac HFS epoch (1904) → JS date. Returns '' for unset/absurd values. */
function macDate(seconds) {
    if (!seconds) return '';
    const ms = (seconds - 2082844800) * 1000;
    const d = new Date(ms);
    if (isNaN(d) || d.getFullYear() < 1971 || d.getFullYear() > 2200) return '';
    return d.toLocaleString();
}

/* "+37.3349-122.0090+021.000/" → "37.3349° N, 122.0090° W (alt 21 m)" */
function parseIso6709(str) {
    const m = String(str).match(/^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?/);
    if (!m) return '';
    const lat = parseFloat(m[1]);
    const lon = parseFloat(m[2]);
    let out = Math.abs(lat) + '° ' + (lat >= 0 ? 'N' : 'S') + ', ' +
              Math.abs(lon) + '° ' + (lon >= 0 ? 'E' : 'W');
    if (m[3]) out += ' (alt ' + parseFloat(m[3]) + ' m)';
    return out;
}

function sniffContainer(view) {
    if (view.byteLength >= 12 && fourcc(view, 4) === 'ftyp') return 'mp4';
    if (view.byteLength >= 12 && fourcc(view, 0) === 'RIFF') return 'riff';
    if (view.byteLength >= 4 && view.getUint32(0) === 0x1A45DFA3) return 'ebml';
    if (view.byteLength >= 8) {
        const t = fourcc(view, 4);
        if (['moov', 'mdat', 'free', 'skip', 'wide', 'pnot'].indexOf(t) !== -1) return 'mp4'; // bare QuickTime
    }
    return 'unknown';
}

/* ---------------- ISO BMFF (MP4 / MOV) ---------------- */

const BMFF_CONTAINERS = { moov: 1, trak: 1, mdia: 1, minf: 1, stbl: 1, edts: 1, moof: 1, traf: 1, mvex: 1 };

const CC = '©';
const UDTA_TEXT_KEYS = {};
UDTA_TEXT_KEYS[CC + 'nam'] = 'Title';
UDTA_TEXT_KEYS[CC + 'day'] = 'Creation Date';
UDTA_TEXT_KEYS[CC + 'ART'] = 'Artist';
UDTA_TEXT_KEYS[CC + 'art'] = 'Artist';
UDTA_TEXT_KEYS[CC + 'aut'] = 'Author';
UDTA_TEXT_KEYS[CC + 'cmt'] = 'Comment';
UDTA_TEXT_KEYS[CC + 'cpy'] = 'Copyright';
UDTA_TEXT_KEYS[CC + 'des'] = 'Description';
UDTA_TEXT_KEYS[CC + 'too'] = 'Encoder';
UDTA_TEXT_KEYS[CC + 'swr'] = 'Software';
UDTA_TEXT_KEYS[CC + 'mak'] = 'Device Make';
UDTA_TEXT_KEYS[CC + 'mod'] = 'Device Model';
UDTA_TEXT_KEYS[CC + 'gen'] = 'Genre';
UDTA_TEXT_KEYS[CC + 'kew'] = 'Keywords';
UDTA_TEXT_KEYS[CC + 'inf'] = 'Information';

const QT_KEY_MAP = {
    'com.apple.quicktime.make': 'Device Make',
    'com.apple.quicktime.model': 'Device Model',
    'com.apple.quicktime.software': 'Software',
    'com.apple.quicktime.creationdate': 'Creation Date',
    'com.apple.quicktime.title': 'Title',
    'com.apple.quicktime.description': 'Description',
    'com.apple.quicktime.copyright': 'Copyright',
    'com.apple.quicktime.comment': 'Comment',
    'com.apple.quicktime.camera.identifier': 'Camera Identifier',
    'com.apple.quicktime.camera.framereadouttimeinmicroseconds': 'Camera Frame Readout Time'
};

const CODEC_NAMES = {
    avc1: 'H.264 / AVC', avc3: 'H.264 / AVC', hvc1: 'H.265 / HEVC', hev1: 'H.265 / HEVC',
    av01: 'AV1', vp08: 'VP8', vp09: 'VP9', mp4v: 'MPEG-4 Visual', jpeg: 'Motion JPEG',
    mp4a: 'AAC', 'ac-3': 'Dolby AC-3', 'ec-3': 'Dolby E-AC-3', Opus: 'Opus', opus: 'Opus',
    alac: 'Apple Lossless', sowt: 'PCM', twos: 'PCM', lpcm: 'PCM', ulaw: 'µ-law PCM', '.mp3': 'MP3'
};

const BRAND_NAMES = {
    isom: 'MPEG-4', iso2: 'MPEG-4', iso4: 'MPEG-4', iso5: 'MPEG-4', iso6: 'MPEG-4',
    mp41: 'MPEG-4', mp42: 'MPEG-4', 'M4V ': 'MPEG-4 (M4V)', 'M4A ': 'MPEG-4 (M4A)',
    'qt  ': 'QuickTime', '3gp4': '3GPP', '3gp5': '3GPP', '3gp6': '3GPP', '3g2a': '3GPP2',
    avif: 'AVIF', heic: 'HEIC', dash: 'MPEG-DASH'
};

function readBoxHeader(view, off, end) {
    if (off + 8 > end) return null;
    let size = view.getUint32(off);
    const type = fourcc(view, off + 4);
    let header = 8;
    if (size === 1) {
        if (off + 16 > end) return null;
        size = view.getUint32(off + 8) * 4294967296 + view.getUint32(off + 12);
        header = 16;
    } else if (size === 0) {
        size = end - off;
    }
    if (size < header || off + size > end) return null;
    if (!/^[\x20-\x7E©]{4}$/.test(type)) return null;
    return { size: size, type: type, header: header };
}

function parseIsoBmff(buffer) {
    const view = new DataView(buffer);
    const meta = {};
    const notes = [];
    const freeBoxes = [];   // { start, header, end }
    const zeroRanges = [];  // { offset, length }
    const removedLabels = [];
    let sawTimestamps = false;
    let currentHandler = '';

    function addLabel(label) {
        if (removedLabels.indexOf(label) === -1) removedLabels.push(label);
    }

    function udtaText(payload, end) {
        // QuickTime international text: u16 length, u16 language, bytes
        if (end - payload >= 4) {
            const l = view.getUint16(payload);
            if (l === end - payload - 4) return decodeBytes(view, payload + 4, l);
        }
        // iTunes-style 'data' sub-box
        if (end - payload >= 16 && fourcc(view, payload + 4) === 'data') {
            const dsize = view.getUint32(payload);
            if (dsize >= 16 && payload + dsize <= end) return decodeBytes(view, payload + 16, dsize - 16);
        }
        return decodeBytes(view, payload, end - payload);
    }

    function setGps(raw) {
        if (!raw) return;
        meta['com.apple.quicktime.location.ISO6709'] = raw;
        const pretty = parseIso6709(raw);
        if (pretty) meta['GPS Coordinates'] = pretty;
    }

    function setText(name, value) {
        if (value && !meta[name]) meta[name] = value;
    }

    function dataBoxValue(payload, end) {
        // 'data' box: u32 type indicator, u32 locale, then the value
        if (end - payload < 8) return '';
        const kind = view.getUint32(payload);
        const raw = payload + 8;
        const len = end - raw;
        if (kind === 1) return decodeBytes(view, raw, len); // UTF-8
        if (kind === 21 || kind === 22) { // signed / unsigned int
            if (len === 1) return String(view.getUint8(raw));
            if (len === 2) return String(view.getUint16(raw));
            if (len === 4) return String(view.getUint32(raw));
            if (len === 8) return String(view.getUint32(raw) * 4294967296 + view.getUint32(raw + 4));
        }
        if (kind === 23 && len === 4) return String(view.getFloat32(raw));
        if (kind === 24 && len === 8) return String(view.getFloat64(raw));
        return '(binary data, ' + len + ' bytes)';
    }

    function parseIlst(start, end, keysList) {
        let off = start, guard = 0;
        while (off + 8 <= end && guard++ < 2000) {
            const h = readBoxHeaderLoose(off, end);
            if (!h) break;
            const idx = view.getUint32(off + 4);
            let name = '';
            if (keysList && idx >= 1 && idx <= keysList.length) {
                name = keysList[idx - 1];
            } else {
                const t = fourcc(view, off + 4);
                name = UDTA_TEXT_KEYS[t] || t;
            }
            // find the 'data' sub-box
            let inner = off + h.header, value = '';
            let g2 = 0;
            while (inner + 8 <= off + h.size && g2++ < 50) {
                const isize = view.getUint32(inner);
                if (isize < 8 || inner + isize > off + h.size) break;
                if (fourcc(view, inner + 4) === 'data') {
                    value = dataBoxValue(inner + 8, inner + isize);
                    break;
                }
                inner += isize;
            }
            if (name && value) {
                if (name === 'com.apple.quicktime.location.ISO6709') {
                    setGps(value);
                } else {
                    const friendly = QT_KEY_MAP[name] || name;
                    setText(friendly, value);
                }
            }
            off += h.size;
        }
    }

    // ilst children use a 4-byte index or ©-code where the type usually
    // lives, so the printable-type check must be skipped for them.
    function readBoxHeaderLoose(off, end) {
        if (off + 8 > end) return null;
        let size = view.getUint32(off);
        let header = 8;
        if (size === 1) {
            if (off + 16 > end) return null;
            size = view.getUint32(off + 8) * 4294967296 + view.getUint32(off + 12);
            header = 16;
        } else if (size === 0) {
            size = end - off;
        }
        if (size < header || off + size > end) return null;
        return { size: size, header: header };
    }

    function parseMetaBox(payload, end) {
        // FullBox: skip 4 bytes of version/flags, then find keys + ilst
        const start = payload + 4;
        let off = start, guard = 0;
        let keysList = null, ilst = null;
        while (off + 8 <= end && guard++ < 200) {
            const h = readBoxHeader(view, off, end);
            if (!h) break;
            if (h.type === 'keys') {
                keysList = [];
                const count = view.getUint32(off + h.header + 4);
                let ko = off + h.header + 8;
                for (let i = 0; i < count && ko + 8 <= off + h.size; i++) {
                    const ksize = view.getUint32(ko);
                    if (ksize < 8 || ko + ksize > off + h.size) break;
                    keysList.push(decodeBytes(view, ko + 8, ksize - 8));
                    ko += ksize;
                }
            } else if (h.type === 'ilst') {
                ilst = { start: off + h.header, end: off + h.size };
            }
            off += h.size;
        }
        if (ilst) parseIlst(ilst.start, ilst.end, keysList);
    }

    function walkUdta(start, end) {
        let off = start, guard = 0;
        while (off + 8 <= end && guard++ < 500) {
            const h = readBoxHeader(view, off, end);
            if (!h) break;
            const payload = off + h.header;
            const boxEnd = off + h.size;
            if (h.type === CC + 'xyz') {
                if (boxEnd - payload >= 4) {
                    const l = view.getUint16(payload);
                    setGps(decodeBytes(view, payload + 4, Math.min(l, boxEnd - payload - 4)));
                }
            } else if (UDTA_TEXT_KEYS[h.type]) {
                setText(UDTA_TEXT_KEYS[h.type], udtaText(payload, boxEnd));
            } else if (h.type === 'meta') {
                parseMetaBox(payload, boxEnd);
            } else if (h.type === 'Xtra' || h.type === 'xtra') {
                setText('Windows Media Tags', 'Present (' + h.size + ' bytes)');
            } else if (h.type.charCodeAt(0) === 0xA9) {
                setText('udta ' + h.type.slice(1), udtaText(payload, boxEnd));
            }
            off += h.size;
        }
    }

    function fullBoxTimes(payload, boxEnd, label) {
        if (boxEnd - payload < 8) return { creation: 0, modification: 0 };
        const version = view.getUint8(payload);
        let creation = 0, modification = 0, span = 8;
        if (version === 1) {
            if (boxEnd - payload < 20) return { creation: 0, modification: 0 };
            creation = view.getUint32(payload + 4) * 4294967296 + view.getUint32(payload + 8);
            modification = view.getUint32(payload + 12) * 4294967296 + view.getUint32(payload + 16);
            span = 16;
        } else {
            if (boxEnd - payload < 12) return { creation: 0, modification: 0 };
            creation = view.getUint32(payload + 4);
            modification = view.getUint32(payload + 8);
        }
        if (creation || modification) {
            zeroRanges.push({ offset: payload + 4, length: span });
            sawTimestamps = true;
        }
        return { creation: creation, modification: modification };
    }

    function walk(start, end, depth) {
        if (depth > 12) return;
        let off = start, guard = 0;
        while (off + 8 <= end && guard++ < 5000) {
            const h = readBoxHeader(view, off, end);
            if (!h) break;
            const payload = off + h.header;
            const boxEnd = off + h.size;

            if (h.type === 'ftyp') {
                const brand = fourcc(view, payload);
                meta['Container Format'] = (BRAND_NAMES[brand] || 'ISO Media') + ' (' + brand.trim() + ')';
                const brands = [];
                for (let b = payload + 8; b + 4 <= boxEnd; b += 4) brands.push(fourcc(view, b).trim());
                const list = brands.filter(function (x) { return x; }).join(', ');
                if (list) meta['Compatible Brands'] = list;
            } else if (h.type === 'mvhd') {
                const t = fullBoxTimes(payload, boxEnd, 'movie');
                const c = macDate(t.creation);
                const m = macDate(t.modification);
                if (c) meta['Creation Time'] = c;
                if (m && m !== c) meta['Modification Time'] = m;
            } else if (h.type === 'tkhd' || h.type === 'mdhd') {
                fullBoxTimes(payload, boxEnd, h.type);
            } else if (h.type === 'hdlr') {
                if (boxEnd - payload >= 12) currentHandler = fourcc(view, payload + 8);
            } else if (h.type === 'stsd') {
                if (boxEnd - payload >= 16) {
                    const format = fourcc(view, payload + 12);
                    const nice = CODEC_NAMES[format] || format.trim();
                    if (currentHandler === 'vide' && !meta['Video Codec']) meta['Video Codec'] = nice;
                    else if (currentHandler === 'soun' && !meta['Audio Codec']) meta['Audio Codec'] = nice;
                    else if (format === 'gpmd' || currentHandler === 'meta') {
                        meta['Embedded Data Track'] = 'Present (' + (format === 'gpmd' ? 'GoPro GPMF telemetry, may include GPS' : format.trim() || currentHandler) + ')';
                        notes.push('This video carries an embedded telemetry track inside the video stream itself (for example GoPro GPMF, which can include GPS). Blanking tools can’t remove that without re-encoding, so it stays in the clean copy.');
                    }
                }
            } else if (h.type === 'udta') {
                freeBoxes.push({ start: off, header: h.header, end: boxEnd });
                addLabel('User-data atom (udta), device, app and location tags');
                walkUdta(payload, boxEnd);
            } else if (h.type === 'meta') {
                freeBoxes.push({ start: off, header: h.header, end: boxEnd });
                addLabel('Metadata atom (meta / ilst), key-value tags');
                parseMetaBox(payload, boxEnd);
            } else if (h.type === 'uuid') {
                freeBoxes.push({ start: off, header: h.header, end: boxEnd });
                addLabel('Extended (uuid) atom, often XMP metadata');
                setText('XMP / uuid Metadata', 'Present (' + h.size + ' bytes)');
            } else if (BMFF_CONTAINERS[h.type]) {
                if (h.type === 'trak') currentHandler = '';
                walk(payload, boxEnd, depth + 1);
            }
            off += h.size;
        }
    }

    walk(0, buffer.byteLength, 0);
    if (sawTimestamps) addLabel('Recorded & modified timestamps (movie, track and media headers)');

    return { kind: 'mp4', meta: meta, notes: notes, freeBoxes: freeBoxes, zeroRanges: zeroRanges, removedLabels: removedLabels };
}

function applyBmffStrip(bytes, plan) {
    const boxes = plan.freeBoxes.slice().sort(function (a, b) { return a.start - b.start; });
    const kept = [];
    let lastEnd = -1;
    for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].start < lastEnd) continue; // nested inside an already-freed box
        kept.push(boxes[i]);
        lastEnd = boxes[i].end;
    }
    for (let i = 0; i < kept.length; i++) {
        const b = kept[i];
        bytes[b.start + 4] = 0x66; // 'f'
        bytes[b.start + 5] = 0x72; // 'r'
        bytes[b.start + 6] = 0x65; // 'e'
        bytes[b.start + 7] = 0x65; // 'e'
        bytes.fill(0, b.start + b.header, b.end);
    }
    for (let i = 0; i < plan.zeroRanges.length; i++) {
        const r = plan.zeroRanges[i];
        let insideFreed = false;
        for (let k = 0; k < kept.length; k++) {
            if (r.offset >= kept[k].start && r.offset < kept[k].end) { insideFreed = true; break; }
        }
        if (!insideFreed) bytes.fill(0, r.offset, r.offset + r.length);
    }
}

/* ---------------- RIFF (AVI) ---------------- */

const RIFF_INFO_KEYS = {
    INAM: 'Title', IART: 'Artist', ICOP: 'Copyright', ICMT: 'Comment',
    ICRD: 'Creation Date', ISFT: 'Software', IENG: 'Engineer', IGNR: 'Genre',
    ITCH: 'Technician', ISRC: 'Source', IPRD: 'Product', ISBJ: 'Subject', IKEY: 'Keywords'
};

function parseRiff(buffer) {
    const view = new DataView(buffer);
    const meta = {};
    const notes = [];
    const junkChunks = []; // { start, end }, rename to JUNK + zero data
    const removedLabels = [];
    const form = fourcc(view, 8);
    meta['Container Format'] = form === 'AVI ' ? 'AVI (RIFF)' : 'RIFF (' + form.trim() + ')';

    function addLabel(label) {
        if (removedLabels.indexOf(label) === -1) removedLabels.push(label);
    }

    function walkInfo(start, end) {
        let off = start, guard = 0;
        while (off + 8 <= end && guard++ < 200) {
            const id = fourcc(view, off);
            const size = view.getUint32(off + 4, true);
            if (off + 8 + size > end) break;
            const value = decodeBytes(view, off + 8, size);
            if (value) meta[RIFF_INFO_KEYS[id] || ('INFO ' + id)] = value;
            off += 8 + size + (size & 1);
        }
    }

    function walk(start, end, depth) {
        if (depth > 4) return;
        let off = start, guard = 0;
        while (off + 8 <= end && guard++ < 2000) {
            const id = fourcc(view, off);
            const size = view.getUint32(off + 4, true);
            const dataStart = off + 8;
            const dataEnd = dataStart + size;
            if (dataEnd > end) break;
            if (id === 'LIST' && size >= 4) {
                const listType = fourcc(view, dataStart);
                if (listType === 'INFO') {
                    junkChunks.push({ start: off, end: dataEnd });
                    addLabel('INFO block, title, software, dates and credits');
                    walkInfo(dataStart + 4, dataEnd);
                } else {
                    walk(dataStart + 4, dataEnd, depth + 1);
                }
            } else if (id === 'IDIT') {
                const value = decodeBytes(view, dataStart, size);
                if (value) meta['Creation Date'] = value;
                junkChunks.push({ start: off, end: dataEnd });
                addLabel('IDIT chunk, original recording date');
            }
            off = dataEnd + (size & 1);
        }
    }

    const riffEnd = Math.min(view.getUint32(4, true) + 8, buffer.byteLength);
    walk(12, riffEnd, 0);
    return { kind: 'riff', meta: meta, notes: notes, junkChunks: junkChunks, removedLabels: removedLabels };
}

function applyRiffStrip(bytes, plan) {
    const chunks = plan.junkChunks.slice().sort(function (a, b) { return a.start - b.start; });
    let lastEnd = -1;
    for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        if (c.start < lastEnd) continue;
        lastEnd = c.end;
        bytes[c.start] = 0x4A;     // 'J'
        bytes[c.start + 1] = 0x55; // 'U'
        bytes[c.start + 2] = 0x4E; // 'N'
        bytes[c.start + 3] = 0x4B; // 'K'
        bytes.fill(0, c.start + 8, c.end);
    }
}

/* ---------------- EBML (MKV / WebM) ---------------- */

const EBML = {
    HEADER: 0x1A45DFA3, DOCTYPE: 0x4282, SEGMENT: 0x18538067, INFO: 0x1549A966,
    TITLE: 0x7BA9, MUXINGAPP: 0x4D80, WRITINGAPP: 0x5741, DATEUTC: 0x4461, TAGS: 0x1254C367
};

function readVint(view, off, end, isId) {
    if (off >= end) return null;
    const first = view.getUint8(off);
    if (first === 0) return null;
    let mask = 0x80, len = 1;
    while (!(first & mask)) { mask >>= 1; len++; }
    if (len > 8 || off + len > end) return null;
    let value = isId ? first : (first & (mask - 1));
    let allOnes = !isId && (first & (mask - 1)) === (mask - 1);
    for (let i = 1; i < len; i++) {
        const b = view.getUint8(off + i);
        value = value * 256 + b;
        if (b !== 0xFF) allOnes = false;
    }
    return { value: value, len: len, unknown: !isId && allOnes };
}

function parseEbml(buffer) {
    const view = new DataView(buffer);
    const meta = {};
    const notes = [];
    const voidTargets = []; // { start, total }
    const removedLabels = [];

    function addLabel(label) {
        if (removedLabels.indexOf(label) === -1) removedLabels.push(label);
    }

    function eachChild(start, end, cb) {
        let off = start, guard = 0;
        while (off < end && guard++ < 5000) {
            const id = readVint(view, off, end, true);
            if (!id) return;
            const size = readVint(view, off + id.len, end, false);
            if (!size) return;
            const dataStart = off + id.len + size.len;
            const dataEnd = size.unknown ? end : dataStart + size.value;
            if (dataEnd > end) return;
            cb(id.value, off, dataStart, dataEnd);
            off = dataEnd;
        }
    }

    // EBML header → doc type
    const headId = readVint(view, 0, buffer.byteLength, true);
    if (!headId || headId.value !== EBML.HEADER) return { kind: 'ebml', meta: meta, notes: notes, voidTargets: voidTargets, removedLabels: removedLabels };
    const headSize = readVint(view, headId.len, buffer.byteLength, false);
    if (headSize) {
        const hs = headId.len + headSize.len;
        eachChild(hs, Math.min(hs + headSize.value, buffer.byteLength), function (id, elStart, dataStart, dataEnd) {
            if (id === EBML.DOCTYPE) {
                const doc = decodeBytes(view, dataStart, dataEnd - dataStart);
                meta['Container Format'] = doc === 'webm' ? 'WebM (Matroska)' : 'Matroska (' + (doc || 'mkv') + ')';
            }
        });
    }

    eachChild(0, buffer.byteLength, function (id, elStart, dataStart, dataEnd) {
        if (id !== EBML.SEGMENT) return;
        eachChild(dataStart, dataEnd, function (cid, cStart, cDataStart, cDataEnd) {
            if (cid === EBML.INFO) {
                eachChild(cDataStart, cDataEnd, function (iid, iStart, iDataStart, iDataEnd) {
                    const len = iDataEnd - iDataStart;
                    if (iid === EBML.TITLE) {
                        const v = decodeBytes(view, iDataStart, len);
                        if (v) meta['Title'] = v;
                        voidTargets.push({ start: iStart, total: iDataEnd - iStart });
                        addLabel('Title');
                    } else if (iid === EBML.MUXINGAPP) {
                        const v = decodeBytes(view, iDataStart, len);
                        if (v) meta['Muxing Application'] = v;
                    } else if (iid === EBML.WRITINGAPP) {
                        const v = decodeBytes(view, iDataStart, len);
                        if (v) meta['Writing Application'] = v;
                    } else if (iid === EBML.DATEUTC && len === 8) {
                        try {
                            const nanos = view.getBigInt64(iDataStart);
                            const ms = Number(nanos / 1000000n) + Date.UTC(2001, 0, 1);
                            const d = new Date(ms);
                            if (!isNaN(d)) meta['Date Recorded (UTC)'] = d.toLocaleString();
                        } catch (e) { /* BigInt unsupported, skip display, still strippable */ }
                        voidTargets.push({ start: iStart, total: iDataEnd - iStart });
                        addLabel('Recording date (DateUTC)');
                    }
                });
            } else if (cid === EBML.TAGS) {
                meta['Embedded Tags'] = 'Present (' + (cDataEnd - cStart) + ' bytes)';
                voidTargets.push({ start: cStart, total: cDataEnd - cStart });
                addLabel('Tags block, arbitrary key-value tags');
            }
        });
    });

    return { kind: 'ebml', meta: meta, notes: notes, voidTargets: voidTargets, removedLabels: removedLabels };
}

function applyEbmlStrip(bytes, plan) {
    for (let i = 0; i < plan.voidTargets.length; i++) {
        const t = plan.voidTargets[i];
        if (t.total < 2) continue;
        bytes[t.start] = 0xEC; // Void element ID
        let sizeLen = 1;
        while (sizeLen < 8 && (t.total - 1 - sizeLen) > (Math.pow(2, 7 * sizeLen) - 2)) sizeLen++;
        let v = t.total - 1 - sizeLen;
        for (let k = sizeLen - 1; k >= 1; k--) {
            bytes[t.start + 1 + k] = v & 0xFF;
            v = Math.floor(v / 256);
        }
        bytes[t.start + 1] = (0x80 >> (sizeLen - 1)) | v;
        bytes.fill(0, t.start + 1 + sizeLen, t.start + t.total);
    }
}

/* ---------------- Category grouping (regexes preserved) ---------------- */

const CATEGORIES = [
    { name: 'Location', test: /gps|location|latitude|longitude|altitude|position|coordinates/i },
    { name: 'Personal', test: /artist|author|creator|copyright|owner|user|comment|description|publisher|encoded.*by/i },
    { name: 'Date & time', test: /date|time|created|modified|timestamp|recorded/i },
    { name: 'Technical', test: /duration|resolution|bitrate|framerate|codec|format|fps|width|height|aspect|container|quality/i },
    { name: 'Device', test: /device|camera|make|model|manufacturer|brand|hardware|recorder/i }
];

/* ---------------- App ---------------- */

const { createApp } = Vue;

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // ~2 GB, browser memory ceiling for one ArrayBuffer read

createApp({
    data() {
        return {
            file: null,
            fileName: '',
            fileSize: 0,
            fileType: '',
            lastModified: 0,
            previewUrl: '',
            videoInfo: {},          // duration, width, height, bitrate, from the <video> element
            parsedMeta: {},         // real fields read from the container bytes
            parseNotes: [],
            container: '',          // 'mp4' | 'riff' | 'ebml' | 'unknown'
            canRewrite: false,
            planLabels: [],         // human list of what cleaning will blank
            phase: 'idle',          // idle | reading | parsing | ready | cleaning | cleaned
            progress: 0,
            statusText: '',
            errorText: '',
            cleaned: null,          // { blob, name, size, removed, note }
            dragOver: false,
            announcement: ''
        };
    },

    computed: {
        busyReading() {
            return this.phase === 'reading' || this.phase === 'parsing';
        },
        hasResults() {
            return !!this.file && (this.phase === 'ready' || this.phase === 'cleaning' || this.phase === 'cleaned');
        },

        /* One combined view: live file/video facts + fields read from the bytes. */
        metadata() {
            if (!this.file) return {};
            const m = {};
            m['File Name'] = this.fileName;
            m['File Size'] = this.formatFileSize(this.fileSize);
            m['File Type'] = this.fileType || 'unknown';
            m['Last Modified'] = new Date(this.lastModified).toLocaleString();
            if (this.videoInfo.duration) m['Duration'] = this.formatDuration(this.videoInfo.duration);
            if (this.videoInfo.width && this.videoInfo.height) {
                m['Resolution'] = this.videoInfo.width + ' × ' + this.videoInfo.height;
                m['Aspect Ratio'] = (this.videoInfo.width / this.videoInfo.height).toFixed(2);
            }
            if (this.videoInfo.bitrate) {
                m['Estimated Bitrate'] = Math.round(this.videoInfo.bitrate / 1000) + ' kbps';
                if (this.videoInfo.width && this.videoInfo.height) {
                    const perPixel = this.videoInfo.bitrate / (this.videoInfo.width * this.videoInfo.height);
                    m['Estimated Quality'] = perPixel > 0.1 ? 'High' : (perPixel > 0.05 ? 'Medium' : 'Low');
                }
            }
            return Object.assign(m, this.parsedMeta);
        },

        fieldCount() {
            return Object.keys(this.metadata).length;
        },

        hasGpsData() {
            const m = this.metadata;
            return !!(m['GPS'] || m['Location'] || m['Latitude'] || m['Longitude'] ||
                      m['GPS Coordinates'] || m['com.apple.quicktime.location.ISO6709'] ||
                      m['GPS Position'] || m['Tagged GPS']);
        },

        hasPersonalData() {
            const m = this.metadata;
            return !!(m['Artist'] || m['Copyright'] || m['Creator'] || m['Author'] ||
                      m['Device Make'] || m['Device Model'] || m['User Comment'] ||
                      m['Description'] || m['com.apple.quicktime.author'] ||
                      m['com.apple.quicktime.artist'] || m['Encoded by'] || m['Publisher']);
        },

        privacyFindings() {
            const m = this.metadata;
            const out = [];
            if (this.hasGpsData) out.push('GPS coordinates, they reveal exactly where this was recorded.');
            if (this.hasPersonalData) out.push('Personal details, names or other identifying information in the tags.');
            if (m['Device Make'] || m['Device Model']) out.push('Device information, reveals what recorded it.');
            if (m['Software'] || m['Encoder']) out.push('Software information, may reveal the tools that made or edited it.');
            if (m['Creation Time'] || m['Modification Time'] || m['Creation Date'] || m['Date Recorded (UTC)']) out.push('Timestamps, reveal exactly when it was recorded.');
            return out;
        },

        groupedMetadata() {
            const groups = CATEGORIES.map(function (c) { return { name: c.name, rows: [] }; });
            const other = { name: 'Other', rows: [] };
            const entries = Object.entries(this.metadata);
            for (let i = 0; i < entries.length; i++) {
                const key = entries[i][0];
                const row = { key: key, value: this.formatValue(entries[i][1]) };
                let placed = false;
                for (let c = 0; c < CATEGORIES.length; c++) {
                    if (CATEGORIES[c].test.test(key)) {
                        groups[c].rows.push(row);
                        placed = true;
                        break;
                    }
                }
                if (!placed) other.rows.push(row);
            }
            groups.push(other);
            return groups.filter(function (g) { return g.rows.length > 0; });
        },

        cleanExplainer() {
            if (this.canRewrite && this.planLabels.length) {
                return 'One click rewrites the file on your device and blanks: ' +
                       this.planLabels.map(function (l) { return l.split(', ')[0].toLowerCase(); }).join('; ') +
                       '. The video and audio streams aren’t touched or re-encoded.';
            }
            if (this.canRewrite) {
                return 'Good news, we didn’t find any removable metadata atoms in this file. It already looks clean, but you can still download a copy.';
            }
            return 'This file isn’t one we can safely rewrite in the browser, so the fields above are what we could read, and the download will be an unchanged copy of your file.';
        },

        cleanButtonLabel() {
            if (this.canRewrite && this.planLabels.length) return 'Remove metadata';
            return 'Make a copy anyway';
        }
    },

    methods: {
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },

        /* ---------- intake ---------- */
        onFileChange(event) {
            const file = event.target.files[0];
            if (file) this.acceptFile(file);
        },

        onDrop(event) {
            this.dragOver = false;
            const file = event.dataTransfer.files[0];
            if (!file) return;
            if (file.type.indexOf('video/') === 0 || /\.(mp4|mov|m4v|3gp|3g2|webm|mkv|avi)$/i.test(file.name)) {
                this.acceptFile(file);
            } else {
                this.errorText = 'That doesn’t look like a video file. Try an MP4, MOV, WebM, MKV, or AVI.';
                this.announce(this.errorText);
            }
        },

        async acceptFile(file) {
            this.resetState();
            this.file = file;
            this.fileName = file.name;
            this.fileSize = file.size;
            this.fileType = file.type;
            this.lastModified = file.lastModified;
            this.previewUrl = URL.createObjectURL(file);

            if (file.size > MAX_BYTES) {
                this.container = 'unknown';
                this.parsedMeta = this.estimatedMetadata();
                this.parseNotes = ['This file is larger than your browser can safely load into memory in one piece (about 2 GB), so we couldn’t deep-read or clean it. The fields shown are based on the file itself and its type.'];
                this.phase = 'ready';
                this.announce('Video added, but it is too large to deep-read in the browser.');
                return;
            }

            this.phase = 'reading';
            this.statusText = 'Reading the file on your device';
            this.announce('Reading ' + file.name + ' on your device.');

            let buffer;
            try {
                buffer = await this.readFileWithProgress(file);
                if (this.file !== file) return; // user picked another file mid-read
            } catch (e) {
                if (this.file !== file) return;
                console.warn('Read failed:', e);
                this.container = 'unknown';
                this.parsedMeta = this.estimatedMetadata();
                this.parseNotes = ['We couldn’t load the whole file into memory, so the fields shown are estimates based on the file type. Cleaning isn’t available for this file.'];
                this.phase = 'ready';
                this.errorText = 'The file couldn’t be fully read, it may be too large for this browser.';
                return;
            }

            this._buffer = buffer;
            this.phase = 'parsing';
            this.statusText = 'Scanning for metadata';
            this.progress = 0;
            await new Promise((r) => setTimeout(r, 30)); // let the status paint before the scan
            if (this.file !== file) return;

            const view = new DataView(buffer);
            this.container = sniffContainer(view);
            let plan = null;
            try {
                if (this.container === 'mp4') plan = parseIsoBmff(buffer);
                else if (this.container === 'riff') plan = parseRiff(buffer);
                else if (this.container === 'ebml') plan = parseEbml(buffer);
            } catch (e) {
                console.warn('Deep parse failed, falling back to estimates:', e);
                this.container = 'unknown';
                plan = null;
            }

            this._plan = plan;
            if (plan) {
                this.parsedMeta = plan.meta;
                this.parseNotes = plan.notes.slice();
                this.planLabels = plan.removedLabels.slice();
                this.canRewrite = true;
            } else {
                this.parsedMeta = this.estimatedMetadata();
                this.parseNotes = ['We couldn’t deep-read this container, so some fields are estimates based on the file type rather than tags read from the bytes.'];
                this.planLabels = [];
                this.canRewrite = false;
            }

            this.phase = 'ready';
            this.statusText = '';
            this.$nextTick(() => {
                this.announce('Done. Found ' + this.fieldCount + ' metadata fields.' +
                    (this.hasGpsData ? ' Location data was found.' : '') +
                    (this.hasPersonalData ? ' Personal information was found.' : ''));
            });
        },

        readFileWithProgress(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onprogress = (e) => {
                    if (e.lengthComputable) this.progress = Math.round((e.loaded / e.total) * 100);
                };
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error || new Error('read failed'));
                reader.readAsArrayBuffer(file);
            });
        },

        onPreviewMeta(event) {
            const v = event.target;
            const duration = isFinite(v.duration) ? v.duration : 0;
            this.videoInfo = {
                duration: duration,
                width: v.videoWidth,
                height: v.videoHeight,
                bitrate: duration > 0 ? (this.fileSize * 8) / duration : null
            };
        },

        /* Fallback when the container can't be deep-read, the original
           page's extension-based estimates, preserved. */
        estimatedMetadata() {
            const m = {};
            const ext = (this.fileName.split('.').pop() || '').toLowerCase();
            switch (ext) {
                case 'mp4':
                    m['Container Format'] = 'MPEG-4';
                    m['Likely Video Codec'] = 'H.264/AVC';
                    m['Likely Audio Codec'] = 'AAC';
                    break;
                case 'mov':
                    m['Container Format'] = 'QuickTime';
                    m['Likely Video Codec'] = 'H.264/AVC';
                    m['Likely Audio Codec'] = 'AAC';
                    break;
                case 'avi':
                    m['Container Format'] = 'AVI';
                    m['Likely Video Codec'] = 'Various';
                    break;
                case 'mkv':
                    m['Container Format'] = 'Matroska';
                    m['Likely Video Codec'] = 'H.264/H.265';
                    break;
                case 'webm':
                    m['Container Format'] = 'WebM';
                    m['Likely Video Codec'] = 'VP8/VP9';
                    m['Likely Audio Codec'] = 'Vorbis/Opus';
                    break;
            }
            if (ext === 'mov' || ext === 'mp4') {
                m['Potential GPS Data'] = 'May contain location data (common in phone recordings)';
                m['Potential Device Info'] = 'May contain device make/model data';
                m['Privacy Note'] = 'QuickTime/MP4 files often contain detailed metadata';
            }
            return m;
        },

        /* ---------- cleaning ---------- */
        async cleanVideo() {
            if (this.phase === 'cleaning' || !this.file) return;

            // The file never made it into memory (for example, over the ~2 GB
            // ceiling), hand back the original File object as an exact copy.
            if (!this._buffer) {
                this.cleaned = {
                    blob: this.file,
                    name: this.generateCleanFileName(this.fileName),
                    size: this.fileSize,
                    removed: [],
                    note: 'This file couldn’t be rewritten in the browser, so this download is an exact, unchanged copy of your original.'
                };
                this.phase = 'cleaned';
                this.announce('Done. Your copy is ready to download, but its metadata is unchanged.');
                return;
            }

            this.phase = 'cleaning';
            this.statusText = 'Writing a clean copy on your device';
            this.announce('Removing metadata. This can take a moment for big videos.');
            await new Promise((r) => setTimeout(r, 30));

            try {
                const bytes = new Uint8Array(this._buffer.slice(0));
                const plan = this._plan;
                let removed = [];
                let note = '';

                if (plan && plan.kind === 'mp4') {
                    applyBmffStrip(bytes, plan);
                    removed = plan.removedLabels.slice();
                } else if (plan && plan.kind === 'riff') {
                    applyRiffStrip(bytes, plan);
                    removed = plan.removedLabels.slice();
                } else if (plan && plan.kind === 'ebml') {
                    applyEbmlStrip(bytes, plan);
                    removed = plan.removedLabels.slice();
                } else {
                    note = 'This format isn’t one we can rewrite in the browser, so this download is an exact, unchanged copy of your original file.';
                }

                if (plan && removed.length === 0) {
                    note = 'We scanned the whole file and found no removable metadata atoms, this copy is byte-for-byte identical to your original.';
                }

                const blob = new Blob([bytes], { type: this.fileType || 'application/octet-stream' });
                this.cleaned = {
                    blob: blob,
                    name: this.generateCleanFileName(this.fileName),
                    size: blob.size,
                    removed: removed,
                    note: note
                };
                this.phase = 'cleaned';
                this.statusText = '';
                this.announce(removed.length
                    ? 'Done. ' + removed.length + ' kinds of metadata were blanked. Your clean copy is ready to download.'
                    : 'Done. Your copy is ready to download.');
            } catch (e) {
                console.error('Cleaning failed:', e);
                this.phase = 'ready';
                this.statusText = '';
                this.errorText = 'Something went wrong while writing the clean copy. The original file was not changed, you can try again.';
                this.announce(this.errorText);
            }
        },

        downloadClean() {
            if (!this.cleaned) return;
            const url = URL.createObjectURL(this.cleaned.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.cleaned.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.announce('Clean copy downloaded as ' + this.cleaned.name + '.');
        },

        /* ---------- housekeeping ---------- */
        resetState() {
            if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
            this.file = null;
            this.fileName = '';
            this.fileSize = 0;
            this.fileType = '';
            this.lastModified = 0;
            this.previewUrl = '';
            this.videoInfo = {};
            this.parsedMeta = {};
            this.parseNotes = [];
            this.container = '';
            this.canRewrite = false;
            this.planLabels = [];
            this.phase = 'idle';
            this.progress = 0;
            this.statusText = '';
            this.errorText = '';
            this.cleaned = null;
            this._buffer = null;
            this._plan = null;
        },

        reset() {
            this.resetState();
            this.$nextTick(() => {
                if (this.$refs.fileInput) this.$refs.fileInput.value = '';
            });
            this.announce('Cleared. Pick another video when you’re ready.');
        },

        /* ---------- formatting (preserved from the original page) ---------- */
        formatValue(value) {
            if (value === null || value === undefined) return 'N/A';
            const s = String(value);
            return s.length > 150 ? s.substring(0, 150) + '…' : s;
        },

        formatFileSize(bytes) {
            if (!bytes) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        formatDuration(seconds) {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            if (hrs > 0) {
                return hrs + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            }
            return mins + ':' + String(secs).padStart(2, '0');
        },

        generateCleanFileName(originalName) {
            const ext = originalName.split('.').pop();
            const name = originalName.replace(/\.[^/.]+$/, '');
            return name + '_cleaned.' + ext;
        }
    }
}).mount('#main-content');
