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
          Porcentaje de incremento *
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={
              Number.isFinite(form.porcentaje_incremento)
                ? form.porcentaje_incremento
                : ''
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') {
                onChange('porcentaje_incremento', Number.NaN);
                return;
              }
              onChange('porcentaje_incremento', parseFloat(v));
            }}
            placeholder="20"
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
        <label>
          Área estimada m² (opcional)
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.area_m2 ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onChange('area_m2', v === '' ? null : parseFloat(v) || null);
            }}
            placeholder="Si se omite, se estima internamente"
          />
        </label>
        <div className="calculated-field">
          <span className="label">
            Incremento ({Number.isFinite(form.porcentaje_incremento) ? form.porcentaje_incremento : '—'}%)
          </span>
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
        Fórmula: Total remisión = Monto aprobado × (1 + porcentaje / 100)
      </p>
      <p className="formula-note">
        Precios referenciales con fuente; pueden variar por tienda y fecha.
      </p>
    </section>
  );
}
