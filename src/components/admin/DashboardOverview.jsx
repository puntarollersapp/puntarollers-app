import { useEffect, useMemo, useState } from 'react'

const panel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

const DAY_MS = 24 * 60 * 60 * 1000

function validDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function wasActiveWithin(value, days) {
  const date = validDate(value)
  if (!date) return false
  return Date.now() - date.getTime() <= days * DAY_MS
}

function wasActiveToday(value) {
  const date = validDate(value)
  if (!date) return false
  return date.getTime() >= startOfToday().getTime()
}

function formatDate(value) {
  const date = validDate(value)
  if (!date) return 'Sin fecha'

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  const date = validDate(value)
  if (!date) return 'Sin ingreso registrado'

  return date.toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getUpcomingBirthday(value) {
  if (!value) return null

  const birthDate = new Date(`${value}T12:00:00`)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = startOfToday()
  const nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  )

  if (nextBirthday < today) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
  }

  const daysAway = Math.round((nextBirthday.getTime() - today.getTime()) / DAY_MS)

  return {
    date: nextBirthday,
    daysAway,
  }
}

function getPaymentStatus(value) {
  if (!value) return 'missing'

  const endDate = new Date(`${value}T23:59:59`)
  if (Number.isNaN(endDate.getTime())) return 'missing'

  const diffDays = Math.ceil((endDate.getTime() - Date.now()) / DAY_MS)

  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'soon'
  return 'ok'
}

function getProfileName(profile) {
  const fullName = `${profile.nombre || ''} ${profile.apellido || ''}`.trim()
  return fullName || 'Usuario sin nombre'
}

function sortProfiles(profiles) {
  return [...profiles].sort((a, b) =>
    getProfileName(a).localeCompare(getProfileName(b), 'es', {
      sensitivity: 'base',
    })
  )
}

