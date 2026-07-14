import type { RemisionFormData, RemisionItem } from '../types';
import { normalizeMoney } from './normalizeMoney';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRemisionForPdf(
  form: RemisionFormData,
  items: RemisionItem[],
  totalRemision?: number,
): ValidationResult {
  const errors: string[] = [];

  if (!form.nombre_cliente.trim()) errors.push('El nombre del cliente es obligatorio.');
  if (!form.rfc.trim()) errors.push('El RFC es obligatorio.');
  if (!form.direccion.trim()) errors.push('La dirección es obligatoria.');
  if (!form.telefono.trim()) errors.push('El teléfono es obligatorio.');
  if (!form.ciudad.trim()) errors.push('La ciudad es obligatoria.');
  if (!form.monto_aprobado || form.monto_aprobado <= 0) {
    errors.push('El monto aprobado debe ser mayor a cero.');
  }
  if (!form.plazo.trim()) errors.push('El plazo es obligatorio.');
  if (!form.tipo_remodelacion) {
    errors.push('Debe seleccionar un tipo de remodelación.');
  }
  if (items.length === 0) {
    errors.push('Debe tener al menos un concepto en la tabla.');
  }

  if (totalRemision !== undefined && items.length > 0) {
    const suma = normalizeMoney(items.reduce((s, i) => s + i.importe, 0));
    if (Math.abs(suma - totalRemision) >= 0.01) {
      errors.push(
        'La suma de conceptos debe cuadrar exactamente con el total de remisión.',
      );
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
  if (!form.tipo_remodelacion) {
    errors.push('Seleccione un tipo de remodelación antes de generar conceptos.');
  }

  return { valid: errors.length === 0, errors };
}
