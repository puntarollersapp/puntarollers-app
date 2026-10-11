import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getBetaAccess } from '../lib/betaAccess'

export default function BetaHome() {
  const { user, loading, logout } = useAuth()
  const [access, setAccess] = useState(null)
  useEffect(() => {
    let live = true
    setAccess(null)
    if (user?.role !== 'beta') return () => { live = false }
    getBetaAccess(user.id).then(result => { if (live) setAccess(result) }).catch(() => { if (live) setAccess({ enabled: false }) })
    return () => { live = false }
  }, [user?.id, user?.role])
  if (loading) return null
  if (!user) return <Navigate to="/beta/login" replace />
  if (user.role !== 'beta') return <Navigate to="/app/perfil" replace />
  return <main className="min-h-screen bg-[#080a13] px-5 py-14 text-white">
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-7">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">Punta Rollers / Beta</p>
      <h1 className="mt-4 text-3xl font-bold">Espacio de pruebas</h1>
      {access === null ? <p className="mt-4 text-white/60">Comprobando autorización…</p>
        : !access.enabled ? <p className="mt-4 text-white/60">Tu acceso Beta no está habilitado.</p>
        : <p className="mt-4 text-white/60">Acceso Beta autorizado. Las experiencias experimentales todavía no están publicadas.</p>}
      <button type="button" onClick={logout} className="mt-8 rounded-xl border border-white/20 px-4 py-3">Cerrar sesión</button>
    </section>
  </main>
}
