import { emitirSesion, validarCodigoOperador, COOKIE_PRECALIX } from "./precalix-auth.js";

function origenPermitido(req) {
  const origin=req.headers?.origin,host=req.headers?.host;
  if(typeof origin!=="string" || typeof host!=="string")return false;
  try {
    const url=new URL(origin);
    return url.protocol==="https:" && url.host===host &&
      (req.headers["sec-fetch-site"]==="same-origin" ||
       req.headers["sec-fetch-site"]===undefined);
  }catch{return false;}
}

export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="POST" && req.method!=="DELETE")
    return res.status(405).json({error:{codigo:"METODO_NO_PERMITIDO"}});
  if(!origenPermitido(req))return res.status(403).json({error:{codigo:"ORIGEN_NO_PERMITIDO"}});
  if(req.method==="DELETE") {
    res.setHeader("Set-Cookie",COOKIE_PRECALIX+"=; Path=/api/precalix; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
    return res.status(200).json({ok:true});
  }
  if(!String(req.headers["content-type"]||"").startsWith("application/json"))
    return res.status(415).json({error:{codigo:"SOLO_JSON"}});
  const payload=typeof req.body==="string"
    ?(()=>{try{return JSON.parse(req.body);}catch{return null;}})():req.body;
  if(!payload || typeof payload.codigo!=="string" || !validarCodigoOperador(payload.codigo))
    return res.status(401).json({error:{codigo:"CODIGO_INCORRECTO"}});
  res.setHeader("Set-Cookie",emitirSesion());
  return res.status(200).json({ok:true});
}
