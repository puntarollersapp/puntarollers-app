import {useEffect,useState} from 'react'
import {useAuth} from '../lib/auth'
import {supabase} from '../lib/supabase'
import {accessoryAccess,accessoryUrl,refreshAccessory,useEquippedAccessory} from '../lib/profileAccessories'
import ProfileAccessory from './ProfileAccessory'

export default function ProfileAccessories({profile}){
 const {user}=useAuth()
 const id=user?.id
 const equipped=useEquippedAccessory(id)
 const [open,setOpen]=useState(false),[catalog,setCatalog]=useState([]),[owned,setOwned]=useState([]),[chosen,setChosen]=useState(null)
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now)
 useEffect(()=>{const update=()=>setNow(Date.now());const t=setInterval(update,30000);window.addEventListener('focus',update);return()=>{clearInterval(t);window.removeEventListener('focus',update)}},[])
 useEffect(()=>{
  if(!open||!id)return
  let active=true
  setLoading(true);setError('')
  Promise.all([supabase.from('pr_accessory_catalog').select('code,title,asset_file,unlock_description').eq('enabled',true).order('sort_order'),supabase.from('pr_accessory_grants').select('accessory_code').eq('profile_id',id)]).then(([c,g])=>{
   if(!active)return
   if(c.error||g.error){setError('No pudimos cargar tus accesorios.');setCatalog([]);setOwned([])}
   else{setCatalog(c.data||[]);setOwned((g.data||[]).map(r=>r.accessory_code))}
   setLoading(false)
  }).catch(()=>{if(active){setError('Error de conexión.');setLoading(false)}})
  return()=>{active=false}
 },[open,id])
 if(!accessoryAccess(user,now)||!id||profile?.id!==id)return null
 async function equip(code){
  if(busy||!owned.includes(code)&&code!==null)return
  setBusy(true);setError('')
  try{
   let r
   if(code===null)r=await supabase.from('pr_accessory_equipped').delete().eq('profile_id',id)
   else{
    r=await supabase.from('pr_accessory_equipped').update({accessory_code:code}).eq('profile_id',id).select('profile_id')
    if(!r.error&&!r.data?.length)r=await supabase.from('pr_accessory_equipped').insert({profile_id:id,accessory_code:code})
   }
   if(r.error)throw r.error
   refreshAccessory(id);setOpen(false);setChosen(null)
  }catch{setError('No se pudo guardar el accesorio. Probá nuevamente.')}
  finally{setBusy(false)}
 }
 const preview=catalog.find(c=>c.code===chosen)||equipped
 return <>
  <button type="button" onClick={()=>{setChosen(equipped?.code||null);setOpen(true)}} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-4 text-xs font-black text-violet-200">✦ Accesorios</button>
  {open&&<div role="dialog" aria-modal="true" aria-label="Mis accesorios" className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm" onClick={()=>!busy&&setOpen(false)}>
    <div onClick={e=>e.stopPropagation()} className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-violet-300/20 bg-[#191A20] p-5 text-left text-white">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-widest text-violet-300">PERSONALIZÁ TU PERFIL</p><h2 className="mt-1 text-2xl font-black">Mis accesorios</h2></div><button type="button" disabled={busy} onClick={()=>setOpen(false)} className="min-h-11 px-3 text-sm text-white/70">Cerrar ×</button></div>
      <div className="mt-4 rounded-2xl bg-black/25 p-4 text-center"><div className="relative mx-auto h-24 w-24"><div className="grid h-full w-full place-items-center overflow-hidden rounded-[26px] border border-white/10 bg-white/10">{profile?.foto?<img src={profile.foto} alt="" className="h-full w-full object-cover"/>:<span className="text-2xl font-black">PR</span>}</div>{preview&&<ProfileAccessory preview={preview} large/>}</div><p className="mt-3 text-xs text-white/65">Vista previa · {preview?.title||'Sin accesorio'}</p></div>
      {error&&<p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}
      {loading?<p className="mt-4 text-sm text-white/60">Cargando…</p>:<><p className="mt-4 text-xs font-bold text-white/65">{owned.length} / {catalog.length} desbloqueados</p><div className="mt-3 grid grid-cols-3 gap-2">{catalog.map(c=>{const unlocked=owned.includes(c.code);return <button type="button" key={c.code} disabled={busy} onClick={()=>setChosen(c.code)} className={'relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-xl border p-2 '+(chosen===c.code?'border-violet-300 bg-violet-400/10':'border-white/10 bg-white/[.03]')}><img src={accessoryUrl(c.asset_file)} alt="" className={'h-12 w-12 object-contain '+(!unlocked?'grayscale opacity-30':'')}/><span className="text-center text-[10px] font-bold">{c.title}</span>{!unlocked&&<span className="text-[9px] text-white/50">Bloqueado</span>}</button>})}</div>{chosen&&<p className="mt-3 text-xs leading-5 text-white/70">{catalog.find(c=>c.code===chosen)?.unlock_description}</p>}<div className="mt-4 flex gap-2"><button type="button" onClick={()=>equip(chosen)} disabled={busy||!owned.includes(chosen)} className="min-h-12 flex-1 rounded-xl bg-violet-300 text-sm font-black text-black disabled:opacity-35">{busy?'Guardando…':'Equipar'}</button><button type="button" disabled={busy} onClick={()=>equip(null)} className="min-h-12 rounded-xl bg-white/10 px-4 text-xs font-bold">Quitar</button></div></>}
    </div>
  </div>}
 </>
}
