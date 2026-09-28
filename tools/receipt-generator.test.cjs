const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { jsPDF } = require('jspdf');
const Core = require('../src/assets/js/pages/receipt-core.js');
const PDF = require('../src/assets/js/pages/receipt-pdf.js');
const thermalFont = fs
	.readFileSync(require('node:path').join(__dirname, '../src/assets/fonts/VT323-Regular.ttf'))
	.toString('base64');
function receipt(overrides = {}) {
	return {
		...Core.newReceipt(),
		businessName: 'Example Store',
		receiptNumber: 'RCP-0001',
		items: [{ ...Core.newItem(), description: 'Notebook', quantity: '1', price: '20.17' }],
		...overrides
	};
}

test('rounded discount and tax reconcile exactly with the displayed total', () => {
	const r = receipt({
		discountType: 'percent',
		discountValue: '15',
		taxRate: '8.25',
		amountPaid: '18.55'
	});
	const t = Core.calculate(r);
	assert.deepEqual([t.subtotal, t.discount, t.tax, t.total, t.change], [2017, 303, 141, 1855, 0]);
	assert.equal(t.total, t.subtotal - t.discount + t.tax);
});
test('rounds line amounts first and sums minor units across fractional quantities', () => {
	const r = receipt({
		items: [1, 2, 3].map(() => ({
			...Core.newItem(),
			description: 'Time',
			quantity: '.5',
			price: '.05'
		}))
	});
	assert.equal(Core.calculate(r).subtotal, 9);
	assert.deepEqual(Core.validate(r), []);
});
test('rejects negative, infinite, over-limit, and over-precision inputs before PDF export', () => {
	for (const taxRate of ['-10', 'Infinity', 'NaN', '101', '8.255', '1e99']) {
		const r = receipt({ taxRate });
		assert.ok(
			Core.validate(r).some((e) => e.field === 'f-tax'),
			taxRate
		);
		assert.throws(() => PDF.create(r, jsPDF), /highlighted fields/);
	}
	assert.equal(Core.calculate(receipt({ taxRate: '-10' })).total, 2017);
});
test('incomplete rows block export while untouched spare rows are ignored', () => {
	const r = receipt();
	r.items.push(Core.newItem());
	assert.deepEqual(Core.validate(r), []);
	r.items[1].description = 'Unpriced item';
	assert.ok(Core.validate(r).some((e) => e.field === 'item-price-' + r.items[1].id));
	assert.throws(() => PDF.create(r, jsPDF), /highlighted fields/);
});
test('supports free items and rejects whitespace-only required fields', () => {
	const r = receipt();
	r.items[0].price = '0';
	assert.deepEqual(Core.validate(r), []);
	assert.equal(Core.calculate(r).items.length, 1);
	r.businessName = '  ';
	r.items[0].description = '   ';
	assert.ok(Core.validate(r).some((e) => e.field === 'f-bizname'));
	assert.ok(Core.validate(r).some((e) => e.field.startsWith('item-desc-')));
});
test('whole-yen amounts, discount precision, and zero cash received', () => {
	const r = receipt({
		currency: 'JPY',
		discountType: 'fixed',
		discountValue: '1',
		amountPaid: '0'
	});
	r.items[0].price = '100';
	assert.equal(Core.calculate(r).total, 99);
	assert.equal(Core.calculate(r).change, -99);
	assert.equal(Core.money(99, 'JPY'), '¥99');
	r.items[0].price = '100.25';
	assert.ok(Core.validate(r).some((e) => e.field.startsWith('item-price-')));
});
test('local date survives UTC midnight and new-receipt defaults share the local clock', () => {
	const script = `const C=require(${JSON.stringify(require.resolve('../src/assets/js/pages/receipt-core.js'))});const r=C.newReceipt(new Date('2026-09-28T01:15:00Z'));process.stdout.write(r.date+' '+r.time);`;
	assert.equal(
		execFileSync(process.execPath, ['-e', script], {
			env: { ...process.env, TZ: 'America/Chicago' },
			encoding: 'utf8'
		}),
		'2026-09-27 20:15'
	);
	assert.equal(Core.validDate('2026-02-30'), false);
	assert.equal(Core.validDate('2024-02-29'), true);
});
test('normalizes legacy/corrupt drafts without executing or trusting their shape', () => {
	const r = Core.normalize({
		businessName: 'Legacy',
		items: [null, { description: 'Book', price: 5, quantity: 2 }],
		currency: 'INVALID',
		logo: 'javascript:alert(1)',
		template: 'invalid'
	});
	assert.equal(r.items.length, 1);
	assert.equal(r.items[0].price, '5');
	assert.equal(r.logo, null);
	assert.equal(r.currency, 'USD');
	assert.equal(r.template, 'classic');
	assert.equal(Core.normalize({ items: { a: 1 } }).items.length, 1);
	assert.equal(Core.normalize({ items: [null] }).items.length, 1);
});
test('template defaults move between retail presets without replacing custom edits or items', () => {
	let r = Core.applyPreset(receipt({ businessName: '', businessAddress: '' }), 'retail', 'classic');
	assert.equal(r.businessAddress, '183 Curtner Avenue\nSan Jose, CA 95125');
	r.businessName = 'My Business';
	r = Core.applyPreset(r, 'compact', 'retail');
	assert.equal(r.businessName, 'My Business');
	assert.equal(r.businessAddress, '8917 Gerber Road\nSacramento, CA 95829');
	assert.equal(r.items[0].description, 'Notebook');
	r = Core.applyPreset(r, 'invoice', 'compact');
	assert.equal(r.businessName, 'My Business');
	assert.equal(r.businessAddress, '8917 Gerber Road\nSacramento, CA 95829');
	r = Core.applyPreset(r, 'retail', 'invoice');
	assert.equal(r.businessName, 'My Business');
	assert.equal(r.businessAddress, '183 Curtner Avenue\nSan Jose, CA 95125');
});
test('all four layouts export at their specified paper size with actual text', () => {
	for (const template of Core.templates) {
		const r = receipt({ template: template.id });
		const doc = PDF.create(r, jsPDF, { thermalFont });
		assert.ok(
			Math.abs(doc.internal.pageSize.getWidth() - (template.id === 'invoice' ? 210 : 80)) < 0.01
		);
		assert.equal(doc.getNumberOfPages(), 1);
		assert.ok(doc.output().startsWith('%PDF-'));
		assert.ok(doc.output().includes('Bookkeeping document'));
	}
});
test('long invoices paginate and repeat the table headings', () => {
	const r = receipt({
		template: 'invoice',
		items: Array.from({ length: 120 }, (_, i) => ({
			...Core.newItem(),
			description:
				'Consulting service ' + i + ' with a detailed description that wraps onto another line',
			quantity: '1',
			price: '50.00'
		}))
	});
	const doc = PDF.create(r, jsPDF);
	assert.ok(doc.getNumberOfPages() > 3);
	for (let i = 1; i <= doc.getNumberOfPages(); i++)
		assert.ok(
			doc.internal.pages[i].join('\n').includes('Description'),
			'Repeated table header on page ' + i
		);
});
test('barcode and QR have quiet zones and encode a stable document reference', () => {
	assert.equal(Core.barcodePayload(' rcp-0001/€ '), 'RCP-0001');
	const bars = Core.barcode('RCP-0001');
	assert.equal(bars.bars[0].x, 10);
	assert.ok(bars.width - (bars.bars.at(-1).x + bars.bars.at(-1).width) >= 10);
	const qr = PDF.qr('RCP-0001');
	assert.ok(qr.cells.every((c) => c.x >= 4 && c.y >= 4 && c.x < qr.size - 4 && c.y < qr.size - 4));
});
test('invoice dates and payment links are validated; hidden invoice fields do not block receipts', () => {
	const r = receipt({
		template: 'invoice',
		date: '2026-09-28',
		dueDate: '2026-09-27',
		paymentUrl: 'javascript:alert(1)'
	});
	assert.ok(Core.validate(r).some((e) => e.field === 'f-due'));
	assert.ok(Core.validate(r).some((e) => e.field === 'f-payment-url'));
	r.template = 'classic';
	assert.deepEqual(Core.validate(r), []);
});

test('the Liquid raw editor compiles as valid Vue, including long interpolations', () => {
	const { compile } = require('@vue/compiler-dom');
	const source = fs.readFileSync(
		require('node:path').join(__dirname, '../src/pages/receipt-generator.liquid'),
		'utf8'
	);
	const template = source.match(/\{% raw %\}([\s\S]*?)\{% endraw %\}/)[1];
	const { code } = compile(template, { mode: 'function', prefixIdentifiers: true });
	assert.doesNotThrow(() => new Function('Vue', code));
});
