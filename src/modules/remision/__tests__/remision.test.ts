import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_COMPANY_INFO } from '../constants/companyInfo';
import { CATALOGO_MATERIALES } from '../data/catalogoMateriales';
import {
  ensureFerreteriaName,
  FERRETERIAS_FICTICIAS,
} from '../data/ferreteriasFicticias';
import { calculateRemisionTotals } from '../lib/calculateRemisionTotals';
import { createFolio } from '../lib/createFolio';
import {
  estimateAreaM2,
  generateRemisionItems,
  sumItemsImporte,
} from '../lib/generateRemisionItems';
import { numberToSpanishCurrency } from '../lib/numberToSpanishCurrency';
import {
  validateForGenerateConcepts,
  validatePorcentajeIncremento,
  validateRemisionForPdf,
} from '../lib/validation';
import {
  buildRemisionPdfDoc,
  maxTableRowsForPage,
  paginateRemisionItems,
} from '../pdf/generateRemisionPDF';
import {
  buildRemisionPdfFilename,
  sanitizeFilenamePart,
} from '../lib/buildRemisionPdfFilename';
import type { Remision, RemisionFormData, RemisionItem, TipoRemodelacion } from '../types';

function generar(
  tipo: TipoRemodelacion,
  montoAprobado = 100_000,
  porcentaje = 20,
  areaM2?: number,
): RemisionItem[] {
  const totals = calculateRemisionTotals(montoAprobado, 'incluido', porcentaje);
  return generateRemisionItems({
    montoAprobado,
    totalRemision: totals.total_remision,
    tipoRemodelacion: tipo,
    plazo: '15 días',
    ivaMode: 'incluido',
    catalogo: CATALOGO_MATERIALES,
    areaM2,
  });
}

function nombres(items: RemisionItem[]): string {
  return items.map((i) => i.concepto.toLowerCase()).join(' | ');
}

function sampleRemision(overrides: Partial<Remision> = {}): Remision {
  const totals = calculateRemisionTotals(100_000, 'incluido', 20);
  const items = generar('Baño', 100_000, 20).slice(0, 3);
  return {
    id: 'test-id',
    folio: 'REM-000099',
    fecha: '2026-07-14',
    nombre_cliente: 'Juan Pérez',
    rfc: 'XAXX010101000',
    direccion: 'Calle 1',
    telefono: '5512345678',
    ciudad: 'CDMX',
    monto_aprobado: 100_000,
    porcentaje_incremento: totals.porcentaje_incremento,
    incremento_monto: totals.incremento_monto,
    total_remision: totals.total_remision,
    plazo: '12 meses',
    tipo_remodelacion: 'Baño',
    iva_mode: 'incluido',
    subtotal: totals.subtotal,
    iva: totals.iva,
    total: totals.total,
    items,
    ferreteria_nombre: 'FERRETERÍA EL MARTILLO',
    created_at: '2026-07-14T00:00:00.000Z',
    updated_at: '2026-07-14T00:00:00.000Z',
    ...overrides,
  };
}

describe('calculateRemisionTotals', () => {
  it('default 20%: 100000 → 120000', () => {
    const t = calculateRemisionTotals(100_000);
    expect(t.porcentaje_incremento).toBe(20);
    expect(t.incremento_monto).toBe(20_000);
    expect(t.total_remision).toBe(120_000);
  });

  it('porcentaje editable 15%: 100000 → 115000', () => {
    const t = calculateRemisionTotals(100_000, 'incluido', 15);
    expect(t.incremento_monto).toBe(15_000);
    expect(t.total_remision).toBe(115_000);
    expect(t.total).toBe(115_000);
  });

  it('porcentaje editable 25%: 85000 → 106250', () => {
    const t = calculateRemisionTotals(85_000, 'incluido', 25);
    expect(t.incremento_monto).toBe(21_250);
    expect(t.total_remision).toBe(106_250);
  });

  it('porcentaje 0: total = monto aprobado', () => {
    const t = calculateRemisionTotals(100_000, 'incluido', 0);
    expect(t.incremento_monto).toBe(0);
    expect(t.total_remision).toBe(100_000);
  });

  it('IVA incluido: subtotal + iva = total', () => {
    const t = calculateRemisionTotals(100_000, 'incluido', 20);
    expect(t.subtotal + t.iva).toBeCloseTo(120_000, 2);
  });

  it('Sin IVA: iva = 0 y total = total_remision', () => {
    const t = calculateRemisionTotals(100_000, 'sin_iva', 20);
    expect(t.iva).toBe(0);
    expect(t.total).toBe(120_000);
  });
});

