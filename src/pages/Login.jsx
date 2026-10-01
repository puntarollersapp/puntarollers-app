import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { useAuth } from '../lib/auth'
import { isRollerweenActive } from '../lib/rollerween'

export default function Login() {
  const [documento, setDocumento] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const rollerween = isRollerweenActive()

  // Regla única de entrada: cada integrante aterriza primero en SU perfil.
  // Los permisos (Admin / Tesorería / Profesor) viven dentro de la experiencia,
  // pero ya no secuestran el destino del login.
  useEffect(() => {
    if (authLoading || !user) return
    navigate('/app/perfil', { replace: true })
  }, [authLoading, user, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(documento, pin)
      if (result?.error) { setError(result.error); return }

      // El selector Shifter sigue siendo responsabilidad de Deberes; no debe
      // interrumpir el ingreso. El perfil es siempre la portada personal.
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
      navigate('/app/perfil', { replace: true })
    } catch {
      setError('No pudimos iniciar sesión. Revisá tus datos.')
    } finally { setLoading(false) }
  }

  if (authLoading || user) return null
  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-70px)] px-5 py-8 max-w-md mx-auto flex flex-col justify-center">
        <section className="text-center mb-8 animate-fade-up">
          <div className={rollerween?'pr-rw-pumpkin-wheel mx-auto scale-[.9]':'w-20 h-20 mx-auto rounded-[26px] grid place-items-center bg-pr-gold/10 border border-pr-gold/20 shadow-[0_20px_55px_rgba(0,0,0,.35)]'}>{rollerween?<img src="/logo.png" alt="Punta Rollers" className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 object-contain brightness-0 invert"/>:<img src="/logo.png" alt="Punta Rollers" className="w-14 h-14 object-contain" />}</div>
          <p className={rollerween?'pr-rw-kicker mt-7':'section-label mt-6'}>{rollerween?'OCT.01—31 · SEASON 2026':'PuntaRollers.app'}</p>
          <h1 className={rollerween?'pr-rw-title pr-rw-glitch mt-2 text-[45px] text-white':'font-display text-[38px] leading-none text-white mt-2'}>{rollerween?<>ENTER <span className="pr-rw-purple">ROLLERWEEN.</span></>:'Tu club, en tu bolsillo.'}</h1>
          <p className="text-white/40 text-sm mt-3 max-w-[290px] mx-auto">{rollerween?'Octubre se vive sobre ruedas. Entrá a tu PR para ver desafíos, preparación y todo lo que se viene.':'Ingresá para ver tu perfil, progreso, beneficios y vida dentro de PR.'}</p>
        </section>
        <form onSubmit={handleSubmit} className="pr-panel p-5 space-y-4 animate-fade-up stagger-1">
          <label className="block"><span className="section-label">Documento</span><input value={documento} onChange={e=>setDocumento(e.target.value)} inputMode="numeric" placeholder="Ej: 12345678" className="input-pr mt-2" /></label>
          <label className="block"><span className="section-label">PIN personal</span><input value={pin} onChange={e=>setPin(e.target.value)} type="password" inputMode="numeric" placeholder="Ingresá tu PIN" className="input-pr mt-2" /></label>
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300 text-xs text-center">{error}</div>}
          <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-50">{loading?'Ingresando…':rollerween?'ENTRAR A ROLLERWEEN →':'Ingresar a mi cuenta'}</button>
        </form>
        <Link to="/" className="text-center text-white/30 text-xs mt-6">Volver al sitio público</Link>
      </div>
    </PublicLayout>
  )
}
