import {useState} from 'react'
import {Link} from 'react-router-dom'
import {supabase} from '../lib/supabase'
import {useAuth} from '../lib/auth'
import './PRKidsInscripciones2026.css'
const features=[['✦','Así entrenamos','Un diario de cada sábado, con fotos y lo que aprendimos.','blue'],['▣','Pasaporte roller','Cada asistencia suma un sello digital.','pink'],['★','Mis insignias','Habilidades, valores y logros para celebrar.','yellow'],['▧','Mis recuerdos','Galerías privadas para las familias.','green']]
const initial={nombre_tutor:'',documento_tutor:'',email_tutor:'',telefono_tutor:'',nombre_nino:'',vinculo:'',es_alumno:false}
function Input({label,value,onChange,type='text',placeholder,required=true}){return <label className="full"><span>{label}</span><input required={required} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}
export default function PRKidsClub(){
 const {user}=useAuth()
 const [stage,setStage]=useState('home'),[data,setData]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const set=(k,v)=>setData(d=>({...d,[k]:v}))
 async function submit(e){e.preventDefault();if(busy)return;setError('');setBusy(true);try{
 const {data:r,error:err}=await supabase.functions.invoke('pr-kids-family-access',{body:{action:'request',...data}})
 if(err||r?.error)throw Error(r?.error||'No pudimos enviar la solicitud. Intentá nuevamente.')
 setStage('done')
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 return <main className="prk-shell"><div className="prk-blob prk-blob-a"/><div className="prk-blob prk-blob-b"/>
 <div className="prk-card">
  <header className="prk-header"><Link to="/" className="prk-brand"><img src="/logo.png" alt="Punta Rollers"/><div><p>PR KIDS CLUB</p><span>Una aventura sobre ruedas</span></div></Link><span className="prk-badge">FAMILY EXPERIENCE</span></header>
  {stage==='home'&&<section className="prk-stage prk-stage-home">
   <span className="prk-home-topline">✦ BIENVENIDOS A PR KIDS CLUB ✦</span>
   <h1 className="prk-home-title">PEQUEÑOS<br/><em>GRANDES LOGROS.</em></h1>
   <p className="prk-lead prk-home-lead">Cada clase es una aventura. Ahora las familias podrán descubrir lo que aprendimos, guardar recuerdos y celebrar cada avance sobre ruedas.</p>
   <div className="prk-home-ribbon">PATINAR · APRENDER · CRECER</div>
   <div className="prk-quick-grid prk-quick-grid-home">{features.map(([icon,title,desc,color])=><article className={color} key={title}><span>{icon}</span><div><b>{title}</b><small>{desc}</small></div></article>)}</div>
   <button className="prk-primary" onClick={()=>setStage('form')}>SOLICITAR ACCESO FAMILIAR →</button>
   <Link to={user?'/app/perfil':'/login'} className="mt-5 block text-center text-sm font-bold text-white/60 underline underline-offset-4">Ya tengo cuenta en Punta Rollers</Link>
   <p className="mt-6 text-xs leading-5 text-white/40">Los accesos familiares requieren aprobación de Punta Rollers. No se crean perfiles infantiles públicos.</p>
  </section>}
  {stage==='form'&&<section className="prk-stage">
   <button type="button" className="prk-back" onClick={()=>setStage('home')}>← Volver</button>
   <p className="prk-kicker">ACCESO FAMILIAR · PR KIDS</p><h1>¡HOLA,<br/>FAMILIA ROLLER!</h1>
   <p className="prk-lead">Completá estos datos para que podamos vincularte con tu hijo o hija. Revisaremos tu solicitud desde Administración.</p>
   <form onSubmit={submit}>
    <h2 className="prk-section-label">01 / Datos del adulto responsable</h2>
    <div className="prk-form-grid">
     <Input label="Nombre y apellido" value={data.nombre_tutor} onChange={v=>set('nombre_tutor',v)} placeholder="Nombre completo"/>
     <Input label="Documento" value={data.documento_tutor} onChange={v=>set('documento_tutor',v.replace(/\D/g,'').slice(0,12))} placeholder="Sin puntos"/>
     <Input label="Correo electrónico" type="email" value={data.email_tutor} onChange={v=>set('email_tutor',v)} placeholder="nombre@email.com"/>
     <Input label="WhatsApp" type="tel" value={data.telefono_tutor} onChange={v=>set('telefono_tutor',v)} placeholder="099 123 456"/>
     <label className="full"><span>¿Ya sos alumno de Punta Rollers?</span><select value={String(data.es_alumno)} onChange={e=>set('es_alumno',e.target.value==='true')}><option value="false">No, solo soy madre/padre/tutor</option><option value="true">Sí, ya tengo documento y PIN</option></select></label>
    </div>
    <h2 className="prk-section-label adult">02 / ¿A quién vamos a acompañar?</h2>
    <div className="prk-form-grid">
     <Input label="Nombre y apellido del niño o niña" value={data.nombre_nino} onChange={v=>set('nombre_nino',v)} placeholder="Nombre completo"/>
     <label className="full"><span>Tu vínculo con el niño o niña</span><select required value={data.vinculo} onChange={e=>set('vinculo',e.target.value)}><option value="">Seleccionar</option><option value="madre">Madre</option><option value="padre">Padre</option><option value="tutor">Tutor/a legal</option></select></label>
    </div>
    <div className="prk-note-card"><span>◈</span><div><b>Tu acceso está protegido</b><p>Si ya sos alumno, mantenés tu documento y PIN. No se crea otra cuenta. La solicitud no habilita automáticamente el acceso a los datos del niño.</p></div></div>
    {error&&<p className="prk-error" role="alert">{error}</p>}
    <button disabled={busy||data.documento_tutor.length<6} className="prk-primary" type="submit">{busy?'ENVIANDO SOLICITUD…':'ENVIAR SOLICITUD →'}</button>
   </form>
  </section>}
  {stage==='done'&&<section className="prk-stage prk-final"><div className="prk-final-icon">✓</div><p className="prk-kicker">SOLICITUD REGISTRADA</p><h1>¡YA ESTAMOS<br/>EN CONTACTO!</h1><p className="prk-lead">Recibimos tu solicitud familiar. Punta Rollers verificará el vínculo y te informará cuando el acceso esté habilitado.</p><Link className="prk-primary prk-link" to="/">VOLVER A PUNTA ROLLERS</Link></section>}
 </div></main>
}