describe('generateRemisionItems — coherencia profesional', () => {
  it('A) Techo $100k 20% → 120k sin estructura/plomería/eléctrico y con SAT', () => {
    for (let i = 0; i < 5; i++) {
      const items = generar('Techo / impermeabilización', 100_000, 20);
      expect(sumItemsImporte(items)).toBe(120_000);
      const texto = nombres(items);
      expect(texto).toMatch(/impermeabilizante|malla|sellador|mano de obra/);
      expect(texto).not.toMatch(/block|varilla|sanitario|tarja|plomería|instalación eléctrica/);
      expect(texto).not.toMatch(/\bajuste\b|\bdiferencia\b|\bcuadre\b|\brelleno\b/);
      expect(items.every((it) => !!it.sat_code)).toBe(true);
    }
  });

  it('generador cuadra con porcentaje distinto a 20 (15%)', () => {
    const items = generar('Cocina', 100_000, 15);
    expect(sumItemsImporte(items)).toBe(115_000);
  });

  it('B) Baño genera conceptos de baño', () => {
    const items = generar('Baño', 100_000, 20);
    expect(sumItemsImporte(items)).toBe(120_000);
    const texto = nombres(items);
    expect(texto).toMatch(/sanitario/);
    expect(texto).toMatch(/lavabo|mezcladora|azulejo|piso|pegazulejo/);
    expect(texto).not.toMatch(/tarja|impermeabilizante acrílico|impermeabilizante asfáltico/);
    expect(items.every((it) => !!it.sat_code)).toBe(true);
  });

  it('C) Cocina genera conceptos de cocina', () => {
    const items = generar('Cocina', 80_000, 20);
    expect(sumItemsImporte(items)).toBe(96_000);
    const texto = nombres(items);
    expect(texto).toMatch(/tarja|mezcladora|cubierta|piso|azulejo/);
    expect(texto).not.toMatch(/sanitario|regadera/);
  });

  it('D) Piso genera piso/pegazulejo/boquilla', () => {
    const items = generar('Piso / azulejo', 70_000, 20);
    expect(sumItemsImporte(items)).toBe(84_000);
    const texto = nombres(items);
    expect(texto).toMatch(/piso|pegazulejo|boquilla|zoclo|mano de obra/);
    expect(texto).not.toMatch(/tarja|sanitario/);
  });

  it('estima área razonable para techo', () => {
    const area = estimateAreaM2('Techo / impermeabilización', 120_000);
    expect(area).toBeGreaterThanOrEqual(25);
    expect(area).toBeLessThanOrEqual(160);
  });
});

