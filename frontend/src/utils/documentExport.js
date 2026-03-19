import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

function formatMoney(value) {
  return `${Number(value || 0).toFixed(3)} TND`;
}

export function exportDocumentPdf(docType, docData) {
  const pdf = new jsPDF();
  const title = docType === 'quote' ? 'Devis' : 'Facture';
  let y = 20;
  pdf.setFontSize(18);
  pdf.text(title, 14, y);
  y += 10;
  pdf.setFontSize(11);
  pdf.text(`Reference: ${docData.reference || docData._id || '-'}`, 14, y);
  y += 8;
  pdf.text(`Projet: ${docData.projectId || '-'}`, 14, y);
  y += 8;
  pdf.text(`Statut: ${docData.status || '-'}`, 14, y);
  y += 12;

  (docData.lines || []).forEach((line, index) => {
    const text = `${index + 1}. ${line.description} - ${line.quantity} x ${formatMoney(line.unitPrice)} = ${formatMoney(line.lineTotal)}`;
    const wrapped = pdf.splitTextToSize(text, 180);
    pdf.text(wrapped, 14, y);
    y += wrapped.length * 6;
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
  });

  y += 6;
  pdf.text(`Sous-total: ${formatMoney(docData.subTotal)}`, 14, y);
  y += 8;
  pdf.text(`TVA: ${formatMoney(docData.taxAmount)}`, 14, y);
  y += 8;
  pdf.text(`Remise: ${formatMoney(docData.discount)}`, 14, y);
  y += 8;
  pdf.text(`Total: ${formatMoney(docData.total)}`, 14, y);
  pdf.save(`${title.toLowerCase()}-${docData.reference || docData._id || 'export'}.pdf`);
}

export function exportDocumentExcel(docType, docData) {
  const rows = (docData.lines || []).map((line) => ({
    Description: line.description,
    Quantite: line.quantity,
    PrixUnitaire: line.unitPrice,
    TotalLigne: line.lineTotal,
  }));
  rows.push({});
  rows.push({ Description: 'Sous-total', TotalLigne: docData.subTotal });
  rows.push({ Description: 'TVA', TotalLigne: docData.taxAmount });
  rows.push({ Description: 'Remise', TotalLigne: docData.discount });
  rows.push({ Description: 'Total', TotalLigne: docData.total });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, docType === 'quote' ? 'Devis' : 'Facture');
  XLSX.writeFile(wb, `${docType}-${docData.reference || docData._id || 'export'}.xlsx`);
}
