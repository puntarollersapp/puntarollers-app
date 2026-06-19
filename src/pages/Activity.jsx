import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import AppLayout from '../layouts/AppLayout'

const TYPE_CONFIG = {
  Evento: { icon: '🎯', label: 'Evento', color: '#818cf8' },
  Insignia: { icon: '🏅', label: 'Insignia', color: '#C9A84C' },
  Nota: { icon: '📝', label: 'Nota', color: '#4ecb8b' },
}

function loadSavedUser() {
  try {
    const saved = localStorage.getItem('pr_user')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export default function ActivityPage() {
  const { user } = useAuth()
  const savedUser = loadSavedUser()
  const profileId = user?.id || savedUser?.id

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ eventos: 0, insignias: 0, notas: 0 })

  useEffect(() => {
    async function loadActivity() {
      setLoading(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('estadisticas')
        .eq('id', profileId)
        .maybeSingle()

      setStats(profile?.estadisticas || { eventos: 0, insignias: 0, notas: 0 })

      const { data, error } = await supabase
        .from('actividad_pr')
        .select('*')
        .eq('alumno_id', profileId)
        .order('fecha', { ascending: false })

      if (!error) setItems(data || [])

      setLoading(false)
    }

    if (profileId) loadActivity()
  }, [profileId])

  return (
    <AppLayout title="Actividad" showBack>
      <div className="px-4 pt-5 pb-8 space-y-6">

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Eventos', value: stats.eventos || 0, color: '#818cf8' },
            { label: 'Insignias', value: stats.insignias || 0, color: '#C9A84C' },
            { label: 'Notas', value: stats.notas || 0, color: '#4ecb8b' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="section-label mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 text-white/45">
            Cargando actividad...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white/[0.035] border border-white/10 p-5">
            <p className="text-white font-semibold">Todavía no hay actividad</p>
            <p className="text-white/45 text-sm mt-2">
              Cuando el equipo PR cargue eventos, insignias o notas, aparecerán acá.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const cfg = TYPE_CONFIG[item.tipo] || TYPE_CONFIG.Evento

              return (
                <div key={item.id} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xl">{cfg.icon}</div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{item.titulo}</p>
                    <p className="text-white/35 text-xs mt-1">{item.fecha || ''}</p>
                    {item.descripcion && <p className="text-white/45 text-xs mt-1">{item.descripcion}</p>}
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full" style={{ color: cfg.color, border: `1px solid ${cfg.color}55` }}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </AppLayout>
  )
}