describe('validación', () => {
  const baseForm: RemisionFormData = {
    fecha: '2026-07-14',
    nombre_cliente: 'Juan Pérez',
    rfc: 'XAXX010101000',
    direccion: 'Calle 1',
    telefono: '5512345678',
    ciudad: 'CDMX',
    monto_aprobado: 100_000,
    porcentaje_incremento: 20,
    plazo: '',
    tipo_remodelacion: 'Baño',
    iva_mode: 'incluido',
  };

  const itemOk: RemisionItem = {
    id: '1',
    cantidad: 1,
    unidad: 'servicio',
    concepto: 'Mano de obra especializada',
    precio_unitario: 120_000,
    importe: 120_000,
    sat_code: '72102900',
  };

  it('no permite PDF sin plazo', () => {
    const r = validateRemisionForPdf(baseForm, [itemOk], 120_000);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('plazo'))).toBe(true);
  });

  it('no permite PDF sin código SAT', () => {
    const r = validateRemisionForPdf(
      { ...baseForm, plazo: '10 días' },
      [{ ...itemOk, sat_code: '' }],
      120_000,
    );
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('SAT'))).toBe(true);
  });

  it('bloquea porcentaje vacío, negativo o inválido', () => {
    expect(validatePorcentajeIncremento('').valid).toBe(false);
    expect(validatePorcentajeIncremento(Number.NaN).valid).toBe(false);
    expect(validatePorcentajeIncremento(-5).valid).toBe(false);
    expect(validatePorcentajeIncremento(101).valid).toBe(false);
    expect(validatePorcentajeIncremento('abc').valid).toBe(false);
  });

  it('permite porcentaje 0', () => {
    expect(validatePorcentajeIncremento(0).valid).toBe(true);
  });

  it('no genera conceptos sin monto aprobado', () => {
    const r = validateForGenerateConcepts({
      ...baseForm,
      monto_aprobado: 0,
    });
    expect(r.valid).toBe(false);
  });
});

describe('createFolio', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('genera folios incrementales REM-000001', () => {
    expect(createFolio()).toBe('REM-000001');
    expect(createFolio()).toBe('REM-000002');
  });
});

describe('catálogo', () => {
  it('tiene al menos 180 conceptos activos con SAT y fuente', () => {
    expect(CATALOGO_MATERIALES.length).toBeGreaterThanOrEqual(180);
    expect(CATALOGO_MATERIALES.every((c) => c.activo && c.sat_code && c.fuente_nombre)).toBe(
      true,
    );
  });
});

describe('numberToSpanishCurrency', () => {
  it('convierte 120000 correctamente', () => {
    const letra = numberToSpanishCurrency(120_000);
    expect(letra).toContain('PESOS');
    expect(letra).toMatch(/CIENTO VEINTE MIL/);
  });
});

describe('ferretería ficticia', () => {
  it('lista tiene nombres ficticios y no empresas reales', () => {
    expect(FERRETERIAS_FICTICIAS.length).toBeGreaterThanOrEqual(10);
    const joined = FERRETERIAS_FICTICIAS.join(' ');
    expect(joined).not.toMatch(/Home Depot|Construrama|Sodimac|Plomerama|Lowe|Cemex/i);
  });

  it('ensureFerreteriaName conserva el mismo nombre', () => {
    const a = ensureFerreteriaName('FERRETERÍA EL MARTILLO');
    const b = ensureFerreteriaName(a);
    expect(a).toBe('FERRETERÍA EL MARTILLO');
    expect(b).toBe(a);
  });

  it('companyInfo ya no tiene dirección MARIANO ESCOBEDO', () => {
    expect(DEFAULT_COMPANY_INFO.addressLine).not.toMatch(/MARIANO ESCOBEDO/i);
  });
});

describe('PDF contenido', () => {
  function pdfLatin1(doc: ReturnType<typeof buildRemisionPdfDoc>): string {
    const dataUri = doc.output('datauristring');
    const b64 = dataUri.split(',')[1] ?? '';
    return atob(b64);
  }

  it('incluye ferretería y no dirección MARIANO ni monto/porcentaje', () => {
    const remision = sampleRemision({
      ferreteria_nombre: 'FERRETERÍA EL MARTILLO',
    });
    const raw = pdfLatin1(buildRemisionPdfDoc(remision));
    expect(raw).toContain('MARTILLO');
    expect(raw).not.toMatch(/MARIANO/);
    expect(raw).not.toMatch(/ESCOBEDO/);
    expect(raw).toContain(remision.rfc);
    expect(raw).not.toMatch(/monto.?aprobado/i);
    expect(raw).not.toMatch(/porcentaje.?incremento/i);
    expect(raw).toMatch(/RFC/);
  });

  it('conserva la misma ferretería al regenerar el PDF', () => {
    const remision = sampleRemision({
      ferreteria_nombre: 'MATERIALES DEL NORTE',
    });
    const a = pdfLatin1(buildRemisionPdfDoc(remision));
    const b = pdfLatin1(buildRemisionPdfDoc(remision));
    expect(a).toContain('MATERIALES');
    expect(b).toContain('MATERIALES');
    expect(ensureFerreteriaName(remision.ferreteria_nombre)).toBe(
      'MATERIALES DEL NORTE',
    );
  });
});

