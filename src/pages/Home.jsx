import { horarios } from '../data/mockData'
import { useState } from 'react'

export default function Home() {
  const [diaActivo, setDiaActivo] = useState('Lunes')

  const dias = Object.keys(
    horarios.reduce((acc, h) => ({ ...acc, [h.dia]: true }), {})
  )

  const clasesDelDia = horarios.find(h => h.dia === diaActivo)?.clases || []

  return (
    <div className="space-y-10 pb-10">

      {/* HERO */}
      <section className="text-center space-y-4 pt-6">
        <h1 className="text-2xl font-semibold">
          No es solo patinar,
          <br />
          <span className="text-gold-gradient">es pertenecer.</span>
        </h1>

        <p className="text-sm text-white/60">
          Bienvenido a Punta Rollers
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <a href="/login" className="btn-gold">
            Soy alumno → Iniciar sesión
          </a>

          <a href="#horarios" className="btn-ghost">
            Quiero empezar → Ver clases
          </a>
        </div>
      </section>

      {/* HORARIOS */}
      <section id="horarios" className="space-y-4">
        <h2 className="text-xl font-semibold text-center">
          ¿Cuándo entrenamos?
        </h2>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {dias.map(dia => (
            <button
              key={dia}
              onClick={() => setDiaActivo(dia)}
              className={`px-4 py-2 rounded-full text-sm ${
                dia === diaActivo
                  ? 'bg-[#C9A84C] text-black'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {dia}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {clasesDelDia.map((clase, i) => (
            <div key={i} className="glass p-4 rounded-xl">
              <p className="font-medium">{clase.nombre}</p>
              <p className="text-sm text-white/60">{clase.hora}</p>
              <p className="text-xs text-green-400 mt-1">
                {clase.cupos} cupos
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BANNERS */}
      <section className="space-y-4">

        {/* PR CARD */}
        <a
          href="https://puntarollerscard.com/"
          target="_blank"
          className="block glass-gold p-4 rounded-xl"
        >
          <h3 className="font-semibold">PR Card</h3>
          <p className="text-sm text-white/60">
            Tu membresía digital. Beneficios, acceso y experiencia completa dentro del club.
          </p>
        </a>

        {/* ROLLERMAP */}
        <a
          href="https://rollermap.vercel.app/"
          target="_blank"
          className="block glass p-4 rounded-xl"
        >
          <h3 className="font-semibold">RollerMap</h3>
          <p className="text-sm text-white/60">
            Encontrá escuelas y grupos de patín en todo Uruguay cerca tuyo.
          </p>
        </a>

        {/* TRACK SYSTEM */}
        <a
          href="https://tracksystempr.netlify.app/"
          target="_blank"
          className="block glass p-4 rounded-xl"
        >
          <h3 className="font-semibold">Track System</h3>
          <p className="text-sm text-white/60">
            Plataforma de seguimiento de progreso y actividad dentro del club.
          </p>
        </a>

        {/* ALIANZA */}
        <div className="glass p-4 rounded-xl space-y-3">
          <h3 className="font-semibold">Alianza Rollers</h3>

          <p className="text-sm text-white/60">
            Rodamos juntos. Sumá tu energía e invitá a más rolleros a ser parte.
          </p>

          <p className="text-xs text-white/40">
            Comunidad nacional que conecta equipos y organiza salidas en todo Uruguay.
          </p>

          <div className="flex gap-2">
            <a
              href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0"
              target="_blank"
              className="btn-gold text-xs"
            >
              WhatsApp
            </a>

            <a
              href="https://www.instagram.com/alianzaroller"
              target="_blank"
              className="btn-ghost text-xs"
            >
              Instagram
            </a>
          </div>
        </div>

      </section>

      {/* INSCRIPCIONES */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-center">
          Inscripciones abiertas
        </h2>

        <div className="grid grid-cols-1 gap-3">

          <a className="glass p-4 rounded-xl">
            <h3 className="font-semibold">PR Kids</h3>
            <p className="text-sm text-white/60">
              Clases para niños desde 4 años. Aprendizaje progresivo y divertido.
            </p>
          </a>

          <a className="glass p-4 rounded-xl">
            <h3 className="font-semibold">Adultos</h3>
            <p className="text-sm text-white/60">
              Todos los niveles. Técnica, velocidad y progreso real.
            </p>
          </a>

        </div>
      </section>

    </div>
  )
}
