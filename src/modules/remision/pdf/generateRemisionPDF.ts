/**
 * PDF profesional tipo hoja de remisión preimpresa.
 * Solo layout (márgenes, tipografía, columnas, bordes). Sin lógica de negocio.
 * La nota de remisión no sustituye CFDI; los códigos SAT son referenciales para control interno.
 */
import jsPDF from 'jspdf';
import type { Remision } from '../types';
import { DEFAULT_COMPANY_INFO } from '../constants/companyInfo';
import { formatCurrencyMXN } from '../lib/formatCurrencyMXN';
import { numberToSpanishCurrency } from '../lib/numberToSpanishCurrency';
import { normalizeMoney } from '../lib/normalizeMoney';

const VERDE: [number, number, number] = [46, 125, 50];
const NEGRO: [number, number, number] = [0, 0, 0];
const BLANCO: [number, number, number] = [255, 255, 255];

/** Layout compacto tipo hoja Excel / preimpresa */
const MIN_ROWS = 10;
const MARGIN = 9;
const BORDER = 0.45;
const ROW_H = 6.35;
const CLIENT_ROW_H = 6.4;
const HEAD_H = 10.5;
const TOTAL_ROW_H = 7;
const FONT_BODY = 7;
const FONT_SMALL = 6.2;
const FONT_LABEL = 7;
const FONT_HEADER = 5.8;

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  if (y && m && d) return `${d}/${m}/${y.slice(-2)}`;
  return fecha;
}

function drawCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    fill?: [number, number, number];
    text?: string;
    textColor?: [number, number, number];
    align?: 'left' | 'center' | 'right';
    fontSize?: number;
    bold?: boolean;
    padding?: number;
  } = {},
) {
  const {
    fill,
    text = '',
    textColor = NEGRO,
    align = 'left',
    fontSize = FONT_BODY,
    bold = false,
    padding = 1.1,
  } = opts;

  doc.setDrawColor(...NEGRO);
  doc.setLineWidth(BORDER);
  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.setFillColor(...BLANCO);
    doc.rect(x, y, w, h, 'FD');
  }

  if (text) {
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    const maxW = w - padding * 2;
    const lines = doc.splitTextToSize(text, maxW);
    const lineH = fontSize * 0.32;
    const textY = y + h / 2 + lineH / 2 - ((lines.length - 1) * lineH) / 2;
    let textX = x + padding;
    if (align === 'center') textX = x + w / 2;
    if (align === 'right') textX = x + w - padding;
    doc.text(lines, textX, textY, {
      align,
      baseline: 'middle',
      maxWidth: maxW,
    });
  }
}

function drawLabeledRow(
  doc: jsPDF,
  x: number,
  y: number,
  labelW: number,
  valueW: number,
  h: number,
  label: string,
  value: string,
) {
  drawCell(doc, x, y, labelW, h, {
    fill: VERDE,
    text: label,
    textColor: BLANCO,
    bold: true,
    fontSize: FONT_LABEL,
    align: 'left',
    padding: 1.4,
  });
  drawCell(doc, x + labelW, y, valueW, h, {
    text: value,
    fontSize: FONT_BODY,
    align: 'left',
    padding: 1.4,
  });
}

