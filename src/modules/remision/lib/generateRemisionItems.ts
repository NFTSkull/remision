import { v4 as uuidv4 } from 'uuid';
import { TIPO_TAG_MAP } from '../constants/tiposRemodelacion';
import type {
  CatalogoMaterial,
  GenerateRemisionItemsParams,
  RemisionItem,
  TipoRemodelacion,
} from '../types';
import { normalizeMoney } from './normalizeMoney';

const AJUSTABLES = [
  'Mano de obra especializada',
  'Servicio de instalación general',
  'Material complementario (ajuste)',
] as const;

const CATEGORIAS_NO_MATERIAL = new Set([
  'Mano de obra',
  'Servicios',
  'Flete / acarreo',
  'Retiro de escombro',
  'Herramienta menor',
]);

/** Conceptos prioritarios por tipo (nombre debe coincidir parcialmente) */
const TIPO_PRIORITY: Partial<Record<TipoRemodelacion, string[]>> = {
  Baño: [
    'sanitario',
    'lavabo',
    'mezcladora',
    'regadera',
    'azulejo',
    'piso',
    'pegazulejo',
    'tubería',
    'mano de obra',
  ],
  Cocina: [
    'tarja',
    'mezcladora',
    'cubierta',
    'piso',
    'azulejo',
    'mueble base',
    'campana',
    'mano de obra',
  ],
  Sala: ['pintura', 'piso', 'pasta', 'yeso', 'lámpara', 'contacto', 'zoclo', 'resane', 'mano de obra'],
  'Piso / azulejo': [
    'piso',
    'porcelanato',
    'pegazulejo',
    'boquilla',
    'crucetas',
    'zoclo',
    'nivelador',
    'cemento',
    'mano de obra',
  ],
  'Techo / impermeabilización': [
    'impermeabilizante',
    'sellador',
    'malla',
    'cepillo',
    'rodillo',
    'resanador',
    'mano de obra',
  ],
  Eléctrico: [
    'cable',
    'contacto',
    'apagador',
    'centro de carga',
    'pastilla',
    'conduit',
    'chalupa',
    'lámpara',
    'mano de obra',
  ],
  Plomería: [
    'tubería',
    'codo',
    'tee',
    'llave',
    'válvula',
    'cemento pvc',
    'teflón',
    'mezcladora',
    'mano de obra',
  ],
  Fachada: ['pintura exterior', 'sellador', 'impermeabilizante', 'resanador', 'andamio', 'mano de obra'],
  'Patio / exterior': [
    'piso exterior',
    'cemento',
    'arena',
    'grava',
    'pintura exterior',
    'drenaje',
    'luminaria',
    'mano de obra',
  ],
};

/** Exclusiones por nombre: evita contaminar tipologías cercanas */
const TIPO_EXCLUDE_NOMBRE: Partial<Record<TipoRemodelacion, RegExp>> = {
  Cocina:
    /sanitario|regadera|cancel de baño|tina de baño|lavabo sobreponer|espejo con luminaria/i,
  Baño: /tarja|campana extractora|mueble base cocina|alacena cocina|salpicadero|cubierta granito|cubierta postformada/i,
  'Techo / impermeabilización': /sanitario|lavabo|regadera|tarja|mezcladora lavabo/i,
  'Piso / azulejo': /sanitario|regadera|tarja|cable thw|centro de carga/i,
  Eléctrico: /sanitario|regadera|tarja|pegazulejo|impermeabilizante|mezcladora/i,
  Plomería: /sanitario|regadera|cancel de baño|tina de baño|campana extractora|tarja|alacena/i,
};

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function getPartidasCount(totalRemision: number): number {
  if (totalRemision < 50_000) return randomInt(5, 8);
  if (totalRemision < 150_000) return randomInt(8, 14);
  return randomInt(14, 22);
}

function isManoObra(item: CatalogoMaterial): boolean {
  return item.categoria === 'Mano de obra';
}

function isServicioAuxiliar(item: CatalogoMaterial): boolean {
  return (
    item.categoria === 'Servicios' ||
    item.categoria === 'Flete / acarreo' ||
    item.categoria === 'Retiro de escombro' ||
    item.categoria === 'Herramienta menor'
  );
}

function isMaterial(item: CatalogoMaterial): boolean {
  return !CATEGORIAS_NO_MATERIAL.has(item.categoria);
}

function coincideExcludeNombre(
  material: CatalogoMaterial,
  tipo: TipoRemodelacion,
): boolean {
  const re = TIPO_EXCLUDE_NOMBRE[tipo];
  return re ? re.test(material.nombre) : false;
}

