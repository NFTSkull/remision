import type { TipoRemodelacion } from '../types';

export const TIPOS_REMODELACION: TipoRemodelacion[] = [
  'Remodelación general',
  'Baño',
  'Cocina',
  'Sala',
  'Recámara',
  'Piso / azulejo',
  'Techo / impermeabilización',
  'Pintura',
  'Eléctrico',
  'Plomería',
  'Fachada',
  'Patio / exterior',
  'Lavandería',
  'Ampliación ligera',
  'Mantenimiento general',
];

/** Tags de catálogo asociados a cada tipo de remodelación */
export const TIPO_TAG_MAP: Record<TipoRemodelacion, string[]> = {
  'Remodelación general': [
    'general',
    'construccion',
    'pintura',
    'electrico',
    'plomeria',
    'pisos',
    'mano_obra',
    'flete',
    'escombro',
  ],
  Baño: ['bano', 'plomeria', 'pisos', 'azulejo', 'sanitario', 'mano_obra', 'escombro'],
  Cocina: ['cocina', 'plomeria', 'electrico', 'pisos', 'azulejo', 'mano_obra', 'escombro'],
  Sala: ['sala', 'pintura', 'pisos', 'electrico', 'yeso', 'mano_obra', 'escombro'],
  Recámara: ['recamara', 'pintura', 'pisos', 'electrico', 'yeso', 'mano_obra'],
  'Piso / azulejo': ['pisos', 'azulejo', 'construccion', 'mano_obra', 'escombro'],
  'Techo / impermeabilización': [
    'impermeabilizacion',
    'techo',
    'pintura',
    'construccion',
    'mano_obra',
  ],
  Pintura: ['pintura', 'construccion', 'mano_obra'],
  Eléctrico: ['electrico', 'mano_obra'],
  Plomería: ['plomeria', 'bano', 'mano_obra'],
  Fachada: ['fachada', 'pintura', 'impermeabilizacion', 'construccion', 'mano_obra'],
  'Patio / exterior': [
    'patio',
    'exterior',
    'construccion',
    'pintura',
    'electrico',
    'plomeria',
    'mano_obra',
  ],
  Lavandería: ['lavanderia', 'plomeria', 'electrico', 'pisos', 'mano_obra'],
  'Ampliación ligera': [
    'ampliacion',
    'construccion',
    'electrico',
    'plomeria',
    'pintura',
    'mano_obra',
    'escombro',
    'flete',
  ],
  'Mantenimiento general': [
    'mantenimiento',
    'pintura',
    'plomeria',
    'electrico',
    'construccion',
    'mano_obra',
  ],
};

export const CATEGORIAS_MANO_OBRA = ['Mano de obra'];
export const CATEGORIAS_SERVICIOS = [
  'Servicios',
  'Flete / acarreo',
  'Retiro de escombro',
  'Herramienta menor',
];

export const PRECIOS_NOTA =
  'Precios referenciales sujetos a cambio según tienda, ciudad y disponibilidad.';
