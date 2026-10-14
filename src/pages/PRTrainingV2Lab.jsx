import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'

const levels = [
  { code: 'B1', label: 'Fundamentos', detail: 'Control, equilibrio y frenadas' },
  { code: 'B2', label: 'Desarrollo', detail: 'Técnica y confianza' },
  { code: 'B3', label: 'Progresión', detail: 'Resistencia y precisión' },
  { code: 'B4', label: 'Rendimiento', detail: 'Desafíos de mayor exigencia' },
]
const sampleSteps = ['Descubrí tus deberes', 'Entrená a tu ritmo', 'Enviá tu evidencia', 'Recibí la revisión']
const wheelColors = ['#BBFF1F','#0D0303','#FF0055','#EFF8FF','#BBFF1F','#0D0303','#FF0055','#EFF8FF']
const demoTasks = ['Control y equilibrio','Frenada en T','Técnica de giro','Resistencia','Patinaje hacia atrás','Precisión y postura']
function SpinWheel() {
  const [stage,setStage]=useState('idle')
  const [revealed,setRevealed]=useState([])
  const [angle,setAngle]=useState(0)
  const timer=useRef(null)
  const run=useRef(false)
  useEffect(()=>()=>{run.current=false;if(timer.current)clearTimeout(timer.current)},[])
  function start(){
    if(run.current||stage==='done')return
    run.current=true
    setRevealed([])
    setStage('spinning')
    const reveal=(index,rotation)=>{
      if(!run.current)return
      if(index>=6){run.current=false;setStage('done');return}
      const sector=(index*3+1)%8
      const next=rotation+1800+((360-(rotation%360))%360)+((8-sector)%8)*45
      setAngle(next)
      timer.current=setTimeout(()=>{
        if(!run.current)return
        setRevealed(prev=>[...prev,demoTasks[index]])
        timer.current=setTimeout(()=>reveal(index+1,next),620)
      },1950)
    }
    reveal(0,angle)
  }
  const segments=wheelColors.map((color,i)=>{
    const a=(-90+i*45)*Math.PI/180,b=(-90+(i+1)*45)*Math.PI/180
    const x=t=>180+145*Math.cos(t),y=t=>180+145*Math.sin(t)
    return <path key={i} d={`M 180 180 L ${x(a)} ${y(a)} A 145 145 0 0 1 ${x(b)} ${y(b)} Z`} fill={color} stroke="#0B0B0B" strokeWidth="8"/>
  })
  return <div className="w-full">
    <div className="relative mx-auto w-full max-w-[390px]">
      <svg viewBox="0 0 360 370" className="w-full overflow-visible" role="img" aria-label="Ruleta PR SPIN de ocho segmentos, verde lima, negro, rosa eléctrico y blanco hielo">
        <defs>
          <radialGradient id="prSpinGloss"><stop offset="35%" stopColor="#FFFFFF" stopOpacity="0"/><stop offset="83%" stopColor="#FFFFFF" stopOpacity=".10"/><stop offset="100%" stopColor="#000000" stopOpacity=".30"/></radialGradient>
          <filter id="prSpinGlow"><feGaussianBlur stdDeviation="8"/></filter>
          <linearGradient id="prSpinHub" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#EFF8FF"/><stop offset="1" stopColor="#AEB6BC"/></linearGradient>
        </defs>
        <circle cx="180" cy="180" r="151" fill="#BBFF1F" opacity=".16" filter="url(#prSpinGlow)"/>
        <g style={{transform:`rotate(${angle}deg)`,transformOrigin:'180px 180px',transition:'transform 1.95s cubic-bezier(.12,.72,.15,1)'}}>
          {segments}
          <circle cx="180" cy="180" r="141" fill="url(#prSpinGloss)" pointerEvents="none"/>
          {wheelColors.map((color,i)=>{
            const a=(-67.5+i*45)*Math.PI/180
            const x=180+101*Math.cos(a),y=180+101*Math.sin(a)
            const light=color==='#EFF8FF'||color==='#BBFF1F'
            return <g key={i} transform={`translate(${x} ${y})`}><circle r="21" fill={light?'#0D0303':'#EFF8FF'} opacity=".14"/><circle r="15" fill={light?'#0D0303':'#EFF8FF'} opacity=".86"/><text y="5" textAnchor="middle" fontSize="13" fontWeight="900" fill={light?'#EFF8FF':'#0D0303'}>{['✦','01','✧','02','✦','03','✧','04'][i]}</text></g>
          })}
        </g>
        <circle cx="180" cy="180" r="65" fill="#0D0303" stroke="#0D0303" strokeWidth="8"/>
        <circle cx="180" cy="180" r="56" fill="url(#prSpinHub)" stroke="#EFF8FF" strokeWidth="2"/>
        <text x="180" y="193" textAnchor="middle" fontWeight="1000" fontSize="47" letterSpacing="-4" fill="#0D0303">PR</text>
        <path d="M 165 13 Q 180 7 195 13 L 180 42 Z" fill="#BBFF1F" stroke="#EFF8FF" strokeWidth="2"/>
      </svg>
    </div>
    <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[.18em] text-white/50">{stage==='done'?'Revelación de muestra completa':stage==='spinning'?'Revelando desafíos…':'Diseño interactivo · vista de prueba'}</p>
    <div className="mt-5 grid grid-cols-3 gap-2" aria-live="polite">{Array.from({length:6},(_,i)=><div key={i} className={`min-h-[64px] rounded-xl border p-3 text-center ${revealed[i]?'border-[#BBFF1F]/50 bg-[#BBFF1F]/10':'border-white/10 bg-white/5'}`}><p className="text-[10px] font-black text-[#BBFF1F]">{String(i+1).padStart(2,'0')}</p><p className="mt-1 text-xs font-semibold leading-tight text-white">{revealed[i]||'Por revelar'}</p></div>)}</div>
    <button type="button" onClick={start} disabled={stage==='spinning'} className="mt-5 w-full rounded-full bg-[#BBFF1F] px-5 py-4 text-sm font-black uppercase tracking-wider text-[#0D0303] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{stage==='done'?'Revelación completada':stage==='spinning'?'Girando…':'Probar animación'}</button>
    <p className="mt-3 text-center text-xs leading-5 text-white/50">Simulación de diseño: los deberes mostrados son ejemplos. No se asignan ni guardan tareas reales.</p>
  </div>
}
const staffIds = new Set(['admin-claudio', 'profe-david', 'alumno-48812609'])

