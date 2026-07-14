/** Redondea a 2 decimales para montos en MXN */
export function normalizeMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
