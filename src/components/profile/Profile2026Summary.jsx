import { Link } from 'react-router-dom'
import VerifiedBadge from '../VerifiedBadge'

function SocialLink({ href, label, mark }) {
  if (!href) return null
  const clean = String(href).replace(/^@/, '')
  const url = href.startsWith('http') ? href : label === 'Instagram' ? `https://instagram.com/${clean}` : href
  return <a href={url} target="_blank" rel="noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[.08] bg-white/[.035] text-[11px] font-black text-white/65 active:scale-95">{mark}</a>
}

function CompactRow({ title, subtitle, open, onClick, children, accent = 'white' }) {
  const tone = accent === 'gold' ? 'text-pr-gold' : accent === 'cyan' ? 'text-cyan-300' : 'text-white'
  return <section className="overflow-hidden rounded-[24px] border border-white/[.07] bg-white/[.025]">
    <button type="button" onClick={onClick} className="flex min-h-[68px] w-full items-center justify-between gap-3 px-4 text-left active:bg-white/[.025]">
      <div className="min-w-0"><p className={`text-sm font-black ${tone}`}>{title}</p><p className="mt-1 truncate text-[9px] text-white/30">{subtitle}</p></div>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[.07] bg-black/20 text-white/35 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
    </button>
    {open && <div className="border-t border-white/[.06] p-4">{children}</div>}
  </section>
}