describe('nombre de archivo PDF', () => {
  it('sanitizeFilenamePart quita acentos y caracteres inválidos', () => {
    expect(sanitizeFilenamePart('Greco Villanueva')).toBe('greco-villanueva');
    expect(sanitizeFilenamePart('José María Núñez')).toBe('jose-maria-nunez');
    expect(sanitizeFilenamePart('A/B\\C:D*E?F"G<H>I|J')).toBe('a-b-c-d-e-f-g-h-i-j');
    expect(sanitizeFilenamePart('   ')).toBe('');
  });

  it('buildRemisionPdfFilename con folio y cliente', () => {
    const name = buildRemisionPdfFilename({
      folio: 'REM-000001',
      nombre_cliente: 'Greco Villanueva',
      fecha: '2026-07-16',
    });
    expect(name).toBe('REM-000001-greco-villanueva-16-07-2026.pdf');
  });

  it('buildRemisionPdfFilename sin cliente usa remision', () => {
    const name = buildRemisionPdfFilename({
      folio: 'REM-000002',
      nombre_cliente: '',
      fecha: '2026-07-16',
    });
    expect(name).toBe('REM-000002-remision-16-07-2026.pdf');
  });

  it('buildRemisionPdfFilename sin folio usa REM-temp + hora', () => {
    const name = buildRemisionPdfFilename({
      folio: '',
      nombre_cliente: 'Greco Villanueva',
      fecha: '2026-07-16',
    });
    expect(name).toMatch(
      /^REM-temp-greco-villanueva-16-07-2026-\d{6}\.pdf$/,
    );
  });

  it('no permite caracteres raros en el filename final', () => {
    const name = buildRemisionPdfFilename({
      folio: 'REM-000003',
      nombre_cliente: 'Cliente / Especial*:Nombre?',
      fecha: '2026-07-16',
    });
    expect(name).toBe('REM-000003-cliente-especial-nombre-16-07-2026.pdf');
    expect(name).not.toMatch(/[\\/:*?"<>|]/);
  });
});

describe('paginación PDF', () => {
  const fakeItem = (n: number): RemisionItem => ({
    id: String(n),
    cantidad: 1,
    unidad: 'pza',
    concepto: `Concepto ${n}`,
    precio_unitario: 100,
    importe: 100,
    sat_code: '30111601',
  });

  it('no corta a 10 si caben más en una página con footer', () => {
    const pageH = 279.4;
    const maxLast = maxTableRowsForPage(pageH, true);
    expect(maxLast).toBeGreaterThan(10);
    const items = Array.from({ length: Math.min(15, maxLast) }, (_, i) =>
      fakeItem(i),
    );
    const pages = paginateRemisionItems(
      items,
      maxTableRowsForPage(pageH, false),
      maxLast,
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(items.length);
  });

  it('llena página intermedia y deja resto en la última', () => {
    const pageH = 279.4;
    const maxLast = maxTableRowsForPage(pageH, true);
    const maxCont = maxTableRowsForPage(pageH, false);
    const total = maxLast + 5;
    const items = Array.from({ length: total }, (_, i) => fakeItem(i));
    const pages = paginateRemisionItems(items, maxCont, maxLast);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages[0].length).toBeGreaterThan(10);
    expect(pages.flat()).toHaveLength(total);
  });
});
