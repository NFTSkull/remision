# Arquitectura — Remision

## Stack
- Vite + React 19 + TypeScript
- React Router
- jsPDF + jspdf-autotable (PDF)
- localStorage (MVP)

## Estructura
```
src/modules/remision/
├── components/     # UI por sección
├── constants/      # Tipos remodelación, tags
├── data/           # Catálogo materiales
├── hooks/          # useRemisionForm
├── lib/            # Helpers y algoritmos
├── pages/          # Pantallas
├── pdf/            # Generación PDF
├── types/          # Modelos TS
└── __tests__/      # Pruebas Vitest
```

## Migración futura Supabase
- `remisionStorage.ts` expone `RemisionRepository`
- Reemplazar `localRemisionRepository` por implementación Supabase
- Tablas: `remisiones`, `remision_items`, `catalogo_materiales`
