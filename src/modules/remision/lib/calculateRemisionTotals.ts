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
  const porcentaje_incremento = porcentajeIncremento;
  const incremento_monto = normalizeMoney(
    montoAprobado * (porcentaje_incremento / 100),
  );
  const total_remision = normalizeMoney(montoAprobado + incremento_monto);

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
