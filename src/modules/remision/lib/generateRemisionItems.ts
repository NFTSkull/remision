/**
 * Generación profesional de partidas de remisión.
 * Sistemas coherentes, cantidades acotadas y remanente repartido en servicios reales.
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  CatalogoMaterial,
  GenerateRemisionItemsParams,
  RemisionItem,
  TipoRemodelacion,
} from '../types';
import { normalizeMoney } from './normalizeMoney';

type LineRole =
  | 'principal'
  | 'complemento'
  | 'herramienta'
  | 'servicio'
  | 'mano_obra'
  | 'servicio_flex';

interface QtyContext {
  areaM2: number;
  totalRemision: number;
}

interface RecipeLine {
  ids: string[];
  role: LineRole;
  qty: (ctx: QtyContext) => number;
  soft?: boolean;
  concepto?: string;
}

interface Sistema {
  nombre: string;
  lineas: RecipeLine[];
  balancePoolIds?: string[];
}

const BALANCE_POOL_DEFAULT = [
  'mo-017',
  'mo-007',
  'mo-011',
  'mo-015',
  'mo-016',
  'mo-012',
  'mo-014',
  'mo-009',
  'mo-010',
];

const BAN_WORDS =
  /\b(ajuste|diferencia|cuadre|relleno|complementario para cerrar|cierre de diferencia)\b/i;

const MAX_SERVICIO_PCT = 0.25;
const MAX_MO_ESPECIALIZADA_PCT = 0.35;
const SPLIT_THRESHOLD_PCT = 0.15;

const LIMITE_CANTIDAD_GLOBAL: Record<string, { min: number; max: number }> = {
  'pin-004': { min: 2, max: 12 },
  'pin-005': { min: 1, max: 6 },
  'imp-008': { min: 1, max: 8 },
  'imp-003': { min: 2, max: 14 },
  'imp-004': { min: 2, max: 10 },
  'imp-001': { min: 2, max: 12 },
  'con-021': { min: 2, max: 12 },
  'con-020': { min: 2, max: 15 },
  'imp-002': { min: 1, max: 8 },
  'pin-008': { min: 2, max: 12 },
  'imp-005': { min: 2, max: 8 },
  'pin-009': { min: 2, max: 8 },
  'her-005': { min: 1, max: 10 },
  'ext-008': { min: 1, max: 10 },
  'con-008': { min: 20, max: 120 },
  'con-010': { min: 4, max: 30 },
  'con-011': { min: 4, max: 30 },
};

const ROLE_ORDER: LineRole[] = [
  'principal',
  'complemento',
  'herramienta',
  'servicio',
  'mano_obra',
  'servicio_flex',
];

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pickOne<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function byId(catalogo: CatalogoMaterial[], id: string): CatalogoMaterial | undefined {
  return catalogo.find((c) => c.id === id);
}

function firstAvailable(
  catalogo: CatalogoMaterial[],
  ids: string[],
): CatalogoMaterial | undefined {
  for (const id of ids) {
    const found = byId(catalogo, id);
    if (found) return found;
  }
  return undefined;
}

export function estimateAreaM2(
  tipo: TipoRemodelacion,
  totalRemision: number,
  areaUsuario?: number | null,
): number {
  if (areaUsuario && areaUsuario > 0) {
    return clamp(Math.round(areaUsuario), 4, 400);
  }

  const costoPorM2: Record<string, number> = {
    'Techo / impermeabilización': 1100,
    'Piso / azulejo': 900,
    Pintura: 350,
    Fachada: 450,
    Baño: 4500,
    Cocina: 4000,
    Sala: 900,
    Recámara: 900,
    'Patio / exterior': 700,
    Lavandería: 5000,
    Eléctrico: 1200,
    Plomería: 1500,
    'Ampliación ligera': 2200,
    'Remodelación general': 1400,
    'Mantenimiento general': 800,
  };

  const divisor = costoPorM2[tipo] ?? 1200;
  let area = totalRemision / divisor;

  if (tipo === 'Baño' || tipo === 'Cocina' || tipo === 'Lavandería') {
    area = clamp(area, 4, 18);
  } else if (tipo === 'Techo / impermeabilización') {
    area = clamp(area, 25, 160);
  } else if (tipo === 'Piso / azulejo' || tipo === 'Sala' || tipo === 'Recámara') {
    area = clamp(area, 12, 120);
  } else {
    area = clamp(area, 10, 180);
  }

  return Math.round(area);
}

function sanitizarConcepto(nombre: string): string {
  if (!BAN_WORDS.test(nombre)) return nombre;
  return nombre
    .replace(/\(ajuste\)/gi, '')
    .replace(/\bajuste\b/gi, '')
    .replace(/\bdiferencia\b/gi, '')
    .replace(/\bcuadre\b/gi, '')
    .replace(/\brelleno\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function esManoObraEspecializada(concepto: string): boolean {
  return /mano de obra especializada/i.test(concepto);
}

function esServicioCapado(item: RemisionItem): boolean {
  if (item.unidad === 'm²' && /mano de obra impermeabilizaci/i.test(item.concepto)) {
    return false; // justificado por m²
  }
  return (
    item.unidad === 'servicio' ||
    /preparaci|aplicaci|refuerzo|limpieza|flete|acarreo|supervisi|herramienta y consumibles|mano de obra especializada/i.test(
      item.concepto,
    )
  );
}

function topeImporte(concepto: string, totalRemision: number): number {
  const pct = esManoObraEspecializada(concepto)
    ? MAX_MO_ESPECIALIZADA_PCT
    : MAX_SERVICIO_PCT;
  return normalizeMoney(totalRemision * pct);
}

function crearItemDesdeCatalogo(
  material: CatalogoMaterial,
  cantidad: number,
  precioOverride?: number,
  conceptoOverride?: string,
): RemisionItem {
  const qty = Math.max(0.01, cantidad);
  const precio = precioOverride ?? material.precio_sugerido;
  return {
    id: uuidv4(),
    cantidad: qty,
    unidad: material.unidad,
    concepto: sanitizarConcepto(conceptoOverride ?? material.nombre),
    precio_unitario: normalizeMoney(precio),
    importe: normalizeMoney(qty * precio),
    sat_code: material.sat_code,
    sat_description: material.sat_description,
    fuente_nombre: material.fuente_nombre,
    fuente_url: material.fuente_url,
  };
}

function aplicarLimiteCantidad(id: string, qty: number): number {
  const lim = LIMITE_CANTIDAD_GLOBAL[id];
  if (!lim) return Math.max(1, Math.round(qty * 100) / 100);
  return clamp(Math.round(qty), lim.min, lim.max);
}

function setImporte(item: RemisionItem, importe: number): RemisionItem {
  const cantidad = item.cantidad > 0 ? item.cantidad : 1;
  const imp = normalizeMoney(Math.max(0.01, importe));
  return {
    ...item,
    cantidad,
    importe: imp,
    precio_unitario: normalizeMoney(imp / cantidad),
  };
}

// ─── Recetas ──────────────────────────────────────────────────────────────────

function sistemasTecho(): Sistema[] {
  const qtyAcrilico = (ctx: QtyContext) =>
    aplicarLimiteCantidad('pin-004', Math.ceil(ctx.areaM2 / 8));
  const qtySellador = (ctx: QtyContext) =>
    aplicarLimiteCantidad('pin-005', Math.ceil(ctx.areaM2 / 20));
  const qtyPrimario = (ctx: QtyContext) =>
    aplicarLimiteCantidad('imp-008', Math.ceil(ctx.areaM2 / 22));
  const qtyMalla = (ctx: QtyContext) =>
    aplicarLimiteCantidad('imp-002', Math.ceil(ctx.areaM2 / 45));
  const qtyResanador = (ctx: QtyContext) =>
    aplicarLimiteCantidad('con-020', Math.ceil(ctx.areaM2 / 12));
  const qtyRodillo = (ctx: QtyContext) =>
    aplicarLimiteCantidad('pin-008', clamp(Math.ceil(ctx.areaM2 / 25), 2, 12));
  const qtyCepillo = () => aplicarLimiteCantidad('imp-005', randomInt(2, 5));
  const qtyAndamio = (ctx: QtyContext) =>
    ctx.areaM2 > 50 ? aplicarLimiteCantidad('ext-008', randomInt(2, 6)) : 0;
  const qtyMO = (ctx: QtyContext) => ctx.areaM2;

  const balancePoolIds = [
    'mo-017',
    'mo-011',
    'mo-015',
    'mo-016',
    'mo-012',
    'mo-014',
    'mo-009',
    'mo-010',
  ];

  return [
    {
      nombre: 'acrilico',
      balancePoolIds,
      lineas: [
        {
          ids: ['pin-004'],
          role: 'principal',
          qty: qtyAcrilico,
          concepto: 'Aplicación de impermeabilizante acrílico',
        },
        { ids: ['pin-005'], role: 'complemento', qty: qtySellador, concepto: 'Sellador acrílico' },
        {
          ids: ['imp-008'],
          role: 'complemento',
          qty: qtyPrimario,
          concepto: 'Primario para impermeabilizante',
        },
        {
          ids: ['imp-002'],
          role: 'complemento',
          qty: qtyMalla,
          concepto: 'Refuerzo de puntos críticos con malla',
        },
        { ids: ['con-020'], role: 'complemento', qty: qtyResanador },
        { ids: ['pin-006'], role: 'herramienta', qty: qtyRodillo },
        { ids: ['imp-005'], role: 'herramienta', qty: qtyCepillo },
        { ids: ['ext-008', 'her-005'], role: 'herramienta', qty: qtyAndamio },
        { ids: ['mo-013'], role: 'servicio', qty: () => 1 },
        { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
        { ids: ['mo-006'], role: 'mano_obra', qty: qtyMO, soft: true },
        { ids: ['mo-011'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-015'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-016'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-017'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-012'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-010'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
      ],
    },
    {
      nombre: 'prefabricado',
      balancePoolIds,
      lineas: [
        {
          ids: ['imp-001'],
          role: 'principal',
          qty: (ctx) => aplicarLimiteCantidad('imp-001', Math.ceil(ctx.areaM2 / 9)),
          concepto: 'Aplicación de impermeabilizante prefabricado',
        },
        {
          ids: ['imp-002'],
          role: 'complemento',
          qty: qtyMalla,
          concepto: 'Refuerzo de puntos críticos con malla',
        },
        { ids: ['imp-008'], role: 'complemento', qty: qtyPrimario },
        { ids: ['con-020'], role: 'complemento', qty: qtyResanador },
        { ids: ['imp-005'], role: 'herramienta', qty: qtyCepillo },
        { ids: ['ext-008'], role: 'herramienta', qty: qtyAndamio },
        { ids: ['mo-013'], role: 'servicio', qty: () => 1 },
        { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
        { ids: ['mo-006'], role: 'mano_obra', qty: qtyMO, soft: true },
        { ids: ['mo-011'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-015'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-017'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-010'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
      ],
    },
    {
      nombre: 'cementoso',
      balancePoolIds,
      lineas: [
        {
          ids: ['imp-003', 'con-021'],
          role: 'principal',
          qty: (ctx) => aplicarLimiteCantidad('imp-003', Math.ceil(ctx.areaM2 / 7)),
          concepto: 'Aplicación de impermeabilizante cementoso',
        },
        {
          ids: ['imp-002'],
          role: 'complemento',
          qty: qtyMalla,
          concepto: 'Refuerzo de puntos críticos con malla',
        },
        { ids: ['imp-008'], role: 'complemento', qty: qtyPrimario },
        { ids: ['con-020'], role: 'complemento', qty: qtyResanador },
        { ids: ['pin-006'], role: 'herramienta', qty: qtyRodillo },
        { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
        { ids: ['mo-006'], role: 'mano_obra', qty: qtyMO, soft: true },
        { ids: ['mo-011'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-015'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-016'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-017'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
      ],
    },
    {
      nombre: 'asfaltico',
      balancePoolIds,
      lineas: [
        {
          ids: ['imp-004'],
          role: 'principal',
          qty: (ctx) => aplicarLimiteCantidad('imp-004', Math.ceil(ctx.areaM2 / 9)),
          concepto: 'Aplicación de impermeabilizante asfáltico',
        },
        {
          ids: ['imp-002'],
          role: 'complemento',
          qty: qtyMalla,
          concepto: 'Refuerzo de puntos críticos con malla',
        },
        { ids: ['imp-008'], role: 'complemento', qty: qtyPrimario },
        { ids: ['con-020'], role: 'complemento', qty: qtyResanador },
        { ids: ['pin-006'], role: 'herramienta', qty: qtyRodillo },
        { ids: ['imp-005'], role: 'herramienta', qty: qtyCepillo },
        { ids: ['mo-013'], role: 'servicio', qty: () => 1 },
        { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
        { ids: ['mo-006'], role: 'mano_obra', qty: qtyMO, soft: true },
        { ids: ['mo-011'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-015'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-017'], role: 'servicio_flex', qty: () => 1, soft: true },
        { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
      ],
    },
  ];
}

function sistemaBano(): Sistema {
  return {
    nombre: 'bano_estandar',
    balancePoolIds: ['mo-007', 'mo-008', 'mo-011', 'mo-009', 'mo-014', 'mo-010'],
    lineas: [
      { ids: ['ban-002', 'ban-001'], role: 'principal', qty: () => 1 },
      { ids: ['ban-003'], role: 'principal', qty: () => 1 },
      { ids: ['ban-005', 'ban-006'], role: 'principal', qty: () => 1 },
      { ids: ['ban-007', 'ban-008'], role: 'complemento', qty: () => 1 },
      {
        ids: ['piso-003'],
        role: 'principal',
        qty: (ctx) => clamp(Math.round(ctx.areaM2 * 1.05 * 2) / 2, 4, 16),
      },
      {
        ids: ['piso-004', 'piso-005'],
        role: 'principal',
        qty: (ctx) => clamp(Math.ceil((ctx.areaM2 * 2.2) / 1.5), 4, 18),
      },
      {
        ids: ['piso-006'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 3), 2, 10),
      },
      {
        ids: ['piso-007'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 5), 1, 6),
      },
      { ids: ['plo-001'], role: 'complemento', qty: () => randomInt(2, 4) },
      { ids: ['plo-005'], role: 'complemento', qty: () => randomInt(4, 10) },
      { ids: ['ban-009'], role: 'herramienta', qty: () => randomInt(2, 4) },
      { ids: ['plo-010'], role: 'herramienta', qty: () => 1 },
      { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
      { ids: ['esc-001'], role: 'servicio', qty: () => randomInt(1, 2) },
      {
        ids: ['mo-002'],
        role: 'mano_obra',
        qty: (ctx) => clamp(ctx.areaM2 * 2.5, 10, 40),
        soft: true,
      },
      { ids: ['mo-004'], role: 'mano_obra', qty: () => 1, soft: true },
      { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
    ],
  };
}

function sistemaCocina(): Sistema {
  return {
    nombre: 'cocina_estandar',
    balancePoolIds: ['mo-007', 'mo-008', 'mo-009', 'mo-014', 'mo-010'],
    lineas: [
      { ids: ['coc-002', 'coc-001'], role: 'principal', qty: () => 1 },
      { ids: ['coc-003'], role: 'principal', qty: () => 1 },
      {
        ids: ['coc-004', 'coc-005'],
        role: 'principal',
        qty: (ctx) => clamp(Math.round(ctx.areaM2 * 0.35 * 2) / 2, 2, 6),
      },
      { ids: ['coc-006'], role: 'principal', qty: () => randomInt(1, 2) },
      {
        ids: ['piso-001', 'piso-002'],
        role: 'principal',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 1.5), 4, 14),
      },
      {
        ids: ['piso-004', 'piso-005'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 2), 2, 10),
      },
      {
        ids: ['piso-006'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 3), 2, 8),
      },
      { ids: ['coc-010', 'ele-004'], role: 'complemento', qty: () => randomInt(4, 8) },
      { ids: ['ele-013', 'coc-009'], role: 'complemento', qty: () => randomInt(2, 4) },
      { ids: ['plo-001'], role: 'complemento', qty: () => randomInt(1, 3) },
      { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
      { ids: ['esc-001'], role: 'servicio', qty: () => 1 },
      {
        ids: ['mo-002'],
        role: 'mano_obra',
        qty: (ctx) => clamp(ctx.areaM2, 6, 20),
        soft: true,
      },
      { ids: ['mo-004'], role: 'mano_obra', qty: () => 1, soft: true },
      { ids: ['mo-008'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
    ],
  };
}

function sistemaPiso(): Sistema {
  return {
    nombre: 'piso_azulejo',
    balancePoolIds: ['mo-007', 'mo-009', 'mo-011', 'mo-014', 'mo-010'],
    lineas: [
      {
        ids: ['piso-002', 'piso-001'],
        role: 'principal',
        qty: (ctx) => clamp(Math.ceil((ctx.areaM2 * 1.08) / 1.5), 6, 40),
      },
      {
        ids: ['piso-006', 'piso-014'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 3.5), 3, 18),
      },
      {
        ids: ['piso-007'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 6), 2, 10),
      },
      {
        ids: ['piso-011', 'piso-010'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 2.5), 4, 24),
      },
      {
        ids: ['piso-009'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 15), 1, 6),
      },
      { ids: ['piso-008'], role: 'herramienta', qty: () => randomInt(1, 3) },
      { ids: ['her-002'], role: 'herramienta', qty: () => 1 },
      {
        ids: ['con-001'],
        role: 'complemento',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 20), 1, 6),
      },
      { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
      { ids: ['esc-001'], role: 'servicio', qty: () => 1 },
      { ids: ['mo-002'], role: 'mano_obra', qty: (ctx) => ctx.areaM2, soft: true },
      { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-011'], role: 'servicio_flex', qty: () => 1, soft: true },
    ],
  };
}

function sistemaGeneral(): Sistema {
  return {
    nombre: 'remodelacion_general',
    balancePoolIds: ['mo-007', 'mo-009', 'mo-014', 'mo-010', 'mo-008'],
    lineas: [
      { ids: ['con-001'], role: 'principal', qty: () => randomInt(6, 14) },
      { ids: ['con-003'], role: 'complemento', qty: () => randomInt(1, 3) },
      { ids: ['con-008'], role: 'principal', qty: () => randomInt(40, 100) },
      { ids: ['con-010'], role: 'complemento', qty: () => randomInt(8, 20) },
      { ids: ['pin-001', 'pin-002'], role: 'principal', qty: () => randomInt(2, 5) },
      { ids: ['piso-001'], role: 'principal', qty: () => randomInt(6, 14) },
      { ids: ['piso-006'], role: 'complemento', qty: () => randomInt(3, 8) },
      { ids: ['ele-001', 'ele-002'], role: 'complemento', qty: () => 1 },
      { ids: ['ele-004'], role: 'complemento', qty: () => randomInt(6, 12) },
      { ids: ['ele-005'], role: 'complemento', qty: () => randomInt(4, 8) },
      { ids: ['plo-001'], role: 'complemento', qty: () => randomInt(2, 5) },
      { ids: ['plo-006'], role: 'herramienta', qty: () => randomInt(2, 4) },
      { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
      { ids: ['esc-002', 'esc-001'], role: 'servicio', qty: () => 1 },
      { ids: ['mo-001'], role: 'mano_obra', qty: () => randomInt(5, 12), soft: true },
      { ids: ['mo-005'], role: 'mano_obra', qty: () => 1, soft: true },
      { ids: ['mo-004'], role: 'mano_obra', qty: () => 1, soft: true },
      { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
    ],
  };
}

function sistemaElectrico(): Sistema {
  return {
    nombre: 'electrico',
    balancePoolIds: ['mo-007', 'mo-005', 'mo-009', 'mo-014', 'mo-010'],
    lineas: [
      { ids: ['ele-002', 'ele-001'], role: 'principal', qty: () => randomInt(1, 3) },
      { ids: ['ele-004'], role: 'principal', qty: () => randomInt(8, 16) },
      { ids: ['ele-005', 'ele-006'], role: 'principal', qty: () => randomInt(6, 12) },
      { ids: ['ele-007', 'ele-008'], role: 'principal', qty: () => 1 },
      { ids: ['ele-009'], role: 'complemento', qty: () => randomInt(4, 10) },
      { ids: ['ele-010'], role: 'complemento', qty: () => randomInt(6, 16) },
      { ids: ['ele-011'], role: 'complemento', qty: () => randomInt(8, 20) },
      { ids: ['ele-012'], role: 'complemento', qty: () => randomInt(4, 10) },
      { ids: ['her-004'], role: 'herramienta', qty: () => 1 },
      { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
      { ids: ['mo-005'], role: 'mano_obra', qty: () => 1, soft: true },
      { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
    ],
  };
}

function sistemaPlomeria(): Sistema {
  return {
    nombre: 'plomeria',
    balancePoolIds: ['mo-007', 'mo-004', 'mo-009', 'mo-014', 'mo-010'],
    lineas: [
      { ids: ['plo-001', 'plo-002'], role: 'principal', qty: () => randomInt(3, 8) },
      { ids: ['plo-003'], role: 'principal', qty: () => randomInt(2, 5) },
      { ids: ['plo-005'], role: 'complemento', qty: () => randomInt(6, 16) },
      { ids: ['plo-005'], role: 'complemento', qty: () => randomInt(4, 10) },
      { ids: ['plo-006'], role: 'principal', qty: () => randomInt(2, 6) },
      { ids: ['plo-007'], role: 'complemento', qty: () => randomInt(1, 3) },
      { ids: ['ban-005', 'ban-006'], role: 'principal', qty: () => 1 },
      { ids: ['plo-010'], role: 'herramienta', qty: () => randomInt(1, 2) },
      { ids: ['plo-010'], role: 'herramienta', qty: () => randomInt(2, 5) },
      { ids: ['her-003'], role: 'herramienta', qty: () => 1 },
      { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
      { ids: ['mo-004'], role: 'mano_obra', qty: () => 1, soft: true },
      { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
    ],
  };
}

function sistemaPintura(): Sistema {
  return {
    nombre: 'pintura',
    balancePoolIds: ['mo-007', 'mo-011', 'mo-015', 'mo-009', 'mo-014'],
    lineas: [
      {
        ids: ['pin-001', 'pin-002'],
        role: 'principal',
        qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 28), 2, 8),
      },
      { ids: ['pin-005', 'pin-006'], role: 'complemento', qty: () => randomInt(1, 3) },
      { ids: ['con-020'], role: 'complemento', qty: () => randomInt(2, 6) },
      { ids: ['pin-008'], role: 'herramienta', qty: () => randomInt(3, 8) },
      { ids: ['pin-009'], role: 'herramienta', qty: () => randomInt(2, 5) },
      { ids: ['pin-011'], role: 'herramienta', qty: () => randomInt(2, 4) },
      { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
      { ids: ['mo-003'], role: 'mano_obra', qty: (ctx) => ctx.areaM2, soft: true },
      { ids: ['mo-011'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
      { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
    ],
  };
}

function elegirSistema(tipo: TipoRemodelacion): Sistema {
  switch (tipo) {
    case 'Techo / impermeabilización':
      return pickOne(sistemasTecho());
    case 'Baño':
      return sistemaBano();
    case 'Cocina':
      return sistemaCocina();
    case 'Piso / azulejo':
      return sistemaPiso();
    case 'Eléctrico':
      return sistemaElectrico();
    case 'Plomería':
      return sistemaPlomeria();
    case 'Pintura':
      return sistemaPintura();
    case 'Remodelación general':
    case 'Ampliación ligera':
      return sistemaGeneral();
    case 'Sala':
    case 'Recámara':
      return {
        nombre: 'acabados_interior',
        balancePoolIds: ['mo-007', 'mo-009', 'mo-011', 'mo-014'],
        lineas: [
          {
            ids: ['pin-001'],
            role: 'principal',
            qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 25), 2, 6),
          },
          {
            ids: ['piso-016', 'piso-001'],
            role: 'principal',
            qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 1.4), 8, 40),
          },
          {
            ids: ['sal-001', 'piso-010'],
            role: 'complemento',
            qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 2.4), 4, 20),
          },
          { ids: ['con-015', 'con-014'], role: 'complemento', qty: () => randomInt(2, 5) },
          { ids: ['ele-012'], role: 'complemento', qty: () => randomInt(2, 6) },
          { ids: ['ele-004'], role: 'complemento', qty: () => randomInt(4, 10) },
          {
            ids: ['sal-004'],
            role: 'complemento',
            qty: (ctx) => clamp(Math.round(ctx.areaM2 * 0.4), 4, 30),
          },
          { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
          { ids: ['mo-003'], role: 'mano_obra', qty: (ctx) => ctx.areaM2, soft: true },
          { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
          { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
        ],
      };
    case 'Fachada':
      return {
        nombre: 'fachada',
        balancePoolIds: ['mo-007', 'mo-011', 'mo-015', 'mo-009', 'mo-014'],
        lineas: [
          {
            ids: ['ext-001', 'pin-003'],
            role: 'principal',
            qty: (ctx) => clamp(Math.ceil(ctx.areaM2 / 25), 2, 8),
          },
          { ids: ['pin-005'], role: 'complemento', qty: () => randomInt(1, 3) },
          { ids: ['con-020'], role: 'complemento', qty: () => randomInt(2, 8) },
          { ids: ['ext-009'], role: 'complemento', qty: () => randomInt(1, 3) },
          { ids: ['ext-008'], role: 'herramienta', qty: () => randomInt(2, 7) },
          { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
          { ids: ['mo-003'], role: 'mano_obra', qty: (ctx) => ctx.areaM2, soft: true },
          { ids: ['mo-011'], role: 'servicio_flex', qty: () => 1, soft: true },
          { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
        ],
      };
    case 'Patio / exterior':
      return {
        nombre: 'patio',
        balancePoolIds: ['mo-007', 'mo-009', 'mo-014', 'mo-010'],
        lineas: [
          {
            ids: ['piso-012', 'piso-013'],
            role: 'principal',
            qty: (ctx) => clamp(ctx.areaM2, 10, 80),
          },
          { ids: ['con-001'], role: 'complemento', qty: () => randomInt(4, 10) },
          { ids: ['con-003'], role: 'complemento', qty: () => randomInt(1, 3) },
          { ids: ['con-004'], role: 'complemento', qty: () => randomInt(1, 2) },
          { ids: ['ext-001'], role: 'complemento', qty: () => randomInt(1, 3) },
          { ids: ['ext-004'], role: 'complemento', qty: () => randomInt(4, 12) },
          { ids: ['ele-014', 'ext-003'], role: 'complemento', qty: () => randomInt(2, 4) },
          { ids: ['mo-014', 'fle-001'], role: 'servicio', qty: () => 1 },
          { ids: ['mo-001'], role: 'mano_obra', qty: () => randomInt(4, 10), soft: true },
          { ids: ['mo-007'], role: 'servicio_flex', qty: () => 1, soft: true },
          { ids: ['mo-009'], role: 'servicio_flex', qty: () => 1, soft: true },
        ],
      };
    default:
      return sistemaGeneral();
  }
}

function construirLineasDuras(
  sistema: Sistema,
  catalogo: CatalogoMaterial[],
  ctx: QtyContext,
): { hard: RemisionItem[]; softSlots: RemisionItem[] } {
  const hard: RemisionItem[] = [];
  const softSlots: RemisionItem[] = [];
  const usedConceptKeys = new Set<string>();

  let impermeabilizantes = 0;
  let selladores = 0;
  let primarios = 0;
  let fletes = 0;
  let retiros = 0;

  for (const linea of sistema.lineas) {
    const mat = firstAvailable(catalogo, linea.ids);
    if (!mat) continue;

    const qtyRaw = linea.qty(ctx);
    if (qtyRaw <= 0) continue;

    const nombre = (linea.concepto ?? mat.nombre).toLowerCase();
    if (usedConceptKeys.has(mat.id)) continue;

    if (/impermeabilizante/.test(nombre) && !/muro|loseta|malla/.test(nombre)) {
      impermeabilizantes += 1;
      if (impermeabilizantes > 2) continue;
    }
    if (/sellador/.test(nombre)) {
      selladores += 1;
      if (selladores > 1) continue;
    }
    if (/primario/.test(nombre)) {
      primarios += 1;
      if (primarios > 1) continue;
    }
    if (/flete|acarreo/.test(nombre)) {
      fletes += 1;
      if (fletes > 1) continue;
    }
    if (/retiro de escombro|retiro de impermeabilizante|limpieza y retiro/.test(nombre)) {
      retiros += 1;
      if (retiros > 1) continue;
    }

    usedConceptKeys.add(mat.id);
    const qty =
      mat.unidad === 'm²' || mat.unidad === 'm³' || mat.unidad === 'm'
        ? Math.round(qtyRaw * 2) / 2
        : Math.max(1, Math.round(qtyRaw));

    const item = crearItemDesdeCatalogo(mat, qty, undefined, linea.concepto);

    if (linea.soft || linea.role === 'servicio_flex' || linea.role === 'mano_obra') {
      softSlots.push(item);
    } else {
      hard.push(item);
    }
  }

  return { hard, softSlots };
}

/**
 * Distribuye remanente en varias partidas profesionales.
 * Si remanente > 15% del total, nunca lo deja en una sola partida.
 */
