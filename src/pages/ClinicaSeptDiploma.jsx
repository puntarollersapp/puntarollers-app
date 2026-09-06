import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ClinicaSeptDiploma() {
  const [name, setName] = useState('')

  function printDiploma() {
    window.print()
  }

  return (
    <main className="min-h-screen bg-[#EEF2F8] px-3 py-4 text-[#08111F] print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl print:max-w-none">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to="/clinica-septiembre-2026" className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black shadow-sm">← Volver a la clínica</Link>
          <button type="button" onClick={printDiploma} className="rounded-full bg-[#08111F] px-5 py-2.5 text-xs font-black text-white shadow-lg">Guardar / imprimir PDF</button>
        </div>

        <div className="mb-4 rounded-[24px] border border-black/[.06] bg-white p-4 shadow-[0_16px_50px_rgba(18,26,43,.08)] print:hidden">
          <label className="text-[10px] font-black uppercase tracking-[.16em] text-black/45">Nombre para tu diploma</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Escribí tu nombre completo" className="mt-2 w-full rounded-2xl border border-black/10 bg-[#F6F8FC] px-4 py-3 text-base font-bold outline-none focus:border-[#5F62FF]" />
          <p className="mt-2 text-[11px] leading-5 text-black/45">Versión digital destinada a quienes completaron las tres jornadas de la clínica.</p>
        </div>

        <section className="relative aspect-[1.414/1] overflow-hidden rounded-[10px] bg-white shadow-[0_30px_80px_rgba(0,0,0,.14)] print:rounded-none print:shadow-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_7%_10%,rgba(31,202,255,.16),transparent_27%),radial-gradient(circle_at_92%_8%,rgba(255,194,66,.2),transparent_23%),radial-gradient(circle_at_86%_82%,rgba(125,87,255,.13),transparent_26%)]" />
          <div className="absolute left-0 top-0 h-[10px] w-full bg-gradient-to-r from-[#36D8FF] via-[#6A5BFF] via-55% to-[#FFCB4A]" />
          <div className="absolute left-[-110px] top-[110px] h-[44px] w-[440px] -rotate-[38deg] bg-[#08111F]" />
          <div className="absolute left-[-60px] top-[165px] h-[14px] w-[360px] -rotate-[38deg] bg-[#39D6FF]" />
          <div className="absolute right-[-130px] bottom-[72px] h-[50px] w-[500px] -rotate-[35deg] bg-[#FFCB4A]" />
          <div className="absolute right-[-70px] bottom-[138px] h-[14px] w-[400px] -rotate-[35deg] bg-[#6A5BFF]" />
          <div className="absolute right-[8%] top-[7%] text-[180px] font-black leading-none tracking-[-.08em] text-[#08111F]/[.035]">PR</div>

          <div className="relative z-10 flex h-full flex-col px-[10.5%] py-[4.5%] text-center">
            <div className="flex items-start justify-center gap-9">
              <div>
                <img src="/logo.png" alt="Punta Rollers" className="mx-auto h-14 w-14 object-contain" />
                <p className="mt-1 text-[8px] font-black uppercase tracking-[.2em]">PUNTA ROLLERS</p>
              </div>
              <div className="mt-1 h-16 w-px bg-black/10" />
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-black/[.06] bg-[#F6F7FB] text-xl font-black">MF</div>
                <p className="mt-1 text-[8px] font-black uppercase tracking-[.16em]">MIGUEL FLORES</p>
                <p className="mt-1 text-[6.5px] uppercase tracking-[.11em] text-black/40">Profesor · Entrenador</p>
              </div>
            </div>

            <div className="mx-auto mt-4 inline-flex rounded-full bg-[#08111F] px-4 py-1.5 text-[8px] font-black uppercase tracking-[.22em] text-white">DIPLOMA DIGITAL · 2026</div>
            <h1 className="mt-2 text-[52px] font-black leading-[.9] tracking-[-.06em]"><span className="bg-gradient-to-r from-[#10BFEF] via-[#6958FF] to-[#E7A511] bg-clip-text text-transparent">DIPLOMA</span> OFICIAL</h1>
            <h2 className="mt-2 text-lg font-black uppercase tracking-[.07em]">Primera Clínica Internacional de Patinaje</h2>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[.32em] text-[#9B6E00]">Punta del Este</p>

            <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[.13em]">
              <span className="rounded-full bg-[#E9F9FE] px-3 py-1.5 text-[#037A9A]">+6 horas</span>
              <span className="rounded-full bg-[#F0EDFF] px-3 py-1.5 text-[#5841C9]">3 jornadas</span>
              <span className="rounded-full bg-[#FFF5D7] px-3 py-1.5 text-[#936800]">4 · 5 · 6 SET</span>
            </div>

            <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-black/38">Se otorga el presente diploma a</p>
            <div className="mx-auto mt-2 min-h-11 w-[68%] border-b-2 border-[#08111F] pb-2 text-[25px] font-black italic tracking-[-.025em] text-[#08111F]">
              {name || ' '}
            </div>

            <p className="mx-auto mt-3 max-w-3xl text-[10px] leading-[1.55] text-black/58">
              Por haber completado exitosamente la Primera Clínica Internacional de Patinaje en Punta del Este, participando activamente en todas sus instancias y demostrando compromiso, pasión y espíritu de superación.
            </p>

            <div className="mx-auto mt-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[.11em] text-[#08111F]">
              <span>Viernes 4</span><span className="text-[#10BFEF]">•</span><span>Sábado 5</span><span className="text-[#6958FF]">•</span><span>Domingo 6</span>
            </div>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[.3em] text-black/35">Setiembre 2026</p>

            <div className="mt-3 rounded-[18px] border border-black/[.05] bg-[#F8FAFD] px-5 py-3">
              <p className="text-[7px] font-black uppercase tracking-[.18em] text-black/35">Clínica avalada y dictada por</p>
              <p className="mt-1 text-base font-black">Miguel Flores 🇦🇷</p>
              <p className="text-[8px] font-black uppercase tracking-[.1em] text-[#5A46D9]">Subcampeón Máster Mundial · +40 años de experiencia</p>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-7 pt-4 text-center">
              <Person name="Claudio Facelli" role="Profesor" detail="Auxiliar técnico en la clínica" tone="cyan" />
              <Person name="Miguel Flores" role="Profesor · Entrenador" detail="Subcampeón Máster Mundial" tone="violet" />
              <Person name="David Almeida" role="Profesor" detail="Auxiliar técnico en la clínica" tone="gold" />
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#10BFEF]" /><p className="text-[7px] font-black uppercase tracking-[.22em] text-black/35">www.puntarollers.com</p><span className="h-px w-10 bg-[#FFB923]" />
            </div>
          </div>
        </section>
      </div>

      <style>{`@media print { @page { size: A4 landscape; margin: 0; } html, body, #root { width: 297mm; height: 210mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } main { width: 297mm; height: 210mm; } section { width: 297mm !important; height: 210mm !important; aspect-ratio: auto !important; } }`}</style>
    </main>
  )
}

function Person({ name, role, detail, tone }) {
  const tones = {
    cyan: 'from-[#33D5FF] to-[#2084FF]',
    violet: 'from-[#806BFF] to-[#B24DFF]',
    gold: 'from-[#FFD05D] to-[#F29B26]',
  }

  return (
    <div>
      <div className={`mx-auto mb-2 h-1.5 w-14 rounded-full bg-gradient-to-r ${tones[tone] || tones.cyan}`} />
      <p className="text-[9px] font-black uppercase tracking-[.08em]">{name}</p>
      <p className="mt-1 text-[7px] font-black uppercase tracking-[.12em] text-black/52">{role}</p>
      <p className="mt-1 text-[6.5px] uppercase tracking-[.07em] text-black/34">{detail}</p>
    </div>
  )
}
