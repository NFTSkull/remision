import type { IvaMode, RemisionTotals } from '../types';
import { normalizeMoney } from './normalizeMoney';

export const DEFAULT_PORCENTAJE_INCREMENTO = 20;
export const MAX_PORCENTAJE_INCREMENTO = 100;
const IVA_RATE = 0.16;

/**
 * total_remision = monto_aprobado * (1 + porcentaje_incremento / 100)
 * IVA incluido: subtotal = total/1.16; iva = total - subtotal; total = total_remision
 * Sin IVA: subtotal = total_remision; iva = 0; total = total_remision
 */
export function calculateRemisionTotals(
  montoAprobado: number,
  ivaMode: IvaMode = 'incluido',
  porcentajeIncremento: number = DEFAULT_PORCENTAJE_INCREMENTO,
): RemisionTotals {
  const monto = Number(montoAprobado);
  const montoSafe = Number.isFinite(monto) ? monto : 0;
  const pctRaw = Number(porcentajeIncremento);
  const porcentaje_incremento = Number.isFinite(pctRaw)
    ? pctRaw
    : DEFAULT_PORCENTAJE_INCREMENTO;
  const incremento_monto = normalizeMoney(
    montoSafe * (porcentaje_incremento / 100),
  );
  const total_remision = normalizeMoney(montoSafe + incremento_monto);

  if (ivaMode === 'incluido') {
    const subtotal = normalizeMoney(total_remision / (1 + IVA_RATE));
    const iva = normalizeMoney(total_remision - subtotal);
    return {
      porcentaje_incremento,
      incremento_monto,
      total_remision,
      subtotal,
      iva,
      total: total_remision,
    };
  }

  return {
    porcentaje_incremento,
    incremento_monto,
    total_remision,
    subtotal: total_remision,
    iva: 0,
    total: total_remision,
  };
}
