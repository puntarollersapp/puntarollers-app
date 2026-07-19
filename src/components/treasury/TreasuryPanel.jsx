import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function todayInput() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(
    now.getTime() - offset * 60 * 1000
  )
  return local.toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(
    `${String(value).slice(0, 10)}T12:00:00`
  )

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function fullName(item) {
  return `${item?.nombre || ''} ${
    item?.apellido || ''
  }`.trim()
}

function statusInfo(value) {
  if (value === 'vigente') {
    return {
      label: 'Vigente',
      className:
        'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    }
  }

  if (value === 'por_vencer') {
    return {
      label: 'Por vencer',
      className:
        'border-amber-400/20 bg-amber-400/10 text-amber-200',
    }
  }

  if (value === 'vencido') {
    return {
      label: 'Vencido',
      className:
        'border-red-400/20 bg-red-400/10 text-red-200',
    }
  }

  return {
    label: 'Sin fecha',
    className:
      'border-white/10 bg-white/[0.04] text-white/50',
  }
}

export default function TreasuryPanel({
  currentUser,
  setMessage,
}) {
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [selected, setSelected] = useState(null)
  const [paymentDate, setPaymentDate] =
    useState(todayInput())
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] =
    useState(false)

  async function loadStudents() {
    try {
      setLoading(true)

      const { data, error } = await supabase.rpc(
        'obtener_panel_pagos'
      )

      if (error) {
        throw new Error(error.message)
      }

      setStudents(data || [])
    } catch (error) {
      setMessage?.(
        `No se pudo cargar Tesorería: ${error.message}`
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const visibleStudents = useMemo(() => {
    const normalized = query
      .trim()
      .toLowerCase()

    return students.filter((item) => {
      const matchesFilter =
        filter === 'todos' ||
        item.estado_pago === filter

      const haystack = [
        item.nombre,
        item.apellido,
        item.documento,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        matchesFilter &&
        (!normalized ||
          haystack.includes(normalized))
      )
    })
  }, [students, query, filter])

  async function openStudent(student) {
    try {
      setSelected(student)
      setPaymentDate(todayInput())
      setHistoryLoading(true)
      setHistory([])

      const { data, error } = await supabase.rpc(
        'obtener_historial_pagos',
        {
          p_alumno_id: student.alumno_id,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      setHistory(data || [])
    } catch (error) {
      setMessage?.(
        `No se pudo cargar el historial: ${error.message}`
      )
    } finally {
      setHistoryLoading(false)
    }
  }

  function closeStudent() {
    setSelected(null)
    setHistory([])
    setPaymentDate(todayInput())
  }

  async function registerPayment() {
    if (!selected) return

    try {
      setSavingId(selected.alumno_id)
      setMessage?.('Registrando pago...')

      if (!paymentDate) {
        throw new Error(
          'Seleccioná la fecha del pago.'
        )
      }

      const recorderName =
        fullName(currentUser) ||
        'Tesorería Punta Rollers'

      const { error } = await supabase.rpc(
        'registrar_pago_pr',
        {
          p_alumno_id: selected.alumno_id,
          p_fecha_pago: paymentDate,
          p_registrado_por_id:
            currentUser?.id || '',
          p_registrado_por_nombre:
            recorderName,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      setMessage?.(
        `Pago registrado para ${fullName(
          selected
        )}.`
      )

      await loadStudents()
      await openStudent({
        ...selected,
        ultimo_pago: paymentDate,
      })
    } catch (error) {
      setMessage?.(
        `No se pudo registrar el pago: ${error.message}`
      )
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-pr-gold/15 bg-pr-gold/[0.05] p-4">
        <p className="text-pr-gold text-xs uppercase tracking-[0.16em] font-semibold">
          Tesorería
        </p>
        <p className="text-white/55 text-sm mt-2 leading-relaxed">
          Buscá un alumno, revisá su estado y
          registrá el pago con la fecha
          correspondiente.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) =>
          setQuery(event.target.value)
        }
        placeholder="Buscar por nombre o documento"
        className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ['todos', 'Todos'],
          ['vigente', 'Vigentes'],
          ['por_vencer', 'Por vencer'],
          ['vencido', 'Vencidos'],
          ['sin_fecha', 'Sin fecha'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${
              filter === value
                ? 'border-pr-gold bg-pr-gold text-black'
                : 'border-white/10 bg-white/[0.03] text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="pr-card p-4">
          <p className="text-white/40 text-sm">
            Cargando alumnos...
          </p>
        </div>
      ) : visibleStudents.length ? (
        <div className="space-y-2">
          {visibleStudents.map((student) => {
            const status = statusInfo(
              student.estado_pago
            )

            return (
              <button
                key={student.alumno_id}
                type="button"
                onClick={() =>
                  openStudent(student)
                }
                className="w-full text-left rounded-2xl border border-white/[0.07] bg-black/25 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {fullName(student)}
                    </p>

                    <p className="text-white/35 text-xs mt-1">
                      CI {student.documento || '—'}
                    </p>

                    <p className="text-white/45 text-xs mt-2">
                      Último pago:{' '}
                      {formatDate(
                        student.ultimo_pago
                      )}
                    </p>

                    <p className="text-white/45 text-xs mt-1">
                      Vigente hasta:{' '}
                      {formatDate(
                        student.mensualidad_hasta
                      )}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="pr-card p-4">
          <p className="text-white/40 text-sm">
            No hay alumnos que coincidan.
          </p>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <section className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-[28px] border border-white/10 bg-[#111116] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.16em]">
                  Registrar pago
                </p>
                <h3 className="text-white text-xl font-bold mt-1">
                  {fullName(selected)}
                </h3>
                <p className="text-white/35 text-xs mt-1">
                  CI {selected.documento || '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeStudent}
                className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/60"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                <p className="text-white/30 text-[10px] uppercase">
                  Último pago
                </p>
                <p className="text-white text-sm font-semibold mt-1">
                  {formatDate(
                    selected.ultimo_pago
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                <p className="text-white/30 text-[10px] uppercase">
                  Vigente hasta
                </p>
                <p className="text-white text-sm font-semibold mt-1">
                  {formatDate(
                    selected.mensualidad_hasta
                  )}
                </p>
              </div>
            </div>

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
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
              />
            </label>

            <button
              type="button"
              disabled={
                savingId === selected.alumno_id
              }
              onClick={registerPayment}
              className="btn-gold w-full mt-4 disabled:opacity-50"
            >
              {savingId === selected.alumno_id
                ? 'Registrando...'
                : 'Confirmar pago'}
            </button>

            <div className="mt-6">
              <p className="text-white/30 text-[10px] uppercase tracking-[0.16em]">
                Historial
              </p>

              {historyLoading ? (
                <p className="text-white/40 text-sm mt-3">
                  Cargando historial...
                </p>
              ) : history.length ? (
                <div className="space-y-2 mt-3">
                  {history.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-white/[0.06] bg-black/25 p-3"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-white text-sm font-semibold">
                            {formatDate(
                              payment.fecha_pago
                            )}
                          </p>
                          <p className="text-white/40 text-xs mt-1">
                            Vigente hasta{' '}
                            {formatDate(
                              payment.vigente_hasta
                            )}
                          </p>
                        </div>

                        <span className="text-pr-gold text-[10px]">
                          {payment.registrado_por_nombre ||
                            'Punta Rollers'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm mt-3">
                  Todavía no hay pagos registrados.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
