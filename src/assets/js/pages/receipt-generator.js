/* global Vue, ReceiptCore, ReceiptPDF */
(() => {
	'use strict';
	const Core = ReceiptCore;
	let pdfLoading;
	let fontLoading;
	const loadThermalFont = () => {
		if (!fontLoading)
			fontLoading = fetch('/assets/fonts/VT323-Regular.ttf')
				.then((response) => {
					if (!response.ok) throw new Error('Could not load the receipt font. Please try again.');
					return response.arrayBuffer();
				})
				.then((buffer) => {
					const bytes = new Uint8Array(buffer);
					let binary = '';
					for (let i = 0; i < bytes.length; i += 8192)
						binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
					return btoa(binary);
				})
				.catch((error) => {
					fontLoading = null;
					throw error;
				});
		return fontLoading;
	};
	const loadPDF = () => {
		if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
		if (!pdfLoading)
			pdfLoading = new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = '/assets/vendor/jspdf-4.2.1.umd.min.js';
				script.onload = () => resolve(window.jspdf.jsPDF);
				script.onerror = () => {
					script.remove();
					pdfLoading = null;
					reject(
						new Error('Could not load the PDF exporter. Check your connection and try again.')
					);
				};
				document.head.appendChild(script);
			});
		return pdfLoading;
	};

	Vue.createApp({
		data() {
			return {
				receipt: Core.newReceipt(),
				currencies: Core.currencies,
				templates: Core.templates,
				paymentMethods: Core.paymentMethods,
				touched: {},
				submitted: false,
				toast: '',
				saveStatus: 'Your draft saves on this device',
				hasSavedBusinessInfo: false,
				busy: false,
				exportError: '',
				totalAnnouncement: '',
				mobileView: 'edit',
				logoBusy: false
			};
		},
		computed: {
			shortSaveStatus() {
				if (this.saveStatus === 'Draft saved on this device') return 'Saved';
				if (this.saveStatus === 'Saving draft…') return 'Saving…';
				if (this.saveStatus === 'Your draft saves on this device') return 'Autosaved';
				return this.saveStatus;
			},
			adjustmentsSummary() {
				const parts = [];
				if (Number(this.receipt.taxRate) > 0) parts.push(this.receipt.taxRate + '% tax');
				if (this.totals.discount > 0) parts.push(this.money(this.totals.discount) + ' off');
				return parts.length ? parts.join(' · ') : 'Tax, discounts & cash received';
			},
			totals() {
				return Core.calculate(this.receipt);
			},
			errors() {
				return Core.validate(this.receipt);
			},
			activeTemplate() {
				return Core.templateFor(this.receipt.template);
			},
			currencyInfo() {
				return Core.currencyFor(this.receipt.currency);
			},
			isInvoice() {
				return this.receipt.template === 'invoice';
			},
			barcode() {
				return Core.barcode(this.receipt.receiptNumber);
			},
			barcodeText() {
				return Core.barcodePayload(this.receipt.receiptNumber);
			},
			qr() {
				return ReceiptPDF.qr(this.receipt.receiptNumber);
			},
			numberLabel() {
				return this.isInvoice ? 'Invoice number' : 'Receipt number';
			},
			shownErrors() {
				return this.submitted ? this.errors : [];
			},
			cashEntered() {
				return this.receipt.amountPaid !== '' && this.receipt.amountPaid != null;
			},
			itemCount() {
				return this.totals.itemCount;
			},
			totalLabel() {
				return Core.money(this.totals.total, this.receipt.currency);
			}
		},
		watch: {
			'receipt': {
				deep: true,
				handler() {
					this.saveStatus = 'Saving draft…';
					clearTimeout(this._draftTimer);
					this._draftTimer = setTimeout(() => this.saveDraft(), 400);
				}
			},
			'totalLabel'(value) {
				clearTimeout(this._totalTimer);
				this._totalTimer = setTimeout(() => {
					this.totalAnnouncement = 'Total ' + value;
				}, 700);
			},
			'receipt.template'(value, previous) {
				document.documentElement.dataset.receiptTemplate = value;
				if (this._ready) this.receipt = Core.applyPreset(this.receipt, value, previous);
			}
		},
		mounted() {
			let restored = false;
			try {
				this.hasSavedBusinessInfo = !!localStorage.getItem('receiptBusinessInfo');
				const raw = localStorage.getItem('receiptDraft');
				if (raw) {
					this.receipt = Core.normalize(JSON.parse(raw));
					restored = true;
					this.showToast('Your draft is ready where you left it.');
				} else if (this.hasSavedBusinessInfo) this.loadBusinessInfo(true);
			} catch {
				this.saveStatus = 'Device storage is unavailable';
			}
			if (!this.receipt.receiptNumber) this.receipt.receiptNumber = this.nextNumber(false);
			if (!restored) this.saveDraft();
			document.documentElement.dataset.receiptTemplate = this.receipt.template;
			document.getElementById('receipt-loading')?.remove();
			this._flushDraft = () => this.saveDraft();
			window.addEventListener('pagehide', this._flushDraft);
			this.$nextTick(() => {
				this._ready = true;
			});
		},
		beforeUnmount() {
			this.saveDraft();
			[this._draftTimer, this._totalTimer, this._toastTimer].forEach(clearTimeout);
			window.removeEventListener('pagehide', this._flushDraft);
		},
		methods: {
			setMobileView(view) {
				this.mobileView = view;
				this.$nextTick(() => {
					const switcher = document.querySelector('.mobile-view-switch');
					if (!switcher?.getClientRects().length) return;
					switcher.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
					switcher.scrollIntoView({ block: 'start', behavior: 'auto' });
				});
			},
			money(value) {
				return Core.money(value, this.receipt.currency);
			},
			documentMoney(value) {
				return Core.documentMoney(value, this.receipt.currency, this.receipt.template);
			},
			numericDate(value) {
				return Core.validDate(value)
					? value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1')
					: 'Add a date';
			},
			displayDate: Core.displayDate,
			touch(field) {
				this.touched[field] = true;
			},
			errorFor(field) {
				return this.submitted || this.touched[field]
					? this.errors.find((e) => e.field === field)?.message || ''
					: '';
			},
			focusField(field) {
				this.mobileView = 'edit';
				this.$nextTick(() => {
					const el = document.getElementById(field);
					if (!el) return;
					let parent = el.parentElement;
					while (parent) {
						if (parent.tagName === 'DETAILS') parent.open = true;
						parent = parent.parentElement;
					}
					el.focus();
					el.scrollIntoView({ block: 'center', behavior: 'auto' });
				});
			},
			validateExport() {
				this.submitted = true;
				this.exportError = '';
				if (!this.errors.length) return true;
				this.mobileView = 'edit';
				this.$nextTick(() => document.getElementById('error-summary')?.focus());
				return false;
			},
			lineTotal(item) {
				return this.totals.items.find((line) => line.id === item.id)?.totalMinor ?? 0;
			},
			showToast(message) {
				this.toast = message;
				clearTimeout(this._toastTimer);
				this._toastTimer = setTimeout(() => {
					this.toast = '';
				}, 5000);
			},
			saveDraft() {
				clearTimeout(this._draftTimer);
				try {
					localStorage.setItem('receiptDraft', JSON.stringify(this.receipt));
					this.saveStatus = 'Draft saved on this device';
				} catch {
					try {
						localStorage.setItem(
							'receiptDraft',
							JSON.stringify({ ...this.receipt, logo: null, logoW: 0, logoH: 0 })
						);
						this.saveStatus = 'Draft saved without the logo (storage is full)';
					} catch {
						this.saveStatus = 'Draft could not be saved on this device';
					}
				}
			},
			nextNumber(increment) {
				let next = 1;
				try {
					const stored = Number(localStorage.getItem('receiptNextNumber'));
					if (Number.isSafeInteger(stored) && stored > 0) next = stored;
					// Respect a manually entered RCP number when starting the next receipt.
					const match = /^RCP-(\d+)$/.exec(this.receipt.receiptNumber);
					if (increment) next = Math.max(next, match ? Number(match[1]) : 0) + 1;
					if (!Number.isSafeInteger(next) || next > 999999999) next = 1;
					localStorage.setItem('receiptNextNumber', String(next));
				} catch {
					if (increment) next = (Number(this.receipt.receiptNumber.replace(/^RCP-/, '')) || 1) + 1;
				}
				return 'RCP-' + String(next).padStart(4, '0');
			},
			addItem() {
				if (this.receipt.items.length >= 200) {
					this.showToast('This document supports up to 200 items. Start another for more.');
					return;
				}
				const item = Core.newItem();
				this.receipt.items.push(item);
				this.$nextTick(() => this.focusField('item-desc-' + item.id));
			},
			removeItem(index) {
				const removed = this.receipt.items.splice(index, 1)[0];
				if (!this.receipt.items.length) this.receipt.items.push(Core.newItem());
				this.showToast((removed.description || 'Item ' + (index + 1)) + ' removed.');
				this.$nextTick(() =>
					this.focusField(
						'item-desc-' + this.receipt.items[Math.min(index, this.receipt.items.length - 1)].id
					)
				);
			},
			async handleLogoUpload(event) {
				const file = event.target.files[0];
				if (!file) return;
				event.target.value = '';
				if (
					!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
					file.size > 5 * 1024 * 1024
				) {
					this.showToast('Choose a PNG, JPG, or WebP image under 5 MB.');
					return;
				}
				this.logoBusy = true;
				const url = URL.createObjectURL(file);
				try {
					const img = new Image();
					img.src = url;
					await img.decode();
					const scale = Math.min(1, 800 / img.naturalWidth, 800 / img.naturalHeight);
					const canvas = document.createElement('canvas');
					canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
					canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
					const ctx = canvas.getContext('2d');
					ctx.fillStyle = '#fff';
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					this.receipt.logo = canvas.toDataURL('image/png');
					this.receipt.logoW = canvas.width;
					this.receipt.logoH = canvas.height;
					this.showToast('Logo added.');
				} catch {
					this.showToast('That image could not be opened. Try another file.');
				} finally {
					URL.revokeObjectURL(url);
					this.logoBusy = false;
				}
			},
			removeLogo() {
				this.receipt.logo = null;
				this.receipt.logoW = 0;
				this.receipt.logoH = 0;
				this.showToast('Logo removed.');
			},
			saveBusinessInfo() {
				const info = Object.fromEntries(Core.businessFields.map((key) => [key, this.receipt[key]]));
				try {
					localStorage.setItem('receiptBusinessInfo', JSON.stringify(info));
					this.hasSavedBusinessInfo = true;
					this.showToast('Business details saved on this device.');
				} catch {
					this.showToast('Could not save business details. Device storage may be full.');
				}
			},
			loadBusinessInfo(silent = false) {
				try {
					const raw = localStorage.getItem('receiptBusinessInfo');
					if (!raw) return;
					const info = Core.normalize(JSON.parse(raw));
					Core.businessFields.forEach((key) => {
						this.receipt[key] = info[key];
					});
					if (!silent) this.showToast('Saved business details loaded.');
				} catch {
					if (!silent) this.showToast('Saved details could not be loaded.');
				}
			},
			clearDeviceData() {
				if (
					!window.confirm('Clear this receipt, draft, and saved business details from this device?')
				)
					return;
				clearTimeout(this._draftTimer);
				this.receipt = Core.newReceipt();
				this.receipt.receiptNumber = 'RCP-0001';
				this.hasSavedBusinessInfo = false;
				this.submitted = false;
				this.touched = {};
				this.exportError = '';
				this.$nextTick(() => {
					clearTimeout(this._draftTimer);
					try {
						['receiptDraft', 'receiptBusinessInfo', 'receiptNextNumber'].forEach((key) =>
							localStorage.removeItem(key)
						);
						this.saveStatus = 'Saved data cleared';
						this.showToast('Saved data cleared from this device.');
					} catch {
						this.showToast('Device storage could not be cleared.');
					}
					this.focusField('f-bizname');
				});
			},
			hasItems() {
				return this.receipt.items.some((item) => !Core.isEmptyItem(item));
			},
			loadExample() {
				if (
					this.hasItems() &&
					!window.confirm('Replace the current receipt with an editable example?')
				)
					return;
				const template = this.receipt.template;
				const number = this.receipt.receiptNumber;
				this.receipt = {
					...Core.newReceipt(),
					template,
					receiptNumber: number,
					businessName: 'Sunday Supply',
					businessAddress: '42 Garden Street\nPortland, OR 97201',
					businessPhone: '(503) 555-0142',
					businessEmail: 'hello@example.com',
					cashier: 'Sam',
					storeNumber: '01',
					register: '02',
					taxRate: '8.25',
					amountPaid: template === 'invoice' ? '' : '30.00',
					customerName: 'Alex Morgan',
					customerEmail: 'alex@example.com',
					dueDate: Core.localDate(),
					footerNote: 'A little something for your everyday. Thank you!',
					items: [
						{ ...Core.newItem(), description: 'Cappuccino', quantity: '2', price: '4.50' },
						{ ...Core.newItem(), description: 'Blueberry muffin', quantity: '1', price: '3.25' },
						{ ...Core.newItem(), description: 'Cold brew growler', quantity: '1', price: '14.00' }
					]
				};
				if (template === 'retail') {
					Object.assign(this.receipt, Core.presets.retail, {
						businessEmail: '',
						paymentMethod: 'Credit Card',
						amountPaid: '',
						items: [
							{ ...Core.newItem(), description: 'Phone case', quantity: '1', price: '29.99' },
							{ ...Core.newItem(), description: 'Screen protector', quantity: '1', price: '14.99' }
						]
					});
				} else if (template === 'compact') {
					Object.assign(this.receipt, Core.presets.compact, {
						businessEmail: '',
						taxRate: '8.00',
						paymentMethod: 'Debit Card',
						amountPaid: '',
						items: [
							{
								...Core.newItem(),
								description: 'Everyday essentials kit',
								quantity: '1',
								price: '69.00'
							}
						]
					});
				}
				this.submitted = false;
				this.touched = {};
				this.exportError = '';
				this.showToast('Example loaded. Every detail is yours to edit.');
			},
			resetReceipt() {
				if (
					this.hasItems() &&
					!window.confirm(
						'Start a new receipt? Your current items and customer details will be cleared.'
					)
				)
					return;
				const number = this.nextNumber(true);
				const keep = Object.fromEntries(Core.businessFields.map((key) => [key, this.receipt[key]]));
				this.receipt = {
					...Core.newReceipt(),
					...keep,
					template: this.receipt.template,
					receiptNumber: number
				};
				this.submitted = false;
				this.touched = {};
				this.exportError = '';
				this.saveDraft();
				this.showToast('New receipt started. Business details kept.');
				this.$nextTick(() => this.focusField('item-desc-' + this.receipt.items[0].id));
			},
			async generatePDF() {
				if (this.busy || this.logoBusy || !this.validateExport()) return;
				this.busy = true;
				// Take a snapshot so edits during the lazy load cannot change the export.
				const receipt = Core.normalize(JSON.parse(JSON.stringify(this.receipt)));
				try {
					const [jsPDF, thermalFont] = await Promise.all([
						loadPDF(),
						['retail', 'compact'].includes(receipt.template)
							? loadThermalFont()
							: Promise.resolve(null)
					]);
					if (receipt.logo && receipt.template !== 'invoice') {
						const img = new Image();
						img.src = receipt.logo;
						await img.decode();
						const canvas = document.createElement('canvas');
						canvas.width = receipt.logoW;
						canvas.height = receipt.logoH;
						const ctx = canvas.getContext('2d');
						ctx.drawImage(img, 0, 0);
						const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
						for (let i = 0; i < pixels.data.length; i += 4) {
							const grey = Math.round(
								pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114
							);
							pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = grey;
						}
						ctx.putImageData(pixels, 0, 0);
						receipt.logo = canvas.toDataURL('image/png');
					}
					const doc = ReceiptPDF.create(receipt, jsPDF, { thermalFont });
					const number = receipt.receiptNumber.replace(/[^\w-]/g, '') || 'document';
					await doc.save(
						(receipt.template === 'invoice' ? 'invoice' : 'receipt') +
							'_' +
							number +
							'_' +
							receipt.date +
							'.pdf',
						{ returnPromise: true }
					);
					this.showToast('Your PDF is ready.');
					this.saveDraft();
				} catch (error) {
					this.exportError = error.message || 'The PDF could not be created. Please try again.';
				} finally {
					this.busy = false;
				}
			},
			async printReceipt() {
				if (this.busy || this.logoBusy || !this.validateExport()) return;
				this.busy = true;
				try {
					// A separate document removes the editor from print layout entirely.
					// visibility:hidden on the editor would leave empty printed pages.
					this._printFrame?.remove();
					const frame = document.createElement('iframe');
					frame.title = 'Printable receipt';
					frame.className = 'print-frame';
					document.body.appendChild(frame);
					this._printFrame = frame;
					const doc = frame.contentDocument;
					doc.documentElement.lang = 'en';
					doc.title = this.numberLabel + ' ' + this.receipt.receiptNumber;
					doc.body.className = 'receipt-print';
					const css = document.createElement('link');
					css.rel = 'stylesheet';
					css.href = document.querySelector('link[href*="pages/receipt-generator.css"]').href;
					const loaded = new Promise((resolve, reject) => {
						css.onload = resolve;
						css.onerror = reject;
					});
					doc.head.appendChild(css);
					const paper = document.getElementById('receipt-preview').cloneNode(true);
					paper.removeAttribute('id');
					doc.body.appendChild(paper);
					await loaded;
					await Promise.all(Array.from(doc.images).map((img) => img.decode()));
					await doc.fonts.ready;
					const style = document.createElement('style');
					const pageHeight = Math.max(
						120,
						Math.ceil((paper.getBoundingClientRect().height * 25.4) / 96) + 4
					);
					style.textContent =
						'@page { size: ' +
						(this.isInvoice ? 'A4' : '80mm ' + Math.min(2000, pageHeight) + 'mm') +
						'; margin: ' +
						(this.isInvoice ? '12mm' : '0') +
						'; }';
					doc.head.appendChild(style);
					frame.contentWindow.focus();
					frame.contentWindow.print();
				} catch {
					this.exportError = 'Print preview could not open. Try downloading the PDF instead.';
				} finally {
					this.busy = false;
				}
			}
		}
	}).mount('#app');
})();
