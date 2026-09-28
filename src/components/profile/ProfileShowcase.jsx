import { useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const META={
  patines:{title:'Mis patines',emoji:'🛼',hint:'Subí una foto de tus patines acá'},
  ruedas:{title:'Mis ruedas',emoji:'◉',hint:'Subí una foto de tus ruedas acá'},
  calle:{title:'Mi calle fav',emoji:'⌁',hint:'Subí una foto de tu lugar favorito'},
  galeria:{title:'Momento',emoji:'✦',hint:'Un pedacito de tu mundo PR'},
}
function instagramUrl(value){if(!value)return'';const raw=String(value).trim();if(/^https?:\/\//i.test(raw))return raw;return `https://instagram.com/${raw.replace(/^@/,'')}`}
function instagramHandle(value){if(!value)return'';const raw=String(value).trim();if(/^https?:\/\//i.test(raw)){try{const u=new URL(raw),bits=u.pathname.split('/').filter(Boolean);return bits.length?`@${bits[bits.length-1].replace(/^@/,'')}`:'Instagram'}catch{return'Instagram'}}return `@${raw.replace(/^@/,'')}`}

export default function ProfileShowcase({profileId,items=[],momentPhotos=[],instagram='',tracking=false,onChange}){
 const input=useRef(null),[slot,setSlot]=useState('galeria'),[busy,setBusy]=useState(false),[msg,setMsg]=useState('')
 const gallery=items.filter(x=>x.slot_key==='galeria').slice(0,6)
 const displayGallery=useMemo(()=>{
   const manual=gallery.map(x=>({...x,display_url:x.image_url,source:'perfil'}))
   const used=new Set(manual.map(x=>x.display_url).filter(Boolean))
   const fromMoments=(momentPhotos||[]).filter(x=>x.signed_media_url&&!used.has(x.signed_media_url)).map(x=>({id:`moment-${x.id}`,display_url:x.signed_media_url,source:'Moment',created_at:x.created_at}))
   return [...manual,...fromMoments].slice(0,6)
 },[gallery,momentPhotos])
 function choose(key){setSlot(key);input.current?.click()}
 async function upload(file){
   if(!file||!profileId)return
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setMsg('Usá JPG, PNG o WEBP de hasta 5 MB.');return}
   setBusy(true);setMsg('')
   const ext=(file.name.split('.').pop()||'jpg').toLowerCase(),path=`${profileId}/${slot}-${Date.now()}.${ext}`
   const up=await supabase.storage.from('pr-profile-media').upload(path,file,{contentType:file.type,upsert:false})
   if(up.error){setMsg('No pudimos subir esa foto.');setBusy(false);return}
   const{data}=supabase.storage.from('pr-profile-media').getPublicUrl(path)
   const payload={profile_id:String(profileId),slot_key:slot,title:META[slot]?.title||'Momento',image_url:data.publicUrl,sort_order:slot==='galeria'?Date.now():0}
   if(slot!=='galeria')await supabase.from('pr_profile_showcase').delete().eq('profile_id',String(profileId)).eq('slot_key',slot)
   const saved=await supabase.from('pr_profile_showcase').insert(payload).select('*').single()
   if(saved.error)setMsg('La foto subió, pero no pudimos guardarla en el perfil.')
   else onChange?.(slot==='galeria'?[saved.data,...items]:[...items.filter(x=>x.slot_key!==slot),saved.data])
   setBusy(false);if(input.current)input.current.value=''
 }
 return <div className="space-y-3">
  <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>upload(e.target.files?.[0])}/>

  <section className="pr-moment-card relative overflow-hidden rounded-[30px] border border-fuchsia-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(217,70,239,.14),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-4">
    <div className="flex items-end justify-between gap-3">
      <div><p className="text-[8px] font-black uppercase tracking-[.18em] text-fuchsia-300/70">MI MOMENTO</p><h3 className="mt-1 text-sm font-black text-white">Tus momentos</h3><p className="mt-1 text-[9px] text-white/28">Fotos que subís acá + tus últimos PR Moments.</p></div>
      <button type="button" onClick={()=>choose('galeria')} className="shrink-0 rounded-full border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-[8px] font-black text-white/55">SUBIR FOTO</button>
    </div>
    {displayGallery.length?<div className="mt-3 grid grid-cols-3 gap-1.5">{displayGallery.slice(0,3).map(x=><div key={x.id} className="group relative aspect-square overflow-hidden rounded-[17px] bg-white/[.03]"><img src={x.display_url} alt="" className="h-full w-full object-cover"/>{x.source==='Moment'&&<span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-1 text-[6px] font-black uppercase tracking-[.1em] text-white/70 backdrop-blur">Moment</span>}</div>)}</div>:<button type="button" onClick={()=>choose('galeria')} className="mt-3 grid w-full grid-cols-3 gap-1.5">{[0,1,2].map(i=><div key={i} className="grid aspect-square place-items-center rounded-[17px] border border-dashed border-white/[.08] bg-white/[.02] text-xl text-white/15">+</div>)}</button>}
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-[9px] leading-4 text-white/25">Tres fotos alcanzan para darle color al perfil sin convertirlo en otro Instagram.</p>
      {instagram&&<a href={instagramUrl(instagram)} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-fuchsia-300/15 bg-fuchsia-400/[.06] px-3 py-1.5 text-[8px] font-black text-fuchsia-200">IG {instagramHandle(instagram)} ↗</a>}
    </div>
<style>{`.pr-moment-card{animation:prMomentFloat 4.2s ease-in-out infinite}.pr-moment-card:before{content:"";position:absolute;inset:-35%;pointer-events:none;background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.09) 50%,transparent 58%);transform:translateX(-70%) rotate(8deg);animation:prMomentShine 5.5s ease-in-out infinite}@keyframes prMomentFloat{50%{transform:translateY(-3px)}}@keyframes prMomentShine{55%,100%{transform:translateX(70%) rotate(8deg)}}@media(prefers-reduced-motion:reduce){.pr-moment-card,.pr-moment-card:before{animation:none!important}}`}</style>\n  <section className="overflow-hidden rounded-[30px] border border-sky-300/15 bg-[radial-gradient(circle_at_95%_0%,rgba(56,189,248,.12),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-4">
    <div className="flex items-end justify-between gap-3">
      <div><p className="text-[8px] font-black uppercase tracking-[.18em] text-sky-300">MI SETUP</p><h3 className="mt-1 font-display text-[27px] text-white">Mi mundo sobre ruedas.</h3><p className="mt-1 text-[9px] text-white/28">Personalizá tu perfil: tocá cada bloque y subí tu foto.</p></div>
      {tracking&&<span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1.5 text-[7px] font-black text-emerald-200">✓ PROTEGIDO · PR TRACKING</span>}
    </div>
    <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {['patines','ruedas','calle'].map(key=>{const x=items.find(v=>v.slot_key===key),m=META[key];return <button key={key} type="button" onClick={()=>choose(key)} className="relative h-[205px] w-[158px] shrink-0 snap-start overflow-hidden rounded-[25px] border border-white/[.08] bg-black/25 text-left shadow-[0_14px_32px_rgba(0,0,0,.2)]">
        {x?.image_url?<img src={x.image_url} alt={m.title} className="absolute inset-0 h-full w-full object-cover"/>:<div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-white/[.05] via-transparent to-sky-400/[.05]"><span className="text-4xl opacity-50">{m.emoji}</span></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/5 to-transparent"/>
        <div className="absolute bottom-3 left-3 right-3"><p className="text-[7px] font-black uppercase tracking-[.12em] text-sky-200/70">{x?'TOCAR PARA CAMBIAR':'SUBÍ TU FOTO ACÁ +'}</p><p className="mt-1 text-sm font-black text-white">{m.title}</p><p className="mt-1 text-[8px] leading-3 text-white/38">{m.hint}</p></div>
      </button>})}
    </div>
    {busy&&<p className="mt-2 text-[9px] text-sky-200">Subiendo foto…</p>}
    {msg&&<p className="mt-2 text-[9px] text-amber-200">{msg}</p>}
  </section>

  </section>
 </div>
}