import RollerweenBadge from '../components/RollerweenBadge'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { supabase } from '../lib/supabase'
import VerifiedBadge from '../components/VerifiedBadge'

export default function FriendProfile(){
  const { id } = useParams()
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  useEffect(()=>{let active=true;(async()=>{setLoading(true);setError('');const{data,error}=await supabase.rpc('community_friend_profile',{p_target_id:id});if(!active)return;if(error){setError(error.message);setProfile(null)}else setProfile(data||null);setLoading(false)})();return()=>{active=false}},[id])

  if(loading)return <AppLayout title="Perfil de amigo" showBack><div className="pr-page py-16 text-center text-xs text-white/35">Abriendo perfil…</div></AppLayout>
  if(error||!profile)return <AppLayout title="Perfil privado" showBack><div className="pr-page py-12"><section className="rounded-[28px] border border-white/[.08] bg-white/[.025] p-6 text-center"><div className="text-3xl">🔒</div><h1 className="mt-3 font-display text-2xl text-white">Perfil privado</h1><p className="mt-2 text-xs leading-5 text-white/35">Este perfil social solo se puede ver entre amistades aceptadas.</p></section></div></AppLayout>

  const showcase=Array.isArray(profile.showcase)?profile.showcase:[]
  const moments=showcase.filter(x=>x.slot_key==='galeria').slice(0,6)
  const setup=['patines','ruedas','calle'].map(key=>showcase.find(x=>x.slot_key===key)).filter(Boolean)
  const albums=Array.isArray(profile.shared_albums)?profile.shared_albums:[]
  const posts=Array.isArray(profile.linked_posts)?profile.linked_posts:[]

  return <AppLayout title="Perfil PR" showBack><div className="pr-page space-y-4 pb-12">
    <section className="overflow-hidden rounded-[34px] border border-orange-300/15 bg-[#0c0c11]">
      <div className="relative h-40 bg-gradient-to-br from-orange-500/25 via-violet-500/10 to-black">{profile.banner&&<img src={profile.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85"/>}<div className="absolute inset-0 bg-gradient-to-t from-[#0c0c11] via-transparent to-black/20"/></div>
      <div className="relative px-5 pb-5"><div className="relative -mt-14 h-28 w-28"><div className="h-full w-full overflow-hidden rounded-[32px] border-4 border-[#0c0c11] bg-white/[.05]">{profile.foto?<img src={profile.foto} alt="" className="h-full w-full object-cover"/>:<div className="grid h-full w-full place-items-center font-display text-3xl text-orange-300">{String(profile.nombre||'PR').slice(0,2)}</div>}</div><RollerweenBadge className="absolute -right-2 -bottom-2 z-20 h-12 w-12"/></div><div className="mt-3 flex items-center gap-2"><h1 className="font-display text-[34px] leading-none text-white">{profile.nombre} {profile.apellido}</h1>{profile.verificado&&<VerifiedBadge size={21}/>}</div>{profile.roller_status&&<p className="mt-2 text-[10px] font-bold text-emerald-200">● {profile.roller_status}</p>}{profile.ciudad&&<p className="mt-3 text-[10px] text-white/35">📍 {profile.ciudad}</p>}{profile.sobre_mi&&<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/55">{profile.sobre_mi}</p>}<div className="mt-4 flex gap-2"><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-[9px] font-black text-white/50">👥 {profile.friend_count||0} amigos PR</span>{profile.instagram&&<a href={String(profile.instagram).startsWith('http')?profile.instagram:`https://instagram.com/${String(profile.instagram).replace(/^@/,'')}`} target="_blank" rel="noreferrer" className="rounded-full border border-fuchsia-300/15 bg-fuchsia-400/[.06] px-3 py-2 text-[9px] font-black text-fuchsia-200">IG ↗</a>}</div></div>
    </section>

    {moments.length>0&&<section className="rounded-[28px] border border-fuchsia-300/12 bg-fuchsia-500/[.04] p-4"><p className="text-[8px] font-black tracking-[.18em] text-fuchsia-300">MI MOMENTO</p><h2 className="mt-1 text-sm font-black text-white">Su mundo PR</h2><div className="mt-3 grid grid-cols-3 gap-1.5">{moments.slice(0,3).map(x=><img key={x.id} src={x.image_url} alt="" className="aspect-square w-full rounded-[16px] object-cover"/>)}</div></section>}

    {setup.length>0&&<section className="rounded-[28px] border border-sky-300/12 bg-sky-500/[.04] p-4"><p className="text-[8px] font-black tracking-[.18em] text-sky-300">MI SETUP</p><div className="mt-3 flex gap-3 overflow-x-auto">{setup.map(x=><div key={x.id} className="relative h-44 w-36 shrink-0 overflow-hidden rounded-[22px]"><img src={x.image_url} alt="" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"/><p className="absolute bottom-3 left-3 text-xs font-black text-white">{x.title}</p></div>)}</div></section>}

    {albums.length>0&&<section><p className="mb-2 text-[9px] font-black tracking-[.16em] text-violet-300">ÁLBUMES EN SU PERFIL</p><div className="grid gap-2">{albums.map(a=><div key={a.id} className="rounded-[22px] border border-violet-300/10 bg-violet-500/[.05] p-4"><p className="text-sm font-black text-white">{a.title}</p><p className="mt-1 text-[9px] text-white/30">{a.photo_count||0} fotos · colaborativo</p></div>)}</div></section>}

    {posts.length>0&&<section><p className="mb-2 text-[9px] font-black tracking-[.16em] text-orange-300">PUBLICACIONES VINCULADAS</p><div className="space-y-2">{posts.slice(0,6).map(p=><div key={p.id} className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4"><p className="text-[9px] font-black text-white/35">{p.author_name}</p><p className="mt-2 text-xs leading-5 text-white/55">{p.body||'Publicación con fotos'}</p></div>)}</div></section>}

    <section className="rounded-[24px] border border-emerald-300/10 bg-emerald-400/[.04] p-4"><p className="text-[10px] font-black text-emerald-200">🔒 Perfil entre amigos</p><p className="mt-2 text-[10px] leading-5 text-white/35">Solo las amistades aceptadas pueden entrar a esta vista. Si la amistad se elimina, el acceso desaparece.</p></section>
  </div></AppLayout>
}
