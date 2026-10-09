import {useEffect,useState} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {supabase} from '../lib/supabase'
import {useAuth} from '../lib/auth'
import {validateFamilyApplication} from '../lib/prKidsFamilyValidation'
import './PRKidsInscripciones2026.css'
const features=[['✦','Qué hicimos hoy','Conocé qué practicamos en la clase del sábado.','blue'],['▣','Pasaporte roller','Cada clase suma un sello a su recorrido.','pink'],['★','Insignias','Descubrí las habilidades y los logros que consiguió.','yellow'],['▧','Fotos y videos','Recuerdos de las clases en una galería privada.','green']]
const initial={nombre_tutor:'',documento_tutor:'',email_tutor:'',telefono_tutor:'',nombre_nino:'',vinculo:'',es_alumno:null}
function Input({label,value,onChange,type='text',placeholder,required=true,readOnly=false}){return <label className="full"><span>{label}</span><input required={required} readOnly={readOnly} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}
export default function PRKidsClub(){
 const {user}=useAuth()
 const [params]=useSearchParams()
 const [familyHome,setFamilyHome]=useState(null),[familyLoading,setFamilyLoading]=useState(true),[familySession,setFamilySession]=useState(null),[sessionReady,setSessionReady]=useState(false),[guardianAccess,setGuardianAccess]=useState('')
 const [stage,setStage]=useState('home'),[data,setData]=useState(initial),[hijos,setHijos]=useState([{nombre:''}]),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{if(params.get('registro')==='1')setStage('form')},[params])
 useEffect(()=>{if(user?.documento)setData(d=>({...d,nombre_tutor:[user.nombre,user.apellido].filter(Boolean).join(' '),documento_tutor:user.documento,email_tutor:user.email||d.email_tutor,es_alumno:true}))},[user?.id])
 useEffect(()=>{let live=true;supabase.auth.getSession().then(({data})=>{if(live){setFamilySession(data?.session?.user?.id||null);setSessionReady(true)}});const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(live){setFamilySession(session?.user?.id||null);setSessionReady(true)}});return()=>{live=false;listener?.subscription?.unsubscribe()}},[])
 useEffect(()=>{let live=true;async function loadFamily(){setFamilyHome(null);setFamilyLoading(true);try{if(!sessionReady||!familySession)return;const {data:family,error}=await supabase.functions.invoke('pr-kids-family-access',{body:{action:'family-home'}});if(!live)return;if(!error&&family?.ok){setFamilyHome(family);setGuardianAccess('')}else if(family?.error==='Acceso familiar pendiente de activación'){setGuardianAccess('Tu cuenta familiar está pendiente de activación. Administración te avisará cuando puedas ingresar.')}else{setGuardianAccess('')}}catch{}finally{if(live&&sessionReady)setFamilyLoading(false)}}loadFamily();return()=>{live=false}},[familySession,sessionReady])
 const set=(k,v)=>setData(d=>({...d,[k]:v}))
 async function submit(e){e.preventDefault();if(busy)return;setError('')
 if(data.es_alumno===null){setError('Elegí si ya tenés cuenta de alumno adulto.');return}
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
  <header className="prk-header"><Link to="/" className="prk-brand"><img src="/logo.png" alt="Punta Rollers"/><div><p>PR KIDS CLUB</p><span>Una aventura sobre ruedas</span></div></Link><span className="prk-badge">ACCESO FAMILIAR</span></header>
  {familyHome?.children?.length>0&&stage==='home'&&<section className="prk-stage"><p className="prk-kicker">MI FAMILIA ROLLER</p><h1>¡HOLA, {familyHome.guardian.nombre}!</h1><p className="prk-lead">Estos son los perfiles infantiles vinculados y aprobados para tu cuenta.</p><div className="prk-quick-grid">{familyHome.children.map(child=><article key={child.id} className="blue"><span>✦</span><div><b>{child.nombre}</b><small>Perfil familiar verificado</small></div></article>)}</div></section>}
  {stage==='home'&&familyLoading&&<section className="prk-stage"><p className="prk-lead">Verificando tu acceso familiar…</p></section>}
  {stage==='home'&&!familyHome&&!familyLoading&&<section className="prk-stage prk-stage-home">{guardianAccess&&<p role="status" className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">{guardianAccess}</p>}
   <span className="prk-home-topline">✦ BIENVENIDOS A PR KIDS CLUB ✦</span>
   <h1 className="prk-home-title">MIRÁ CÓMO<br/><em>APRENDE A PATINAR.</em></h1>
   <p className="prk-lead prk-home-lead">Conocé qué practicó tu hijo en cada clase, seguí su pasaporte roller y encontrá sus recuerdos. Un espacio privado para acompañarlo desde casa.</p>
   <div className="prk-home-ribbon">PASAPORTE ROLLER · CADA CLASE SUMA UN SELLO</div><p className="prk-lead prk-home-lead" style={{fontSize:".91rem",marginTop:12}}>Si tenés más de un hijo en PR Kids, vas a poder acompañarlos desde el mismo acceso familiar.</p>
   <div className="prk-quick-grid prk-quick-grid-home">{features.map(([icon,title,desc,color])=><article className={color} key={title}><span>{icon}</span><div><b>{title}</b><small>{desc}</small></div></article>)}</div>
   <button className="prk-primary" onClick={()=>setStage('form')}>PEDIR ACCESO PARA MI HIJO/A →</button>
   {!user&&<Link to="/login?next=%2Fkids%3Fregistro%3D1" className="mt-5 block text-center text-sm font-bold text-white/60 underline underline-offset-4">Ya soy alumno de Punta Rollers · Ingresar con mi documento y PIN</Link>}
   <p className="mt-6 text-xs leading-5 text-white/40">La solicitud es gratuita. Después de verificar los datos, habilitaremos el acceso a los perfiles familiares.</p>
  </section>}
  {stage==='form'&&familyLoading&&<section className="prk-stage"><p className="prk-lead">Verificando tu acceso familiar…</p></section>}
  {stage==='form'&&!familyLoading&&familyHome?.children?.length>0&&<section className="prk-stage"><p className="prk-kicker">ACCESO HABILITADO</p><h1>Tu familia ya tiene acceso</h1><p className="prk-lead">Volvé a tu espacio familiar para ver los perfiles aprobados.</p><button type="button" className="prk-primary" onClick={()=>setStage('home')}>VER MI FAMILIA →</button></section>}
  {stage==='form'&&!familyLoading&&!familyHome&&<section className="prk-stage">
   <button type="button" className="prk-back" onClick={()=>setStage('home')}>← Volver</button>
   <p className="prk-kicker">ACCESO FAMILIAR · PR KIDS</p><h1>¡HOLA,<br/>FAMILIA ROLLER!</h1>
   <p className="prk-lead">Primero contanos si ya usás Punta Rollers. Después completá tus datos y los de tus hijos que asisten a PR Kids.</p>
   <form onSubmit={submit}>
    <h2 className="prk-section-label">01 / Tu cuenta como adulto responsable</h2>{user&&<p className="mb-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">Ingresaste como {[user.nombre,user.apellido].filter(Boolean).join(' ')}. Conservás tu cuenta y PIN actuales. Tu cédula se toma de esa cuenta.</p>}<p className="mb-4 text-sm leading-6 text-white/60">Estos datos son del <strong className="text-white">padre, madre o tutor</strong>, NO del niño. El documento del adulto sirve para verificar la identidad. Si ya sos alumno, conservás tu acceso actual; si sos responsable sin perfil de alumno, el acceso se habilitará por separado después de la revisión.</p>
    {!user&&<label className="mb-5 block"><span className="mb-2 block text-sm font-bold">¿Ya tenés cuenta de alumno adulto en Punta Rollers?</span><select required value={data.es_alumno===null?"":String(data.es_alumno)} onChange={e=>set("es_alumno",e.target.value===""?null:e.target.value==="true")} className="w-full rounded-xl border border-white/15 bg-[#171923] p-4 text-white"><option value="">Seleccionar</option><option value="true">Sí, ya tengo documento y PIN</option><option value="false">No, solo soy madre, padre o tutor</option></select>{data.es_alumno===true&&<p className="mt-2 text-xs text-white/70">Conservás tu PIN actual. <Link to="/login?next=%2Fkids%3Fregistro%3D1" className="underline">Ingresar a mi cuenta</Link></p>}{data.es_alumno===false&&<p className="mt-2 text-xs text-white/70">Vamos a verificar tus datos antes de habilitarte una cuenta familiar. No necesitás ser alumno.</p>}</label>}
    <div className="prk-form-grid">
     <Input label="Nombre y apellido del adulto" value={data.nombre_tutor} onChange={v=>set('nombre_tutor',v)} placeholder="Nombre completo"/>
     <Input label="Cédula del adulto (con esta ingresás a la plataforma)" value={data.documento_tutor} onChange={v=>set('documento_tutor',v.replace(/\D/g,'').slice(0,12))} placeholder="12345678" readOnly={Boolean(user?.documento)}/>
     <p className="full -mt-3 text-xs text-white/55">Ingresá tu cédula sin puntos ni guion.</p>
     <Input label="Correo electrónico" type="email" value={data.email_tutor} onChange={v=>set('email_tutor',v)} placeholder="nombre@email.com"/>
     <Input label="WhatsApp" type="tel" value={data.telefono_tutor} onChange={v=>set('telefono_tutor',v)} placeholder="099 123 456"/>

     <label className="full"><span>Tu vínculo con el niño o niña</span><select required value={data.vinculo} onChange={e=>set('vinculo',e.target.value)}><option value="">Seleccionar</option><option value="madre">Madre</option><option value="padre">Padre</option><option value="tutor">Tutor/a legal</option></select></label>
    </div>
    <h2 className="prk-section-label adult">02 / Tus pequeños rollers</h2><p className="mb-4 text-sm leading-6 text-white/60">Escribí el nombre completo del niño o niña que asiste a PR Kids. ¿También viene su hermano o hermana? Agregalo acá, sin hacer otra solicitud.</p>
    <div className="prk-form-grid">
     {hijos.map((h,i)=><div key={i} className="full rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="mb-3 flex items-center justify-between gap-3"><strong className="text-sm text-[#ffd45d]">{`Hijo o hija ${i+1}`}</strong>{i>0&&<button type="button" onClick={()=>setHijos(x=>x.filter((_,j)=>j!==i))} className="text-xs font-bold text-pink-300">Quitar</button>}</div><Input label={`Nombre y apellido del niño/a ${i+1}`} value={h.nombre} onChange={v=>setHijos(x=>x.map((item,j)=>j===i?{nombre:v}:item))} placeholder="Nombre completo"/></div>)}<div className="full"><p className="mb-3 text-sm text-white/65">¿Tenés otro hijo o hija que también asiste a PR Kids?</p><button type="button" disabled={hijos.length>=6} onClick={()=>setHijos(x=>[...x,{nombre:''}])} className="w-full rounded-2xl border border-dashed border-[#69d9ff]/60 bg-[#69d9ff]/10 px-4 py-4 text-sm font-black text-[#8be3ff] disabled:opacity-40">＋ SÍ, AGREGAR OTRO NIÑO/A</button></div>

    </div>
    <div className="prk-note-card"><span>◈</span><div><b>Privacidad primero</b><p>Los recuerdos de clase son privados. Ningún acceso a los datos de tus hijos se activa hasta que verificamos tu identidad y el vínculo familiar.</p></div></div>
    {error&&<p className="prk-error" role="alert">{error}</p>}
    <button disabled={busy||data.documento_tutor.length<6||hijos.some(h=>h.nombre.trim().length<3)} className="prk-primary" type="submit">{busy?'ENVIANDO SOLICITUD…':'ENVIAR SOLICITUD →'}</button>
   </form>
  </section>}
  {stage==='pending'&&<section className="prk-stage prk-final"><div className="prk-final-icon">✓</div><p className="prk-kicker">SOLICITUD EN REVISIÓN</p><h1>¡YA TENEMOS<br/>TU SOLICITUD!</h1><p className="prk-lead">Ya existe una solicitud pendiente para esta cédula. No creamos otra cuenta ni duplicamos a tus hijos. Administración revisará los datos antes de habilitar el acceso.</p><Link className="prk-primary prk-link" to="/">VOLVER A PUNTA ROLLERS</Link></section>}
  {stage==='done'&&<section className="prk-stage prk-final"><div className="prk-final-icon">✓</div><p className="prk-kicker">SOLICITUD REGISTRADA</p><h1>¡YA ESTAMOS<br/>EN CONTACTO!</h1><p className="prk-lead">Recibimos tus datos. Vamos a verificar tu solicitud y te avisaremos cuando tu acceso familiar esté habilitado.</p><Link className="prk-primary prk-link" to="/">VOLVER A PUNTA ROLLERS</Link></section>}
 </div></main>
}