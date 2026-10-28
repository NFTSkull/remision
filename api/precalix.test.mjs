import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import handler, { obtenerModo, validarPeticionDeCrear } from './precalix.js';

const clave = 'pcx_test_'+'a'.repeat(43);
const acceso = 'piloto_'+'b'.repeat(45);
const uuid = 'd5f2462d-a100-4d58-8f1d-46734479eb20';
const env = {...process.env};
const fetchPrevio=globalThis.fetch;

function mockRes(){
  const res = {
    headers:{},statusCode:200,data:null,
    setHeader(k,v){this.headers[k]=v;return this;},
    status(code){this.statusCode=code;return this;},
    json(data){this.data=data;return this;},
  };
  return res;
}
const req=(method,body,query={},headers={})=>({
  method,body,query,headers:{'content-type':'application/json','x-pilot-token':acceso,...headers},
});
before(()=>{
  process.env.REMISION_PRECALIX_PILOT_TOKEN_SHA256=createHash('sha256').update(acceso).digest('hex');
  process.env.PRECALIX_B2B_SANDBOX_KEY=clave;
  process.env.PRECALIX_B2B_BASE_URL='https://precalix.app';
  delete process.env.REMISION_PRECALIX_MODE;
  delete process.env.REMISION_PRECALIX_BILLING_READY;
});
after(()=>{
  process.env=env;
  globalThis.fetch=fetchPrevio;
});
describe('Proxy de Remision: demo sin cargos ni credenciales en navegador',()=>{
  it('el modo por defecto siempre es sandbox y cobro sin certificar se bloquea',()=>{
    assert.equal(obtenerModo({}), 'sandbox');
    assert.equal(obtenerModo({REMISION_PRECALIX_MODE:'paid'}),'blocked');
    assert.equal(obtenerModo({REMISION_PRECALIX_MODE:'paid',REMISION_PRECALIX_BILLING_READY:'true'}),'paid');
  });
  it('rechaza NSS reales o solicitudes sin consentimiento en sandbox',()=>{
    assert.equal(validarPeticionDeCrear({nss:'12345678901',idempotency_key:uuid,consentimiento:true,evidencia_consentimiento:'consent_demo01'},'sandbox'),'SOLO_NSS_FICTICIO');
    assert.equal(validarPeticionDeCrear({nss:'00000000000',idempotency_key:uuid,consentimiento:false,evidencia_consentimiento:'consent_demo01'},'sandbox'),'SIN_CONSENTIMIENTO');
  });
  it('sin token privado devuelve 401 sin contactar proveedor',async()=>{
    let llamadas=0;globalThis.fetch=async()=>{llamadas++;throw Error('No');};
    const res=mockRes();await handler(req('POST',{}, {},{'x-pilot-token':'mal'}),res);
    assert.equal(res.statusCode,401);
    assert.equal(llamadas,0);
  });
  it('envia en sandbox POST y GET por HTTPS sin filtrar la clave al frontend',async()=>{
    const llamadas=[];
    globalThis.fetch=async(url,opts)=>{
      llamadas.push({url,opts});
      return Response.json({sandbox:true,precalificacion:{id:uuid,estado:'pendiente',en_proceso:false}},{status:opts.method==='POST'?202:200});
    };
    const body={nss:'00000000000',idempotency_key:uuid,consentimiento:true,evidencia_consentimiento:'consent_demo01'};
    const a=mockRes();await handler(req('POST',body),a);
    assert.equal(a.statusCode,202); assert.equal(a.data.sandbox,true);
    const b=mockRes();await handler(req('GET',null,{id:uuid}),b);
    assert.equal(b.statusCode,200);
    assert.equal(llamadas.length,2);
    assert.equal(llamadas[0].url,'https://precalix.app/api/v1/sandbox/precalificaciones');
    assert.equal(llamadas[1].url,'https://precalix.app/api/v1/sandbox/precalificaciones/'+uuid);
    assert.equal(llamadas[0].opts.headers.Authorization,'Bearer '+clave);
    assert.ok(!JSON.stringify(a.data).includes(clave));
  });
  it('impide modo real sin facturación certificada',async()=>{
    process.env.REMISION_PRECALIX_MODE='paid';
    let llamadas=0;globalThis.fetch=async()=>{llamadas++;throw Error('No');};
    const a=mockRes();await handler(req('POST',{nss:'12345678901'}),a);
    assert.equal(a.statusCode,503);assert.equal(a.data.error.codigo,'COBROS_NO_CERTIFICADOS');
    assert.equal(llamadas,0);
    delete process.env.REMISION_PRECALIX_MODE;
  });
  it('solo permite el proveedor oficial o un preview de Precalix',async()=>{
    process.env.PRECALIX_B2B_BASE_URL='https://ejemplo-malicioso.com';
    let llamadas=0;globalThis.fetch=async()=>{llamadas++;throw Error('No');};
    const a=mockRes();await handler(req('GET',null,{id:uuid}),a);
    assert.equal(a.statusCode,503); assert.equal(llamadas,0);
    process.env.PRECALIX_B2B_BASE_URL='https://precalix.app';
  });
});
