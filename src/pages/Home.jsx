import { Link } from 'react-router-dom'
import { useState } from 'react'
import { horarios } from '../data/mockData'

export default function Home() {
  const [diaActivo, setDiaActivo] = useState(0)

  return (
    <div className="min-h-screen bg-pr-black overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(201,168,76,0.1) 0%, rgba(13,13,26,0.6) 50%, #050508 100%)' }}
      >
        {/* Stars bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 60 + '%',
                opacity: Math.random() * 0.4 + 0.1,
                animation: `glowPulse ${Math.random() * 3 + 2}s ease-in-out ${Math.random() * 2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="animate-fade-up stagger-1 mb-6 relative">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-30"
               style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.5), transparent)' }} />
          <img
            src="/logo.png"
            alt="Punta Rollers"
            className="w-36 h-36 object-contain relative z-10"
            style={{ filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.5))' }}
          />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up stagger-2 font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-3">
          Pertenecer
          <br />
          <span className="text-gold-gradient">no es para todos.</span>
        </h1>

        <p className="animate-fade-up stagger-3 font-body text-white/50 text-base max-w-xs mb-8 leading-relaxed">
          La plataforma oficial de Punta Rollers. Tu club. Tu historia. Sobre ruedas.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up stagger-4 flex flex-col gap-3 w-full max-w-xs">
          <Link to="/login" className="btn-gold text-base font-semibold py-4 w-full">
            Entrar al Club
          </Link>
          <Link to="/login?action=register" className="btn-ghost text-base py-4 w-full">
            Inscribirme
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30 animate-bounce">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── CARDS PRINCIPALES ─────────────────────────────────── */}
      <section className="px-4 py-12">
        <p className="font-body text-xs text-white/30 uppercase tracking-[0.2em] text-center mb-6">El Club</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🛼', label: 'PR Kids',       sub: 'Desde 4 años',        to: '/#kids',     color: '#1A6B4A' },
            { icon: '⚡', label: 'Adultos',        sub: 'Todos los niveles',   to: '/#adultos',  color: '#C9A84C' },
            { icon: '💳', label: 'PRCard',         sub: 'Membresía premium',   to: '/#prcard',   color: '#B8960C' },
            { icon: '📊', label: 'Tracking',       sub: 'Tu progreso',         to: '/#tracking', color: '#3b4ab0' },
            { icon: '🤝', label: 'Alianza Rollers',sub: 'Red en expansión',    to: '/#alianza',  color: '#8B4A9C', wide: true },
          ].map((c, i) => (
            <Link
              key={c.label}
              to={c.to}
              className={`glass rounded-2xl p-5 flex flex-col gap-3 hover:border-pr-gold/30 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${c.wide ? 'col-span-2' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${c.color}22` }}
                >
                  {c.icon}
                </span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(201,168,76,0.4)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div>
                <p className="font-body font-semibold text-white text-sm">{c.label}</p>
                <p className="font-body text-white/40 text-xs mt-0.5">{c.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HORARIOS ─────────────────────────────────────────── */}
      <section className="px-4 py-8" id="horarios">
        <div className="divider-gold mb-8" />
        <p className="font-body text-xs text-white/30 uppercase tracking-[0.2em] text-center mb-2">Horarios</p>
        <h2 className="font-display text-2xl font-semibold text-center text-white mb-6">¿Cuándo entrenamos?</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {horarios.map((h, i) => (
            <button
              key={h.dia}
              onClick={() => setDiaActivo(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
                diaActivo === i
                  ? 'bg-pr-gold text-pr-black'
                  : 'glass text-white/50 hover:text-white/80'
              }`}
            >
              {h.dia}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {horarios[diaActivo]?.clases.map(c => (
            <div key={c.hora} className="glass rounded-xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="font-body font-semibold text-white text-sm">{c.nombre}</p>
                <p className="font-body text-white/40 text-xs mt-0.5">{c.hora}hs</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-pr-green" />
                <span className="text-xs text-white/40 font-body">{c.cupos} cupos</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MOMENTOS PR ──────────────────────────────────────── */}
      <section className="px-4 py-8" id="momentos">
        <div className="divider-gold mb-8" />
        <p className="font-body text-xs text-white/30 uppercase tracking-[0.2em] text-center mb-2">Galería</p>
        <h2 className="font-display text-2xl font-semibold text-center text-white mb-6">Momentos PR</h2>

        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl glass flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${['#1A6B4A22','#C9A84C22','#3b4ab022','#8B4A9C22','#B8960C22','#1A6B4A22'][i]}, transparent)` }}
            >
              <span className="text-2xl opacity-30">{['🛼','⚡','🏅','🎯','💳','🌟'][i]}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-white/30 text-xs font-body mt-4">
          Fotos y videos se cargan desde el panel admin
        </p>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="px-4 py-12 pb-20">
        <div
          className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(26,107,74,0.06) 100%)',
            border: '1px solid rgba(201,168,76,0.2)',
          }}
        >
          <img src="/logo.png" alt="" className="w-16 h-16 object-contain mx-auto mb-4 opacity-80" />
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            ¿Ya sos parte de<br />Punta Rollers?
          </h3>
          <p className="text-white/40 text-sm font-body mb-6">Entrá al Club y accedé a tu perfil, PRCard, actividad y más.</p>
          <Link to="/login" className="btn-gold w-full block text-center">
            Entrar al Club
          </Link>
        </div>
      </section>

    </div>
  )
}