function distribuirRemanente(
  hard: RemisionItem[],
  softSlots: RemisionItem[],
  totalRemision: number,
  catalogo: CatalogoMaterial[],
  balancePoolIds: string[],
): RemisionItem[] {
  const items = [...hard.map((i) => ({ ...i }))];
  const soft = softSlots.map((i) => ({ ...i }));

  // Base soft: MO por m² al precio catálogo (sin inflar); servicios flex en mínimo realista
  for (const s of soft) {
    if (s.unidad === 'm²') {
      items.push(s); // importe = qty * precio sugerido
    } else {
      const base = Math.max(s.precio_unitario, 800);
      items.push(setImporte(s, base));
    }
  }

  let suma = normalizeMoney(items.reduce((a, i) => a + i.importe, 0));
  let remanente = normalizeMoney(totalRemision - suma);

  if (Math.abs(remanente) < 0.01) {
    return ajustarItemsAlTarget(items, totalRemision, catalogo);
  }

  // Si ya nos pasamos del target, no sembrar más partidas: escalar/ajustar al target.
  if (remanente < 0) {
    return ajustarItemsAlTarget(items, totalRemision, catalogo);
  }

  // Asegurar pool de balance disponible en la lista (solo si hay remanente positivo)
  const poolIds = balancePoolIds.length > 0 ? balancePoolIds : BALANCE_POOL_DEFAULT;
  const balanceItems: RemisionItem[] = [];

  for (const id of poolIds) {
    const existentes = items.filter((i) => {
      const mat = byId(catalogo, id);
      return mat && i.concepto === sanitizarConcepto(mat.nombre);
    });
    if (existentes.length > 0) {
      balanceItems.push(...existentes);
      continue;
    }
    const mat = byId(catalogo, id);
    if (!mat) continue;
    // Sembrar con base mínima; el remanente se reparte después.
    const base = Math.min(
      Math.max(mat.precio_sugerido, 500),
      normalizeMoney(remanente / Math.max(2, poolIds.length)),
    );
    if (base < 1) continue;
    const nuevo = crearItemDesdeCatalogo(mat, 1, undefined, mat.nombre);
    const seeded = setImporte(nuevo, base);
    items.push(seeded);
    balanceItems.push(seeded);
    remanente = normalizeMoney(remanente - base);
    if (remanente < 1) break;
  }

  // Recalcular remanente tras sembrar base
  suma = normalizeMoney(items.reduce((a, i) => a + i.importe, 0));
  remanente = normalizeMoney(totalRemision - suma);

  if (remanente <= 0) {
    return ajustarItemsAlTarget(items, totalRemision, catalogo);
  }

  const umbralSplit = totalRemision * SPLIT_THRESHOLD_PCT;
  const sinks = items.filter((i) =>
    balanceItems.some((b) => b.concepto === i.concepto) ||
      (esServicioCapado(i) && i.unidad === 'servicio'),
  );

  // Número de partidas a usar según tamaño del remanente
  let nPartidas = sinks.length;
  if (remanente > umbralSplit) {
    nPartidas = Math.max(3, Math.min(sinks.length, Math.ceil(remanente / (totalRemision * 0.12))));
  } else {
    nPartidas = Math.min(sinks.length, Math.max(2, Math.ceil(remanente / (totalRemision * 0.1))));
  }

  const targets = sinks.slice(0, nPartidas);
  if (targets.length === 0) {
    const mat = byId(catalogo, 'mo-008') ?? byId(catalogo, 'mo-007') ?? catalogo[0];
    const extra = setImporte(crearItemDesdeCatalogo(mat, 1), remanente);
    items.push(extra);
    return ajustarItemsAlTarget(items, totalRemision, catalogo);
  }

  // Pesos: MO especializada un poco más, resto pareja
  const pesos = targets.map((t) => (esManoObraEspecializada(t.concepto) ? 1.4 : 1));
  const pesoTotal = pesos.reduce((a, b) => a + b, 0);

  for (let i = 0; i < targets.length; i++) {
    const share = normalizeMoney((remanente * pesos[i]) / pesoTotal);
    const idx = items.findIndex((x) => x.id === targets[i].id);
    if (idx < 0) continue;
    const tope = topeImporte(items[idx].concepto, totalRemision);
    const nuevo = Math.min(tope, normalizeMoney(items[idx].importe + share));
    items[idx] = setImporte(items[idx], nuevo);
  }

  // Si aún falta por topes, repartir en sinks con capacidad
  let guard = 0;
  while (guard < 8) {
    guard += 1;
    suma = normalizeMoney(items.reduce((a, i) => a + i.importe, 0));
    remanente = normalizeMoney(totalRemision - suma);
    if (Math.abs(remanente) < 0.01) break;

    const conCapacidad = items.filter((i) => {
      if (!esServicioCapado(i) && i.unidad !== 'servicio') return false;
      return i.importe < topeImporte(i.concepto, totalRemision) - 0.01;
    });

    if (conCapacidad.length === 0) {
      // Ampliar pool
      for (const id of poolIds) {
        const mat = byId(catalogo, id);
        if (!mat) continue;
        const ya = items.some((i) => i.concepto === sanitizarConcepto(mat.nombre));
        if (ya) continue;
        const tope = topeImporte(mat.nombre, totalRemision);
        const monto = Math.min(tope, remanente);
        if (monto < 1) continue;
        items.push(setImporte(crearItemDesdeCatalogo(mat, 1), monto));
        break;
      }
      continue;
    }

    const chunk = normalizeMoney(remanente / conCapacidad.length);
    for (const c of conCapacidad) {
      const idx = items.findIndex((x) => x.id === c.id);
      if (idx < 0) continue;
      const tope = topeImporte(items[idx].concepto, totalRemision);
      const add = Math.min(chunk, tope - items[idx].importe);
      items[idx] = setImporte(items[idx], items[idx].importe + Math.max(0, add));
    }
  }

  return ajustarItemsAlTarget(
    aplicarTopesServicio(items, totalRemision, catalogo, poolIds),
    totalRemision,
    catalogo,
  );
}

