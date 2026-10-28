import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { autenticarOperador, demoPublicaSegura, emitirSesion, tieneSesion, validarCodigoOperador } from "./precalix-auth.js";
import handler from "./precalix-acceso.js";

const codigo="operador_"+ "a".repeat(40);
const cfg={REMISION_PRECALIX_PILOT_TOKEN_SHA256:createHash("sha256").update(codigo).digest("hex")};
function respuesta(){return {statusCode:200,headers:{},data:null,setHeader(k,v){this.headers[k]=v;return this;},status(v){this.statusCode=v;return this;},json(v){this.data=v;return this;}};}

describe("Acceso simple: la clave nunca forma parte del formulario NSS",()=>{
  it("código privado valido y cookie firmada caduca; no puede falsificarse",()=>{
    assert.equal(validarCodigoOperador(codigo,cfg),true);
    assert.equal(validarCodigoOperador("x".repeat(60),cfg),false);
    const emitida=emitirSesion(cfg,Date.UTC(2026,9,28));
    assert.match(emitida,/HttpOnly; Secure; SameSite=Strict/);
    const cookie=emitida.split(";")[0];
    assert.equal(tieneSesion({headers:{cookie}},cfg,Date.UTC(2026,9,28)+5000),true);
    assert.equal(tieneSesion({headers:{cookie}},cfg,Date.UTC(2026,9,29)),false);
    const adulterada=cookie.slice(0,-1)+(cookie.endsWith("a")?"b":"a");
    assert.equal(tieneSesion({headers:{cookie:adulterada}},cfg,Date.UTC(2026,9,28)+5000),false);
    assert.equal(autenticarOperador({headers:{cookie}},cfg,Date.UTC(2026,9,28)+5000),false); // usa hora actual
  });
  it("la demo solo omite acceso en previews y nunca en modo real",()=>{
    const flags={VERCEL_ENV:"preview",REMISION_PRECALIX_SANDBOX_OPEN_DEMO:"true"};
    assert.equal(demoPublicaSegura(flags,"sandbox"),true);
    assert.equal(demoPublicaSegura(flags,"pilot_real"),false);
    assert.equal(demoPublicaSegura({...flags,VERCEL_ENV:"production"},"sandbox"),false);
    assert.equal(demoPublicaSegura({VERCEL_ENV:"preview"},"sandbox"),false);
  });
  it("rechaza inicio de sesión sin origen y contraseñas equivocadas",async()=>{
    const out=respuesta();
    await handler({method:"POST",headers:{"content-type":"application/json"},body:{codigo}},out);
    assert.equal(out.statusCode,403);
    const r=respuesta();
    await handler({method:"POST",headers:{"content-type":"application/json",origin:"https://remision.vercel.app",host:"remision.vercel.app","sec-fetch-site":"same-origin"},body:{codigo:"incorrecto"}},r);
    assert.equal(r.statusCode,401);
  });
});
