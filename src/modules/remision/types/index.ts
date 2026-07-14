export type IvaMode = 'incluido' | 'sin_iva';

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
  ultima_actualizacion: string;
  tags: string[];
}

export interface RemisionItem {
  id: string;
  cantidad: number;
  unidad: string;
  concepto: string;
  precio_unitario: number;
  importe: number;
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
  plazo: string;
  tipo_remodelacion: TipoRemodelacion | '';
  iva_mode: IvaMode;
}

export interface RemisionTotals {
  incremento_porcentaje: number;
  incremento_monto: number;
  total_remision: number;
  subtotal: number;
  iva: number;
  total: number;
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
  incremento_porcentaje: number;
  incremento_monto: number;
  total_remision: number;
  plazo: string;
  tipo_remodelacion: TipoRemodelacion;
  iva_mode: IvaMode;
  subtotal: number;
  iva: number;
  total: number;
  items: RemisionItem[];
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
}
