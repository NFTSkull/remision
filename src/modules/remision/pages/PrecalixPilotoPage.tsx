import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

type Config = {
  modo:'pruebas'|'prueba_real'|'cobro_por_uso';
  disponible:boolean; autorizado:boolean; requiere_acceso:boolean; precio_centavos:number;
};
type Valores = {
  moneda?:string;
  titular_nombre?:string|null;
  monto_credito?:number|null;
  saldo_subcuenta?:number|null;
  ahorro_minimo_requerido?:number|null;
  capacidad_compra?:number|null;
  pago_mensual?:number|null;
};
type Precalificacion = {
  id:string; folio?:string; estado?:string; estado_integracion?:string;
  nss_mascarado?:string; motivo?:string|null; en_proceso?:boolean;
  resultado?:Valores|null; creado_en?:string; completado_en?:string|null;
};
type Respuesta = { precalificacion?:Precalificacion; sandbox?:boolean; error?:{codigo:string} };
const UUID_DEMO = 'd5f2462d-a100-4d58-8f1d-46734479eb20';
const moneda = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2});
const IMPORTE = (n:number|null|undefined) => n===null||n===undefined ? 'No informado' : moneda.format(n);

const errores: Record<string,string> = {
  ACCESO_PILOTO_INVALIDO:'Tu acceso expiró. Inicia sesión nuevamente.',
  SANDBOX_NO_HABILITADO:'El entorno de pruebas no está disponible.',
  PROVEEDOR_NO_CONFIGURADO:'El servicio todavía no está configurado.',
  SOLO_NSS_FICTICIO:'La prueba solo acepta el NSS de ejemplo. Las consultas reales siguen apagadas.',
  PILOTO_REAL_NO_HABILITADO:'Las consultas reales todavía no están habilitadas.',
  PILOTO_NO_VERIFICADO:'El piloto no tiene una cuenta activa con cortesía disponible.',
  FACTURACION_NO_VERIFICADA:'Aún no está habilitado el cobro por uso.',
  COLA_OCUPADA:'Hay muchas consultas en curso. Intenta nuevamente.',
  SIN_CREDITOS:'El piloto llegó al límite de consultas gratuitas.',
  LIMITE_MENSUAL:'Se agotó la cortesía de este piloto.',
  PROVEEDOR_NO_DISPONIBLE:'No fue posible conectar con el servicio. Intenta actualizar.',
};
function estadoVista(p?:Precalificacion){
  switch(p?.estado_integracion||p?.estado){
    case 'completada': case 'exitosa':return 'Consulta completada';
    case 'procesando':case 'pendiente':return 'Consultando información';
    case 'sin_resultado_favorable':case 'sin_criterios':return 'No cumple criterios';
    case 'no_encontrado':return 'Información no encontrada';
    case 'error_tecnico':case 'error':return 'No se pudo completar';
    default:return 'Resultado no disponible';
  }
}
function descripcionError(response:Respuesta,status:number){
  return errores[response.error?.codigo??''] ??
    (response.error?.codigo==='NO_ENCONTRADA'
      ? 'La consulta no fue encontrada.'
      : 'No fue posible consultar en este momento ('+status+').');
}
const campo = (titulo:string,valor:number|null|undefined) => ({titulo,valor:IMPORTE(valor),ausente:valor===null||valor===undefined});

