# Changelog

## [0.1.1] — 2026-07-14

### Corregido
- Folio/id se asignan una sola vez (PDF previo a guardar ya no quema folios)
- Generación sin fallback al catálogo completo (evita contaminar tipologías)
- Priorización por tipo (baño/cocina/techo/piso/eléctrico/plomería)
- Partida ajustable garantizada para cuadrar centavos
- Validación: suma de conceptos debe igualar total_remisión para PDF/guardar
- PDF: evita corte de totales/firma en multipágina
- Categorización mano de obra vs servicios auxiliares

## [0.1.0] — 2026-07-14

### Añadido
- Sistema Remision MVP completo
- Formulario nueva remisión con cálculo automático +20%
- Catálogo inicial 120+ materiales referenciales México
- Generación inteligente de conceptos por tipo de remodelación
- PDF profesional carta con encabezado verde
- Historial con localStorage
- Pruebas unitarias Vitest
