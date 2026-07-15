import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TYPE_CONFIG = {
  Evento: {
    icon: '🎯',
    label: 'Evento',
    color: '#818cf8',
  },
  Insignia: {
    icon: '🏅',
    label: 'Insignia',
    color: '#C9A84C',
  },
  Nota: {
    icon: '📝',
    label: 'Nota',
    color: '#4ecb8b',
  },
}

const filters = [
  {
    key: 'Todos',
    label: 'Todo',
  },
  {
    key: 'Evento',
    label: 'Eventos',
  },
  {
    key: 'Insignia',
    label: 'Insignias',
  },
  {
    key: 'Nota',
    label: 'Notas',
  },
]

function loadSavedUser() {
  try {
    return JSON.parse(
      localStorage.getItem('pr_user') || '{}'
    )
  } catch {
    return {}
  }
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getInitials(name) {
  if (!name) return 'PR'

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Activity() {
  const { user } = useAuth()

  const savedUser = loadSavedUser()
  const profileId =
    user?.id ||
    savedUser?.id ||
    'alumno-001'

  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadActivity() {
      setLoading(true)
      setMessage('')

      const { data, error } = await supabase
        .from('actividad_pr')
        .select('*')
        .eq('alumno_id', profileId)
        .order('fecha', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        setMessage(
          `No pudimos cargar tu actividad: ${error.message}`
        )
        setItems([])
      } else {
        setItems(data || [])
      }

      setLoading(false)
    }

    loadActivity()
  }, [profileId])

  const stats = useMemo(() => {
    return items.reduce(
      (accumulator, item) => {
        if (item.tipo === 'Evento') {
          accumulator.eventos += 1
        }

        if (item.tipo === 'Insignia') {
          accumulator.insignias += 1
        }

        if (item.tipo === 'Nota') {
          accumulator.notas += 1
        }

        return accumulator
      },
      {
        eventos: 0,
        insignias: 0,
        notas: 0,
      }
    )
  }, [items])

  const visibleItems = useMemo(() => {
    if (filter === 'Todos') {
      return items
    }

    return items.filter(
      (item) => item.tipo === filter
    )
  }, [items, filter])

  return (
    <AppLayout title="Actividad">
      <div className="pr-page space-y-6 animate-page-enter">
        <section>
          <p className="section-label">
            Tu recorrido PR
          </p>

          <h1 className="font-display text-[34px] leading-none text-white mt-2">
            Todo lo que vas logrando
          </h1>

          <p className="text-white/38 text-sm mt-2 max-w-[330px]">
            Eventos, reconocimientos y observaciones
            del equipo Punta Rollers.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2.5">
          <StatCard
            label="Eventos"
            value={stats.eventos}
            color="#818cf8"
            loading={loading}
          />

          <StatCard
            label="Insignias"
            value={stats.insignias}
            color="#C9A84C"
            loading={loading}
          />

          <StatCard
            label="Notas"
            value={stats.notas}
            color="#4ecb8b"
            loading={loading}
          />
        </section>

        <section className="overflow-x-auto -mx-[18px] px-[18px]">
          <div className="flex gap-2 min-w-max">
            {filters.map((item) => {
              const active = filter === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setFilter(item.key)
                  }
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold border transition ${
                    active
                      ? 'bg-pr-gold text-black border-pr-gold'
                      : 'bg-white/[0.03] text-white/45 border-white/[0.07]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200 text-sm">
            {message}
          </div>
        )}

        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="section-label">
                Historial
              </p>

              <h2 className="font-display text-2xl text-white mt-1">
                {filter === 'Todos'
                  ? 'Tu actividad completa'
                  : filters.find(
                      (item) =>
                        item.key === filter
                    )?.label}
              </h2>
            </div>

            {!loading && (
              <span className="text-white/28 text-xs">
                {visibleItems.length}{' '}
                {visibleItems.length === 1
                  ? 'registro'
                  : 'registros'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="pr-panel p-6 text-center">
              <div className="w-14 h-14 rounded-[18px] grid place-items-center mx-auto bg-pr-gold/10 border border-pr-gold/20 text-2xl">
                🛼
              </div>

              <h3 className="font-display text-xl text-white mt-4">
                Todavía no hay registros
              </h3>

              <p className="text-white/35 text-sm mt-2">
                Cuando el equipo PR cargue una
                actividad nueva, aparecerá acá.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}

function StatCard({
  label,
  value,
  color,
  loading,
}) {
  return (
    <div className="pr-card p-3 text-center">
      <p
        className="font-display text-[27px] font-bold"
        style={{
          color,
        }}
      >
        {loading ? '—' : value}
      </p>

      <p className="section-label mt-1">
        {label}
      </p>
    </div>
  )
}

function ActivityCard({ item }) {
  const config =
    TYPE_CONFIG[item.tipo] ||
    TYPE_CONFIG.Evento

  const creatorName =
    item.creado_por_nombre ||
    'Equipo Punta Rollers'

  const creatorRole =
    item.creado_por_role === 'admin'
      ? 'Administrador'
      : item.creado_por_role === 'profesor'
        ? 'Profesor'
        : 'Equipo PR'

  return (
    <article className="pr-panel p-4">
      <div className="flex gap-3">
        <div
          className="w-12 h-12 rounded-[16px] grid place-items-center text-xl shrink-0"
          style={{
            background: `${config.color}12`,
            border: `1px solid ${config.color}24`,
          }}
        >
          {config.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{
                  color: config.color,
                  background: `${config.color}10`,
                  border: `1px solid ${config.color}22`,
                }}
              >
                {config.label}
              </span>

              <h3 className="font-display text-[22px] leading-tight text-white mt-2">
                {item.titulo}
              </h3>
            </div>

            <span className="text-white/25 text-[10px] shrink-0">
              {formatDate(item.fecha)}
            </span>
          </div>

          {item.descripcion && (
            <p className="text-white/45 text-sm leading-relaxed mt-3">
              {item.descripcion}
            </p>
          )}

          <div className="divider-subtle my-4" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[13px] overflow-hidden bg-pr-gold/10 border border-pr-gold/20 grid place-items-center shrink-0">
              {item.creado_por_foto ? (
                <img
                  src={item.creado_por_foto}
                  alt={creatorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-[11px] font-bold text-pr-gold">
                  {getInitials(creatorName)}
                </span>
              )}
            </div>

            <div>
              <p className="text-white/70 text-xs font-semibold">
                {creatorName}
              </p>

              <p className="text-white/28 text-[10px] mt-0.5">
                {creatorRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function LoadingCard() {
  return (
    <div className="pr-panel p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-[16px] bg-white/[0.05]" />

        <div className="flex-1">
          <div className="w-20 h-4 rounded-full bg-white/[0.05]" />

          <div className="w-3/4 h-6 rounded-lg bg-white/[0.05] mt-3" />

          <div className="w-full h-4 rounded-lg bg-white/[0.04] mt-4" />

          <div className="w-2/3 h-4 rounded-lg bg-white/[0.04] mt-2" />
        </div>
      </div>
    </div>
  )
}
