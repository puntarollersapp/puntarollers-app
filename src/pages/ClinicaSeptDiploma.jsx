import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ClinicaSeptDiploma() {
  const [name, setName] = useState('')

  function printDiploma() {
    window.print()
  }

  return (
    <main className="min-h-screen bg-[#ece9df] px-3 py-4 text-[#0a1930] print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl print:max-w-none">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link to="/clinica-septiembre-2026" className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black">← Volver a la clínica</Link>
          <button type="button" onClick={printDiploma} className="rounded-full bg-[#0a1930] px-5 py-2.5 text-xs font-black text-white">Guardar / imprimir PDF</button>
        </div>

        <div className="mb-4 rounded-2xl border border-black/10 bg-white p-4 print:hidden">
          <label className="text-[10px] font-black uppercase tracking-[.16em] text-black/45">Nombre para tu diploma</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Escribí tu nombre completo" className="mt-2 w-full rounded-xl border border-black/10 bg-[#f6f4ee] px-4 py-3 text-base font-bold outline-none focus:border-[#c79a30]" />
          <p className="mt-2 text-[11px] leading-5 text-black/45">Esta versión digital está destinada a quienes completaron las tres jornadas de la clínica.</p>
        </div>

        <section className="relative aspect-[1.414/1] overflow-hidden bg-[#faf9f5] shadow-[0_30px_80px_rgba(0,0,0,.18)] print:shadow-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_25%,rgba(199,154,48,.12),transparent_30%),radial-gradient(circle_at_92%_20%,rgba(8,145,178,.07),transparent_28%)]" />
          <div className="absolute -left-20 top-0 h-full w-60 rotate-[9deg] border-r-[18px] border-[#c79a30]/80 bg-[#0a1930]" />
          <div className="absolute -right-16 top-0 h-full w-40 -rotate-[8deg] border-l-[10px] border-[#c79a30]/70 bg-[#0a1930]" />
          <div className="absolute right-[10%] top-[12%] text-[180px] font-black leading-none text-[#0a1930]/[.035]">PR</div>

          <div className="relative z-10 flex h-full flex-col px-[12%] py-[5%] text-center">
            <div className="flex items-start justify-center gap-10">
              <div>
                <img src="/logo.png" alt="Punta Rollers" className="mx-auto h-16 w-16 object-contain" />
                <p className="mt-1 text-[9px] font-black uppercase tracking-[.2em]">PUNTA ROLLERS</p>
              </div>
              <div className="h-20 w-px bg-[#c79a30]/60" />
              <div>
                <p className="text-xl font-black tracking-[-.03em]">MF</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[.16em]">MIGUEL FLORES</p>
                <p className="mt-1 text-[7px] uppercase tracking-[.12em] text-black/45">Profesor · Entrenador</p>
              </div>
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[.24em] text-[#a87b14]">VERSIÓN DIGITAL · 2026</p>
            <h1 className="mt-1 text-5xl font-black leading-none tracking-[-.055em]"><span className="text-[#c79a30]">DIPLOMA</span> OFICIAL</h1>
            <h2 className="mt-2 text-lg font-black uppercase tracking-[.08em]">Primera Clínica Internacional de Patinaje</h2>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[.32em] text-[#a87b14]">Punta del Este</p>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-black/45">Se otorga el presente diploma a</p>
            <div className="mx-auto mt-3 min-h-12 w-[72%] border-b border-[#0a1930] pb-2 text-2xl font-black italic tracking-[-.02em] text-[#0a1930]">
              {name || ' '}
            </div>

            <p className="mx-auto mt-4 max-w-3xl text-[11px] leading-5 text-black/65">
              Por haber completado exitosamente la Primera Clínica Internacional de Patinaje en Punta del Este, participando activamente en todas sus instancias y demostrando compromiso, pasión y espíritu de superación.
            </p>

            <p className="mt-4 text-sm font-black uppercase tracking-[.06em] text-[#a87b14]">Viernes 4 · Sábado 5 · Domingo 6</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[.32em]">Setiembre 2026</p>

            <div className="mt-5">
              <p className="text-[8px] font-black uppercase tracking-[.18em] text-black/45">Clínica avalada y dictada por</p>
              <p className="mt-1 text-lg font-black">Miguel Flores 🇦🇷</p>
              <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#a87b14]">Subcampeón Máster Mundial · +40 años de experiencia</p>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-8 pt-5 text-center">
              <Person name="Claudio Facelli" role="Profesor" detail="Auxiliar técnico en la clínica" />
              <Person name="Miguel Flores" role="Profesor · Entrenador" detail="Subcampeón Máster Mundial" />
              <Person name="David Almeida" role="Profesor" detail="Auxiliar técnico en la clínica" />
            </div>

            <p className="mt-4 text-[8px] font-black uppercase tracking-[.22em] text-black/35">www.puntarollers.com · No es solo patinar. Es pertenecer.</p>
          </div>
        </section>
      </div>

      <style>{`@media print { @page { size: A4 landscape; margin: 0; } html, body, #root { width: 297mm; height: 210mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } main { width: 297mm; height: 210mm; } section { width: 297mm !important; height: 210mm !important; aspect-ratio: auto !important; } }`}</style>
    </main>
  )
}

function Person({ name, role, detail }) {
  return (
    <div className="border-t border-[#0a1930]/60 pt-2">
      <p className="text-[10px] font-black uppercase tracking-[.08em]">{name}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-[#a87b14]">{role}</p>
      <p className="mt-1 text-[7px] uppercase tracking-[.08em] text-black/40">{detail}</p>
    </div>
  )
}
