import type { Remision } from '../../types';
import { DEFAULT_PORCENTAJE_INCREMENTO } from '../calculateRemisionTotals';
import { ensureFerreteriaName } from '../../data/ferreteriasFicticias';

const STORAGE_KEY = 'remisiones_data';

type LegacyRemision = Remision & { incremento_porcentaje?: number };

/** Compatibilidad con remisiones antiguas (incremento_porcentaje / sin ferretería). */
export function normalizeRemision(raw: LegacyRemision): Remision {
  const porcentaje_incremento =
    typeof raw.porcentaje_incremento === 'number' && Number.isFinite(raw.porcentaje_incremento)
      ? raw.porcentaje_incremento
      : typeof raw.incremento_porcentaje === 'number' && Number.isFinite(raw.incremento_porcentaje)
        ? raw.incremento_porcentaje
        : DEFAULT_PORCENTAJE_INCREMENTO;

  return {
    ...raw,
    porcentaje_incremento,
    ferreteria_nombre: ensureFerreteriaName(raw.ferreteria_nombre),
  };
}

function readRaw(): LegacyRemision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LegacyRemision[];
  } catch {
    return [];
  }
}

function writeAll(remisiones: Remision[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remisiones));
}

function readAll(): Remision[] {
  const parsed = readRaw();
  let needsPersist = false;
  const normalized = parsed.map((r) => {
    const hadFerreteria = !!r.ferreteria_nombre?.trim();
    const hadPorcentaje =
      typeof r.porcentaje_incremento === 'number' && Number.isFinite(r.porcentaje_incremento);
    const n = normalizeRemision(r);
    if (!hadFerreteria || !hadPorcentaje) needsPersist = true;
    return n;
  });
  if (needsPersist && normalized.length > 0) {
    writeAll(normalized);
  }
  return normalized;
}

export const remisionStorage = {
  getAll(): Remision[] {
    return readAll().sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  getById(id: string): Remision | null {
    return readAll().find((r) => r.id === id) ?? null;
  },

  save(remision: Remision): Remision {
    const all = readAll();
    const idx = all.findIndex((r) => r.id === remision.id);
    const updated = normalizeRemision({
      ...remision,
      updated_at: new Date().toISOString(),
    });

    if (idx >= 0) {
      updated.ferreteria_nombre = ensureFerreteriaName(
        all[idx].ferreteria_nombre ?? remision.ferreteria_nombre,
      );
      all[idx] = updated;
    } else {
      all.push(updated);
    }

    writeAll(all);
    return updated;
  },

  delete(id: string): void {
    writeAll(readAll().filter((r) => r.id !== id));
  },
};

/** Capa de abstracción para migración futura a Supabase */
export interface RemisionRepository {
  getAll(): Promise<Remision[]>;
  getById(id: string): Promise<Remision | null>;
  save(remision: Remision): Promise<Remision>;
  delete(id: string): Promise<void>;
}

export const localRemisionRepository: RemisionRepository = {
  async getAll() {
    return remisionStorage.getAll();
  },
  async getById(id) {
    return remisionStorage.getById(id);
  },
  async save(remision) {
    return remisionStorage.save(remision);
  },
  async delete(id) {
    remisionStorage.delete(id);
  },
};