export function PrecalixPilotoPage(){
  const [config,setConfig]=useState<Config|null>(null);
  const [nss,setNss]=useState('');
  const [enviando,setEnviando]=useState(false);
  const [consultando,setConsultando]=useState(false);
  const [error,setError]=useState('');
  const [consulta,setConsulta]=useState<Precalificacion|null>(null);
  const [sandbox,setSandbox]=useState(false);
  const ultimoIntento=useRef<{nss:string;id:string}|null>(null);
  const inFlight=useRef(false);
  const enCurso=useRef(false);
  const iniciado=useRef(0);

  const pruebaFicticia=config?.modo==='pruebas';
  const cobro=config?.modo==='cobro_por_uso';
  const autorizado=config?.autorizado===true;
  useEffect(()=>{
    let activo=true;
    fetch('/api/precalix?status=1',{cache:'no-store'})
      .then(async r=>{if(!r.ok)throw Error('Sin conexión');return r.json() as Promise<Config>})
      .then(c=>{if(activo){setConfig(c);if(c.modo==='pruebas')setNss('00000000000');}})
      .catch(()=>{if(activo)setError('No pudimos verificar el servicio.');});
    return()=>{activo=false;};
  },[]);

  const leer=useCallback(async(id:string)=>{
    if(inFlight.current)return;
    inFlight.current=true;
    try{
      const r=await fetch('/api/precalix?id='+encodeURIComponent(id),{cache:'no-store'});
      const data=await r.json() as Respuesta;
      if(!r.ok)throw Error(descripcionError(data,r.status));
      if(!data.precalificacion)throw Error('No recibimos el resultado.');
      setConsulta(data.precalificacion);
      setSandbox(data.sandbox===true);
      if(!data.precalificacion.en_proceso){enCurso.current=false;setConsultando(false);}
      setError('');
    }catch(e){setError(e instanceof Error?e.message:'No se pudo actualizar la consulta.');}
    finally{inFlight.current=false;}
  },[]);

  useEffect(()=>{
    if(!consultando||!consulta?.id)return;
    const id=consulta.id;
    const interval=setInterval(()=>{
      if(Date.now()-iniciado.current>10*60*1000){
        setConsultando(false);
        setError('La consulta sigue tardando. Puedes actualizar el resultado más adelante.');
        return;
      }
      void leer(id);
    },5000);
    return()=>clearInterval(interval);
  },[consultando,consulta?.id,leer]);

  const comenzar=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!autorizado||!config?.disponible){setError('No tienes acceso activo a la consulta.');return;}
    if(enviando||enCurso.current)return;
    if(!/^[0-9]{11}$/.test(nss)){setError('Ingresa un NSS de 11 dígitos.');return;}
    if(pruebaFicticia&&nss!=='00000000000'){
      setError('Por ahora solo está activa la demostración con el NSS 00000000000. No se ha habilitado el motor real.');
      return;
    }
    setEnviando(true);setError('');setConsulta(null);setSandbox(pruebaFicticia);
    const previo=ultimoIntento.current;
    const id=previo?.nss===nss?previo.id:pruebaFicticia?UUID_DEMO:crypto.randomUUID();
    ultimoIntento.current={nss,id};
    iniciado.current=Date.now();
    try{
      const r=await fetch('/api/precalix',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          nss,producto:'mejora',idempotency_key:id,
          consentimiento:true,autorizacion_confirmada:true,
          evidencia_consentimiento:pruebaFicticia?'consent_demo01':undefined,
        }),
      });
      const data=await r.json() as Respuesta;
      if(!r.ok)throw Error(descripcionError(data,r.status));
      if(!data.precalificacion?.id)throw Error('No recibimos identificador de consulta.');
      setConsulta(data.precalificacion);
      setSandbox(data.sandbox===true);
      setConsultando(Boolean(data.precalificacion.en_proceso));
      enCurso.current=Boolean(data.precalificacion.en_proceso);
      await leer(data.precalificacion.id);
    }catch(e){setError(e instanceof Error?e.message:'No fue posible comenzar.');}
    finally{setEnviando(false);}
  };

  const cambiaNss=(value:string)=>{
    const nuevo=value.replace(/\D/g,'').slice(0,11);
    setNss(nuevo);setError('');
    if(ultimoIntento.current?.nss!==nuevo)ultimoIntento.current=null;
  };
  const detalle=consulta?.resultado;
  const enProceso=consulta?.en_proceso===true;
  const terminado=Boolean(consulta&&!enProceso);
  const hayMontos=Boolean(detalle);
  const restantes=detalle?[
    campo('Saldo de la Subcuenta de Vivienda',detalle.saldo_subcuenta),
    campo('Ahorro mínimo requerido',detalle.ahorro_minimo_requerido),
    campo('Pago mensual estimado',detalle.pago_mensual),
  ]:[];
  return <main className="pilot-page">
    <header className="pilot-heading">
      <div><h1>Precalificación</h1>
        <p>Consulta la información disponible con el Número de Seguro Social.</p></div>
      <span className="pilot-status-chip">{pruebaFicticia?'Modo demostración':cobro?'Pago por uso':'Piloto sin costo'}</span>
    </header>

    <section className="pilot-entry" aria-label="Solicitar precalificación">
      <form onSubmit={e=>void comenzar(e)} className="pilot-nss-form">
        <label htmlFor="nss-precalix">Número de Seguro Social (NSS)</label>
        <div className="pilot-nss-row">
          <input id="nss-precalix" type="text" inputMode="numeric" autoComplete="off"
            value={nss} onChange={e=>cambiaNss(e.target.value)}
            pattern="[0-9]{11}" minLength={11} maxLength={11} required
            placeholder="Escribe los 11 dígitos" aria-describedby="pilot-helper"/>
          <button type="submit" className="btn btn-primary"
            disabled={!config?.disponible||!autorizado||enviando||consultando||nss.length!==11}>
            {enviando?'Enviando…':consultando?'Consultando…':'Precalificar'}
          </button>
        </div>
        <p id="pilot-helper" className="pilot-disclaimer">
          {pruebaFicticia
            ? 'Esta vista utiliza información ficticia. Solo permite el NSS de demostración 00000000000.'
            : 'Al precalificar confirmas que cuentas con autorización previa del titular para esta consulta. La declaración queda vinculada a la solicitud.'}
        </p>
      </form>
      {config&&!autorizado&&<div className="pilot-access-note" role="status">
        Para consultar debes iniciar sesión como operador autorizado.
        <Link to="/precalix/acceso">Ingresar</Link>
      </div>}
      {config&&!config.disponible&&<p role="status" className="pilot-access-note">
        Este servicio está temporalmente deshabilitado.
      </p>}
      {error&&<p className="pilot-error" role="alert">{error}</p>}
    </section>

    {(enviando||consulta)&&<section className="pilot-output" aria-live="polite" aria-label="Resultado de precalificación">
      <div className="pilot-output-head">
        <div><h2>Resultado de precalificación</h2>
          <p>{consulta?.folio?'Folio '+consulta.folio:'Procesando solicitud'}</p></div>
        {consulta?.id&&<button className="pilot-refresh" type="button" onClick={()=>void leer(consulta.id)}>
          Actualizar resultado
        </button>}
      </div>
      <div className={'pilot-result-state '+(enProceso?'waiting':detalle?'completed':'neutral')}>
        <span className="pilot-state-dot" aria-hidden="true"/>
        <strong>{enviando&&!consulta?'Enviando solicitud…':estadoVista(consulta??undefined)}</strong>
        {enProceso&&<span className="pilot-loader" aria-hidden="true"/>}
      </div>
      {enProceso&&<p className="pilot-pending-note">Estamos obteniendo la información. La pantalla se actualizará automáticamente cuando esté disponible.</p>}
      {terminado&&hayMontos&&<>
        <div className="pilot-person">
          <span>Nombre del titular</span>
          <strong>{detalle?.titular_nombre||'No informado'}</strong>
          <small>{consulta?.nss_mascarado?'NSS '+consulta.nss_mascarado:''}</small>
        </div>
        <div className="pilot-main-amounts">
          <article><span>Monto Mejoravit</span><strong>{IMPORTE(detalle?.monto_credito)}</strong></article>
          <article><span>Capacidad de compra</span><strong>{IMPORTE(detalle?.capacidad_compra)}</strong></article>
        </div>
        <div className="pilot-detail-list">
          {restantes.map(x=><div key={x.titulo}><span>{x.titulo}</span>
            <strong className={x.ausente?'no-data':undefined}>{x.valor}</strong></div>)}
        </div>
      </>}
      {terminado&&!detalle&&<p className="pilot-empty-result">
        {consulta?.estado==='error'?'La consulta presentó un error técnico. No significa que la persona no cumpla los criterios.':
          consulta?.estado==='sin_criterios'?'El resultado indica que no cumple los criterios de precalificación.':
          consulta?.estado==='no_encontrado'?'No se encontró información para esta consulta.':
          'No hay montos disponibles para mostrar.'}
        {consulta?.motivo&&' Motivo registrado: '+consulta.motivo+'.'}
      </p>}
      {(sandbox||pruebaFicticia)&&<p className="pilot-result-notice">Datos demostrativos: no se consultó el portal ni se consumieron créditos reales.</p>}
      {!pruebaFicticia&&<p className="pilot-result-notice">{cobro?'El costo se aplicará únicamente conforme a la facturación validada.':'Consulta real en piloto: sin cargo comercial para la empresa.'}</p>}
    </section>}
  </main>;
}
