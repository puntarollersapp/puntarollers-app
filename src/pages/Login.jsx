import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { useAuth } from '../lib/auth'
const UPDATE_ART='/pr-beta-logo.png'

export default function Login() {
  const [documento, setDocumento] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const destination = next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\\\') ? next : '/app/perfil'

  useEffect(() => {
    if (authLoading || !user) return
    navigate(user.role === 'beta' ? '/beta' : destination, { replace: true })
  }, [authLoading, user, navigate, destination])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(documento, pin)
      if (result?.error) { setError(result.error); return }
      if (result?.user?.role === 'beta') { navigate('/beta', { replace: true }); return }
      if (result?.user?.id && (!['admin','profesor'].includes(result?.user?.role) || result?.user?.documento === '48036677')) {
        const { data: training } = await (await import('../lib/supabase')).supabase
          .from('pr_training_enrollments')
          .select('category')
          .eq('profile_id', result.user.id)
          .eq('event_slug','shifter-marathon-2026')
          .maybeSingle()
        if (training?.category && training.category !== 'NO') window.localStorage.setItem('pr_training_visible','1')
        else if (training?.category === 'NO') window.localStorage.removeItem('pr_training_visible')
      }
      navigate(destination, { replace: true })
    } catch {
      setError('No pudimos iniciar sesión. Revisá tus datos.')
    } finally { setLoading(false) }
  }

  if (authLoading || user) return null
  return (
    <PublicLayout>
      <div className="relative min-h-[calc(100vh-70px)] overflow-hidden px-5 py-8">
        <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(circle at 50% 8%,rgba(187,255,31,.065),transparent 31%),linear-gradient(180deg,rgba(239,248,255,.025),transparent 42%)'}}/>
        <div className="relative mx-auto flex min-h-[calc(100vh-134px)] max-w-md flex-col justify-center">
          <section className="mb-6 text-center animate-fade-up">
            <img src={UPDATE_ART} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/logo.png' }} alt="Punta Rollers" className="mx-auto h-auto w-[150px] max-w-[48vw] object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,.52)]"/>
            <p className="mt-4 font-mono text-[8px] font-black uppercase tracking-[.24em] text-white/45">PR NEXT · NUEVA ERA</p>
            <h1 className="mt-2 font-display text-[38px] leading-none text-white">Tu Punta Rollers.<br/><span className="text-pr-lime">Más vos que nunca.</span></h1>
            <p className="mx-auto mt-3 max-w-[300px] text-sm leading-5 text-white/40">Entrá a tu perfil, entrenamiento, comunidad y todo lo nuevo de PR.</p>
          </section>
          <form onSubmit={handleSubmit} className="space-y-4 rounded-[30px] border border-[rgba(255,0,85,.16)] bg-[radial-gradient(ellipse_at_100%_100%,rgba(255,0,85,.095),transparent_65%),linear-gradient(155deg,rgba(239,248,255,.055),rgba(13,3,3,.95)_44%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,.58),0_16px_45px_rgba(255,0,85,.035),inset_0_1px_0_rgba(239,248,255,.045)] backdrop-blur-xl animate-fade-up stagger-1">
            <label className="block"><span className="font-mono text-[8px] font-black uppercase tracking-[.18em] text-white/55">Documento</span><input required autoComplete="username" name="documento" value={documento} onChange={e=>setDocumento(e.target.value)} inputMode="numeric" placeholder="Ej: 12345678" className="mt-2 w-full rounded-[17px] border border-white/[.08] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-[rgba(187,255,31,.5)] focus:shadow-[0_0_0_3px_rgba(187,255,31,.08)]" /></label>
            <label className="block"><span className="font-mono text-[8px] font-black uppercase tracking-[.18em] text-white/55">PIN personal</span><input required autoComplete="current-password" name="pin" value={pin} onChange={e=>setPin(e.target.value)} type="password" inputMode="numeric" placeholder="Ingresá tu PIN" className="mt-2 w-full rounded-[17px] border border-white/[.08] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-[rgba(187,255,31,.5)] focus:shadow-[0_0_0_3px_rgba(187,255,31,.08)]" /></label>
            {error && <div role="alert" className="rounded-[16px] border border-rose-400/15 bg-rose-400/[.07] p-3 text-center text-xs text-rose-200">{error}</div>}
            <button type="submit" disabled={loading} aria-busy={loading} className="w-full rounded-[18px] bg-pr-lime px-4 py-3.5 text-[11px] font-black uppercase tracking-[.12em] text-pr-black shadow-[0_10px_28px_rgba(187,255,31,.12)] disabled:opacity-50">{loading?'INGRESANDO…':'ENTRAR A MI PR →'}</button>
          </form>
          <Link to="/" className="mt-6 text-center text-xs text-white/25">Volver al sitio público</Link>
        </div>
      </div>
    </PublicLayout>
  )
}
