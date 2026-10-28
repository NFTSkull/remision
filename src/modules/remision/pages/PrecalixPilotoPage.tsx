import { useEffect, useState } from 'react';

type Config = { modo:string; disponible:boolean; nota:string };
type Api = { precalificacion?: { id:string; folio?:string; estado?:string; estado_integracion?:string;
  nss_mascarado?:string; en_proceso?:boolean; resultado?:Record<string,unknown>|null; motivo?:string|null };
  error?:{codigo:string}; sandbox?:boolean };
const UUIDS = [
  'd5f2462d-a100-4d58-8f1d-46734479eb20',
  'd5f2462d-a100-4d58-8f1d-46734479eb21',
  'd5f2462d-a100-4d58-8f1d-46734479eb22',
  'd5f2462d-a100-4d58-8f1d-46734479eb23',
  'd5f2462d-a100-4d58-8f1d-46734479eb24',
];
const ETIQUETAS = ['Completada','Sin criterios','No encontrada','Error técnico','En proceso'];
const textoError = (r:Api) => {
  const codigo=r.error?.codigo;
  const conocidos:Record<string,string>={
    ACCESO_PILOTO_INVALIDO:'El código de acceso al piloto es incorrecto.',
    SANDBOX_NO_HABILITADO:'El sandbox de Precalix está desactivado.',
    PROVEEDOR_NO_CONFIGURADO:'Falta la clave privada de Precalix en el servidor.',
    PROVEEDOR_NO_JSON:'La vista previa necesita autorización de Vercel.',
    PROVEEDOR_NO_DISPONIBLE:'Precalix no respondió. Intenta de nuevo.',
    COBROS_NO_CERTIFICADOS:'Las consultas de pago siguen bloqueadas.',
    PILOTO_REAL_NO_HABILITADO:'El piloto real todavía está apagado.',
    PILOTO_NO_VERIFICADO:'Precalix no ha certificado una cuenta de pruebas reales con créditos disponibles.',
    FACTURACION_NO_VERIFICADA:'No se pueden realizar consultas pagadas sin facturación certificada.',
    SOLO_NSS_FICTICIO:'Solo puedes usar el NSS ficticio 00000000000.',
  };
  return conocidos[codigo??''] ?? ('Servicio no disponible: '+(codigo??'respuesta inválida'));
};
const pesos=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n);

