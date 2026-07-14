import type { RemisionFormData } from '../types';

interface Props {
  form: RemisionFormData;
  onChange: (key: keyof RemisionFormData, value: RemisionFormData[keyof RemisionFormData]) => void;
}

export function ClienteSection({ form, onChange }: Props) {
  return (
    <section className="form-section">
      <h2>1. Datos del cliente</h2>
      <div className="form-grid">
        <label>
          Fecha *
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => onChange('fecha', e.target.value)}
          />
        </label>
        <label>
          Nombre del cliente *
          <input
            type="text"
            value={form.nombre_cliente}
            onChange={(e) => onChange('nombre_cliente', e.target.value)}
            placeholder="Nombre completo"
          />
        </label>
        <label>
          RFC *
          <input
            type="text"
            value={form.rfc}
            onChange={(e) => onChange('rfc', e.target.value.toUpperCase())}
            placeholder="XAXX010101000"
          />
        </label>
        <label>
          Teléfono *
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => onChange('telefono', e.target.value)}
            placeholder="55 1234 5678"
          />
        </label>
        <label className="span-2">
          Dirección *
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => onChange('direccion', e.target.value)}
            placeholder="Calle, número, colonia"
          />
        </label>
        <label>
          Ciudad *
          <input
            type="text"
            value={form.ciudad}
            onChange={(e) => onChange('ciudad', e.target.value)}
            placeholder="Ciudad"
          />
        </label>
      </div>
    </section>
  );
}
