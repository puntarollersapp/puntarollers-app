import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { useAuth } from '../lib/auth'
import { transitionDestination } from '../lib/prTransition'
import { isRollerweenActive } from '../lib/rollerween'

const ROLLERWEEN_ART='/rollerween-logo-original-20261001-r2.png?v=original-r2'

export default function Login() {
  const [documento, setDocumento] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, logout, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const destination = next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\\\') ? next : '/app/perfil'
  const rollerween = isRollerweenActive()

  useEffect(() => {
    if (authLoading || !user) return
    if(user.role==='familiar'&&!user.accesoHabilitado){logout();return}
    navigate(transitionDestination(user, destination), { replace: true })
  }, [authLoading, user, navigate, destination, next])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(documento, pin)
      if (result?.error) { setError(result.error); return }
      if(result?.user?.role==='familiar'&&!result?.user?.accesoHabilitado){await logout();setError('Tu solicitud familiar está pendiente de aprobación. Te avisaremos cuando puedas ingresar.');return}
      if (result?.user?.role!=='familiar' && result?.user?.id && (!['admin','profesor'].includes(result?.user?.role) || result?.user?.documento === '48036677')) {
        const { data: training } = await (await import('../lib/supabase')).supabase
          .from('pr_training_enrollments')
          .select('category')
          .eq('profile_id', result.user.id)
          .eq('event_slug','shifter-marathon-2026')
          .maybeSingle()
        if (training?.category && training.category !== 'NO') window.localStorage.setItem('pr_training_visible','1')
        else if (training?.category === 'NO') window.localStorage.removeItem('pr_training_visible')
      }
      navigate(transitionDestination(result.user, destination), { replace: true })
    } catch {
      setError('No pudimos iniciar sesión. Revisá tus datos.')
    } finally { setLoading(false) }
  }

  if (authLoading || user) return null
 return <PublicLayout><div className="relative min-h-[calc(100vh-70px)] overflow-hidden px-5 py-8" style={{background:'radial-gradient(circle at 50% 8%,rgba(187,255,31,.065),transparent 31%),linear-gradient(180deg,rgba(239,248,255,.025),transparent 42%)'}}><div className="relative mx-auto flex min-h-[calc(100vh-134px)] max-w-md flex-col justify-center"><section className="mb-6 text-center"><img src="https://beta.puntarollers.com/pr-beta-logo.png" alt="Punta Rollers PR NEXT" className="mx-auto h-auto w-[150px] max-w-[48vw] object-contain"/><p className="mt-4 font-mono text-[8px] font-black uppercase tracking-[.24em] text-white/45">PR NEXT · NUEVA ERA</p><h1 className="mt-2 font-display text-[38px] leading-none text-white">Tu Punta Rollers.<br/><span className="text-pr-lime">Más vos que nunca.</span></h1><p className="mx-auto mt-3 max-w-[300px] text-sm leading-5 text-white/40">Entrá a tu perfil, entrenamiento, comunidad y todo lo nuevo de PR.</p></section><form onSubmit={handleSubmit} className="space-y-4 rounded-[30px] border border-[rgba(255,0,85,.16)] bg-[#10090c] p-5 shadow-[0_20px_60px_rgba(0,0,0,.4)]"><label className="block"><span className="font-mono text-[9px] uppercase tracking-[.2em] text-white/50">DOCUMENTO</span><input value={documento} onChange={e=>setDocumento(e.target.value)} inputMode="numeric" placeholder="Ej: 12345678" className="input-pr mt-2"/></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-[.2em] text-white/50">PIN PERSONAL</span><input value={pin} onChange={e=>setPin(e.target.value)} type="password" inputMode="numeric" placeholder="Ingresá tu PIN" className="input-pr mt-2"/></label>{error&&<div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300 text-xs text-center">{error}</div>}<button type="submit" disabled={loading} className="w-full rounded-[18px] bg-pr-lime px-5 py-4 text-[11px] font-black uppercase tracking-[.12em] text-pr-black disabled:opacity-50">{loading?'INGRESANDO…':'ENTRAR A MI PR →'}</button></form></div></div></PublicLayout>
}
