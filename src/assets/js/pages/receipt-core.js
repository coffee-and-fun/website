/* Shared receipt rules. Currency amounts are integer minor units, never floats. */
(function (root, factory) {
	const api = factory();
	if (typeof module === 'object' && module.exports) module.exports = api;
	else root.ReceiptCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
	'use strict';

	const currencies = [
		{ code: 'USD', symbol: '$', decimals: 2 },
		{ code: 'EUR', symbol: '€', decimals: 2 },
		{ code: 'GBP', symbol: '£', decimals: 2 },
		{ code: 'CAD', symbol: 'CA$', decimals: 2 },
		{ code: 'AUD', symbol: 'A$', decimals: 2 },
		{ code: 'JPY', symbol: '¥', decimals: 0 }
	];
	const templates = [
		{
			id: 'classic',
			name: 'Classic',
			description: 'The original thermal receipt',
			size: '80 mm receipt',
			font: 'courier'
		},
		{
			id: 'retail',
			name: 'Retail',
			description: 'Bold header, room to breathe',
			size: '80 mm receipt',
			font: 'courier'
		},
		{
			id: 'invoice',
			name: 'Invoice',
			description: 'Clean, professional, full page',
			size: 'A4 document',
			font: 'helvetica'
		},
		{
			id: 'compact',
			name: 'Compact',
			description: 'A tidy store receipt',
			size: '80 mm receipt',
			font: 'courier'
		}
	];
	const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Check', 'Bank Transfer', 'Other'];
	const businessFields = [
		'businessName',
		'businessAddress',
		'businessPhone',
		'businessEmail',
		'logo',
		'logoW',
		'logoH',
		'currency',
		'taxRate',
		'cashier',
		'storeNumber',
		'register',
		'footerNote',
		'warranty',
		'returnPolicy',
		'paymentInstructions',
		'headerNote',
		'tagline',
		'terminalId'
	];
	// Editable sample presets, based on San Jose / Sacramento store locations.
	// Names, street numbers, phone numbers and store numbers are deliberately samples.
	const presets = {
		retail: {
			businessName: 'Northside Electronics',
			businessAddress: '183 Curtner Avenue\nSan Jose, CA 95125',
			businessPhone: '(408) 555-0174',
			storeNumber: '1424',
			cashier: 'David',
			register: '08',
			warranty: 'Manufacturer warranty',
			returnPolicy: '15 days',
			footerNote: 'Electronics returnable within 15 days.\nThank you for shopping with us!'
		},
		compact: {
			businessName: 'Everyday Market',
			businessAddress: '8917 Gerber Road\nSacramento, CA 95829',
			businessPhone: '(916) 555-2258',
			storeNumber: '03082',
			cashier: 'Rene',
			register: '24',
			tagline: 'Everyday essentials. Fair prices.',
			headerNote: 'Tell us about your visit.\nWe appreciate your feedback.',
			footerNote: 'Thank you for shopping your neighborhood market.'
		}
	};
	const maxMinor = 999999999;
	let itemId = 0;
	const clean = (value) => (typeof value === 'string' ? value.trim() : '');
	const blank = (value) => value === '' || value == null;
	const currencyFor = (code) => currencies.find((c) => c.code === code) || currencies[0];
	const templateFor = (id) => templates.find((t) => t.id === id) || templates[0];

	function localDate(now = new Date()) {
		return [
			now.getFullYear(),
			String(now.getMonth() + 1).padStart(2, '0'),
			String(now.getDate()).padStart(2, '0')
		].join('-');
	}
	function localTime(now = new Date()) {
		return [now.getHours(), now.getMinutes()].map((n) => String(n).padStart(2, '0')).join(':');
	}
	function validDate(value) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
		const d = new Date(value + 'T12:00:00');
		return !Number.isNaN(d.getTime()) && localDate(d) === value;
	}
	function displayDate(value) {
		return validDate(value)
			? new Date(value + 'T12:00:00').toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
			: 'Add a date';
	}
	function newItem() {
		return { id: 'line-' + ++itemId, description: '', quantity: '1', price: '' };
	}
	function newReceipt(now = new Date()) {
		return {
			version: 2,
			template: 'classic',
			businessName: '',
			businessAddress: '',
			businessPhone: '',
			businessEmail: '',
			logo: null,
			logoW: 0,
			logoH: 0,
			receiptNumber: '',
			date: localDate(now),
			time: localTime(now),
			paymentMethod: 'Cash',
			currency: 'USD',
			cashier: '',
			storeNumber: '',
			register: '',
			items: [newItem()],
			taxRate: '',
			discountValue: '',
			discountType: 'percent',
			amountPaid: '',
			footerNote: '',
			warranty: '',
			returnPolicy: '',
			customerName: '',
			customerAddress: '',
			customerEmail: '',
			dueDate: '',
			paymentInstructions: '',
			paymentUrl: '',
			headerNote: '',
			tagline: '',
			transactionId: '',
			cardLast4: '',
			authorization: '',
			terminalId: ''
		};
	}

	// Decimal strings go straight to scaled integers. Excess nonzero precision,
	// exponential notation, negative numbers and non-finite inputs are rejected.
	function scaled(value, precision) {
		if (blank(value)) return null;
		const source = String(value).trim();
		if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(source) || source.length > 24) return null;
		const [whole = '0', fraction = ''] = source.split('.');
		if (fraction.slice(precision).replace(/0/g, '')) return null;
		const result = Number((whole || '0') + fraction.slice(0, precision).padEnd(precision, '0'));
		return Number.isSafeInteger(result) ? result : null;
	}
	const roundedRatio = (a, b, divisor) =>
		Number((BigInt(a) * BigInt(b) + BigInt(divisor) / 2n) / BigInt(divisor));
	function isEmptyItem(item) {
		return !clean(item.description) && blank(item.price) && String(item.quantity) === '1';
	}
	function money(minor, code = 'USD') {
		const c = currencyFor(code);
		const n = Number.isSafeInteger(minor) ? minor : 0;
		return (
			(n < 0 ? '-' : '') +
			c.symbol +
			(Math.abs(n) / 10 ** c.decimals).toLocaleString('en-US', {
				minimumFractionDigits: c.decimals,
				maximumFractionDigits: c.decimals
			})
		);
	}
	function documentMoney(minor, code, template) {
		const formatted = money(minor, code);
		return template === 'compact' ? formatted.replace(currencyFor(code).symbol, '') : formatted;
	}

	function calculate(receipt) {
		const decimals = currencyFor(receipt.currency).decimals;
		const items = receipt.items
			.filter((item) => !isEmptyItem(item))
			.flatMap((item) => {
				const priceMinor = scaled(item.price, decimals);
				const quantityMilli = scaled(item.quantity, 3);
				if (
					!clean(item.description) ||
					priceMinor == null ||
					priceMinor > maxMinor ||
					quantityMilli == null ||
					quantityMilli <= 0 ||
					quantityMilli > 999999000
				)
					return [];
				const totalMinor = roundedRatio(priceMinor, quantityMilli, 1000);
				if (totalMinor > maxMinor) return [];
				return [
					{
						...item,
						description: clean(item.description),
						priceMinor,
						quantity: quantityMilli / 1000,
						totalMinor
					}
				];
			});
		const subtotal = items.reduce((sum, item) => sum + item.totalMinor, 0);
		const discount =
			scaled(receipt.discountValue, receipt.discountType === 'percent' ? 2 : decimals) || 0;
		const discountMinor = Math.min(
			subtotal,
			receipt.discountType === 'percent'
				? roundedRatio(subtotal, Math.min(discount, 10000), 10000)
				: discount
		);
		const taxedBase = subtotal - discountMinor;
		const rate = scaled(receipt.taxRate, 2) || 0;
		const taxMinor = roundedRatio(taxedBase, Math.min(rate, 10000), 10000);
		const total = taxedBase + taxMinor;
		const amountPaid = scaled(receipt.amountPaid, decimals) || 0;
		return {
			items,
			subtotal,
			discount: discountMinor,
			tax: taxMinor,
			total,
			amountPaid,
			change: amountPaid - total,
			balance: Math.max(0, total - amountPaid),
			itemCount: items.reduce((sum, item) => sum + Math.round(item.quantity * 1000), 0) / 1000
		};
	}

	function validate(r) {
		const errors = [];
		const add = (field, message) => errors.push({ field, message });
		const decimals = currencyFor(r.currency).decimals;
		const priceHint = decimals
			? 'Use a positive amount or zero, with up to 2 decimal places.'
			: 'Use a whole yen amount of zero or more.';
		if (!clean(r.businessName)) add('f-bizname', 'Enter a business name.');
		if (!clean(r.receiptNumber)) add('f-number', 'Enter a receipt or invoice number.');
		if (!validDate(r.date)) add('f-date', 'Choose a valid date.');
		if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) add('f-time', 'Choose a valid time.');
		for (const [key, id, label] of [
			['businessEmail', 'f-email', 'business'],
			['customerEmail', 'f-customer-email', 'customer']
		]) {
			if (key === 'customerEmail' && r.template !== 'invoice') continue;
			if (clean(r[key]) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(r[key])))
				add(id, 'Enter a valid ' + label + ' email address.');
		}
		if (r.template === 'invoice' && r.dueDate && (!validDate(r.dueDate) || r.dueDate < r.date))
			add('f-due', 'Choose a due date on or after the invoice date.');
		if (
			r.template === 'invoice' &&
			r.paymentUrl &&
			!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(r.paymentUrl)
		)
			add('f-payment-url', 'Enter a complete HTTPS payment link.');
		if (r.template === 'compact' && r.cardLast4 && !/^\d{4}$/.test(r.cardLast4))
			add('f-card-last4', 'Enter only the last four digits of the card.');
		let entered = 0;
		r.items.forEach((item, index) => {
			if (isEmptyItem(item)) return;
			entered++;
			const price = scaled(item.price, decimals);
			const qty = scaled(item.quantity, 3);
			if (!clean(item.description))
				add('item-desc-' + item.id, 'Add a description for item ' + (index + 1) + '.');
			if (qty == null || qty <= 0 || qty > 999999000)
				add(
					'item-qty-' + item.id,
					'Item ' + (index + 1) + ': enter a quantity from 0.001 to 999,999.'
				);
			if (price == null || price > maxMinor)
				add('item-price-' + item.id, 'Item ' + (index + 1) + ': ' + priceHint);
			else if (qty && roundedRatio(price, qty, 1000) > maxMinor)
				add(
					'item-price-' + item.id,
					'This line total is too large. Split it into separate receipts.'
				);
		});
		if (!entered)
			add(
				'item-desc-' + r.items[0].id,
				'Add at least one item with a description, quantity, and price.'
			);
		const tax = scaled(r.taxRate, 2);
		if (!blank(r.taxRate) && (tax == null || tax > 10000))
			add('f-tax', 'Enter a tax rate from 0 to 100, with up to 2 decimal places.');
		const discount = scaled(r.discountValue, r.discountType === 'percent' ? 2 : decimals);
		if (
			!blank(r.discountValue) &&
			(discount == null ||
				(r.discountType === 'percent' ? discount > 10000 : discount > calculate(r).subtotal))
		)
			add(
				'f-discount',
				r.discountType === 'percent'
					? 'Enter a discount from 0 to 100%.'
					: 'Enter a discount no greater than the subtotal, in the selected currency.'
			);
		const paid = scaled(r.amountPaid, decimals);
		if (
			(r.paymentMethod === 'Cash' || r.template === 'invoice') &&
			!blank(r.amountPaid) &&
			(paid == null || paid > maxMinor)
		)
			add('f-paid', priceHint);
		if (calculate(r).total > maxMinor)
			add('f-tax', 'The total is too large. Split this into separate receipts.');
		return errors;
	}

	function normalize(input, now = new Date()) {
		const r = newReceipt(now);
		if (!input || typeof input !== 'object' || Array.isArray(input)) return r;
		for (const key of Object.keys(r)) {
			if (
				typeof r[key] === 'string' &&
				(typeof input[key] === 'string' || typeof input[key] === 'number')
			)
				r[key] = String(input[key]).slice(
					0,
					key.includes('Address') ||
						[
							'paymentInstructions',
							'headerNote',
							'footerNote',
							'warranty',
							'returnPolicy'
						].includes(key)
						? 500
						: 200
				);
		}
		r.template = templateFor(input.template).id;
		r.currency = currencyFor(input.currency).code;
		r.paymentMethod = paymentMethods.includes(input.paymentMethod) ? input.paymentMethod : 'Cash';
		r.discountType = input.discountType === 'fixed' ? 'fixed' : 'percent';
		if (
			typeof input.logo === 'string' &&
			/^data:image\/(png|jpeg|webp);base64,/.test(input.logo) &&
			input.logo.length < 3000000 &&
			input.logoW > 0 &&
			input.logoH > 0
		) {
			r.logo = input.logo;
			r.logoW = Math.min(Number(input.logoW), 10000);
			r.logoH = Math.min(Number(input.logoH), 10000);
		}
		if (Array.isArray(input.items) && input.items.length)
			r.items = input.items
				.slice(0, 200)
				.filter((item) => item && typeof item === 'object')
				.map((item) => ({
					id: newItem().id,
					description: typeof item.description === 'string' ? item.description.slice(0, 200) : '',
					quantity:
						typeof item.quantity === 'string' || typeof item.quantity === 'number'
							? String(item.quantity)
							: '1',
					price:
						typeof item.price === 'string' || typeof item.price === 'number'
							? String(item.price)
							: ''
				}));
		if (!r.items.length) r.items = [newItem()];
		return r;
	}

	const CODE39 = {
		'0': 'nnnwwnwnn',
		'1': 'wnnwnnnnw',
		'2': 'nnwwnnnnw',
		'3': 'wnwwnnnnn',
		'4': 'nnnwwnnnw',
		'5': 'wnnwwnnnn',
		'6': 'nnwwwnnnn',
		'7': 'nnnwnnwnw',
		'8': 'wnnwnnwnn',
		'9': 'nnwwnnwnn',
		'A': 'wnnnnwnnw',
		'B': 'nnwnnwnnw',
		'C': 'wnwnnwnnn',
		'D': 'nnnnwwnnw',
		'E': 'wnnnwwnnn',
		'F': 'nnwnwwnnn',
		'G': 'nnnnnwwnw',
		'H': 'wnnnnwwnn',
		'I': 'nnwnnwwnn',
		'J': 'nnnnwwwnn',
		'K': 'wnnnnnnww',
		'L': 'nnwnnnnww',
		'M': 'wnwnnnnwn',
		'N': 'nnnnwnnww',
		'O': 'wnnnwnnwn',
		'P': 'nnwnwnnwn',
		'Q': 'nnnnnnwww',
		'R': 'wnnnnnwwn',
		'S': 'nnwnnnwwn',
		'T': 'nnnnwnwwn',
		'U': 'wwnnnnnnw',
		'V': 'nwwnnnnnw',
		'W': 'wwwnnnnnn',
		'X': 'nwnnwnnnw',
		'Y': 'wwnnwnnnn',
		'Z': 'nwwnwnnnn',
		'-': 'nwnnnnwnw',
		'.': 'wwnnnnwnn',
		' ': 'nwwnnnwnn',
		'*': 'nwnnwnwnn'
	};
	function barcodePayload(value) {
		return (
			clean(value)
				.toUpperCase()
				.replace(/[^0-9A-Z. -]/g, '')
				.slice(0, 24) || 'RECEIPT'
		);
	}
	function barcode(value) {
		const chars = '*' + barcodePayload(value) + '*';
		const bars = [];
		let x = 10;
		[...chars].forEach((ch) => {
			[...CODE39[ch]].forEach((part, index) => {
				const width = part === 'w' ? 3 : 1;
				if (index % 2 === 0) bars.push({ x, width });
				x += width;
			});
			x++;
		});
		return { bars, width: x + 9 };
	}

	function applyPreset(receipt, template, previousTemplate) {
		const previous = presets[previousTemplate] || {};
		const next = presets[template] || {};
		const result = { ...receipt, template };
		for (const key of Object.keys(next)) {
			const isSample =
				receipt[key] === previous[key] ||
				Object.values(presets).some((preset) => preset[key] === receipt[key]);
			if (!receipt[key] || isSample) result[key] = next[key];
		}
		return result;
	}

	return {
		currencies,
		templates,
		presets,
		applyPreset,
		paymentMethods,
		businessFields,
		currencyFor,
		templateFor,
		localDate,
		localTime,
		validDate,
		displayDate,
		newItem,
		newReceipt,
		scaled,
		money,
		documentMoney,
		calculate,
		validate,
		normalize,
		isEmptyItem,
		barcodePayload,
		barcode
	};
});
