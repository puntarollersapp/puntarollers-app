import { useAuth } from '../lib/auth'
import { mockUser } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

export default function PRCardPage() {
  const { user } = useAuth()
  const u = user || mockUser

  return (
    <AppLayout title="Mi PRCard" showBack>
      <div className="px-4 py-4 space-y-5">

        <div className="animate-fade-up">
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-3 text-center">
            Tarjeta de miembro
          </p>

          <div
            className="pr-card relative rounded-3xl overflow-hidden"
            style={{
              aspectRatio: '1.586',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <div
              className="absolute inset-0 shimmer-gold opacity-60"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.08) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
              }}
            />

            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
              <div className="flex items-start justify-between">
                <img
                  src="/logo.png"
                  alt="PR"
                  className="w-12 h-12 object-contain"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.6))' }}
                />

                <div className="text-right">
                  <p
                    className="font-display text-xs font-semibold"
                    style={{ color: 'rgba(201,168,76,0.6)', letterSpacing: '0.15em' }}
                  >
                    PUNTA ROLLERS
                  </p>
                  <p className="font-body text-white/30 text-[10px] tracking-wider">
                    MEMBER CARD
                  </p>
                </div>
              </div>

              <div>
                <p className="font-display text-lg font-bold text-white tracking-wide">
                  {u.nombre?.toUpperCase()}
                </p>

                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-[10px] text-white/30 font-body uppercase tracking-wider">
                      Documento
                    </p>
                    <p className="text-white/70 text-sm font-mono">
                      {u.documento}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-white/30 font-body uppercase tracking-wider">
                      Miembro desde
                    </p>
                    <p className="text-white/70 text-sm font-body">
                      {u.miembroDesde || '2026'}
                    </p>
                  </div>

                  <div
                    className="px-2.5 py-1 rounded-lg text-xs font-body font-bold"
                    style={{
                      background: 'rgba(201,168,76,0.2)',
                      color: '#E8D48E',
                      border: '1px solid rgba(201,168,76,0.4)',
                    }}
                  >
                    {u.estado?.toUpperCase() || 'ACTIVO'}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-10"
              style={{ background: 'radial-gradient(ellipse, #C9A84C, transparent)' }}
            />
          </div>
        </div>

        <div className="animate-fade-up stagger-1 glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-body font-semibold text-sm">
              Estado de PRCard
            </p>

            <span className="status-active text-xs px-2 py-0.5 rounded-full font-body">
              {u.prcard?.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          <div className="space-y-2 text-sm font-body">
            {[
              { label: 'Tipo', value: 'PRCard Elite' },
              { label: 'Vencimiento', value: 'Enero 2027' },
              { label: 'Beneficios', value: 'Descuentos activos' },
              { label: 'Plataforma', value: 'Disponible' },
            ].map(r => (
              <div key={r.label} className="flex justify-between gap-4">
                <span className="text-white/40">{r.label}</span>
                <span className="text-white/80 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="animate-fade-up stagger-2 rounded-3xl p-5 space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(255,255,255,0.035))',
            border: '1px solid rgba(201,168,76,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}
        >
          <div>
            <p className="section-label">Plataforma externa</p>
            <h2 className="text-white text-xl font-semibold mt-2">
              Acceder a mi PRCard
            </h2>
            <p className="text-white/45 text-sm mt-2">
              Consultá comercios adheridos, beneficios disponibles y detalles actualizados de tu tarjeta.
            </p>
          </div>

          <a
            href={u.prcard?.link || 'https://puntarollerscard.com/'}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-2xl py-4 text-center text-sm font-bold active:scale-[0.98]"
            style={{
              background: '#C9A84C',
              color: '#08080d',
            }}
          >
            Ir a mi PRCard
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
