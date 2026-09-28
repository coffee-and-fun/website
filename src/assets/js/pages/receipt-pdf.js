/* Vector/text PDF layouts. Uses the same validated model as the live preview. */
(function (root, factory) {
	if (typeof module === 'object' && module.exports)
		module.exports = factory(require('./receipt-core.js'), require('qrcode-generator'));
	else root.ReceiptPDF = factory(root.ReceiptCore, root.qrcode);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, qrcode) {
	'use strict';

	function qr(value) {
		const code = qrcode(0, 'M');
		code.addData(Core.barcodePayload(value));
		code.make();
		const cells = [],
			size = code.getModuleCount();
		for (let row = 0; row < size; row++)
			for (let col = 0; col < size; col++) {
				if (code.isDark(row, col)) cells.push({ x: col + 4, y: row + 4 });
			}
		return { size: size + 8, cells };
	}

	function create(receipt, jsPDF, options = {}) {
		if (Core.validate(receipt).length)
			throw new Error('Complete the highlighted fields before exporting.');
		const invoice = receipt.template === 'invoice';
		const compact = receipt.template === 'compact';
		const retail = receipt.template === 'retail';
		const totals = Core.calculate(receipt);
		const width = invoice ? 210 : 80;
		const margin = invoice ? 18 : 4;
		const inner = width - margin * 2;
		const baseSize = invoice ? 10 : compact ? 10 : retail ? 12 : 9;
		const font = invoice
			? 'helvetica'
			: (compact || retail) && options.thermalFont
				? 'thermal'
				: 'courier';
		const registerFont = (doc) => {
			if (!options.thermalFont) return;
			doc.addFileToVFS('VT323-Regular.ttf', options.thermalFont);
			doc.addFont('VT323-Regular.ttf', 'thermal', 'normal');
			doc.addFont('VT323-Regular.ttf', 'thermal', 'bold');
		};
		const scratch = new jsPDF({ unit: 'mm', format: 'a4' });
		registerFont(scratch);
		const ops = [];
		let summaryMode = false;
		const money = (n) => Core.documentMoney(n, receipt.currency, receipt.template);
		const lineHeight = (size) => size * 0.352778 * (compact ? 0.95 : retail ? 1.2 : 1.3);
		const wrap = (value, size, available, bold = false, face = font) => {
			scratch.setFont(face, bold ? 'bold' : 'normal');
			scratch.setFontSize(size);
			return scratch.splitTextToSize(String(value), available);
		};
		const gap = (h) => ops.push({ type: 'gap', h });
		const text = (value, size = baseSize, bold = false, align = 'left', face = font) => {
			if (!value) return;
			const lines = wrap(value, size, inner, bold, face);
			ops.push({
				type: 'text',
				lines,
				size,
				bold,
				align,
				face,
				h: lines.length * lineHeight(size)
			});
		};
		const rule = (dashed = !invoice) => ops.push({ type: 'rule', dashed, h: invoice ? 6 : 4 });
		const columns = (cells, extra = {}) => {
			const measured = cells.map((cell) => ({
				...cell,
				size: cell.size || baseSize,
				lines: wrap(cell.text, cell.size || baseSize, cell.width - 2, cell.bold)
			}));
			const h =
				Math.max(...measured.map((cell) => cell.lines.length * lineHeight(cell.size))) +
				(extra.padding || 0);
			ops.push({ type: 'columns', cells: measured, h, ...extra });
		};
		const pair = (label, value, bold = false, size = baseSize) => {
			scratch.setFont(font, bold ? 'bold' : 'normal');
			scratch.setFontSize(size);
			const rightWidth = invoice
				? 44
				: Math.min(43, Math.max(24, scratch.getTextWidth(String(value)) + 3));
			const offset = invoice ? inner / 2 : 0;
			columns(
				[
					...(invoice ? [{ text: '', width: offset }] : []),
					{
						text: label,
						width: inner - rightWidth - offset,
						bold,
						size,
						align: compact && summaryMode ? 'right' : 'left'
					},
					{ text: value, width: rightWidth, align: 'right', bold, size }
				],
				invoice ? { type: 'summary', padding: 3 } : {}
			);
		};
		const logo = () => {
			if (!receipt.logo || !receipt.logoW || !receipt.logoH) return;
			const scale = Math.min(
				(invoice ? 35 : 40) / receipt.logoW,
				(invoice ? 20 : 16) / receipt.logoH
			);
			const w = receipt.logoW * scale,
				h = receipt.logoH * scale;
			ops.push({ type: 'image', data: receipt.logo, w, imageH: h, h: h + 4 });
		};

		if (invoice) {
			// The logo sits opposite the title rather than taking a full flow row.
			ops.push({ type: 'invoiceLogo', h: 0 });
			text('Invoice', 28, true);
			gap(3);
			text('#' + receipt.receiptNumber, 10);
			text('Issued ' + Core.displayDate(receipt.date), 9);
			if (receipt.dueDate) text('Due ' + Core.displayDate(receipt.dueDate), 9);
			gap(8);
			columns([
				{
					text: [
						receipt.businessName,
						receipt.businessAddress,
						receipt.businessEmail,
						receipt.businessPhone
					]
						.filter(Boolean)
						.join('\n'),
					width: inner / 2
				},
				{
					text:
						'BILL TO\n' +
						[receipt.customerName, receipt.customerAddress, receipt.customerEmail]
							.filter(Boolean)
							.join('\n'),
					width: inner / 2
				}
			]);
			gap(10);
			text(
				money(totals.balance) +
					(receipt.dueDate ? ' due ' + Core.displayDate(receipt.dueDate) : ' amount due'),
				16,
				true
			);
			if (receipt.paymentUrl) {
				gap(3);
				ops.push({ type: 'link', url: receipt.paymentUrl, h: 6 });
			}
			gap(5);
			text(receipt.footerNote || 'Thank you for your business!');
			gap(8);
			columns(
				[
					{ text: 'Description', width: inner - 87 },
					{ text: 'Qty', width: 17, align: 'right' },
					{ text: 'Unit price', width: 35, align: 'right' },
					{ text: 'Amount', width: 35, align: 'right' }
				],
				{ type: 'tableHeader', padding: 4 }
			);
			totals.items.forEach((item) =>
				columns(
					[
						{ text: item.description, width: inner - 87 },
						{ text: String(item.quantity), width: 17, align: 'right' },
						{ text: money(item.priceMinor), width: 35, align: 'right' },
						{ text: money(item.totalMinor), width: 35, align: 'right' }
					],
					{ type: 'tableRow', padding: 5 }
				)
			);
			gap(6);
		} else {
			if (compact) {
				text(receipt.headerNote, 8);
				gap(3);
				text('ID #: ' + receipt.receiptNumber, 8);
				rule();
				gap(7);
			}
			logo();
			if (retail && !receipt.logo) {
				text('YOUR\nLOGO', 28, true, 'center', 'helvetica');
				gap(6);
			}
			text(
				(compact || retail ? receipt.businessName : receipt.businessName.toUpperCase()) +
					(retail && receipt.storeNumber ? ' #' + receipt.storeNumber : ''),
				retail ? 13 : compact ? 21 : 13,
				true,
				'center',
				compact ? 'helvetica' : font
			);
			if (compact && receipt.tagline) text(receipt.tagline, 8, true, 'center', 'helvetica');
			gap(retail ? 4 : 2);
			if (compact) {
				text(receipt.businessPhone, baseSize, false, 'center');
				if (receipt.cashier)
					text('MANAGER ' + receipt.cashier.toUpperCase(), baseSize, false, 'center');
				text(receipt.businessAddress.toUpperCase(), baseSize, false, 'center');
			} else {
				text(receipt.businessAddress, baseSize, false, 'center');
				text(
					[receipt.businessPhone, receipt.businessEmail].filter(Boolean).join('\n'),
					baseSize,
					false,
					'center'
				);
			}
			gap(2);
			if (compact) {
				text(
					[
						receipt.storeNumber && 'ST# ' + receipt.storeNumber,
						receipt.register && 'TE# ' + receipt.register,
						receipt.transactionId && 'TR# ' + receipt.transactionId
					]
						.filter(Boolean)
						.join(' ')
				);
			} else {
				if (receipt.cashier || receipt.register)
					text(
						[
							receipt.cashier && 'Cashier: ' + receipt.cashier,
							receipt.register && 'Register: ' + receipt.register
						]
							.filter(Boolean)
							.join(' | '),
						baseSize,
						false,
						'center'
					);
				gap(retail ? 3 : 0);
				text(
					'Date: ' +
						receipt.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1') +
						' | Time: ' +
						receipt.time,
					baseSize,
					false,
					'center'
				);
				if (!retail) text('#' + receipt.receiptNumber, baseSize, false, 'center');
				rule();
			}
			totals.items.forEach((item) => {
				pair(item.description, money(item.totalMinor));
				if (item.quantity !== 1) text(item.quantity + ' @ ' + money(item.priceMinor), baseSize - 1);
				gap(retail ? 2 : 0.8);
			});
			if (!compact) rule();
		}

		summaryMode = true;
		pair('Subtotal', money(totals.subtotal));
		if (totals.discount)
			pair(
				'Discount' +
					(receipt.discountType === 'percent' ? ' (' + receipt.discountValue + '%)' : ''),
				'-' + money(totals.discount)
			);
		if (Number(receipt.taxRate) > 0) pair('Tax (' + receipt.taxRate + '%)', money(totals.tax));
		gap(2);
		pair('Total', money(totals.total), true, invoice ? 12 : compact ? 10 : 12);
		if (invoice) {
			if (totals.amountPaid) pair('Amount paid', money(totals.amountPaid));
			pair('Amount due', money(totals.balance), true, 12);
			if (totals.change > 0) pair('Overpayment', money(totals.change));
		} else if (!retail) {
			pair(
				compact ? receipt.paymentMethod.toUpperCase() + ' TEND' : 'Payment',
				compact
					? money(
							receipt.paymentMethod === 'Cash' && receipt.amountPaid !== ''
								? totals.amountPaid
								: totals.total
						)
					: receipt.paymentMethod
			);
			if (
				receipt.paymentMethod === 'Cash' &&
				receipt.amountPaid !== '' &&
				receipt.amountPaid != null
			) {
				if (!compact) pair('Cash received', money(totals.amountPaid));
				pair(totals.change >= 0 ? 'Change' : 'Balance due', money(Math.abs(totals.change)));
			}
		}
		summaryMode = false;
		if (invoice) ops.push({ type: 'footerStart', h: 0 });
		if (!compact) rule();
		if (invoice && receipt.paymentInstructions) {
			text('Payment instructions', 10, true);
			gap(2);
			text(receipt.paymentInstructions);
			gap(5);
		}
		if (retail) {
			if (receipt.warranty) pair('Warranty', receipt.warranty);
			if (receipt.returnPolicy) pair('Return period', receipt.returnPolicy);
			pair('Payment', receipt.paymentMethod);
			if (
				receipt.paymentMethod === 'Cash' &&
				receipt.amountPaid !== '' &&
				receipt.amountPaid != null
			) {
				pair('Cash received', money(totals.amountPaid));
				pair(totals.change >= 0 ? 'Change' : 'Balance due', money(Math.abs(totals.change)));
			}
		} else {
			if (receipt.warranty) {
				text('Warranty', baseSize, true);
				text(receipt.warranty);
				gap(2);
			}
			if (receipt.returnPolicy) {
				text('Returns', baseSize, true);
				text(receipt.returnPolicy);
				gap(2);
			}
		}
		if (compact) {
			gap(7);
			text(receipt.paymentMethod.toUpperCase() + '  PAYMENT');
			text(money(totals.total) + ' TOTAL PURCHASE');
			if (receipt.cardLast4 && receipt.paymentMethod !== 'Cash')
				text('CARD **** **** **** ' + receipt.cardLast4);
			if (receipt.transactionId) text('REF # ' + receipt.transactionId);
			if (receipt.authorization) text('APPR CODE ' + receipt.authorization);
			if (receipt.terminalId) text('TERMINAL # ' + receipt.terminalId);
			gap(7);
			text(receipt.date + '  ' + receipt.time, baseSize, false, 'center');
		}
		if (!invoice && !retail && !compact)
			text(receipt.footerNote || 'Thank you for your business!', baseSize, false, 'center');
		if (!invoice) {
			gap(3);
			if (!retail)
				text(
					compact
						? '# ITEMS SOLD ' + totals.itemCount
						: totals.itemCount + (totals.itemCount === 1 ? ' item' : ' items'),
					baseSize,
					false,
					'center'
				);
			gap(3);
			if (compact) text('TC# ' + Core.barcodePayload(receipt.receiptNumber), 8, false, 'center');
			ops.push({ type: 'barcode', ...Core.barcode(receipt.receiptNumber), h: compact ? 12 : 16 });
			if (!compact && !retail) text(Core.barcodePayload(receipt.receiptNumber), 7, false, 'center');
			if (retail || compact) {
				gap(retail ? 7 : 3);
				text(receipt.footerNote || 'Thank you for your business!', baseSize, false, 'center');
			}
			if (compact) {
				gap(4);
				ops.push({ type: 'qr', ...qr(receipt.receiptNumber), h: 23 });
			}
		}
		gap(5);
		text(
			invoice
				? receipt.receiptNumber +
						' / ' +
						money(totals.balance) +
						(receipt.dueDate ? ' due ' + Core.displayDate(receipt.dueDate) : ' amount due')
				: 'Created for bookkeeping',
			7,
			false,
			invoice ? 'left' : 'center'
		);

		const top = invoice ? 20 : 7;
		const bottom = invoice ? 18 : 8;
		const height = invoice
			? 297
			: Math.min(2000, Math.max(120, Math.ceil(ops.reduce((n, op) => n + op.h, 0) + top + bottom)));
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: [width, height],
			compress: true
		});
		registerFont(doc);
		doc.setProperties({
			title: (invoice ? 'Invoice ' : 'Receipt ') + receipt.receiptNumber,
			author: receipt.businessName,
			subject: 'Bookkeeping document'
		});
		doc.setLanguage('en-US');
		let y = top;
		let inTable = false;
		const tableHeader = ops.find((op) => op.type === 'tableHeader');
		const decorate = () => {
			doc.setTextColor(24, 24, 27);
			if (invoice) {
				doc.setFillColor(104, 80, 240);
				doc.rect(0, 0, width, 2, 'F');
			}
		};
		const drawColumns = (op) => {
			let x = margin;
			op.cells.forEach((cell) => {
				doc.setFont(font, cell.bold ? 'bold' : 'normal');
				doc.setFontSize(cell.size);
				cell.lines.forEach((line, index) =>
					doc.text(
						line,
						cell.align === 'right' ? x + cell.width - 1 : x,
						y + (index + 0.8) * lineHeight(cell.size),
						{ align: cell.align || 'left' }
					)
				);
				x += cell.width;
			});
			y += op.h;
			if (op.type === 'tableRow' || op.type === 'tableHeader' || op.type === 'summary') {
				doc.setDrawColor(op.type === 'tableHeader' ? 50 : 225);
				doc.setLineWidth(0.2);
				doc.line(op.type === 'summary' ? margin + inner / 2 : margin, y - 2, width - margin, y - 2);
			}
		};
		decorate();
		ops.forEach((op) => {
			if (op.type === 'footerStart') {
				y = Math.max(y + 5, 210);
				return;
			}
			// Keep the header with its first row; repeat column labels on overflow.
			const nextHeight = op.type === 'tableHeader' ? ops[ops.indexOf(op) + 1]?.h || 0 : 0;
			if (y + op.h + nextHeight > height - bottom) {
				doc.addPage([width, height], 'portrait');
				decorate();
				y = top;
				if (inTable && op.type === 'tableRow' && tableHeader) drawColumns(tableHeader);
			}
			inTable = op.type === 'tableHeader' || op.type === 'tableRow';
			if (op.type === 'gap') {
				y += op.h;
				return;
			}
			if (['columns', 'tableHeader', 'tableRow', 'summary'].includes(op.type)) {
				drawColumns(op);
				return;
			}
			if (op.type === 'rule') {
				doc.setDrawColor(invoice ? 215 : 80);
				doc.setLineWidth(0.2);
				doc.setLineDashPattern(op.dashed ? [1, 0.7] : [], 0);
				doc.line(margin, y + op.h / 2, width - margin, y + op.h / 2);
				doc.setLineDashPattern([], 0);
			} else if (op.type === 'invoiceLogo') {
				if (receipt.logo) {
					const scale = Math.min(22 / receipt.logoW, 18 / receipt.logoH);
					doc.addImage(
						receipt.logo,
						'PNG',
						width - margin - receipt.logoW * scale,
						y,
						receipt.logoW * scale,
						receipt.logoH * scale
					);
				} else {
					doc.setFillColor(104, 80, 240);
					doc.circle(width - margin - 7, y + 7, 7, 'F');
					doc.setFont('helvetica', 'bold');
					doc.setFontSize(24);
					doc.setTextColor(255);
					doc.text(
						receipt.businessName.trim().slice(0, 1).toUpperCase() || 'Y',
						width - margin - 7,
						y + 10,
						{ align: 'center' }
					);
					doc.setTextColor(24, 24, 27);
				}
			} else if (op.type === 'link') {
				doc.setTextColor(104, 80, 240);
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(10);
				doc.textWithLink('Pay online', margin, y + 4, { url: op.url });
				doc.setTextColor(24, 24, 27);
			} else if (op.type === 'qr') {
				const moduleWidth = 22 / op.size;
				doc.setFillColor(0);
				op.cells.forEach((cell) =>
					doc.rect(
						(width - 22) / 2 + cell.x * moduleWidth,
						y + cell.y * moduleWidth,
						moduleWidth,
						moduleWidth,
						'F'
					)
				);
			} else if (op.type === 'image') {
				doc.addImage(op.data, 'PNG', invoice ? margin : (width - op.w) / 2, y, op.w, op.imageH);
			} else if (op.type === 'barcode') {
				const moduleWidth = Math.min(0.45, inner / op.width);
				const left = (width - op.width * moduleWidth) / 2;
				doc.setFillColor(0);
				op.bars.forEach((bar) =>
					doc.rect(left + bar.x * moduleWidth, y, bar.width * moduleWidth, op.h - 2, 'F')
				);
			} else {
				doc.setFont(op.face, op.bold ? 'bold' : 'normal');
				doc.setFontSize(op.size);
				const x = op.align === 'center' ? width / 2 : margin;
				op.lines.forEach((line, index) =>
					doc.text(line, x, y + (index + 0.8) * lineHeight(op.size), { align: op.align })
				);
			}
			y += op.h;
		});
		if (invoice) {
			for (let page = 1; page <= doc.getNumberOfPages(); page++) {
				doc.setPage(page);
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(8);
				doc.setTextColor(90);
				doc.text(
					receipt.receiptNumber + '  /  ' + page + ' of ' + doc.getNumberOfPages(),
					width - margin,
					height - 10,
					{ align: 'right' }
				);
			}
		}
		return doc;
	}
	return { create, qr };
});
