const { createApp } = Vue;

createApp({
    data() {
        return {
            mode: 'encode',
            // encode
            originalImage: null,
            encodedImage: null,
            secretMessage: '',
            encW: 0, encH: 0, encName: '',
            dragEnc: false,
            // decode
            decodeImage: null,
            decodedMessage: '',
            decodedTimestamp: '',
            decodeError: '',
            decName: '',
            dragDec: false,
            // ui
            processing: false,
            copied: false,
            announcement: ''
        };
    },

    computed: {
        // Each pixel hides 3 bits (R,G,B LSB). Reserve the 32-bit
        // terminator plus the "length:timestamp|" framing overhead.
        capacity() {
            if (!this.encW || !this.encH) return 0;
            const bits = this.encW * this.encH * 3 - 32;
            const chars = Math.floor(bits / 8);
            // overhead: 24-char ISO timestamp + '|' + "NNN:" length prefix (~6)
            return Math.max(0, chars - 31);
        },
        overCapacity() {
            return !!this.originalImage && this.secretMessage.length > this.capacity;
        },
        canEncode() {
            return !!this.originalImage && this.secretMessage.trim().length > 0 &&
                   !this.overCapacity && !this.processing;
        }
    },

    methods: {
        setMode(m) {
            this.mode = m;
            this.announcement = m === 'encode' ? 'Hide mode' : 'Reveal mode';
        },

        announce(msg) { this.announcement = msg; },

        // ---------- file intake ----------
        readImage(file, cb) {
            const reader = new FileReader();
            reader.onload = (e) => cb(e.target.result);
            reader.readAsDataURL(file);
        },

        handleImageUpload(event) {
            const file = event.target.files[0];
            if (file && file.type.match('image.*')) this.acceptEncodeFile(file);
        },
        dropEncode(event) {
            this.dragEnc = false;
            const file = event.dataTransfer.files[0];
            if (file && file.type.match('image.*')) this.acceptEncodeFile(file);
        },
        acceptEncodeFile(file) {
            this.encName = file.name;
            this.readImage(file, (src) => {
                const img = new Image();
                img.onload = () => {
                    this.encW = img.width;
                    this.encH = img.height;
                    this.originalImage = src;
                    this.encodedImage = null;
                    this.announce('Picture added, ' + img.width + ' by ' + img.height + ' pixels.');
                };
                img.src = src;
            });
        },

        handleDecodeImageUpload(event) {
            const file = event.target.files[0];
            if (file) this.acceptDecodeFile(file);
        },
        dropDecode(event) {
            this.dragDec = false;
            const file = event.dataTransfer.files[0];
            if (file) this.acceptDecodeFile(file);
        },
        loadSample() {
            this.decodeError = '';
            this.processing = true;
            fetch('/assets/images/apps/secret-message-sample.png')
                .then((res) => {
                    if (!res.ok) throw new Error('http ' + res.status);
                    return res.blob();
                })
                .then((blob) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.decodeImage = e.target.result;
                        this.decName = 'sample-with-a-secret.png';
                        this.decodedMessage = '';
                        this.decodedTimestamp = '';
                        this.processing = false;
                        this.announce('Sample picture loaded. Press "Reveal hidden message" to read it.');
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(() => {
                    this.processing = false;
                    this.decodeError = 'Could not load the sample picture. Check your connection and try again.';
                    this.announce(this.decodeError);
                });
        },

        acceptDecodeFile(file) {
            if (!file.type.match('image/png')) {
                this.decodeError = 'Please upload a PNG. Only PNG files keep the hidden message intact.';
                this.announce(this.decodeError);
                return;
            }
            this.decName = file.name;
            this.readImage(file, (src) => {
                this.decodeImage = src;
                this.decodedMessage = '';
                this.decodedTimestamp = '';
                this.decodeError = '';
            });
        },

        // ---------- encode (LSB steganography, unchanged algorithm) ----------
        async encodeMessage() {
            if (!this.canEncode) return;
            this.processing = true;

            try {
                const canvas = this.$refs.encodeCanvas;
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Frame as: "<byteLength>:<timestamp>|<message>", encoded as
                    // UTF-8 bytes so emoji and accented characters survive intact.
                    // (Pure-ASCII output is byte-identical to the old format.)
                    const timestamp = new Date().toISOString();
                    const payloadBytes = new TextEncoder().encode(`${timestamp}|${this.secretMessage}`);
                    const headerBytes = new TextEncoder().encode(`${payloadBytes.length}:`);
                    const allBytes = new Uint8Array(headerBytes.length + payloadBytes.length);
                    allBytes.set(headerBytes, 0);
                    allBytes.set(payloadBytes, headerBytes.length);

                    let binaryMessage = '';
                    for (let i = 0; i < allBytes.length; i++) {
                        binaryMessage += allBytes[i].toString(2).padStart(8, '0');
                    }

                    binaryMessage += '11111111111111110000000000000000';

                    let messageIndex = 0;
                    for (let i = 0; i < data.length && messageIndex < binaryMessage.length; i += 4) {
                        for (let j = 0; j < 3 && messageIndex < binaryMessage.length; j++) {
                            const bit = parseInt(binaryMessage[messageIndex]);
                            data[i + j] = (data[i + j] & 0xFE) | bit;
                            messageIndex++;
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);
                    this.encodedImage = canvas.toDataURL('image/png');
                    this.processing = false;
                    this.announce('Message hidden. Your picture is ready to download.');
                };

                img.src = this.originalImage;
            } catch (error) {
                console.error('Encoding error:', error);
                this.processing = false;
                this.announce('Something went wrong. Try a different picture.');
            }
        },

        // ---------- decode (unchanged algorithm) ----------
        async decodeMessage() {
            if (!this.decodeImage) return;
            this.processing = true;
            this.decodeError = '';
            this.decodedMessage = '';
            this.decodedTimestamp = '';

            try {
                const canvas = this.$refs.decodeCanvas;
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Read RGB LSBs, assemble bytes, and parse the
                    // "<byteLength>:<payload>" frame, stopping as soon as
                    // the full payload is collected (no need to scan the
                    // whole image). Mirrors the UTF-8 encode format above.
                    let numStr = '';
                    let colonSeen = false;
                    let payloadLen = -1;
                    const payloadBytes = [];
                    let byteAcc = 0, nbits = 0, bad = false;

                    outer:
                    for (let i = 0; i < data.length; i += 4) {
                        for (let j = 0; j < 3; j++) {
                            byteAcc = (byteAcc << 1) | (data[i + j] & 1);
                            if (++nbits === 8) {
                                const b = byteAcc; byteAcc = 0; nbits = 0;
                                if (!colonSeen) {
                                    if (b === 58) { // ':'
                                        payloadLen = parseInt(numStr, 10);
                                        if (!(payloadLen >= 0)) { bad = true; break outer; }
                                        colonSeen = true;
                                        if (payloadLen === 0) break outer;
                                    } else if (b >= 48 && b <= 57) { // 0-9
                                        numStr += String.fromCharCode(b);
                                        if (numStr.length > 9) { bad = true; break outer; }
                                    } else {
                                        bad = true; break outer;
                                    }
                                } else {
                                    payloadBytes.push(b);
                                    if (payloadBytes.length >= payloadLen) break outer;
                                }
                            }
                        }
                    }

                    if (bad || !colonSeen || payloadBytes.length < payloadLen) {
                        this.decodeError = 'No hidden message found in this picture.';
                        this.processing = false;
                        this.announce(this.decodeError);
                        return;
                    }

                    const fullMessage = new TextDecoder().decode(new Uint8Array(payloadBytes));
                    const pipeIndex = fullMessage.indexOf('|');
                    if (pipeIndex !== -1) {
                        const timestamp = fullMessage.substring(0, pipeIndex);
                        const dt = new Date(timestamp);
                        this.decodedTimestamp = isNaN(dt) ? '' : dt.toLocaleString();
                        this.decodedMessage = fullMessage.substring(pipeIndex + 1);
                    } else {
                        this.decodedMessage = fullMessage;
                    }

                    if (!this.decodedMessage) {
                        this.decodeError = 'No hidden message found in this picture.';
                        this.announce(this.decodeError);
                    } else {
                        this.announce('Message revealed.');
                    }

                    this.processing = false;
                };

                img.src = this.decodeImage;
            } catch (error) {
                console.error('Decoding error:', error);
                this.decodeError = 'Could not read this picture. It may not contain a hidden message.';
                this.processing = false;
                this.announce(this.decodeError);
            }
        },

        // ---------- outputs ----------
        downloadEncodedImage() {
            const link = document.createElement('a');
            link.download = `secret-message-${Date.now()}.png`;
            link.href = this.encodedImage;
            link.click();
            this.announce('Picture downloaded.');
        },

        copyToClipboard() {
            const done = () => {
                this.copied = true;
                this.announce('Message copied to clipboard.');
                clearTimeout(this._copyT);
                this._copyT = setTimeout(() => { this.copied = false; }, 2000);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(this.decodedMessage).then(done).catch(() => {
                    this.announce('Copy failed, select the text and copy manually.');
                });
            }
        },

        resetEncoder() {
            this.originalImage = null;
            this.encodedImage = null;
            this.secretMessage = '';
            this.encW = 0; this.encH = 0; this.encName = '';
            if (this.$refs.imageInput) this.$refs.imageInput.value = '';
        },

        resetDecoder() {
            this.decodeImage = null;
            this.decodedMessage = '';
            this.decodedTimestamp = '';
            this.decodeError = '';
            this.decName = '';
            if (this.$refs.decodeInput) this.$refs.decodeInput.value = '';
        }
    }
}).mount('#main-content');
