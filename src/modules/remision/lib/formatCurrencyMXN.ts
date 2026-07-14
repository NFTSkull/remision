import { normalizeMoney } from './normalizeMoney';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyMXN(value: number): string {
  return currencyFormatter.format(normalizeMoney(value));
}
