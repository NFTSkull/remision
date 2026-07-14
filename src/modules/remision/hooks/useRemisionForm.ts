import { useCallback, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CATALOGO_MATERIALES } from '../data/catalogoMateriales';
import { calculateRemisionTotals } from '../lib/calculateRemisionTotals';
import { createFolio } from '../lib/createFolio';
import {
  generateRemisionItems,
  recalcularItemImporte,
} from '../lib/generateRemisionItems';
import { remisionStorage } from '../lib/storage/remisionStorage';
import {
  validateForGenerateConcepts,
  validateRemisionForPdf,
} from '../lib/validation';
import type {
  IvaMode,
  Remision,
  RemisionFormData,
  RemisionItem,
  TipoRemodelacion,
} from '../types';

const emptyForm = (): RemisionFormData => ({
  fecha: new Date().toISOString().slice(0, 10),
  nombre_cliente: '',
  rfc: '',
  direccion: '',
  telefono: '',
  ciudad: '',
  monto_aprobado: 0,
  plazo: '',
  tipo_remodelacion: '',
  iva_mode: 'incluido',
  area_m2: null,
});

interface Identity {
  id: string;
  folio: string;
  created_at: string;
}

export function useRemisionForm(initialRemision?: Remision | null) {
  const [form, setForm] = useState<RemisionFormData>(() =>
    initialRemision
      ? {
          fecha: initialRemision.fecha,
          nombre_cliente: initialRemision.nombre_cliente,
          rfc: initialRemision.rfc,
          direccion: initialRemision.direccion,
          telefono: initialRemision.telefono,
          ciudad: initialRemision.ciudad,
          monto_aprobado: initialRemision.monto_aprobado,
          plazo: initialRemision.plazo,
          tipo_remodelacion: initialRemision.tipo_remodelacion,
          iva_mode: initialRemision.iva_mode,
          area_m2: initialRemision.area_m2 ?? null,
        }
      : emptyForm(),
  );

  const [items, setItems] = useState<RemisionItem[]>(
    () => initialRemision?.items ?? [],
  );

  const identityRef = useRef<Identity | null>(
    initialRemision
      ? {
          id: initialRemision.id,
          folio: initialRemision.folio,
          created_at: initialRemision.created_at,
        }
      : null,
  );

  const [editingId, setEditingId] = useState<string | null>(
    () => initialRemision?.id ?? null,
  );
  const [editingFolio, setEditingFolio] = useState<string | null>(
    () => initialRemision?.folio ?? null,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totals = useMemo(
    () => calculateRemisionTotals(form.monto_aprobado, form.iva_mode),
    [form.monto_aprobado, form.iva_mode],
  );

  /** Asigna id/folio una sola vez para no quemar folios en PDF previo a guardar */
  const ensureIdentity = useCallback((): Identity => {
    if (!identityRef.current) {
      const created_at = new Date().toISOString();
      identityRef.current = {
        id: uuidv4(),
        folio: createFolio(),
        created_at,
      };
      setEditingId(identityRef.current.id);
      setEditingFolio(identityRef.current.folio);
    }
    return identityRef.current;
  }, []);

  const updateField = useCallback(
    (key: keyof RemisionFormData, value: RemisionFormData[keyof RemisionFormData]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors([]);
      setSuccessMsg(null);
    },
    [],
  );

  const handleGenerateConcepts = useCallback(() => {
    const validation = validateForGenerateConcepts(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const generated = generateRemisionItems({
      montoAprobado: form.monto_aprobado,
      totalRemision: totals.total_remision,
      tipoRemodelacion: form.tipo_remodelacion as TipoRemodelacion,
      plazo: form.plazo,
      ivaMode: form.iva_mode,
      catalogo: CATALOGO_MATERIALES,
      areaM2: form.area_m2,
    });

    setItems(generated);
    setErrors([]);
    setSuccessMsg('Conceptos generados correctamente.');
  }, [form, totals.total_remision]);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: uuidv4(),
        cantidad: 1,
        unidad: 'pieza',
        concepto: '',
        precio_unitario: 0,
        importe: 0,
        sat_code: '',
      },
    ]);
  }, []);

  const handleUpdateItem = useCallback(
    (id: string, field: keyof RemisionItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          if (field === 'cantidad' || field === 'precio_unitario') {
            const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
            return recalcularItemImporte(
              item,
              field === 'cantidad' ? num : item.cantidad,
              field === 'precio_unitario' ? num : item.precio_unitario,
            );
          }
          return { ...item, [field]: value };
        }),
      );
    },
    [],
  );

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const buildRemision = useCallback((): Remision => {
    const identity = ensureIdentity();
    const now = new Date().toISOString();
    return {
      id: identity.id,
      folio: identity.folio,
      fecha: form.fecha,
      nombre_cliente: form.nombre_cliente.trim(),
      rfc: form.rfc.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono.trim(),
      ciudad: form.ciudad.trim(),
      monto_aprobado: form.monto_aprobado,
      incremento_porcentaje: totals.incremento_porcentaje,
      incremento_monto: totals.incremento_monto,
      total_remision: totals.total_remision,
      plazo: form.plazo.trim(),
      tipo_remodelacion: form.tipo_remodelacion as TipoRemodelacion,
      iva_mode: form.iva_mode as IvaMode,
      area_m2: form.area_m2 ?? null,
      subtotal: totals.subtotal,
      iva: totals.iva,
      total: totals.total,
      items,
      created_at: identity.created_at,
      updated_at: now,
    };
  }, [ensureIdentity, form, items, totals]);

  const handleSave = useCallback((): Remision | null => {
    const validation = validateRemisionForPdf(form, items, totals.total_remision);
    if (!validation.valid) {
      setErrors(validation.errors);
      return null;
    }
    const remision = buildRemision();
    remisionStorage.save(remision);
    setEditingId(remision.id);
    setEditingFolio(remision.folio);
    setSuccessMsg(`Remisión ${remision.folio} guardada correctamente.`);
    setErrors([]);
    return remision;
  }, [buildRemision, form, items, totals.total_remision]);

  const handleClear = useCallback(() => {
    identityRef.current = null;
    setForm(emptyForm());
    setItems([]);
    setEditingId(null);
    setEditingFolio(null);
    setErrors([]);
    setSuccessMsg(null);
  }, []);

  const getValidation = useCallback(
    () => validateRemisionForPdf(form, items, totals.total_remision),
    [form, items, totals.total_remision],
  );

  return {
    form,
    items,
    totals,
    errors,
    successMsg,
    editingId,
    editingFolio,
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
    setSuccessMsg,
  };
}
