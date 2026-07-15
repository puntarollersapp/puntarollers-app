import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const panel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

const DAY_MS = 24 * 60 * 60 * 1000

function todayValue() {
  const date = new Date()
  const offset = date.getTimezoneOffset()

  return new Date(
    date.getTime() - offset * 60 * 1000
  )
    .toISOString()
    .slice(0, 10)
}

function parseDate(value) {
  if (!value) return null

  const date = new Date(`${value}T23:59:59`)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

function formatDate(value) {
  const date = parseDate(value)

  if (!date) return 'Sin registrar'

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getPaymentStatus(profile) {
  if (!profile.mensualidadHasta) {
    return {
      key: 'sin_pago',
      label: 'Sin pago registrado',
      detail: 'Registrar primer pago',
      className:
        'border-white/10 bg-white/[0.04] text-white/55',
      days: null,
    }
  }

  const expiration = parseDate(
    profile.mensualidadHasta
  )

  if (!expiration) {
    return {
      key: 'sin_pago',
      label: 'Fecha inválida',
      detail: 'Revisar información',
      className:
        'border-red-400/20 bg-red-400/10 text-red-200',
      days: null,
    }
  }

  const now = new Date()
  const remaining = Math.ceil(
    (expiration.getTime() - now.getTime()) /
      DAY_MS
  )

  if (remaining < 0) {
    return {
      key: 'vencido',
      label: 'Vencido',
      detail: `Venció hace ${Math.abs(
        remaining
      )} día${
        Math.abs(remaining) === 1 ? '' : 's'
      }`,
      className:
        'border-red-400/20 bg-red-400/10 text-red-200',
      days: remaining,
    }
  }

  if (remaining <= 7) {
    return {
      key: 'por_vencer',
      label: 'Por vencer',
      detail:
        remaining === 0
          ? 'Vence hoy'
          : `Faltan ${remaining} día${
              remaining === 1 ? '' : 's'
            }`,
      className:
        'border-amber-400/20 bg-amber-400/10 text-amber-200',
      days: remaining,
    }
  }

  return {
    key: 'vigente',
    label: 'Vigente',
    detail: `Faltan ${remaining} días`,
    className:
      'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    days: remaining,
  }
}

export default function PaymentsPanel({
  profiles,
  currentUser,
  reload,
  setMsg,
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] =
    useState('todos')

  const [selectedProfile, setSelectedProfile] =
    useState(null)

  const [paymentDate, setPaymentDate] =
    useState(todayValue())

  const [savingId, setSavingId] =
    useState('')

  const students = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.role === 'alumno'
      ),
    [profiles]
  )

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase()

    return students.filter((profile) => {
      const status =
        getPaymentStatus(profile)

      const matchesQuery =
        !normalizedQuery ||
        `${profile.nombre} ${
          profile.apellido || ''
        } ${profile.documento} ${JSON.stringify(
          profile.gruposInfo || []
        )}`
          .toLowerCase()
          .includes(normalizedQuery)

      const matchesFilter =
        filter === 'todos' ||
        status.key === filter

      return matchesQuery && matchesFilter
    })
  }, [students, query, filter])

  const totals = useMemo(() => {
    return students.reduce(
      (result, profile) => {
        const status =
          getPaymentStatus(profile)

        result[status.key] += 1

        return result
      },
      {
        vigente: 0,
        por_vencer: 0,
        vencido: 0,
        sin_pago: 0,
      }
    )
  }, [students])

  async function registerPayment(
    profile,
    date = todayValue()
  ) {
    const confirmed = window.confirm(
      `¿Registrar el pago de ${
        profile.nombre
      } con fecha ${formatDate(date)}?\n\nLa vigencia será de 31 días.`
    )

    if (!confirmed) return

    try {
      setSavingId(profile.id)

      setMsg(
        `Registrando pago de ${profile.nombre}...`
      )

      const creatorName =
        `${currentUser?.nombre || ''} ${
          currentUser?.apellido || ''
        }`.trim() || 'Administrador PR'

      const { error } = await supabase.rpc(
        'registrar_pago_pr',
        {
          p_alumno_id: profile.id,
          p_fecha_pago: date,
          p_registrado_por_id:
            currentUser?.id || '',
          p_registrado_por_nombre:
            creatorName,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      setMsg(
        `Pago registrado. ${profile.nombre} quedó habilitado por 31 días.`
      )

      setSelectedProfile(null)
      setPaymentDate(todayValue())

      await reload()
    } catch (error) {
      setMsg(
        `No se pudo registrar el pago: ${error.message}`
      )
    } finally {
      setSavingId('')
    }
  }

  function openCustomDate(profile) {
    setSelectedProfile(profile)
    setPaymentDate(todayValue())
  }

  return (
    <div className="space-y-4">
      <section
        className={`${panel} p-5 bg-gradient-to-br from-pr-gold/10 to-white/[0.025]`}
      >
        <p className="section-label">
          Tesorería
        </p>

        <h2 className="font-display text-3xl text-white mt-1">
          Pagos y mensualidades
        </h2>

        <p className="text-white/40 text-sm mt-2">
          Tocá “Registrar pago hoy” y el
          sistema habilitará al alumno por
          31 días automáticamente.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <PaymentStat
          label="Vigentes"
          value={totals.vigente}
          className="text-emerald-300"
        />

        <PaymentStat
          label="Por vencer"
          value={totals.por_vencer}
          className="text-amber-200"
        />

        <PaymentStat
          label="Vencidos"
          value={totals.vencido}
          className="text-red-200"
        />

        <PaymentStat
          label="Sin pago"
          value={totals.sin_pago}
          className="text-white/55"
        />
      </section>

      <section className={`${panel} p-4`}>
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Buscar alumno por nombre, cédula o grupo..."
          className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
        />

        <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
          <FilterButton
            active={filter === 'todos'}
            onClick={() =>
              setFilter('todos')
            }
          >
            Todos
          </FilterButton>

          <FilterButton
            active={filter === 'vigente'}
            onClick={() =>
              setFilter('vigente')
            }
          >
            Vigentes
          </FilterButton>

          <FilterButton
            active={
              filter === 'por_vencer'
            }
            onClick={() =>
              setFilter('por_vencer')
            }
          >
            Por vencer
          </FilterButton>

          <FilterButton
            active={filter === 'vencido'}
            onClick={() =>
              setFilter('vencido')
            }
          >
            Vencidos
          </FilterButton>

          <FilterButton
            active={filter === 'sin_pago'}
            onClick={() =>
              setFilter('sin_pago')
            }
          >
            Sin pago
          </FilterButton>
        </div>
      </section>

      <section className="space-y-3">
        {filteredStudents.length ? (
          filteredStudents.map((profile) => {
            const status =
              getPaymentStatus(profile)

            return (
              <article
                key={profile.id}
                className={`${panel} p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-black/30 grid place-items-center shrink-0">
                    {profile.foto ? (
                      <img
                        src={profile.foto}
                        alt={profile.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">
                        👤
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">
                          {profile.nombre}{' '}
                          {profile.apellido}
                        </p>

                        <p className="text-white/30 text-xs mt-1">
                          CI {profile.documento}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="text-white/42 text-xs mt-3">
                      {status.detail}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <DateBox
                        label="Último pago"
                        value={formatDate(
                          profile.ultimoPago
                        )}
                      />

                      <DateBox
                        label="Vigente hasta"
                        value={formatDate(
                          profile.mensualidadHasta
                        )}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    savingId === profile.id
                  }
                  onClick={() =>
                    registerPayment(profile)
                  }
                  className="btn-gold w-full mt-4 disabled:opacity-50"
                >
                  {savingId === profile.id
                    ? 'Registrando...'
                    : 'Registrar pago hoy'}
                </button>

                <button
                  type="button"
                  disabled={
                    savingId === profile.id
                  }
                  onClick={() =>
                    openCustomDate(profile)
                  }
                  className="w-full mt-2 rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-white/55 text-xs font-semibold disabled:opacity-50"
                >
                  Usar otra fecha
                </button>
              </article>
            )
          })
        ) : (
          <div className={`${panel} p-5`}>
            <p className="text-white font-semibold">
              No encontramos alumnos
            </p>

            <p className="text-white/35 text-sm mt-1">
              Cambiá el filtro o la búsqueda.
            </p>
          </div>
        )}
      </section>

      {selectedProfile && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm p-4 flex items-end justify-center">
          <section className="w-full max-w-[520px] rounded-t-[30px] rounded-b-3xl border border-white/10 bg-[#111117] p-5 shadow-2xl">
            <p className="section-label">
              Corregir fecha
            </p>

            <h3 className="font-display text-2xl text-white mt-1">
              {selectedProfile.nombre}{' '}
              {selectedProfile.apellido}
            </h3>

            <p className="text-white/38 text-sm mt-2">
              Elegí la fecha real en la que
              realizó el pago.
            </p>

            <label className="block mt-5">
              <span className="text-white/40 text-xs">
                Fecha del pago
              </span>

              <input
                type="date"
                value={paymentDate}
                onChange={(event) =>
                  setPaymentDate(
                    event.target.value
                  )
                }
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none"
              />
            </label>

            <button
              type="button"
              disabled={
                savingId ===
                selectedProfile.id
              }
              onClick={() =>
                registerPayment(
                  selectedProfile,
                  paymentDate
                )
              }
              className="btn-gold w-full mt-5 disabled:opacity-50"
            >
              Registrar con esta fecha
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedProfile(null)
              }
              className="w-full py-3 mt-2 text-white/40 text-sm"
            >
              Cancelar
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

function PaymentStat({
  label,
  value,
  className,
}) {
  return (
    <div className={`${panel} p-4`}>
      <p
        className={`font-display text-3xl ${className}`}
      >
        {value}
      </p>

      <p className="section-label mt-1">
        {label}
      </p>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${
        active
          ? 'border-pr-gold bg-pr-gold text-black'
          : 'border-white/10 bg-white/[0.035] text-white/45'
      }`}
    >
      {children}
    </button>
  )
}

function DateBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/25 p-3">
      <p className="text-white/25 text-[9px] uppercase tracking-wider">
        {label}
      </p>

      <p className="text-white/70 text-xs font-semibold mt-1">
        {value}
      </p>
    </div>
  )
}
