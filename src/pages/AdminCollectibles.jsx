import {useEffect,useMemo,useState} from 'react'
import {Link,Navigate} from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import {useAuth} from '../lib/auth'
import {supabase} from '../lib/supabase'
import {PR_COLLECTIBLES_CATALOG} from '../lib/prCollectiblesCatalog'

const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
export default function AdminCollectibles(){
 const {user}=useAuth()
 const [profiles,setProfiles]=useState([]),[enabled,setEnabled]=useState([]),[grants,setGrants]=useState([]),[selected,setSelected]=useState([]),[card,setCard]=useState('PR-001'),[search,setSearch]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[msg,setMsg]=useState(''),[error,setError]=useState('')
 async function load(){
  setLoading(true);setError('')
  try{
   const [p,c]=await Promise.all([supabase.from('profiles').select('id,nombre,apellido,role,participa_como_alumno').or('role.eq.alumno,participa_como_alumno.eq.true').order('apellido').order('id').limit(1000),supabase.from('pr_collectibles_catalog').select('code,grant_enabled').eq('grant_enabled',true)])
   if(p.error||c.error)throw p.error||c.error
   setProfiles(p.data||[]);setEnabled((c.data||[]).map(x=>x.code))
  }catch(e){setError('No se pudo cargar el panel. '+(e.message||''))}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(user?.role==='admin'&&user?.id==='admin-claudio')load()},[user?.id])
 useEffect(()=>{let live=true;setGrants([]);if(user?.role!=='admin'||user?.id!=='admin-claudio')return;supabase.from('pr_collectibles_grants').select('profile_id').eq('card_code',card).limit(1000).then(r=>{if(live){if(r.error)setError('No se pudo consultar el historial de esta carta.');else setGrants((r.data||[]).map(x=>x.profile_id))}});return()=>{live=false}},[card,user?.id])
 const matches=useMemo(()=>profiles.filter(p=>norm(p.nombre+' '+p.apellido).includes(norm(search))),[profiles,search])
 const pending=selected.filter(id=>!grants.includes(id))
 function toggle(id){setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);setMsg('')}
 async function grant(){
  if(busy||loading||!enabled.includes(card)||!reason.trim()||!pending.length)return
  const ids=[...pending],chosen=PR_COLLECTIBLES_CATALOG.find(c=>c.code===card)
  if(!window.confirm('¿Otorgar '+chosen.title+' a '+ids.length+' perfiles seleccionados?'))return
  setBusy(true);setError('');setMsg('')
  try{
   const rows=ids.map(profile_id=>({profile_id,card_code:card,granted_by:user.id,reason:reason.trim()}))
   const r=await supabase.from('pr_collectibles_grants').upsert(rows,{onConflict:'profile_id,card_code',ignoreDuplicates:true}).select('profile_id')
   if(r.error)throw r.error
   const inserted=(r.data||[]).map(x=>x.profile_id)
   setGrants(g=>[...new Set([...g,...ids])]);setSelected([]);setMsg(inserted.length+' cartas nuevas registradas · '+(ids.length-inserted.length)+' ya existentes.');setReason('')
  }catch(e){setError('No se otorgaron las cartas: '+(e.message||'Error de conexión'))}
  finally{setBusy(false)}
 }
 if(user?.role!=='admin'||user?.id!=='admin-claudio')return <Navigate to="/admin" replace/>
 const chosen=PR_COLLECTIBLES_CATALOG.find(c=>c.code===card)
 return <AppLayout title="PR Collectibles · Control" showBack><main className="pr-page space-y-5 pb-24 text-white">
 <section className="rounded-3xl border border-[#FF0055]/30 bg-[#20141c] p-5"><p className="text-[10px] font-black tracking-widest text-[#ff80ae]">PR CONTROL · ADMINISTRACIÓN</p><h1 className="mt-2 text-3xl font-black">PR Collectibles</h1><p className="mt-2 text-sm text-white/65">Otorgá una carta a uno o varios alumnos. Las entregas quedan registradas y no se duplican.</p><Link className="mt-4 inline-block text-sm underline" to="/app/cartas">Ver mi álbum</Link></section>
 {error&&<p role="alert" className="rounded-xl bg-red-950 p-3 text-sm text-red-100">{error}</p>}{msg&&<p role="status" className="rounded-xl bg-emerald-950 p-3 text-sm text-emerald-100">{msg}</p>}
 <section className="space-y-3 rounded-2xl bg-[#191a20] p-4"><label className="block text-sm font-bold">1. Elegí la carta<select disabled={busy||loading} className="mt-2 w-full rounded-xl bg-black p-3" value={card} onChange={e=>{setCard(e.target.value);setMsg('')}}>{PR_COLLECTIBLES_CATALOG.map(c=><option key={c.code} value={c.code}>{c.code} · {c.title}{enabled.includes(c.code)?'':' (no habilitada)'}</option>)}</select></label><p className="text-xs text-white/65">{chosen?.title} · {enabled.includes(card)?'Disponible para otorgar':'Aún no habilitada'}</p></section>
 <section className="space-y-3 rounded-2xl bg-[#191a20] p-4"><label className="block text-sm font-bold">2. Seleccioná alumnos<input disabled={busy} value={search} onChange={e=>setSearch(e.target.value)} className="mt-2 w-full rounded-xl bg-black p-3" placeholder="Buscar por nombre o apellido"/></label>
 <div className="flex flex-wrap items-center gap-2"><button disabled={busy||loading} type="button" onClick={()=>setSelected(s=>[...new Set([...s,...matches.filter(p=>!grants.includes(p.id)).map(p=>p.id)])])} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">Seleccionar resultados</button><button disabled={busy} type="button" onClick={()=>setSelected([])} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Limpiar</button><strong className="text-sm text-[#FF79A5]">{selected.length} seleccionados</strong></div>
 <div className="max-h-72 space-y-1 overflow-y-auto">{loading?'Cargando alumnos…':matches.map(p=><label key={p.id} className="flex items-center gap-3 rounded-lg bg-white/[.04] p-3 text-sm"><input type="checkbox" disabled={busy||grants.includes(p.id)} checked={selected.includes(p.id)||grants.includes(p.id)} onChange={()=>toggle(p.id)}/><span>{p.nombre} {p.apellido}</span>{grants.includes(p.id)&&<small className="ml-auto text-green-300">Ya la tiene</small>}</label>)}</div><p className="text-xs text-white/50">{matches.length} resultados · {grants.length} entregas manuales registradas para esta carta</p></section>
 <section className="space-y-3 rounded-2xl bg-[#191a20] p-4"><label className="block text-sm font-bold">3. Motivo de entrega<textarea disabled={busy} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} rows={3} className="mt-2 w-full rounded-xl bg-black p-3" placeholder="Participación, reconocimiento…"/></label><button disabled={busy||loading||!!error||!pending.length||!reason.trim()||!enabled.includes(card)} onClick={grant} className="min-h-12 w-full rounded-xl bg-[#FF0055] font-black disabled:opacity-40">{busy?'Registrando…':'Otorgar a '+pending.length+' alumnos'}</button></section>
 </main></AppLayout>
}
