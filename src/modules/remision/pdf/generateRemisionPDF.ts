/**
 * PDF profesional tipo hoja de remisión preimpresa.
 * Solo layout/paginación. Sin lógica de negocio.
 * La nota de remisión no sustituye CFDI; los códigos SAT son referenciales para control interno.
 */
import jsPDF from 'jspdf';
import type { Remision, RemisionItem } from '../types';
import { ensureFerreteriaName } from '../data/ferreteriasFicticias';
import { formatCurrencyMXN } from '../lib/formatCurrencyMXN';
import { numberToSpanishCurrency } from '../lib/numberToSpanishCurrency';
import { normalizeMoney } from '../lib/normalizeMoney';
import { buildRemisionPdfFilename } from '../lib/buildRemisionPdfFilename';

const VERDE: [number, number, number] = [46, 125, 50];
const NEGRO: [number, number, number] = [0, 0, 0];
const BLANCO: [number, number, number] = [255, 255, 255];

/** Layout compacto tipo hoja Excel / preimpresa */
const MIN_ROWS = 10;
const MARGIN = 9;
const BORDER = 0.45;
const ROW_H = 6.35;
const CLIENT_ROW_H = 6.4;
const CLIENT_ROWS = 6;
const HEAD_H = 10.5;
const TOTAL_ROW_H = 7;
const REM_TITLE_H = 9;
const FECHA_H = 7;
const GAP_AFTER_HEADER = 2.5;
const ADDRESS_H = 6.5;
const GAP_BEFORE_TABLE = 2.2;
const GAP_AFTER_TABLE = 1.5;
const GAP_AFTER_TOTALS = 3.5;
const AUTH_BLOCK_H = 14;
const FIRM_BOX_H = 22;
const GAP_AFTER_FIRM = 5;
const LEGAL_BLOCK_H = 8;
const CONTINUE_FOOTER_H = 12;
const FONT_BODY = 7;
const FONT_SMALL = 6.2;
const FONT_LABEL = 7;
const FONT_HEADER = 5.8;

/** Altura del bloque superior hasta el inicio de las filas de la tabla (sin margen top). */
export function headerHeightToTableRows(): number {
  return (
    REM_TITLE_H +
    FECHA_H +
    GAP_AFTER_HEADER +
    ADDRESS_H +
    CLIENT_ROWS * CLIENT_ROW_H +
    GAP_BEFORE_TABLE +
    HEAD_H
  );
}

/** Altura reservada para totales + autorización + firma + nota legal (última página). */
export function lastPageFooterHeight(): number {
  return (
    GAP_AFTER_TABLE +
    TOTAL_ROW_H * 3 +
    GAP_AFTER_TOTALS +
    AUTH_BLOCK_H +
    FIRM_BOX_H +
    GAP_AFTER_FIRM +
    LEGAL_BLOCK_H
  );
}

export function maxTableRowsForPage(
  pageH: number,
  withLastFooter: boolean,
): number {
  const top = MARGIN + headerHeightToTableRows();
  const bottom = withLastFooter
    ? lastPageFooterHeight() + MARGIN
    : CONTINUE_FOOTER_H + MARGIN;
  const avail = pageH - top - bottom;
  return Math.max(1, Math.floor(avail / ROW_H));
}

/**
 * Paginación dinámica: llena cada página con lo que quepa.
 * MIN_ROWS solo se usa después al pintar vacíos, no para cortar.
 */
export function paginateRemisionItems(
  items: RemisionItem[],
  maxRowsContinue: number,
  maxRowsLast: number,
): RemisionItem[][] {
  if (items.length === 0) return [[]];
  if (items.length <= maxRowsLast) return [items];

  const pages: RemisionItem[][] = [];
  let i = 0;
  while (i < items.length) {
    const left = items.length - i;
    if (left <= maxRowsLast) {
      pages.push(items.slice(i));
      break;
    }
    // Página intermedia: llenar al máximo; dejar al menos 1 para la última.
    let take = Math.min(maxRowsContinue, left - 1);
    take = Math.max(1, take);
    pages.push(items.slice(i, i + take));
    i += take;
  }
  return pages;
}

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

function drawPageHeader(
  doc: jsPDF,
  remision: Remision,
  pageW: number,
  margin: number,
  contentW: number,
): number {
  let y = margin;
  const remW = 38;
  const remX = pageW - margin - remW;

  // Solo REMISION / FECHA arriba a la derecha (sin RFC empresa vacío)
  drawCell(doc, remX, y, remW, REM_TITLE_H, {
    fill: VERDE,
    text: 'REMISION',
    textColor: BLANCO,
    bold: true,
    fontSize: 12,
    align: 'center',
    padding: 0.8,
  });
  drawCell(doc, remX, y + REM_TITLE_H, remW * 0.42, FECHA_H, {
    fill: VERDE,
    text: 'FECHA',
    textColor: BLANCO,
    bold: true,
    fontSize: FONT_SMALL,
    align: 'center',
    padding: 0.6,
  });
  drawCell(doc, remX + remW * 0.42, y + REM_TITLE_H, remW * 0.58, FECHA_H, {
    text: formatFecha(remision.fecha),
    fontSize: FONT_BODY,
    align: 'center',
    bold: true,
    padding: 0.6,
  });

  y += REM_TITLE_H + FECHA_H + GAP_AFTER_HEADER;

  // Emisor: ferretería ficticia (sin dirección fija ni datos de empresas reales)
  const ferreteria = ensureFerreteriaName(remision.ferreteria_nombre);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NEGRO);
  doc.text(ferreteria, pageW / 2, y + 2.2, {
    align: 'center',
    maxWidth: contentW - 4,
  });
  y += ADDRESS_H;

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

  y += GAP_BEFORE_TABLE;
  return y;
}