function aplicarTopesServicio(
  items: RemisionItem[],
  totalRemision: number,
  catalogo: CatalogoMaterial[],
  poolIds: string[],
): RemisionItem[] {
  const result = items.map((i) => ({ ...i }));
  let excedente = 0;

  for (let i = 0; i < result.length; i++) {
    if (!esServicioCapado(result[i])) continue;
    // MO impermeabilización por m²: permitir hasta 35%
    const tope =
      result[i].unidad === 'm²' && /impermeabilizaci/i.test(result[i].concepto)
        ? normalizeMoney(totalRemision * MAX_MO_ESPECIALIZADA_PCT)
        : topeImporte(result[i].concepto, totalRemision);
    if (result[i].importe > tope + 0.01) {
      excedente = normalizeMoney(excedente + (result[i].importe - tope));
      result[i] = setImporte(result[i], tope);
    }
  }

  if (excedente < 0.01) return result;

  // Redistribuir excedente a otros sinks con capacidad
  for (const id of poolIds) {
    if (excedente < 0.01) break;
    const mat = byId(catalogo, id);
    if (!mat) continue;
    const nombre = sanitizarConcepto(mat.nombre);
    let idx = result.findIndex((r) => r.concepto === nombre);
    if (idx < 0) {
      const nuevo = crearItemDesdeCatalogo(mat, 1);
      result.push(nuevo);
      idx = result.length - 1;
    }
    const tope = topeImporte(result[idx].concepto, totalRemision);
    const espacio = normalizeMoney(tope - result[idx].importe);
    if (espacio <= 0) continue;
    const add = Math.min(espacio, excedente);
    result[idx] = setImporte(result[idx], result[idx].importe + add);
    excedente = normalizeMoney(excedente - add);
  }

  return result;
}

