var CRYPTO_OK = !!(window.crypto && window.crypto.subtle);
if (typeof Vue === 'undefined' || typeof Peer === 'undefined' || !CRYPTO_OK) {
    document.getElementById('load-fallback').hidden = false;
    throw new Error('Missing Vue, PeerJS, or Web Crypto (needs a secure https context)');
}
const { createApp } = Vue;
const enc = new TextEncoder();
const dec = new TextDecoder();

/* Read-aloud-friendly word list for the safety phrase (64 words). Modulo
   mapping, so exact count isn't load-bearing, it's just entropy per word. */
const WORDS = [
    'anchor','bishop','cactus','dragon','ember','falcon','garden','harbor',
    'island','jungle','kettle','lantern','meadow','needle','orchard','pebble',
    'quartz','ribbon','saddle','temple','umbra','velvet','walnut','yonder',
    'acorn','basil','cobalt','dapple','echo','fable','glacier','hazel',
    'indigo','jasper','kelp','lilac','marble','nectar','opal','pepper',
    'quill','raven','sable','thistle','ultra','violet','willow','zephyr',
    'amber','birch','cedar','dune','elm','fern','grove','heron',
    'ivy','juniper','koala','lotus','maple','onyx','palm','reed'
];

function bufToB64(buf) {
    const a = new Uint8Array(buf); let s = '';
    for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
}
function b64ToBuf(str) {
    const bin = atob(str); const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a.buffer;
}
function cmpBytes(a, b) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) { if (a[i] !== b[i]) return a[i] - b[i]; }
    return a.length - b.length;
}

/* Length hiding: pad every message to a fixed bucket BEFORE encrypting, so
   an eavesdropper watching the encrypted channel can't tell a one-word reply
   from a paragraph, they all look the same size. A 4-byte length header lets
   the recipient trim the random padding back off after decrypting. */
const PAD_BUCKETS = [1024, 4096, 16384];
function padFrame(bytes) {
    const need = 4 + bytes.length;
    let size = PAD_BUCKETS.find(b => b >= need);
    if (!size) size = Math.ceil(need / 16384) * 16384;
    const out = new Uint8Array(size);
    new DataView(out.buffer).setUint32(0, bytes.length, false);
    out.set(bytes, 4);
    if (need < size) crypto.getRandomValues(out.subarray(need)); // random filler
    return out;
}
function unpadFrame(bytes) {
    if (bytes.length < 4) throw new Error('short frame');
    const len = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, false);
    if (len > bytes.length - 4) throw new Error('bad frame length');
    return bytes.slice(4, 4 + len);
}

