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
  if (user) return <Navigate to={user.role === 'beta' ? '/beta/deberes' : '/app/perfil'} replace />
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true);setError('')
    try {
      const result = await betaLogin(documento,password)
      if (result?.error) setError(result.error)
      else navigate('/beta/deberes',{replace:true})
    } catch { setError('No pudimos iniciar la sesión Beta.') }
    finally { setBusy(false) }
  }
  return <main className="relative min-h-screen overflow-hidden bg-pr-black px-5 py-14 text-pr-ice">
    <section className="relative mx-auto max-w-md rounded-[30px] border border-[rgba(239,248,255,.12)] bg-[rgba(18,8,13,.88)] p-7 shadow-[0_24px_80px_rgba(0,0,0,.45)]">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-pr-cyan">Punta Rollers / Beta</p>
      <h1 className="mt-4 text-3xl font-bold">Ingresar a Beta</h1>
      <p className="mt-2 text-sm text-white/60">Acceso exclusivo para cuentas de prueba autorizadas.</p>
      {authLoading&&<p className="mt-3 text-xs text-pr-cyan">Verificando sesión segura…</p>}
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm">Documento
          <input required name="documento" inputMode="numeric" autoComplete="username" value={documento} onChange={e=>setDocumento(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white outline-none transition focus:border-[rgba(187,255,31,.5)]" />
        </label>
        <label className="block text-sm">PIN Beta
          <input required name="pin-beta" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white outline-none transition focus:border-[rgba(187,255,31,.5)]" />
        </label>
        {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={busy||authLoading} aria-busy={busy||authLoading} className="w-full rounded-xl bg-pr-lime px-4 py-3 font-semibold text-pr-black disabled:opacity-50">{busy?'Ingresando…':authLoading?'Verificando…':'Ingresar'}</button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-sm text-white/50 underline">Acceso habitual Punta Rollers</Link>
    </section>
  </main>
}