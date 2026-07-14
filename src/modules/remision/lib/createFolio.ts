const FOLIO_COUNTER_KEY = 'remision_folio_counter';

export function createFolio(): string {
  const current = parseInt(localStorage.getItem(FOLIO_COUNTER_KEY) ?? '0', 10);
  const next = current + 1;
  localStorage.setItem(FOLIO_COUNTER_KEY, String(next));
  return `REM-${String(next).padStart(6, '0')}`;
}

export function peekNextFolio(): string {
  const current = parseInt(localStorage.getItem(FOLIO_COUNTER_KEY) ?? '0', 10);
  return `REM-${String(current + 1).padStart(6, '0')}`;
}
