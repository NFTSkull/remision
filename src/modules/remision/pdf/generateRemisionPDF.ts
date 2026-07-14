import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Remision } from '../types';
import { formatCurrencyMXN } from '../lib/formatCurrencyMXN';
import { numberToSpanishCurrency } from '../lib/numberToSpanishCurrency';

const VERDE_HEADER: [number, number, number] = [45, 122, 78];
const VERDE_CLARO: [number, number, number] = [232, 245, 236];
const GRIS_TEXTO: [number, number, number] = [51, 51, 51];

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return fecha;
}

export function generateRemisionPDF(remision: Remision): void {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Encabezado verde
  doc.setFillColor(...VERDE_HEADER);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('REMISIÓN', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Folio: ${remision.folio}`, pageWidth - margin, 22, { align: 'right' });

  y = 36;
  doc.setTextColor(...GRIS_TEXTO);
  doc.setFontSize(9);

  const col1 = margin;
  const col2 = pageWidth / 2 + 5;

  const datosIzq = [
    ['Fecha:', formatFecha(remision.fecha)],
    ['Cliente:', remision.nombre_cliente],
    ['RFC:', remision.rfc],
    ['Dirección:', remision.direccion],
  ];

  const datosDer = [
    ['Teléfono:', remision.telefono],
    ['Ciudad:', remision.ciudad],
    ['Plazo:', remision.plazo],
    ['Tipo:', remision.tipo_remodelacion],
  ];

  doc.setFont('helvetica', 'bold');
  for (let i = 0; i < datosIzq.length; i++) {
    doc.text(datosIzq[i][0], col1, y + i * 6);
    doc.setFont('helvetica', 'normal');
    doc.text(datosIzq[i][1], col1 + 22, y + i * 6);
    doc.setFont('helvetica', 'bold');
  }

  for (let i = 0; i < datosDer.length; i++) {
    doc.text(datosDer[i][0], col2, y + i * 6);
    doc.setFont('helvetica', 'normal');
    doc.text(datosDer[i][1], col2 + 22, y + i * 6);
    doc.setFont('helvetica', 'bold');
  }

  y += 30;

  const tableBody = remision.items.map((item, idx) => [
    String(idx + 1),
    String(item.cantidad),
    item.unidad,
    item.concepto,
    formatCurrencyMXN(item.precio_unitario),
    formatCurrencyMXN(item.importe),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Cant.', 'Unidad', 'Concepto', 'P. Unitario', 'Importe']],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
      textColor: GRIS_TEXTO,
    },
    headStyles: {
      fillColor: VERDE_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'left' },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 28 },
    },
    alternateRowStyles: { fillColor: VERDE_CLARO },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      );
    },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockMm = 72;
  let totalsY = doc.lastAutoTable.finalY + 8;

  // Evitar corte de totales/firma al fondo de página
  if (totalsY + footerBlockMm > pageHeight - 12) {
    doc.addPage();
    totalsY = margin;
  }

  const totalsX = pageWidth - margin - 60;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_TEXTO);

  // El PDF muestra total_remision (campo total), nunca monto_aprobado
  const totales = [
    ['Subtotal:', formatCurrencyMXN(remision.subtotal)],
    ['IVA (16%):', formatCurrencyMXN(remision.iva)],
    ['Total:', formatCurrencyMXN(remision.total)],
  ];

  for (const [label, value] of totales) {
    doc.setFont('helvetica', label === 'Total:' ? 'bold' : 'normal');
    doc.text(label, totalsX, totalsY);
    doc.text(value, pageWidth - margin, totalsY, { align: 'right' });
    totalsY += 6;
  }

  totalsY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Total con letra:', margin, totalsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const letra = numberToSpanishCurrency(remision.total);
  const letraLines = doc.splitTextToSize(letra, pageWidth - margin * 2);
  doc.text(letraLines, margin, totalsY + 5);

  totalsY += 5 + letraLines.length * 4 + 6;

  doc.setDrawColor(...VERDE_HEADER);
  doc.setLineWidth(0.3);
  doc.line(margin, totalsY, pageWidth - margin, totalsY);
  totalsY += 8;

  doc.setFontSize(8);
  doc.setTextColor(...GRIS_TEXTO);
  const authText =
    'Autorizo la compra de los artículos y servicios descritos en esta nota de remisión por la cantidad especificada en este documento.';
  const authLines = doc.splitTextToSize(authText, pageWidth - margin * 2);
  doc.text(authLines, margin, totalsY);

  totalsY += authLines.length * 4 + 6;

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  const disclaimer =
    'Este documento es una nota de remisión y no sustituye un comprobante fiscal digital.';
  doc.text(disclaimer, margin, totalsY);

  totalsY += 20;
  doc.setTextColor(...GRIS_TEXTO);
  doc.setDrawColor(...GRIS_TEXTO);
  doc.line(margin + 30, totalsY, pageWidth - margin - 30, totalsY);
  doc.setFontSize(8);
  doc.text('Firma de conformidad', pageWidth / 2, totalsY + 5, { align: 'center' });

  doc.save(`${remision.folio}.pdf`);
}
