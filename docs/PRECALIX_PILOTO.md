# Piloto Precalix B2B en Remision

Este trabajo **NO altera las notas de remisión**. Agrega una sección "Precalix API" y
un proxy de servidor en Vercel que mantiene las claves privadas lejos del navegador.

## Modos

1. **Sandbox gratuito (predeterminado):** solo NSS \`00000000000\`, cinco
   resultados sintéticos según el escenario elegido. No consulta portal,
   no crea jobs, no consume créditos y no cobra.
2. **Pago por uso (bloqueado):** futura integración B2B de Precalix.
   Tarifa de negocio acordada: **$4 MXN por precalificación facturable,
   IVA incluido**; sin mensualidad ni cupo comercial mensual. Los
   límites técnicos de velocidad y capacidad siguen aplicando.

**Importante:** el cobro real NO está certificado ni habilitado. La
implementación actual de Precalix descuenta créditos de una billetera; no
tiene todavía Stripe B2B de facturación por consumo sin saldo prepago. Nunca
se debe poner REMISION_PRECALIX_BILLING_READY=true hasta implementar,
probar y aprobar ese módulo, verificar facturación y permiso del titular.

## Configuración privada en Vercel → Remision → Preview branch

Todos estos valores se guardan en el servidor, jamás como variables VITE_*.

| Variable | Valor durante pruebas |
| --- | --- |
| \`REMISION_PRECALIX_MODE\` | \`sandbox\` |
| \`REMISION_PRECALIX_PILOT_TOKEN_SHA256\` | SHA-256 de un código privado que se entrega al operador |
| \`PRECALIX_B2B_SANDBOX_KEY\` | Clave \`pcx_test_...\` creada por el dueño de Precalix |
| \`PRECALIX_B2B_BASE_URL\` | URL exacta del Preview de Precalix o su dominio oficial |
| \`PRECALIX_VERCEL_PROTECTION_BYPASS\` | Opcional, secreto de bypass generado en el equipo de Vercel para Preview protegido |
| \`REMISION_PRECALIX_BILLING_READY\` | Ausente o \`false\`; NO habilitar |
| \`PRECALIX_B2B_API_KEY\` | Ausente hasta tener empresa real y facturación validada |

Para generar código de acceso operador sin reutilizar la API key:

    node -e "const c=require('node:crypto');const s='remision_'+c.randomBytes(32).toString('base64url');console.log('Operador:',s);console.log('SHA256 en Vercel:',c.createHash('sha256').update(s).digest('hex'))"

Se comparte el código operador PRIVADO por canal seguro, **solo su SHA-256 va en Vercel**.
Los usuarios del navegador no reciben la clave pcx_test_ ni la clave de pago.

### Cómo probar

1. Abrir /precalix en preview de Remision.
2. Introducir código del operador y marcar prueba ficticia.
3. Elegir escenario (exitosa, sin criterios, no encontrado, error técnico o procesando).
4. Hacer clic en "Probar sin costo" y revisar los campos y montos simulados.
5. Al apagar API_B2B_SANDBOX_HABILITADA en el preview de Precalix y
   redesplegar, las pruebas dejan de funcionar: esto verifica el apagado remoto.

Los tests automáticos con respuestas simuladas se ejecutan con:

    node --test api/precalix.test.mjs

Esta prueba no llama a sitios externos. La validación remota de punta a punta
requiere configurar credenciales **solo en Preview** y resolver la protección
de acceso del deploy de Precalix; el CI y un Preview READY por sí solos no la sustituyen.

## Activación del modo real (NO ejecutar todavía)

Para cobrar $4 por precalificación, además de la integración HTTP se requiere:

- Crear la empresa en Precalix, emitir clave real y validar contrato/consentimiento.
- Establecer cobro por uso en el servidor de Precalix, con ledger inmutable,
  idempotencia (un NSS/reintento no doble cargo), sin cargo si hubo reembolso
  técnico, envío conciliado a Stripe y bloqueo por falta de método de pago.
- Mantener separado el sandbox del contrato real. El cambio a modo real debe ser
  una acción explícita del administrador, tras pruebas y avisos.
- Registrar eventos y conciliarlos con webhooks de Stripe, con alertas y control de impago.
- Confirmar con el titular precios e impuestos. No prometer volumen físico sin
  control: el portal impone límites, concurrencia y disponibilidad.

Para impedir cobros inesperados, el proxy está cerrado por defecto para modo
real y el cambio de configuración no debe realizarse hasta validar el motor.

## Seguridad y limitaciones

- Remision carece actualmente de cuentas/login: el **código de operador** limita
  quién puede llamar el proxy, pero NO equivale a un sistema multiusuario B2B.
- No poner NSS, API key ni código privado en logs, GitHub, URLs o variables VITE_.
- Antes de vender uso real, reemplazar el código compartido por autenticación
  de usuarios, permisos por empresa y auditoría.
- API real tiene límites técnicos: ilimitado = sin cuota comercial de consultas,
  NO concurrencia infinita, ni tiempo de respuesta garantizado.
