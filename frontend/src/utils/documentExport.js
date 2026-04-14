import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

function money(value) {
  return `${Number(value || 0).toFixed(3)} TND`;
}

function docLabel(docType) {
  return docType === 'quote' ? 'Quote' : 'Invoice';
}

function resolveReference(docData = {}, docType = 'quote') {
  return docData.reference || docData.number || `${docType === 'quote' ? 'QUOTE' : 'INVOICE'}-${new Date(docData.createdAt || Date.now()).getFullYear()}`;
}

function resolveProjectLabel(docData = {}) {
  return docData.projectTitle || docData.projectName || docData.project?.title || '—';
}

function drawRow(pdf, y, columns, widths, options = {}) {
  const x = 14;
  const rowHeight = options.rowHeight || 10;
  let cursor = x;
  pdf.setDrawColor(226, 232, 240);
  pdf.setFillColor(...(options.fillColor || [255, 255, 255]));
  pdf.rect(x, y, widths.reduce((sum, width) => sum + width, 0), rowHeight, 'FD');
  pdf.setFont('helvetica', options.bold ? 'bold' : 'normal');
  columns.forEach((value, index) => {
    pdf.text(String(value ?? ''), cursor + 2, y + 6.5, { maxWidth: widths[index] - 4 });
    cursor += widths[index];
    if (index < widths.length - 1) pdf.line(cursor, y, cursor, y + rowHeight);
  });
  return y + rowHeight;
}

export function exportDocumentPdf(docType, docData) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const title = docLabel(docType);
  const ref = resolveReference(docData, docType);
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 18;

  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(12, 12, pageWidth - 24, 28, 6, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(`BMP.tn • ${title}`, 18, 25);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Reference: ${ref}`, 18, 33);
  pdf.text(`Status: ${docData.status || 'DRAFT'}`, 78, 33);
  pdf.text(`Date: ${new Date(docData.createdAt || Date.now()).toLocaleDateString('en-GB')}`, 130, 33);
  pdf.setTextColor(15, 23, 42);
  y = 48;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Document information', 14, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(12, y, pageWidth - 24, 25, 4, 4);
  pdf.text(`Project: ${resolveProjectLabel(docData)}`, 16, y + 8);
  pdf.text(`Subtotal: ${money(docData.subTotal)}`, 16, y + 16);
  pdf.text(`VAT: ${(Number(docData.taxRate || 0) * 100).toFixed(0)}%`, 78, y + 16);
  pdf.text(`Discount: ${money(docData.discount)}`, 118, y + 16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total: ${money(docData.total)}`, 158, y + 16);
  y += 34;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  y = drawRow(pdf, y, ['Description', 'Qty', 'Unit price', 'Total'], [96, 20, 34, 34], {
    fillColor: [241, 245, 249],
    bold: true,
  });

  pdf.setFont('helvetica', 'normal');
  (docData.lines || []).forEach((line, index) => {
    if (y > 265) {
      pdf.addPage();
      y = 18;
      y = drawRow(pdf, y, ['Description', 'Qty', 'Unit price', 'Total'], [96, 20, 34, 34], {
        fillColor: [241, 245, 249],
        bold: true,
      });
    }
    y = drawRow(pdf, y, [
      `${index + 1}. ${line.description || ''}`,
      line.quantity ?? '',
      money(line.unitPrice),
      money(line.lineTotal),
    ], [96, 20, 34, 34], {
      fillColor: index % 2 === 0 ? [255, 255, 255] : [248, 250, 252],
    });
  });

  y += 8;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(110, y, pageWidth - 122, 30, 4, 4, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', 116, y + 8);
  pdf.text(money(docData.subTotal), pageWidth - 18, y + 8, { align: 'right' });
  pdf.text('VAT', 116, y + 15);
  pdf.text(money(docData.taxAmount), pageWidth - 18, y + 15, { align: 'right' });
  pdf.text('Discount', 116, y + 22);
  pdf.text(money(docData.discount), pageWidth - 18, y + 22, { align: 'right' });
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total', 116, y + 29);
  pdf.text(money(docData.total), pageWidth - 18, y + 29, { align: 'right' });

  const footerY = 286;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Generated from BMP.tn', 14, footerY);
  pdf.text('Merci pour votre confiance.', pageWidth - 14, footerY, { align: 'right' });
  pdf.save(`${title.toLowerCase()}-${ref}.pdf`);
}

export function exportDocumentExcel(docType, docData) {
  const label = docLabel(docType);
  const ref = resolveReference(docData, docType);
  const rows = [
    ['BMP.tn', '', '', ''],
    [label.toUpperCase(), '', '', ''],
    ['Reference', ref, 'Date', new Date(docData.createdAt || Date.now()).toLocaleDateString('en-GB')],
    ['Project', resolveProjectLabel(docData), 'Status', docData.status || 'DRAFT'],
    [],
    ['Description', 'Quantity', 'Unit price (TND)', 'Line total (TND)'],
    ...(docData.lines || []).map((line) => [line.description || '', Number(line.quantity || 0), Number(line.unitPrice || 0), Number(line.lineTotal || 0)]),
    [],
    ['', '', 'Subtotal', Number(docData.subTotal || 0)],
    ['', '', 'VAT', Number(docData.taxAmount || 0)],
    ['', '', 'Discount', Number(docData.discount || 0)],
    ['', '', 'Total', Number(docData.total || 0)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = [
    XLSX.utils.decode_range('A1:D1'),
    XLSX.utils.decode_range('A2:D2'),
  ];
  ws['!cols'] = [
    { wch: 44 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
  ];
  ws['!rows'] = rows.map((_, index) => ({ hpt: index <= 1 ? 22 : 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, label);
  XLSX.writeFile(wb, `${docType}-${ref}.xlsx`);
}
