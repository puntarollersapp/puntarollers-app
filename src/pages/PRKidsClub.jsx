import {useEffect,useState} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {supabase} from '../lib/supabase'
import {useAuth} from '../lib/auth'
import {validateFamilyApplication} from '../lib/prKidsFamilyValidation'
import './PRKidsInscripciones2026.css'
const features=[['✦','Así entrenamos','Un diario de cada sábado, con fotos y lo que aprendimos.','blue'],['▣','Pasaporte roller','Cada asistencia suma un sello digital.','pink'],['★','Mis insignias','Habilidades, valores y logros para celebrar.','yellow'],['▧','Mis recuerdos','Galerías privadas para las familias.','green']]
const initial={nombre_tutor:'',documento_tutor:'',email_tutor:'',telefono_tutor:'',nombre_nino:'',vinculo:'',es_alumno:false}
function Input({label,value,onChange,type='text',placeholder,required=true,readOnly=false}){return <label className="full"><span>{label}</span><input required={required} readOnly={readOnly} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}
export default function PRKidsClub(){
 const {user}=useAuth()
 const [params]=useSearchParams()
 const [familyHome,setFamilyHome]=useState(null),[familyLoading,setFamilyLoading]=useState(true),[familySession,setFamilySession]=useState(null)
 const [stage,setStage]=useState('home'),[data,setData]=useState(initial),[hijos,setHijos]=useState([{nombre:''}]),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{if(params.get('registro')==='1')setStage('form')},[params])
 useEffect(()=>{if(user?.documento)setData(d=>({...d,nombre_tutor:[user.nombre,user.apellido].filter(Boolean).join(' '),documento_tutor:user.documento,email_tutor:user.email||d.email_tutor,es_alumno:true}))},[user?.id])
 useEffect(()=>{let live=true;supabase.auth.getSession().then(({data})=>{if(live)setFamilySession(data?.session?.user?.id||null)});const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(live)setFamilySession(session?.user?.id||null)});return()=>{live=false;listener?.subscription?.unsubscribe()}},[])
 useEffect(()=>{let live=true;async function loadFamily(){setFamilyHome(null);setFamilyLoading(true);try{if(!familySession)return;const {data:family,error}=await supabase.functions.invoke('pr-kids-family-access',{body:{action:'family-home'}});if(live&&!error&&family?.ok)setFamilyHome(family)}catch{}finally{if(live)setFamilyLoading(false)}}loadFamily();return()=>{live=false}},[familySession])
 const set=(k,v)=>setData(d=>({...d,[k]:v}))
 async function submit(e){e.preventDefault();if(busy)return;setError('')
 const errors=validateFamilyApplication({adult:data,children:hijos,authenticatedDocument:user?.documento})
 if(errors.length){setError(errors[0]);return}
 setBusy(true)
 try{
  const {data:r,error:err}=await supabase.functions.invoke('pr-kids-family-access',{body:{action:'request',...data,nombre_nino:hijos[0]?.nombre||'',hijos}})
  if(err||r?.error)throw Error(r?.error||'No pudimos enviar la solicitud. Intentá nuevamente.')
  setStage(r?.already_exists?'pending':'done')
 }catch(e){setError(e.message)}finally{setBusy(false)}
}
 return <main className="prk-shell"><div className="prk-blob prk-blob-a"/><div className="prk-blob prk-blob-b"/>
 <div className="prk-card">
  <header className="prk-header"><Link to="/" className="prk-brand"><img src="/logo.png" alt="Punta Rollers"/><div><p>PR KIDS CLUB</p><span>Una aventura sobre ruedas</span></div></Link><span className="prk-badge">FAMILY EXPERIENCE</span></header>
  {familyHome?.children?.length>0&&stage==='home'&&<section className="prk-stage"><p className="prk-kicker">MI FAMILIA ROLLER</p><h1>¡HOLA, {familyHome.guardian.nombre}!</h1><p className="prk-lead">Estos son los perfiles infantiles vinculados y aprobados para tu cuenta.</p><div className="prk-quick-grid">{familyHome.children.map(child=><article key={child.id} className="blue"><span>✦</span><div><b>{child.nombre}</b><small>Perfil familiar verificado</small></div></article>)}</div></section>}
  {stage==='home'&&familyLoading&&<section className="prk-stage"><p className="prk-lead">Verificando tu acceso familiar…</p></section>}
  {stage==='home'&&!familyHome&&!familyLoading&&<section className="prk-stage prk-stage-home">
   <span className="prk-home-topline">✦ BIENVENIDOS A PR KIDS CLUB ✦</span>
   <h1 className="prk-home-title">PEQUEÑOS<br/><em>GRANDES LOGROS.</em></h1>
   <p className="prk-lead prk-home-lead">En nuestra escuela, cada pequeño avance cuenta. Por eso creamos un espacio para las familias dentro de puntarollers.com, donde cada niño tendrá su propio perfil, como ya sucede con los alumnos adultos.</p>
   <div className="prk-home-ribbon">UN PERFIL PARA CADA PEQUEÑO ROLLER</div><p className="prk-lead prk-home-lead" style={{fontSize:".91rem",marginTop:12}}>Vas a poder conocer qué practicamos los sábados, ver recuerdos de las clases, acompañar sus progresos y descubrir sus nuevas insignias. Si vienen hermanos, los dos estarán en tu misma cuenta.</p>
   <div className="prk-quick-grid prk-quick-grid-home">{features.map(([icon,title,desc,color])=><article className={color} key={title}><span>{icon}</span><div><b>{title}</b><small>{desc}</small></div></article>)}</div>
   <button className="prk-primary" onClick={()=>setStage('form')}>{user?'VINCULAR A MI HIJO/A →':'CREAR NUESTRO ACCESO FAMILIAR →'}</button>
   {!user&&<Link to="/login?next=%2Fkids%3Fregistro%3D1" className="mt-5 block text-center text-sm font-bold text-white/60 underline underline-offset-4">Ya soy alumno de Punta Rollers · Ingresar con mi documento y PIN</Link>}
   <p className="mt-6 text-xs leading-5 text-white/40">La solicitud es gratuita. Después de verificar los datos, habilitaremos el acceso a los perfiles familiares.</p>
  </section>}
  {stage==='form'&&<section className="prk-stage">
   <button type="button" className="prk-back" onClick={()=>setStage('home')}>← Volver</button>
   <p className="prk-kicker">ACCESO FAMILIAR · PR KIDS</p><h1>¡HOLA,<br/>FAMILIA ROLLER!</h1>
   <p className="prk-lead">Completá los datos del adulto que va a ingresar a la cuenta. Después contanos qué niño o niños de PR Kids querés vincular.</p>
   <form onSubmit={submit}>
    <h2 className="prk-section-label">01 / Tu cuenta como adulto responsable</h2>{user&&<p className="mb-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">Ingresaste como {[user.nombre,user.apellido].filter(Boolean).join(' ')}. Conservás tu cuenta y PIN actuales. Tu cédula se toma de esa cuenta.</p>}<p className="mb-4 text-sm leading-6 text-white/60">Estos datos son del <strong className="text-white">padre, madre o tutor</strong>, NO del niño. El documento del adulto será el que se use para iniciar sesión en Punta Rollers.</p>
    <div className="prk-form-grid">
     <Input label="Nombre y apellido del adulto" value={data.nombre_tutor} onChange={v=>set('nombre_tutor',v)} placeholder="Nombre completo"/>
     <Input label="Cédula del adulto (con esta ingresás a la plataforma)" value={data.documento_tutor} onChange={v=>set('documento_tutor',v.replace(/\D/g,'').slice(0,12))} placeholder="Sin puntos" readOnly={Boolean(user?.documento)}/>
     <Input label="Correo electrónico" type="email" value={data.email_tutor} onChange={v=>set('email_tutor',v)} placeholder="nombre@email.com"/>
     <Input label="WhatsApp" type="tel" value={data.telefono_tutor} onChange={v=>set('telefono_tutor',v)} placeholder="099 123 456"/>
     {!user&&<label className="full"><span>¿Ya tenés perfil de alumno adulto en Punta Rollers?</span><select value={String(data.es_alumno)} onChange={e=>set('es_alumno',e.target.value==='true')}><option value="false">No, solo soy madre/padre/tutor</option><option value="true">Sí, ya tengo documento y PIN</option></select></label>}
    </div>
    <h2 className="prk-section-label adult">02 / Tus pequeños rollers</h2><p className="mb-4 text-sm leading-6 text-white/60">Escribí el nombre completo del niño o niña que asiste a PR Kids. ¿También viene su hermano o hermana? Agregalo acá, sin hacer otra solicitud.</p>
    <div className="prk-form-grid">
     {hijos.map((h,i)=><div key={i} className="full rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="mb-3 flex items-center justify-between gap-3"><strong className="text-sm text-[#ffd45d]">{i===0?'Mi hijo o hija':`Hermano/a ${i+1}`}</strong>{i>0&&<button type="button" onClick={()=>setHijos(x=>x.filter((_,j)=>j!==i))} className="text-xs font-bold text-pink-300">Quitar</button>}</div><Input label={`Nombre y apellido del niño/a ${i+1}`} value={h.nombre} onChange={v=>setHijos(x=>x.map((item,j)=>j===i?{nombre:v}:item))} placeholder="Nombre completo"/></div>)}<div className="full"><p className="mb-3 text-sm text-white/65">¿Tenés otro hijo o hija que también asiste a PR Kids?</p><button type="button" disabled={hijos.length>=6} onClick={()=>setHijos(x=>[...x,{nombre:''}])} className="w-full rounded-2xl border border-dashed border-[#69d9ff]/60 bg-[#69d9ff]/10 px-4 py-4 text-sm font-black text-[#8be3ff] disabled:opacity-40">＋ SÍ, AGREGAR OTRO NIÑO/A</button></div>
     <label className="full"><span>Tu vínculo con el niño o niña</span><select required value={data.vinculo} onChange={e=>set('vinculo',e.target.value)}><option value="">Seleccionar</option><option value="madre">Madre</option><option value="padre">Padre</option><option value="tutor">Tutor/a legal</option></select></label>
    </div>
    <div className="prk-note-card"><span>◈</span><div><b>Tu acceso está protegido</b><p>Una sola cuenta para el adulto, incluso si tiene varios hijos. Si ya sos alumno, mantenés tu documento y PIN. Si no tenés cuenta, te explicaremos cómo acceder cuando aprobemos tu solicitud. Ningún perfil infantil se habilita sin verificación.</p></div></div>
    {error&&<p className="prk-error" role="alert">{error}</p>}
    <button disabled={busy||data.documento_tutor.length<6||hijos.some(h=>h.nombre.trim().length<3)} className="prk-primary" type="submit">{busy?'ENVIANDO SOLICITUD…':'ENVIAR SOLICITUD →'}</button>
   </form>
  </section>}
  {stage==='pending'&&<section className="prk-stage prk-final"><div className="prk-final-icon">✓</div><p className="prk-kicker">SOLICITUD EN REVISIÓN</p><h1>¡YA TENEMOS<br/>TU SOLICITUD!</h1><p className="prk-lead">Ya existe una solicitud pendiente para esta cédula. No creamos otra cuenta ni duplicamos a tus hijos. Administración revisará los datos antes de habilitar el acceso.</p><Link className="prk-primary prk-link" to="/">VOLVER A PUNTA ROLLERS</Link></section>}
  {stage==='done'&&<section className="prk-stage prk-final"><div className="prk-final-icon">✓</div><p className="prk-kicker">SOLICITUD REGISTRADA</p><h1>¡YA ESTAMOS<br/>EN CONTACTO!</h1><p className="prk-lead">Recibimos tu solicitud familiar. Punta Rollers verificará el vínculo y te informará cuando el acceso esté habilitado.</p><Link className="prk-primary prk-link" to="/">VOLVER A PUNTA ROLLERS</Link></section>}
 </div></main>
}