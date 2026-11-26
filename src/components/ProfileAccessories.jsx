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
  if(!accessoryAccess(user,now)||!id||profile?.id!==id)return
  let active=true
  setLoading(true);setError('')
  supabase.rpc('pr_accessories_sync_my').then(({error})=>{if(error)throw error;return Promise.all([supabase.from('pr_accessory_catalog').select('code,title,asset_file,unlock_description').eq('enabled',true).order('sort_order'),supabase.from('pr_accessory_grants').select('accessory_code').eq('profile_id',id)])}).then(([c,g])=>{
   if(!active)return
   if(c.error||g.error){setError('No pudimos cargar tus accesorios.');setCatalog([]);setOwned([])}
   else{setCatalog(c.data||[]);setOwned((g.data||[]).map(r=>r.accessory_code))}
   setLoading(false)
  }).catch(()=>{if(active){setError('Error de conexión.');setLoading(false)}})
  return()=>{active=false}
 },[open,id,profile?.id,accessoryAccess(user,now)])
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
  <section className="mx-auto mt-5 w-full min-w-0 max-w-md text-left" aria-label="Mis accesorios">
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="flex min-w-0 items-center gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0 text-[#FF78AE]" aria-hidden="true"><path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z"/><path d="M20 2v4m-2-2h4"/></svg><span className="text-xs font-black tracking-wide text-white/90">Accesorios</span><span className="text-[10px] font-semibold tabular-nums text-white/40">{owned.length}/{catalog.length}</span></div>
      <button type="button" onClick={()=>{setChosen(equipped?.code||null);setOpen(true)}} className="flex min-h-9 shrink-0 items-center gap-1 text-[11px] font-semibold text-[#FF92BE]">Personalizar <span aria-hidden="true">↗</span></button>
    </div>
    <div className="relative mt-1 min-w-0">
      <div className="flex snap-x gap-3 overflow-x-auto px-2 pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Deslizá para explorar tus accesorios">
        {catalog.map(c=>{const unlocked=owned.includes(c.code),active=equipped?.code===c.code;return <button key={c.code} type="button" onClick={()=>{setChosen(c.code);setOpen(true)}} aria-label={c.title+(unlocked?'':' · Bloqueado')+(active?' · Equipado':'')} className="group relative flex h-[70px] w-[62px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#FF79A5]">
          <span aria-hidden="true" className={'pointer-events-none absolute inset-0 rounded-full transition-opacity '+(active?'bg-[radial-gradient(ellipse_at_center,rgba(255,0,85,.25),transparent_70%)]':'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.07),transparent_72%)]')}/>
          <img src={accessoryUrl(c.asset_file)} alt="" loading="lazy" className={'relative h-[49px] w-[49px] object-contain transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-active:scale-95 '+(unlocked?'drop-shadow-[0_4px_8px_rgba(0,0,0,.65)]':'grayscale opacity-30')}/>
          {!unlocked&&<span className="absolute bottom-3 right-1 rounded-full bg-[#15151c] p-[3px] text-white/55" aria-hidden="true"><svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>}
          <span className={'absolute bottom-0 h-[3px] rounded-full '+(active?'w-6 bg-[#FF0055] shadow-[0_0_9px_#FF0055]':'w-1 bg-transparent')}/>
        </button>})}
        {loading&&!catalog.length&&<span className="py-4 text-xs text-white/55">Cargando…</span>}
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-[#101015] to-transparent"/>
    </div>
    {error&&!open&&<p className="mt-1 text-[10px] text-rose-200">{error}</p>}
  </section>
  {open&&<div role="dialog" aria-modal="true" aria-label="Mis accesorios" className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm" onClick={()=>!busy&&setOpen(false)}>
    <div onClick={e=>e.stopPropagation()} className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-white/10 bg-gradient-to-b from-[#211a27] to-[#101015] p-5 text-left text-white">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-widest text-violet-300">PERSONALIZÁ TU PERFIL</p><h2 className="mt-1 text-2xl font-black">Mis accesorios</h2></div><button type="button" disabled={busy} onClick={()=>setOpen(false)} className="min-h-11 px-3 text-sm text-white/70">Cerrar ×</button></div>
      <div className="mt-4 bg-[radial-gradient(ellipse_at_center,rgba(255,0,85,.12),transparent_70%)] p-4 text-center"><div className="relative mx-auto h-24 w-24"><div className="grid h-full w-full place-items-center overflow-hidden rounded-[26px] border border-white/10 bg-white/10">{profile?.foto?<img src={profile.foto} alt="" className="h-full w-full object-cover"/>:<span className="text-2xl font-black">PR</span>}</div>{preview&&<ProfileAccessory preview={preview} large/>}</div><p className="mt-3 text-xs text-white/65">Vista previa · {preview?.title||'Sin accesorio'}</p></div>
      {error&&<p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}
      {loading?<p className="mt-4 text-sm text-white/60">Cargando…</p>:<><p className="mt-4 text-xs font-bold text-white/65">{owned.length} / {catalog.length} desbloqueados</p><div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">{catalog.map(c=>{const unlocked=owned.includes(c.code);return <button type="button" key={c.code} disabled={busy} onClick={()=>setChosen(c.code)} className={'relative flex min-h-24 w-24 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl p-2 '+(chosen===c.code?'bg-[#FF0055]/10 ring-1 ring-[#FF0055]/40':'bg-transparent')}><img src={accessoryUrl(c.asset_file)} alt="" loading="lazy" className={'h-12 w-12 object-contain '+(!unlocked?'grayscale opacity-30':'')}/><span className="text-center text-[10px] font-bold">{c.title}</span>{!unlocked&&<span className="text-[9px] text-white/50">🔒 Bloqueado</span>}</button>})}</div>{chosen&&<p className="mt-3 text-xs leading-5 text-white/70">{catalog.find(c=>c.code===chosen)?.unlock_description}</p>}<div className="mt-4 flex gap-2"><button type="button" onClick={()=>equip(chosen)} disabled={busy||!owned.includes(chosen)} className="min-h-12 flex-1 rounded-xl bg-[#FF0055] text-sm font-black text-white disabled:opacity-35">{busy?'Guardando…':'Equipar'}</button><button type="button" disabled={busy} onClick={()=>equip(null)} className="min-h-12 rounded-xl bg-white/10 px-4 text-xs font-bold">Quitar</button></div></>}
    </div>
  </div>}
 </>
}
