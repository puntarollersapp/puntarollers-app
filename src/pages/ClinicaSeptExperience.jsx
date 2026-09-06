import { Link } from 'react-router-dom'

const DAYS = [
  {
    id: 'dia-1',
    label: 'DÍA 1',
    date: 'VIERNES 4',
    time: '20:30',
    place: 'Pista cerrada',
    drive: 'https://drive.google.com/drive/folders/1yCUJM18L5_1zxDTc2M4FBeNmViA_j9FH',
    accent: 'from-[#6EF3FF] via-[#3E7BFF] to-[#8D5CFF]',
    chip: 'Técnica + control',
    copy: 'Inicio de la clínica con trabajo técnico, postura, centro de gravedad, control y adaptación al ritmo de la pista.',
  },
  {
    id: 'dia-2',
    label: 'DÍA 2',
    date: 'SÁBADO 5',
    time: '19:00',
    place: 'Pista cerrada',
    drive: 'https://drive.google.com/drive/folders/13aObjyrPEgL9P24Sx8Yl6M7lomy9QxT2',
    accent: 'from-[#FFD45B] via-[#FF8A3D] to-[#FF4E8A]',
    chip: 'Curvas + técnica',
    copy: 'Segunda jornada con foco en curvas, precisión, transferencia de peso, dominio técnico y control corporal.',
  },
  {
    id: 'dia-3',
    label: 'DÍA 3',
    date: 'DOMINGO 6',
    time: '09:00',
    place: 'Parada 2 · Aire libre',
    drive: 'https://drive.google.com/drive/folders/14dl9PTK8YjAm3_XvA1J_8vTCzW0vmAm_',
    accent: 'from-[#53F3A5] via-[#20D2C7] to-[#36A7FF]',
    chip: 'Aplicación real',
    copy: 'Cierre al aire libre: ritmo, control, aplicación de lo trabajado y transferencia al entorno real.',
  },
]

const CONTENT = [
  { label: 'Técnica de patinaje', level: 'Foco principal', width: '96%', tone: 'from-cyan-300 to-blue-500' },
  { label: 'Curvas y control', level: 'Foco alto', width: '82%', tone: 'from-violet-400 to-fuchsia-500' },
  { label: 'Centro de gravedad', level: 'Foco alto', width: '76%', tone: 'from-amber-300 to-orange-500' },
  { label: 'Aplicación pista / calle', level: 'Foco alto', width: '74%', tone: 'from-emerald-300 to-cyan-500' },
  { label: 'Entrenamiento recreativo + competitivo', level: 'Foco medio', width: '58%', tone: 'from-lime-300 to-emerald-500' },
  { label: 'Frenado', level: 'Trabajo puntual', width: '18%', tone: 'from-rose-400 to-red-500' },
]

