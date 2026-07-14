import type { IvaMode, RemisionTotals } from '../types';
import { normalizeMoney } from './normalizeMoney';

const INCREMENTO_PORCENTAJE = 20;
const IVA_RATE = 0.16;

export function calculateRemisionTotals(
  montoAprobado: number,
  ivaMode: IvaMode = 'incluido',
): RemisionTotals {
  const incremento_monto = normalizeMoney(montoAprobado * (INCREMENTO_PORCENTAJE / 100));
  const total_remision = normalizeMoney(montoAprobado * 1.2);

  if (ivaMode === 'incluido') {
    const subtotal = normalizeMoney(total_remision / (1 + IVA_RATE));
    const iva = normalizeMoney(total_remision - subtotal);
    return {
      incremento_porcentaje: INCREMENTO_PORCENTAJE,
      incremento_monto,
      total_remision,
      subtotal,
      iva,
      total: total_remision,
    };
  }

  const subtotal = total_remision;
  const iva = normalizeMoney(subtotal * IVA_RATE);
  const total = normalizeMoney(subtotal + iva);

  return {
    incremento_porcentaje: INCREMENTO_PORCENTAJE,
    incremento_monto,
    total_remision,
    subtotal,
    iva,
    total,
  };
}