export default function PRTrainingV2Lab() {
  const { user, loading } = useAuth()
  const [section, setSection] = useState('experiencia')
  if (loading) return <AppLayout><div className="mx-auto max-w-5xl px-5 py-20 text-white/70">Cargando PR Training…</div></AppLayout>
  if (!user) return <Navigate to="/login" replace />
  // Página de trabajo cerrada: no basta con conocer la URL para acceder.
  if (!staffIds.has(user.id)) return <Navigate to="/app/dashboard" replace />

  const displayName = [user.nombre, user.apellido].filter(Boolean).join(' ') || 'Equipo Punta Rollers'
  return <AppLayout>
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-7 text-white sm:px-8">
      <div className="relative overflow-hidden rounded-[30px] border border-violet-400/25 bg-[#101023] p-6 shadow-2xl sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-60 w-60 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[.2em] text-violet-200">PR Training 2.0 · Laboratorio privado</span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">Sin acceso para alumnos</span>
          </div>
          <div className="mt-9 max-w-3xl">
            <p className="text-sm font-medium text-violet-200">Nueva temporada · Noviembre 2026</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">Cada mes, un nuevo desafío.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">Seis deberes. Tu nivel. Tu progreso. Una experiencia de entrenamiento que se construye sobre tu recorrido en Punta Rollers.</p>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><p className="text-xs uppercase tracking-widest text-white/50">Próximo ciclo</p><p className="mt-2 text-2xl font-black">NOV 2026</p><p className="mt-1 text-xs text-white/50">01/11 · 15:00 UY</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><p className="text-xs uppercase tracking-widest text-white/50">Desafíos por ciclo</p><p className="mt-2 text-3xl font-black">06</p><p className="mt-1 text-xs text-white/50">Asignación individual</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><p className="text-xs uppercase tracking-widest text-white/50">Identidad conectada</p><p className="mt-2 truncate text-lg font-bold">{displayName}</p><p className="mt-1 text-xs text-white/50">Perfil real · {user.estado || 'Sin estado'}</p></div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Secciones del laboratorio">
        {[['experiencia','Experiencia'],['niveles','Niveles'],['revision','Evidencias y revisión']].map(([key,label])=><button key={key} role="tab" aria-selected={section===key} onClick={()=>setSection(key)} className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${section===key?'bg-violet-500 text-white':'border border-white/15 bg-white/5 text-white/65 hover:bg-white/10'}`}>{label}</button>)}
      </div>
      {section==='experiencia' && <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[26px] border border-violet-400/20 bg-[#17142c] p-7 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-violet-300">PR SPIN</p>
          <div className="my-7"><SpinWheel/></div>
          <h2 className="text-xl font-bold">Tu mes empieza acá.</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">La ruleta visual tiene ocho segmentos amplios, pero el ciclo revela seis deberes. La animación ya puede probarse aquí; la asignación real todavía no está habilitada.</p>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-[#141421] p-7">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-white/50">Así funciona</p>
          <ol className="mt-6 space-y-6">{sampleSteps.map((step,i)=><li key={step} className="flex items-center gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 font-black text-violet-200">{String(i+1).padStart(2,'0')}</span><span className="font-medium">{step}</span></li>)}</ol>
          <div className="mt-9 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100/75">Modo construcción: no se generan deberes, no se registran evidencias y no se alteran datos de alumnos.</div>
        </div>
      </section>}
      {section==='niveles' && <section className="mt-6 grid gap-4 sm:grid-cols-2">{levels.map(level=><article key={level.code} className="rounded-2xl border border-white/10 bg-[#161625] p-6"><p className="text-4xl font-black text-violet-300">{level.code}</p><h2 className="mt-3 text-xl font-bold">{level.label}</h2><p className="mt-2 text-sm text-white/55">{level.detail}</p><p className="mt-5 text-xs text-white/40">Nivel ilustrativo · Sin asignación automática habilitada</p></article>)}</section>}
      {section==='revision' && <section className="mt-6 grid gap-4 sm:grid-cols-3">{[['01','Enviado','El alumno adjunta foto, video o actividad de Strava.'],['02','En revisión','Claudio o David verifica la evidencia privada.'],['03','Aprobado o devuelto','Se registra el resultado y, si corresponde, se solicita un nuevo envío.']].map(([n,t,d])=><article key={n} className="rounded-2xl border border-white/10 bg-[#161625] p-6"><p className="text-3xl font-black text-violet-300">{n}</p><h2 className="mt-5 text-lg font-bold">{t}</h2><p className="mt-3 text-sm leading-6 text-white/55">{d}</p></article>)}</section>}
      <p className="mt-8 text-center text-xs text-white/40">Laboratorio PR Training 2.0 · Acceso restringido al equipo · Sin conexión de escritura</p>
    </main>
  </AppLayout>
}
