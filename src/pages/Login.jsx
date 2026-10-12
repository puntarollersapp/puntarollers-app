import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { useAuth } from '../lib/auth'
const UPDATE_ART='/profile-badge.png'

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
        <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(circle at 15% 12%,rgba(0,229,255,.16),transparent 30%),radial-gradient(circle at 85% 78%,rgba(139,92,255,.22),transparent 35%),radial-gradient(circle at 70% 20%,rgba(255,61,200,.09),transparent 22%)'}}/>
        <div className="relative mx-auto flex min-h-[calc(100vh-134px)] max-w-md flex-col justify-center">
          <section className="mb-6 text-center animate-fade-up">
            <img src={UPDATE_ART} alt="Punta Rollers" className="mx-auto h-auto w-[150px] max-w-[48vw] object-contain drop-shadow-[0_0_26px_rgba(0,229,255,.18)]"/>
            <p className="mt-4 font-mono text-[8px] font-black uppercase tracking-[.24em] text-cyan-200/60">PR NEXT · NUEVA ERA</p>
            <h1 className="mt-2 font-display text-[38px] leading-none text-white">Tu Punta Rollers.<br/><span className="bg-gradient-to-r from-[#00E5FF] via-[#A36BFF] to-[#FF3DC8] bg-clip-text text-transparent">Más vos que nunca.</span></h1>
            <p className="mx-auto mt-3 max-w-[300px] text-sm leading-5 text-white/40">Entrá a tu perfil, entrenamiento, comunidad y todo lo nuevo de PR.</p>
          </section>
          <form onSubmit={handleSubmit} className="space-y-4 rounded-[30px] border border-cyan-200/[.10] bg-[#090A16]/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,.45),0_0_55px_rgba(96,64,255,.07)] backdrop-blur-xl animate-fade-up stagger-1">
            <label className="block"><span className="font-mono text-[8px] font-black uppercase tracking-[.18em] text-cyan-100/45">Documento</span><input value={documento} onChange={e=>setDocumento(e.target.value)} inputMode="numeric" placeholder="Ej: 12345678" className="mt-2 w-full rounded-[17px] border border-white/[.08] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-cyan-300/35 focus:shadow-[0_0_24px_rgba(0,229,255,.08)]" /></label>
            <label className="block"><span className="font-mono text-[8px] font-black uppercase tracking-[.18em] text-violet-100/45">PIN personal</span><input value={pin} onChange={e=>setPin(e.target.value)} type="password" inputMode="numeric" placeholder="Ingresá tu PIN" className="mt-2 w-full rounded-[17px] border border-white/[.08] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-violet-300/35 focus:shadow-[0_0_24px_rgba(139,92,255,.08)]" /></label>
            {error && <div className="rounded-[16px] border border-rose-400/15 bg-rose-400/[.07] p-3 text-center text-xs text-rose-200">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-[18px] bg-gradient-to-r from-[#00CFE8] via-[#7357FF] to-[#D93CFF] px-4 py-3.5 text-[11px] font-black uppercase tracking-[.12em] text-white shadow-[0_12px_35px_rgba(83,74,255,.22)] disabled:opacity-50">{loading?'INGRESANDO…':'ENTRAR A MI PR →'}</button>
          </form>
          <Link to="/" className="mt-6 text-center text-xs text-white/25">Volver al sitio público</Link>
        </div>
      </div>
    </PublicLayout>
  )
}
