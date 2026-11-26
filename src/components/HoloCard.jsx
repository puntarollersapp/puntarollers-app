import { useCallback, useEffect, useRef, useState } from 'react'

export const RARITIES = {
  plata: { label: 'COMÚN', accent: '#cfd3dc', foil: 0.28 },
  holo: { label: 'HOLO', accent: '#ff0055', foil: 0.55 },
  oro: { label: 'ÉPICA', accent: '#f5c451', foil: 0.6 },
  prisma: { label: 'LEGENDARIA', accent: '#9b7bff', foil: 0.7 },
  navidad: { label: 'NAVIDAD', accent: '#ff3d6e', foil: 0.62 },
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
export async function requestMotionPermission() {
  try {
    const D = window.DeviceOrientationEvent
    if (D && typeof D.requestPermission === 'function') return (await D.requestPermission()) === 'granted'
    return typeof D !== 'undefined'
  } catch { return false }
}
export const motionNeedsPermission = () => typeof window !== 'undefined' && typeof window.DeviceOrientationEvent?.requestPermission === 'function'

export default function HoloCard({
  rarity = 'holo', title, subtitle, number, total, art, emoji, artFit = 'contain', stats = [],
  footer = 'PUNTA ROLLERS', locked = false, flipped = false, back = null, sensor = false,
  size = 'grid', onClick, className = '',
}) {
  const ref = useRef(null)
  const raf = useRef(0)
  const [active, setActive] = useState(false)
  const r = RARITIES[rarity] || RARITIES.holo
  const setVars = useCallback((nx, ny) => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--mx', String(clamp((nx + 1) / 2, 0, 1)))
      el.style.setProperty('--my', String(clamp((ny + 1) / 2, 0, 1)))
      el.style.setProperty('--rx', clamp(-ny, -1, 1) * 11 + 'deg')
      el.style.setProperty('--ry', clamp(nx, -1, 1) * 13 + 'deg')
    })
  }, [])
  const reset = useCallback(() => setVars(0, 0), [setVars])
  const onPointerMove = useCallback((e) => {
    if (locked || reduced() || size !== 'large') return
    const b = ref.current?.getBoundingClientRect()
    if (!b || !b.width || !b.height) return
    setVars(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1)
  }, [setVars, locked, size])
  useEffect(() => {
    if (!sensor || locked || reduced() || size !== 'large') return undefined
    const h = (e) => {
      if (e.gamma == null || e.beta == null || reduced()) return
      setVars(clamp(e.gamma / 30, -1, 1), clamp((e.beta - 45) / 30, -1, 1))
    }
    window.addEventListener('deviceorientation', h)
    return () => window.removeEventListener('deviceorientation', h)
  }, [sensor, locked, setVars, size])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const interactive = typeof onClick === 'function'
  const label = locked ? 'Carta bloqueada: ' + title : 'Carta ' + r.label.toLowerCase() + ': ' + title + (subtitle ? ', ' + subtitle : '')
  const onKey = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } }
  return (
    <div ref={ref}
      className={['pr-holo', size === 'large' ? 'pr-holo--large' : '', size === 'large' && (active || sensor) ? 'is-active' : '', locked ? 'is-locked' : '', flipped ? 'is-flipped' : '', className].join(' ')}
      style={{ '--accent': locked ? '#5b5d66' : r.accent, '--foil': locked ? 0 : r.foil }}
      data-rarity={rarity} tabIndex={interactive ? 0 : undefined} role={interactive ? 'button' : undefined} aria-label={label}
      onClick={onClick} onKeyDown={onKey}
      onPointerEnter={() => setActive(true)} onPointerMove={onPointerMove}
      onPointerLeave={() => { setActive(false); reset() }} onPointerDown={() => setActive(true)}
      onPointerCancel={() => { setActive(false); reset() }} onFocus={() => setActive(true)} onBlur={() => { setActive(false); reset() }}>
      <div className="pr-holo-tilt">
        <div className="pr-holo-side pr-holo-front" aria-hidden={flipped}>
          <div className="pr-holo-face">
            <div className="pr-holo-top"><span className="pr-holo-rarity">{locked ? 'BLOQUEADA' : r.label}</span>{number != null && <span className="pr-holo-num">{String(number).padStart(2, '0')}{total ? '/' + String(total).padStart(2, '0') : ''}</span>}</div>
            <div className="pr-holo-art">{locked ? <span className="pr-holo-lock" aria-hidden="true">?</span> : art ? <img src={art} alt="" loading="lazy" decoding="async" draggable="false" style={{ objectFit: artFit }} /> : <span className="pr-holo-emoji" aria-hidden="true">{emoji || '⚡'}</span>}</div>
            <div className="pr-holo-body"><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}{stats.length > 0 && <dl className="pr-holo-stats">{stats.map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>}</div>
            <div className="pr-holo-foot">{footer}</div>
          </div>
          {!locked && <><div className="pr-holo-foil" aria-hidden="true"/><div className="pr-holo-glare" aria-hidden="true"/></>}
        </div>
        <div className="pr-holo-side pr-holo-backside" aria-hidden={!flipped}>
          <div className="pr-holo-face pr-holo-backface"><div className="pr-holo-top"><span className="pr-holo-rarity">{locked ? 'BLOQUEADA' : r.label}</span><span className="pr-holo-num">PR</span></div><div className="pr-holo-backbody">{back}</div><div className="pr-holo-foot">{footer}</div></div>
        </div>
      </div>
    </div>
  )
}

