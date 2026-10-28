import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_PRECALIX = "remision_precalix_sesion";
const VIGENCIA_SEG = 8 * 60 * 60;

function secreto(config) {
  const hash = config.REMISION_PRECALIX_PILOT_TOKEN_SHA256;
  return typeof hash === "string" && /^[a-f0-9]{64}$/.test(hash) ? Buffer.from(hash,"hex") : null;
}
function coinciden(uno, dos) {
  return uno.length === dos.length && timingSafeEqual(uno,dos);
}
export function validarCodigoOperador(codigo, config = process.env) {
  const secret=secreto(config);
  return Boolean(secret && typeof codigo === "string" && codigo.length >= 32
    && codigo.length <= 200 && coinciden(createHash("sha256").update(codigo).digest(),secret));
}
function firmar(expires, secret) {
  return createHmac("sha256", secret).update("precalix:v1:"+expires).digest("hex");
}
export function emitirSesion(config=process.env, now=Date.now()) {
  const secret=secreto(config);
  if(!secret) throw Error("SESION_NO_CONFIGURADA");
  const expires=Math.floor(now/1000)+VIGENCIA_SEG;
  const value="v1."+expires+"."+firmar(expires,secret);
  return COOKIE_PRECALIX+"="+value+"; Path=/api/precalix; HttpOnly; Secure; SameSite=Strict; Max-Age="+VIGENCIA_SEG;
}
export function tieneSesion(req, config=process.env, now=Date.now()) {
  const secret=secreto(config);
  if(!secret) return false;
  const cookie=typeof req.headers?.cookie==="string"?req.headers.cookie:"";
  const token=cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE_PRECALIX+"="))?.slice(COOKIE_PRECALIX.length+1);
  const match=/^v1\.(\d{10})\.([0-9a-f]{64})$/.exec(token??"");
  if(!match) return false;
  const expires=Number(match[1]), seconds=Math.floor(now/1000);
  if(expires<=seconds || expires>seconds+VIGENCIA_SEG+60)return false;
  return coinciden(Buffer.from(match[2],"hex"),Buffer.from(firmar(expires,secret),"hex"));
}
export function autenticarOperador(req,config=process.env) {
  // Se conserva el token heredado para las pruebas automatizadas y la API
  // de integración. El usuario del formulario usa una cookie HttpOnly.
  return validarCodigoOperador(req.headers?.["x-pilot-token"],config) || tieneSesion(req,config);
}
export function demoPublicaSegura(config=process.env,modo="sandbox") {
  return modo==="sandbox" && config.VERCEL_ENV==="preview" &&
    config.REMISION_PRECALIX_SANDBOX_OPEN_DEMO==="true";
}
