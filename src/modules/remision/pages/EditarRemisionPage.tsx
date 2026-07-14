import { useParams } from 'react-router-dom';
import { remisionStorage } from '../lib/storage/remisionStorage';
import { NuevaRemisionPage } from './NuevaRemisionPage';

export function EditarRemisionPage() {
  const { id } = useParams<{ id: string }>();
  const remision = id ? remisionStorage.getById(id) : null;

  if (!remision) {
    return (
      <div className="page">
        <p className="empty-state">Remisión no encontrada.</p>
      </div>
    );
  }

  return <NuevaRemisionPage initialRemision={remision} />;
}

export function VerRemisionPage() {
  const { id } = useParams<{ id: string }>();
  const remision = id ? remisionStorage.getById(id) : null;

  if (!remision) {
    return (
      <div className="page">
        <p className="empty-state">Remisión no encontrada.</p>
      </div>
    );
  }

  // Misma pantalla editable: ver = abrir registro; editar/guardar mantiene el folio.
  return <NuevaRemisionPage initialRemision={remision} />;
}
