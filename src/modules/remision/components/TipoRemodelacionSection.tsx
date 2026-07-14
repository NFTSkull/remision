import { TIPOS_REMODELACION } from '../constants/tiposRemodelacion';
import type { RemisionFormData } from '../types';

interface Props {
  form: RemisionFormData;
  onChange: (key: keyof RemisionFormData, value: RemisionFormData[keyof RemisionFormData]) => void;
}

export function TipoRemodelacionSection({ form, onChange }: Props) {
  return (
    <section className="form-section">
      <h2>3. Tipo de remodelación</h2>
      <label>
        Seleccione el tipo *
        <select
          value={form.tipo_remodelacion}
          onChange={(e) =>
            onChange(
              'tipo_remodelacion',
              e.target.value as RemisionFormData['tipo_remodelacion'],
            )
          }
        >
          <option value="">— Seleccionar —</option>
          {TIPOS_REMODELACION.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
