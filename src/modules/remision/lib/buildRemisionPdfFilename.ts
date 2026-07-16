import type { Remision } from '../types';

const MAX_NAME_LEN = 40;

/** Sanitiza un fragmento para usarlo en nombre de archivo. */
export function sanitizeFilenamePart(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (!normalized) return '';
  return normalized.slice(0, MAX_NAME_LEN).replace(/-+$/g, '');
}

function formatFechaFilename(fecha?: string): string {
  if (fecha && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [y, m, d] = fecha.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = String(now.getFullYear());
  return `${d}-${m}-${y}`;
}

function formatHoraFilename(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}${mm}${ss}`;
}

/**
 * Nombre de descarga único y estable por remisión.
 * Ej: REM-000001-greco-villanueva-16-07-2026.pdf
 */
export function buildRemisionPdfFilename(
  remision: Pick<Remision, 'folio' | 'nombre_cliente' | 'fecha'> & {
    folio?: string | null;
    nombre_cliente?: string | null;
    fecha?: string | null;
  },
): string {
  const folioRaw = remision.folio?.trim() ?? '';
  const hasFolio = !!folioRaw && !/^REM-temp$/i.test(folioRaw);
  const folioPart = hasFolio
    ? sanitizeFilenamePart(folioRaw).toUpperCase() || folioRaw
    : 'REM-temp';

  const clientePart =
    sanitizeFilenamePart(remision.nombre_cliente ?? '') || 'remision';

  const fechaPart = formatFechaFilename(remision.fecha ?? undefined);

  const parts = [folioPart, clientePart, fechaPart];
  if (!hasFolio) {
    parts.push(formatHoraFilename());
  }

  return `${parts.join('-')}.pdf`;
}
