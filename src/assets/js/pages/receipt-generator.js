const { createApp } = Vue;

// Code 39 barcode: 9 elements per char (bars/spaces alternating, starts
// with a bar); 'w' = wide, 'n' = narrow. Standard table, scans for real.
const CODE39 = {
    '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
    '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
    '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
    'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw', 'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw',
    'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn',
    'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww', 'L': 'nnwnnnnww',
    'M': 'wnwnnnnwn', 'N': 'nnnnwnnww', 'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn',
    'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
    'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw',
    'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
    '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn'
};

// Returns [{bar: true|false, wide: true|false}, ...] for '*payload*',
// with a narrow gap between characters.
function encodeCode39(payload) {
    const chars = ('*' + payload + '*').split('');
    const elements = [];
    chars.forEach((ch, ci) => {
        const pattern = CODE39[ch];
        if (!pattern) return;
        pattern.split('').forEach((wn, i) => {
            elements.push({ bar: i % 2 === 0, wide: wn === 'w' });
        });
        if (ci < chars.length - 1) elements.push({ bar: false, wide: false });
    });
    return elements;
}

createApp({
    data() {
        return {
            currencies: [
                { code: 'USD', symbol: '$',   decimals: 2 },
                { code: 'EUR', symbol: '€',   decimals: 2 },
                { code: 'GBP', symbol: '£',   decimals: 2 },
                { code: 'CAD', symbol: 'CA$', decimals: 2 },
                { code: 'AUD', symbol: 'A$',  decimals: 2 },
                { code: 'JPY', symbol: '¥',   decimals: 0 }
            ],
            receipt: {
                businessName: '',
                businessAddress: '',
                businessPhone: '',
                businessEmail: '',
                logo: null,
                logoW: 0,
                logoH: 0,
                receiptNumber: '',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash',
                currency: 'USD',
                cashier: '',
                items: [
                    { description: '', quantity: 1, price: null }
                ],
                taxRate: null,
                discountValue: null,
                discountType: 'percent',
                amountPaid: null,
                footerNote: ''
            },
            txnId: '',
            posTime: '',
            barcodeUrl: '',
            totalAnnouncement: '',
            hasSavedBusinessInfo: false,
            toast: ''
        };
    },

    computed: {
        currencyInfo() {
            return this.currencies.find(c => c.code === this.receipt.currency) || this.currencies[0];
        },
        validItems() {
            return this.receipt.items.filter(item =>
                item.description && item.quantity > 0 && item.price > 0
            );
        },
        itemCount() {
            return this.validItems.reduce((n, item) => n + (Number(item.quantity) || 0), 0);
        },
        subtotal() {
            return this.validItems.reduce((sum, item) =>
                sum + (item.quantity * item.price), 0
            );
        },
        discountAmount() {
            const v = Number(this.receipt.discountValue) || 0;
            if (v <= 0) return 0;
            const d = this.receipt.discountType === 'percent'
                ? this.subtotal * (v / 100)
                : v;
            return Math.min(d, this.subtotal);
        },
        taxedBase() {
            return Math.max(0, this.subtotal - this.discountAmount);
        },
        taxAmount() {
            return this.taxedBase * ((Number(this.receipt.taxRate) || 0) / 100);
        },
        total() {
            return this.taxedBase + this.taxAmount;
        },
        changeDue() {
            return (Number(this.receipt.amountPaid) || 0) - this.total;
        },
        absChange() {
            return Math.abs(this.changeDue);
        },
        isValidReceipt() {
            return this.receipt.businessName &&
                   this.receipt.date &&
                   this.validItems.length > 0;
        },
        missingList() {
            const m = [];
            if (!this.receipt.businessName) m.push('a business name');
            if (!this.receipt.date) m.push('a date');
            if (this.validItems.length === 0) m.push('an item with a description and price');
            return m.join(' and ');
        },
        hasContactInfo() {
            return this.receipt.businessPhone || this.receipt.businessEmail;
        },
        receiptDisplayNumber() {
            return this.receipt.receiptNumber || ', ';
        },
        posDate() {
            if (!this.receipt.date) return '--/--/----';
            const d = new Date(this.receipt.date + 'T00:00:00');
            return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        },
        posRegisterLine() {
            const trn = (this.txnId || '').replace(/[^0-9A-F]/gi, '').slice(0, 6);
            const initials = (this.receipt.cashier || '')
                .split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 3);
            return 'REG#01 TRN#' + trn + (initials ? ' CSHR#' + initials : '');
        },
        barcodePayload() {
            const raw = (this.receipt.receiptNumber || this.txnId || 'RCP')
                .toUpperCase().replace(/[^0-9A-Z\-. ]/g, '');
            return raw.slice(0, 16) || 'RCP';
        }
    },

    watch: {
        receipt: {
            deep: true,
            handler() {
                clearTimeout(this._draftTimer);
                this._draftTimer = setTimeout(() => {
                    try {
                        localStorage.setItem('receiptDraft', JSON.stringify(this.receipt));
                    } catch (e) {
                        try {
                            localStorage.setItem('receiptDraft', JSON.stringify({ ...this.receipt, logo: null }));
                        } catch (e2) { /* storage unavailable */ }
                    }
                }, 400);
            }
        },
        total(v) {
            clearTimeout(this._totalTimer);
            this._totalTimer = setTimeout(() => {
                const msg = 'Total ' + this.formatMoney(v);
                if (msg !== this.totalAnnouncement) this.totalAnnouncement = msg;
            }, 1000);
        },
        barcodePayload: {
            immediate: false,
            handler() { this.drawBarcode(); }
        }
    },

    mounted() {
        this.checkSavedBusinessInfo();

        // Restore an unsaved draft, else auto-load remembered business info
        let restored = false;
        try {
            const raw = localStorage.getItem('receiptDraft');
            if (raw) {
                const draft = JSON.parse(raw);
                const meaningful = draft && (draft.businessName ||
                    (draft.items || []).some(i => i.description));
                if (meaningful) {
                    Object.assign(this.receipt, draft);
                    restored = true;
                    this.showToast('Restored your unsaved draft');
                }
            }
        } catch (e) { /* corrupt draft, ignore */ }

        if (!restored && this.hasSavedBusinessInfo && !this.receipt.businessName) {
            this.loadBusinessInfo(true);
        }

        this.initReceiptNumber();
        this.txnId = this.generateTxnId();
        this.posTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.drawBarcode();

        // Initial focus (desktop only, avoids popping the mobile keyboard)
        if (window.matchMedia('(min-width: 768px)').matches) {
            this.$nextTick(() => {
                const target = this.receipt.businessName
                    ? document.getElementById('item-desc-0')
                    : document.getElementById('f-bizname');
                if (target) target.focus();
            });
        }
    },

    methods: {
        focusEl(id) {
            const el = document.getElementById(id);
            if (el) el.focus();
        },

        formatMoney(amount) {
            const c = this.currencyInfo;
            const n = Number(amount) || 0;
            return c.symbol + n.toLocaleString('en-US', {
                minimumFractionDigits: c.decimals,
                maximumFractionDigits: c.decimals
            });
        },

        generateTxnId() {
            const block = () => Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
            return 'TXN ' + block() + '-' + block();
        },

        initReceiptNumber() {
            if (this.receipt.receiptNumber) return;
            let next = 1;
            try {
                next = parseInt(localStorage.getItem('receiptNextNumber') || '1', 10) || 1;
                localStorage.setItem('receiptNextNumber', String(next));
            } catch (e) { next = 1; }
            this.receipt.receiptNumber = 'RCP-' + String(next).padStart(4, '0');
        },

        bumpReceiptNumber() {
            let next = 2;
            try {
                next = (parseInt(localStorage.getItem('receiptNextNumber') || '1', 10) || 1) + 1;
                localStorage.setItem('receiptNextNumber', String(next));
            } catch (e) { next = 2; }
            return 'RCP-' + String(next).padStart(4, '0');
        },

        showToast(msg) {
            this.toast = msg;
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => { this.toast = ''; }, 2800);
        },

        loadExample() {
            this.receipt.businessName = 'Sunrise Coffee Co.';
            this.receipt.businessAddress = '42 Bean Street\nPortland, OR 97201';
            this.receipt.businessPhone = '(503) 555-0142';
            this.receipt.cashier = this.receipt.cashier || 'Sam';
            this.receipt.items = [
                { description: 'Cappuccino (large)', quantity: 2, price: 4.50 },
                { description: 'Blueberry muffin', quantity: 1, price: 3.25 },
                { description: 'Cold brew growler', quantity: 1, price: 14.00 }
            ];
            this.receipt.taxRate = 8.25;
            this.showToast('Example loaded, edit anything, then download');
        },

        drawBarcode() {
            try {
                const elements = encodeCode39(this.barcodePayload);
                if (!elements.length) { this.barcodeUrl = ''; return; }
                const narrow = 2, wide = 6, height = 44, quiet = 20;
                const width = elements.reduce((wsum, el) => wsum + (el.wide ? wide : narrow), 0) + quiet * 2;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fdfcf7';
                ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = '#1a1a1a';
                let x = quiet;
                elements.forEach(el => {
                    const w = el.wide ? wide : narrow;
                    if (el.bar) ctx.fillRect(x, 0, w, height);
                    x += w;
                });
                this.barcodeUrl = canvas.toDataURL('image/png');
            } catch (e) {
                this.barcodeUrl = '';
            }
        },

        handleLogoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                this.showToast('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                this.showToast('Image must be under 5 MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        // Downscale, flatten onto white, and grayscale, thermal
                        // printers are black-and-white, so the receipt logo is too.
                        const maxW = 600;
                        const scale = Math.min(1, maxW / img.naturalWidth);
                        const w = Math.max(1, Math.round(img.naturalWidth * scale));
                        const h = Math.max(1, Math.round(img.naturalHeight * scale));
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, w, h);
                        ctx.filter = 'grayscale(1)';
                        ctx.drawImage(img, 0, 0, w, h);
                        if (ctx.filter !== 'grayscale(1)') {
                            // Older browsers without canvas filters: manual pass
                            const d = ctx.getImageData(0, 0, w, h);
                            for (let i = 0; i < d.data.length; i += 4) {
                                const a = d.data[i + 3] / 255;
                                const l = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
                                const v = Math.round(l * a + 255 * (1 - a));
                                d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
                                d.data[i + 3] = 255;
                            }
                            ctx.putImageData(d, 0, 0);
                        }
                        this.receipt.logo = canvas.toDataURL('image/png');
                        this.receipt.logoW = w;
                        this.receipt.logoH = h;
                    } catch (err) {
                        this.receipt.logo = e.target.result;
                        this.receipt.logoW = img.naturalWidth;
                        this.receipt.logoH = img.naturalHeight;
                    }
                };
                img.onerror = () => this.showToast('Could not read that image');
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        removeLogo() {
            this.receipt.logo = null;
            this.receipt.logoW = 0;
            this.receipt.logoH = 0;
        },

        addItem(focus) {
            this.receipt.items.push({ description: '', quantity: 1, price: null });
            if (focus) {
                this.$nextTick(() => this.focusEl('item-desc-' + (this.receipt.items.length - 1)));
            }
        },

        removeItem(index) {
            this.receipt.items.splice(index, 1);
            this.showToast('Item ' + (index + 1) + ' removed');
            this.$nextTick(() => {
                const target = document.getElementById('item-desc-' + Math.min(index, this.receipt.items.length - 1));
                if (target) target.focus();
                else if (this.$refs.addItemBtn) this.$refs.addItemBtn.focus();
            });
        },

        saveBusinessInfo(silent) {
            const businessInfo = {
                businessName: this.receipt.businessName,
                businessAddress: this.receipt.businessAddress,
                businessPhone: this.receipt.businessPhone,
                businessEmail: this.receipt.businessEmail,
                logo: this.receipt.logo,
                logoW: this.receipt.logoW,
                logoH: this.receipt.logoH,
                currency: this.receipt.currency,
                taxRate: this.receipt.taxRate,
                footerNote: this.receipt.footerNote,
                cashier: this.receipt.cashier
            };
            try {
                localStorage.setItem('receiptBusinessInfo', JSON.stringify(businessInfo));
                this.hasSavedBusinessInfo = true;
                if (!silent) this.showToast('Details remembered on this device');
            } catch (e) {
                if (!silent) this.showToast('Could not save, the logo may be too large');
            }
        },

        loadBusinessInfo(silent) {
            try {
                const saved = localStorage.getItem('receiptBusinessInfo');
                if (saved) {
                    const info = JSON.parse(saved);
                    this.receipt.businessName = info.businessName || '';
                    this.receipt.businessAddress = info.businessAddress || '';
                    this.receipt.businessPhone = info.businessPhone || '';
                    this.receipt.businessEmail = info.businessEmail || '';
                    this.receipt.logo = info.logo || null;
                    this.receipt.logoW = info.logoW || 0;
                    this.receipt.logoH = info.logoH || 0;
                    if (info.currency) this.receipt.currency = info.currency;
                    if (info.taxRate != null) this.receipt.taxRate = info.taxRate;
                    if (info.footerNote) this.receipt.footerNote = info.footerNote;
                    if (info.cashier) this.receipt.cashier = info.cashier;
                    if (!silent) this.showToast('Loaded your saved details');
                }
            } catch (e) {
                if (!silent) this.showToast('Could not load saved info');
            }
        },

        checkSavedBusinessInfo() {
            try {
                this.hasSavedBusinessInfo = !!localStorage.getItem('receiptBusinessInfo');
            } catch (e) {
                this.hasSavedBusinessInfo = false;
            }
        },

        // ====== PDF: real 80mm thermal receipt, two-pass layout ======
        generatePDF() {
            if (!this.isValidReceipt) return;

            const { jsPDF } = window.jspdf;
            const M = 4;            // side margin, mm
            const W = 72;           // printable width, mm
            const C = 40;           // center x, mm
            const R = 76;           // right edge, mm
            // Line heights in mm per font size (pt * 0.352778 * 1.15)
            const LH = { 7: 2.84, 8: 3.25, 9: 3.65, 10: 4.06, 11: 4.46, 12: 4.87, 15: 6.09 };

            // A scratch doc purely for splitTextToSize measurement
            const scratch = new jsPDF({ unit: 'mm', format: [80, 297] });

            const money = (n) => this.formatMoney(n);
            const ops = [];
            const measure = (str, size, style) => {
                scratch.setFont('courier', style || 'normal');
                scratch.setFontSize(size);
                return scratch.splitTextToSize(String(str), W);
            };
            const text = (str, size, style, align) => {
                const lines = measure(str, size, style);
                ops.push({ t: 'text', lines, size, style: style || 'normal', align: align || 'left', h: lines.length * LH[size] });
            };
            // Courier glyph width in mm for a given pt size
            const charW = (size) => size * 0.6 * 0.352778;
            const row = (l, r, size, style) => {
                // Truncate the left column so it can never collide with the
                // right column (2mm minimum gutter between them).
                const rs = String(r);
                const maxL = Math.floor((W - rs.length * charW(size) - 2) / charW(size));
                const ls = String(l).length > maxL ? String(l).slice(0, Math.max(0, maxL)) : String(l);
                ops.push({ t: 'row', l: ls, r: rs, size, style: style || 'normal', h: LH[size] });
            };
            const itemRow = (desc, priceStr) => {
                // Wrap long descriptions in a column that leaves room for the
                // price on the first line, mirrors real register output.
                scratch.setFont('courier', 'normal');
                scratch.setFontSize(9);
                const availW = Math.max(20, W - priceStr.length * charW(9) - 2);
                const lines = scratch.splitTextToSize(desc, availW);
                ops.push({ t: 'itemrow', lines, r: priceStr, size: 9, h: lines.length * LH[9] });
            };
            const gap = (h) => ops.push({ t: 'gap', h });
            const sep = (ch) => {
                ops.push({ t: 'text', lines: [ch.repeat(ch === '*' ? 32 : 42)], size: 8, style: 'normal', align: 'center', h: LH[8] });
                gap(1);
            };

            // ----- Build the receipt (order mirrors the on-screen preview) -----
            let logoDims = null;
            if (this.receipt.logo && this.receipt.logoW && this.receipt.logoH) {
                const maxW = 40, maxH = 16;
                const ratio = this.receipt.logoW / this.receipt.logoH;
                let h = maxH, w = h * ratio;
                if (w > maxW) { w = maxW; h = w / ratio; }
                logoDims = { w, h };
                ops.push({ t: 'img', data: this.receipt.logo, w, h: h + 3 });
            }

            text(this.receipt.businessName.toUpperCase(), 12, 'bold', 'center');
            if (this.receipt.businessAddress) {
                this.receipt.businessAddress.split(/\n/).forEach(line => {
                    if (line.trim()) text(line.trim(), 8, 'normal', 'center');
                });
            }
            if (this.receipt.businessPhone || this.receipt.businessEmail) {
                text([this.receipt.businessPhone, this.receipt.businessEmail].filter(Boolean).join(' * '), 8, 'normal', 'center');
            }
            gap(1);
            sep('-');
            row('DATE ' + this.posDate, 'TIME ' + this.posTime, 8);
            row(this.posRegisterLine, this.receiptDisplayNumber, 8);
            sep('-');

            this.validItems.forEach(item => {
                itemRow(item.description.toUpperCase(), money(item.quantity * item.price));
                if (item.quantity > 1) {
                    text('  ' + item.quantity + ' @ ' + money(item.price), 8, 'normal', 'left');
                }
                gap(0.6);
            });

            sep('-');
            row('SUBTOTAL', money(this.subtotal), 9);
            if (this.discountAmount > 0) {
                const dl = this.receipt.discountType === 'percent'
                    ? 'DISCOUNT ' + this.receipt.discountValue + '%'
                    : 'DISCOUNT';
                row(dl, '-' + money(this.discountAmount), 9);
            }
            if ((Number(this.receipt.taxRate) || 0) > 0) {
                row('TAX ' + this.receipt.taxRate + '%', money(this.taxAmount), 9);
            }
            sep('*');
            row('TOTAL', money(this.total), 12, 'bold');
            row('TENDER', this.receipt.paymentMethod.toUpperCase(), 8);
            if (this.receipt.paymentMethod === 'Cash' && (Number(this.receipt.amountPaid) || 0) > 0) {
                row('CASH', money(this.receipt.amountPaid), 8);
                row(this.changeDue >= 0 ? 'CHANGE' : 'BALANCE DUE', money(this.absChange), 8);
            }
            sep('-');
            gap(1);
            if (this.receipt.cashier) {
                text('YOU WERE SERVED BY ' + this.receipt.cashier.toUpperCase(), 8, 'normal', 'center');
            }
            text((this.receipt.footerNote || 'Thank you for your business!').toUpperCase(), 8, 'normal', 'center');
            text(this.itemCount + (this.itemCount === 1 ? ' ITEM' : ' ITEMS'), 8, 'normal', 'center');
            gap(2);

            const barcodeElements = encodeCode39(this.barcodePayload);
            if (barcodeElements.length) {
                ops.push({ t: 'barcode', elements: barcodeElements, h: 12 + 1.5 });
                text(this.barcodePayload, 7, 'normal', 'center');
            }
            gap(1.5);
            text('GENERATED FOR BOOKKEEPING PURPOSES', 7, 'normal', 'center');

            // ----- Pass 1: height -----
            const contentH = ops.reduce((sum, op) => sum + op.h, 0);
            const TOP = 8, BOTTOM = 10;
            // Real receipts pad with paper feed; also jsPDF flips a [w,h]
            // format to landscape if h < w, so never go below 120mm.
            const pageH = Math.max(120, Math.ceil(contentH + TOP + BOTTOM));
            if (pageH > 2000) {
                this.showToast('Too many items for one receipt, split it into two');
                return;
            }

            // ----- Pass 2: render -----
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [80, pageH] });
            doc.setTextColor(0);
            let y = TOP;

            ops.forEach(op => {
                if (op.t === 'gap') { y += op.h; return; }
                if (op.t === 'img') {
                    try {
                        doc.addImage(op.data, 'PNG', C - op.w / 2, y, op.w, op.h - 3);
                    } catch (e) {
                        this.showToast('Logo could not be embedded in the PDF');
                    }
                    y += op.h;
                    return;
                }
                if (op.t === 'barcode') {
                    const totalUnits = op.elements.reduce((s, el) => s + (el.wide ? 3 : 1), 0);
                    const module = Math.min(0.38, 62 / totalUnits);
                    const bw = op.elements.reduce((s, el) => s + (el.wide ? 3 : 1) * module, 0);
                    let x = C - bw / 2;
                    op.elements.forEach(el => {
                        const w = (el.wide ? 3 : 1) * module;
                        if (el.bar) doc.rect(x, y, w, 12, 'F');
                        x += w;
                    });
                    y += op.h;
                    return;
                }
                doc.setFont('courier', op.style);
                doc.setFontSize(op.size);
                if (op.t === 'row') {
                    const baseline = y + 0.85 * LH[op.size];
                    doc.text(op.l, M, baseline);
                    doc.text(op.r, R, baseline, { align: 'right' });
                    y += op.h;
                    return;
                }
                if (op.t === 'itemrow') {
                    op.lines.forEach((line, i) => {
                        const baseline = y + 0.85 * LH[op.size];
                        doc.text(line, M, baseline);
                        if (i === 0) doc.text(op.r, R, baseline, { align: 'right' });
                        y += LH[op.size];
                    });
                    return;
                }
                // text op
                op.lines.forEach(line => {
                    const baseline = y + 0.85 * LH[op.size];
                    if (op.align === 'center') doc.text(line, C, baseline, { align: 'center' });
                    else if (op.align === 'right') doc.text(line, R, baseline, { align: 'right' });
                    else doc.text(line, M, baseline);
                    y += LH[op.size];
                });
            });

            const safeNum = (this.receipt.receiptNumber || 'NA').replace(/[^\w-]/g, '') || 'NA';
            const stamp = new Date().toTimeString().slice(0, 5).replace(':', '');
            doc.save('receipt_' + safeNum + '_' + this.receipt.date + '_' + stamp + '.pdf');
            this.showToast('PDF downloaded');

            // Quietly remember business details after a successful download
            try {
                const saved = JSON.parse(localStorage.getItem('receiptBusinessInfo') || '{}');
                if (saved.businessName !== this.receipt.businessName) this.saveBusinessInfo(true);
            } catch (e) { /* non-fatal */ }
        },

        printReceipt() {
            if (!this.isValidReceipt) return;
            window.print();
        },

        resetReceipt() {
            if (this.validItems.length > 0 &&
                !window.confirm('Start a new receipt? The current items will be cleared.')) {
                return;
            }
            const keep = {
                businessName: this.receipt.businessName,
                businessAddress: this.receipt.businessAddress,
                businessPhone: this.receipt.businessPhone,
                businessEmail: this.receipt.businessEmail,
                logo: this.receipt.logo,
                logoW: this.receipt.logoW,
                logoH: this.receipt.logoH,
                currency: this.receipt.currency,
                cashier: this.receipt.cashier,
                taxRate: this.receipt.taxRate,
                footerNote: this.receipt.footerNote
            };
            this.receipt = {
                ...keep,
                receiptNumber: this.bumpReceiptNumber(),
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash',
                discountValue: null,
                discountType: 'percent',
                amountPaid: null,
                items: [{ description: '', quantity: 1, price: null }]
            };
            this.txnId = this.generateTxnId();
            this.posTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            this.drawBarcode();
            this.showToast('Started a new receipt');
        }
    }
}).mount('#app');
