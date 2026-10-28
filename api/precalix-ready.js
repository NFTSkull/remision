// Diagnóstico TEMPORAL para un piloto real, exclusivamente GET seguro.
// No envía NSS, ni solicita precalificaciones, ni revela claves o saldos.
export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="GET")return res.status(405).json({ok:false});
  if(process.env.VERCEL_ENV!=="preview"||
     process.env.REMISION_PRECALIX_BILLING_READY==="true"||
     !["sandbox","pilot_real"].includes(process.env.REMISION_PRECALIX_MODE||"sandbox")) {
    return res.status(404).json({ok:false});
  }
  const key=process.env.PRECALIX_B2B_API_KEY;
  if(typeof key!=="string"||!/^pcx_b2b_[A-Za-z0-9_-]{43}$/.test(key)) {
    return res.status(503).json({ok:false,motivo:"clave_no_configurada"});
  }
  try {
    const r=await fetch("https://www.precalix.app/api/v1/cuenta",{
      method:"GET",headers:{Authorization:"Bearer "+key,Accept:"application/json"},
      cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(12000)});
    if(r.status!==200||!(r.headers.get("content-type")||"").includes("application/json"))
      return res.status(503).json({ok:false,motivo:"cuenta_no_disponible",codigo_http:r.status});
    const d=await r.json();
    const ok=d?.cliente?.estado==="activo" &&
      d?.facturacion?.modalidad==="piloto_gratis" &&
      d?.facturacion?.precio_centavos===0 &&
      d?.facturacion?.stripe_habilitado===false &&
      d?.facturacion?.estado==="pruebas_reales" &&
      d?.consumo?.creditos_disponibles>0 &&
      d?.consumo?.consultas_restantes_mes>0;
    return res.status(ok?200:503).json({
      ok,modo:"piloto_real_gratis",
      consulta_real_efectuada:false,
      cobro_cliente:false,
      cuenta_habilitada:ok,
    });
  } catch {
    return res.status(503).json({ok:false,motivo:"red_no_disponible"});
  }
}