import { Link } from 'react-router-dom'

const DAYS = [
  {
    id: 'dia-1',
    label: 'DÍA 1',
    date: 'VIERNES 4',
    time: '20:30',
    place: 'Pista cerrada',
    drive: 'https://drive.google.com/drive/folders/1yCUJM18L5_1zxDTc2M4FBeNmViA_j9FH',
    accent: 'from-[#FF8A2A] via-[#FF5E1A] to-[#FFB13B]',
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
    accent: 'from-[#FFB13B] via-[#FF7A22] to-[#FF4D6D]',
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
    accent: 'from-[#FF7A22] via-[#FF5A1F] to-[#FBCB45]',
    chip: 'Aplicación real',
    copy: 'Cierre al aire libre: ritmo, control, aplicación de lo trabajado y transferencia al entorno real.',
  },
]

const CONTENT = [
  { label: 'Técnica de patinaje', level: 'Foco principal', width: '96%', tone: 'from-[#FF7A22] to-[#FFB13B]' },
  { label: 'Curvas y control', level: 'Foco alto', width: '82%', tone: 'from-[#FF5E1A] to-[#FF8A2A]' },
  { label: 'Centro de gravedad', level: 'Foco alto', width: '76%', tone: 'from-[#F6B73C] to-[#FF7A22]' },
  { label: 'Aplicación pista / calle', level: 'Foco alto', width: '74%', tone: 'from-[#FF8A2A] to-[#FF4D6D]' },
  { label: 'Entrenamiento recreativo + competitivo', level: 'Foco medio', width: '58%', tone: 'from-[#FFC857] to-[#FF8A2A]' },
  { label: 'Frenado', level: 'Trabajo puntual', width: '14%', tone: 'from-[#FF6B6B] to-[#FF7A22]' },
]

