import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINR } from './format';

export function downloadPdfReport({ title, subtitle, summary, tables = [], steps = [], assumptions = [] }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (subtitle) {
    doc.text(subtitle, margin, y);
    y += 18;
  }
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, y);
  y += 24;
  doc.setTextColor(0);

  if (summary?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Summary', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    summary.forEach(({ label, value }) => {
      doc.text(`${label}: ${typeof value === 'number' ? formatINR(value) : value}`, margin, y);
      y += 14;
    });
    y += 10;
  }

  tables.forEach(({ title: tableTitle, columns, rows }) => {
    autoTable(doc, {
      startY: y,
      head: [columns],
      body: rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [99, 102, 241] },
      theme: 'striped',
      didDrawPage: (data) => {
        y = data.cursor.y + 16;
      },
    });
    if (tableTitle) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(tableTitle, margin, y - (doc.lastAutoTable?.finalY || y) + 12);
    }
    y = doc.lastAutoTable.finalY + 20;
  });

  if (steps.length) {
    if (y > 700) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Calculation Steps', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    steps.forEach((step, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, 515);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 4;
      if (y > 760) { doc.addPage(); y = margin; }
    });
    y += 10;
  }

  if (assumptions.length) {
    if (y > 700) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Assumptions', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    assumptions.forEach((item) => {
      doc.text(`• ${item}`, margin, y);
      y += 12;
    });
  }

  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}-report.pdf`);
}
