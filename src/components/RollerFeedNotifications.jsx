import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../lib/auth'
import {useRollerFeedNotices,rollerFeedTarget,rollerFeedNoticeIcon,noticeDate} from '../lib/prRollerFeedNotices'

export default function RollerFeedNotifications(){
 const {user}=useAuth(), navigate=useNavigate()
 const {items,unread,status,mark,refresh}=useRollerFeedNotices(user?.id)
 const [open,setOpen]=useState(false),[onlyUnread,setOnlyUnread]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const opener=useRef(null),closer=useRef(null)
 function close(){setOpen(false);opener.current?.focus()}
 useEffect(()=>{
  if(!open)return
  const prev=document.body.style.overflow;document.body.style.overflow='hidden';closer.current?.focus()
  const key=e=>{if(e.key==='Escape'){setOpen(false);opener.current?.focus()}}
  document.addEventListener('keydown',key)
  return()=>{document.body.style.overflow=prev;document.removeEventListener('keydown',key)}
 },[open])
 useEffect(()=>{setOpen(false);setError('');setOnlyUnread(false)},[user?.id])
 async function read(item){
  if(busy)return
  setBusy(true);setError('')
  const ok=item?.read_at?true:await mark(item?.id??null)
  setBusy(false)
  if(!ok){setError('No pudimos marcar como leída. Probá nuevamente.');return}
  if(item){close();const to=rollerFeedTarget(item.kind||'',item.entity_id);if(to.startsWith('#'))requestAnimationFrame(()=>document.getElementById(to.slice(1))?.scrollIntoView({behavior:'auto',block:'start'}));else navigate(to)}
 }
 const visible=onlyUnread?items.filter(n=>!n.read_at):items
 if(!user?.id)return null
 return <>
 <button ref={opener} type="button" aria-label={'Notificaciones de RollerFeed'+(unread?' · '+unread+' sin leer':'')} aria-haspopup="dialog" aria-expanded={open} onClick={()=>{setError('');setOpen(true);refresh()}} className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-[#FF0055]/40 bg-[#191A20] text-white shadow-lg active:scale-95">
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
 {unread>0&&<span className="absolute -right-1 -top-1 rounded-full border-2 border-[#191A20] bg-[#FF0055] px-1.5 py-0.5 text-[10px] font-black">{unread>99?'99+':unread}</span>}
 </button>
 {open&&createPortal(<div className="fixed inset-0 z-[160] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Notificaciones de RollerFeed">
 <div className="absolute inset-0 bg-black/75" onClick={close} aria-hidden="true"/>
 <section className="relative flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-[28px] border border-white/15 bg-[#191A20] text-white shadow-2xl sm:rounded-[28px]" style={{paddingBottom:'env(safe-area-inset-bottom)'}}>
 <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3"><div><p className="text-[10px] font-black tracking-widest text-[#FF79A5]">ROLLERFEED · TU ESCUELA</p><h2 className="text-2xl font-black">Notificaciones</h2><p role="status" className="text-xs text-white/60">{status==='loading'?'Cargando…':status==='error'?'No pudimos actualizar':unread?unread+' sin leer':'Todo al día'}</p></div><button ref={closer} type="button" onClick={close} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full bg-white/10">✕</button></header>
 <div className="flex flex-wrap items-center gap-2 px-5 pb-3">{[false,true].map(v=><button type="button" key={String(v)} aria-pressed={onlyUnread===v} onClick={()=>setOnlyUnread(v)} className={'rounded-full px-4 py-2 text-xs font-bold '+(onlyUnread===v?'bg-[#FF0055]':'bg-white/10')}>{v?'Sin leer':'Todas'}</button>)}<button type="button" onClick={()=>read(null)} disabled={busy||!unread} className="ml-auto rounded-full px-2 py-2 text-xs font-bold text-[#FF9ABA] disabled:opacity-40">Marcar todo leído</button></div>
 {error&&<p role="alert" className="px-5 pb-2 text-xs text-rose-300">{error}</p>}
 <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-5">
 {status==='error'&&<li className="rounded-xl bg-white/5 p-3 text-xs">No pudimos actualizar. <button type="button" onClick={refresh} className="font-bold underline">Reintentar</button></li>}
 {status==='ok'&&!visible.length&&<li className="rounded-2xl bg-white/5 p-6 text-center text-sm text-white/60">{onlyUnread?'No tenés avisos sin leer.':'Todavía no tenés notificaciones.'}</li>}
 {visible.map(n=><li key={n.id}><button type="button" disabled={busy} onClick={()=>read(n)} className={'flex w-full items-start gap-3 rounded-2xl border p-3 text-left '+(n.read_at?'border-white/10 bg-white/5':'border-[#FF0055]/35 bg-[#FF0055]/10')}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-xl">{rollerFeedNoticeIcon(n.kind||'')}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{n.text}</span><span className="mt-1 block text-xs text-white/50">{noticeDate(n.created_at)}</span></span>{!n.read_at&&<span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF0055]" aria-label="Sin leer"/>}</button></li>)}
 {status==='ok'&&unread>items.filter(n=>!n.read_at).length&&<li className="p-3 text-xs text-white/55">Hay más avisos sin leer. Se mostrarán al leer los anteriores.</li>}
 </ul></section></div>,document.body)}
 </>
}
