import type { RemisionFormData } from '../types';

interface Props {
  form: RemisionFormData;
  onChange: (
    key: keyof RemisionFormData,
    value: RemisionFormData[keyof RemisionFormData],
  ) => void;
}

/** Nombre que aparece centrado arriba en el PDF (emisor). */
export function EmisorSection({ form, onChange }: Props) {
  return (
    <section className="form-section emisor-section">
      <h2>6. Nombre en el PDF (emisor / ferretería)</h2>
      <p className="formula-note">
        Edita este campo antes de descargar. El texto sale centrado arriba en la
        nota de remisión (puede ser ferretería u otro nombre comercial).
      </p>
      <div className="form-grid">
        <label className="span-2">
          Nombre que aparecerá en el PDF *
          <input
            type="text"
            value={form.ferreteria_nombre}
            onChange={(e) => onChange('ferreteria_nombre', e.target.value)}
            placeholder="Ej: FERRETERÍA HERNÁNDEZ"
            maxLength={120}
            autoComplete="organization"
          />
        </label>
      </div>
    </section>
  );
}
