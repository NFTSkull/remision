import type { RemisionFormData, RemisionItem } from '../types';
import {
  calculateRemisionTotals,
  DEFAULT_PORCENTAJE_INCREMENTO,
  MAX_PORCENTAJE_INCREMENTO,
} from './calculateRemisionTotals';
import { normalizeMoney } from './normalizeMoney';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Valida porcentaje: número finito, 0..MAX inclusive. */
export function validatePorcentajeIncremento(
  value: unknown,
): ValidationResult {
  const errors: string[] = [];

  if (value === '' || value === null || value === undefined) {
    errors.push('El porcentaje de incremento es obligatorio.');
    return { valid: false, errors };
  }

  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    errors.push('El porcentaje de incremento debe ser un número válido.');
    return { valid: false, errors };
  }
  if (n < 0) {
    errors.push('El porcentaje de incremento no puede ser negativo.');
  }
  if (n > MAX_PORCENTAJE_INCREMENTO) {
    errors.push(
      `El porcentaje de incremento no puede ser mayor a ${MAX_PORCENTAJE_INCREMENTO}.`,
    );
  }

  return { valid: errors.length === 0, errors };
}

export function validateRemisionForPdf(
  form: RemisionFormData,
  items: RemisionItem[],
  totalRemision?: number,
): ValidationResult {
  const errors: string[] = [];

  if (!form.fecha?.trim()) errors.push('La fecha es obligatoria.');
  if (!form.nombre_cliente.trim()) errors.push('El nombre del cliente es obligatorio.');
  if (!form.rfc.trim()) errors.push('El RFC es obligatorio.');
  if (!form.direccion.trim()) errors.push('La dirección es obligatoria.');
  if (!form.telefono.trim()) errors.push('El teléfono es obligatorio.');
  if (!form.ciudad.trim()) errors.push('La ciudad es obligatoria.');
  if (!form.monto_aprobado || form.monto_aprobado <= 0) {
    errors.push('El monto aprobado debe ser mayor a cero.');
  }

  const pctValidation = validatePorcentajeIncremento(form.porcentaje_incremento);
  errors.push(...pctValidation.errors);

  if (!form.plazo.trim()) errors.push('El plazo es obligatorio.');
  if (!form.ferreteria_nombre?.trim()) {
    errors.push('El nombre del emisor en el PDF es obligatorio.');
  }
  if (!form.tipo_remodelacion) {
    errors.push('Debe seleccionar un tipo de remodelación.');
  }
  if (items.length === 0) {
    errors.push('Debe tener al menos un concepto en la tabla.');
  }

  for (const [idx, item] of items.entries()) {
    const n = idx + 1;
    if (!item.concepto.trim()) {
      errors.push(`El concepto del renglón ${n} es obligatorio.`);
    }
    if (!item.sat_code?.trim()) {
      errors.push(`El código SAT del renglón ${n} es obligatorio.`);
    }
    if (!(item.cantidad > 0)) {
      errors.push(`La cantidad del renglón ${n} debe ser mayor a cero.`);
    }
    if (!(item.precio_unitario > 0)) {
      errors.push(`El precio unitario del renglón ${n} debe ser mayor a cero.`);
    }
  }

  if (totalRemision !== undefined && items.length > 0 && pctValidation.valid) {
    const suma = normalizeMoney(items.reduce((s, i) => s + i.importe, 0));
    if (Math.abs(suma - totalRemision) >= 0.01) {
      errors.push(
        'La suma de conceptos no coincide con el total. Regenera o ajusta los conceptos.',
      );
    }

    const totals = calculateRemisionTotals(
      form.monto_aprobado,
      form.iva_mode,
      form.porcentaje_incremento,
    );
    if (Math.abs(normalizeMoney(totals.subtotal + totals.iva) - totals.total) >= 0.01) {
      errors.push('Subtotal + IVA debe ser igual al total.');
    }
    if (form.iva_mode === 'incluido' && Math.abs(totals.total - totals.total_remision) >= 0.01) {
      errors.push('Con IVA incluido, el total debe igualar el total de remisión.');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateForGenerateConcepts(
  form: RemisionFormData,
): ValidationResult {
  const errors: string[] = [];

  if (!form.monto_aprobado || form.monto_aprobado <= 0) {
    errors.push('Ingrese un monto aprobado mayor a cero para generar conceptos.');
  }
  const pctValidation = validatePorcentajeIncremento(form.porcentaje_incremento);
  errors.push(...pctValidation.errors);
  if (!form.tipo_remodelacion) {
    errors.push('Seleccione un tipo de remodelación antes de generar conceptos.');
  }

  return { valid: errors.length === 0, errors };
}

export { DEFAULT_PORCENTAJE_INCREMENTO };
