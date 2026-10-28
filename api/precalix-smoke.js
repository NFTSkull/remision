/**
 * Prueba E2E HTTP Precalix -> Remision únicamente en Vercel Preview.
 * Siempre datos ficticios. Sin NSS real, sin base, sin créditos y sin Stripe.
 * No despliega credenciales al navegador.
 */
import { createHash } from "node:crypto";
const UUIDS=["d5f2462d-a100-4d58-8f1d-46734479eb20",
"d5f2462d-a100-4d58-8f1d-46734479eb21",
"d5f2462d-a100-4d58-8f1d-46734479eb22",
"d5f2462d-a100-4d58-8f1d-46734479eb23",
"d5f2462d-a100-4d58-8f1d-46734479eb24"];
const estados=["exitosa","sin_criterios","no_encontrado","error","procesando"];
export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="GET")return res.status(405).json({error:"METODO_NO_PERMITIDO"});
  // Esta ruta NUNCA está disponible desde Production, incluso si se fusiona.
  if(process.env.VERCEL_ENV!=="preview"||process.env.REMISION_PRECALIX_MODE!=="sandbox"||
     process.env.REMISION_PRECALIX_BILLING_READY==="true")return res.status(404).json({error:"NO_DISPONIBLE"});
  const key=process.env.PRECALIX_B2B_SANDBOX_KEY;
  const base=process.env.PRECALIX_B2B_BASE_URL;
  if(!/^pcx_test_[A-Za-z0-9_-]{43}$/.test(key||"")||
     !/^https:\/\/(?:precalix\.app|precalix-[a-z0-9-]+\.vercel\.app)$/.test(base||""))
    return res.status(503).json({error:"FALTA_CONFIGURACION_PREVIEW"});
  const h={Authorization:"Bearer "+key,"Accept":"application/json",
    "Content-Type":"application/json"};
  if(process.env.PRECALIX_VERCEL_PROTECTION_BYPASS)
    h["x-vercel-protection-bypass"]=process.env.PRECALIX_VERCEL_PROTECTION_BYPASS;
  const send=async(method,path,body)=>{
    const r=await fetch(base+"/api/v1/sandbox/"+path,{method,headers:h,
      ...(body?{body:JSON.stringify(body)}:{}),cache:"no-store",redirect:"manual",
      signal:AbortSignal.timeout(12000)});
    const t=(r.headers.get("content-type")||"").includes("application/json");
    return {code:r.status,data:t?await r.json():null};
  };
  try {
    const account=await send("GET","cuenta");
    if(account.code!==200||account.data?.sandbox!==true)
      return res.status(503).json({ok:false,fase:"cuenta",http:account.code,modo:"sandbox",cobro:false});
    const comprobaciones=await Promise.all(UUIDS.map(async(uuid,i)=>{
      const post=await send("POST","precalificaciones",{
        nss:"00000000000",idempotency_key:uuid,producto:"mejora",consentimiento:true,
        evidencia_consentimiento:"consent_demo01"});
      const get=post.code===202?await send("GET","precalificaciones/"+uuid):{code:0,data:null};
      return {escenario:estados[i],post:post.code,get:get.code,
        correcto:post.code===202&&post.data?.sandbox===true&&
          get.code===200&&get.data?.sandbox===true&&
          get.data?.precalificacion?.estado===estados[i]};
    }));
    return res.status(comprobaciones.every(x=>x.correcto)?200:503).json({
      ok:comprobaciones.every(x=>x.correcto),modo:"sandbox",cobro:false,
      consultas_reales:0,creditos_consumidos:0,escenarios:comprobaciones,
      // Huella corta para comprobar que se usó token distinto al real; sin exponerlo.
      autentificacion:"clave_de_pruebas",
    });
  }catch{
    return res.status(503).json({ok:false,error:"PROVEEDOR_NO_DISPONIBLE",cobro:false});
  }
}