export function PrecalixPilotoPage(){
  const [config,setConfig]=useState<Config|null>(null);
  const [token,setToken]=useState('');
  const [nss,setNss]=useState('00000000000');
  const [caso,setCaso]=useState(0);
  const [evidencia,setEvidencia]=useState('');
  const [consentimiento,setConsentimiento]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [id,setId]=useState<string|null>(null);
  const [respuesta,setRespuesta]=useState<Api|null>(null);
  const [detalle,setDetalle]=useState<Api|null>(null);
  const real=config?.modo==='cobro_por_uso'||config?.modo==='prueba_real';
  const pilotoReal=config?.modo==='prueba_real';
  const pago=config?.modo==='cobro_por_uso';
  useEffect(()=>{
    fetch('/api/precalix?status=1',{cache:'no-store'})
      .then(r=>r.json()).then((c:Config)=>{setConfig(c);if(c.modo==='prueba_real'||c.modo==='cobro_por_uso')setNss('');}).catch(()=>setError('No se pudo cargar la conexión.'));
  },[]);
  const api=async(method:'GET'|'POST',uuid:string,body?:object):Promise<Api>=>{
    const r=await fetch('/api/precalix'+(method==='GET'?('?id='+encodeURIComponent(uuid)):''),{
      method,cache:'no-store',
      headers:{'x-pilot-token':token,...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),
    });
    const data=await r.json() as Api;
    if(!r.ok)throw Error(textoError(data));
    return data;
  };
  const cargar=async(uuid:string)=>{
    const r=await api('GET',uuid);
    setDetalle(r);
  };
  useEffect(()=>{
    if(!id || !detalle?.precalificacion?.en_proceso)return;
    const timer=setInterval(()=>{void cargar(id).catch(()=>setError('Error al actualizar el resultado.'));},6500);
    return()=>clearInterval(timer);
  },[id,detalle?.precalificacion?.en_proceso,token]);
  const [ultimoIntento,setUltimoIntento]=useState<{firma:string;uuid:string}|null>(null);
  const comenzar=async()=>{
    setError('');
    if(!config?.disponible){setError('La conexión sigue deshabilitada.');return;}
    if(token.length<32){setError('Introduce el código privado de acceso al piloto.');return;}
    if(!consentimiento){setError('Confirma primero el consentimiento.');return;}
    if(!/^[0-9]{11}$/.test(nss)||(!real&&nss!=='00000000000')){
      setError('Introduce un NSS válido. En pruebas solo se permite 00000000000.');return;
    }
    if(real&&!/^[A-Za-z0-9_-]{6,80}$/.test(evidencia)){
      setError('Falta la referencia de consentimiento real.');return;
    }
    setBusy(true);setRespuesta(null);setDetalle(null);
    // Reintentos del MISMO NSS/consentimiento conservan UUID, incluso si falla la red.
    const firma=real?nss+':'+evidencia+':'+config?.modo:'demo:'+caso;
    const uuid=ultimoIntento?.firma===firma?ultimoIntento.uuid:real?crypto.randomUUID():UUIDS[caso];
    setUltimoIntento({firma,uuid});
    setId(uuid);
    try{
      const r=await api('POST',uuid,{
        nss,idempotency_key:uuid,consentimiento:true,producto:'mejora',
        evidencia_consentimiento:real?evidencia:'consent_demo01',
      });
      setRespuesta(r);
      if(r.precalificacion?.id)await cargar(r.precalificacion.id);
    }catch(e){setError(e instanceof Error?e.message:'No se pudo solicitar la consulta.');}
    finally{setBusy(false);}
  };
  const resultado=detalle?.precalificacion;
  const campos=resultado?.resultado?Object.entries(resultado.resultado):[];
  return <div className="pilot-page">
    <header className="page-header">
      <h1>Precalificar con Precalix</h1>
      <p className="subtitle">Integración B2B de demostración dentro de Remisión.</p>
    </header>
    <section className="pilot-hero">
      <div><small>ESTADO DE INTEGRACIÓN</small>
        <h2>{!config?'Comprobando conexión…':pago?'Consultas reales · $4 por uso':pilotoReal?'Piloto real gratuito':'Pruebas ficticias · Sandbox'}</h2>
        <p>{config?.nota??'Verificando el estado del servidor.'}</p></div>
      <span className="pilot-state">{pago?'$4 por consulta':'Sin cargos para el socio'}</span>
    </section>
    <section className="form-section">
      <h2>Solicitar precalificación</h2>
      <p className="pilot-description">El código es exclusivo de esta integración. La clave API real permanece privada en el servidor y nunca aparece aquí.</p>
      <div className="form-grid">
        <label>Código del piloto<input type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Código privado del integrador"/></label>
        <label>NSS {real?'autorizado':'ficticio'}<input value={nss} disabled={!real} maxLength={11} inputMode="numeric"
          onChange={e=>setNss(e.target.value.replace(/\D/g,''))}/></label>
      </div>
      {!real&&<div className="pilot-cases" role="group" aria-label="Resultados de prueba">
        {ETIQUETAS.map((x,i)=><button type="button" key={x} className={i===caso?'active':''} aria-pressed={i===caso}
          onClick={()=>{setCaso(i);setId(null);setDetalle(null);setRespuesta(null);setConsentimiento(false);}}>{x}</button>)}
      </div>}
      {real&&<label className="pilot-evidence">Referencia de consentimiento
        <input value={evidencia} maxLength={80} onChange={e=>setEvidencia(e.target.value)} placeholder="consent_abc123" />
      </label>}
      <label className="pilot-consent"><input type="checkbox" checked={consentimiento} onChange={e=>setConsentimiento(e.target.checked)}/>
        <span>{real?'Confirmo que el titular autorizó la consulta y conservo evidencia.':'Confirmo que estoy probando información completamente ficticia.'}</span>
      </label>
      <div className="actions-row">
        <button type="button" className="btn btn-primary" onClick={()=>void comenzar()} disabled={busy||!config?.disponible}>{busy?'Consultando…':pago?'Solicitar · $4 MXN':pilotoReal?'Precalificar de verdad · gratis':'Probar sin costo'}</button>
        {id&&<button type="button" className="btn btn-outline" onClick={()=>void cargar(id).catch(e=>setError(String(e)))}>Actualizar resultado</button>}
      </div>
      {error&&<p className="alert alert-error" role="alert">{error}</p>}
    </section>
    {(respuesta||detalle)&&<section className="form-section pilot-results" aria-live="polite">
      <h2>Resultado {detalle?.sandbox?'ficticio':''}</h2>
      <div className="pilot-overview">
        <div><small>ESTADO</small><strong>{resultado?.estado_integracion??respuesta?.precalificacion?.estado??'Pendiente'}</strong></div>
        <div><small>FOLIO</small><strong>{resultado?.folio??respuesta?.precalificacion?.folio??'—'}</strong></div>
        <div><small>NSS</small><strong>{resultado?.nss_mascarado??'•••••••••'}</strong></div>
      </div>
      {campos.length>0?<div className="pilot-amounts">{campos.map(([k,v])=><div key={k}><span>{k.replaceAll('_',' ')}</span><strong>{typeof v==='number'?pesos(v):typeof v==='string'?v:'No informado'}</strong></div>)}</div>:
        <p className="pilot-description">{resultado?.en_proceso?'Consultando… Se actualizará automáticamente.':resultado?.motivo??'No hay montos disponibles para este escenario.'}</p>}
      <p className="pilot-disclaimer">{pago?'Consulta real sujeta a facturación de $4 por resultado facturable.':pilotoReal?'Resultado real: el servicio utiliza un crédito operativo de cortesía, pero no cobra a la empresa.':'Simulación: no utiliza Bansefi, no genera precalificaciones reales ni consume créditos.'}</p>
    </section>}
  </div>;
}
