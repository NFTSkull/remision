# API / Contratos — Remision (MVP local)

Regla de total:
`total_remision = monto_aprobado * (1 + porcentaje_incremento / 100)`

Default de `porcentaje_incremento`: **20** (editable en UI, rango 0–100).

IVA incluido (default): `subtotal = total_remision / 1.16`, `iva = total - subtotal`, `total = total_remision`.

Sin IVA: `subtotal = total_remision`, `iva = 0`, `total = total_remision`.

La nota de remisión no sustituye CFDI; los códigos SAT son referenciales para control interno.

## Helpers públicos

| Función | Entrada | Salida |
|---------|---------|--------|
| `calculateRemisionTotals(monto, ivaMode, porcentaje?)` | number, IvaMode, number | RemisionTotals |
| `generateRemisionItems(params)` | GenerateRemisionItemsParams (+ areaM2?) | RemisionItem[] (con `sat_code`) |
| `estimateAreaM2(tipo, total, area?)` | tipo, number, number? | number |
| `formatCurrencyMXN(n)` | number | string |
| `numberToSpanishCurrency(n)` | number | string |
| `createFolio()` | — | string REM-XXXXXX |
| `generateRemisionPDF(remision)` | Remision | descarga PDF hoja preimpresa |
| `validateRemisionForPdf(form, items, total)` | form + items | `{ valid, errors }` |
| `ensureFerreteriaName(existing?)` | string? | nombre ficticio estable |

## Emisor PDF

- Campo `ferreteria_nombre` (asignado una vez por remisión desde `FERRETERIAS_FICTICIAS`).
- El PDF **no** muestra dirección fija tipo Mariano Escobedo ni RFC superior vacío.
- El PDF **no** muestra monto aprobado, porcentaje ni monto de incremento.

## Persistencia local

- Key: `remisiones_data`
- Key folio: `remision_folio_counter`
- Compatibilidad: remisiones viejas con `incremento_porcentaje` → `porcentaje_incremento` (default 20).
- Sin Supabase / sin login en este bloque.

## Validaciones PDF / guardar

Obligatorios: fecha, nombre, RFC, dirección, teléfono, ciudad, monto_aprobado > 0, porcentaje_incremento (0–100), plazo, tipo_remodelacion, ≥1 concepto.

Por partida: cantidad > 0, precio > 0, `sat_code` no vacío.

Cuadre: `suma(items.importe) === total_remision` y `subtotal + iva === total` (IVA incluido).
