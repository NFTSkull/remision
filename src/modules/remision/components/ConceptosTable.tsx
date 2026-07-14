import { formatCurrencyMXN } from '../lib/formatCurrencyMXN';
import type { RemisionItem } from '../types';

interface Props {
  items: RemisionItem[];
  onUpdate: (id: string, field: keyof RemisionItem, value: string | number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  itemsTotal: number;
  targetTotal: number;
}

export function ConceptosTable({
  items,
  onUpdate,
  onRemove,
  onAdd,
  onGenerate,
  onRegenerate,
  itemsTotal,
  targetTotal,
}: Props) {
  const cuadra = Math.abs(itemsTotal - targetTotal) < 0.02;

  return (
    <section className="form-section">
      <h2>4. Conceptos generados</h2>
      <div className="actions-row">
        <button type="button" className="btn btn-primary" onClick={onGenerate}>
          Generar conceptos automáticamente
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRegenerate}
          disabled={items.length === 0}
        >
          Regenerar conceptos
        </button>
        <button type="button" className="btn btn-outline" onClick={onAdd}>
          Agregar concepto manual
        </button>
      </div>

      {items.length > 0 ? (
        <>
          <div className="table-wrapper">
            <table className="conceptos-table">
              <thead>
                <tr>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th className="col-concepto">Concepto</th>
                  <th>Precio unitario</th>
                  <th>Importe</th>
                  <th className="col-sat">Código SAT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cantidad}
                        onChange={(e) =>
                          onUpdate(item.id, 'cantidad', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.unidad}
                        onChange={(e) =>
                          onUpdate(item.id, 'unidad', e.target.value)
                        }
                      />
                    </td>
                    <td className="col-concepto">
                      <textarea
                        rows={2}
                        value={item.concepto}
                        onChange={(e) =>
                          onUpdate(item.id, 'concepto', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precio_unitario}
                        onChange={(e) =>
                          onUpdate(item.id, 'precio_unitario', e.target.value)
                        }
                      />
                    </td>
                    <td className="importe-cell">
                      {formatCurrencyMXN(item.importe)}
                    </td>
                    <td className="col-sat">
                      <input
                        type="text"
                        value={item.sat_code ?? ''}
                        onChange={(e) =>
                          onUpdate(item.id, 'sat_code', e.target.value)
                        }
                        placeholder="00000000"
                        title={item.sat_description ?? ''}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() => onRemove(item.id)}
                        title="Eliminar renglón"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`items-total ${cuadra ? 'ok' : 'warn'}`}>
            Suma de conceptos: {formatCurrencyMXN(itemsTotal)}
            {!cuadra && (
              <span>
                {' '}
                — Debe cuadrar con {formatCurrencyMXN(targetTotal)}
              </span>
            )}
          </div>
          <p className="formula-note">
            La nota de remisión no sustituye CFDI; los códigos SAT son
            referenciales para control interno.
          </p>
        </>
      ) : (
        <p className="empty-state">
          No hay conceptos. Capture el monto aprobado, seleccione el tipo de
          remodelación y presione &quot;Generar conceptos automáticamente&quot;.
        </p>
      )}
    </section>
  );
}
