# Devlog

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
