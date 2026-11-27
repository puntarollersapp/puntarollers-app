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
  return (
    <PublicLayout>
      <main className="pr-summer-login">
        <div className="psl-atmosphere" aria-hidden="true"><i/><i/><i/></div>
        <div className="psl-shell">
          <section className="psl-hero">
            <div className="psl-edition"><span className="psl-sun" aria-hidden="true"/> SUMMER SEASON <span className="psl-edition-sep">/</span> 26—27</div>
            <div className="psl-emblem">
              <div className="psl-orbit" aria-hidden="true"/>
              <img src="/premios/logo-pr-sunset.png" alt="Punta Rollers" width="164" height="164" onError={e=>{if(!e.currentTarget.src.endsWith('/logo.png'))e.currentTarget.src='/logo.png'}}/>
            </div>
            <p className="psl-kicker">PR NEXT · TU UNIVERSO SOBRE RUEDAS</p>
            <h1><span>Tu Punta Rollers.</span><strong>Más vos que nunca.</strong></h1>
            <p className="psl-description">Entrá a tu perfil, entrenamiento, comunidad y todo lo nuevo de PR.</p>
          </section>
          <form onSubmit={handleSubmit} className="psl-form">
            <div className="psl-form-heading"><span>01 / MI PR</span><span className="psl-live"><i aria-hidden="true"/> ACCESO PERSONAL</span></div>
            <label className="psl-field">
              <span>DOCUMENTO</span>
              <span className="psl-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M5.8 16c0-3.5 6.4-3.5 6.4 0M15 10h3m-3 4h3"/></svg>
                <input value={documento} onChange={e=>setDocumento(e.target.value)} inputMode="numeric" placeholder="Ej: 12345678" autoComplete="username" className="psl-input"/>
              </span>
            </label>
            <label className="psl-field">
              <span>PIN PERSONAL</span>
              <span className="psl-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></svg>
                <input value={pin} onChange={e=>setPin(e.target.value)} type="password" inputMode="numeric" placeholder="Ingresá tu PIN" autoComplete="current-password" className="psl-input"/>
              </span>
            </label>
            {error&&<div role="alert" className="psl-error">{error}</div>}
            <button type="submit" disabled={loading} className="psl-submit"><span>{loading?'INGRESANDO…':'ENTRAR A MI PR'}</span>{!loading&&<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>}</button>
          </form>
          <div className="psl-footer"><span>PUNTA DEL ESTE · MALDONADO</span><span>ROLL INTO 2027.</span></div>
        </div>
        <style>{`
          .pr-summer-login{position:relative;isolation:isolate;overflow:hidden;min-height:calc(100vh - 82px);min-height:calc(100svh - 82px);display:grid;align-items:center;padding:22px 18px 24px;color:#f3f1ec;background:radial-gradient(ellipse at 92% 9%,#a44b375c,transparent 44%),radial-gradient(ellipse at 2% 56%,#752d3a38,transparent 48%),linear-gradient(160deg,#20171e 0%,#101116 48%,#14151a 100%)}
          .pr-summer-login *{box-sizing:border-box}
          .psl-atmosphere{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
          .psl-atmosphere:before{content:'';position:absolute;width:470px;height:300px;right:-210px;top:-55px;border-radius:50%;background:radial-gradient(ellipse,#ffaf6475,transparent 68%);animation:pslAmbient 9s ease-in-out infinite}
          .psl-atmosphere i{position:absolute;width:125%;height:230px;left:-8%;top:6%;border-radius:50%;border-top:1px solid #ffb0714d;transform:rotate(-24deg)}
          .psl-atmosphere i:nth-child(2){top:10%;border-color:#ff795d29;transform:rotate(-18deg)}
          .psl-atmosphere i:nth-child(3){top:14%;border-color:#ffdb9c21;transform:rotate(-12deg)}
          .psl-shell{width:min(100%,440px);margin:0 auto;position:relative}
          .psl-hero{text-align:center;margin-bottom:22px}
          .psl-edition{display:inline-flex;align-items:center;gap:8px;border:1px solid #ffb17c55;background:#ffad7012;padding:6px 10px;border-radius:100px;color:#ffd2a8;font-size:10px;font-weight:850;letter-spacing:.11em;line-height:1.35}
          .psl-edition-sep{opacity:.5}.psl-sun{display:inline-block;width:9px;height:9px;border-radius:50%;background:#ffbb72;box-shadow:0 0 12px #ff9e60}
          .psl-emblem{position:relative;isolation:isolate;display:grid;place-items:center;margin:12px auto 8px;width:156px;height:144px}
          .psl-emblem img{position:relative;z-index:1;width:144px;height:144px;object-fit:contain;filter:drop-shadow(0 8px 19px #e8754b45);animation:pslLogo 5s ease-in-out infinite}
          .psl-orbit{position:absolute;width:164px;height:70px;border:1px solid #ffb16c40;border-radius:50%;transform:rotate(-24deg);box-shadow:0 0 30px #ff99541a}
          .psl-kicker{font-size:9px;letter-spacing:.17em;font-weight:800;color:#eab99e;margin-top:7px}
          .psl-hero h1{margin:10px 0 0;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-weight:900;line-height:1.07;letter-spacing:-.035em;overflow:visible}
          .psl-hero h1 span,.psl-hero h1 strong{display:block;padding:0 3px 3px}
          .psl-hero h1 span{font-size:clamp(29px,8.7vw,44px);color:#f3f1ec}
          .psl-hero h1 strong{font-size:clamp(30px,9.1vw,46px);font-weight:900;color:#ffb06c;background:linear-gradient(105deg,#ffe0a0,#ffae6a 45%,#ff765e 85%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
          .psl-description{color:#c7bfc0;font-size:13px;line-height:1.55;max-width:310px;margin:10px auto 0}
          .psl-form{position:relative;isolation:isolate;display:flex;flex-direction:column;gap:14px;border:1px solid transparent;border-radius:25px;padding:19px 17px;background:linear-gradient(145deg,#221d23,#13151a 60%) padding-box,linear-gradient(125deg,#ffb17b99,#ffffff13 52%,#fa78576e) border-box;box-shadow:0 16px 45px #0006,inset 0 1px 0 #fff0;overflow:hidden}
          .psl-form-heading{display:flex;justify-content:space-between;gap:6px;align-items:center;color:#ffbf90;font-size:9px;font-weight:850;letter-spacing:.12em;padding-bottom:11px;border-bottom:1px solid #ffffff12}
          .psl-live{color:#bfb8b5;display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:8px}
          .psl-live i{display:block;width:6px;height:6px;border-radius:50%;background:#d6fb81;box-shadow:0 0 8px #c8f65c88}
          .psl-field{display:block;min-width:0}
          .psl-field>span:first-child{display:block;color:#e4d6cd;font-size:10px;letter-spacing:.12em;font-weight:750;margin-bottom:7px}
          .psl-input-wrap{display:flex;align-items:center;gap:10px;border:1px solid #ffffff26;border-radius:13px;min-height:52px;padding:0 13px;background:#0c0e1375;transition:border-color .2s,box-shadow .2s}
          .psl-input-wrap:focus-within{border-color:#ffb37c;box-shadow:0 0 0 3px #ffb37c20}
          .psl-input-wrap svg{width:20px;height:20px;flex:none;color:#ffc095}
          .psl-input{display:block;width:100%;min-width:0;min-height:50px;border:0!important;background:transparent!important;color:#fff!important;font:inherit;font-size:16px;outline:none;padding:0;box-shadow:none!important;border-radius:0;caret-color:#ffb17a}
          .psl-input::placeholder{color:#9c989b;opacity:1}
          .psl-input:-webkit-autofill{-webkit-text-fill-color:#f3f1ec!important;box-shadow:0 0 0 1000px #1b1b20 inset!important}
          .psl-error{border:1px solid #ff77774d;background:#fb515119;color:#ffc0c0;padding:12px;border-radius:12px;text-align:center;font-size:12px;line-height:1.5}
          .psl-submit{position:relative;display:flex;align-items:center;justify-content:center;gap:12px;min-height:54px;padding:13px 16px;border:0;border-radius:14px;background:linear-gradient(110deg,#ffe0a0,#ffb16b 55%,#ff8969);color:#20151a;box-shadow:0 5px 20px #ff945b30;font-size:13px;font-weight:900;letter-spacing:.09em;cursor:pointer;transition:transform .2s,box-shadow .2s}
          .psl-submit svg{width:21px;height:21px;flex:none}
          .psl-submit:active:not(:disabled){transform:scale(.985)}.psl-submit:focus-visible{outline:2px solid #f3f1ec;outline-offset:4px}.psl-submit:disabled{opacity:.55;cursor:wait}
          .psl-footer{display:flex;justify-content:space-between;gap:8px;margin-top:15px;color:#aaa0a1;font-size:8px;font-weight:800;letter-spacing:.09em}.psl-footer span:last-child{color:#ffbe91}
          @keyframes pslAmbient{50%{opacity:.62;transform:translate(-12px,12px)}}
          @keyframes pslLogo{50%{transform:translateY(-3px)}}
          @media(max-width:350px){.pr-summer-login{padding:16px 12px 18px}.psl-emblem{height:126px}.psl-emblem img{width:126px;height:126px}.psl-hero{margin-bottom:16px}.psl-form{padding:15px 13px;gap:12px}.psl-hero h1 span{font-size:29px}.psl-hero h1 strong{font-size:30px}}
          @media(min-width:760px){.pr-summer-login{padding:32px 24px}.psl-hero{margin-bottom:26px}.psl-emblem{width:178px;height:166px}.psl-emblem img{width:166px;height:166px}.psl-form{padding:24px}}
          @media(prefers-reduced-motion:reduce){.pr-summer-login *,.pr-summer-login *:before,.pr-summer-login *:after{animation:none!important;transition:none!important}}
        `}</style>
      </main>
    </PublicLayout>
  )
}