export default function ClinicaSeptExperience() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,110,30,.22),transparent_26%),radial-gradient(circle_at_92%_10%,rgba(255,177,59,.16),transparent_23%),radial-gradient(circle_at_50%_70%,rgba(104,44,17,.16),transparent_32%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-[24px] border border-white/[.08] bg-[#111113]/92 px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Punta Rollers" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FF8A2A]">Punta Rollers</p>
              <p className="text-xs font-semibold text-white/42">Clínica Internacional · Setiembre 2026</p>
            </div>
          </div>
          <Link to="/" className="rounded-full border border-white/10 bg-[#FF6A1A] px-4 py-2 text-[10px] font-black uppercase tracking-[.12em] text-white shadow-[0_8px_22px_rgba(255,106,26,.24)]">Inicio</Link>
        </nav>

        <section className="relative mt-5 overflow-hidden rounded-[38px] border border-white/[.08] bg-[linear-gradient(135deg,#121214_0%,#17100d_58%,#2a1208_100%)] shadow-[0_35px_110px_rgba(0,0,0,.38)]">
          <div className="absolute inset-y-0 right-0 w-[48%] bg-[radial-gradient(circle_at_80%_30%,rgba(255,132,38,.3),transparent_34%),radial-gradient(circle_at_75%_80%,rgba(255,196,73,.14),transparent_28%)]" />
          <div className="absolute -right-16 top-6 text-[220px] font-black leading-none text-white/[.025] sm:text-[320px]">PR</div>
          <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.18fr_.82fr] lg:p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8A2A]/30 bg-[#FF6A1A]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-[#FFB13B]">
                EXPERIENCIA COMPLETADA · 2026
              </div>
              <h1 className="mt-5 max-w-4xl text-[46px] font-black leading-[.86] tracking-[-.06em] sm:text-6xl lg:text-[78px]">
                PRIMERA CLÍNICA<br />INTERNACIONAL <span className="bg-gradient-to-r from-[#FF8A2A] via-[#FF5E1A] to-[#FFC857] bg-clip-text text-transparent">DE PATINAJE</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-white/58 sm:text-base">
                Tres jornadas de formación intensiva en Punta del Este junto a Miguel Flores, Subcampeón Máster Mundial y entrenador con más de 40 años de experiencia.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.1em]">
                <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2">🇦🇷 Miguel Flores</span>
                <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2">🇺🇾 Punta del Este</span>
                <span className="rounded-full bg-[#FF6A1A] px-3 py-2 text-white">4 · 5 · 6 SET</span>
              </div>
            </div>

            <div className="self-end rounded-[28px] border border-[#FF8A2A]/20 bg-[#09090b]/92 p-5 text-white shadow-[0_26px_70px_rgba(0,0,0,.28)]">
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-white/38">La clínica en números</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Stat value="3" label="días" />
                <Stat value="+6" label="horas" highlight />
                <Stat value="2+1" label="pista/calle" />
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full bg-gradient-to-r from-[#FF6A1A] via-[#FF8A2A] to-[#FFC857]" /></div>
              <p className="mt-3 text-xs leading-5 text-white/46">Técnica, evolución, aplicación real y una experiencia compartida por toda la comunidad PR.</p>
            </div>
          </div>
        </section>

        <section className="pt-10">
          <div className="rounded-[34px] border border-white/[.08] bg-[linear-gradient(145deg,#151517_0%,#18100d_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.24)] sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#FF8A2A]">LO QUE SE TRABAJÓ</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">El mapa técnico de la clínica.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Una lectura visual de los ejes trabajados durante las tres jornadas. Cuanto más larga la barra, mayor fue el foco técnico.</p>
              </div>
              <div className="rounded-2xl border border-white/[.08] bg-[#0d0d0f] px-4 py-3 text-right shadow-inner">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/34">Entrenamiento total</p>
                <p className="mt-1 text-2xl font-black text-[#FFB13B]">+6 HORAS</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {CONTENT.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/[.07] bg-[#0f0f11] p-4 shadow-[0_10px_28px_rgba(0,0,0,.16)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-white/74">{item.label}</p>
                    <span className="rounded-full bg-white/[.05] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em] text-white/42">{item.level}</span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[.06]">
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
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#FF8A2A]">ARCHIVO DE LA EXPERIENCIA</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Cada día, su historia.</h2>
            </div>
            <span className="hidden text-xs font-black text-white/32 sm:block">Fotos + videos oficiales</span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {DAYS.map((day) => (
              <article key={day.id} className="group overflow-hidden rounded-[30px] border border-white/[.08] bg-[linear-gradient(145deg,#121214_0%,#17100d_100%)] shadow-[0_24px_70px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-[#FF8A2A]/35 hover:shadow-[0_30px_90px_rgba(255,106,26,.12)]">
                <div className={`h-2.5 bg-gradient-to-r ${day.accent}`} />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/34">{day.label}</p>
                      <h3 className="mt-1 text-[28px] font-black tracking-[-.04em]">{day.date}</h3>
                    </div>
                    <span className="rounded-full border border-[#FF8A2A]/18 bg-[#FF6A1A]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.1em] text-[#FFB13B]">{day.chip}</span>
                  </div>
                  <p className="mt-4 text-sm font-black text-[#FF9A3A]">{day.time} · {day.place}</p>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-white/46">{day.copy}</p>
                  <a href={day.drive} target="_blank" rel="noreferrer" className={`mt-6 flex min-h-[62px] items-center justify-between rounded-[20px] bg-gradient-to-r ${day.accent} px-5 text-[13px] font-black uppercase tracking-[.08em] text-white shadow-[0_16px_36px_rgba(255,106,26,.18)] transition active:scale-[.99]`}>
                    <span>Ver fotos y videos</span><span className="text-lg">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-10">
          <div className="relative overflow-hidden rounded-[34px] border border-[#FF8A2A]/20 bg-[linear-gradient(135deg,#241008_0%,#121214_46%,#2b1308_100%)] p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:p-8">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_50%,rgba(255,118,24,.24),transparent_40%),radial-gradient(circle_at_95%_20%,rgba(255,203,73,.16),transparent_28%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FFB13B]">TOMAS DE TIEMPO · PERFORMANCE</p>
                <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-4xl">Consultá tus tomas de tiempo en clínica y el puntaje otorgado por Miguel.</h2>
                <p className="mt-3 text-sm leading-6 text-white/46">Resultados individuales y devolución técnica de la experiencia.</p>
              </div>
              <button type="button" disabled className="min-h-[56px] shrink-0 rounded-2xl border border-[#FF8A2A]/25 bg-[#FF6A1A]/10 px-5 text-xs font-black uppercase tracking-[.08em] text-[#FFB13B]/70">
                Clic aquí · Próximamente
              </button>
            </div>
          </div>
        </section>

        <section className="pt-10">
          <div className="relative overflow-hidden rounded-[34px] border border-[#FF8A2A]/18 bg-[linear-gradient(135deg,#17100d_0%,#111113_55%,#251208_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-8">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#FF7A22]/20 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] border border-[#FFB13B]/25 bg-[#FF6A1A]/12 text-3xl shadow-[0_10px_26px_rgba(255,106,26,.12)]">🏅</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FFB13B]">INSIGNIA OFICIAL PR</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">Si completaste los 3 días, tu insignia ya forma parte de tu perfil.</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/52">La insignia “Primera Clínica 2026 realizada” queda cargada en tu perfil Punta Rollers como reconocimiento por haber completado la experiencia.</p>
                </div>
              </div>
              <div className="rounded-full border border-[#FF8A2A]/20 bg-[#FF6A1A]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#FFB13B]">Logro PR · 2026</div>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/[.08] py-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-white/28">PUNTA ROLLERS · PUNTA DEL ESTE · URUGUAY</p>
          <p className="mt-2 text-sm font-black text-[#FF8A2A]">No es solo patinar. Es pertenecer.</p>
        </footer>
      </div>
    </main>
  )
}

function Stat({ value, label, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${highlight ? 'border-[#FF8A2A]/25 bg-[#FF6A1A]/10' : 'border-white/10 bg-white/[.04]'}`}>
      <p className={`text-2xl font-black ${highlight ? 'text-[#FFB13B]' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-white/35">{label}</p>
    </div>
  )
}
