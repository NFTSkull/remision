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
                  <th>Concepto</th>
                  <th>Precio unitario</th>
                  <th>Importe</th>
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
                    <td>
                      <input
                        type="text"
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
