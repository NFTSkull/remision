# API / Contratos — B0 Remision

## Helpers públicos

| Función | Entrada | Salida |
|---------|---------|--------|
| `calculateRemisionTotals(monto, ivaMode)` | number, IvaMode | RemisionTotals |
| `generateRemisionItems(params)` | GenerateRemisionItemsParams | RemisionItem[] |
| `formatCurrencyMXN(n)` | number | string |
| `numberToSpanishCurrency(n)` | number | string |
| `createFolio()` | — | string REM-XXXXXX |
| `generateRemisionPDF(remision)` | Remision | descarga PDF |

## Persistencia local
- Key: `remisiones_data`
- Key folio: `remision_folio_counter`

## Validaciones PDF
Campos obligatorios: nombre, RFC, dirección, teléfono, ciudad, monto > 0, plazo, tipo, ≥1 concepto.
