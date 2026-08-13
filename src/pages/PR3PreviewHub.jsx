import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'

const MODULES = [
  {
    title: 'PR Moments',
    subtitle: '24 horas · foto, video, reacción y conversación',
    icon: '◎',
    accent: '#8b5cf6',
    href: '/app/pr3/moments',
    status: 'Preview activa',
  },
  {
    title: 'RollerFeed 3.0',
    subtitle: 'El diario vivo de Punta Rollers',
    icon: '⚡',
    accent: '#ff7a45',
    href: '/app/actividad',
    status: 'Arquitectura en curso',
  },
  {
    title: 'Perfil Deportivo 2.0',
    subtitle: 'Level, streak, temporada, estilo y progreso',
    icon: '◉',
    accent: '#42d5ff',
    href: '/app/perfil',
    status: 'Diseño en curso',
  },
]

export default function PR3PreviewHub() {
  const { user } = useAuth()
  const firstName = String(user?.nombre || 'Patinador').trim().split(' ')[0]

  return (
    <AppLayout title="PR 3.0 LAB" showBack>
      <div className="px-4 pb-14 pt-4">
        <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0b0b0f] p-5 shadow-[0_28px_80px_rgba(0,0,0,.42)]">
          <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-orange-500/15 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
              Development preview
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/30">Punta Rollers 3.0</p>
            <h1 className="mt-1 font-display text-[34px] font-black leading-[.95] text-white">
              PLAY · SOCIAL · PERFORMANCE
            </h1>
            <p className="mt-4 max-w-[340px] text-sm leading-relaxed text-white/50">
              Hola {firstName}. Este laboratorio está aislado de producción. Acá probamos las nuevas experiencias antes de decidir qué llega a la app oficial.
            </p>

            <div className="mt-5 rounded-[22px] border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Producción protegida</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                Nada de este laboratorio aparece en la navegación principal ni modifica los módulos que hoy ya funcionan.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7">
          <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/28">Fase 1 · Social</p>
          <div className="mt-3 space-y-3">
            {MODULES.map((module) => (
              <Link
                key={module.title}
                to={module.href}
                className="group block rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-4 transition active:scale-[.985]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-[19px] border text-2xl font-black"
                    style={{
                      color: module.accent,
                      borderColor: `${module.accent}30`,
                      background: `${module.accent}12`,
                      boxShadow: `0 12px 32px ${module.accent}12`,
                    }}
                  >
                    {module.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-lg font-black text-white">{module.title}</h2>
                      <span className="text-white/25 transition group-hover:translate-x-0.5">›</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/40">{module.subtitle}</p>
                    <p className="mt-2 text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: module.accent }}>
                      {module.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-[25px] border border-white/[0.065] bg-black/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Próximas fases</p>
          <p className="mt-3 text-sm font-bold text-white/70">Challenges · Objetivo PR · Level · Streak</p>
          <p className="mt-2 text-sm font-bold text-white/45">Mi Temporada · Eventos · Check-in · Rankings</p>
          <p className="mt-2 text-sm font-bold text-violet-300/80">PR GO! · Territory · Heatmap</p>
        </div>
      </div>
    </AppLayout>
  )
}
