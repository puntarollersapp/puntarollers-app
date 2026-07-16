import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const panel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

const EMPTY_MODAL = {
  open: false,
  type: '',
  alumno: null,
}

function fullName(profile) {
  return `${profile?.nombre || ''} ${
    profile?.apellido || ''
  }`.trim()
}

function formatDateTime(value) {
  if (!value) return 'Sin registrar'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toLocalDateTimeInput(value = new Date()) {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60000
  )

  return local
    .toISOString()
    .slice(0, 16)
}

function getCreatorName(currentUser) {
  return (
    `${currentUser?.nombre || ''} ${
      currentUser?.apellido || ''
    }`.trim() || 'Equipo Punta Rollers'
  )
}

export default function PrivateLessonsPanel({
  profiles,
  currentUser,
  reload,
  setMsg,
}) {
  const alumnos = useMemo(
    () =>
      (profiles || []).filter(
        (profile) =>
          profile.role === 'alumno'
      ),
    [profiles]
  )

  const [query, setQuery] = useState('')
  const [filter, setFilter] =
    useState('todos')
  const [cuponeras, setCuponeras] =
    useState([])
  const [history, setHistory] =
    useState([])
  const [loading, setLoading] =
    useState(true)
  const [saving, setSaving] =
    useState(false)
  const [modal, setModal] =
    useState(EMPTY_MODAL)
  const [cantidad, setCantidad] =
    useState(4)
  const [fechaClase, setFechaClase] =
    useState(toLocalDateTimeInput())
  const [observacion, setObservacion] =
    useState('')

  async function loadData() {
    setLoading(true)

    const [
      cuponerasResponse,
      historyResponse,
    ] = await Promise.all([
      supabase
        .from('cuponeras_particulares')
        .select('*')
        .order('updated_at', {
          ascending: false,
        }),

      supabase
        .from(
          'clases_particulares_historial'
        )
        .select('*')
        .order('created_at', {
          ascending: false,
        }),
    ])

    if (cuponerasResponse.error) {
      setMsg(
        `Error cargando cuponeras: ${cuponerasResponse.error.message}`
      )
    }

    if (historyResponse.error) {
      setMsg(
        `Error cargando historial: ${historyResponse.error.message}`
      )
    }

    setCuponeras(
      cuponerasResponse.data || []
    )
    setHistory(
      historyResponse.data || []
    )
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    return alumnos.map((alumno) => {
      const cuponera = cuponeras.find(
        (item) =>
          item.alumno_id === alumno.id
      )

      const lastHistory = history.find(
        (item) =>
          item.alumno_id === alumno.id
      )

      return {
        alumno,
        cuponera,
        lastHistory,
      }
    })
  }, [alumnos, cuponeras, history])

  const filteredRows = rows.filter(
    ({ alumno, cuponera }) => {
      const text =
        `${fullName(alumno)} ${
          alumno.documento || ''
        } ${JSON.stringify(
          alumno.gruposInfo || []
        )}`.toLowerCase()

      const matchesQuery =
        text.includes(
          query.toLowerCase()
        )

      if (!matchesQuery) {
        return false
      }

      if (filter === 'con_clases') {
        return (
          Number(
            cuponera?.clases_disponibles ||
              0
          ) > 0
        )
      }

      if (filter === 'sin_clases') {
        return (
          Boolean(cuponera) &&
          Number(
            cuponera?.clases_disponibles ||
              0
          ) === 0
        )
      }

      if (filter === 'sin_cuponera') {
        return !cuponera
      }

      if (filter === 'finalizadas') {
        return (
          cuponera?.estado ===
          'finalizada'
        )
      }

      return true
    }
  )

  const stats = useMemo(() => {
    const active = cuponeras.filter(
      (item) =>
        Number(
          item.clases_disponibles || 0
        ) > 0
    )

    const totalAvailable = cuponeras.reduce(
      (total, item) =>
        total +
        Number(
          item.clases_disponibles || 0
        ),
      0
    )

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const classesThisMonth =
      history.filter((item) => {
        if (
          item.tipo !== 'clase_dada'
        ) {
          return false
        }

        const value =
          item.fecha_clase ||
          item.created_at

        const date = new Date(value)

        return (
          !Number.isNaN(
            date.getTime()
          ) && date >= monthStart
        )
      }).length

    return {
      active: active.length,
      totalAvailable,
      classesThisMonth,
      finished: cuponeras.filter(
        (item) =>
          item.estado ===
          'finalizada'
      ).length,
    }
  }, [cuponeras, history])

  function openLoadModal(alumno) {
    setCantidad(4)
    setModal({
      open: true,
      type: 'cargar',
      alumno,
    })
  }

  function openClassModal(alumno) {
    setFechaClase(
      toLocalDateTimeInput()
    )
    setObservacion('')
    setModal({
      open: true,
      type: 'clase',
      alumno,
    })
  }

  function closeModal() {
    if (saving) return

    setModal(EMPTY_MODAL)
    setCantidad(4)
    setObservacion('')
    setFechaClase(
      toLocalDateTimeInput()
    )
  }

  async function cargarClases() {
    if (!modal.alumno) return

    try {
      setSaving(true)
      setMsg('Cargando clases...')

      const parsedAmount =
        Number(cantidad)

      if (
        !Number.isInteger(
          parsedAmount
        ) ||
        parsedAmount <= 0
      ) {
        throw new Error(
          'La cantidad debe ser mayor a cero.'
        )
      }

      const { error } =
        await supabase.rpc(
          'cargar_clases_particulares',
          {
            p_alumno_id:
              modal.alumno.id,
            p_cantidad:
              parsedAmount,
            p_registrado_por_id:
              currentUser?.id || '',
            p_registrado_por_nombre:
              getCreatorName(
                currentUser
              ),
          }
        )

      if (error) {
        throw new Error(
          error.message
        )
      }

      setMsg(
        `${parsedAmount} clase${
          parsedAmount === 1
            ? ''
            : 's'
        } cargada${
          parsedAmount === 1
            ? ''
            : 's'
        } a ${fullName(
          modal.alumno
        )}.`
      )

      closeModal()
      await loadData()
      await reload?.()
    } catch (error) {
      setMsg(
        `No se pudieron cargar las clases: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  async function registrarClase() {
    if (!modal.alumno) return

    try {
      setSaving(true)
      setMsg(
        'Registrando clase...'
      )

      if (!fechaClase) {
        throw new Error(
          'Seleccioná fecha y hora.'
        )
      }

      const date = new Date(fechaClase)

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        throw new Error(
          'La fecha y hora no son válidas.'
        )
      }

      const { error } =
        await supabase.rpc(
          'registrar_clase_particular',
          {
            p_alumno_id:
              modal.alumno.id,
            p_fecha_clase:
              date.toISOString(),
            p_observacion:
              observacion.trim(),
            p_registrado_por_id:
              currentUser?.id || '',
            p_registrado_por_nombre:
              getCreatorName(
                currentUser
              ),
          }
        )

      if (error) {
        throw new Error(
          error.message
        )
      }

      setMsg(
        `Clase registrada para ${fullName(
          modal.alumno
        )}. Se descontó 1 clase.`
      )

      closeModal()
      await loadData()
      await reload?.()
    } catch (error) {
      setMsg(
        `No se pudo registrar la clase: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <section
        className={`${panel} p-5 bg-gradient-to-br from-pr-gold/10 to-white/[0.025]`}
      >
        <p className="section-label">
          Clases particulares
        </p>

        <h2 className="font-display text-3xl text-white mt-1">
          Cuponeras digitales
        </h2>

        <p className="text-white/40 text-xs mt-2 leading-relaxed">
          Cargá clases, registrá cada
          clase realizada y guardá las
          observaciones de lo trabajado.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Cuponeras activas"
          value={stats.active}
        />

        <Stat
          label="Clases disponibles"
          value={stats.totalAvailable}
        />

        <Stat
          label="Dadas este mes"
          value={stats.classesThisMonth}
        />

        <Stat
          label="Finalizadas"
          value={stats.finished}
        />
      </div>

      <section
        className={`${panel} p-4 space-y-3`}
      >
        <input
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          placeholder="Buscar alumno o cédula..."
          className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            ['todos', 'Todos'],
            [
              'con_clases',
              'Con clases',
            ],
            [
              'sin_clases',
              'Sin clases',
            ],
            [
              'sin_cuponera',
              'Sin cuponera',
            ],
            [
              'finalizadas',
              'Finalizadas',
            ],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                setFilter(id)
              }
              className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                filter === id
                  ? 'bg-pr-gold border-pr-gold text-black'
                  : 'bg-white/[0.035] border-white/10 text-white/55'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section
          className={`${panel} p-5`}
        >
          <p className="text-white/40 text-sm">
            Cargando cuponeras...
          </p>
        </section>
      ) : filteredRows.length === 0 ? (
        <section
          className={`${panel} p-5`}
        >
          <p className="text-white font-semibold">
            No encontramos alumnos
          </p>

          <p className="text-white/35 text-sm mt-1">
            Probá con otro filtro o
            búsqueda.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {filteredRows.map(
            ({
              alumno,
              cuponera,
              lastHistory,
            }) => {
              const available = Number(
                cuponera?.clases_disponibles ||
                  0
              )

              const used = Number(
                cuponera?.clases_utilizadas ||
                  0
              )

              const loaded = Number(
                cuponera?.clases_cargadas ||
                  0
              )

              const hasClasses =
                available > 0

              return (
                <section
                  key={alumno.id}
                  className={`${panel} p-4`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black/30 border border-white/10 grid place-items-center shrink-0">
                      {alumno.foto ? (
                        <img
                          src={alumno.foto}
                          alt={fullName(
                            alumno
                          )}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm">
                        {fullName(alumno)}
                      </p>

                      <p className="text-white/35 text-[11px] mt-1">
                        CI{' '}
                        {alumno.documento ||
                          'Sin documento'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                        hasClasses
                          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                          : 'border-white/10 bg-white/[0.04] text-white/40'
                      }`}
                    >
                      {hasClasses
                        ? `${available} disponible${
                            available === 1
                              ? ''
                              : 's'
                          }`
                        : cuponera
                          ? 'Sin clases'
                          : 'Sin cuponera'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <MiniStat
                      label="Cargadas"
                      value={loaded}
                    />

                    <MiniStat
                      label="Usadas"
                      value={used}
                    />

                    <MiniStat
                      label="Disponibles"
                      value={available}
                      highlight
                    />
                  </div>

                  {cuponera && (
                    <div className="rounded-2xl bg-black/20 border border-white/[0.05] p-3 mt-3">
                      <p className="text-white/25 text-[10px] uppercase tracking-[0.14em]">
                        Última clase
                      </p>

                      <p className="text-white/65 text-xs mt-1">
                        {formatDateTime(
                          cuponera.ultima_clase
                        )}
                      </p>

                      {cuponera.ultima_observacion && (
                        <p className="text-white/40 text-xs mt-2 leading-relaxed">
                          {
                            cuponera.ultima_observacion
                          }
                        </p>
                      )}

                      {!cuponera.ultima_clase &&
                        lastHistory && (
                          <p className="text-white/30 text-xs mt-2">
                            Último movimiento:{' '}
                            {
                              lastHistory.tipo
                            }{' '}
                            ·{' '}
                            {formatDateTime(
                              lastHistory.created_at
                            )}
                          </p>
                        )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        openLoadModal(
                          alumno
                        )
                      }
                      className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 py-3 px-3 text-pr-gold text-xs font-bold"
                    >
                      + Cargar clases
                    </button>

                    <button
                      type="button"
                      disabled={!hasClasses}
                      onClick={() =>
                        openClassModal(
                          alumno
                        )
                      }
                      className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 px-3 text-white text-xs font-bold disabled:opacity-30"
                    >
                      Clase dada
                    </button>
                  </div>
                </section>
              )
            }
          )}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center">
          <section className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#111118] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">
                  {modal.type ===
                  'cargar'
                    ? 'Nueva carga'
                    : 'Registrar clase'}
                </p>

                <h2 className="font-display text-2xl text-white mt-1">
                  {fullName(
                    modal.alumno
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 rounded-full bg-white/5 text-white/50"
              >
                ×
              </button>
            </div>

            {modal.type ===
            'cargar' ? (
              <div className="space-y-4 mt-5">
                <div>
                  <p className="text-white/40 text-xs">
                    Cantidad de clases
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6].map(
                      (value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setCantidad(
                              value
                            )
                          }
                          className={`rounded-2xl border py-3 text-sm font-bold ${
                            Number(
                              cantidad
                            ) === value
                              ? 'bg-pr-gold border-pr-gold text-black'
                              : 'bg-white/[0.035] border-white/10 text-white'
                          }`}
                        >
                          {value}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <label className="block">
                  <span className="text-white/40 text-xs">
                    Otra cantidad
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(event) =>
                      setCantidad(
                        event.target
                          .value
                      )
                    }
                    className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
                  />
                </label>

                <button
                  type="button"
                  disabled={saving}
                  onClick={cargarClases}
                  className="btn-gold w-full disabled:opacity-50"
                >
                  {saving
                    ? 'Cargando...'
                    : `Cargar ${cantidad} clase${
                        Number(
                          cantidad
                        ) === 1
                          ? ''
                          : 's'
                      }`}
                </button>
              </div>
            ) : (
              <div className="space-y-4 mt-5">
                <label className="block">
                  <span className="text-white/40 text-xs">
                    Fecha y hora
                  </span>

                  <input
                    type="datetime-local"
                    value={fechaClase}
                    onChange={(event) =>
                      setFechaClase(
                        event.target.value
                      )
                    }
                    className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-white/40 text-xs">
                    Qué trabajaron en
                    la clase
                  </span>

                  <textarea
                    rows="5"
                    value={observacion}
                    onChange={(event) =>
                      setObservacion(
                        event.target.value
                      )
                    }
                    placeholder="Ej: postura, equilibrio, técnica de empuje, frenado..."
                    className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
                  />
                </label>

                <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-3">
                  <p className="text-amber-100/70 text-xs leading-relaxed">
                    Al confirmar, se
                    descontará una clase
                    de la cuponera.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    registrarClase
                  }
                  className="btn-gold w-full disabled:opacity-50"
                >
                  {saving
                    ? 'Registrando...'
                    : 'Confirmar clase dada'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl p-4 border bg-white/[0.035] border-white/10">
      <p className="text-2xl font-display text-white">
        {value}
      </p>

      <p className="text-white/35 text-[10px] uppercase tracking-[0.16em]">
        {label}
      </p>
    </div>
  )
}

function MiniStat({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="rounded-2xl bg-black/20 border border-white/[0.05] p-3 text-center">
      <p
        className={`font-display text-xl ${
          highlight
            ? 'text-pr-gold'
            : 'text-white'
        }`}
      >
        {value}
      </p>

      <p className="text-white/25 text-[9px] uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  )
}
