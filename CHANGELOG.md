# Changelog

## [0.2.4] — 2026-07-16

### Cambiado
- Nombre de descarga del PDF único: `REM-XXXXXX-cliente-dd-mm-yyyy.pdf` (temporal con hora si no hay folio)

## [0.2.3] — 2026-07-16

### Cambiado
- Porcentaje de incremento editable (`porcentaje_incremento`, default 20); fórmula `monto × (1 + %/100)`
- PDF muestra ferretería ficticia persistente por remisión (sin dirección Mariano Escobedo)

### Eliminado
- Dirección fija “MARIANO ESCOBEDO…” del PDF

## [0.2.2] — 2026-07-14

### Corregido
- PDF: elimina RFC superior vacío (solo RFC del cliente)
- PDF: paginación dinámica por espacio disponible (ya no corta a 10 filas fijas)

## [0.2.1] — 2026-07-14

### Cambiado
- Layout PDF: márgenes, tipografía, filas, bordes, columnas, REMISION/FECHA, totales y firma más compactos tipo hoja preimpresa (solo `generateRemisionPDF.ts`)

## [0.2.0] — 2026-07-14

### Añadido
- PDF tipo hoja preimpresa: encabezados verdes, bordes negros, REMISION/FECHA, RFC, dirección empresa, cliente + PLAZO, columna CODIGOS DEL SAT DE PRODUCTO, mín. 10 renglones, cantidad con letra, SUBTOTAL/IVA/TOTAL, autorización, firma y nota legal
- Catálogo ampliado a 182 conceptos con `sat_code`, fuentes, `confidence` y `last_verified_at`
- `satCodes.ts` y documentación `fuentesPrecios.md`
- Columna Código SAT editable en tabla de conceptos
- Validación PDF: fecha, SAT obligatorio, cantidad/precio > 0, cuadre IVA

### Cambiado
- Generador incluye códigos SAT por partida; tipologías coherentes (baño/techo/cocina/piso)
- Configuración de empresa (`companyInfo.addressLine`) con default Monterrey

## [0.1.4] — 2026-07-14

### Corregido
- Remanente repartido en varias partidas profesionales (sin palabras “ajuste/diferencia/cuadre”)
- Tope 25% por servicio (35% MO especializada justificada)
- Conceptos PDF/UI profesionales para techo (aplicación, refuerzo con malla, preparación, etc.)

## [0.1.3] — 2026-07-14


### Corregido
- Autopoblado profesional: sistemas coherentes (techo acrílico/prefabricado/cementoso/asfáltico)
- Cantidades realistas acotadas; presupuesto alto va a MO/ajustes, no a cubetas absurdas
- Distribución desigual de importes + orden profesional de partidas
- Campo opcional área m² (estimación interna si se omite)

## [0.1.2] — 2026-07-14


### Corregido
- Deploy Vercel: proyecto es Vite (no Next.js); se agrega `vercel.json` con framework vite y rewrite SPA

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
