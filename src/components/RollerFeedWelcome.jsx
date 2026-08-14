import { useState } from 'react'

const STEPS = [
  { eyebrow: 'RollerFeed creció', title: 'Todo PR, ahora más vivo.', text: 'A los entrenamientos, cumpleaños y eventos se suman PR Moments: fotos, videos o palabras espontáneas de la comunidad.', icon: '⚡', colors: 'from-orange-500/30 via-amber-300/10 to-transparent' },
  { eyebrow: 'Nuevo · PR Moments', title: 'Compartí tu momento.', text: 'Publicá texto, foto o video. Se verá en los círculos y también dentro del RollerFeed durante 24 horas.', icon: '📸', colors: 'from-violet-500/35 via-fuchsia-400/10 to-transparent' },
  { eyebrow: 'Comunidad PR', title: 'Mirá, reaccioná, comentá.', text: 'Abrí cualquier Moment para verlo nuevamente, dejar una reacción o escribir libremente. Lo que pasa sobre ruedas, se comparte acá.', icon: '🔥', colors: 'from-sky-500/30 via-violet-400/10 to-transparent' },
]

export default function RollerFeedWelcome({ onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/80 p-3 backdrop-blur-md sm:items-center" role="dialog" aria-modal="true" aria-labelledby="rollerfeed-welcome-title">
      <section className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-white/10 bg-[#0d0c12] shadow-[0_30px_100px_rgba(0,0,0,.75)]">
        <div className={`absolute inset-x-0 top-0 h-72 bg-gradient-to-b ${current.colors}`} />
        <div className="relative p-5 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5" aria-label={`Paso ${step + 1} de ${STEPS.length}`}>{STEPS.map((item, index) => <span key={item.title} className={`h-1.5 rounded-full transition-all ${index === step ? 'w-9 bg-orange-300' : 'w-3 bg-white/15'}`} />)}</div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/25 text-xl text-white/55" aria-label="Cerrar tutorial">×</button>
          </div>
          <div className="mt-9 grid h-20 w-20 place-items-center rounded-[26px] border border-white/10 bg-black/25 text-4xl shadow-[0_18px_50px_rgba(0,0,0,.3)]">{current.icon}</div>
          <p className="mt-7 text-[10px] font-black uppercase tracking-[.2em] text-orange-300">{current.eyebrow}</p>
          <h2 id="rollerfeed-welcome-title" className="mt-2 font-display text-[38px] leading-[.95] text-white">{current.title}</h2>
          <p className="mt-4 text-sm leading-6 text-white/55">{current.text}</p>
          <div className="mt-7 flex gap-2">
            {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="h-14 rounded-2xl border border-white/10 px-5 text-xs font-bold text-white/55">Atrás</button>}
            <button type="button" onClick={() => last ? onClose() : setStep((value) => value + 1)} className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 text-sm font-black text-black shadow-[0_14px_35px_rgba(249,115,22,.2)]">{last ? '¡Vamos a rodar!' : 'Siguiente →'}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
