import type { Remision } from '../../types';

const STORAGE_KEY = 'remisiones_data';

function readAll(): Remision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Remision[];
  } catch {
    return [];
  }
}

function writeAll(remisiones: Remision[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remisiones));
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
    const updated = { ...remision, updated_at: new Date().toISOString() };

    if (idx >= 0) {
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
