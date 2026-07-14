# Devlog

## 2026-07-14 — Ajuste layout PDF

### Decisión
Solo constantes de layout en `generateRemisionPDF.ts` (márgenes 9 mm, filas ~6.35 mm, bordes 0.45, columnas con concepto 72 mm, bloque REMISION/FECHA alineado a RFC, totales a la derecha, firma en recuadro). Sin tocar regla ×1.20, generador, catálogo, SAT, historial ni validaciones.

## 2026-07-14 — Remisión profesional (PDF + SAT + catálogo)

### Objetivo
Acercar el PDF al formato de nota preimpresa/Excel y enriquecer catálogo con códigos SAT y fuentes de precio, sin tocar la regla `total_remision = monto_aprobado * 1.20` ni conectarse a Supabase.

### Decisiones
- PDF dibujado celda a celda (jsPDF): verdes `#2E7D32`, bordes negros, ≥10 filas visuales, multipágina si hay >10 conceptos.
- En PDF solo SUBTOTAL / IVA / TOTAL (nunca monto aprobado ni +20%).
- Catálogo 182 ítems; precios con `fuente_directa` | `estimado` | `manual`; SAT `exacto` | `generico` | `pendiente_verificar`.
- Códigos SAT referenciales para control interno; la remisión no sustituye CFDI.
- Validación bloquea PDF sin SAT, fecha, cliente completo o cuadre de partidas.

## 2026-07-14 — Realismo de partidas de cierre

### Problema
La partida de cierre absorbía demasiado y a veces se nombraba con lenguaje de “ajuste”.

### Decisión
- Pool de balance profesional (MO especializada, preparación, varias capas, refuerzo, flete, etc.).
- Si remanente > 15% del total, se reparte en ≥3 partidas.
- Cap 25% servicios / 35% MO especializada; sanitización de palabras prohibidas.

## 2026-07-14 — Autopoblado profesional

### Problema
El algoritmo repartía presupuesto en importes casi iguales y escalaba cantidades de materiales hasta valores absurdos (23–78 cubetas, blocks/varillas en techo).

### Decisión
- Recetas por **sistema** (un impermeabilizante principal, no todos a la vez).
- Cantidades hard por m² con topes; sobrante solo en partidas soft: MO, preparación, flete, material complementario.
- `area_m2` opcional en formulario; si falta, `estimateAreaM2()` acotada.

## 2026-07-14 — Deploy Vercel (Vite)

### Problema
Vercel fallaba con “No Next.js version detected” porque el preset del proyecto era Next.js.

### Decisión
- Agregar `vercel.json` con `"framework": "vite"`, `buildCommand` y `outputDirectory: dist`.
- Rewrite SPA a `index.html` para React Router (excepto `/assets`).

## 2026-07-14 — Revisión quirúrgica B0.1


### Bugs encontrados y corregidos
1. **Folio leak**: `buildRemision()` llamaba `createFolio()` en cada PDF/guardar sin fijar identidad → folios quemados y desalineados.
2. **Fallback catálogo completo**: si el filtro por tipo dejaba vacío un bucket, usaba todo el catálogo → contaminación baño/cocina.
3. **Servicios mal clasificados**: `CATEGORIAS_MANO_OBRA` incluía `Servicios`, dejando el bucket auxiliar vacío de ítems tipo Servicios.
4. **Sin priorización**: shuffle puro no garantizaba conceptos clave por tipología.
5. **Ajuste de redondeo frágil**: no garantizaba partida ajustable; ahora fuerza una y cierra al centavo.
6. **PDF overflow**: totales/firma podían caer fuera de página; ahora hace `addPage` si falta espacio.
7. **Edición manual rompía cuadre**: PDF/guardar ahora validan `suma == total_remision`.

### Decisiones
- Identidad (`id`+`folio`) vía `useRef` sticky hasta Limpiar.
- Exclusiones por **nombre** (más precisas) + prioridad por keywords.
- No Supabase / no login en esta pasada.

## 2026-07-14 — B0 Remision MVP

### Decisiones
- **Stack Vite + React**: MVP rápido sin backend; fácil despliegue estático.
- **localStorage + Repository interface**: Permite migrar a Supabase sin reescribir UI.
- **total_remision como base de partidas**: La tabla siempre cuadra con monto_aprobado × 1.20.
- **IVA incluido default**: subtotal = total / 1.16; switch sin IVA suma 16% arriba.
- **Ajuste en última partida**: Mano de obra / servicio / material complementario absorbe diferencias de redondeo.
- **Catálogo en TS editable**: Preparado para admin futuro; precios con min/max/sugerido y fuente.