createApp({
    data() {
        return {
            ready: false,           // crypto keys generated
            readyError: '',
            screen: 'start',
            isHost: true,
            myName: '',
            theirName: '',
            // net
            peer: null, conn: null, peerId: '', joinId: '',
            connecting: false, connected: false, netError: '', guestArrived: false,
            copied: false, copyTimer: null,
            // crypto
            keyPair: null, myPubB64: '', theirPubBuf: null,
            aesKey: null, secured: false, safetyWords: [], verified: false,
            // chat
            messages: [], draft: '', msgId: 1,
            theirTyping: false, theirTypingTimer: null,
            lastTypingSent: 0,
            sendTyping: true,   // broadcast my "…is typing", off = quieter footprint
            dataChain: null,
            announcement: ''
        };
    },
    computed: {
        inviteLink() { return window.location.origin + window.location.pathname + '?chat=' + this.peerId; }
    },
    async mounted() {
        try {
            await this.regenKeys();
            this.ready = true;
        } catch (e) {
            this.readyError = 'Your browser blocked the encryption tools this needs. Try a current Chrome, Firefox, Safari, or Edge over https.';
        }
        const params = new URLSearchParams(window.location.search);
        const cid = params.get('chat');
        if (cid) { this.joinId = cid; this.screen = 'join'; }
        window.addEventListener('beforeunload', this.cleanup);
    },
    beforeUnmount() {
        this.cleanup();
        window.removeEventListener('beforeunload', this.cleanup);
    },
    methods: {
        announce(m) { this.announcement = ''; this.$nextTick(() => { this.announcement = m; }); },

        /* ---------- crypto ---------- */
        async regenKeys() {
            // Fresh ephemeral keypair for EACH conversation, so keys really are
            // per-conversation (forward secrecy), never reused across sessions.
            this.keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
            const raw = await crypto.subtle.exportKey('raw', this.keyPair.publicKey);
            this.myPubB64 = bufToB64(raw);
        },
        async deriveSharedKey() {
            const peerPub = await crypto.subtle.importKey('raw', this.theirPubBuf, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
            const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peerPub }, this.keyPair.privateKey, 256);
            const hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
            this.aesKey = await crypto.subtle.deriveKey(
                { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode('coffeeandfun/private-line/v1') },
                hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
            await this.computeSafety(new Uint8Array(bits));
            this.secured = true;
            this.announce('The line is now encrypted. Check the safety phrase with the other person.');
        },
        async computeSafety(sharedBits) {
            // Bind the phrase to BOTH public keys AND the agreed shared secret,
            // so forging a matching phrase costs an ECDH per attempt (not just a
            // hash), and show 10 words (~60 bits) so a live man-in-the-middle
            // can't feasibly grind a collision during a handshake.
            const mine = new Uint8Array(b64ToBuf(this.myPubB64));
            const theirs = new Uint8Array(this.theirPubBuf);
            const [x, y] = cmpBytes(mine, theirs) <= 0 ? [mine, theirs] : [theirs, mine];
            const cat = new Uint8Array(x.length + y.length + sharedBits.length);
            cat.set(x, 0); cat.set(y, x.length); cat.set(sharedBits, x.length + y.length);
            const h = new Uint8Array(await crypto.subtle.digest('SHA-256', cat));
            const w = [];
            for (let i = 0; i < 10; i++) w.push(WORDS[h[i] % WORDS.length]);
            this.safetyWords = w;
        },
        async encryptText(text) {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const framed = padFrame(enc.encode(text)); // pad to a fixed size first
            const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.aesKey, framed);
            return { iv: bufToB64(iv.buffer), ct: bufToB64(ct) };
        },
        async decryptText(ivB64, ctB64) {
            const iv = new Uint8Array(b64ToBuf(ivB64));
            const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.aesKey, b64ToBuf(ctB64));
            return dec.decode(unpadFrame(new Uint8Array(buf)));
        },

        /* ---------- PeerJS ---------- */
        peerConfig() {
            return { config: { iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ] } };
        },
        async startHost() {
            if (!this.ready) return;
            this.cleanup();
            await this.regenKeys();
            this.isHost = true; this.netError = ''; this.peerId = ''; this.guestArrived = false;
            this.screen = 'lobby';
            this.peer = new Peer(this.peerConfig());
            this.peer.on('open', (id) => {
                this.peerId = id;
                try {
                    const url = new URL(window.location);
                    url.searchParams.set('chat', id);
                    window.history.replaceState({}, document.title, url.toString());
                } catch (e) {}
            });
            this.peer.on('connection', (incoming) => {
                // Single-use link: one guest, ever. Once someone has arrived this
                // room is spent, no one can rejoin or take their place. The guard
                // is re-checked at 'open' too, so two peers racing before either
                // opens can't both slip through and clobber the session.
                if (this.guestArrived || this.conn) { incoming.close(); return; }
                incoming.on('open', () => {
                    if (this.guestArrived || this.conn) { incoming.close(); return; }
                    this.conn = incoming;
                    this.onConnected();
                });
            });
            this.peer.on('error', (err) => this.netFail(err));
            this.peer.on('disconnected', () => { if (this.peer && !this.peer.destroyed) this.peer.reconnect(); });
        },
        async connectToHost() {
            if (!this.ready || !this.joinId.trim()) return;
            this.cleanup();
            await this.regenKeys();
            this.isHost = false; this.netError = ''; this.connecting = true;
            this.peer = new Peer(this.peerConfig());
            const timeout = setTimeout(() => { if (this.connecting) this.netFail({ type: 'timeout' }); }, 25000);
            this.peer.on('open', () => {
                this.conn = this.peer.connect(this.joinId.trim(), { reliable: true });
                if (!this.conn) { clearTimeout(timeout); this.netFail({ type: 'network' }); return; }
                this.conn.on('open', () => { clearTimeout(timeout); this.connecting = false; this.onConnected(); });
                this.conn.on('error', (err) => { clearTimeout(timeout); this.netFail(err); });
            });
            this.peer.on('error', (err) => { clearTimeout(timeout); this.netFail(err); });
        },
        onConnected() {
            this.connected = true;
            if (this.isHost) this.guestArrived = true; // burn the single-use link
            // Drop ?chat=<id> from the address bar now that the link is spent 
            // keeps the ephemeral room id out of browser history.
            try {
                const url = new URL(window.location);
                if (url.searchParams.has('chat')) {
                    url.searchParams.delete('chat');
                    window.history.replaceState({}, document.title, url.toString());
                }
            } catch (e) {}
            this.screen = 'chat';
            this.messages = [];
            this.secured = false; this.verified = false; this.aesKey = null; this.theirPubBuf = null;
            this.conn.on('data', (d) => this.handleData(d));
            this.conn.on('close', () => this.onPeerLeft());
            this.conn.on('error', () => this.onPeerLeft());
            // send our public key + name to start the handshake
            this.conn.send({ t: 'hello', pub: this.myPubB64, name: (this.myName || 'Anonymous').slice(0, 24) });
        },
        handleData(d) {
            // Process frames strictly in order: a 'msg' that arrives while the
            // 'hello' handshake is still deriving the key waits its turn instead
            // of racing ahead and being dropped before aesKey exists.
            this.dataChain = (this.dataChain || Promise.resolve())
                .then(() => this.handleFrame(d)).catch(() => {});
        },
        async handleFrame(d) {
            if (!d || typeof d.t !== 'string') return;
            if (d.t === 'hello') {
                if (this.secured || this.theirPubBuf) return; // one handshake only
                this.theirName = String(d.name || 'Anonymous').slice(0, 24);
                try {
                    this.theirPubBuf = b64ToBuf(String(d.pub));
                    await this.deriveSharedKey();
                    this.$nextTick(() => { if (this.$refs.composer) this.$refs.composer.focus(); });
                } catch (e) {
                    this.theirPubBuf = null; // let a fresh hello retry instead of wedging
                    this.pushSystem('Couldn’t set up encryption with the other side. Try leaving and reconnecting.');
                }
            } else if (d.t === 'msg') {
                if (!this.aesKey) return;
                try {
                    const text = await this.decryptText(String(d.iv), String(d.ct));
                    this.pushMessage('theirs', text);
                    this.theirTyping = false;
                } catch (e) {
                    this.pushSystem('A message couldn’t be decrypted, it may have been tampered with.');
                }
            } else if (d.t === 'typing') {
                this.theirTyping = true;
                if (this.theirTypingTimer) clearTimeout(this.theirTypingTimer);
                this.theirTypingTimer = setTimeout(() => { this.theirTyping = false; }, 2600);
            }
        },
        onPeerLeft() {
            if (!this.connected) return;
            this.connected = false;
            this.theirTyping = false;
            if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
            // The system bubble lands in the role=log live region, so it's
            // already announced, no separate announce() (avoids double-speak).
            this.pushSystem((this.theirName || 'They') + ' left. This line is closed.');
        },

        /* ---------- messages ---------- */
        pushMessage(kind, text) {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            this.messages.push({ id: this.msgId++, kind, text, time });
            this.scrollLog();
        },
        pushSystem(text) {
            this.messages.push({ id: this.msgId++, kind: 'system', text, time: '' });
            this.scrollLog();
        },
        scrollLog() {
            this.$nextTick(() => { const el = this.$refs.log; if (el) el.scrollTop = el.scrollHeight; });
        },
        async sendMessage() {
            const text = this.draft.trim();
            if (!text || !this.connected || !this.secured) return;
            if (text.length > 4000) { this.pushSystem('That message is too long to send in one go.'); return; }
            this.draft = '';
            this.$nextTick(() => { const el = this.$refs.composer; if (el) el.style.height = 'auto'; });
            try {
                const packet = await this.encryptText(text);
                this.conn.send({ t: 'msg', iv: packet.iv, ct: packet.ct });
                this.pushMessage('mine', text);
            } catch (e) {
                this.pushSystem('That message couldn’t be sent. The line may have dropped.');
            }
        },
        onComposerKey(e) {
            // e.isComposing / keyCode 229 guards against committing an IME
            // candidate (CJK, etc.) being read as "send".
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
                e.preventDefault(); this.sendMessage();
            }
        },
        onType() {
            this.autoGrow();
            if (!this.sendTyping) return; // typing indicator gated off
            if (!this.connected || !this.secured || !this.conn || !this.conn.open) return;
            const now = Date.now();
            if (now - this.lastTypingSent > 1500) {
                this.lastTypingSent = now;
                try { this.conn.send({ t: 'typing' }); } catch (e) {}
            }
        },
        onTypingToggle() {
            this.announce(this.sendTyping
                ? 'They can now see when you’re typing.'
                : 'Turned off. They can no longer see when you’re typing.');
        },
        autoGrow() {
            this.$nextTick(() => {
                const el = this.$refs.composer;
                if (!el) return;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 140) + 'px';
            });
        },
        markVerified() { this.verified = true; this.announce('Safety phrase marked as verified.'); },

        /* ---------- lifecycle ---------- */
        copyInvite() {
            navigator.clipboard.writeText(this.inviteLink).then(() => {
                this.copied = true; this.announce('Invite link copied.');
                if (this.copyTimer) clearTimeout(this.copyTimer);
                this.copyTimer = setTimeout(() => { this.copied = false; }, 2000);
            }).catch(() => { this.announce('Copy didn’t work, select the link and copy it yourself.'); });
        },
        netFail(err) {
            this.connecting = false;
            const t = err && err.type;
            if (t === 'peer-unavailable') this.netError = 'No room found with that code, double-check the invite link.';
            else if (t === 'timeout') this.netError = 'Couldn’t reach them, the room may have closed.';
            else if (t === 'network') this.netError = 'Network hiccup, check your connection and try again.';
            else this.netError = 'The connection failed. Try again in a moment.';
            this.announce(this.netError);
        },
        cleanup() {
            if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
            if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
        },
        leaveChat() {
            this.cleanup();
            this.backToStart();
            this.announce('You left the chat. Everything from it is gone.');
        },
        backToStart() {
            this.cleanup();
            this.screen = 'start';
            this.connected = false; this.connecting = false; this.secured = false; this.verified = false;
            this.aesKey = null; this.theirPubBuf = null; this.theirName = ''; this.guestArrived = false;
            this.messages = []; this.draft = ''; this.netError = ''; this.peerId = '';
            try {
                const url = new URL(window.location);
                url.searchParams.delete('chat');
                window.history.replaceState({}, document.title, url.toString());
            } catch (e) {}
        }
    }
}).mount('#app');
