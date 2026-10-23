import {useEffect,useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import {supabase} from '../lib/supabase'

const clinics=[
 {key:'sept_2026',title:'Septiembre 2026',table:'pr_clinica_sept_2026_inscripciones'},
 {key:'oct_2026',title:'Octubre 2026',table:'pr_clinica_oct_2026_inscripciones'}
]
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()

export default function ClinicParticipationAdmin(){
 const [clinic,setClinic]=useState(clinics[0].key)
 const [profiles,setProfiles]=useState([])
 const [registrations,setRegistrations]=useState([])
 const [reviews,setReviews]=useState([])
 const [search,setSearch]=useState('')
 const [onlyConfirmed,setOnlyConfirmed]=useState(false)
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const current=clinics.find(c=>c.key===clinic)
 const load=async()=>{
  setLoading(true);setError('')
  const [p,a,r]=await Promise.all([
   supabase.from('profiles').select('id,nombre,apellido,role').order('nombre').limit(1000),
   supabase.from(current.table).select('id,nombre_completo,estado').limit(1000),
   supabase.from('pr_clinic_participation').select('*').eq('clinic_key',clinic).limit(1000)
  ])
  if(p.error||a.error||r.error)setError([p.error,a.error,r.error].filter(Boolean).map(e=>e.message).join(' · '))
  setProfiles(p.data||[]);setRegistrations(a.data||[]);setReviews(r.data||[]);setLoading(false)
 }
 useEffect(()=>{load()},[clinic])
 const rows=useMemo(()=>profiles.filter(p=>{
  const name=normalize(p.nombre+' '+(p.apellido||''))
  const confirmed=reviews.some(r=>r.profile_id===p.id&&r.attended)
  return name.includes(normalize(search))&&(!onlyConfirmed||confirmed)
 }),[profiles,reviews,search,onlyConfirmed])
 const count=reviews.filter(r=>r.attended&&r.profile_id).length
 const save=async(profile)=>{
  setBusy(profile.id);setError('')
  const existing=reviews.find(r=>r.profile_id===profile.id)
  const attended=!existing?.attended
  const payload={clinic_key:clinic,profile_id:profile.id,participant_name:[profile.nombre,profile.apellido].filter(Boolean).join(' '),attended,updated_at:new Date().toISOString()}
  const response=existing
   ?await supabase.from('pr_clinic_participation').update(payload).eq('id',existing.id)
   :await supabase.from('pr_clinic_participation').insert(payload)
  if(response.error)setError(response.error.message)
  else setReviews(prev=>existing?prev.map(r=>r.id===existing.id?{...r,...payload}:r):[...prev,{...payload,id:'local-'+profile.id}])
  setBusy('')
 }
 return <AppLayout><main className="min-h-screen bg-[#101117] px-4 pb-32 pt-8 text-white"><div className="mx-auto max-w-5xl">
  <Link to="/app/ecosistema/active" className="text-xs font-bold text-white/60">← VOLVER A ACTIVE</Link>
  <header className="mt-6 rounded-[30px] border border-[#57E7DA]/30 bg-gradient-to-br from-[#1C3436] to-[#161721] p-6 sm:p-9">
   <p className="text-[11px] font-black tracking-[.2em] text-[#57E7DA]">ADMINISTRACIÓN · PUNTA ROLLERS</p>
   <h1 className="mt-3 text-3xl font-black sm:text-5xl">Participación en clínicas</h1>
   <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Todos los perfiles, se hayan inscrito o no. Confirmá quién realmente participó: su reconocimiento aparecerá en ACTIVE → OTROS. Cada clínica se administra por separado.</p>
  </header>
  <div className="mt-6 flex flex-wrap gap-3">{clinics.map(c=><button key={c.key} type="button" onClick={()=>{setClinic(c.key);setOnlyConfirmed(false)}} className={'rounded-full border px-4 py-2 text-xs font-black '+(clinic===c.key?'border-[#57E7DA] bg-[#57E7DA]/20 text-[#57E7DA]':'border-white/20 text-white/60')}>CLÍNICA · {c.title}</button>)}</div>
  <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-[#1A1D27] p-4"><p className="text-xs text-white/50">Perfiles</p><p className="mt-1 text-3xl font-black">{profiles.length}</p></div><div className="rounded-2xl border border-[#57E7DA]/25 bg-[#57E7DA]/5 p-4"><p className="text-xs text-[#57E7DA]">Participaciones confirmadas</p><p className="mt-1 text-3xl font-black text-[#57E7DA]">{count}</p></div></div>
  <div className="mt-5 flex flex-wrap items-center gap-3"><input aria-label="Buscar perfil" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cualquier perfil…" className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-[#1B1D28] px-4 py-3 text-sm text-white outline-none focus:border-[#57E7DA]"/><button type="button" onClick={()=>setOnlyConfirmed(v=>!v)} className={'rounded-full border px-4 py-3 text-xs font-black '+(onlyConfirmed?'border-[#57E7DA] text-[#57E7DA]':'border-white/20 text-white/60')}>{onlyConfirmed?'✓ SOLO CONFIRMADOS':'VER CONFIRMADOS'}</button></div>
  {error&&<p role="alert" className="mt-4 rounded-xl border border-rose-400/40 p-4 text-sm text-rose-200">{error}</p>}
  {loading?<p className="mt-6 text-sm text-white/50">Consultando perfiles…</p>:<div className="mt-5 space-y-3">{rows.map(p=>{
   const review=reviews.find(r=>r.profile_id===p.id)
   const matching=registrations.filter(r=>normalize(r.nombre_completo)===normalize(p.nombre+' '+(p.apellido||'')))
   return <section key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#1A1D27] p-4 sm:p-5"><div className="min-w-0 flex-1"><p className="font-black">{p.nombre} {p.apellido||''}</p><p className="mt-1 text-xs text-white/45">{matching.length?'Coincidencia en inscripciones (sin verificar identidad)':'Sin inscripción identificada'} · {p.role||'perfil'}</p>{review?.attended&&<p className="mt-2 text-xs font-bold text-[#57E7DA]">✓ Reconocimiento habilitado en ACTIVE</p>}</div><button type="button" disabled={busy===p.id} onClick={()=>save(p)} className={'rounded-xl px-4 py-3 text-xs font-black transition disabled:opacity-40 '+(review?.attended?'border border-[#57E7DA]/40 bg-[#57E7DA]/10 text-[#57E7DA]':'bg-[#57E7DA] text-[#102223]')}>{busy===p.id?'GUARDANDO…':review?.attended?'✓ PARTICIPÓ · DESMARCAR':'CONFIRMAR PARTICIPACIÓN'}</button></section>
  })}{!rows.length&&<p className="py-8 text-center text-sm text-white/50">No hay perfiles con esos filtros.</p>}</div>}
  <p className="mt-6 text-xs leading-5 text-white/45">Las coincidencias con formularios son orientativas. La confirmación de participación depende de tu revisión como administrador; no se adjudica automáticamente.</p>
 </div></main></AppLayout>
}