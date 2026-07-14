import { formatCurrencyMXN } from '../lib/formatCurrencyMXN';
import type { RemisionTotals } from '../types';

interface Props {
  totals: RemisionTotals;
  ivaMode: string;
}

export function TotalesSection({ totals, ivaMode }: Props) {
  return (
    <section className="form-section totales-section">
      <h2>5. Totales</h2>
      <div className="totales-grid">
        <div className="total-row">
          <span>Subtotal</span>
          <span>{formatCurrencyMXN(totals.subtotal)}</span>
        </div>
        <div className="total-row">
          <span>IVA (16%)</span>
          <span>{formatCurrencyMXN(totals.iva)}</span>
        </div>
        <div className="total-row total-final">
          <span>Total {ivaMode === 'incluido' ? '(IVA incluido)' : '(+ IVA)'}</span>
          <span>{formatCurrencyMXN(totals.total)}</span>
        </div>
      </div>
    </section>
  );
}
