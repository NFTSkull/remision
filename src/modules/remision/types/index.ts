export type IvaMode = 'incluido' | 'sin_iva';

export type PrecioConfidence = 'fuente_directa' | 'estimado' | 'manual';
export type SatConfidence = 'exacto' | 'generico' | 'pendiente_verificar';

export type TipoRemodelacion =
  | 'Remodelación general'
  | 'Baño'
  | 'Cocina'
  | 'Sala'
  | 'Recámara'
  | 'Piso / azulejo'
  | 'Techo / impermeabilización'
  | 'Pintura'
  | 'Eléctrico'
  | 'Plomería'
  | 'Fachada'
  | 'Patio / exterior'
  | 'Lavandería'
  | 'Ampliación ligera'
  | 'Mantenimiento general';

export interface CatalogoMaterial {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  precio_min: number;
  precio_max: number;
  precio_sugerido: number;
  fuente_nombre: string;
  fuente_url: string;
  fecha_precio: string;
  ultima_actualizacion: string;
  last_verified_at: string;
  sat_code: string;
  sat_description: string;
  sat_confidence: SatConfidence;
  confidence: PrecioConfidence;
  tags: string[];
  activo: boolean;
}

export interface RemisionItem {
  id: string;
  cantidad: number;
  unidad: string;
  concepto: string;
  precio_unitario: number;
  importe: number;
  sat_code: string;
  sat_description?: string;
  fuente_nombre?: string | null;
  fuente_url?: string | null;
}

export interface RemisionFormData {
  fecha: string;
  nombre_cliente: string;
  rfc: string;
  direccion: string;
  telefono: string;
  ciudad: string;
  monto_aprobado: number;
  /** Porcentaje editable; default 20 al crear. */
  porcentaje_incremento: number;
  plazo: string;
  tipo_remodelacion: TipoRemodelacion | '';
  iva_mode: IvaMode;
  area_m2?: number | null;
}

export interface RemisionTotals {
  porcentaje_incremento: number;
  incremento_monto: number;
  total_remision: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface CompanyInfo {
  rfc: string;
  addressLine: string;
  telefono: string;
  nombre?: string;
}

export interface Remision {
  id: string;
  folio: string;
  fecha: string;
  nombre_cliente: string;
  rfc: string;
  direccion: string;
  telefono: string;
  ciudad: string;
  monto_aprobado: number;
  porcentaje_incremento: number;
  incremento_monto: number;
  total_remision: number;
  plazo: string;
  tipo_remodelacion: TipoRemodelacion;
  iva_mode: IvaMode;
  area_m2?: number | null;
  subtotal: number;
  iva: number;
  total: number;
  items: RemisionItem[];
  /** Nombre ficticio del emisor en PDF; se asigna una sola vez. */
  ferreteria_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateRemisionItemsParams {
  montoAprobado: number;
  totalRemision: number;
  tipoRemodelacion: TipoRemodelacion;
  plazo: string;
  ivaMode: IvaMode;
  catalogo: CatalogoMaterial[];
  areaM2?: number | null;
}

export interface SatCodeEntry {
  code: string;
  description: string;
  category: string;
  appliesToTags: string[];
}
