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

export default function DashboardOverview({
  profiles,
  alumnos,
  adminActivity,
  setSection,
  canFullAdmin,
  canManageContent,
  setActionType,
}) {
  const activeToday = profiles.filter((profile) =>
    wasActiveToday(profile.ultimoIngreso)
  )
  const active7 = profiles.filter((profile) =>
    wasActiveWithin(profile.ultimoIngreso, 7)
  )
  const active30 = profiles.filter((profile) =>
    wasActiveWithin(profile.ultimoIngreso, 30)
  )
  const neverEntered = profiles.filter((profile) => !profile.ultimoIngreso)
  const inactiveAccess = alumnos.filter(
    (profile) => profile.accesoHabilitado === false
  )
  const prcardPending = alumnos.filter((profile) => !profile.prcardActiva)
  const expiredPayments = alumnos.filter(
    (profile) => getPaymentStatus(profile.mensualidadHasta) === 'expired'
  )
  const paymentsSoon = alumnos.filter(
    (profile) => getPaymentStatus(profile.mensualidadHasta) === 'soon'
  )

  const birthdays = alumnos
    .map((profile) => ({
      profile,
      birthday: getUpcomingBirthday(profile.fechaNacimiento),
    }))
    .filter(
      (item) => item.birthday && item.birthday.daysAway >= 0 && item.birthday.daysAway <= 30
    )
    .sort((a, b) => a.birthday.daysAway - b.birthday.daysAway)
    .slice(0, 6)

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
              Informacion calculada con los datos que ya existen en el panel.
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
          <MetricCard label="Activos hoy" value={activeToday.length} detail="Ingresaron hoy" />
          <MetricCard label="Activos 7 dias" value={active7.length} detail="Ultima semana" />
          <MetricCard label="Activos 30 dias" value={active30.length} detail="Ultimo mes" />
          <MetricCard label="Nunca ingresaron" value={neverEntered.length} detail="Requieren seguimiento" />
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">Atencion necesaria</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {canFullAdmin && (
            <>
              <AlertCard
                label="Mensualidades vencidas"
                value={expiredPayments.length}
                onClick={() => setSection('pagos')}
              />
              <AlertCard
                label="Vencen en 7 dias"
                value={paymentsSoon.length}
                onClick={() => setSection('pagos')}
              />
              <AlertCard
                label="PRCard pendiente"
                value={prcardPending.length}
                onClick={() => setSection('usuarios')}
              />
              <AlertCard
                label="Acceso inhabilitado"
                value={inactiveAccess.length}
                onClick={() => setSection('usuarios')}
              />
            </>
          )}

          {!canFullAdmin && (
            <>
              <AlertCard
                label="Sin ingreso registrado"
                value={neverEntered.length}
                onClick={() => setSection('usuarios')}
              />
              <AlertCard
                label="Activos este mes"
                value={active30.length}
                onClick={() => setSection('usuarios')}
              />
            </>
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">Acciones rapidas</p>
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
              <ActionButton label="Observacion" onClick={() => goAction('Nota')} />
              <ActionButton label="Dar insignia" onClick={() => goAction('Insignia')} />
            </>
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Proximos cumpleanos</p>
            <p className="text-white/35 text-xs mt-1">Dentro de los proximos 30 dias</p>
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
                      ? 'Manana'
                      : `${birthday.daysAway} dias`}
                </span>
              </div>
            ))
          ) : (
            <EmptyState text="No hay cumpleanos registrados para los proximos 30 dias." />
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Actividad reciente</p>
            <p className="text-white/35 text-xs mt-1">Ultimos registros administrativos</p>
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
                  {item.titulo || 'Registro sin titulo'}
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
            <EmptyState text="Todavia no hay actividad administrativa cargada." />
          )}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/25 p-3">
      <p className="text-white/35 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="font-display text-3xl text-white mt-1">{value}</p>
      <p className="text-white/25 text-[10px] mt-1">{detail}</p>
    </div>
  )
}

function AlertCard({ label, value, onClick }) {
  const needsAttention = value > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
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
      <p className="text-white/25 text-[10px] mt-1">Toca para revisar</p>
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
      <p className="text-white/30 text-[10px] mt-1">Abrir seccion</p>
    </button>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/25 p-3">
      <p className="text-white/40 text-sm">{text}</p>
    </div>
  )
      }