export default function DashboardOverview({
  profiles,
  alumnos,
  adminActivity,
  setSection,
  canFullAdmin,
  canManageContent,
  setActionType,
}) {
  const [selectedList, setSelectedList] = useState(null)

  const activeToday = useMemo(
    () => profiles.filter((profile) => wasActiveToday(profile.ultimoIngreso)),
    [profiles]
  )
  const active7 = useMemo(
    () => profiles.filter((profile) => wasActiveWithin(profile.ultimoIngreso, 7)),
    [profiles]
  )
  const active30 = useMemo(
    () => profiles.filter((profile) => wasActiveWithin(profile.ultimoIngreso, 30)),
    [profiles]
  )
  const neverEntered = useMemo(
    () => profiles.filter((profile) => !profile.ultimoIngreso),
    [profiles]
  )
  const inactiveAccess = useMemo(
    () => alumnos.filter((profile) => profile.accesoHabilitado === false),
    [alumnos]
  )
  const prcardPending = useMemo(
    () => alumnos.filter((profile) => !profile.prcardActiva),
    [alumnos]
  )
  const expiredPayments = useMemo(
    () =>
      alumnos.filter(
        (profile) => getPaymentStatus(profile.mensualidadHasta) === 'expired'
      ),
    [alumnos]
  )
  const paymentsSoon = useMemo(
    () =>
      alumnos.filter(
        (profile) => getPaymentStatus(profile.mensualidadHasta) === 'soon'
      ),
    [alumnos]
  )

  const birthdays = useMemo(
    () =>
      alumnos
        .map((profile) => ({
          profile,
          birthday: getUpcomingBirthday(profile.fechaNacimiento),
        }))
        .filter(
          (item) =>
            item.birthday &&
            item.birthday.daysAway >= 0 &&
            item.birthday.daysAway <= 30
        )
        .sort((a, b) => a.birthday.daysAway - b.birthday.daysAway)
        .slice(0, 6),
    [alumnos]
  )

  useEffect(() => {
    if (!selectedList) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') setSelectedList(null)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedList])

  function openList(title, subtitle, items, type) {
    setSelectedList({
      title,
      subtitle,
      items: sortProfiles(items),
      type,
    })
  }

  function goAction(type) {
    setActionType(type)
    setSection('acciones')
  }

  return (
    <div className="space-y-4">
      <section className={`${panel} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-label">Resumen general</p>
            <h2 className="font-display text-2xl text-white mt-1">
              Estado de Punta Rollers
            </h2>
            <p className="text-white/35 text-xs mt-1">
              Información calculada con los datos que ya existen en el panel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSection('usuarios')}
            className="shrink-0 rounded-xl border border-pr-gold/25 bg-pr-gold/10 px-3 py-2 text-pr-gold text-xs font-semibold"
          >
            Ver usuarios
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <MetricCard
            label="Activos hoy"
            value={activeToday.length}
            detail="Ingresaron hoy"
            onClick={() =>
              openList(
                'Activos hoy',
                'Usuarios que ingresaron hoy a PuntaRollers.app.',
                activeToday,
                'activity'
              )
            }
          />
          <MetricCard
            label="Activos 7 días"
            value={active7.length}
            detail="Última semana"
            onClick={() =>
              openList(
                'Activos en 7 días',
                'Usuarios con al menos un ingreso durante los últimos 7 días.',
                active7,
                'activity'
              )
            }
          />
          <MetricCard
            label="Activos 30 días"
            value={active30.length}
            detail="Último mes"
            onClick={() =>
              openList(
                'Activos en 30 días',
                'Usuarios con al menos un ingreso durante los últimos 30 días.',
                active30,
                'activity'
              )
            }
          />
          <MetricCard
            label="Nunca ingresaron"
            value={neverEntered.length}
            detail="Requieren seguimiento"
            onClick={() =>
              openList(
                'Nunca ingresaron',
                'Usuarios que todavía no registran ningún ingreso a la plataforma.',
                neverEntered,
                'never'
              )
            }
          />
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">Atención necesaria</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {canFullAdmin && (
            <>
              <AlertCard
                label="Mensualidades vencidas"
                value={expiredPayments.length}
                onClick={() =>
                  openList(
                    'Mensualidades vencidas',
                    'Alumnos cuya fecha de mensualidad ya venció.',
                    expiredPayments,
                    'payment'
                  )
                }
              />
              <AlertCard
                label="Vencen en 7 días"
                value={paymentsSoon.length}
                onClick={() =>
                  openList(
                    'Vencen en 7 días',
                    'Alumnos cuya mensualidad vence dentro de los próximos 7 días.',
                    paymentsSoon,
                    'payment'
                  )
                }
              />
              <AlertCard
                label="PRCard pendiente"
                value={prcardPending.length}
                onClick={() =>
                  openList(
                    'PRCard pendiente',
                    'Alumnos que todavía no tienen la PRCard activa.',
                    prcardPending,
                    'prcard'
                  )
                }
              />
              <AlertCard
                label="Acceso inhabilitado"
                value={inactiveAccess.length}
                onClick={() =>
                  openList(
                    'Acceso inhabilitado',
                    'Alumnos que actualmente no pueden ingresar a la plataforma.',
                    inactiveAccess,
                    'access'
                  )
                }
              />
            </>
          )}

          {!canFullAdmin && (
            <>
              <AlertCard
                label="Sin ingreso registrado"
                value={neverEntered.length}
                onClick={() =>
                  openList(
                    'Sin ingreso registrado',
                    'Alumnos que todavía no registran ingresos a la plataforma.',
                    neverEntered,
                    'never'
                  )
                }
              />
              <AlertCard
                label="Activos este mes"
                value={active30.length}
                onClick={() =>
                  openList(
                    'Activos este mes',
                    'Usuarios con actividad durante los últimos 30 días.',
                    active30,
                    'activity'
                  )
                }
              />
            </>
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">Acciones rápidas</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {canFullAdmin && (
            <>
              <ActionButton label="Crear usuario" onClick={() => setSection('usuarios')} />
              <ActionButton label="Registrar pago" onClick={() => setSection('pagos')} />
              <ActionButton label="Gestionar grupos" onClick={() => setSection('grupos')} />
              <ActionButton label="Clases particulares" onClick={() => setSection('particulares')} />
            </>
          )}

          {canManageContent && (
            <>
              <ActionButton label="Cargar toma" onClick={() => setSection('performance')} />
              <ActionButton label="Crear objetivo" onClick={() => setSection('objetivos')} />
              <ActionButton label="Observación" onClick={() => goAction('Nota')} />
              <ActionButton label="Dar insignia" onClick={() => goAction('Insignia')} />
            </>
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Próximos cumpleaños</p>
            <p className="text-white/35 text-xs mt-1">Dentro de los próximos 30 días</p>
          </div>
          <span className="text-pr-gold text-xs font-semibold">{birthdays.length}</span>
        </div>

        <div className="space-y-2 mt-3">
          {birthdays.length > 0 ? (
            birthdays.map(({ profile, birthday }) => (
              <div
                key={profile.id}
                className="rounded-2xl border border-white/5 bg-black/25 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {profile.nombre} {profile.apellido}
                  </p>
                  <p className="text-white/35 text-xs mt-1">
                    {formatDate(birthday.date)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-pr-gold/20 bg-pr-gold/10 px-2.5 py-1 text-pr-gold text-[10px] font-bold">
                  {birthday.daysAway === 0
                    ? 'Hoy'
                    : birthday.daysAway === 1
                      ? 'Mañana'
                      : `${birthday.daysAway} días`}
                </span>
              </div>
            ))
          ) : (
            <EmptyState text="No hay cumpleaños registrados para los próximos 30 días." />
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Actividad reciente</p>
            <p className="text-white/35 text-xs mt-1">Últimos registros administrativos</p>
          </div>
          {canManageContent && (
            <button
              type="button"
              onClick={() => setSection('acciones')}
              className="text-pr-gold text-xs font-semibold"
            >
              Ver acciones
            </button>
          )}
        </div>

        <div className="space-y-2 mt-3">
          {adminActivity.length > 0 ? (
            adminActivity.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/5 bg-black/25 p-3"
              >
                <p className="text-white text-sm font-semibold">
                  {item.titulo || 'Registro sin título'}
                </p>
                <p className="text-white/35 text-xs mt-1">
                  {item.tipo || 'Actividad'} - {formatDate(item.fecha)}
                </p>
                {item.creado_por_nombre && (
                  <p className="text-white/25 text-[10px] mt-1">
                    Por {item.creado_por_nombre}
                  </p>
                )}
              </div>
            ))
          ) : (
            <EmptyState text="Todavía no hay actividad administrativa cargada." />
          )}
        </div>
      </section>

      {selectedList && (
        <ProfilesListModal
          list={selectedList}
          onClose={() => setSelectedList(null)}
        />
      )}
    </div>
  )
}

function MetricCard({ label, value, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/5 bg-black/25 p-3 text-left transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-pr-gold/40"
    >
      <p className="text-white/35 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="font-display text-3xl text-white mt-1">{value}</p>
      <p className="text-white/25 text-[10px] mt-1">{detail}</p>
      <p className="text-pr-gold/70 text-[10px] font-semibold mt-2">Tocá para ver</p>
    </button>
  )
}

function AlertCard({ label, value, onClick }) {
  const needsAttention = value > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-pr-gold/40 ${
        needsAttention
          ? 'border-amber-400/20 bg-amber-400/[0.08]'
          : 'border-white/5 bg-black/25'
      }`}
    >
      <p className={`text-[10px] uppercase tracking-wider ${needsAttention ? 'text-amber-200/70' : 'text-white/35'}`}>
        {label}
      </p>
      <p className={`font-display text-3xl mt-1 ${needsAttention ? 'text-amber-100' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-white/25 text-[10px] mt-1">Tocá para revisar</p>
    </button>
  )
}

function ActionButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition active:scale-[0.98]"
    >
      <p className="text-white text-sm font-semibold">{label}</p>
      <p className="text-white/30 text-[10px] mt-1">Abrir sección</p>
    </button>
  )
}

function ProfilesListModal({ list, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-list-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[88dvh] w-full flex-col rounded-t-[28px] border border-white/10 bg-[#101010] shadow-[0_-20px_70px_rgba(0,0,0,0.65)] sm:max-w-xl sm:rounded-[28px]">
        <div className="shrink-0 border-b border-white/10 px-4 pb-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-label">Detalle del dashboard</p>
              <h3 id="dashboard-list-title" className="font-display text-2xl text-white mt-1">
                {list.title}
              </h3>
              <p className="text-white/40 text-xs mt-1">{list.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar listado"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-xl text-white/70 transition active:scale-95"
            >
              ×
            </button>
          </div>
          <div className="mt-3 inline-flex rounded-full border border-pr-gold/20 bg-pr-gold/10 px-3 py-1 text-xs font-bold text-pr-gold">
            {list.items.length} {list.items.length === 1 ? 'persona' : 'personas'}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {list.items.length > 0 ? (
            <div className="space-y-2">
              {list.items.map((profile) => (
                <ProfileListItem
                  key={profile.id}
                  profile={profile}
                  type={list.type}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-black/25 px-4 py-8 text-center">
              <p className="text-white text-sm font-semibold">No hay personas en este listado.</p>
              <p className="text-white/35 text-xs mt-1">La tarjeta está al día.</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-pr-gold px-4 py-3 text-sm font-bold text-black transition active:scale-[0.99]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileListItem({ profile, type }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.035] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {getProfileName(profile)}
          </p>
          <p className="mt-1 text-[11px] text-white/35">
            {profile.documento ? `CI ${profile.documento}` : 'Sin documento'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/45">
          {profile.role || 'alumno'}
        </span>
      </div>

      <p className="mt-3 text-xs text-white/55">{getListDetail(profile, type)}</p>
    </div>
  )
}

function getListDetail(profile, type) {
  if (type === 'activity') {
    return `Último ingreso: ${formatDateTime(profile.ultimoIngreso)}`
  }

  if (type === 'payment') {
    return `Mensualidad hasta: ${formatDate(profile.mensualidadHasta)}`
  }

  if (type === 'prcard') {
    return 'PRCard: pendiente de activación'
  }

  if (type === 'access') {
    return 'Acceso a la plataforma: inhabilitado'
  }

  return 'Sin ingreso registrado'
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/25 p-3">
      <p className="text-white/40 text-sm">{text}</p>
    </div>
  )
      }