function preferSinkIndex(items: RemisionItem[]): number {
  const preferidos = [
    /herramienta y consumibles/i,
    /servicio de instalaci[oó]n general/i,
    /mano de obra especializada/i,
    /flete y acarreo/i,
    /preparaci[oó]n (de |y )?superficie/i,
    /supervisi[oó]n/i,
  ];
  for (const re of preferidos) {
    const idx = items.findIndex((i) => re.test(i.concepto) && i.unidad === 'servicio');
    if (idx >= 0) return idx;
  }
  const servicio = items.findIndex((i) => esServicioCapado(i));
  if (servicio >= 0) return servicio;
  return items.length - 1;
}

/**
 * Garantiza sum(items.importe) === target (centavos exactos).
 * Si hay exceso grande (receta dura > total), escala proporcionalmente y
 * corrige centavos en una partida de servicio válida.
 */
function ajustarItemsAlTarget(
  items: RemisionItem[],
  target: number,
  catalogo: CatalogoMaterial[],
): RemisionItem[] {
  const targetN = normalizeMoney(target);
  let result = items
    .map((i) => ({ ...i }))
    .filter((i) => i.cantidad > 0 && i.importe >= 0.01);

  if (result.length === 0) {
    const mat =
      byId(catalogo, 'mo-008') ??
      byId(catalogo, 'mo-007') ??
      catalogo.find((c) => c.unidad === 'servicio') ??
      catalogo[0];
    if (!mat) return [];
    return [
      setImporte(
        crearItemDesdeCatalogo(mat, 1, undefined, 'Servicio de instalación general'),
        targetN,
      ),
    ];
  }

  let suma = sumItemsImporte(result);
  let diff = normalizeMoney(targetN - suma);

  // Exceso grande: escalar todas las partidas al target
  if (diff < -0.01 && suma > 0) {
    const factor = targetN / suma;
    result = result.map((i) => setImporte(i, normalizeMoney(i.importe * factor)));
    // Eliminar casi-ceros tras escalado
    result = result.filter((i) => i.importe >= 0.01);
    if (result.length === 0) {
      const mat = byId(catalogo, 'mo-008') ?? byId(catalogo, 'mo-007') ?? catalogo[0];
      return [
        setImporte(
          crearItemDesdeCatalogo(mat, 1, undefined, 'Servicio de instalación general'),
          targetN,
        ),
      ];
    }
    suma = sumItemsImporte(result);
    diff = normalizeMoney(targetN - suma);
  }

  if (Math.abs(diff) < 0.01) {
    return result.map((i) => ({ ...i, concepto: sanitizarConcepto(i.concepto) }));
  }

  // Falta dinero: preferir sink de servicio; si no cabe, crear partida de servicio
  if (diff > 0.01) {
    let idx = preferSinkIndex(result);
    const candidato = result[idx];
    const tope = topeImporte(candidato.concepto, targetN);
    if (
      esServicioCapado(candidato) &&
      candidato.importe + diff > tope + 0.01
    ) {
      const mat = byId(catalogo, 'mo-008') ?? byId(catalogo, 'mo-007');
      if (mat) {
        const ya = result.findIndex(
          (r) => r.concepto === sanitizarConcepto(mat.nombre),
        );
        if (ya >= 0) {
          result[ya] = setImporte(result[ya], result[ya].importe + diff);
        } else {
          result.push(
            setImporte(
              crearItemDesdeCatalogo(mat, 1, undefined, mat.nombre),
              diff,
            ),
          );
        }
        return result.map((i) => ({ ...i, concepto: sanitizarConcepto(i.concepto) }));
      }
    }
    result[idx] = setImporte(result[idx], result[idx].importe + diff);
    return result.map((i) => ({ ...i, concepto: sanitizarConcepto(i.concepto) }));
  }

  // Sobra poco (centavos tras escalado): reducir sink preferido
  let idx = preferSinkIndex(result);
  const reducido = normalizeMoney(result[idx].importe + diff); // diff negativo
  if (reducido >= 0.01) {
    result[idx] = setImporte(result[idx], reducido);
  } else {
    // Repartir reducción en varias partidas de mayor a menor
    let falta = normalizeMoney(-diff);
    const orden = [...result.keys()].sort(
      (a, b) => result[b].importe - result[a].importe,
    );
    for (const i of orden) {
      if (falta < 0.01) break;
      const disponible = normalizeMoney(result[i].importe - 0.01);
      if (disponible <= 0) continue;
      const quita = Math.min(disponible, falta);
      result[i] = setImporte(result[i], result[i].importe - quita);
      falta = normalizeMoney(falta - quita);
    }
  }

  // Último seguro de centavos
  suma = sumItemsImporte(result);
  diff = normalizeMoney(targetN - suma);
  if (Math.abs(diff) >= 0.01) {
    idx = preferSinkIndex(result);
    const nuevo = normalizeMoney(result[idx].importe + diff);
    if (nuevo >= 0.01) {
      result[idx] = setImporte(result[idx], nuevo);
    } else if (diff > 0) {
      const mat = byId(catalogo, 'mo-008') ?? byId(catalogo, 'mo-007') ?? catalogo[0];
      result.push(
        setImporte(
          crearItemDesdeCatalogo(mat, 1, undefined, 'Servicio de instalación general'),
          diff,
        ),
      );
    }
  }

  return result
    .filter((i) => i.importe >= 0.01)
    .map((i) => ({ ...i, concepto: sanitizarConcepto(i.concepto) }));
}

