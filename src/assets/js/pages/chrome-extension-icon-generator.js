const { createApp } = Vue;

createApp({
    data() {
        return {
            image: null,
            fileName: '',
            imgW: 0,
            imgH: 0,
            dragging: false,
            generating: false,
            icons: [],
            zipBusy: false,
            zipError: '',
            copied: false,
            copyFailed: false,
            copyTimer: null,
            announcement: '',
            // Every size a Chrome extension can ask for
            sizes: [16, 19, 32, 38, 48, 64, 128, 512, 1024]
        };
    },

    computed: {
        manifestSnippet() {
            const icons = {};
            this.icons.forEach(icon => {
                icons[icon.size] = 'icons/' + icon.size + '.png';
            });
            return JSON.stringify({ icons: icons }, null, 2);
        },
        sizeBanner() {
            if (!this.image) return null;
            const w = this.imgW, h = this.imgH;
            if (w === 1024 && h === 1024) return null;
            if (w !== h) {
                return {
                    tone: 'warn',
                    text: 'Your picture is ' + w + ' × ' + h + ', not square. Icons are square, so it will be stretched to fit and may look distorted.'
                };
            }
            if (w < 1024) {
                return {
                    tone: 'warn',
                    text: 'Your picture is ' + w + ' × ' + h + '. It will work, but the biggest icons have to be scaled up and may look soft, 1024 × 1024 gives the sharpest results.'
                };
            }
            return {
                tone: 'note',
                text: 'Your picture is ' + w + ' × ' + h + ', bigger than needed, which is great. Every size is scaled down from it.'
            };
        }
    },

    methods: {
        announce(msg) {
            this.announcement = '';
            this.$nextTick(() => { this.announcement = msg; });
        },

        // ---------- file intake ----------
        onFileChange(event) {
            const file = event.target.files[0];
            if (file && file.type.match('image.*')) this.acceptFile(file);
        },
        onDrop(event) {
            this.dragging = false;
            const file = event.dataTransfer.files[0];
            if (file && file.type.match('image.*')) this.acceptFile(file);
        },
        acceptFile(file) {
            this.fileName = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.imgW = img.width;
                    this.imgH = img.height;
                    this.image = e.target.result;
                    this.icons = [];
                    this.zipError = '';
                    this.announce('Picture added, ' + img.width + ' by ' + img.height + ' pixels. Ready to generate.');
                };
                img.onerror = () => {
                    this.announce('That file could not be read as a picture. Try a PNG, JPG, or WEBP.');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        // ---------- generate ----------
        async generate() {
            if (!this.image || this.generating) return;
            this.generating = true;
            this.icons = [];
            this.zipError = '';

            // Let the button repaint into its busy state first
            await new Promise(resolve => setTimeout(resolve, 60));

            const img = new Image();
            img.onload = () => {
                const out = [];
                this.sizes.forEach(size => {
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, size, size);
                    out.push({ size: size, dataUrl: canvas.toDataURL('image/png') });
                });
                this.icons = out;
                this.generating = false;
                this.announce('Done, all ' + out.length + ' sizes are ready to download below.');
            };
            img.onerror = () => {
                this.generating = false;
                this.announce('Something went wrong reading that picture. Try a different file.');
            };
            img.src = this.image;
        },

        // ---------- download all as zip ----------
        async downloadAll() {
            if (!this.icons.length || this.zipBusy) return;
            if (typeof JSZip === 'undefined') {
                this.zipError = 'The zip helper could not load, you can still download each size on its own above.';
                this.announce(this.zipError);
                return;
            }
            this.zipBusy = true;
            this.zipError = '';
            try {
                const zip = new JSZip();
                this.icons.forEach(icon => {
                    zip.file(icon.size + '.png', icon.dataUrl.split(',')[1], { base64: true });
                });
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'extension-icons.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 4000);
                this.announce('Zip downloaded, all ' + this.icons.length + ' sizes in one file.');
            } catch (e) {
                this.zipError = 'Could not build the zip, you can still download each size on its own above.';
                this.announce(this.zipError);
            }
            this.zipBusy = false;
        },

        // ---------- copy manifest snippet ----------
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
            this.announce('Snippet copied to clipboard.');
            if (this.copyTimer) clearTimeout(this.copyTimer);
            this.copyTimer = setTimeout(() => { this.copied = false; }, 2000);
        },
        async copyManifest() {
            if (!this.icons.length) return;
            const text = this.manifestSnippet;
            try {
                await Promise.race([
                    navigator.clipboard.writeText(text),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
                ]);
                this.markCopied();
            } catch (e) {
                this.selectCode();
                let ok = false;
                try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
                if (ok) {
                    this.markCopied();
                } else {
                    this.copyFailed = true;
                    this.announce('Copy didn’t work. The snippet is selected, press Control C or Command C.');
                }
            }
        },

        // ---------- reset ----------
        reset() {
            this.image = null;
            this.fileName = '';
            this.imgW = 0;
            this.imgH = 0;
            this.icons = [];
            this.zipError = '';
            this.copied = false;
            this.copyFailed = false;
            if (this.copyTimer) clearTimeout(this.copyTimer);
            if (this.$refs.fileInput) this.$refs.fileInput.value = '';
            this.announce('Picture removed. Pick a new one to start over.');
        }
    }
}).mount('#main-content');
