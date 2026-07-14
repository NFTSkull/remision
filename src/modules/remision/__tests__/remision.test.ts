import { beforeEach, describe, expect, it } from 'vitest';
import { calculateRemisionTotals } from '../lib/calculateRemisionTotals';
import { createFolio } from '../lib/createFolio';
import { CATALOGO_MATERIALES } from '../data/catalogoMateriales';
import {
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
): RemisionItem[] {
  const totalRemision = montoAprobado * 1.2;
  return generateRemisionItems({
    montoAprobado,
    totalRemision,
    tipoRemodelacion: tipo,
    plazo: '15 días',
    ivaMode: 'incluido',
    catalogo: CATALOGO_MATERIALES,
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

  it('calcula total remisión para 85000', () => {
    const t = calculateRemisionTotals(85_000);
    expect(t.total_remision).toBe(102_000);
  });

  it('IVA incluido: total 120000, subtotal/1.16 e IVA diferencia', () => {
    const t = calculateRemisionTotals(100_000, 'incluido');
    expect(t.total).toBe(120_000);
    expect(t.total_remision).toBe(120_000);
    expect(t.subtotal).toBeCloseTo(120_000 / 1.16, 2);
    expect(t.iva).toBeCloseTo(120_000 - t.subtotal, 2);
    expect(t.subtotal + t.iva).toBeCloseTo(120_000, 2);
  });
});

describe('generateRemisionItems', () => {
  it('cuadra exactamente con total_remision (sin diferencia de centavos)', () => {
    for (let i = 0; i < 5; i++) {
      const items = generar('Baño', 100_000);
      expect(sumItemsImporte(items)).toBe(120_000);
    }
  });

  it('baño no mete conceptos exclusivos de cocina', () => {
    const texto = nombres(generar('Baño'));
    expect(texto).toMatch(/sanitario|lavabo|regadera|azulejo|mezcladora/);
    expect(texto).not.toMatch(/tarja|campana extractora|mueble base cocina|alacena cocina/);
  });

  it('cocina no mete conceptos exclusivos de baño', () => {
    const texto = nombres(generar('Cocina', 80_000));
    expect(texto).toMatch(/tarja|cocina|mezcladora|mueble|campana|cubierta/);
    expect(texto).not.toMatch(/sanitario|regadera|cancel de baño|tina de baño/);
  });

  it('techo prioriza impermeabilización', () => {
    const texto = nombres(generar('Techo / impermeabilización', 50_000));
    expect(texto).toMatch(/impermeabilizante|sellador|malla|mano de obra/);
    expect(texto).not.toMatch(/sanitario/);
  });

  it('piso prioriza piso/pegazulejo/boquilla', () => {
    const texto = nombres(generar('Piso / azulejo', 70_000));
    expect(texto).toMatch(/piso|pegazulejo|boquilla|zoclo|mano de obra/);
  });

  it('eléctrico prioriza cable/contactos/centro de carga', () => {
    const texto = nombres(generar('Eléctrico', 60_000));
    expect(texto).toMatch(/cable|contacto|apagador|centro de carga|lámpara|mano de obra/);
  });

  it('plomería prioriza tubería/conexiones/válvulas', () => {
    const texto = nombres(generar('Plomería', 60_000));
    expect(texto).toMatch(/tubería|codo|válvula|llave|mezcladora|mano de obra|tee|teflón|cemento pvc/);
    expect(texto).not.toMatch(/sanitario|regadera/);
  });

  it('incluye partida ajustable para cerrar totales', () => {
    const items = generar('Baño');
    const tieneAjustable = items.some((i) =>
      /mano de obra especializada|servicio de instalaci|material complementario/i.test(
        i.concepto,
      ),
    );
    expect(tieneAjustable).toBe(true);
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
    concepto: 'Test',
    precio_unitario: 120_000,
    importe: 120_000,
  };

  it('no permite PDF sin plazo', () => {
    const r = validateRemisionForPdf(baseForm, [itemOk], 120_000);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('plazo'))).toBe(true);
  });

  it('no permite PDF si suma no cuadra con total_remision', () => {
    const r = validateRemisionForPdf(
      { ...baseForm, plazo: '10 días' },
      [{ ...itemOk, importe: 100_000 }],
      120_000,
    );
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('cuadrar'))).toBe(true);
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
  it('tiene al menos 120 conceptos', () => {
    expect(CATALOGO_MATERIALES.length).toBeGreaterThanOrEqual(120);
  });
});

describe('numberToSpanishCurrency', () => {
  it('convierte 120000 correctamente', () => {
    const letra = numberToSpanishCurrency(120_000);
    expect(letra).toContain('PESOS');
    expect(letra).toContain('00/100 M.N.');
    expect(letra).toMatch(/CIENTO VEINTE MIL/);
  });
});