function ordenarProfesional(items: RemisionItem[]): RemisionItem[] {
  const roleGuess = (concepto: string): LineRole => {
    const n = concepto.toLowerCase();
    if (/mano de obra especializada|aplicaci[oó]n de sistema|refuerzo en puntos|herramienta y consumibles|supervisi/.test(n))
      return 'servicio_flex';
    if (/mano de obra/.test(n)) return 'mano_obra';
    if (/flete|acarreo|retiro|limpieza|andamio|preparaci/.test(n)) return 'servicio';
    if (/rodillo|cepillo|brocha|espátula|crucetas|cinta|teflón|nivel/.test(n)) return 'herramienta';
    if (/pegazulejo|boquilla|sellador|primario|malla|resanador|cemento|arena|conexiones|tubo|cable/.test(n))
      return 'complemento';
    return 'principal';
  };

  return [...items].sort(
    (a, b) => ROLE_ORDER.indexOf(roleGuess(a.concepto)) - ROLE_ORDER.indexOf(roleGuess(b.concepto)),
  );
}

function assertSinPalabrasProhibidas(items: RemisionItem[]): RemisionItem[] {
  return items.map((i) => ({ ...i, concepto: sanitizarConcepto(i.concepto) }));
}

/**
 * Genera partidas coherentes y realistas, cuadrando exactamente con totalRemision.
 */
