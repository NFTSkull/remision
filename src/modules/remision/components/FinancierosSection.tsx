import { formatCurrencyMXN } from '../lib/formatCurrencyMXN';
import type { RemisionFormData, RemisionTotals } from '../types';

interface Props {
  form: RemisionFormData;
  totals: RemisionTotals;
  onChange: (key: keyof RemisionFormData, value: RemisionFormData[keyof RemisionFormData]) => void;
}

export function FinancierosSection({ form, totals, onChange }: Props) {
  return (
    <section className="form-section">
      <h2>2. Datos financieros</h2>
      <div className="form-grid">
        <label>
          Monto aprobado *
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.monto_aprobado || ''}
            onChange={(e) =>
              onChange('monto_aprobado', parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
          />
        </label>
        <label>
          Plazo *
          <input
            type="text"
            value={form.plazo}
            onChange={(e) => onChange('plazo', e.target.value)}
            placeholder="Ej: 15 días hábiles"
          />
        </label>
        <div className="calculated-field">
          <span className="label">Incremento 20%</span>
          <span className="value">{formatCurrencyMXN(totals.incremento_monto)}</span>
        </div>
        <div className="calculated-field highlight">
          <span className="label">Total de remisión</span>
          <span className="value">{formatCurrencyMXN(totals.total_remision)}</span>
        </div>
        <label className="span-2 iva-switch">
          <span>Modo IVA</span>
          <div className="switch-group">
            <button
              type="button"
              className={form.iva_mode === 'incluido' ? 'active' : ''}
              onClick={() => onChange('iva_mode', 'incluido')}
            >
              IVA incluido
            </button>
            <button
              type="button"
              className={form.iva_mode === 'sin_iva' ? 'active' : ''}
              onClick={() => onChange('iva_mode', 'sin_iva')}
            >
              Sin IVA
            </button>
          </div>
        </label>
      </div>
      <p className="formula-note">
        Fórmula: Total remisión = Monto aprobado × 1.20
      </p>
    </section>
  );
}