export default function Profile2026Summary({ profile, stats, paymentStatus, stravaConnected, groups = [], events = [], services = [], open, setOpen }) {
  const initials = String(profile?.nombre || 'PR').split(' ').filter(Boolean).map(v=>v[0]).join('').slice(0,2)
  const instagram = profile?.instagram
  const paymentGood = profile?.accesoHabilitado !== false
  return <div className="space-y-3">
    <section className="relative overflow-hidden rounded-[34px] border border-white/[.08] bg-[#0b0b10] shadow-[0_26px_70px_rgba(0,0,0,.32)]">
      <div className="relative h-[176px] overflow-hidden bg-gradient-to-br from-[#211a0d] via-[#111119] to-[#08080d]">
        {profile?.banner && <img src={profile.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-black/10 to-black/25"/>
        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.15em] text-white/55 backdrop-blur-xl">PERFIL PR</div>
      </div>
      <div className="relative px-5 pb-5">
        <div className="absolute -top-[58px] left-5 grid h-[116px] w-[116px] place-items-center overflow-hidden rounded-[34px] border-[4px] border-[#0b0b10] bg-gradient-to-br from-pr-gold/70 via-orange-400/40 to-violet-500/50 p-[2px] shadow-2xl">
          <div className="grid h-full w-full place-items-center overflow-hidden rounded-[28px] bg-[#16161d]">{profile?.foto ? <img src={profile.foto} alt={profile.nombre || 'Perfil'} className="h-full w-full object-cover"/> : <span className="font-display text-3xl text-pr-gold">{initials}</span>}</div>
        </div>
        <div className="flex justify-end pt-3"><Link to="/app/perfil#editar" className="rounded-[15px] border border-white/[.09] bg-white/[.045] px-3 py-2 text-[9px] font-black text-white/60">Editar perfil</Link></div>
        <div className="pt-8"><div className="flex items-center gap-2"><h1 className="font-display text-[35px] leading-none text-white">{profile?.nombre || 'Mi perfil'}</h1>{profile?.verificado && <VerifiedBadge size={22}/>}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">{profile?.ciudad && <span className="rounded-full border border-white/[.07] bg-white/[.03] px-3 py-1.5 text-[9px] font-bold text-white/45">{profile.ciudad}</span>}<SocialLink href={instagram} label="Instagram" mark="IG"/></div>
          <p className="mt-4 max-w-[380px] text-[12px] leading-5 text-white/46">{profile?.sobreMi || 'Mi espacio dentro de Punta Rollers.'}</p>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-white/[.07] rounded-[23px] border border-white/[.07] bg-black/25 py-4"><Metric value={stats?.sessions || 0} label="Entrenos"/><Metric value={Number(stats?.kilometers || 0).toLocaleString('es-UY',{maximumFractionDigits:1})} label="Km totales" accent/><Metric value={profile?.miembroDesde || 'PR'} label="Desde"/></div>
      </div>
    </section>

    <Link to="/app/entrenamiento" className="flex items-center justify-between rounded-[25px] border border-violet-300/15 bg-gradient-to-r from-violet-400/[.10] to-white/[.025] p-4 active:scale-[.99]"><div><p className="text-[8px] font-black uppercase tracking-[.16em] text-violet-300">MI ACTIVIDAD</p><p className="mt-1 text-sm font-black text-white">Rendimiento y evolución</p><p className="mt-1 text-[9px] text-white/30">Tus km, tomas, objetivos y progreso.</p></div><span className="text-xl text-violet-300">→</span></Link>

    <div className={`flex items-center justify-between rounded-[22px] border p-4 ${paymentGood ? 'border-emerald-300/15 bg-emerald-400/[.06]' : 'border-red-300/20 bg-red-400/[.07]'}`}><div><p className={`text-[8px] font-black uppercase tracking-[.15em] ${paymentGood ? 'text-emerald-300' : 'text-red-300'}`}>MENSUALIDAD PR</p><p className="mt-1 text-sm font-black text-white">{paymentStatus?.title || (paymentGood ? 'Pago registrado' : 'Revisar mensualidad')}</p><p className="mt-1 text-[9px] text-white/32">{paymentStatus?.description || ''}</p></div><span className={`rounded-full border px-3 py-1 text-[8px] font-black ${paymentGood ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' : 'border-red-300/20 bg-red-400/10 text-red-200'}`}>{paymentStatus?.badge || (paymentGood?'ACTIVA':'VENCIDA')}</span></div>

    <div className={`flex items-center justify-between rounded-[22px] border p-4 ${stravaConnected ? 'border-orange-300/15 bg-orange-400/[.06]' : 'border-white/[.07] bg-white/[.025]'}`}><div><p className="text-[8px] font-black uppercase tracking-[.15em] text-orange-300">STRAVA</p><p className="mt-1 text-sm font-black text-white">{stravaConnected ? 'Conectado' : 'Conectá tu actividad'}</p><p className="mt-1 text-[9px] text-white/30">La conexión sigue alimentando tus estadísticas PR.</p></div><span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,.75)]"/></div>

    <CompactRow title="Tus grupos" subtitle={`${groups.length} grupo${groups.length===1?'':'s'} asignado${groups.length===1?'':'s'}`} open={open==='grupos'} onClick={()=>setOpen(open==='grupos'?'':'grupos')}>{groups.length ? <div className="space-y-2">{groups.map((g,i)=><a key={`${g.titulo}-${i}`} href={g.link||'#'} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-white/[.06] bg-black/20 p-3 text-xs font-bold text-white/65"><span>{g.titulo}</span><span>→</span></a>)}</div> : <p className="text-[10px] text-white/35">Todavía no tenés grupos asignados.</p>}</CompactRow>
    <CompactRow title="Tus servicios" subtitle={`${services.length || 4} accesos dentro del ecosistema`} accent="gold" open={open==='servicios2026'} onClick={()=>setOpen(open==='servicios2026'?'':'servicios2026')}><Link to="/app/mi-pr" className="flex min-h-12 items-center justify-between rounded-2xl border border-pr-gold/15 bg-pr-gold/[.06] px-4 text-xs font-black text-pr-gold"><span>Abrir Mi PR</span><span>→</span></Link></CompactRow>
    <CompactRow title="Eventos" subtitle={`${events.length} participación${events.length===1?'':'es'} registrada${events.length===1?'':'s'}`} accent="cyan" open={open==='eventos2026'} onClick={()=>setOpen(open==='eventos2026'?'':'eventos2026')}><p className="text-[10px] leading-5 text-white/35">Tus participaciones continúan guardadas. El detalle se mantiene conectado al historial existente.</p></CompactRow>
  </div>
}

function Metric({value,label,accent=false}){return <div className="min-w-0 px-2 text-center"><p className={`truncate font-display text-[23px] leading-none ${accent?'text-pr-gold':'text-white'}`}>{value}</p><p className="mt-2 text-[7px] font-black uppercase tracking-[.12em] text-white/25">{label}</p></div>}
