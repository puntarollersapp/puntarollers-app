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
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-3 text-center">Tarjeta de Miembro</p>

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
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.08) 50%, transparent 60%)', backgroundSize: '200% 100%' }}
            />

            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
              <div className="flex items-start justify-between">
                <img src="/logo.png" alt="PR" className="w-12 h-12 object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.6))' }} />
                <div className="text-right">
                  <p className="font-display text-xs font-semibold" style={{ color: 'rgba(201,168,76,0.6)', letterSpacing: '0.15em' }}>PUNTA ROLLERS</p>
                  <p className="font-body text-white/30 text-[10px] tracking-wider">MEMBER CARD</p>
                </div>
              </div>

              <div className="flex justify-end">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>

              <div>
                <p className="font-display text-lg font-bold text-white tracking-wide">{u.nombre?.toUpperCase()}</p>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-[10px] text-white/30 font-body uppercase tracking-wider">Documento</p>
                    <p className="text-white/70 text-sm font-mono">{u.documento}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 font-body uppercase tracking-wider">Miembro desde</p>
                    <p className="text-white/70 text-sm font-body">{new Date(u.miembro_desde || '2022-03-15').getFullYear()}</p>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-lg text-xs font-body font-bold"
                    style={{ background: 'rgba(201,168,76,0.2)', color: '#E8D48E', border: '1px solid rgba(201,168,76,0.4)' }}
                  >
                    {u.estado?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-10"
                 style={{ background: 'radial-gradient(ellipse, #C9A84C, transparent)' }} />
          </div>
        </div>

        <div className="animate-fade-up stagger-1 glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-body font-semibold text-sm">Estado de PRCard</p>
            <span className="status-active text-xs px-2 py-0.5 rounded-full font-body">Activa</span>
          </div>
          <div className="space-y-2 text-sm font-body">
            {[
              { label: 'Tipo',        value: 'PRCard Elite' },
              { label: 'Vencimiento', value: 'Dic 2025' },
              { label: 'Descuentos',  value: '15% en alianzas' },
              { label: 'Acceso NFC',  value: 'Habilitado' },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-white/40">{r.label}</span>
                <span className="text-white/80">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div id="nfc" className="animate-fade-up stagger-2">
          <p className="text-white/40 text-xs font-body uppercase tracking-[0.15em] mb-3">Registro NFC</p>
          <div
            className="rounded-2xl p-6 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(26,107,74,0.05) 100%)',
              border: '1px solid rgba(201,168,76,0.15)',
            }}
          >
            <div className="nfc-pulse inline-flex w-20 h-20 rounded-full bg-pr-gold/10 items-center justify-center mb-4">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#C9A84C" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <p className="text-white font-body font-semibold mb-1">Registrar asistencia</p>
            <p className="text-white/40 text-sm font-body">Acercá tu tarjeta NFC al lector para registrar automáticamente tu asistencia.</p>
            <button className="mt-4 btn-ghost text-sm py-3 px-6">
              Simular registro NFC
            </button>
          </div>
        </div>

        <div className="animate-fade-up stagger-3">
          <p className="text-white/40 text-xs font-body uppercase tracking-[0.15em] mb-3">Beneficios PRCard</p>
          <div className="space-y-2">
            {[
              { icon: '💰', text: '15% descuento en Alianza Rollers' },
              { icon: '📊', text: 'Acceso completo a PR Tracking' },
              { icon: '🎯', text: 'Prioridad en eventos exclusivos' },
              { icon: '🛒', text: 'Descuentos en tienda PR' },
              { icon: '🏅', text: 'Insignias y experiencias desbloqueables' },
            ].map(b => (
              <div key={b.text} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-lg">{b.icon}</span>
                <p className="text-white/70 text-sm font-body">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