export const HOLO_CSS = `
.pr-holo{--mx:.5;--my:.5;--rx:0deg;--ry:0deg;--w:min(44vw,190px);width:var(--w);max-width:100%;aspect-ratio:5/7;perspective:900px;outline:none;touch-action:pan-y;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.pr-holo--large{--w:min(78vw,310px);margin:0 auto;touch-action:none}
.pr-holo[role="button"]{cursor:pointer}
.pr-holo:focus-visible .pr-holo-face{outline:2px solid #fff;outline-offset:2px}
.pr-holo-tilt{position:relative;width:100%;height:100%;border-radius:22px;transform-style:preserve-3d;transform:rotateX(var(--rx)) rotateY(calc(var(--ry) + var(--flip,0deg)));transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.pr-holo.is-flipped{--flip:180deg;touch-action:pan-y}
.pr-holo.is-active .pr-holo-tilt{transition:transform .08s linear;will-change:transform}
.pr-holo-side{position:absolute;inset:0;border-radius:22px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.pr-holo-backside{transform:rotateY(180deg)}
.pr-holo-face{position:absolute;inset:0;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;color:#F3F1EC;background:radial-gradient(120% 80% at 50% 0%,color-mix(in srgb,var(--accent) 34%,#191A20) 0%,#191A20 62%);border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);box-shadow:0 18px 40px -18px rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.05)}
.pr-holo--large .pr-holo-face{font-size:1em}
.pr-holo:not(.pr-holo--large) .pr-holo-body h3{font-size:13px}
.pr-holo:not(.pr-holo--large) .pr-holo-body p{font-size:9px}
.pr-holo:not(.pr-holo--large) .pr-holo-stats{display:none}
.pr-holo:not(.pr-holo--large) .pr-holo-emoji{font-size:54px}
.pr-holo:not(.pr-holo--large) .pr-holo-top{font-size:8px;padding:10px 10px 0}
.pr-holo:not(.pr-holo--large) .pr-holo-foot{font-size:6px;padding:7px 10px 9px}
.pr-holo:not(.pr-holo--large) .pr-holo-body{padding:6px 10px 0}
.pr-holo:not(.pr-holo--large) .pr-holo-art{margin:8px 10px 0}
.pr-holo-top{display:flex;justify-content:space-between;align-items:center;padding:12px 14px 0;font:800 10px/1 ui-monospace,monospace;letter-spacing:.2em}
.pr-holo-rarity{color:var(--accent)}.pr-holo-num{opacity:.6}
.pr-holo-art{flex:1;min-height:0;margin:10px 14px 0;border-radius:14px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(160deg,rgba(255,255,255,.1),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08)}
.pr-holo-art img{width:100%;height:100%;min-height:0;padding:6px;box-sizing:border-box;transform:translateZ(30px)}
.pr-holo-emoji{font-size:84px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.55))}
.pr-holo-lock{font:900 64px/1 system-ui,sans-serif;opacity:.25}
.pr-holo.is-locked .pr-holo-face{filter:grayscale(1);opacity:.7}
.pr-holo-body{padding:10px 14px 0}
.pr-holo-body h3{margin:0;font:900 20px/1.05 system-ui,sans-serif;letter-spacing:-.01em;text-transform:uppercase;overflow-wrap:anywhere}
.pr-holo-body p{margin:4px 0 0;font:600 11px/1.3 system-ui,sans-serif;opacity:.7}
.pr-holo-stats{display:flex;gap:8px;margin:8px 0 0}
.pr-holo-stats div{flex:1;border-radius:10px;background:rgba(255,255,255,.06);padding:6px 8px;min-width:0}
.pr-holo-stats dt{font:700 8px/1 ui-monospace,monospace;letter-spacing:.16em;opacity:.55}
.pr-holo-stats dd{margin:3px 0 0;font:900 14px/1.1 system-ui,sans-serif;overflow-wrap:anywhere}
.pr-holo-foot{padding:10px 14px 12px;font:800 8px/1 ui-monospace,monospace;letter-spacing:.24em;opacity:.4}
.pr-holo-backbody{flex:1;min-height:0;overflow:auto;padding:14px;font:500 13px/1.5 system-ui,sans-serif;display:flex;flex-direction:column;gap:10px}
.pr-holo-backbody h4{margin:0;font:900 17px/1.1 system-ui,sans-serif;text-transform:uppercase}
.pr-holo-backbody p{margin:0;opacity:.78}
.pr-holo-backbody small{opacity:.5;font:700 10px/1.4 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
.pr-holo-foil,.pr-holo-glare{position:absolute;inset:0;border-radius:22px;pointer-events:none}
.pr-holo-foil{opacity:calc(var(--foil) * .55);mix-blend-mode:screen;background:repeating-linear-gradient(115deg,rgba(255,0,85,.6) 0%,rgba(255,196,60,.55) 14%,rgba(60,255,184,.5) 28%,rgba(60,140,255,.55) 42%,rgba(190,80,255,.55) 56%,rgba(255,0,85,.6) 70%);background-size:260% 260%;background-position:calc(var(--mx) * 100%) calc(var(--my) * 100%)}
.pr-holo.is-active .pr-holo-foil{opacity:var(--foil);mix-blend-mode:color-dodge;transition:opacity .2s}
.pr-holo-glare{opacity:0;mix-blend-mode:overlay;background:radial-gradient(circle at calc(var(--mx) * 100%) calc(var(--my) * 100%),rgba(255,255,255,.75),transparent 46%)}
.pr-holo.is-active .pr-holo-glare{opacity:.75}
.pr-holo[data-rarity="prisma"] .pr-holo-foil,.pr-holo[data-rarity="oro"] .pr-holo-foil,.pr-holo[data-rarity="navidad"] .pr-holo-foil{background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,.35) 1px,transparent 1.6px),repeating-linear-gradient(115deg,rgba(255,0,85,.6) 0%,rgba(255,196,60,.55) 14%,rgba(60,255,184,.5) 28%,rgba(60,140,255,.55) 42%,rgba(190,80,255,.55) 56%,rgba(255,0,85,.6) 70%);background-size:7px 7px,260% 260%}
.pr-holo[data-rarity="plata"] .pr-holo-foil{filter:grayscale(1)}
.pr-holo[data-rarity="navidad"]:not(.is-locked) .pr-holo-face::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 20% 15%,rgba(255,255,255,.9) 0 1.2px,transparent 2px),radial-gradient(circle at 78% 30%,rgba(255,255,255,.8) 0 1px,transparent 2px),radial-gradient(circle at 60% 78%,rgba(255,255,255,.8) 0 1.2px,transparent 2px),radial-gradient(circle at 12% 70%,rgba(255,255,255,.7) 0 1px,transparent 2px);opacity:.7}
@media (prefers-reduced-motion:reduce){.pr-holo-tilt{transform:rotateY(var(--flip,0deg))!important;transition:none}.pr-holo-foil{mix-blend-mode:screen!important;opacity:calc(var(--foil) * .45)!important}.pr-holo-glare{display:none}}
`
