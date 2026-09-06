import { useState } from 'react'
import { Link } from 'react-router-dom'

const DRIVE_ROOT = 'https://drive.google.com/drive/folders/1WownZBOYbiW0v8n1WAxGbyDTgy8eIhrl'
const DRIVE_EMBED = 'https://drive.google.com/embeddedfolderview?id=1WownZBOYbiW0v8n1WAxGbyDTgy8eIhrl#grid'

const DAYS = [
  {
    id: 'dia-1',
    label: 'DÍA 1',
    date: 'VIERNES 4',
    time: '20:30',
    place: 'Pista cerrada',
    copy: 'Primera jornada intensiva: técnica, postura, control y adaptación al trabajo específico.',
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'dia-2',
    label: 'DÍA 2',
    date: 'SÁBADO 5',
    time: '19:00',
    place: 'Pista cerrada',
    copy: 'Segunda jornada: curvas, frenado, centro de gravedad, precisión y evolución técnica.',
    accent: 'from-amber-300 to-orange-500',
  },
  {
    id: 'dia-3',
    label: 'DÍA 3',
    date: 'DOMINGO 6',
    time: '09:00',
    place: 'Parada 2 · Aire libre',
    copy: 'Cierre de la clínica: aplicación real, control, ritmo y transferencia de lo aprendido al entorno abierto.',
    accent: 'from-emerald-300 to-cyan-500',
  },
]

const TOPICS = [
  'Técnica de patinaje',
  'Centro de gravedad',
  'Curvas y control',
  'Frenado',
  'Entrenamiento recreativo',
  'Entrenamiento competitivo',
  'Evaluación y seguimiento',
  'Aplicación en pista y calle',
]

export default function ClinicaSeptExperience() {
  const [activeDay, setActiveDay] = useState(DAYS[0])

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,.13),transparent_28%),radial-gradient(circle_at_90%_28%,rgba(34,211,238,.09),transparent_26%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Punta Rollers" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#d9b75a]">Punta Rollers</p>
              <p className="text-xs text-white/40">Archivo oficial · Setiembre 2026</p>
            </div>
          </div>
          <Link to="/" className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-[11px] font-black uppercase tracking-[.1em] text-white/70">Inicio</Link>
        </nav>

        <section className="relative mt-5 overflow-hidden rounded-[34px] border border-[#d9b75a]/25 bg-[#0a0a0b] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(217,183,90,.11),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(34,211,238,.13),transparent_30%)]" />
          <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.35fr_.65fr] lg:p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9b75a]/25 bg-[#d9b75a]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-[#e7c96d]">
                EXPERIENCIA COMPLETADA · 2026
              </div>
              <h1 className="mt-5 max-w-3xl text-[48px] font-black leading-[.88] tracking-[-.055em] sm:text-6xl lg:text-7xl">
                PRIMERA CLÍNICA<br />INTERNACIONAL <span className="text-[#d9b75a]">DE PATINAJE</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Tres días. Seis horas. Una experiencia de formación intensiva en Punta del Este junto a Miguel Flores, Subcampeón Máster Mundial y entrenador con más de 40 años de experiencia.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.12em]">
                <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">🇦🇷 Miguel Flores</span>
                <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">🇺🇾 Punta del Este</span>
                <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">4 · 5 · 6 SET</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/[.035] p-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-white/35">La clínica en números</p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Stat value="3" label="días" />
                  <Stat value="6" label="horas" />
                  <Stat value="2+1" label="pista/calle" />
                </div>
              </div>
              <p className="mt-8 text-xs leading-5 text-white/40">Una experiencia técnica, deportiva y humana construida junto a la comunidad Punta Rollers.</p>
            </div>
          </div>
        </section>

        <section className="pt-11">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">RECORRÉ LA EXPERIENCIA</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">Tres jornadas. Tres capítulos.</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {DAYS.map((day) => {
              const active = activeDay.id === day.id
              return (
                <button
                  type="button"
                  key={day.id}
                  onClick={() => setActiveDay(day)}
                  className={`group rounded-[26px] border p-5 text-left transition ${active ? 'border-[#d9b75a]/50 bg-[#d9b75a]/10' : 'border-white/10 bg-white/[.03] hover:bg-white/[.05]'}`}
                >
                  <div className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${day.accent}`} />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-white/35">{day.label}</p>
                  <p className="mt-1 text-xl font-black">{day.date}</p>
                  <p className="mt-3 text-sm font-black text-[#e4c45f]">{day.time} · {day.place}</p>
                </button>
              )
            })}
          </div>

          <div className="mt-4 overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0d] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">{activeDay.label} · {activeDay.date}</p>
                <h3 className="mt-2 text-2xl font-black">{activeDay.time} · {activeDay.place}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{activeDay.copy}</p>
              </div>
              <a href={DRIVE_ROOT} target="_blank" rel="noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-[#d9b75a] px-5 text-xs font-black uppercase tracking-[.08em] text-black">Ver fotos y videos →</a>
            </div>
          </div>
        </section>

        <section className="pt-11">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#d9b75a]">ARCHIVO OFICIAL</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">Fotos + videos de la clínica.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">El material está alojado en el archivo oficial de Punta Rollers en Google Drive. Desde acá podés recorrer las carpetas de cada jornada.</p>
            </div>
            <a href={DRIVE_ROOT} target="_blank" rel="noreferrer" className="text-xs font-black text-cyan-300">Abrir en Google Drive ↗</a>
          </div>

          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-white">
            <iframe title="Archivo oficial de la clínica" src={DRIVE_EMBED} className="h-[560px] w-full border-0 sm:h-[680px]" />
          </div>
        </section>

        <section className="pt-11">
          <div className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
            <div className="rounded-[30px] border border-[#d9b75a]/25 bg-gradient-to-br from-[#d9b75a]/15 via-[#101011] to-[#070707] p-6">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#e7c96d]">DIPLOMA DIGITAL</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Tu clínica también queda en tu historia.</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">Si completaste las tres jornadas, podés abrir la versión digital del diploma, colocar tu nombre y guardarla como PDF para conservarla o compartirla.</p>
              <Link to="/clinica-septiembre-2026/diploma" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-white px-5 text-xs font-black uppercase tracking-[.08em] text-black">Abrir mi diploma digital →</Link>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[.03] p-6">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">LO QUE TRABAJAMOS</p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TOPICS.map((topic, index) => (
                  <div key={topic} className="rounded-2xl border border-white/[.08] bg-black/20 p-4">
                    <span className="text-[9px] font-black text-[#d9b75a]">0{index + 1}</span>
                    <p className="mt-2 text-xs font-black leading-5 text-white/75">{topic}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 py-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-white/35">PUNTA ROLLERS · PUNTA DEL ESTE · URUGUAY</p>
          <p className="mt-2 text-sm font-black text-[#d9b75a]">No es solo patinar. Es pertenecer.</p>
        </footer>
      </div>
    </main>
  )
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-white/35">{label}</p>
    </div>
  )
}
