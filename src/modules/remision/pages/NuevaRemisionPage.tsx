import { useMemo } from 'react';
import { PRECIOS_NOTA } from '../constants/tiposRemodelacion';
import { ClienteSection } from '../components/ClienteSection';
import { ConceptosTable } from '../components/ConceptosTable';
import { EmisorSection } from '../components/EmisorSection';
import { FinancierosSection } from '../components/FinancierosSection';
import { TipoRemodelacionSection } from '../components/TipoRemodelacionSection';
import { TotalesSection } from '../components/TotalesSection';
import { useRemisionForm } from '../hooks/useRemisionForm';
import { sumItemsImporte } from '../lib/generateRemisionItems';
import { generateRemisionPDF } from '../pdf/generateRemisionPDF';
import type { Remision } from '../types';

interface Props {
  initialRemision?: Remision | null;
}

export function NuevaRemisionPage({ initialRemision }: Props) {
  const {
    form,
    items,
    totals,
    errors,
    successMsg,
    updateField,
    handleGenerateConcepts,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleSave,
    handleClear,
    buildRemision,
    getValidation,
    setErrors,
  } = useRemisionForm(initialRemision);

  const itemsTotal = useMemo(() => sumItemsImporte(items), [items]);

  const handleDownloadPdf = () => {
    const validation = getValidation();
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    const remision = buildRemision();
    generateRemisionPDF(remision);
  };

  const handleSaveClick = () => {
    handleSave();
  };

  return (
    <div className="page nueva-remision">
      <header className="page-header">
        <h1>
          {initialRemision
            ? `Editar remisión ${initialRemision.folio}`
            : 'Nueva remisión'}
        </h1>
        <p className="subtitle">
          Sistema de notas de remisión para remodelación
        </p>
      </header>

      {errors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <strong>Por favor corrija lo siguiente:</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" role="status">
          {successMsg}
        </div>
      )}

      <ClienteSection form={form} onChange={updateField} />
      <FinancierosSection form={form} totals={totals} onChange={updateField} />
      <TipoRemodelacionSection form={form} onChange={updateField} />

      <ConceptosTable
        items={items}
        onUpdate={handleUpdateItem}
        onRemove={handleRemoveItem}
        onAdd={handleAddItem}
        onGenerate={handleGenerateConcepts}
        onRegenerate={handleGenerateConcepts}
        itemsTotal={itemsTotal}
        targetTotal={totals.total_remision}
      />

      <TotalesSection totals={totals} ivaMode={form.iva_mode} />

      <EmisorSection form={form} onChange={updateField} />

      <section className="form-section acciones-section">
        <h2>7. Acciones</h2>
        <div className="actions-row">
          <button type="button" className="btn btn-primary" onClick={handleSaveClick}>
            Guardar remisión
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleDownloadPdf}>
            Descargar PDF
          </button>
          <button type="button" className="btn btn-outline" onClick={handleClear}>
            Limpiar formulario
          </button>
        </div>
      </section>

      <footer className="precios-nota">
        <small>{PRECIOS_NOTA}</small>
      </footer>
    </div>
  );
}