export default function ClinicaSeptExperience() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F6FB] text-[#0B1020]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(36,211,238,.2),transparent_26%),radial-gradient(circle_at_88%_8%,rgba(255,198,73,.22),transparent_24%),radial-gradient(circle_at_70%_70%,rgba(130,93,255,.12),transparent_26%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-[24px] border border-black/[.06] bg-white/80 px-4 py-3 shadow-[0_14px_45px_rgba(16,24,40,.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Punta Rollers" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#0B1020]">Punta Rollers</p>
              <p className="text-xs font-semibold text-black/40">Clínica Internacional · Setiembre 2026</p>
            </div>
          </div>
          <Link to="/" className="rounded-full border border-black/10 bg-[#0B1020] px-4 py-2 text-[10px] font-black uppercase tracking-[.12em] text-white">Inicio</Link>
        </nav>

        <section className="relative mt-5 overflow-hidden rounded-[38px] border border-black/[.06] bg-white shadow-[0_35px_110px_rgba(18,26,43,.14)]">
          <div className="absolute right-0 top-0 h-full w-[42%] bg-[linear-gradient(135deg,rgba(110,243,255,.22),rgba(141,92,255,.18)_48%,rgba(255,212,91,.22))]" />
          <div className="absolute -right-20 top-8 text-[240px] font-black leading-none text-black/[.035] sm:text-[330px]">PR</div>
          <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.2fr_.8fr] lg:p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#0B1020] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-white">
                EXPERIENCIA COMPLETADA · 2026
              </div>
              <h1 className="mt-5 max-w-4xl text-[46px] font-black leading-[.86] tracking-[-.06em] sm:text-6xl lg:text-[78px]">
                PRIMERA CLÍNICA<br />INTERNACIONAL <span className="bg-gradient-to-r from-[#0AA9FF] via-[#7C59FF] to-[#F6B833] bg-clip-text text-transparent">DE PATINAJE</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-black/55 sm:text-base">
                Tres jornadas de formación intensiva en Punta del Este junto a Miguel Flores, Subcampeón Máster Mundial y entrenador con más de 40 años de experiencia.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.1em]">
                <span className="rounded-full border border-black/10 bg-[#F7F8FC] px-3 py-2">🇦🇷 Miguel Flores</span>
                <span className="rounded-full border border-black/10 bg-[#F7F8FC] px-3 py-2">🇺🇾 Punta del Este</span>
                <span className="rounded-full bg-[#0B1020] px-3 py-2 text-white">4 · 5 · 6 SET</span>
              </div>
            </div>

            <div className="self-end rounded-[28px] border border-black/[.07] bg-[#0B1020] p-5 text-white shadow-[0_26px_70px_rgba(11,16,32,.22)]">
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-white/40">La clínica en números</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Stat value="3" label="días" />
                <Stat value="+6" label="horas" highlight />
                <Stat value="2+1" label="pista/calle" />
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full bg-gradient-to-r from-cyan-300 via-violet-400 to-amber-300" /></div>
              <p className="mt-3 text-xs leading-5 text-white/45">Técnica, evolución, aplicación real y una experiencia compartida por toda la comunidad PR.</p>
            </div>
          </div>
        </section>

        <section className="pt-10">
          <div className="rounded-[34px] border border-black/[.06] bg-white p-5 shadow-[0_20px_70px_rgba(18,26,43,.08)] sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#6B4EFF]">LO QUE SE TRABAJÓ</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">El mapa técnico de la clínica.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">Una lectura visual de los ejes trabajados durante las tres jornadas, sin porcentajes forzados: cuanto más larga la barra, mayor fue el foco técnico.</p>
              </div>
              <div className="rounded-2xl border border-black/[.06] bg-[#F6F7FB] px-4 py-3 text-right">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-black/35">Entrenamiento total</p>
                <p className="mt-1 text-2xl font-black">+6 HORAS</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {CONTENT.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-black/[.06] bg-[#FAFBFD] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-black/70">{item.label}</p>
                    <span className="rounded-full bg-black/[.05] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em] text-black/45">{item.level}</span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/[.06]">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.tone}`} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#06A3D9]">ARCHIVO DE LA EXPERIENCIA</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Cada día, su historia.</h2>
            </div>
            <span className="hidden text-xs font-black text-black/35 sm:block">Fotos + videos oficiales</span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {DAYS.map((day) => (
              <article key={day.id} className="group overflow-hidden rounded-[30px] border border-black/[.06] bg-white shadow-[0_20px_70px_rgba(18,26,43,.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(18,26,43,.14)]">
                <div className={`h-2 bg-gradient-to-r ${day.accent}`} />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.18em] text-black/35">{day.label}</p>
                      <h3 className="mt-1 text-[28px] font-black tracking-[-.04em]">{day.date}</h3>
                    </div>
                    <span className="rounded-full border border-black/[.06] bg-[#F6F7FB] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.1em]">{day.chip}</span>
                  </div>
                  <p className="mt-4 text-sm font-black text-[#0B1020]">{day.time} · {day.place}</p>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-black/45">{day.copy}</p>
                  <a href={day.drive} target="_blank" rel="noreferrer" className={`mt-6 flex min-h-[58px] items-center justify-between rounded-[20px] bg-gradient-to-r ${day.accent} px-5 text-[13px] font-black uppercase tracking-[.08em] text-[#06101A] shadow-[0_16px_36px_rgba(45,69,120,.16)] transition active:scale-[.99]`}>
                    <span>Ver fotos y videos</span><span className="text-lg">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-10">
          <div className="relative overflow-hidden rounded-[34px] border border-black/[.06] bg-[#0B1020] p-6 text-white shadow-[0_28px_90px_rgba(11,16,32,.18)] sm:p-8">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_50%,rgba(110,243,255,.18),transparent_40%),radial-gradient(circle_at_95%_20%,rgba(246,184,51,.2),transparent_28%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">TOMAS DE TIEMPO · PERFORMANCE</p>
                <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-4xl">Consultá tus tomas de tiempo en clínica y el puntaje otorgado por Miguel.</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">Resultados individuales y devolución técnica de la experiencia.</p>
              </div>
              <button type="button" disabled className="min-h-[56px] shrink-0 rounded-2xl border border-white/15 bg-white/[.08] px-5 text-xs font-black uppercase tracking-[.08em] text-white/55">
                Clic aquí · Próximamente
              </button>
            </div>
          </div>
        </section>

        <section className="pt-10">
          <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
            <div className="relative overflow-hidden rounded-[34px] border border-[#D8B24B]/20 bg-gradient-to-br from-[#071429] via-[#112345] to-[#5B49CF] p-6 text-white shadow-[0_24px_80px_rgba(18,26,43,.16)] sm:p-8">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-[20px] border border-white/15 bg-white/10 text-3xl">🏅</div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-[#FFD45B]">INSIGNIA OFICIAL PR</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">Si completaste los 3 días, tu insignia ya forma parte de tu perfil.</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">La insignia “Primera Clínica 2026 realizada” queda cargada en tu perfil Punta Rollers como reconocimiento por haber completado la experiencia.</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-black/[.06] bg-gradient-to-br from-[#FFF9E8] via-white to-[#EDF8FF] p-6 shadow-[0_24px_80px_rgba(18,26,43,.1)] sm:p-8">
              <div className="absolute -right-14 -top-12 h-44 w-44 rounded-full bg-violet-300/20 blur-3xl" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#A26B00]">DIPLOMA DIGITAL</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Tu diploma, inspirado en la versión oficial entregada en papel.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">Claro, elegante y pensado para guardar o compartir. Personalizalo con tu nombre y exportalo como PDF.</p>
                <Link to="/clinica-septiembre-2026/diploma" className="mt-6 inline-flex min-h-[56px] items-center rounded-[20px] bg-[#0B1020] px-6 text-[12px] font-black uppercase tracking-[.08em] text-white shadow-[0_14px_35px_rgba(11,16,32,.16)]">Abrir mi diploma digital →</Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-black/[.08] py-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-black/30">PUNTA ROLLERS · PUNTA DEL ESTE · URUGUAY</p>
          <p className="mt-2 text-sm font-black text-[#0B1020]">No es solo patinar. Es pertenecer.</p>
        </footer>
      </div>
    </main>
  )
}

function Stat({ value, label, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${highlight ? 'border-cyan-300/25 bg-cyan-300/10' : 'border-white/10 bg-white/[.04]'}`}>
      <p className={`text-2xl font-black ${highlight ? 'text-cyan-300' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-white/35">{label}</p>
    </div>
  )
}
