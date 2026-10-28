import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function PrecalixAccesoPage(){
  const [codigo,setCodigo]=useState('');
  const [error,setError]=useState('');
  const [cargando,setCargando]=useState(false);
  const navigate=useNavigate();
  const entrar=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError('');
    if(codigo.length<32){setError('Introduce tu código de operador.');return;}
    setCargando(true);
    try{
      const r=await fetch('/api/precalix-acceso',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({codigo})});
      if(!r.ok)throw Error('El código no es válido o el acceso no está habilitado.');
      setCodigo('');
      const regreso=new URLSearchParams(window.location.search).get('consulta');
      const idValido=regreso && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(regreso);
      navigate(idValido?'/precalix?consulta='+encodeURIComponent(regreso):'/precalix',{replace:true});
    }catch(e){setError(e instanceof Error?e.message:'No se pudo iniciar sesión.');}
    finally{setCargando(false);}
  };
  return <main className="pilot-page">
    <section className="pilot-entry pilot-login">
      <h1>Acceso a precalificaciones</h1>
      <p>Ingresa tu código de operador una sola vez. Durante tu sesión, la pantalla de precalificación solo te pedirá el NSS.</p>
      <form onSubmit={e=>void entrar(e)}>
        <label htmlFor="codigo-precalix">Código de acceso</label>
        <input id="codigo-precalix" type="password" autoComplete="off" value={codigo}
          onChange={e=>setCodigo(e.target.value)} placeholder="Código del operador" required/>
        <button className="btn btn-primary" type="submit" disabled={cargando}>{cargando?'Validando…':'Ingresar'}</button>
        {error&&<p className="pilot-error" role="alert">{error}</p>}
      </form>
      <p><Link to="/precalix">Regresar a precalificación</Link></p>
    </section>
  </main>;
}