export function generateRemisionPDF(remision: Remision): void {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = MARGIN;
  const contentW = pageW - margin * 2;
  const company = DEFAULT_COMPANY_INFO;

  // Proporción compacta: concepto amplio, SAT fijo, importes estrechos
  const colWidths = {
    cant: 14,
    unidad: 16,
    concepto: 72,
    punit: 26,
    importe: 28,
    sat: contentW - (14 + 16 + 72 + 26 + 28),
  };

  const headers = [
    'CANTIDAD',
    'UNIDAD',
    'CONCEPTO',
    'PRECIO UNIT',
    'IMPORTE TOTAL',
    'CODIGOS DEL SAT\nDE PRODUCTO',
  ];

  const all = remision.items;
  const PAGE_SIZE = MIN_ROWS;
  const pages: (typeof remision.items)[] = [];
  if (all.length === 0) {
    pages.push([]);
  } else {
    for (let idx = 0; idx < all.length; idx += PAGE_SIZE) {
      pages.push(all.slice(idx, idx + PAGE_SIZE));
    }
  }

  pages.forEach((pageItems, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    let y = margin;

    // ── Bloque superior derecho: REMISION + FECHA (alineado al borde) ──
    const remW = 38;
    const remX = pageW - margin - remW;
    const remTitleH = 9;
    const fechaH = 7;

    drawCell(doc, remX, y, remW, remTitleH, {
      fill: VERDE,
      text: 'REMISION',
      textColor: BLANCO,
      bold: true,
      fontSize: 12,
      align: 'center',
      padding: 0.8,
    });
    drawCell(doc, remX, y + remTitleH, remW * 0.42, fechaH, {
      fill: VERDE,
      text: 'FECHA',
      textColor: BLANCO,
      bold: true,
      fontSize: FONT_SMALL,
      align: 'center',
      padding: 0.6,
    });
    drawCell(doc, remX + remW * 0.42, y + remTitleH, remW * 0.58, fechaH, {
      text: formatFecha(remision.fecha),
      fontSize: FONT_BODY,
      align: 'center',
      bold: true,
      padding: 0.6,
    });

    // RFC empresa — misma línea superior que REMISION
    const rfcLabelW = 16;
    const rfcGap = 2;
    const rfcValueW = remX - margin - rfcLabelW - rfcGap;
    drawCell(doc, margin, y, rfcLabelW, remTitleH, {
      fill: VERDE,
      text: 'RFC:',
      textColor: BLANCO,
      bold: true,
      fontSize: FONT_LABEL,
      align: 'center',
    });
    drawCell(doc, margin + rfcLabelW, y, rfcValueW, remTitleH, {
      text: company.rfc || ' ',
      fontSize: FONT_BODY,
      padding: 1.5,
    });

    y += remTitleH + fechaH + 2.5;

    // Dirección empresa centrada
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...NEGRO);
    doc.text(company.addressLine, pageW / 2, y + 2.2, {
      align: 'center',
      maxWidth: contentW - 4,
    });
    y += 6.5;

    // Datos cliente
    const labelW = 26;
    const valueW = contentW - labelW;
    const clienteRows: [string, string][] = [
      ['NOMBRE', remision.nombre_cliente],
      ['RFC', remision.rfc],
      ['DIRECCION', remision.direccion],
      ['TELEFONO', remision.telefono],
      ['CIUDAD', remision.ciudad],
      ['PLAZO', remision.plazo],
    ];
    for (const [label, value] of clienteRows) {
      drawLabeledRow(doc, margin, y, labelW, valueW, CLIENT_ROW_H, label, value);
      y += CLIENT_ROW_H;
    }

    y += 2.2;

    // Header tabla
    const cols = [
      colWidths.cant,
      colWidths.unidad,
      colWidths.concepto,
      colWidths.punit,
      colWidths.importe,
      colWidths.sat,
    ];
    let x = margin;
    for (let c = 0; c < headers.length; c++) {
      drawCell(doc, x, y, cols[c], HEAD_H, {
        fill: VERDE,
        text: headers[c],
        textColor: BLANCO,
        bold: true,
        fontSize: FONT_HEADER,
        align: 'center',
        padding: 0.7,
      });
      x += cols[c];
    }
    y += HEAD_H;

    const visualRows = Math.max(pageItems.length, MIN_ROWS);

    for (let r = 0; r < visualRows; r++) {
      const item = pageItems[r];
      const values = item
        ? [
            String(item.cantidad),
            item.unidad,
            item.concepto,
            formatCurrencyMXN(item.precio_unitario),
            formatCurrencyMXN(item.importe),
            item.sat_code || '',
          ]
        : ['', '', '', '', '', ''];
      const aligns: Array<'left' | 'center' | 'right'> = [
        'center',
        'center',
        'left',
        'right',
        'right',
        'center',
      ];
      x = margin;
      for (let c = 0; c < cols.length; c++) {
        drawCell(doc, x, y, cols[c], ROW_H, {
          text: values[c],
          fontSize: c === 2 ? 6.4 : FONT_BODY,
          align: aligns[c],
          bold: false,
          padding: c === 2 ? 1.2 : 0.9,
        });
        x += cols[c];
      }
      y += ROW_H;
    }

    if (pageIdx === pages.length - 1) {
      y += 1.5;
      const totalsW = 52;
      const letraW = contentW - totalsW;
      const letraLabelH = 5.5;
      const letraBodyH = TOTAL_ROW_H * 3 - letraLabelH;

      // Cantidad con letra (izquierda)
      drawCell(doc, margin, y, letraW, letraLabelH, {
        fill: VERDE,
        text: 'Cantidad con Letra.',
        textColor: BLANCO,
        bold: true,
        fontSize: FONT_LABEL,
        padding: 1.2,
      });
      drawCell(doc, margin, y + letraLabelH, letraW, letraBodyH, {
        text: numberToSpanishCurrency(remision.total),
        fontSize: 7.2,
        bold: true,
        padding: 1.5,
      });

      // Totales alineados a la derecha, misma altura total
      const tx = margin + letraW;
      const totLabelW = 22;
      const totValueW = totalsW - totLabelW;
      const totRows: [string, number][] = [
        ['SUBTOTAL', remision.subtotal],
        ['IVA', remision.iva],
        ['TOTAL', remision.total],
      ];
      let ty = y;
      for (const [lab, val] of totRows) {
        drawCell(doc, tx, ty, totLabelW, TOTAL_ROW_H, {
          fill: VERDE,
          text: lab,
          textColor: BLANCO,
          bold: true,
          fontSize: FONT_LABEL,
          align: 'center',
          padding: 0.8,
        });
        drawCell(doc, tx + totLabelW, ty, totValueW, TOTAL_ROW_H, {
          text: formatCurrencyMXN(normalizeMoney(val)),
          fontSize: lab === 'TOTAL' ? 8 : FONT_BODY,
          bold: lab === 'TOTAL',
          align: 'right',
          padding: 1.5,
        });
        ty += TOTAL_ROW_H;
      }

      y += TOTAL_ROW_H * 3 + 3.5;

      // Autorización
      drawCell(doc, margin, y, contentW, 10, {
        text: 'AUTORIZO LA COMPRA DE ESTOS ARTICULOS POR LA CANTIDAD ESPECIFICADA EN ESTE DOCUMENTO',
        fontSize: 7,
        bold: true,
        align: 'center',
        padding: 1.5,
      });
      y += 14;

      // Firma — recuadro + línea + leyenda centrada
      const firmBoxW = 78;
      const firmBoxH = 22;
      const firmX = (pageW - firmBoxW) / 2;
      doc.setDrawColor(...NEGRO);
      doc.setLineWidth(BORDER);
      doc.setFillColor(...BLANCO);
      doc.rect(firmX, y, firmBoxW, firmBoxH, 'FD');
      doc.setLineWidth(0.55);
      doc.line(firmX + 8, y + 12, firmX + firmBoxW - 8, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...NEGRO);
      doc.text('FIRMA DE CONFORMIDAD', pageW / 2, y + firmBoxH - 4.5, {
        align: 'center',
      });

      y += firmBoxH + 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(90, 90, 90);
      doc.text(
        'Este documento es una nota de remisión y no sustituye un comprobante fiscal digital.',
        pageW / 2,
        y,
        { align: 'center' },
      );
      doc.text(`Folio: ${remision.folio}`, pageW / 2, y + 3.5, { align: 'center' });
    } else {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(`Continúa…  Página ${pageIdx + 1}`, pageW / 2, pageH - 8, {
        align: 'center',
      });
    }
  });

  doc.save(`${remision.folio}.pdf`);
}
