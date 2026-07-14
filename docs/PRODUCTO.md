# Remision — Producto

Sistema web para generar notas de remisión de remodelación de vivienda.

## Objetivo
Capturar datos del cliente y monto aprobado, calcular automáticamente el total de remisión (+20%), generar partidas coherentes y descargar PDF profesional.

## Regla de negocio principal
`total_remision = monto_aprobado × 1.20`

El usuario no captura el total final; el sistema lo calcula.

## MVP (B0)
- Formulario completo de nueva remisión
- Generación automática de conceptos por tipo de remodelación
- PDF carta con diseño formal
- Historial en localStorage
- Catálogo inicial de 120+ materiales referenciales MX
