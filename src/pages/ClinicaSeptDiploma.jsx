import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ClinicaSeptDiploma() {
  const [name, setName] = useState('')

  function printDiploma() {
    window.print()
  }

  return (
    <main className="min-h-screen bg-[#EEF2F7] px-3 py-4 text-[#0A1830] print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl print:max-w-none">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to="/clinica-septiembre-2026" className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black shadow-sm">← Volver a la clínica</Link>
          <button type="button" onClick={printDiploma} className="rounded-full bg-[#0A1830] px-5 py-2.5 text-xs font-black text-white shadow-lg">Guardar / imprimir PDF</button>
        </div>

        <div className="mb-4 rounded-[24px] border border-black/[.06] bg-white p-4 shadow-[0_16px_50px_rgba(18,26,43,.08)] print:hidden">
          <label className="text-[10px] font-black uppercase tracking-[.16em] text-black/45">Nombre para tu diploma</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Escribí tu nombre completo" className="mt-2 w-full rounded-2xl border border-black/10 bg-[#F8FAFD] px-4 py-3 text-base font-bold outline-none focus:border-[#C69B36]" />
          <p className="mt-2 text-[11px] leading-5 text-black/45">Versión digital destinada a quienes completaron las tres jornadas de la clínica.</p>
        </div>

        <section className="relative aspect-[1.414/1] overflow-hidden rounded-[12px] bg-[#FFFEFB] shadow-[0_30px_80px_rgba(0,0,0,.14)] print:rounded-none print:shadow-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_11%_20%,rgba(198,155,54,.12),transparent_23%),radial-gradient(circle_at_88%_16%,rgba(43,162,255,.09),transparent_24%),linear-gradient(90deg,rgba(255,255,255,.96),rgba(251,249,242,.92))]" />

          <div className="absolute left-0 top-0 h-full w-[15%] overflow-hidden">
            <div className="absolute -left-[38%] top-[8%] h-[26px] w-[150%] rotate-[-42deg] bg-[#D3A63D]" />
            <div className="absolute -left-[30%] top-[17%] h-[14px] w-[142%] rotate-[-42deg] bg-[#0B1D3A]" />
            <div className="absolute -left-[22%] top-[25%] h-[8px] w-[135%] rotate-[-42deg] bg-[#28BDF2]" />
            <div className="absolute left-[6%] top-[38%] h-[38%] w-[68%] rounded-r-[54px] bg-[linear-gradient(180deg,rgba(11,29,58,.96),rgba(29,54,87,.88))] shadow-[0_15px_40px_rgba(11,29,58,.2)]" />
            <div className="absolute left-[18%] top-[44%] text-[10px] font-black uppercase tracking-[.22em] text-white/80 [writing-mode:vertical-rl] rotate-180">PUNTA ROLLERS · 2026</div>
          </div>

          <div className="absolute right-0 top-0 h-full w-[17%] overflow-hidden">
            <div className="absolute -right-[34%] top-[10%] h-[20px] w-[150%] rotate-[42deg] bg-[#D3A63D]" />
            <div className="absolute -right-[26%] top-[18%] h-[10px] w-[142%] rotate-[42deg] bg-[#0B1D3A]" />
            <div className="absolute -right-[18%] bottom-[22%] h-[18px] w-[142%] rotate-[-42deg] bg-[#D3A63D]" />
            <div className="absolute -right-[26%] bottom-[13%] h-[8px] w-[150%] rotate-[-42deg] bg-[#29BDF4]" />
            <div className="absolute right-[20%] top-[34%] text-[110px] font-black leading-none tracking-[-.08em] text-[#0B1D3A]/[.035]">PR</div>
          </div>

          <div className="absolute inset-x-[14.5%] top-[3.5%] flex items-start justify-center gap-10">
            <div className="text-center">
              <img src="/logo.png" alt="Punta Rollers" className="mx-auto h-14 w-14 object-contain" />
              <p className="mt-1 text-[8px] font-black uppercase tracking-[.18em] text-[#0B1D3A]">PUNTA ROLLERS</p>
            </div>
            <div className="mt-1 h-16 w-px bg-[#D3A63D]/70" />
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center text-[24px] font-black text-[#0B1D3A]">MF</div>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[.15em] text-[#8A6511]">MIGUEL FLORES</p>
              <p className="mt-1 text-[6.5px] font-semibold uppercase tracking-[.09em] text-black/40">Profesor · Entrenador</p>
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col px-[16.5%] pb-[4.5%] pt-[14%] text-center">
            <p className="text-[8px] font-black uppercase tracking-[.24em] text-[#9A761F]">VERSIÓN DIGITAL · 2026</p>
            <h1 className="mt-1 text-[56px] font-black leading-[.88] tracking-[-.055em]"><span className="bg-gradient-to-r from-[#D5A83E] via-[#F1C75F] to-[#A77A13] bg-clip-text text-transparent">DIPLOMA</span> <span className="text-[#0B1D3A]">OFICIAL</span></h1>
            <h2 className="mt-2 text-[17px] font-black uppercase tracking-[.08em] text-[#0B1D3A]">Primera Clínica Internacional de Patinaje</h2>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[.3em] text-[#B07B16]">Punta del Este</p>

            <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-black/38">Se otorga el presente diploma a</p>
            <div className="mx-auto mt-2 min-h-11 w-[68%] border-b-2 border-[#0B1D3A] pb-2 text-[26px] font-black italic tracking-[-.025em] text-[#0B1D3A]">
              {name || ' '}
            </div>

            <p className="mx-auto mt-3 max-w-3xl text-[10px] leading-[1.55] text-[#26344A]">
              Por haber completado exitosamente la Primera Clínica Internacional de Patinaje en Punta del Este, participando activamente en todas sus instancias y demostrando compromiso, pasión y espíritu de superación.
            </p>

            <div className="mx-auto mt-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[.11em] text-[#0B1D3A]">
              <span>Viernes 4</span><span className="text-[#D2A13A]">•</span><span>Sábado 5</span><span className="text-[#28AEE7]">•</span><span>Domingo 6</span>
            </div>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[.3em] text-black/35">Setiembre 2026</p>

            <div className="mx-auto mt-3 rounded-[18px] border border-[#D9C592]/35 bg-[#FFFDF7] px-6 py-3 shadow-[0_8px_24px_rgba(177,134,35,.08)]">
              <p className="text-[7px] font-black uppercase tracking-[.18em] text-black/35">Clínica avalada y dictada por</p>
              <p className="mt-1 text-[16px] font-black text-[#0B1D3A]">Miguel Flores 🇦🇷</p>
              <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#9A7219]">Subcampeón Máster Mundial · +40 años de experiencia</p>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-8 pt-5 text-center">
              <Person name="Claudio Facelli" role="Profesor" detail="Auxiliar técnico en la clínica" />
              <Person name="Miguel Flores" role="Profesor · Entrenador" detail="Subcampeón Máster Mundial" />
              <Person name="David Almeida" role="Profesor" detail="Auxiliar técnico en la clínica" />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-[#D3A63D]" />
              <p className="text-[7px] font-black uppercase tracking-[.22em] text-black/38">www.puntarollers.com</p>
              <span className="h-px w-12 bg-[#28AEE7]" />
            </div>
          </div>
        </section>
      </div>

      <style>{`@media print { @page { size: A4 landscape; margin: 0; } html, body, #root { width: 297mm; height: 210mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } main { width: 297mm; height: 210mm; } section { width: 297mm !important; height: 210mm !important; aspect-ratio: auto !important; } }`}</style>
    </main>
  )
}

function Person({ name, role, detail }) {
  return (
    <div>
      <div className="mx-auto mb-2 h-px w-24 bg-[#0B1D3A]/75" />
      <p className="text-[9px] font-black uppercase tracking-[.08em] text-[#0B1D3A]">{name}</p>
      <p className="mt-1 text-[7px] font-black uppercase tracking-[.12em] text-[#9A7219]">{role}</p>
      <p className="mt-1 text-[6.5px] uppercase tracking-[.07em] text-black/34">{detail}</p>
    </div>
  )
}