function drawTableHeader(
  doc: jsPDF,
  y: number,
  margin: number,
  cols: number[],
  headers: string[],
): number {
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
  return y + HEAD_H;
}

function drawItemRows(
  doc: jsPDF,
  y: number,
  margin: number,
  cols: number[],
  pageItems: RemisionItem[],
  visualRows: number,
): number {
  const aligns: Array<'left' | 'center' | 'right'> = [
    'center',
    'center',
    'left',
    'right',
    'right',
    'center',
  ];

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
    let x = margin;
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
  return y;
}

function drawLastFooter(
  doc: jsPDF,
  remision: Remision,
  y: number,
  pageW: number,
  margin: number,
  contentW: number,
): void {
  y += GAP_AFTER_TABLE;
  const totalsW = 52;
  const letraW = contentW - totalsW;
  const letraLabelH = 5.5;
  const letraBodyH = TOTAL_ROW_H * 3 - letraLabelH;

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

  y += TOTAL_ROW_H * 3 + GAP_AFTER_TOTALS;

  drawCell(doc, margin, y, contentW, 10, {
    text: 'AUTORIZO LA COMPRA DE ESTOS ARTICULOS POR LA CANTIDAD ESPECIFICADA EN ESTE DOCUMENTO',
    fontSize: 7,
    bold: true,
    align: 'center',
    padding: 1.5,
  });
  y += AUTH_BLOCK_H;

  const firmBoxW = 78;
  const firmX = (pageW - firmBoxW) / 2;
  doc.setDrawColor(...NEGRO);
  doc.setLineWidth(BORDER);
  doc.setFillColor(...BLANCO);
  doc.rect(firmX, y, firmBoxW, FIRM_BOX_H, 'FD');
  doc.setLineWidth(0.55);
  doc.line(firmX + 8, y + 12, firmX + firmBoxW - 8, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NEGRO);
  doc.text('FIRMA DE CONFORMIDAD', pageW / 2, y + FIRM_BOX_H - 4.5, {
    align: 'center',
  });

  y += FIRM_BOX_H + GAP_AFTER_FIRM;
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
}

export function buildRemisionPdfDoc(remision: Remision): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = MARGIN;
  const contentW = pageW - margin * 2;

  const colWidths = {
    cant: 14,
    unidad: 16,
    concepto: 72,
    punit: 26,
    importe: 28,
    sat: contentW - (14 + 16 + 72 + 26 + 28),
  };
  const cols = [
    colWidths.cant,
    colWidths.unidad,
    colWidths.concepto,
    colWidths.punit,
    colWidths.importe,
    colWidths.sat,
  ];
  const headers = [
    'CANTIDAD',
    'UNIDAD',
    'CONCEPTO',
    'PRECIO UNIT',
    'IMPORTE TOTAL',
    'CODIGOS DEL SAT\nDE PRODUCTO',
  ];

  const maxRowsLast = maxTableRowsForPage(pageH, true);
  const maxRowsContinue = maxTableRowsForPage(pageH, false);
  const pages = paginateRemisionItems(
    remision.items,
    maxRowsContinue,
    maxRowsLast,
  );
  const totalPages = pages.length;

  pages.forEach((pageItems, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    const isLast = pageIdx === totalPages - 1;

    let y = drawPageHeader(doc, remision, pageW, margin, contentW);
    y = drawTableHeader(doc, y, margin, cols, headers);

    const maxRowsThisPage = isLast ? maxRowsLast : maxRowsContinue;
    // Renglones vacíos solo para formato (mín. 10), sin forzar salto de página.
    let visualRows = pageItems.length;
    if (pageItems.length < MIN_ROWS) {
      visualRows = Math.min(MIN_ROWS, maxRowsThisPage);
    }

    y = drawItemRows(doc, y, margin, cols, pageItems, visualRows);

    if (isLast) {
      drawLastFooter(doc, remision, y, pageW, margin, contentW);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Continúa en la siguiente página', pageW / 2, pageH - 11, {
        align: 'center',
      });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Página ${pageIdx + 1} de ${totalPages}`, pageW / 2, pageH - 6, {
      align: 'center',
    });
  });

  return doc;
}

export function generateRemisionPDF(remision: Remision): void {
  const filename = buildRemisionPdfFilename(remision);
  buildRemisionPdfDoc(remision).save(filename);
}
