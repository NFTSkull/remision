# API / Contratos — Remision (MVP local)

Regla central (inalterable): `total_remision = monto_aprobado * 1.20`.

IVA incluido (default): `subtotal = total_remision / 1.16`, `iva = total - subtotal`, `total = total_remision`.

La nota de remisión no sustituye CFDI; los códigos SAT son referenciales para control interno.

## Helpers públicos

| Función | Entrada | Salida |
|---------|---------|--------|
| `calculateRemisionTotals(monto, ivaMode)` | number, IvaMode | RemisionTotals |
| `generateRemisionItems(params)` | GenerateRemisionItemsParams (+ areaM2?) | RemisionItem[] (con `sat_code`) |
| `estimateAreaM2(tipo, total, area?)` | tipo, number, number? | number |
| `formatCurrencyMXN(n)` | number | string |
| `numberToSpanishCurrency(n)` | number | string |
| `createFolio()` | — | string REM-XXXXXX |
| `generateRemisionPDF(remision)` | Remision | descarga PDF hoja preimpresa |
| `validateRemisionForPdf(form, items, total)` | form + items | `{ valid, errors }` |

## Catálogo / SAT

- `CATALOGO_MATERIALES`: ≥180 conceptos (`sat_code`, `sat_description`, `sat_confidence`, `confidence`, fuente, precios).
- `SAT_CODES` en `data/satCodes.ts`: claves referenciales por categoría/tags.
- Fuentes documentadas en `data/fuentesPrecios.md`.

## Empresa (PDF)

- `DEFAULT_COMPANY_INFO.addressLine` (override vía `companyInfo` futuro).
- Default: `MARIANO ESCOBEDO SUR 638-A COL. CENTRO MONTERREY N.L TEL: 8044 5959`.

## Persistencia local

- Key: `remisiones_data`
- Key folio: `remision_folio_counter`
- Sin Supabase / sin login en este bloque.

## Validaciones PDF / guardar

Obligatorios: fecha, nombre, RFC, dirección, teléfono, ciudad, monto_aprobado > 0, plazo, tipo_remodelacion, ≥1 concepto.

Por partida: cantidad > 0, precio > 0, `sat_code` no vacío.

Cuadre: `suma(items.importe) === total_remision` y `subtotal + iva === total` (IVA incluido).

PDF no incluye monto aprobado ni incremento 20%.
