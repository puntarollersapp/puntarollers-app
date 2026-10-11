import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function BetaLogin() {
  const { user, loading: authLoading, betaLogin } = useAuth()
  const navigate = useNavigate()
  const [documento, setDocumento] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (authLoading) return null
  if (user) return <Navigate to={user.role === 'beta' ? '/beta' : '/app/perfil'} replace />
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true);setError('')
    try {
      const result = await betaLogin(documento,password)
      if (result?.error) setError(result.error)
      else navigate('/beta',{replace:true})
    } catch { setError('No pudimos iniciar la sesión Beta.') }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-[#080a13] px-5 py-14 text-white">
    <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">Punta Rollers / Beta</p>
      <h1 className="mt-4 text-3xl font-bold">Ingresar a Beta</h1>
      <p className="mt-2 text-sm text-white/60">Acceso exclusivo para cuentas de prueba autorizadas.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm">Documento
          <input required inputMode="numeric" autoComplete="username" value={documento} onChange={e=>setDocumento(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white" />
        </label>
        <label className="block text-sm">Contraseña Beta
          <input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white" />
        </label>
        {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold disabled:opacity-50">{busy?'Ingresando…':'Ingresar'}</button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-sm text-white/50 underline">Acceso habitual Punta Rollers</Link>
    </section>
  </main>
}
