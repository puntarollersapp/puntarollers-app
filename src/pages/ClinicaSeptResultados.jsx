import { Link } from 'react-router-dom'

const kidsTimes = [
  ['Joaquín', '1:49'],
  ['Carmela', '1:43'],
  ['Lucía', '1:49.003'],
  ['Candela', '1:53'],
  ['Santino', '2:00'],
]

const adultTimes = [
  ['Monserrat', '3:17'],
  ['Cristel', '4:06'],
  ['Camila', '3:30'],
  ['Catherine', '3:49'],
  ['Natalia Birriel', '4:09'],
  ['Eva', '4:30'],
  ['María José', '5:15'],
  ['Emilia', '4:15'],
  ['Claudia', '4:52'],
  ['Macarena', '3:31'],
  ['Elizabeth', '3:36'],
  ['Alis', '4:04'],
  ['Fernanda', '4:41'],
  ['Damián', '2:58'],
  ['Richard', '2:44'],
  ['Juan Pablo', '3:24'],
  ['Lionel', '3:52'],
]

const kidsScores = [
  ['Joaquín', '5'],
  ['Aurora', '4'],
  ['Santino', '5'],
  ['Lucía', '5'],
  ['Candela', '5'],
  ['Carmela', '5,5'],
]

const adultScores = [
  ['Damián', '5'],
  ['Richard', '5'],
  ['Catherine', '6'],
  ['Juan Pablo', '5'],
  ['Emilia', '4,5'],
  ['Gabriela', '3,5'],
  ['Natalia Virriel', '5'],
  ['Lionel', '5'],
  ['Macarena', '4,5'],
  ['María José', '4'],
  ['Elizabeth', '6'],
  ['Camila Iglesias', '6'],
  ['Claudia', '4'],
  ['Eva', '5'],
  ['María Noel', '5'],
  ['Fernanda', '5'],
  ['Carolina', '5'],
  ['Cristel', '6'],
  ['Monse', '6'],
]

function ResultRow({ name, value, suffix }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-white/[.07] bg-white/[.035] px-4 py-3.5">
      <p className="min-w-0 text-sm font-black text-white">{name}</p>
      <div className="shrink-0 rounded-full border border-[#FF8A2A]/20 bg-[#FF6A1A]/10 px-3 py-1.5 text-sm font-black text-[#FFB13B]">
        {value}{suffix ? <span className="ml-1 text-[10px] uppercase tracking-[.08em] text-[#FFB13B]/70">{suffix}</span> : null}
      </div>
    </div>
  )
}

function ResultBlock({ eyebrow, title, subtitle, items, suffix, accent = 'orange' }) {
  const isGold = accent === 'gold'
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/[.08] bg-[linear-gradient(145deg,#121214_0%,#17100d_100%)] shadow-[0_24px_70px_rgba(0,0,0,.22)]">
      <div className={`h-2 ${isGold ? 'bg-gradient-to-r from-[#FFC857] via-[#FF9A3A] to-[#FF6A1A]' : 'bg-gradient-to-r from-[#FF6A1A] via-[#FF8A2A] to-[#FFC857]'}`} />
      <div className="p-5 sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#FF9A3A]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-white/46">{subtitle}</p>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {items.map(([name, value]) => <ResultRow key={`${name}-${value}`} name={name} value={value} suffix={suffix} />)}
        </div>
      </div>
    </section>
  )
}

export default function ClinicaSeptResultados() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,106,26,.22),transparent_26%),radial-gradient(circle_at_92%_8%,rgba(255,196,73,.16),transparent_24%),radial-gradient(circle_at_50%_78%,rgba(95,35,10,.2),transparent_32%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6">
        <nav className="flex items-center justify-between rounded-[24px] border border-white/[.08] bg-[#111113]/92 px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,.28)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Punta Rollers" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FF8A2A]">Punta Rollers</p>
              <p className="text-xs font-semibold text-white/42">Resultados · Clínica Septiembre 2026</p>
            </div>
          </div>
          <Link to="/clinica-septiembre-2026" className="rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-[10px] font-black uppercase tracking-[.12em] text-white">Volver</Link>
        </nav>

        <section className="relative mt-5 overflow-hidden rounded-[36px] border border-[#FF8A2A]/20 bg-[linear-gradient(135deg,#261108_0%,#111113_52%,#2b1408_100%)] p-6 shadow-[0_35px_110px_rgba(0,0,0,.36)] sm:p-9">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#FF7A22]/20 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#FFB13B]">PERFORMANCE · DÍA 3</p>
            <h1 className="mt-3 max-w-4xl text-[42px] font-black leading-[.9] tracking-[-.055em] sm:text-6xl">Tomas de tiempo + evaluación técnica.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/52 sm:text-base">Registro de la Primera Clínica Internacional de Patinaje 2026. Los tiempos y las calificaciones se muestran como devolución técnica de la experiencia, no como un ranking ni una competencia interna.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.1em]">
              <span className="rounded-full bg-[#FF6A1A] px-3 py-2">Niños · 500 m</span>
              <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2">Adultos · 1.000 m</span>
              <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2">Evaluación técnica · Día 3</span>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5">
          <ResultBlock eyebrow="TOMA DE TIEMPO" title="Niños · 500 metros" subtitle="Tiempo registrado durante la clínica para la distancia de 500 metros." items={kidsTimes} />
          <ResultBlock eyebrow="TOMA DE TIEMPO" title="Adultos · 1.000 metros" subtitle="Tiempo registrado durante la clínica para la distancia de 1.000 metros." items={adultTimes} accent="gold" />
        </div>

        <section className="mt-8 rounded-[34px] border border-[#FFB13B]/18 bg-[linear-gradient(145deg,#17100d_0%,#111113_58%,#251208_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#FFB13B]">CALIFICACIÓN TÉCNICA · DÍA 3</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Puntaje otorgado por Miguel.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/48">Esta calificación corresponde al trabajo y la técnica observados durante la jornada de hoy. Es una devolución técnica individual dentro de la clínica.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black">Niños</h3><span className="rounded-full bg-[#FF6A1A]/12 px-3 py-1 text-[9px] font-black uppercase tracking-[.1em] text-[#FFB13B]">Día 3</span></div>
              <div className="grid gap-2.5">{kidsScores.map(([name, value]) => <ResultRow key={`${name}-${value}`} name={name} value={value} suffix="pts" />)}</div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black">Adultos</h3><span className="rounded-full bg-[#FF6A1A]/12 px-3 py-1 text-[9px] font-black uppercase tracking-[.1em] text-[#FFB13B]">Día 3</span></div>
              <div className="grid gap-2.5">{adultScores.map(([name, value]) => <ResultRow key={`${name}-${value}`} name={name} value={value} suffix="pts" />)}</div>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-white/[.08] py-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-white/28">PUNTA ROLLERS · CLÍNICA INTERNACIONAL 2026</p>
          <p className="mt-2 text-sm font-black text-[#FF8A2A]">Tu progreso también es parte de la experiencia.</p>
        </footer>
      </div>
    </main>
  )
}
