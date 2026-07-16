/** Nombres ficticios para el emisor de la nota (PDF). No son empresas reales. */
export const FERRETERIAS_FICTICIAS = [
  'FERRETERÍA EL MARTILLO',
  'FERRETERÍA LA OBRA',
  'MATERIALES DEL NORTE',
  'FERRETODO MONTERREY',
  'CASA DEL CONSTRUCTOR',
  'FERRETERÍA SAN MIGUEL',
  'MATERIALES LA SIERRA',
  'FERRETERÍA LOS PINOS',
  'PROMATERIALES EXPRESS',
  'FERRETERÍA EL CONSTRUCTOR',
  'MATERIALES SANTA LUCÍA',
  'FERREACABADOS DEL NORTE',
  'SUMINISTROS LA OBRA',
  'FERRETERÍA HERNÁNDEZ',
  'MATERIALES Y ACABADOS REGIOS',
] as const;

export type FerreteriaFicticia = (typeof FERRETERIAS_FICTICIAS)[number];

export function getRandomFerreteriaName(): string {
  const idx = Math.floor(Math.random() * FERRETERIAS_FICTICIAS.length);
  return FERRETERIAS_FICTICIAS[idx];
}

/** Asigna ferretería una sola vez; no cambia si ya existe. */
export function ensureFerreteriaName(existing?: string | null): string {
  const trimmed = existing?.trim();
  if (trimmed) return trimmed;
  return getRandomFerreteriaName();
}