function filterCatalogo(
  catalogo: CatalogoMaterial[],
  tipoRemodelacion: TipoRemodelacion,
): {
  materiales: CatalogoMaterial[];
  servicios: CatalogoMaterial[];
  manoObra: CatalogoMaterial[];
} {
  const tags = TIPO_TAG_MAP[tipoRemodelacion];

  const filtered = catalogo.filter(
    (m) =>
      m.tags.some((t) => tags.includes(t)) &&
      !coincideExcludeNombre(m, tipoRemodelacion),
  );

  return {
    materiales: filtered.filter(isMaterial),
    manoObra: filtered.filter(isManoObra),
    servicios: filtered.filter(isServicioAuxiliar),
  };
}

function priorityScore(material: CatalogoMaterial, tipo: TipoRemodelacion): number {
  const keywords = TIPO_PRIORITY[tipo] ?? [];
  const nombre = material.nombre.toLowerCase();
  return keywords.reduce((score, kw) => (nombre.includes(kw.toLowerCase()) ? score + 2 : score), 0);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function calcularCantidadRealista(material: CatalogoMaterial, importeObjetivo: number): number {
  const precio = material.precio_sugerido;
  if (precio <= 0) return 1;

  let cantidad = importeObjetivo / precio;

  switch (material.unidad) {
    case 'saco':
    case 'caja':
    case 'bote':
    case 'cubeta':
    case 'pieza':
    case 'rollo':
    case 'paquete':
    case 'juego':
    case 'jornal':
    case 'día':
    case 'viaje':
    case 'servicio':
      cantidad = Math.max(1, Math.round(cantidad));
      break;
    case 'm²':
    case 'm³':
    case 'm':
    case 'kg':
      cantidad = Math.max(1, Math.round(cantidad * 2) / 2);
      break;
    default:
      cantidad = Math.max(1, Math.round(cantidad * 10) / 10);
  }

  return cantidad;
}

function crearItem(material: CatalogoMaterial, cantidad: number): RemisionItem {
  const precio = material.precio_sugerido;
  return {
    id: uuidv4(),
    cantidad,
    unidad: material.unidad,
    concepto: material.nombre,
    precio_unitario: precio,
    importe: normalizeMoney(cantidad * precio),
    fuente_nombre: material.fuente_nombre,
    fuente_url: material.fuente_url,
  };
}

function seleccionarProductos(
  pool: CatalogoMaterial[],
  count: number,
  tipo: TipoRemodelacion,
): CatalogoMaterial[] {
  if (pool.length === 0 || count <= 0) return [];

  const ranked = shuffle([...pool]).sort(
    (a, b) => priorityScore(b, tipo) - priorityScore(a, tipo),
  );

  const selected: CatalogoMaterial[] = [];
  const usedIds = new Set<string>();

  for (const item of ranked) {
    if (selected.length >= count) break;
    if (!usedIds.has(item.id)) {
      selected.push(item);
      usedIds.add(item.id);
    }
  }

  return selected;
}

function encontrarIdxAjustable(items: RemisionItem[]): number {
  let idx = items.findIndex((i) =>
    AJUSTABLES.some((nombre) => i.concepto === nombre),
  );
  if (idx === -1) {
    idx = items.findIndex((i) =>
      /mano de obra especializada|servicio de instalaci|material complementario/i.test(
        i.concepto,
      ),
    );
  }
  return idx;
}

function asegurarPartidaAjustable(
  items: RemisionItem[],
  catalogo: CatalogoMaterial[],
): RemisionItem[] {
  if (encontrarIdxAjustable(items) >= 0) return items;

  const fallback =
    catalogo.find((c) => c.nombre === 'Mano de obra especializada') ??
    catalogo.find((c) => c.id === 'mo-007');

  if (!fallback) return items;
  return [...items, crearItem(fallback, 1)];
}

function ajustarUltimaPartida(
  items: RemisionItem[],
  totalRemision: number,
): RemisionItem[] {
  const result = items.map((i) => ({ ...i }));
  const sumaActual = normalizeMoney(result.reduce((s, i) => s + i.importe, 0));
  const diferencia = normalizeMoney(totalRemision - sumaActual);

  if (Math.abs(diferencia) < 0.01) return result;

  let idx = encontrarIdxAjustable(result);
  if (idx === -1) idx = result.length - 1;

  const item = result[idx];
  const nuevoImporte = normalizeMoney(Math.max(0.01, item.importe + diferencia));
  const cantidad = item.cantidad > 0 ? item.cantidad : 1;

  result[idx] = {
    ...item,
    cantidad,
    importe: nuevoImporte,
    precio_unitario: normalizeMoney(nuevoImporte / cantidad),
  };

  // Segunda pasada: si redondeo de precio alteró la suma vía recompute,
  // forzar importe exacto en la partida ajustable.
  const sumaFinal = normalizeMoney(result.reduce((s, i) => s + i.importe, 0));
  const resto = normalizeMoney(totalRemision - sumaFinal);
  if (Math.abs(resto) >= 0.01) {
    result[idx] = {
      ...result[idx],
      importe: normalizeMoney(result[idx].importe + resto),
    };
  }

  return result;
}

/**
 * Genera partidas coherentes para una remisión, cuadrando exactamente con totalRemision.
 */
export function generateRemisionItems(
  params: GenerateRemisionItemsParams,
): RemisionItem[] {
  const { totalRemision, tipoRemodelacion, catalogo } = params;

  if (totalRemision <= 0) return [];

  const totalPartidas = getPartidasCount(totalRemision);
  const pctMateriales = randomInRange(0.6, 0.75);
  const pctManoObra = randomInRange(0.15, 0.3);

  const presupuestoMateriales = normalizeMoney(totalRemision * pctMateriales);
  const presupuestoManoObra = normalizeMoney(totalRemision * pctManoObra);
  const presupuestoServicios = normalizeMoney(
    totalRemision - presupuestoMateriales - presupuestoManoObra,
  );

  const { materiales, servicios, manoObra } = filterCatalogo(
    catalogo,
    tipoRemodelacion,
  );

  // Sin fallback al catálogo completo: evita contaminar tipologías.
  if (materiales.length === 0 && manoObra.length === 0 && servicios.length === 0) {
    const fallback =
      catalogo.find((c) => c.nombre === 'Mano de obra especializada') ?? catalogo[0];
    return ajustarUltimaPartida([crearItem(fallback, 1)], totalRemision);
  }

  const numMateriales = Math.min(
    materiales.length,
    Math.max(materiales.length > 0 ? 1 : 0, Math.round(totalPartidas * pctMateriales)),
  );
  const numManoObra = Math.min(
    manoObra.length,
    Math.max(manoObra.length > 0 ? 1 : 0, Math.round(totalPartidas * pctManoObra)),
  );
  const numServicios = Math.min(
    servicios.length,
    Math.max(0, totalPartidas - numMateriales - numManoObra),
  );

  const matsSeleccionados = seleccionarProductos(
    materiales,
    numMateriales,
    tipoRemodelacion,
  );
  const moSeleccionados = seleccionarProductos(
    manoObra,
    numManoObra,
    tipoRemodelacion,
  );
  const srvSeleccionados = seleccionarProductos(
    servicios,
    numServicios,
    tipoRemodelacion,
  );

  const itemsMateriales: RemisionItem[] = [];
  const importePorMaterial =
    matsSeleccionados.length > 0
      ? presupuestoMateriales / matsSeleccionados.length
      : 0;

  for (const mat of matsSeleccionados) {
    const maxImporte = totalRemision * 0.35;
    const objetivo = Math.min(importePorMaterial, maxImporte);
    const cantidad = calcularCantidadRealista(mat, objetivo);
    itemsMateriales.push(crearItem(mat, cantidad));
  }

  const itemsServicios: RemisionItem[] = [];
  const importePorServicio =
    srvSeleccionados.length > 0
      ? presupuestoServicios / srvSeleccionados.length
      : 0;

  for (const srv of srvSeleccionados) {
    const cantidad = calcularCantidadRealista(srv, importePorServicio);
    itemsServicios.push(crearItem(srv, cantidad));
  }

  const itemsManoObra: RemisionItem[] = [];
  const importePorMO =
    moSeleccionados.length > 0
      ? presupuestoManoObra / moSeleccionados.length
      : 0;

  for (const mo of moSeleccionados) {
    const cantidad = calcularCantidadRealista(mo, importePorMO);
    itemsManoObra.push(crearItem(mo, cantidad));
  }

  let todos = [...itemsMateriales, ...itemsServicios, ...itemsManoObra];

  if (todos.length === 0) {
    const fallback =
      catalogo.find((c) => c.nombre === 'Mano de obra especializada') ?? catalogo[0];
    return ajustarUltimaPartida([crearItem(fallback, 1)], totalRemision);
  }

  todos = asegurarPartidaAjustable(todos, catalogo);
  return ajustarUltimaPartida(todos, totalRemision);
}

/** Recalcula importe de un item cuando cambia cantidad o precio */
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

/** Suma total de importes de partidas */
export function sumItemsImporte(items: RemisionItem[]): number {
  return normalizeMoney(items.reduce((s, i) => s + i.importe, 0));
}
