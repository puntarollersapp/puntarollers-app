import {useEffect,useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import {supabase} from '../lib/supabase'
import {useAuth} from '../lib/auth'

export default function PatchFramesAdmin(){
 const {user}=useAuth()
 const [profiles,setProfiles]=useState([])
 const [frames,setFrames]=useState([])
 const [grants,setGrants]=useState([])
 const [search,setSearch]=useState('')
 const [profileId,setProfileId]=useState('')
 const [frameCode,setFrameCode]=useState('')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const load=async()=>{
  setError('')
  const [p,f,g]=await Promise.all([
   supabase.from('profiles').select('id,nombre,apellido,role').order('nombre').limit(1000),
   supabase.from('pr_collectible_frames').select('code,title,description,enabled,unlock_mode').order('sort_order'),
   supabase.from('pr_profile_frames').select('profile_id,frame_code,granted_at,grant_source,revoked_at').limit(5000)
  ])
  if(p.error||f.error||g.error){setError([p.error,f.error,g.error].filter(Boolean).map(x=>x.message).join(' · '));return}
  setProfiles(p.data||[]);setFrames(f.data||[]);setGrants(g.data||[])
 }
 useEffect(()=>{load()},[])
 const matches=useMemo(()=>profiles.filter(p=>(p.nombre+' '+p.apellido).toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0,60),[profiles,search])
 const assigned=grants.filter(g=>g.profile_id===profileId)
 const change=async(revoke)=>{
  if(!profileId||!frameCode||busy)return
  const frame=frames.find(f=>f.code===frameCode)
  if(!frame)return
  const profile=profiles.find(p=>p.id===profileId)
  if(!window.confirm((revoke?'¿Revocar':'¿Otorgar')+' «'+frame.title+'» a '+(profile?.nombre||'este perfil')+'?'))return
  setBusy(true);setError('');setNotice('')
  const now=new Date().toISOString()
  const payload=revoke?{revoked_at:now,revoked_by:user.id,equipped_at:null}:{profile_id:profileId,frame_code:frameCode,grant_source:'admin',granted_by:user.id,granted_at:now,revoked_at:null,revoked_by:null}
  const result=revoke?await supabase.from('pr_profile_frames').update(payload).eq('profile_id',profileId).eq('frame_code',frameCode):await supabase.from('pr_profile_frames').upsert(payload,{onConflict:'profile_id,frame_code'})
  if(result.error)setError(result.error.message)
  else{setNotice(revoke?'Marco revocado correctamente.':'Marco otorgado correctamente.');await load()}
  setBusy(false)
 }
 return <AppLayout><main className="mx-auto max-w-5xl px-4 py-8 text-white"><Link to="/app/ecosistema/patch" className="text-sm text-[#C4FF24]">← Volver a PATCH</Link><h1 className="mt-5 text-3xl font-black">Administrar marcos PATCH</h1><p className="mt-2 text-sm text-white/60">Asignaciones manuales vinculadas a perfiles reales. Las acciones quedan registradas en Supabase.</p>
 {error&&<p role="alert" className="mt-4 rounded-xl border border-red-400/40 p-3 text-sm text-red-200">{error}</p>}{notice&&<p role="status" className="mt-4 rounded-xl border border-[#C4FF24]/40 p-3 text-sm text-[#C4FF24]">{notice}</p>}
 <div className="mt-6 grid gap-5 rounded-2xl border border-white/15 bg-[#20242B] p-5"><label className="text-sm font-bold">Buscar alumno<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nombre o apellido" className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white"/></label><label className="text-sm font-bold">Perfil<select value={profileId} onChange={e=>{setProfileId(e.target.value);setFrameCode('')}} className="mt-2 w-full rounded-xl border border-white/20 bg-[#20242B] p-3 text-white"><option value="">Seleccionar perfil</option>{matches.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select></label><label className="text-sm font-bold">Marco<select value={frameCode} onChange={e=>setFrameCode(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#20242B] p-3 text-white"><option value="">Seleccionar marco</option>{frames.map(f=><option key={f.code} value={f.code}>{f.title}{f.enabled?'':' (deshabilitado)'}</option>)}</select></label>
 {profileId&&<div className="rounded-xl border border-white/10 p-4"><p className="text-xs font-black tracking-widest text-[#C4FF24]">MARCOS DEL PERFIL</p>{assigned.length?assigned.map(g=><p key={g.frame_code} className="mt-2 text-sm">{frames.find(f=>f.code===g.frame_code)?.title||g.frame_code} — {g.revoked_at?'Revocado':'Otorgado'}</p>):<p className="mt-2 text-sm text-white/50">Sin asignaciones registradas.</p>}</div>}
 <div className="flex flex-wrap gap-3"><button type="button" disabled={!profileId||!frameCode||busy} onClick={()=>change(false)} className="rounded-xl bg-[#C4FF24] px-5 py-3 text-sm font-black text-black disabled:opacity-40">Otorgar marco</button><button type="button" disabled={!profileId||!frameCode||busy||!assigned.some(g=>g.frame_code===frameCode&&!g.revoked_at)} onClick={()=>change(true)} className="rounded-xl border border-red-300/50 px-5 py-3 text-sm font-black text-red-200 disabled:opacity-40">Revocar marco</button></div></div></main></AppLayout>
}
