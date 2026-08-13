import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'

const FILTERS = ['Todo', 'Entrenos', 'PR GO!', 'Challenges', 'Eventos']

const FEED = [
  {
    id: 1,
    type: 'PR GO!',
    accent: '#7c5cff',
    icon: '🚩',
    title: 'Lucía conquistó La Brava · Sector 08',
    body: '12,4 km válidos para el Equipo Azul. El territorio cambió de dueño después de 3 días.',
    meta: 'hace 8 min',
    stat: '860 PR POINTS',
    avatar: 'LB',
    reactions: 18,
    comments: 6,
  },
  {
    id: 2,
    type: 'Challenges',
    accent: '#ff8b4a',
    icon: '⚡',
    title: 'Damián completó 30 MIN NON STOP',
    body: 'Challenge completado y +180 XP para su temporada.',
    meta: 'hace 24 min',
    stat: 'CHALLENGE COMPLETADO',
    avatar: 'DM',
    reactions: 12,
    comments: 3,
  },
  {
    id: 3,
    type: 'Entrenos',
    accent: '#47d7ff',
    icon: '🛼',
    title: 'Macarena mejoró su mejor marca de 6K',
    body: 'Nueva mejor marca personal registrada desde una actividad sincronizada.',
    meta: 'hace 51 min',
    stat: 'NUEVO PB',
    avatar: 'MC',
    reactions: 24,
    comments: 8,
  },
  {
    id: 4,
    type: 'Eventos',
    accent: '#35e2a2',
    icon: '📍',
    title: 'Roller Night ya tiene 21 check-ins',
    body: 'La comunidad ya está llegando. Los Moments del evento quedan agrupados en una misma historia.',
    meta: 'hace 1 h',
    stat: '21 PRESENTES',
    avatar: 'PR',
    reactions: 31,
    comments: 11,
  },
  {
    id: 5,
    type: 'Challenges',
    accent: '#ffd45a',
    icon: '🎯',
    title: 'Objetivo PR: 624 / 750 KM',
    body: 'Faltan 126 km para completar el objetivo comunitario de agosto.',
    meta: 'hace 2 h',
    stat: '83% COMPLETADO',
    avatar: 'PR',
    reactions: 42,
    comments: 14,
  },
]

function FeedCard({ item }) {
  const [liked, setLiked] = useState(false)

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#111116] shadow-[0_20px_55px_rgba(0,0,0,.24)]">
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[17px] border border-white/10 bg-white/[0.04] text-xs font-black text-white">
            {item.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]" style={{ color: item.accent, borderColor: `${item.accent}35`, background: `${item.accent}12` }}>
                {item.icon} {item.type}
              </span>
              <span className="text-[10px] text-white/28">{item.meta}</span>
            </div>
            <h2 className="mt-3 font-display text-[19px] font-black leading-tight text-white">{item.title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-white/42">{item.body}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/[0.06] bg-black/25 px-3.5 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: item.accent }}>{item.stat}</p>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
          <button type="button" onClick={() => setLiked((value) => !value)} className="flex min-h-10 items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 text-xs font-bold text-white/55 active:scale-95">
            <span>{liked ? '🔥' : '♡'}</span>
            <span>{item.reactions + (liked ? 1 : 0)}</span>
          </button>
          <button type="button" className="flex min-h-10 items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 text-xs font-bold text-white/55">
            <span>💬</span>
            <span>{item.comments}</span>
          </button>
          <button type="button" className="ml-auto grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.025] text-white/38">↗</button>
        </div>
      </div>
    </article>
  )
}

export default function RollerFeed3Preview() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('Todo')
  const firstName = String(user?.nombre || 'Patinador').trim().split(' ')[0]

  const visible = useMemo(() => {
    if (filter === 'Todo') return FEED
    return FEED.filter((item) => item.type === filter)
  }, [filter])

  return (
    <AppLayout title="RollerFeed 3.0" showBack>
      <div className="pb-14 pt-3">
        <section className="px-4">
          <div className="relative overflow-hidden rounded-[32px] border border-orange-300/10 bg-[#0d0d12] p-5 shadow-[0_26px_80px_rgba(0,0,0,.38)]">
            <div className="pointer-events-none absolute -right-16 -top-14 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-violet-500/12 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">El diario vivo de PR</p>
              <h1 className="mt-1 font-display text-[34px] font-black leading-none text-white">ROLLERFEED 3.0</h1>
              <p className="mt-3 max-w-[330px] text-xs leading-relaxed text-white/42">Hola {firstName}. Acá la comunidad se mueve aunque nadie publique manualmente: entrenos, records, Challenges, eventos, rachas y PR GO! generan historias automáticamente.</p>
              <div className="mt-4 flex gap-2">
                <Link to="/app/pr3/moments" className="rounded-2xl border border-violet-300/18 bg-violet-300/[0.08] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-200">Ver PR Moments</Link>
                <span className="rounded-2xl border border-emerald-300/14 bg-emerald-300/[0.06] px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">Preview aislada</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className="flex-shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition" style={{ color: filter === item ? '#fff' : 'rgba(255,255,255,.38)', borderColor: filter === item ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)', background: filter === item ? 'rgba(255,255,255,.085)' : 'rgba(255,255,255,.025)' }}>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-3 space-y-3 px-4">
          {visible.map((item) => <FeedCard key={item.id} item={item} />)}
        </section>

        <section className="mx-4 mt-5 rounded-[26px] border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-cyan-200">Motor automático</p>
          <p className="mt-2 text-xs leading-relaxed text-white/42">La versión final mezclará publicaciones humanas con eventos generados por el sistema. Cada tarjeta podrá abrir el perfil, Challenge, evento o territorio relacionado sin duplicar Insignias.</p>
        </section>
      </div>
    </AppLayout>
  )
}
