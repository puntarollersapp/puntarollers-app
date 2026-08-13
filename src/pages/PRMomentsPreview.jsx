import { useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'

const REACTIONS = ['🔥', '⚡', '🛼', '💪', '😂', '❤️']

const MOMENTS = [
  { id: 1, name: 'Lucía', initials: 'LB', accent: '#9b7cff', when: 'hace 14 min', tag: 'Rodada', stat: '8,7 KM · 31 MIN', caption: 'Primera salida larga de la semana. Costó arrancar, después voló. 🛼' },
  { id: 2, name: 'Damián', initials: 'DM', accent: '#47d7ff', when: 'hace 38 min', tag: 'Pista', stat: '45 MIN · TÉCNICA', caption: 'Hoy tocó técnica y espalda baja. Menos velocidad, más control.' },
  { id: 3, name: 'Jenny', initials: 'JB', accent: '#ff6d86', when: 'hace 1 h', tag: 'Ahora', stat: 'EN MOVIMIENTO', caption: 'Atardecer, rambla y cero ganas de volver a casa todavía.' },
]

function Avatar({ initials, accent, active = false }) {
  return (
    <div className="grid h-16 w-16 place-items-center rounded-full p-[3px]" style={{ background: active ? `conic-gradient(${accent},#ff7a45,${accent})` : 'rgba(255,255,255,.08)' }}>
      <div className="grid h-full w-full place-items-center rounded-full border-[3px] border-[#09090d] bg-[#17171e] text-sm font-black text-white">{initials}</div>
    </div>
  )
}

export default function PRMomentsPreview() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(0)
  const [reaction, setReaction] = useState('')
  const moment = MOMENTS[selected]

  const ownInitials = useMemo(() => {
    const name = `${user?.nombre || ''} ${user?.apellido || ''}`.trim()
    return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'PR'
  }, [user])

  return (
    <AppLayout title="PR Moments" showBack>
      <div className="pb-12 pt-3">
        <section className="px-4">
          <div className="rounded-[30px] border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.09] via-white/[0.025] to-orange-500/[0.07] p-4 shadow-[0_24px_70px_rgba(0,0,0,.35)]">
            <p className="text-[10px] font-black uppercase tracking-[0.19em] text-violet-300">24 horas · social real</p>
            <h1 className="mt-1 font-display text-[31px] font-black leading-none text-white">PR MOMENTS</h1>
            <p className="mt-2 max-w-[320px] text-xs leading-relaxed text-white/42">Instantáneas de la comunidad: foto, video, actividad, reacción y conversación en un formato temporal.</p>
          </div>
        </section>

        <section className="mt-5 overflow-hidden">
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-[72px] flex-shrink-0 flex-col items-center gap-2 text-center">
              <div className="relative"><Avatar initials={ownInitials} accent="#ff7a45" /><span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#09090d] bg-orange-400 text-xs font-black text-black">+</span></div>
              <span className="text-[10px] font-bold text-white/55">Tu momento</span>
            </div>
            {MOMENTS.map((item, index) => (
              <button key={item.id} type="button" onClick={() => { setSelected(index); setReaction('') }} className="flex w-[72px] flex-shrink-0 flex-col items-center gap-2 text-center">
                <Avatar initials={item.initials} accent={item.accent} active={selected === index} />
                <span className={`text-[10px] font-bold ${selected === index ? 'text-white' : 'text-white/45'}`}>{item.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="px-4 pt-4">
          <div className="relative min-h-[545px] overflow-hidden rounded-[34px] border border-white/[0.09] shadow-[0_30px_90px_rgba(0,0,0,.48)]" style={{ background: `radial-gradient(circle at 75% 18%, ${moment.accent}33, transparent 28%), radial-gradient(circle at 18% 84%, #ff7a4520, transparent 34%), linear-gradient(155deg,#171720,#09090d 72%)` }}>
            <div className="absolute inset-x-4 top-4 flex gap-1.5">{MOMENTS.map((item, index) => <span key={item.id} className="h-1 flex-1 rounded-full" style={{ background: index <= selected ? '#fff' : 'rgba(255,255,255,.15)' }} />)}</div>
            <div className="absolute left-5 right-5 top-9 flex items-center gap-3">
              <Avatar initials={moment.initials} accent={moment.accent} active />
              <div><div className="flex items-center gap-2"><p className="font-display text-base font-black text-white">{moment.name}</p><span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/45">{moment.tag}</span></div><p className="mt-0.5 text-[10px] text-white/35">{moment.when}</p></div>
            </div>
            <div className="absolute inset-x-5 bottom-36">
              <span className="inline-flex rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-md" style={{ color: moment.accent }}>{moment.stat}</span>
              <p className="mt-3 max-w-[320px] font-display text-[24px] font-black leading-tight text-white">{moment.caption}</p>
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-[25px] border border-white/[0.08] bg-black/45 p-3 backdrop-blur-xl">
              <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{REACTIONS.map((item) => <button key={item} type="button" onClick={() => setReaction(item)} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border text-lg active:scale-90" style={{ borderColor: reaction === item ? moment.accent : 'rgba(255,255,255,.08)', background: reaction === item ? `${moment.accent}24` : 'rgba(255,255,255,.035)' }}>{item}</button>)}</div>
              <div className="mt-1 flex items-center gap-2"><div className="min-h-11 flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-xs text-white/25">Responder a {moment.name}…</div><button type="button" className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-black" style={{ background: moment.accent }}>↑</button></div>
            </div>
          </div>
        </section>

        <div className="mx-4 mt-5 rounded-[24px] border border-orange-300/15 bg-orange-300/[0.055] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-200">Principio del módulo</p>
          <p className="mt-2 text-xs leading-relaxed text-white/42">Los Moments pueden mostrar datos de una rodada, pero nunca ubicación en vivo. El contenido público expira a las 24 horas.</p>
        </div>
      </div>
    </AppLayout>
  )
}
