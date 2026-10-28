/**
 * Vercel Function (Node.js), proxy para Precalix B2B.
 * NO llega una clave pcx_ al navegador y NO toca el módulo de Remisiones.
 *
 * Modo predeterminado: sandbox con NSS ficticio. El modo real requiere
 * habilitación explícita Y validación de cobro en Precalix: cerrado por defecto.
 */
import { autenticarOperador, demoPublicaSegura } from "./precalix-auth.js";

const NSS_DEMO = "00000000000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVIDENCIA = /^[A-Za-z0-9_-]{6,80}$/;
const RFC_TEST = "https://www.precalix.app";

export function obtenerModo(config = process.env) {
  if (config.REMISION_PRECALIX_MODE === "pilot_real") {
    return config.REMISION_PRECALIX_REAL_PILOT_ENABLED === "true" ? "pilot_real" : "pilot_blocked";
  }
  const pagado = config.REMISION_PRECALIX_MODE === "paid";
  if (pagado && config.REMISION_PRECALIX_BILLING_READY !== "true") return "blocked";
  return pagado ? "paid" : "sandbox";
}

export function validarPeticionDeCrear(body, modo) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "CUERPO_INVALIDO";
  if (typeof body.nss !== "string" || !/^[0-9]{11}$/.test(body.nss)) return "NSS_INVALIDO";
  if (modo === "sandbox" && body.nss !== NSS_DEMO) return "SOLO_NSS_FICTICIO";
  if (typeof body.idempotency_key !== "string" || !UUID.test(body.idempotency_key)) return "ID_INVALIDO";
  if (body.consentimiento !== true) return "SIN_CONSENTIMIENTO";
  if (modo === "paid" || modo === "pilot_real") {
    // La pulsación del botón es una declaración del operador AUTENTICADO,
    // no sustituye obtener la autorización del titular.
    const legacy = EVIDENCIA.test(body.evidencia_consentimiento || "") &&
      !body.evidencia_consentimiento.startsWith("consent_demo");
    if (!legacy && body.autorizacion_confirmada !== true) return "EVIDENCIA_REAL_REQUERIDA";
  }
  if (modo === "sandbox" && !EVIDENCIA.test(body.evidencia_consentimiento || "")) return "EVIDENCIA_INVALIDA";
  return null;
}

