import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import AppLayout from '../layouts/AppLayout'

/**
 * PR Check rollout: only the authenticated Claudio administrator profile
 * can see the private preview. Never use client-side checks as the only
 * security boundary; all QR/attendance RPCs enforce auth.uid() server-side.
 */
export function isPRCheckPreviewOwner(user) {
  return user?.id === 'admin-claudio' && user?.role === 'admin'
}

export default function PRCheckID() {
  const { user, loading } = useAuth()
  if (loading) return <AppLayout title="QR ID"><p className="p-6 text-white/60">Cargando credencial…</p></AppLayout>
  if (!isPRCheckPreviewOwner(user)) return <Navigate to="/app/mi-pr" replace />
  return <AppLayout title="QR ID" showBack><div className="mx-auto max-w-lg px-4 pb-28 pt-6"><section className="relative overflow-hidden rounded-[32px] border border-lime-300/25 bg-gradient-to-br from-[#192a19] via-[#121b18] to-[#090b10] p-6 text-white"><div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl"/><p className="text-[10px] font-black uppercase tracking-[.24em] text-lime-300">PUNTA ROLLERS · PR CHECK</p><h1 className="mt-3 font-display text-4xl">QR ID</h1><p className="mt-2 text-sm text-white/60">Tu credencial digital personal.</p><div className="mt-6 flex items-center gap-3"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white/10">{user?.foto?<img src={user.foto} alt="" className="h-full w-full object-cover"/>:<span className="text-xl font-black">PR</span>}</div><div><p className="text-lg font-bold">{[user?.nombre,user?.apellido].filter(Boolean).join(' ')}</p><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Administrador · Vista privada</p></div></div><div className="mt-7 rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-sm font-semibold text-lime-200">PR Check está instalado y oculto para los alumnos.</p><p className="mt-2 text-sm leading-6 text-white/55">La credencial QR escaneable se habilitará aquí al terminar la integración segura del generador. Todavía no se registran asistencias desde esta pantalla.</p></div></section></div></AppLayout>
}
