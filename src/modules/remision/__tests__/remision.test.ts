import { beforeEach, describe, expect, it } from 'vitest';
import { calculateRemisionTotals } from '../lib/calculateRemisionTotals';
import { createFolio } from '../lib/createFolio';
import { CATALOGO_MATERIALES } from '../data/catalogoMateriales';
import {
  estimateAreaM2,
  generateRemisionItems,
  sumItemsImporte,
} from '../lib/generateRemisionItems';
import { numberToSpanishCurrency } from '../lib/numberToSpanishCurrency';
import {
  validateForGenerateConcepts,
  validateRemisionForPdf,
} from '../lib/validation';
import type { RemisionFormData, RemisionItem, TipoRemodelacion } from '../types';

function generar(
  tipo: TipoRemodelacion,
  montoAprobado = 100_000,
  areaM2?: number,
): RemisionItem[] {
  const totalRemision = montoAprobado * 1.2;
  return generateRemisionItems({
    montoAprobado,
    totalRemision,
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

describe('calculateRemisionTotals', () => {
  it('calcula total remisión con incremento 20% para 100000', () => {
    const t = calculateRemisionTotals(100_000);
    expect(t.incremento_monto).toBe(20_000);
    expect(t.total_remision).toBe(120_000);
  });

  it('IVA incluido: total 120000', () => {
    const t = calculateRemisionTotals(100_000, 'incluido');
    expect(t.total).toBe(120_000);
    expect(t.subtotal + t.iva).toBeCloseTo(120_000, 2);
  });
});

describe('generateRemisionItems — coherencia profesional', () => {
  it('A) Techo $100k → 120k sin estructura/plomería/eléctrico y con SAT', () => {
    for (let i = 0; i < 5; i++) {
      const items = generar('Techo / impermeabilización', 100_000);
      expect(sumItemsImporte(items)).toBe(120_000);
      const texto = nombres(items);
      expect(texto).toMatch(/impermeabilizante|malla|sellador|mano de obra/);
      expect(texto).not.toMatch(/block|varilla|sanitario|tarja|plomería|instalación eléctrica/);
      expect(texto).not.toMatch(/\bajuste\b|\bdiferencia\b|\bcuadre\b|\brelleno\b/);
      expect(items.every((it) => !!it.sat_code)).toBe(true);
      for (const it of items) {
        if (
          it.unidad === 'servicio' ||
          /herramienta y consumibles|preparaci|flete|supervisi/i.test(it.concepto)
        ) {
          const maxPct = /mano de obra especializada/i.test(it.concepto) ? 0.35 : 0.25;
          expect(it.importe).toBeLessThanOrEqual(120_000 * maxPct + 0.05);
        }
      }
    }
  });

  it('B) Baño genera conceptos de baño', () => {
    const items = generar('Baño', 100_000);
    expect(sumItemsImporte(items)).toBe(120_000);
    const texto = nombres(items);
    expect(texto).toMatch(/sanitario/);
    expect(texto).toMatch(/lavabo|mezcladora|azulejo|piso|pegazulejo/);
    expect(texto).not.toMatch(/tarja|impermeabilizante acrílico|impermeabilizante asfáltico/);
    expect(items.every((it) => !!it.sat_code)).toBe(true);
  });

  it('C) Cocina genera conceptos de cocina', () => {
    const items = generar('Cocina', 80_000);
    expect(sumItemsImporte(items)).toBe(96_000);
    const texto = nombres(items);
    expect(texto).toMatch(/tarja|mezcladora|cubierta|piso|azulejo/);
    expect(texto).not.toMatch(/sanitario|regadera/);
  });

  it('D) Piso genera piso/pegazulejo/boquilla', () => {
    const items = generar('Piso / azulejo', 70_000);
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