export function generateRemisionItems(
  params: GenerateRemisionItemsParams,
): RemisionItem[] {
  const { totalRemision, tipoRemodelacion, catalogo, areaM2 } = params;
  if (totalRemision <= 0) return [];

  const area = estimateAreaM2(tipoRemodelacion, totalRemision, areaM2);
  const sistema = elegirSistema(tipoRemodelacion);
  const ctx: QtyContext = { areaM2: area, totalRemision };

  const { hard, softSlots } = construirLineasDuras(sistema, catalogo, ctx);
  let items = distribuirRemanente(
    hard,
    softSlots,
    totalRemision,
    catalogo,
    sistema.balancePoolIds ?? BALANCE_POOL_DEFAULT,
  );
  items = ordenarProfesional(items);
  items = assertSinPalabrasProhibidas(items);

  // Garantizar cuadre exacto final contra params.totalRemision (nunca 20% fijo)
  return ajustarItemsAlTarget(items, totalRemision, catalogo);
}

export function recalcularItemImporte(
  item: RemisionItem,
  cantidad?: number,
  precioUnitario?: number,
): RemisionItem {
  const qty = cantidad ?? item.cantidad;
  const price = precioUnitario ?? item.precio_unitario;
  return {
    ...item,
    cantidad: qty,
    precio_unitario: price,
    importe: normalizeMoney(qty * price),
  };
}

export function sumItemsImporte(items: RemisionItem[]): number {
  return normalizeMoney(items.reduce((s, i) => s + i.importe, 0));
}
