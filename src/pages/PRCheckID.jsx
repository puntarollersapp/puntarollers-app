import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import AppLayout from '../layouts/AppLayout'

/**
 * PR Check rollout: only the authenticated Claudio administrator profile
 * can see the private preview. Never use client-side checks as the only
 * security boundary; all QR/attendance RPCs enforce auth.uid() server-side.
 */
export function isPRCheckPreviewOwner(user) { return Boolean(user?.id && user?.authUserId) }

export default function PRCheckID() {
  const { user, loading } = useAuth()
  const [history,setHistory] = useState([])
  const [qr,setQr] = useState('')
  const [error,setError] = useState('')
  const [pending,setPending] = useState(true)
  useEffect(()=>{if(!isPRCheckPreviewOwner(user))return;let alive=true;(async()=>{try{const {data,error:rpcError}=await supabase.rpc('pr_check_my_id');if(rpcError)throw rpcError;const token=data?.[0]?.qr_token;if(!token)throw new Error('No se pudo emitir la credencial.');if(!alive)return;try{const QR=await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');const url=await QR.toDataURL('PRCHECK:'+token,{width:420,margin:3,errorCorrectionLevel:'H'});if(alive)setQr(url)}catch(e){if(alive)setError('El generador visual no se pudo cargar. La credencial se creó correctamente; probá actualizar con conexión a internet.')}}catch(e){if(alive)setError(e.message||'No se pudo obtener la credencial')}finally{if(alive)setPending(false)}})();return()=>{alive=false}},[user?.id,user?.role])
  useEffect(()=>{if(!user?.authUserId)return;let live=true;supabase.rpc('pr_check_my_attendance').then(({data})=>{if(live)setHistory(data||[])});return()=>{live=false}},[user?.authUserId])
  if (loading) return <AppLayout title="QR ID"><p className="p-6 text-white/60">Cargando credencial…</p></AppLayout>
  if (!user) return <AppLayout title="QR ID"><p className="p-6">Iniciá sesión para ver tu credencial.</p></AppLayout>
  return <AppLayout title="QR ID" showBack><div className="mx-auto max-w-lg px-4 pb-28 pt-6"><section className="relative overflow-hidden rounded-[32px] border border-lime-300/25 bg-gradient-to-br from-[#192a19] via-[#121b18] to-[#090b10] p-6 text-white"><div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl"/><p className="text-[10px] font-black uppercase tracking-[.24em] text-lime-300">PUNTA ROLLERS · PR CHECK</p><h1 className="mt-3 font-display text-4xl">QR ID</h1><p className="mt-2 text-sm text-white/60">Tu credencial digital personal.</p><div className="mt-6 flex items-center gap-3"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white/10">{user?.foto?<img src={user.foto} alt="" className="h-full w-full object-cover"/>:<span className="text-xl font-black">PR</span>}</div><div><p className="text-lg font-bold">{[user?.nombre,user?.apellido].filter(Boolean).join(' ')}</p><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Credencial personal</p></div></div><div className="mt-7 rounded-[24px] bg-white p-5 text-center text-gray-900">{pending?<div className="grid min-h-[220px] place-items-center text-sm">Preparando tu QR ID…</div>:qr?<img src={qr} alt="Tu código QR personal para PR Check" width="300" height="300" className="mx-auto aspect-square w-full max-w-[300px]"/>:<div className="grid min-h-[180px] place-items-center text-sm text-red-700">{error||"No se pudo mostrar el QR"}</div>}</div><p className="mt-4 text-center text-xs leading-5 text-white/50">Tu código es personal. Mostralo al profesor al llegar a clase.</p></section><section className="mt-5 rounded-[26px] border border-white/10 bg-white/[.035] p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-white">Mis asistencias</h2><span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-bold text-lime-300">{history.length}</span></div>{history.length===0?<p className="mt-3 text-sm text-white/40">Todavía no tenés asistencias registradas.</p>:<div className="mt-3 divide-y divide-white/10">{history.map((item,i)=><div key={i} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-white">{item.class_title}</p><p className="text-xs text-white/40">{new Date(item.starts_at).toLocaleDateString('es-UY',{timeZone:'America/Montevideo'})}</p></div><span className="text-xs text-lime-300">{new Date(item.scanned_at).toLocaleTimeString('es-UY',{timeZone:'America/Montevideo',hour:'2-digit',minute:'2-digit'})}</span></div>)}</div>}</section></div></AppLayout>
}
