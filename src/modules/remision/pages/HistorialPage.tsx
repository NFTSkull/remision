import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrencyMXN } from '../lib/formatCurrencyMXN';
import { remisionStorage } from '../lib/storage/remisionStorage';
import { generateRemisionPDF } from '../pdf/generateRemisionPDF';
import type { Remision } from '../types';

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return fecha;
}

export function HistorialPage() {
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setRemisiones(remisionStorage.getAll());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (id: string, folio: string) => {
    if (window.confirm(`¿Eliminar la remisión ${folio}?`)) {
      remisionStorage.delete(id);
      load();
    }
  };

  const handlePdf = (remision: Remision) => {
    // Persiste ferretería/porcentaje migrados antes de descargar
    const saved = remisionStorage.save(remision);
    generateRemisionPDF(saved);
  };

  return (
    <div className="page historial">
      <header className="page-header">
        <h1>Historial de remisiones</h1>
        <Link to="/" className="btn btn-primary">
          Nueva remisión
        </Link>
      </header>

      {remisiones.length === 0 ? (
        <p className="empty-state">
          No hay remisiones guardadas.{' '}
          <Link to="/">Crear la primera remisión</Link>
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto aprobado</th>
                <th>% Inc.</th>
                <th>Total remisión</th>
                <th>Plazo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {remisiones.map((r) => (
                <tr key={r.id}>
                  <td>{r.folio}</td>
                  <td>{r.nombre_cliente}</td>
                  <td>{formatFecha(r.fecha)}</td>
                  <td>{r.tipo_remodelacion}</td>
                  <td>{formatCurrencyMXN(r.monto_aprobado)}</td>
                  <td>{r.porcentaje_incremento}%</td>
                  <td>{formatCurrencyMXN(r.total_remision)}</td>
                  <td>{r.plazo}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => navigate(`/ver/${r.id}`)}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => navigate(`/editar/${r.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePdf(r)}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(r.id, r.folio)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
