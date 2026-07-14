import type { SatCodeEntry } from '../types';

/**
 * Claves SAT referenciales (producto/servicio) para control interno.
 * La nota de remisión no sustituye CFDI; los códigos SAT son referenciales.
 */
export const SAT_CODES: SatCodeEntry[] = [
  {
    code: '30111601',
    description: 'Cemento',
    category: 'Construcción',
    appliesToTags: ['construccion', 'cemento'],
  },
  {
    code: '30111500',
    description: 'Bloques y ladrillos',
    category: 'Construcción',
    appliesToTags: ['construccion', 'block', 'ampliacion'],
  },
  {
    code: '30111800',
    description: 'Productos de yeso',
    category: 'Construcción',
    appliesToTags: ['yeso', 'construccion'],
  },
  {
    code: '31151100',
    description: 'Productos de acero (barras y varillas)',
    category: 'Construcción',
    appliesToTags: ['construccion', 'ampliacion'],
  },
  {
    code: '30161500',
    description: 'Pisos y revestimientos',
    category: 'Pisos',
    appliesToTags: ['pisos', 'azulejo'],
  },
  {
    code: '31201600',
    description: 'Adhesivos y pegamentos',
    category: 'Pisos',
    appliesToTags: ['pisos', 'azulejo', 'adhesivo'],
  },
  {
    code: '30121700',
    description: 'Pinturas y barnices',
    category: 'Pintura',
    appliesToTags: ['pintura'],
  },
  {
    code: '31201500',
    description: 'Selladores',
    category: 'Pintura',
    appliesToTags: ['pintura', 'impermeabilizacion', 'sellador'],
  },
  {
    code: '30121800',
    description: 'Impermeabilizantes y revestimientos protectores',
    category: 'Impermeabilización',
    appliesToTags: ['impermeabilizacion', 'techo'],
  },
  {
    code: '30151700',
    description: 'Accesorios para baño',
    category: 'Baño',
    appliesToTags: ['bano', 'sanitario'],
  },
  {
    code: '40141700',
    description: 'Válvulas y llaves',
    category: 'Plomería',
    appliesToTags: ['plomeria'],
  },
  {
    code: '40171500',
    description: 'Tuberías y conexiones',
    category: 'Plomería',
    appliesToTags: ['plomeria', 'bano', 'cocina'],
  },
  {
    code: '30181500',
    description: 'Fregaderos y lavabos',
    category: 'Cocina/Baño',
    appliesToTags: ['cocina', 'bano'],
  },
  {
    code: '39121500',
    description: 'Cableado eléctrico',
    category: 'Eléctrico',
    appliesToTags: ['electrico'],
  },
  {
    code: '39122200',
    description: 'Contactos y apagadores',
    category: 'Eléctrico',
    appliesToTags: ['electrico'],
  },
  {
    code: '39121000',
    description: 'Dispositivos de protección eléctrica',
    category: 'Eléctrico',
    appliesToTags: ['electrico'],
  },
  {
    code: '39111500',
    description: 'Lámparas y luminarias',
    category: 'Eléctrico',
    appliesToTags: ['electrico'],
  },
  {
    code: '30171500',
    description: 'Puertas y marcos',
    category: 'Carpintería',
    appliesToTags: ['carpinteria'],
  },
  {
    code: '72101500',
    description: 'Servicios de construcción de edificaciones',
    category: 'Servicios',
    appliesToTags: ['mano_obra', 'general', 'ampliacion'],
  },
  {
    code: '72121500',
    description: 'Servicios de techado e impermeabilización',
    category: 'Servicios',
    appliesToTags: ['mano_obra', 'impermeabilizacion', 'techo'],
  },
  {
    code: '72121103',
    description: 'Servicios de pintura de edificios',
    category: 'Servicios',
    appliesToTags: ['mano_obra', 'pintura'],
  },
  {
    code: '72101505',
    description: 'Servicios de instalación eléctrica',
    category: 'Servicios',
    appliesToTags: ['mano_obra', 'electrico'],
  },
  {
    code: '72101507',
    description: 'Servicios de plomería',
    category: 'Servicios',
    appliesToTags: ['mano_obra', 'plomeria'],
  },
  {
    code: '78121603',
    description: 'Servicios de flete terrestre local',
    category: 'Servicios',
    appliesToTags: ['flete'],
  },
  {
    code: '76121500',
    description: 'Servicios de retiro de residuos',
    category: 'Servicios',
    appliesToTags: ['escombro'],
  },
  {
    code: '27113200',
    description: 'Herramienta de mano',
    category: 'Herramienta',
    appliesToTags: ['general'],
  },
  {
    code: '72102900',
    description: 'Servicios especializados de remodelación',
    category: 'Servicios',
    appliesToTags: ['mano_obra', 'general'],
  },
];

export function findSatByTags(tags: string[]): SatCodeEntry {
  const hit = SAT_CODES.find((s) => s.appliesToTags.some((t) => tags.includes(t)));
  return (
    hit ?? {
      code: '72101500',
      description: 'Servicios de construcción de edificaciones',
      category: 'Servicios',
      appliesToTags: ['general'],
    }
  );
}