function resolverProveedor(config, modo) {
  const baseUrl = config.PRECALIX_B2B_BASE_URL || RFC_TEST;
  let u;
  try { u = new URL(baseUrl); } catch { return null; }
  // Solamente el dominio oficial o despliegues propios de Precalix en Vercel.
  if (u.protocol !== "https:" || u.username || u.password || u.port || u.pathname !== "/" ||
    u.search || u.hash || !(u.hostname === "precalix.app" || u.hostname === "www.precalix.app" ||
      /^precalix-[a-z0-9-]+\.vercel\.app$/.test(u.hostname))) return null;
  const real = modo === "paid" || modo === "pilot_real";
  const apiKey = real ? config.PRECALIX_B2B_API_KEY : config.PRECALIX_B2B_SANDBOX_KEY;
  if (typeof apiKey !== "string" ||
    !(real ? /^pcx_b2b_[A-Za-z0-9_-]{43}$/ : /^pcx_test_[A-Za-z0-9_-]{43}$/).test(apiKey)) return null;
  return { baseUrl:u.origin, apiKey, prefix:real ? "/api/v1/" : "/api/v1/sandbox/" };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const modo = obtenerModo();
  if (req.method === "GET" && req.query?.status === "1") {
    return res.status(200).json({
      modo: modo === "paid" ? "cobro_por_uso" : modo === "pilot_real" ? "prueba_real" : "pruebas",
      disponible: modo !== "blocked" && modo !== "pilot_blocked",
      autorizado: demoPublicaSegura(process.env,modo) || autenticarOperador(req,process.env),
      requiere_acceso: !demoPublicaSegura(process.env,modo) && !autenticarOperador(req,process.env),
      precio_centavos: modo === "paid" ? 400 : 0,
      moneda: "MXN",
      nota: modo === "paid" ? "MXN 4 por consulta facturable, sin mensualidad" : modo === "pilot_real" ? "Consulta real con autorización del titular. El piloto no genera cargos al socio." : modo === "pilot_blocked" ? "Piloto real desactivado por seguridad." : "Datos simulados, sin consultas ni cargos",
    });
  }
  if (modo === "blocked") return res.status(503).json({ error: { codigo:"COBROS_NO_CERTIFICADOS" } });
  if (modo === "pilot_blocked") return res.status(503).json({ error: { codigo:"PILOTO_REAL_NO_HABILITADO" } });
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: { codigo:"METODO_NO_PERMITIDO" } });
  }
  if (!demoPublicaSegura(process.env,modo) && !autenticarOperador(req,process.env))
    return res.status(401).json({ error: {codigo:"ACCESO_PILOTO_INVALIDO"} });
  const dest = resolverProveedor(process.env, modo);
  if (!dest) return res.status(503).json({ error: { codigo:"PROVEEDOR_NO_CONFIGURADO" } });
  let path = "precalificaciones";
  let content;
  if (req.method === "GET") {
    const id = req.query?.id;
    if (typeof id !== "string" || !UUID.test(id)) return res.status(400).json({ error:{codigo:"ID_INVALIDO"} });
    path += "/" + id;
  } else {
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) {
      return res.status(415).json({error:{codigo:"SOLO_JSON"}});
    }
    const data = typeof req.body === "string" ? (() => { try{return JSON.parse(req.body);}catch{return null;} })() : req.body;
    const invalid = validarPeticionDeCrear(data,modo);
    if (invalid) return res.status(422).json({error:{codigo:invalid}});
    const evidencia = (modo === "paid" || modo === "pilot_real") &&
      data.autorizacion_confirmada === true
      ? "declaracion_"+data.idempotency_key.replaceAll("-","")
      : data.evidencia_consentimiento;
    content = JSON.stringify({
      nss: data.nss, producto: "mejora", idempotency_key: data.idempotency_key,
      consentimiento: true, evidencia_consentimiento:evidencia,
    });
    if (Buffer.byteLength(content) > 2048) return res.status(413).json({error:{codigo:"CUERPO_EXCESIVO"}});
  }
  const headers = {
    Authorization: "Bearer " + dest.apiKey,
    Accept: "application/json",
    ...(content ? {"Content-Type":"application/json"}:{}),
  };
  // En previews protegidos Vercel requiere bypass emitido por el propietario.
  // No forma parte de las credenciales de Precalix ni se entrega al navegador.
  const bypass = process.env.PRECALIX_VERCEL_PROTECTION_BYPASS;
  if (bypass) headers["x-vercel-protection-bypass"] = bypass;
  try {
    // Doble seguro financiero: cambiar una variable en Remision NO habilita
    // consultas pagadas si el PROVEEDOR no certifica la facturacion por uso.
    // Hoy Precalix devuelve solo la billetera, por lo que falla cerrado.
    if (modo === "pilot_real" || modo === "paid") {
      const contrato = await fetch(dest.baseUrl + "/api/v1/cuenta", {
        method: "GET", headers, signal: AbortSignal.timeout(8000),
        cache: "no-store", redirect: "manual",
      });
      const tipoContrato = contrato.headers.get("content-type") || "";
      if (contrato.status !== 200 || !tipoContrato.includes("application/json")) {
        return res.status(503).json({error:{codigo:"FACTURACION_NO_VERIFICADA"}});
      }
      const informacion = await contrato.json();
      if (modo === "pilot_real") {
        if (informacion?.cliente?.estado !== "activo" ||
            informacion.facturacion?.modalidad !== "piloto_gratis" ||
            informacion.facturacion.precio_centavos !== 0 ||
            informacion.facturacion.stripe_habilitado !== false ||
            informacion.facturacion.estado !== "pruebas_reales" ||
            !Number.isInteger(informacion?.consumo?.creditos_disponibles) ||
            informacion.consumo.creditos_disponibles < 1 ||
            informacion.consumo.consultas_restantes_mes < 1) {
          return res.status(503).json({error:{codigo:"PILOTO_NO_VERIFICADO"}});
        }
      } else if (informacion?.facturacion?.modalidad !== "por_uso" ||
          informacion.facturacion.precio_centavos !== 400 ||
          informacion.facturacion.moneda !== "MXN" ||
          informacion.facturacion.stripe_habilitado !== true ||
          informacion.facturacion.estado !== "activa") {
        return res.status(503).json({error:{codigo:"FACTURACION_NO_VERIFICADA"}});
      }
    }
    const respuesta = await fetch(dest.baseUrl + dest.prefix + path, {
      method:req.method,
      headers,
      ...(content ? {body:content}:{}),
      signal:AbortSignal.timeout(15000),
      cache:"no-store",
      redirect:"manual",
    });
    if (respuesta.status >= 300 && respuesta.status < 400) {
      return res.status(502).json({error:{codigo:"PROVEEDOR_REDIRECCION"}});
    }
    const tipo=respuesta.headers.get("content-type") || "";
    if (!tipo.includes("application/json")) {
      return res.status(502).json({error:{codigo:"PROVEEDOR_NO_JSON"}});
    }
    const texto=await respuesta.text();
    if (texto.length > 200000) return res.status(502).json({error:{codigo:"RESPUESTA_EXCESIVA"}});
    let json;
    try { json=JSON.parse(texto); } catch { return res.status(502).json({error:{codigo:"PROVEEDOR_INVALIDO"}}); }
    const retry=respuesta.headers.get("retry-after");
    if (retry && /^[0-9]{1,3}$/.test(retry)) res.setHeader("Retry-After",retry);
    return res.status(respuesta.status).json(json);
  } catch {
    return res.status(503).json({error:{codigo:"PROVEEDOR_NO_DISPONIBLE"}});
  }
}
