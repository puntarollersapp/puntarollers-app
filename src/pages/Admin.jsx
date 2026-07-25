import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import PaymentsPanel from '../components/admin/PaymentsPanel'
import PrivateLessonsPanel from '../components/admin/PrivateLessonsPanel'
import ContactsPanel from '../components/admin/ContactsPanel'
import ProductsPanel from '../components/admin/ProductsPanel'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { getCupos, saveCupos } from '../data/cupos'
import {
  buildStudentPerformance,
  calculatePaceSeconds,
  calculateSpeedKmh,
  formatDistance as formatEngineDistance,
  formatDuration as formatEngineDuration,
  getMotivationalMessage,
  normalizeDistance,
  parseDuration,
} from '../lib/prEngine'

const panel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

const EMPTY_STATS = {
  eventos: 0,
  insignias: 0,
  notas: 0,
}

const OFFICIAL_BADGES = [
  {
    title: 'Primer evento PR',
    image: '/insignias-pr/primer-evento-pr.png',
    description:
      'Participó por primera vez en un evento junto a Punta Rollers.',
  },
  {
    title: 'Rodador frecuente',
    image: '/insignias-pr/rodador-frecuente.png',
    description:
      'Demostró constancia y compromiso asistiendo regularmente a las clases.',
  },
  {
    title: 'Espíritu PR',
    image: '/insignias-pr/espiritu-pr.png',
    description:
      'Representa los valores, la energía y el sentido de pertenencia de Punta Rollers.',
  },
  {
    title: 'Primeros 6K',
    image: '/insignias-pr/primeros-6k.png',
    description:
      'Completó por primera vez una distancia de 6 kilómetros.',
  },
  {
    title: 'Primeros 10K',
    image: '/insignias-pr/primeros-10k.png',
    description:
      'Completó por primera vez una distancia de 10 kilómetros.',
  },
  {
    title: 'Ya frena en T',
    image: '/insignias-pr/frena-en-t.png',
    description:
      'Aprendió y logró aplicar correctamente el frenado en T.',
  },
  {
    title: 'Ya frena con taco',
    image: '/insignias-pr/frena-con-taco.png',
    description:
      'Aprendió y logró aplicar correctamente el frenado con taco.',
  },
  {
    title: 'Buen compañero',
    image: '/insignias-pr/buen-companero.png',
    description:
      'Se destacó por acompañar, ayudar y cuidar a sus compañeros.',
  },
  {
    title: 'Actitud positiva',
    image: '/insignias-pr/actitud-positiva.png',
    description:
      'Mantuvo una actitud positiva, entusiasta y perseverante durante las clases.',
  },
  {
    title: 'Entrenador potencial',
    image: '/insignias-pr/entrenador-potencial.png',
    description:
      'Demostró liderazgo, responsabilidad y capacidad para acompañar a otros.',
  },
]

function cleanDocument(value) {
  return String(value || '').replace(/\D/g, '')
}

function makeProfileId(role, documento) {
  const document = cleanDocument(documento)

  if (role === 'admin') return `admin-${document}`
  if (role === 'profesor') return `profe-${document}`
  return `alumno-${document}`
}

function normalizeProfile(profile) {
  return {
    id: profile.id,
    role: profile.role || 'alumno',
    nombre: profile.nombre || '',
    apellido: profile.apellido || '',
    documento: profile.documento || '',
    pin: profile.pin || '',
    email: profile.email || '',
    ciudad: profile.ciudad || '',
    instagram: profile.instagram || '',
    estado: profile.estado || 'Activo',
    verificado: Boolean(profile.verificado),
    prcardActiva: Boolean(profile.prcard_activa),
    trackingActivo: Boolean(profile.tracking_activo),
    gruposInfo: Array.isArray(profile.grupos_info)
      ? profile.grupos_info
      : [],
    estadisticas:
      profile.estadisticas &&
      typeof profile.estadisticas === 'object'
        ? profile.estadisticas
        : EMPTY_STATS,
    ultimoIngreso: profile.ultimo_ingreso || '',
    ultimoPago: profile.ultimo_pago || '',
    mensualidadHasta: profile.mensualidad_hasta || '',
    accesoHabilitado:
      typeof profile.acceso_habilitado === 'boolean'
        ? profile.acceso_habilitado
        : true,
    foto: profile.foto || '',
    banner: profile.banner || '',
    sobreMi: profile.sobre_mi || '',
    miembroDesde: profile.miembro_desde || '2026',
    fechaNacimiento: profile.fecha_nacimiento || '',
  }
}

function emptyUserForm() {
  return {
    role: 'alumno',
    nombre: '',
    apellido: '',
    documento: '',
    pin: '',
    email: '',
    ciudad: '',
    instagram: '',
    fechaNacimiento: '',
    miembroDesde: String(new Date().getFullYear()),
    estado: 'Activo',
    verificado: false,
    prcardActiva: false,
    trackingActivo: false,
  }
}

function getRoleLabel(role) {
  if (role === 'admin') return 'Administrador'
  if (role === 'profesor') return 'Profesor'
  return 'Alumno'
}

function getRoleColor(role) {
  if (role === 'admin') {
    return 'text-pr-gold border-pr-gold/25 bg-pr-gold/10'
  }

  if (role === 'profesor') {
    return 'text-sky-300 border-sky-400/20 bg-sky-400/10'
  }

  return 'text-white/55 border-white/10 bg-white/[0.04]'
}

export default function Admin() {
  const { user, logout } = useAuth()

  const [section, setSection] = useState('dashboard')
  const [profiles, setProfiles] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [cupos, setCupos] = useState(getCupos())
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [adminActivity, setAdminActivity] = useState([])
  const [actionType, setActionType] = useState('Nota')

  const canFullAdmin = user?.role === 'admin'
  const canManageContent =
    user?.role === 'admin' || user?.role === 'profesor'
  const isClaudio = user?.documento === '48036677'

  async function loadProfiles() {
    setLoading(true)

    let request = supabase
      .from('profiles')
      .select('*')
      .order('nombre', { ascending: true })

    if (!canFullAdmin) {
      request = request.eq('role', 'alumno')
    }

    const { data, error } = await request

    if (error) {
      setMsg(`Error cargando usuarios: ${error.message}`)
      setLoading(false)
      return
    }

    const list = (data || []).map(normalizeProfile)
    setProfiles(list)

    if (!selectedId && list[0]?.id) {
      setSelectedId(list[0].id)
    }

    if (
      selectedId &&
      !list.some((profile) => profile.id === selectedId)
    ) {
      setSelectedId(list[0]?.id || '')
    }

    setLoading(false)
  }

  async function loadAdminActivity() {
    const { data, error } = await supabase
      .from('actividad_pr')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(8)

    if (!error) setAdminActivity(data || [])
  }

  async function reloadAll() {
    await Promise.all([loadProfiles(), loadAdminActivity()])
  }

  useEffect(() => {
    reloadAll()
  }, [canFullAdmin])

  const selected =
    profiles.find((profile) => profile.id === selectedId) || profiles[0]

  const filtered = profiles.filter((profile) =>
    `${profile.nombre} ${profile.apellido} ${profile.documento} ${profile.role} ${JSON.stringify(
      profile.gruposInfo
    )}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )

  const alumnos = profiles.filter((profile) => profile.role === 'alumno')

  const active7 = profiles.filter((profile) => {
    if (!profile.ultimoIngreso) return false

    const date = new Date(profile.ultimoIngreso)
    if (Number.isNaN(date.getTime())) return false

    return Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
  }).length

  function saveCuposLocal() {
    saveCupos(cupos)
    setMsg('Cupos actualizados correctamente.')
  }

  const quickItems = [
    { id: 'dashboard', icon: '📊', label: 'Inicio', show: true },
    {
      id: 'usuarios',
      icon: '👥',
      label: canFullAdmin ? 'Usuarios' : 'Alumnos',
      show: true,
    },
    { id: 'pagos', icon: '💳', label: 'Pagos', show: canFullAdmin },
    {
      id: 'particulares',
      icon: '🛼',
      label: 'Particulares',
      show: canFullAdmin,
    },
    {
      id: 'contactos',
      icon: '📱',
      label: 'Contactos',
      show: canFullAdmin,
    },
    {
      id: 'tienda',
      icon: '🛍️',
      label: 'Tienda',
      show: canFullAdmin,
    },
    {
      id: 'performance',
      icon: '🏁',
      label: 'Performance',
      show: canManageContent,
    },
    {
      id: 'objetivos',
      icon: '🎯',
      label: 'Objetivos',
      show: canManageContent,
    },
    {
      id: 'acciones',
      icon: '⚡',
      label: 'Acciones',
      show: canManageContent,
    },
    {
      id: 'eventos',
      icon: '📅',
      label: 'Eventos',
      show: canManageContent,
    },
    { id: 'cupos', icon: '🟢', label: 'Cupos', show: canFullAdmin },
    { id: 'config', icon: '⚙️', label: 'Config', show: canFullAdmin },
  ].filter((item) => item.show)

  return (
    <AppLayout title="Panel Admin">
      <div className="px-4 py-5 space-y-5 animate-page-enter">
        <section
          className={`${panel} p-5 bg-gradient-to-br from-pr-gold/10 to-white/[0.025]`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">PuntaRollers.app</p>
              <h1 className="font-display text-3xl text-white mt-1">
                Hola, {user?.nombre || 'Admin'}
              </h1>
              <p className="text-white/40 text-xs mt-1">
                {canFullAdmin
                  ? 'Gestión de usuarios, pagos, grupos, servicios y actividad.'
                  : 'Seguimiento de alumnos, observaciones, insignias y participaciones.'}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="text-white/35 text-xs"
            >
              Salir
            </button>
          </div>
        </section>

        {msg && (
          <div className="rounded-2xl bg-pr-gold/10 border border-pr-gold/20 p-3 text-pr-gold text-sm break-words">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Alumnos" value={alumnos.length} />
          <Stat label="Usuarios" value={profiles.length} />
          <Stat label="Activos 7 días" value={active7} />
          <Stat label="Registros" value={adminActivity.length} />
        </div>

        <section className="flex gap-2 overflow-x-auto pb-1">
          {quickItems.map((item) => (
            <Quick
              key={item.id}
              active={section === item.id}
              onClick={() => setSection(item.id)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </section>

        {loading && (
          <div className={`${panel} p-4 text-white/45 text-sm`}>
            Cargando usuarios...
          </div>
        )}

        {!loading && section === 'dashboard' && (
          <DashboardPanel
            setSection={setSection}
            adminActivity={adminActivity}
            canFullAdmin={canFullAdmin}
            canManageContent={canManageContent}
            setActionType={setActionType}
          />
        )}

        {!loading && section === 'usuarios' && (
          <UsersPanel
            currentUser={user}
            query={query}
            setQuery={setQuery}
            profiles={filtered}
            selected={selected}
            setSelectedId={setSelectedId}
            canFullAdmin={canFullAdmin}
            canManageContent={canManageContent}
            canCreateAdmin={isClaudio}
            reload={reloadAll}
            setMsg={setMsg}
          />
        )}

        {!loading && section === 'performance' && canManageContent && (
          <PerformancePanel
            creator={user}
            alumnos={alumnos}
            setMsg={setMsg}
          />
        )}

        {!loading && section === 'objetivos' && canManageContent && (
          <ObjectivesPanel
            creator={user}
            alumnos={alumnos}
            setMsg={setMsg}
          />
        )}

        {!loading && section === 'acciones' && canManageContent && (
          <ActionsPanel
            creator={user}
            canManageContent={canManageContent}
            selected={selected}
            alumnos={alumnos}
            reload={reloadAll}
            setMsg={setMsg}
            actionType={actionType}
            setActionType={setActionType}
          />
        )}

        {!loading && section === 'eventos' && canManageContent && (
          <EventsPanel creator={user} setMsg={setMsg} />
        )}

        {!loading && section === 'pagos' && canFullAdmin && (
          <PaymentsPanel
            profiles={profiles}
            currentUser={user}
            reload={reloadAll}
            setMsg={setMsg}
          />
        )}

        {!loading && section === 'particulares' && canFullAdmin && (
          <PrivateLessonsPanel
            profiles={profiles}
            currentUser={user}
            reload={reloadAll}
            setMsg={setMsg}
          />
        )}

        {!loading && section === 'contactos' && canFullAdmin && (
          <ContactsPanel
            setMsg={setMsg}
          />
        )}

        {!loading && section === 'tienda' && canFullAdmin && (
          <ProductsPanel
            setMsg={setMsg}
          />
        )}

        {section === 'cupos' && canFullAdmin && (
          <CuposPanel
            cupos={cupos}
            setCupos={setCupos}
            onSave={saveCuposLocal}
          />
        )}

        {section === 'config' && canFullAdmin && (
          <ConfigPanel />
        )}
      </div>
    </AppLayout>
  )
}

function DashboardPanel({
  setSection,
  adminActivity,
  canFullAdmin,
  canManageContent,
  setActionType,
}) {
  function goAction(type) {
    setActionType(type)
    setSection('acciones')
  }

  return (
    <div className="space-y-4">
      <section className={`${panel} p-4`}>
        <p className="section-label">Acciones rápidas</p>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {canFullAdmin && (
            <>
              <ActionButton
                icon="➕"
                label="Crear usuario"
                onClick={() => setSection('usuarios')}
              />
              <ActionButton
                icon="💳"
                label="Registrar pago"
                onClick={() => setSection('pagos')}
              />
            </>
          )}

          {canManageContent && (
            <>
              <ActionButton
                icon="🏁"
                label="Cargar toma"
                onClick={() => setSection('performance')}
              />
              <ActionButton
                icon="🎯"
                label="Crear objetivo"
                onClick={() => setSection('objetivos')}
              />
              <ActionButton
                icon="📝"
                label="Observación"
                onClick={() => goAction('Nota')}
              />
              <ActionButton
                icon="🏅"
                label="Insignia"
                onClick={() => goAction('Insignia')}
              />
              <ActionButton
                icon="🎉"
                label="Participación"
                onClick={() => goAction('Evento')}
              />
            </>
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">Actividad reciente</p>

        <div className="space-y-3 mt-3">
          {adminActivity.length > 0 ? (
            adminActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-black/25 border border-white/5 p-3"
              >
                <p className="text-white text-sm font-semibold">
                  {item.titulo}
                </p>
                <p className="text-white/35 text-xs">
                  {item.tipo} · {formatDate(item.fecha)}
                </p>
                {item.creado_por_nombre && (
                  <p className="text-white/25 text-[10px] mt-1">
                    Por {item.creado_por_nombre}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
              <p className="text-white/45 text-sm">
                Todavía no hay actividad real cargada.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function UsersPanel({
  currentUser,
  query,
  setQuery,
  profiles,
  selected,
  setSelectedId,
  canFullAdmin,
  canManageContent,
  canCreateAdmin,
  reload,
  setMsg,
}) {
  const [tab, setTab] = useState('info')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState([])
  const [deletingBulk, setDeletingBulk] = useState(false)

  const selectableStudents = profiles.filter(
    (profile) => profile.role === 'alumno'
  )

  const allVisibleStudentsSelected =
    selectableStudents.length > 0 &&
    selectableStudents.every((profile) =>
      bulkSelectedIds.includes(profile.id)
    )

  const tabs = [
    { id: 'info', label: 'info', show: true },
    { id: 'editar', label: 'editar', show: canFullAdmin },
    {
      id: 'grupos',
      label: 'grupos',
      show: canFullAdmin && selected?.role === 'alumno',
    },
    {
      id: 'observaciones',
      label: 'observaciones',
      show: canManageContent && selected?.role === 'alumno',
    },
    {
      id: 'insignias',
      label: 'insignias',
      show: canManageContent && selected?.role === 'alumno',
    },
    {
      id: 'participaciones',
      label: 'participaciones',
      show: canManageContent && selected?.role === 'alumno',
    },
    {
      id: 'servicios',
      label: 'servicios',
      show: canFullAdmin && selected?.role === 'alumno',
    },
    {
      id: 'actividad',
      label: 'actividad',
      show: selected?.role === 'alumno',
    },
  ].filter((item) => item.show)

  useEffect(() => {
    if (!tabs.some((item) => item.id === tab)) setTab('info')
  }, [canFullAdmin, canManageContent, selected?.id])

  useEffect(() => {
    setBulkSelectedIds((current) =>
      current.filter((id) => profiles.some((profile) => profile.id === id))
    )
  }, [profiles])

  function toggleBulkStudent(id, checked) {
    setBulkSelectedIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((profileId) => profileId !== id)
    )
  }

  function toggleAllVisibleStudents() {
    const visibleIds = selectableStudents.map((profile) => profile.id)

    setBulkSelectedIds((current) => {
      if (allVisibleStudentsSelected) {
        return current.filter((id) => !visibleIds.includes(id))
      }

      return [...new Set([...current, ...visibleIds])]
    })
  }

  async function deleteSelectedStudents() {
    if (!bulkSelectedIds.length) {
      setMsg('Seleccioná al menos un alumno para eliminar.')
      return
    }

    const selectedProfiles = profiles.filter((profile) =>
      bulkSelectedIds.includes(profile.id)
    )

    const confirmed = window.confirm(
      `¿Eliminar definitivamente ${selectedProfiles.length} alumno/s? También se eliminarán sus accesos seguros y registros relacionados. Esta acción no se puede deshacer.`
    )

    if (!confirmed) return

    try {
      setDeletingBulk(true)
      setMsg(`Eliminando 0 de ${selectedProfiles.length} alumnos...`)

      const failures = []
      let deleted = 0

      for (const profile of selectedProfiles) {
        const { data, error } = await supabase.functions.invoke(
          'gestionar-usuario-auth',
          {
            body: {
              action: 'delete',
              profile_id: profile.id,
            },
          }
        )

        if (error || !data?.success) {
          failures.push(
            `${profile.nombre} ${profile.apellido}`.trim() || profile.id
          )
        } else {
          deleted += 1
        }

        setMsg(
          `Eliminando ${deleted + failures.length} de ${selectedProfiles.length} alumnos...`
        )
      }

      setBulkSelectedIds([])
      setBulkMode(false)
      await reload()

      if (failures.length) {
        setMsg(
          `Se eliminaron ${deleted} alumno/s. No se pudieron eliminar ${failures.length}: ${failures.join(', ')}.`
        )
      } else {
        setMsg(`Se eliminaron correctamente ${deleted} alumno/s.`)
      }
    } catch (error) {
      setMsg(`No se pudo completar la eliminación múltiple: ${error.message}`)
    } finally {
      setDeletingBulk(false)
    }
  }

  return (
    <div className="space-y-4">
      {canFullAdmin && (
        <CreateUserForm
          canCreateAdmin={canCreateAdmin}
          reload={reload}
          setMsg={setMsg}
        />
      )}

      {canFullAdmin && (
        <section className={`${panel} overflow-hidden`}>
          <button
            type="button"
            onClick={() => {
              setBulkMode((value) => !value)
              setBulkSelectedIds([])
            }}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <p className="section-label">Limpieza de perfiles</p>
              <h2 className="font-display text-2xl text-white mt-1">
                Eliminar varios alumnos
              </h2>
              <p className="text-white/35 text-xs mt-1">
                Seleccioná únicamente los perfiles que ya no deben permanecer.
              </p>
            </div>
            <span className="w-9 h-9 rounded-full border border-red-400/20 bg-red-400/[0.08] text-red-200 grid place-items-center">
              {bulkMode ? '−' : '🗑️'}
            </span>
          </button>

          {bulkMode && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <p className="text-white/45 text-xs">
                  Seleccionados: {bulkSelectedIds.length}
                </p>
                <button
                  type="button"
                  onClick={toggleAllVisibleStudents}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/65 text-xs"
                >
                  {allVisibleStudentsSelected
                    ? 'Quitar visibles'
                    : 'Seleccionar visibles'}
                </button>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {selectableStudents.map((profile) => (
                  <label
                    key={profile.id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${
                      bulkSelectedIds.includes(profile.id)
                        ? 'border-red-400/30 bg-red-400/[0.08]'
                        : 'border-white/5 bg-black/25'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelectedIds.includes(profile.id)}
                      onChange={(event) =>
                        toggleBulkStudent(profile.id, event.target.checked)
                      }
                      className="w-5 h-5"
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {profile.nombre} {profile.apellido}
                      </p>
                      <p className="text-white/30 text-[10px] mt-1">
                        CI {profile.documento || 'sin documento'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={deletingBulk || bulkSelectedIds.length === 0}
                onClick={deleteSelectedStudents}
                className="w-full rounded-2xl border border-red-500/30 bg-red-500/15 py-4 text-red-100 text-sm font-bold disabled:opacity-35"
              >
                {deletingBulk
                  ? 'Eliminando perfiles...'
                  : `Eliminar ${bulkSelectedIds.length} alumno/s seleccionado/s`}
              </button>
            </div>
          )}
        </section>
      )}

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nombre, cédula, rol o grupo..."
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />

      {profiles.length === 0 && (
        <section className={`${panel} p-4`}>
          <p className="text-white font-semibold">No encontramos usuarios</p>
          <p className="text-white/40 text-sm mt-1">Probá con otra búsqueda.</p>
        </section>
      )}

      {profiles.length > 0 && selected && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedId(profile.id)}
                className={`shrink-0 px-4 py-3 rounded-2xl border text-left min-w-[200px] ${
                  selected?.id === profile.id
                    ? 'bg-pr-gold text-black border-pr-gold'
                    : 'bg-white/[0.035] border-white/10 text-white'
                }`}
              >
                <p className="font-semibold text-sm">
                  {profile.nombre} {profile.apellido}
                  {profile.verificado ? ' ✓' : ''}
                </p>
                <p
                  className={`text-xs ${
                    selected?.id === profile.id
                      ? 'text-black/60'
                      : 'text-white/35'
                  }`}
                >
                  {getRoleLabel(profile.role)} · {profile.estado}
                </p>
              </button>
            ))}
          </div>

          <section className={`${panel} overflow-hidden`}>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-black/30 grid place-items-center shrink-0">
                  {selected.foto ? (
                    <img
                      src={selected.foto}
                      alt={selected.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="section-label">Perfil administrativo</p>
                  <h2 className="font-display text-2xl text-white mt-1">
                    {selected.nombre} {selected.apellido}
                  </h2>
                  <span
                    className={`inline-flex mt-2 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getRoleColor(
                      selected.role
                    )}`}
                  >
                    {getRoleLabel(selected.role)}
                  </span>
                </div>
              </div>

              <p className="text-white/35 text-xs mt-3">
                CI {selected.documento} · {selected.estado}
              </p>
            </div>

            <div className="flex overflow-x-auto border-b border-white/5">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`px-4 py-3 text-xs uppercase tracking-wider ${
                    tab === item.id
                      ? 'text-pr-gold border-b border-pr-gold'
                      : 'text-white/35'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === 'info' && (
                <InfoTab profile={selected} canFullAdmin={canFullAdmin} />
              )}
              {tab === 'editar' && canFullAdmin && (
                <EditUserTab
                  currentUser={currentUser}
                  profile={selected}
                  canCreateAdmin={canCreateAdmin}
                  reload={reload}
                  setMsg={setMsg}
                />
              )}
              {tab === 'grupos' && canFullAdmin && (
                <GroupsTab profile={selected} reload={reload} setMsg={setMsg} />
              )}
              {tab === 'observaciones' && canManageContent && (
                <ObservationTab
                  creator={currentUser}
                  profile={selected}
                  reload={reload}
                  setMsg={setMsg}
                />
              )}
              {tab === 'insignias' && canManageContent && (
                <BadgeTab
                  creator={currentUser}
                  profile={selected}
                  reload={reload}
                  setMsg={setMsg}
                />
              )}
              {tab === 'participaciones' && canManageContent && (
                <ParticipationTab
                  creator={currentUser}
                  profile={selected}
                  reload={reload}
                  setMsg={setMsg}
                />
              )}
              {tab === 'servicios' && canFullAdmin && (
                <ServicesTab profile={selected} reload={reload} setMsg={setMsg} />
              )}
              {tab === 'actividad' && <ActivityTab profile={selected} />}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function CreateUserForm({ canCreateAdmin, reload, setMsg }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyUserForm())
  const [saving, setSaving] = useState(false)

  async function createUser() {
    try {
      setSaving(true)
      setMsg('Creando usuario y cuenta segura...')

      const documento = cleanDocument(
        form.documento
      )

      const pin = String(
        form.pin || ''
      ).trim()

      if (!form.nombre.trim()) {
        throw new Error('Falta el nombre.')
      }

      if (!documento) {
        throw new Error('Falta el documento.')
      }

      if (documento.length < 6) {
        throw new Error(
          'El documento parece incompleto.'
        )
      }

      if (!/^\d{4,8}$/.test(pin)) {
        throw new Error(
          'El PIN debe tener entre 4 y 8 números.'
        )
      }

      if (
        form.role === 'admin' &&
        !canCreateAdmin
      ) {
        throw new Error(
          'Solo Claudio puede crear administradores.'
        )
      }

      const {
        data,
        error,
      } = await supabase.functions.invoke(
        'gestionar-usuario-auth',
        {
          body: {
            action: 'create',
            profile: {
              role: form.role,
              nombre: form.nombre.trim(),
              apellido:
                form.apellido.trim(),
              documento,
              pin,
              email: form.email.trim(),
              ciudad: form.ciudad.trim(),
              instagram:
                form.instagram.trim(),
              fecha_nacimiento:
                form.fechaNacimiento ||
                null,
              miembro_desde:
                form.miembroDesde ||
                String(
                  new Date().getFullYear()
                ),
              estado: form.estado,
              verificado:
                Boolean(form.verificado),
              prcard_activa:
                form.role === 'alumno'
                  ? Boolean(
                      form.prcardActiva
                    )
                  : false,
              tracking_activo:
                form.role === 'alumno'
                  ? Boolean(
                      form.trackingActivo
                    )
                  : false,
            },
          },
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            'La función no confirmó la creación.'
        )
      }

      setForm(emptyUserForm())
      setOpen(false)

      setMsg(
        `${getRoleLabel(
          form.role
        )} creado correctamente con cuenta segura.`
      )

      await reload()
    } catch (error) {
      setMsg(
        `No se pudo crear: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`${panel} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div>
          <p className="section-label">Administración</p>
          <h2 className="font-display text-2xl text-white mt-1">
            Crear usuario
          </h2>
          <p className="text-white/35 text-xs mt-1">
            Alumno, profesor o usuario de prueba.
          </p>
        </div>

        <span className="w-9 h-9 rounded-full bg-pr-gold/10 text-pr-gold grid place-items-center">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <label className="block">
            <span className="text-white/40 text-xs">Tipo de usuario</span>
            <select
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
              className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
            >
              <option value="alumno">Alumno</option>
              <option value="profesor">Profesor</option>
              {canCreateAdmin && (
                <option value="admin">Administrador</option>
              )}
            </select>
          </label>

          <AdminInput
            label="Nombre"
            value={form.nombre}
            onChange={(value) => setForm({ ...form, nombre: value })}
          />
          <AdminInput
            label="Apellido"
            value={form.apellido}
            onChange={(value) => setForm({ ...form, apellido: value })}
          />
          <AdminInput
            label="Documento / CI"
            value={form.documento}
            onChange={(value) => setForm({ ...form, documento: value })}
            inputMode="numeric"
          />
          <AdminInput
            label="PIN"
            value={form.pin}
            onChange={(value) => setForm({ ...form, pin: value })}
            inputMode="numeric"
          />
          <AdminInput
            label="Email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            type="email"
          />
          <AdminInput
            label="Ciudad"
            value={form.ciudad}
            onChange={(value) => setForm({ ...form, ciudad: value })}
          />
          <AdminInput
            label="Instagram"
            value={form.instagram}
            onChange={(value) => setForm({ ...form, instagram: value })}
          />
          <AdminInput
            label="Fecha de nacimiento"
            value={form.fechaNacimiento}
            onChange={(value) =>
              setForm({ ...form, fechaNacimiento: value })
            }
            type="date"
          />
          <AdminInput
            label="Miembro desde"
            value={form.miembroDesde}
            onChange={(value) => setForm({ ...form, miembroDesde: value })}
            inputMode="numeric"
          />

          <label className="block">
            <span className="text-white/40 text-xs">Estado inicial</span>
            <select
              value={form.estado}
              onChange={(event) =>
                setForm({ ...form, estado: event.target.value })
              }
              className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>

          {form.role === 'alumno' && (
            <div className="space-y-2">
              <CheckRow
                label="PRCard activa"
                checked={form.prcardActiva}
                onChange={(checked) =>
                  setForm({ ...form, prcardActiva: checked })
                }
              />
              <CheckRow
                label="PR Tracking activo"
                checked={form.trackingActivo}
                onChange={(checked) =>
                  setForm({ ...form, trackingActivo: checked })
                }
              />
              <CheckRow
                label="Perfil verificado"
                checked={form.verificado}
                onChange={(checked) =>
                  setForm({ ...form, verificado: checked })
                }
              />
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={createUser}
            className="btn-gold w-full disabled:opacity-50"
          >
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>

          <p className="text-white/30 text-xs">
            La cuenta segura se crea automáticamente. El usuario podrá iniciar sesión inmediatamente con su documento y PIN.
          </p>
        </div>
      )}
    </section>
  )
}

function InfoTab({ profile, canFullAdmin }) {
  return (
    <div className="space-y-3">
      <Field
        label="Nombre"
        value={`${profile.nombre} ${profile.apellido || ''}`}
      />
      <Field label="Rol" value={getRoleLabel(profile.role)} />
      <Field label="Documento" value={profile.documento} />
      {canFullAdmin && (
        <Field label="PIN actual" value={profile.pin || 'Sin PIN'} />
      )}
      <Field label="Estado" value={profile.estado} />
      {profile.role === 'alumno' && (
        <>
          <Field
            label="Acceso"
            value={profile.accesoHabilitado ? 'Habilitado' : 'Inhabilitado'}
          />
          <Field
            label="Último pago"
            value={profile.ultimoPago || 'Sin registrar'}
          />
          <Field
            label="Mensualidad hasta"
            value={profile.mensualidadHasta || 'Sin registrar'}
          />
        </>
      )}
      <Field label="Email" value={profile.email || 'Sin cargar'} />
      <Field
        label="Instagram"
        value={profile.instagram || 'Sin cargar'}
      />
      <Field label="Ciudad" value={profile.ciudad || 'Sin cargar'} />
      {profile.role === 'alumno' && (
        <Field
          label="Grupos WhatsApp"
          value={
            profile.gruposInfo?.length
              ? profile.gruposInfo.map((group) => group.titulo).join(' · ')
              : 'Sin grupos'
          }
        />
      )}
      <Field
        label="Último ingreso"
        value={
          profile.ultimoIngreso
            ? formatDate(profile.ultimoIngreso)
            : 'Sin ingreso registrado'
        }
      />
    </div>
  )
}

function EditUserTab({
  currentUser,
  profile,
  canCreateAdmin,
  reload,
  setMsg,
}) {
  const [form, setForm] = useState({
    role: profile.role,
    nombre: profile.nombre || '',
    apellido: profile.apellido || '',
    documento: profile.documento || '',
    pin: profile.pin || '',
    email: profile.email || '',
    ciudad: profile.ciudad || '',
    instagram: profile.instagram || '',
    estado: profile.estado || 'Activo',
    fechaNacimiento: profile.fechaNacimiento || '',
    miembroDesde: profile.miembroDesde || '2026',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      role: profile.role,
      nombre: profile.nombre || '',
      apellido: profile.apellido || '',
      documento: profile.documento || '',
      pin: profile.pin || '',
      email: profile.email || '',
      ciudad: profile.ciudad || '',
      instagram: profile.instagram || '',
      estado: profile.estado || 'Activo',
      fechaNacimiento: profile.fechaNacimiento || '',
      miembroDesde: profile.miembroDesde || '2026',
    })
  }, [profile.id])

  async function saveUser() {
    try {
      setSaving(true)
      setMsg(
        'Actualizando usuario y cuenta segura...'
      )

      const documento = cleanDocument(
        form.documento
      )

      const pin = String(
        form.pin || ''
      ).trim()

      if (!form.nombre.trim()) {
        throw new Error('Falta el nombre.')
      }

      if (!documento) {
        throw new Error('Falta el documento.')
      }

      if (!/^\d{4,8}$/.test(pin)) {
        throw new Error(
          'El PIN debe tener entre 4 y 8 números.'
        )
      }

      if (
        form.role === 'admin' &&
        !canCreateAdmin &&
        profile.role !== 'admin'
      ) {
        throw new Error(
          'Solo Claudio puede asignar el rol administrador.'
        )
      }

      const {
        data,
        error,
      } = await supabase.functions.invoke(
        'gestionar-usuario-auth',
        {
          body: {
            action: 'update',
            profile_id: profile.id,
            updates: {
              role: form.role,
              nombre:
                form.nombre.trim(),
              apellido:
                form.apellido.trim(),
              documento,
              pin,
              email: form.email.trim(),
              ciudad: form.ciudad.trim(),
              instagram:
                form.instagram.trim(),
              estado: form.estado,
              fecha_nacimiento:
                form.fechaNacimiento ||
                null,
              miembro_desde:
                form.miembroDesde ||
                '2026',
            },
          },
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            'La función no confirmó la actualización.'
        )
      }

      setMsg(
        'Usuario y cuenta segura actualizados correctamente.'
      )

      await reload()
    } catch (error) {
      setMsg(
        `No se pudo actualizar: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteUser() {
    if (profile.id === currentUser?.id) {
      setMsg(
        'No podés eliminar tu propia cuenta mientras estás conectado.'
      )
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar definitivamente a ${profile.nombre}? También se eliminarán su cuenta segura y sus registros relacionados.`
    )

    if (!confirmed) {
      return
    }

    try {
      setSaving(true)
      setMsg(
        'Eliminando usuario y cuenta segura...'
      )

      const {
        data,
        error,
      } = await supabase.functions.invoke(
        'gestionar-usuario-auth',
        {
          body: {
            action: 'delete',
            profile_id: profile.id,
          },
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            'La función no confirmó la eliminación.'
        )
      }

      setMsg(
        data?.warning ||
          'Usuario y cuenta segura eliminados correctamente.'
      )

      await reload()
    } catch (error) {
      setMsg(
        `No se pudo eliminar: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-white/40 text-xs">Rol</span>
        <select
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
          className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
        >
          <option value="alumno">Alumno</option>
          <option value="profesor">Profesor</option>
          {(canCreateAdmin || profile.role === 'admin') && (
            <option value="admin">Administrador</option>
          )}
        </select>
      </label>

      <AdminInput
        label="Nombre"
        value={form.nombre}
        onChange={(value) => setForm({ ...form, nombre: value })}
      />
      <AdminInput
        label="Apellido"
        value={form.apellido}
        onChange={(value) => setForm({ ...form, apellido: value })}
      />
      <AdminInput
        label="Documento"
        value={form.documento}
        onChange={(value) => setForm({ ...form, documento: value })}
        inputMode="numeric"
      />
      <AdminInput
        label="PIN de ingreso"
        value={form.pin}
        onChange={(value) => setForm({ ...form, pin: value })}
        inputMode="numeric"
      />
      <AdminInput
        label="Email"
        value={form.email}
        onChange={(value) => setForm({ ...form, email: value })}
        type="email"
      />
      <AdminInput
        label="Ciudad"
        value={form.ciudad}
        onChange={(value) => setForm({ ...form, ciudad: value })}
      />
      <AdminInput
        label="Instagram"
        value={form.instagram}
        onChange={(value) => setForm({ ...form, instagram: value })}
      />
      <AdminInput
        label="Fecha de nacimiento"
        value={form.fechaNacimiento}
        onChange={(value) => setForm({ ...form, fechaNacimiento: value })}
        type="date"
      />
      <AdminInput
        label="Miembro desde"
        value={form.miembroDesde}
        onChange={(value) => setForm({ ...form, miembroDesde: value })}
        inputMode="numeric"
      />

      <label className="block">
        <span className="text-white/40 text-xs">Estado</span>
        <select
          value={form.estado}
          onChange={(event) =>
            setForm({ ...form, estado: event.target.value })
          }
          className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
        >
          <option value="Activo">Activo</option>
          <option value="Pausado">Pausado</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </label>

      <button
        type="button"
        disabled={saving}
        onClick={saveUser}
        className="btn-gold w-full disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      <button
        type="button"
        onClick={deleteUser}
        className="w-full rounded-2xl border border-red-500/25 bg-red-500/10 py-4 text-red-200 text-sm font-bold"
      >
        Eliminar usuario
      </button>
    </div>
  )
}

function GroupsTab({ profile, reload, setMsg }) {
  const [groups, setGroups] = useState(
    profile.gruposInfo?.length ? profile.gruposInfo : []
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setGroups(profile.gruposInfo?.length ? profile.gruposInfo : [])
  }, [profile.id])

  function addGroup() {
    setGroups([...groups, { titulo: '', link: '' }])
  }

  function updateGroup(index, field, value) {
    setGroups(
      groups.map((group, position) =>
        position === index ? { ...group, [field]: value } : group
      )
    )
  }

  function removeGroup(index) {
    setGroups(groups.filter((_, position) => position !== index))
  }

  async function saveGroups() {
    try {
      setSaving(true)
      setMsg('Guardando grupos...')

      const cleanGroups = groups
        .map((group) => ({
          titulo: String(group.titulo || '').trim(),
          link: String(group.link || '').trim(),
        }))
        .filter((group) => group.titulo)

      const { error } = await supabase
        .from('profiles')
        .update({
          grupos_info: cleanGroups,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw new Error(error.message)

      setMsg('Grupos actualizados correctamente.')
      await reload()
    } catch (error) {
      setMsg(`No se pudieron guardar los grupos: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-white/45 text-sm">
        Cargá uno o más grupos con su enlace de WhatsApp.
      </p>

      {groups.map((group, index) => (
        <div
          key={index}
          className="rounded-2xl bg-black/25 border border-white/5 p-3 space-y-2"
        >
          <AdminInput
            label="Título del grupo"
            value={group.titulo}
            onChange={(value) => updateGroup(index, 'titulo', value)}
            placeholder="Ej: Miércoles principiantes"
          />
          <AdminInput
            label="Link de WhatsApp"
            value={group.link}
            onChange={(value) => updateGroup(index, 'link', value)}
            placeholder="https://chat.whatsapp.com/..."
          />
          <button
            type="button"
            onClick={() => removeGroup(index)}
            className="text-red-300 text-xs"
          >
            Eliminar grupo
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 text-white text-sm"
      >
        + Agregar grupo
      </button>

      <button
        type="button"
        disabled={saving}
        onClick={saveGroups}
        className="btn-gold w-full disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar grupos'}
      </button>
    </div>
  )
}

function ObservationTab({ creator, profile, reload, setMsg }) {
  return (
    <ActivityCreateTab
      creator={creator}
      profile={profile}
      tipo="Nota"
      title="Nueva observación"
      label="Guardar observación"
      reload={reload}
      setMsg={setMsg}
    />
  )
}

function BadgeTab({ creator, profile, reload, setMsg }) {
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [assignedBadges, setAssignedBadges] = useState([])

  const assignedByTitle = new Map(
    assignedBadges.map((item) => [normalizePerformanceText(item.titulo), item])
  )

  async function loadAssignedBadges() {
    const { data, error } = await supabase
      .from('actividad_pr')
      .select('id, titulo, creado_por_nombre, fecha')
      .eq('alumno_id', profile.id)
      .eq('tipo', 'Insignia')
      .or('eliminado.is.null,eliminado.eq.false')
      .order('fecha', { ascending: false })

    if (error) {
      setMsg(`No se pudieron comprobar las insignias: ${error.message}`)
      return
    }

    setAssignedBadges(data || [])
  }

  useEffect(() => {
    setSelectedBadge(null)
    setDescription('')
    loadAssignedBadges()
  }, [profile.id])

  function chooseBadge(badge) {
    if (assignedByTitle.has(normalizePerformanceText(badge.title))) return
    setSelectedBadge(badge)
    setDescription(badge.description)
  }

  async function grantBadge() {
    try {
      setSaving(true)
      setMsg('Otorgando insignia...')

      if (!selectedBadge) throw new Error('Elegí una insignia.')

      const badgeKey = normalizePerformanceText(selectedBadge.title)
      if (assignedByTitle.has(badgeKey)) {
        const existing = assignedByTitle.get(badgeKey)
        throw new Error(
          `Esta insignia ya fue otorgada${
            existing?.creado_por_nombre ? ` por ${existing.creado_por_nombre}` : ''
          }.`
        )
      }

      const creatorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'

      const { error } = await supabase.from('actividad_pr').insert({
        alumno_id: profile.id,
        tipo: 'Insignia',
        titulo: selectedBadge.title,
        descripcion: description.trim(),
        fecha: new Date().toISOString(),
        creado_por_id: creator?.id || '',
        creado_por_nombre: creatorName,
        creado_por_role: creator?.role || '',
        creado_por_foto: creator?.foto || '',
      })

      if (error) throw new Error(error.message)

      setSelectedBadge(null)
      setDescription('')
      setMsg(`Insignia otorgada a ${profile.nombre}.`)
      await loadAssignedBadges()
      await reload()
    } catch (error) {
      setMsg(`No se pudo otorgar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="section-label">Insignias oficiales</p>
        <h3 className="font-display text-2xl text-white mt-1">
          Elegí una insignia
        </h3>
        <p className="text-white/35 text-xs mt-1">
          Las insignias ya otorgadas aparecen bloqueadas para evitar duplicados entre profesores.
        </p>
      </div>

      <BadgePicker
        selectedTitle={selectedBadge?.title || ''}
        onSelect={chooseBadge}
        disabledBadges={assignedByTitle}
      />

      {selectedBadge && (
        <section className="rounded-3xl border border-pr-gold/25 bg-pr-gold/[0.07] p-4 space-y-3">
          <div className="flex items-center gap-4">
            <img
              src={selectedBadge.image}
              alt={selectedBadge.title}
              className="w-24 h-24 rounded-2xl object-contain bg-black/30 border border-pr-gold/15"
            />
            <div>
              <p className="section-label">Seleccionada</p>
              <h4 className="text-white font-semibold text-lg mt-1">
                {selectedBadge.title}
              </h4>
            </div>
          </div>

          <label className="block">
            <span className="text-white/40 text-xs">
              Descripción para el alumno
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows="4"
              className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
            />
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={grantBadge}
            className="btn-gold w-full disabled:opacity-50"
          >
            {saving ? 'Otorgando...' : 'Otorgar insignia'}
          </button>
        </section>
      )}

      <ProfileActivityList
        profileId={profile.id}
        tipo="Insignia"
        creator={creator}
        reload={async () => {
          await loadAssignedBadges()
          await reload()
        }}
        setMsg={setMsg}
      />
    </div>
  )
}

function ParticipationTab({ creator, profile, reload, setMsg }) {
  return (
    <ActivityCreateTab
      creator={creator}
      profile={profile}
      tipo="Evento"
      title="Registrar participación"
      label="Registrar participación"
      reload={reload}
      setMsg={setMsg}
    />
  )
}

function ActivityCreateTab({
  creator,
  profile,
  tipo,
  title,
  label,
  reload,
  setMsg,
}) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveItem() {
    try {
      setSaving(true)
      setMsg('Guardando actividad...')

      if (!titulo.trim()) throw new Error('Falta el título.')

      const { error } = await supabase.from('actividad_pr').insert({
        alumno_id: profile.id,
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: new Date().toISOString(),
        creado_por_id: creator?.id || '',
        creado_por_nombre:
          `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
          'Equipo Punta Rollers',
        creado_por_role: creator?.role || '',
        creado_por_foto: creator?.foto || '',
      })

      if (error) throw new Error(error.message)

      setTitulo('')
      setDescripcion('')
      setMsg(`${tipo} guardada correctamente.`)
      await reload()
    } catch (error) {
      setMsg(`No se pudo guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="section-label">{title}</p>
      <AdminInput label="Título" value={titulo} onChange={setTitulo} />

      <label className="block">
        <span className="text-white/40 text-xs">Descripción</span>
        <textarea
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
          rows="4"
        />
      </label>

      <button
        type="button"
        disabled={saving}
        onClick={saveItem}
        className="btn-gold w-full disabled:opacity-50"
      >
        {saving ? 'Guardando...' : label}
      </button>

      <ProfileActivityList
        profileId={profile.id}
        tipo={tipo}
        creator={creator}
        reload={reload}
        setMsg={setMsg}
      />
    </div>
  )
}

function ProfileActivityList({
  profileId,
  tipo,
  creator,
  reload,
  setMsg,
}) {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const canEditObservations = tipo === 'Nota' && Boolean(creator)
  const canDeleteBadge = tipo === 'Insignia'

  async function loadItems() {
    let request = supabase
      .from('actividad_pr')
      .select('*')
      .eq('alumno_id', profileId)
      .eq('eliminado', false)
      .order('fecha', { ascending: false })

    if (tipo) request = request.eq('tipo', tipo)

    const { data, error } = await request

    if (error) {
      setMsg?.(`No se pudieron cargar los registros: ${error.message}`)
      return
    }

    setItems(data || [])
  }

  useEffect(() => {
    loadItems()
  }, [profileId, tipo])

  function startEditing(item) {
    setEditingId(String(item.id))
    setEditTitle(item.titulo || '')
    setEditDescription(item.descripcion || '')
  }

  function cancelEditing() {
    setEditingId('')
    setEditTitle('')
    setEditDescription('')
  }

  async function saveObservation(item) {
    try {
      setSaving(true)
      setMsg?.('Guardando corrección...')

      if (!editTitle.trim()) {
        throw new Error('El título no puede quedar vacío.')
      }

      const editorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'

      const { error } = await supabase.rpc(
        'editar_observacion_pr',
        {
          p_actividad_id: String(item.id),
          p_titulo: editTitle.trim(),
          p_descripcion: editDescription.trim(),
          p_modificado_por_id: creator?.id || '',
          p_modificado_por_nombre: editorName,
        }
      )

      if (error) throw new Error(error.message)

      cancelEditing()
      setMsg?.('Observación corregida correctamente.')
      await loadItems()
      await reload?.()
    } catch (error) {
      setMsg?.(`No se pudo corregir: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function deleteObservation(item) {
    const confirmed = window.confirm(
      `¿Eliminar la observación "${item.titulo}"? Dejará de mostrarse al alumno, pero quedará registrada internamente.`
    )

    if (!confirmed) return

    try {
      setSaving(true)
      setMsg?.('Eliminando observación...')

      const editorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'

      const { error } = await supabase.rpc(
        'eliminar_observacion_pr',
        {
          p_actividad_id: String(item.id),
          p_modificado_por_id: creator?.id || '',
          p_modificado_por_nombre: editorName,
        }
      )

      if (error) throw new Error(error.message)

      cancelEditing()
      setMsg?.('Observación eliminada correctamente.')
      await loadItems()
      await reload?.()
    } catch (error) {
      setMsg?.(`No se pudo eliminar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function deleteBadge(item) {
    const confirmed = window.confirm(
      `¿Quitar la insignia "${item.titulo}" de este alumno? Dejará de mostrarse inmediatamente en su perfil.`
    )

    if (!confirmed) return

    try {
      setSaving(true)
      setMsg?.('Quitando insignia...')

      const editorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'

      const { error } = await supabase
        .from('actividad_pr')
        .update({
          eliminado: true,
          editado_en: new Date().toISOString(),
          editado_por_id: creator?.id || '',
          editado_por_nombre: editorName,
        })
        .eq('id', item.id)

      if (error) throw new Error(error.message)

      setMsg?.('Insignia quitada correctamente.')
      await loadItems()
      await reload?.()
    } catch (error) {
      setMsg?.(`No se pudo quitar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="space-y-2 pt-2">
      <p className="section-label">Registros actuales</p>

      {items.length ? (
        items.map((item) => {
          const isEditing = editingId === String(item.id)

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-black/25 border border-white/5 p-3"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <AdminInput
                    label="Título"
                    value={editTitle}
                    onChange={setEditTitle}
                  />

                  <label className="block">
                    <span className="text-white/40 text-xs">
                      Descripción
                    </span>
                    <textarea
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(event.target.value)
                      }
                      rows="5"
                      className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={cancelEditing}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-white/65 text-xs font-bold disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveObservation(item)}
                      className="btn-gold w-full disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar corrección'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-white text-sm font-semibold">
                    {item.titulo}
                  </p>

                  <p className="text-white/40 text-xs mt-1 leading-relaxed break-words">
                    {item.tipo} · {formatDate(item.fecha)}
                    {item.creado_por_nombre
                      ? ` · ${item.creado_por_nombre}`
                      : ''}
                  </p>

                  {item.descripcion && (
                    <p className="text-white/60 text-sm mt-2 leading-relaxed break-words">
                      {item.descripcion}
                    </p>
                  )}

                  {item.editado_en && (
                    <p className="text-pr-gold/55 text-[10px] mt-2">
                      Corregida el {formatDate(item.editado_en)}
                      {item.editado_por_nombre
                        ? ` por ${item.editado_por_nombre}`
                        : ''}
                    </p>
                  )}

                  {canEditObservations && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => startEditing(item)}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-white/70 text-xs font-bold disabled:opacity-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => deleteObservation(item)}
                        className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] py-3 text-red-200 text-xs font-bold disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}

                  {canDeleteBadge && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => deleteBadge(item)}
                      className="mt-3 w-full rounded-2xl border border-red-400/40 bg-red-500/15 py-3.5 text-red-100 text-sm font-bold disabled:opacity-50"
                    >
                      {saving ? 'Quitando insignia...' : '🗑️ Quitar insignia'}
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })
      ) : (
        <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
          <p className="text-white/45 text-sm">
            Sin registros todavía.
          </p>
        </div>
      )}
    </div>
  )
}

function ServicesTab({ profile, reload, setMsg }) {
  async function toggleField(field, value) {
    try {
      setMsg('Actualizando servicio...')

      const { error } = await supabase
        .from('profiles')
        .update({
          [field]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw new Error(error.message)

      setMsg('Servicio actualizado.')
      await reload()
    } catch (error) {
      setMsg(`No se pudo actualizar: ${error.message}`)
    }
  }

  return (
    <div className="space-y-3">
      <ToggleRow
        label="PR Card"
        active={profile.prcardActiva}
        onClick={() =>
          toggleField('prcard_activa', !profile.prcardActiva)
        }
      />
      <ToggleRow
        label="PR Tracking"
        active={profile.trackingActivo}
        onClick={() =>
          toggleField('tracking_activo', !profile.trackingActivo)
        }
      />
      <ToggleRow
        label="Perfil verificado"
        active={profile.verificado}
        onClick={() => toggleField('verificado', !profile.verificado)}
      />

      <p className="text-white/30 text-xs">
        Los cambios se reflejan en el perfil y los servicios del alumno.
      </p>
    </div>
  )
}

function ActivityTab({ profile }) {
  return <ProfileActivityList profileId={profile.id} tipo="" />
}



function ObjectivesPanel({ creator, alumnos, setMsg }) {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedStudentId, setSelectedStudentId] = useState(
    alumnos[0]?.id || ''
  )
  const [studentQuery, setStudentQuery] = useState('')
  const [objectives, setObjectives] = useState([])
  const [loadingObjectives, setLoadingObjectives] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState({
    titulo: '',
    distancia: '6',
    distanciaPersonalizada: '',
    tiempoObjetivo: '',
    indicacion: '',
    fechaLimite: '',
    estado: 'Activo',
  })

  const selectedStudent = alumnos.find(
    (student) => student.id === selectedStudentId
  )

  const filteredStudents = alumnos.filter((student) =>
    `${student.nombre} ${student.apellido}`
      .toLowerCase()
      .includes(studentQuery.toLowerCase())
  )

  useEffect(() => {
    if (!selectedStudentId && alumnos[0]?.id) {
      setSelectedStudentId(alumnos[0].id)
      return
    }

    if (
      selectedStudentId &&
      !alumnos.some((student) => student.id === selectedStudentId)
    ) {
      setSelectedStudentId(alumnos[0]?.id || '')
    }
  }, [alumnos, selectedStudentId])

  useEffect(() => {
    loadObjectives(selectedStudentId)
    cancelEdit()
  }, [selectedStudentId])

  async function loadObjectives(studentId) {
    if (!studentId) {
      setObjectives([])
      return
    }

    try {
      setLoadingObjectives(true)

      const { data, error } = await supabase
        .from('pr_performance_objetivos')
        .select('*')
        .eq('alumno_id', studentId)
        .eq('eliminado', false)
        .order('estado', { ascending: true })
        .order('creado_en', { ascending: false })

      if (error) throw new Error(error.message)
      setObjectives(data || [])
    } catch (error) {
      setMsg(`No se pudieron cargar los objetivos: ${error.message}`)
    } finally {
      setLoadingObjectives(false)
    }
  }

  function resetForm() {
    setForm({
      titulo: '',
      distancia: '6',
      distanciaPersonalizada: '',
      tiempoObjetivo: '',
      indicacion: '',
      fechaLimite: '',
      estado: 'Activo',
    })
  }

  function cancelEdit() {
    setEditingId('')
    resetForm()
  }

  function startEdit(objective) {
    const standardDistance = ['2', '6', '12'].includes(
      String(Number(objective.distancia_km))
    )

    setEditingId(String(objective.id))
    setForm({
      titulo: objective.titulo || '',
      distancia: standardDistance
        ? String(Number(objective.distancia_km))
        : 'custom',
      distanciaPersonalizada: standardDistance
        ? ''
        : String(objective.distancia_km || ''),
      tiempoObjetivo: formatPerformanceDuration(
        objective.tiempo_objetivo_segundos
      ),
      indicacion: objective.indicacion || '',
      fechaLimite: objective.fecha_limite || '',
      estado: objective.estado || 'Activo',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveObjective() {
    if (!selectedStudentId) {
      setMsg('Seleccioná un alumno.')
      return
    }

    const distance = Number(
      form.distancia === 'custom'
        ? form.distanciaPersonalizada
        : form.distancia
    )
    const targetSeconds = parsePerformanceTime(form.tiempoObjetivo)

    if (!form.titulo.trim()) {
      setMsg('Escribí un título para el objetivo.')
      return
    }

    if (!distance || distance <= 0) {
      setMsg('Revisá la distancia objetivo.')
      return
    }

    if (!targetSeconds) {
      setMsg('Ingresá el tiempo objetivo como MM:SS o HH:MM:SS.')
      return
    }

    try {
      setSaving(true)
      setMsg(editingId ? 'Actualizando objetivo...' : 'Creando objetivo...')

      const creatorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'

      const payload = {
        alumno_id: selectedStudentId,
        titulo: form.titulo.trim(),
        distancia_km: distance,
        tiempo_objetivo_segundos: targetSeconds,
        indicacion: form.indicacion.trim() || null,
        fecha_limite: form.fechaLimite || null,
        estado: form.estado,
        creado_por_id: creator?.id || null,
        creado_por_nombre: creatorName,
        actualizado_en: new Date().toISOString(),
      }

      let result

      if (editingId) {
        result = await supabase
          .from('pr_performance_objetivos')
          .update(payload)
          .eq('id', editingId)
      } else {
        result = await supabase
          .from('pr_performance_objetivos')
          .insert({
            ...payload,
            creado_en: new Date().toISOString(),
            eliminado: false,
          })
      }

      if (result.error) throw new Error(result.error.message)

      setMsg(
        editingId
          ? `Objetivo de ${selectedStudent?.nombre} actualizado.`
          : `Objetivo creado para ${selectedStudent?.nombre}.`
      )
      cancelEdit()
      await loadObjectives(selectedStudentId)
    } catch (error) {
      setMsg(`No se pudo guardar el objetivo: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function changeObjectiveStatus(objective, nextStatus) {
    try {
      setMsg('Actualizando estado del objetivo...')

      const { error } = await supabase
        .from('pr_performance_objetivos')
        .update({
          estado: nextStatus,
          completado_en:
            nextStatus === 'Completado' ? new Date().toISOString() : null,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', objective.id)

      if (error) throw new Error(error.message)

      setMsg(
        nextStatus === 'Completado'
          ? 'Objetivo marcado como completado. 🎉'
          : 'Objetivo reactivado.'
      )
      await loadObjectives(selectedStudentId)
    } catch (error) {
      setMsg(`No se pudo actualizar: ${error.message}`)
    }
  }

  async function deleteObjective(objective) {
    const confirmed = window.confirm(
      `¿Eliminar el objetivo "${objective.titulo}"? Dejará de mostrarse al alumno.`
    )

    if (!confirmed) return

    try {
      setMsg('Eliminando objetivo...')

      const { error } = await supabase
        .from('pr_performance_objetivos')
        .update({
          eliminado: true,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', objective.id)

      if (error) throw new Error(error.message)

      if (editingId === String(objective.id)) cancelEdit()
      setMsg('Objetivo eliminado correctamente.')
      await loadObjectives(selectedStudentId)
    } catch (error) {
      setMsg(`No se pudo eliminar: ${error.message}`)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-pr-gold/25 bg-gradient-to-br from-pr-gold/[0.14] via-black/60 to-black p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-pr-gold text-[10px] font-bold uppercase tracking-[0.22em]">
              PR Performance
            </p>
            <h2 className="font-display text-3xl text-white mt-1">
              Objetivos del entrenador
            </h2>
            <p className="text-white/40 text-xs mt-2 leading-relaxed">
              Definí una meta concreta para cada alumno. En el perfil verá su objetivo y, en el próximo paso, su progreso automático.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-xl shrink-0">
            🎯
          </div>
        </div>
      </section>

      <section className={`${panel} p-4 space-y-3`}>
        <div>
          <p className="section-label">Alumno</p>
          <h3 className="font-display text-2xl text-white mt-1">
            Elegir perfil
          </h3>
        </div>

        <input
          value={studentQuery}
          onChange={(event) => setStudentQuery(event.target.value)}
          placeholder="Buscar alumno..."
          className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
        />

        <select
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
          className="w-full rounded-2xl bg-black/40 border border-pr-gold/20 px-4 py-4 text-sm outline-none text-white"
        >
          <option value="">Seleccionar alumno</option>
          {filteredStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.nombre} {student.apellido}
            </option>
          ))}
        </select>
      </section>

      {selectedStudent && (
        <>
          <section className={`${panel} p-4 space-y-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">
                  {editingId ? 'Editar meta' : 'Nueva meta'}
                </p>
                <h3 className="font-display text-2xl text-white mt-1">
                  {selectedStudent.nombre} {selectedStudent.apellido}
                </h3>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-white/60 text-xs"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <AdminInput
              label="Título del objetivo"
              value={form.titulo}
              onChange={(value) => setForm({ ...form, titulo: value })}
              placeholder="Ej: Bajar de 21:00 en 6K"
            />

            <div>
              <span className="text-white/40 text-xs">Distancia objetivo</span>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['2', '6', '12', 'custom'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForm({ ...form, distancia: option })}
                    className={`rounded-2xl border py-3 text-xs font-bold ${
                      form.distancia === option
                        ? 'border-pr-gold bg-pr-gold text-black'
                        : 'border-white/10 bg-white/[0.035] text-white'
                    }`}
                  >
                    {option === 'custom' ? 'Otra' : `${option}K`}
                  </button>
                ))}
              </div>
            </div>

            {form.distancia === 'custom' && (
              <AdminInput
                label="Distancia en kilómetros"
                value={form.distanciaPersonalizada}
                onChange={(value) =>
                  setForm({ ...form, distanciaPersonalizada: value })
                }
                inputMode="decimal"
                placeholder="Ej: 10"
              />
            )}

            <AdminInput
              label="Tiempo objetivo"
              value={form.tiempoObjetivo}
              onChange={(value) =>
                setForm({ ...form, tiempoObjetivo: value })
              }
              placeholder="Ej: 20:59"
            />

            <label className="block">
              <span className="text-white/40 text-xs">
                Indicación del entrenador
              </span>
              <textarea
                value={form.indicacion}
                onChange={(event) =>
                  setForm({ ...form, indicacion: event.target.value })
                }
                rows="4"
                placeholder="Ej: Mantener un ritmo parejo y no acelerar demasiado en la primera vuelta."
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
              />
            </label>

            <AdminInput
              label="Fecha límite opcional"
              value={form.fechaLimite}
              onChange={(value) => setForm({ ...form, fechaLimite: value })}
              type="date"
            />

            <label className="block">
              <span className="text-white/40 text-xs">Estado</span>
              <select
                value={form.estado}
                onChange={(event) =>
                  setForm({ ...form, estado: event.target.value })
                }
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
              >
                <option value="Activo">Activo</option>
                <option value="Pausado">Pausado</option>
                <option value="Completado">Completado</option>
              </select>
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={saveObjective}
              className="btn-gold w-full disabled:opacity-50"
            >
              {saving
                ? 'Guardando...'
                : editingId
                ? 'Guardar cambios del objetivo'
                : 'Crear objetivo'}
            </button>
          </section>

          <section className={`${panel} p-4 space-y-3`}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="section-label">Historial de metas</p>
                <h3 className="font-display text-2xl text-white mt-1">
                  Objetivos asignados
                </h3>
              </div>
              <span className="text-pr-gold text-xs font-bold">
                {objectives.length} OBJETIVO/S
              </span>
            </div>

            {loadingObjectives ? (
              <div className="rounded-2xl bg-black/25 border border-white/5 p-4 text-white/45 text-sm">
                Cargando objetivos...
              </div>
            ) : objectives.length > 0 ? (
              objectives.map((objective) => (
                <div
                  key={objective.id}
                  className={`rounded-3xl border p-4 ${
                    objective.estado === 'Completado'
                      ? 'border-emerald-400/20 bg-emerald-400/[0.06]'
                      : objective.estado === 'Pausado'
                      ? 'border-amber-300/15 bg-amber-300/[0.045]'
                      : 'border-pr-gold/15 bg-pr-gold/[0.045]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/55 text-[9px] font-bold uppercase tracking-wider">
                        {objective.estado}
                      </span>
                      <h4 className="text-white font-semibold mt-2 break-words">
                        {objective.titulo}
                      </h4>
                    </div>
                    <span className="text-xl shrink-0">
                      {objective.estado === 'Completado' ? '🏆' : '🎯'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <PerformancePreview
                      label="Distancia"
                      value={formatPerformanceDistance(
                        objective.distancia_km
                      )}
                    />
                    <PerformancePreview
                      label="Meta"
                      value={formatPerformanceDuration(
                        objective.tiempo_objetivo_segundos
                      )}
                    />
                  </div>

                  {objective.indicacion && (
                    <p className="text-white/60 text-sm leading-relaxed mt-3 break-words">
                      {objective.indicacion}
                    </p>
                  )}

                  <p className="text-white/30 text-[10px] mt-3">
                    Creado {formatDate(objective.creado_en)}
                    {objective.fecha_limite
                      ? ` · Límite ${formatPerformanceDate(
                          objective.fecha_limite
                        )}`
                      : ''}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => startEdit(objective)}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-white/70 text-xs font-bold"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeObjectiveStatus(
                          objective,
                          objective.estado === 'Completado'
                            ? 'Activo'
                            : 'Completado'
                        )
                      }
                      className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] py-3 text-emerald-200 text-xs font-bold"
                    >
                      {objective.estado === 'Completado'
                        ? 'Reactivar'
                        : 'Completar'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteObjective(objective)}
                    className="mt-2 w-full rounded-2xl border border-red-400/20 bg-red-400/[0.07] py-3 text-red-200 text-xs font-bold"
                  >
                    Eliminar objetivo
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-black/25 border border-white/5 p-4">
                <p className="text-white/45 text-sm">
                  Este alumno todavía no tiene objetivos asignados.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}


function buildAutomaticTakeFeedback(existingTakes, parsedRecords, takeNumber, takeDate) {
  const messages = parsedRecords.map((record, index) => {
    const distance = record.normalizedDistance
    const previousSummary = buildStudentPerformance(existingTakes).summaries.find(
      (summary) => summary.distance === distance
    )

    const prospectiveTake = {
      id: `preview-${takeNumber}-${index}-${distance}`,
      alumno_id: existingTakes[0]?.alumno_id || '',
      numero_toma: takeNumber,
      fecha: takeDate,
      distancia_km: record.parsedDistance,
      tiempo_segundos: record.parsedSeconds,
      origen: 'manual',
      eliminado: false,
    }

    const updatedSummary = buildStudentPerformance([
      ...existingTakes,
      prospectiveTake,
    ]).summaries.find((summary) => summary.distance === distance)

    const distanceLabel = formatEngineDistance(distance)
    const currentTime = formatEngineDuration(record.parsedSeconds)

    if (!previousSummary?.count) {
      return `${distanceLabel}: primera referencia registrada en ${currentTime}. Esta marca será el punto de partida para medir su evolución.`
    }

    const previousBestSeconds = previousSummary.best?.tiempo_segundos || 0
    const previousLatestSeconds = previousSummary.latest?.tiempo_segundos || 0
    const bestDifference = previousBestSeconds - record.parsedSeconds
    const latestDifference = previousLatestSeconds - record.parsedSeconds

    if (previousBestSeconds && record.parsedSeconds < previousBestSeconds) {
      return `${distanceLabel}: nuevo récord personal en ${currentTime}. Mejoró ${formatEngineDuration(
        bestDifference
      )} respecto a su mejor marca anterior.`
    }

    if (latestDifference > 0) {
      return `${distanceLabel}: completó la toma en ${currentTime} y mejoró ${formatEngineDuration(
        latestDifference
      )} respecto a la toma anterior.`
    }

    if (Math.abs(updatedSummary?.latestChangePercent || 0) < 1.5) {
      return `${distanceLabel}: completó la toma en ${currentTime}, manteniendo un rendimiento estable respecto al registro anterior.`
    }

    return `${distanceLabel}: completó la toma en ${currentTime}. Aunque esta vez no mejoró su marca anterior, el registro suma información útil para ajustar el entrenamiento.`
  })

  return `Actualización automática PR:\n${messages.join('\n')}`
}

async function grantAutomaticPerformanceBadges({
  studentId,
  parsedRecords,
  existingTakes,
  creator,
}) {
  const completedBefore = new Set(
    buildStudentPerformance(existingTakes).distances.map(String)
  )

  const badgeCandidates = []

  parsedRecords.forEach((record) => {
    const distance = String(record.normalizedDistance)

    if (distance === '6' && !completedBefore.has('6')) {
      badgeCandidates.push(
        OFFICIAL_BADGES.find((badge) => badge.title === 'Primeros 6K')
      )
    }

    if (distance === '10' && !completedBefore.has('10')) {
      badgeCandidates.push(
        OFFICIAL_BADGES.find((badge) => badge.title === 'Primeros 10K')
      )
    }
  })

  const uniqueCandidates = badgeCandidates.filter(
    (badge, index, list) =>
      badge &&
      list.findIndex((item) => item?.title === badge.title) === index
  )

  if (!uniqueCandidates.length) return []

  const { data: existingBadges, error: existingError } = await supabase
    .from('actividad_pr')
    .select('titulo')
    .eq('alumno_id', studentId)
    .eq('tipo', 'Insignia')
    .or('eliminado.is.null,eliminado.eq.false')

  if (existingError) throw new Error(existingError.message)

  const existingTitles = new Set(
    (existingBadges || []).map((item) =>
      normalizePerformanceText(item.titulo)
    )
  )

  const creatorName =
    `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
    'Equipo Punta Rollers'

  const rows = uniqueCandidates
    .filter(
      (badge) =>
        !existingTitles.has(normalizePerformanceText(badge.title))
    )
    .map((badge) => ({
      alumno_id: studentId,
      tipo: 'Insignia',
      titulo: badge.title,
      descripcion: badge.description,
      fecha: new Date().toISOString(),
      creado_por_id: creator?.id || '',
      creado_por_nombre: creatorName,
      creado_por_role: creator?.role || '',
      creado_por_foto: creator?.foto || '',
    }))

  if (!rows.length) return []

  const { error } = await supabase.from('actividad_pr').insert(rows)
  if (error) throw new Error(error.message)

  return rows.map((row) => row.titulo)
}

function PerformancePanel({ creator, alumnos, setMsg }) {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedStudentId, setSelectedStudentId] = useState(
    alumnos[0]?.id || ''
  )
  const [performance, setPerformance] = useState(null)
  const [takes, setTakes] = useState([])
  const [nextTakeNumber, setNextTakeNumber] = useState(1)
  const [loadingPerformance, setLoadingPerformance] = useState(false)
  const [savingTake, setSavingTake] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [legacyObservations, setLegacyObservations] = useState([])
  const [importingObservationId, setImportingObservationId] = useState('')
  const [studentQuery, setStudentQuery] = useState('')
  const [takeDate, setTakeDate] = useState(today)
  const [feedback, setFeedback] = useState('')
  const [records, setRecords] = useState([
    { id: crypto.randomUUID(), distance: '6', customDistance: '', time: '' },
  ])
  const [profileForm, setProfileForm] = useState({
    perfilRodaje: 'En evolución',
    tecnica: '',
    resistencia: '',
  })

  const selectedStudent = alumnos.find(
    (student) => student.id === selectedStudentId
  )

  const filteredStudents = alumnos.filter((student) =>
    `${student.nombre} ${student.apellido}`
      .toLowerCase()
      .includes(studentQuery.toLowerCase())
  )

  const groupedTakes = Object.values(
    takes.reduce((groups, take) => {
      const key = String(take.numero_toma)
      if (!groups[key]) {
        groups[key] = {
          numero_toma: take.numero_toma,
          fecha: take.fecha,
          devolucion: take.devolucion || '',
          registros: [],
        }
      }

      groups[key].registros.push(take)
      if (!groups[key].devolucion && take.devolucion) {
        groups[key].devolucion = take.devolucion
      }

      return groups
    }, {})
  ).sort((a, b) => Number(b.numero_toma) - Number(a.numero_toma))

  const legacyCandidates = buildLegacyPerformanceCandidates(
    legacyObservations,
    takes
  )

  const automaticPerformance = buildStudentPerformance(takes)
  const automaticPrimarySummary =
    automaticPerformance.summaries.find(
      (summary) => summary.distance === 6 && summary.hasComparison
    ) ||
    automaticPerformance.summaries.find((summary) => summary.hasComparison) ||
    automaticPerformance.summaries.find((summary) => summary.distance === 6) ||
    automaticPerformance.summaries[0] ||
    null

  const automaticMessage = getMotivationalMessage(
    automaticPrimarySummary
  )

  async function loadPerformance(studentId) {
    if (!studentId) {
      setPerformance(null)
      setTakes([])
      setLegacyObservations([])
      setNextTakeNumber(1)
      return
    }

    try {
      setLoadingPerformance(true)

      const [
        profileResult,
        takesResult,
        nextResult,
        observationsResult,
      ] = await Promise.all([
        supabase
          .from('pr_performance')
          .select('*')
          .eq('alumno_id', studentId)
          .maybeSingle(),
        supabase
          .from('pr_performance_tomas_calculadas')
          .select('*')
          .eq('alumno_id', studentId)
          .order('numero_toma', { ascending: false })
          .order('distancia_km', { ascending: true }),
        supabase.rpc('next_pr_toma_number', {
          p_alumno_id: studentId,
        }),
        supabase
          .from('actividad_pr')
          .select('id, titulo, descripcion, fecha, tipo')
          .eq('alumno_id', studentId)
          .eq('tipo', 'Nota')
          .or('eliminado.is.null,eliminado.eq.false')
          .order('fecha', { ascending: true }),
      ])

      if (profileResult.error) {
        throw new Error(profileResult.error.message)
      }

      if (takesResult.error) {
        throw new Error(takesResult.error.message)
      }

      if (observationsResult.error) {
        throw new Error(observationsResult.error.message)
      }

      const profileData = profileResult.data || null
      const loadedTakes = takesResult.data || []
      const fallbackNext =
        loadedTakes.reduce(
          (maximum, take) => Math.max(maximum, Number(take.numero_toma) || 0),
          0
        ) + 1

      setPerformance(profileData)
      setTakes(loadedTakes)
      setLegacyObservations(observationsResult.data || [])
      setNextTakeNumber(
        nextResult.error ? fallbackNext : Number(nextResult.data) || fallbackNext
      )
      setProfileForm({
        perfilRodaje: profileData?.perfil_rodaje || 'En evolución',
        tecnica: profileData?.tecnica ? String(profileData.tecnica) : '',
        resistencia: profileData?.resistencia
          ? String(profileData.resistencia)
          : '',
      })
    } catch (error) {
      setMsg(`No se pudo cargar Performance: ${error.message}`)
    } finally {
      setLoadingPerformance(false)
    }
  }

  useEffect(() => {
    if (!selectedStudentId && alumnos[0]?.id) {
      setSelectedStudentId(alumnos[0].id)
      return
    }

    if (
      selectedStudentId &&
      !alumnos.some((student) => student.id === selectedStudentId)
    ) {
      setSelectedStudentId(alumnos[0]?.id || '')
    }
  }, [alumnos, selectedStudentId])

  useEffect(() => {
    loadPerformance(selectedStudentId)
  }, [selectedStudentId])

  function resetTakeForm() {
    setTakeDate(today)
    setFeedback('')
    setRecords([
      { id: crypto.randomUUID(), distance: '6', customDistance: '', time: '' },
    ])
  }

  function addRecord() {
    setRecords((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        distance: current.some((record) => record.distance === '12')
          ? 'custom'
          : '12',
        customDistance: '',
        time: '',
      },
    ])
  }

  function updateRecord(id, field, value) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id ? { ...record, [field]: value } : record
      )
    )
  }

  function removeRecord(id) {
    setRecords((current) =>
      current.length === 1
        ? current
        : current.filter((record) => record.id !== id)
    )
  }

  async function savePerformanceProfile() {
    if (!selectedStudentId) {
      setMsg('Seleccioná un alumno.')
      return
    }

    try {
      setSavingProfile(true)
      setMsg('Guardando perfil Performance...')

      const tecnica = profileForm.tecnica
        ? Number(profileForm.tecnica)
        : null
      const resistencia = profileForm.resistencia
        ? Number(profileForm.resistencia)
        : null

      const { error } = await supabase.from('pr_performance').upsert(
        {
          alumno_id: selectedStudentId,
          perfil_rodaje: profileForm.perfilRodaje,
          tecnica,
          resistencia,
          indice_actualizado_en: new Date().toISOString(),
          visible: true,
        },
        { onConflict: 'alumno_id' }
      )

      if (error) throw new Error(error.message)

      setMsg(`Perfil Performance de ${selectedStudent?.nombre} actualizado.`)
      await loadPerformance(selectedStudentId)
    } catch (error) {
      setMsg(`No se pudo guardar el perfil: ${error.message}`)
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveTake() {
    if (!selectedStudentId) {
      setMsg('Seleccioná un alumno.')
      return
    }

    if (!takeDate) {
      setMsg('Seleccioná la fecha de la toma.')
      return
    }

    const parsedRecords = records.map((record) => {
      const rawDistance = Number(
        record.distance === 'custom'
          ? record.customDistance
          : record.distance
      )
      const seconds = parseDuration(record.time)
      const normalizedDistance = normalizeDistance(rawDistance)

      return {
        ...record,
        parsedDistance: rawDistance,
        normalizedDistance,
        parsedSeconds: seconds,
      }
    })

    if (
      parsedRecords.some(
        (record) =>
          !record.parsedDistance ||
          record.parsedDistance <= 0 ||
          !record.normalizedDistance
      )
    ) {
      setMsg('Revisá las distancias cargadas.')
      return
    }

    if (parsedRecords.some((record) => !record.parsedSeconds)) {
      setMsg('Ingresá todos los tiempos como MM:SS o HH:MM:SS.')
      return
    }

    const uniqueDistances = new Set(
      parsedRecords.map((record) => String(record.normalizedDistance))
    )

    if (uniqueDistances.size !== parsedRecords.length) {
      setMsg('No podés repetir la misma distancia dentro de una toma.')
      return
    }

    try {
      setSavingTake(true)
      setMsg(`Guardando Toma ${nextTakeNumber} completa...`)

      const { error: profileError } = await supabase
        .from('pr_performance')
        .upsert(
          {
            alumno_id: selectedStudentId,
            perfil_rodaje: profileForm.perfilRodaje,
            tecnica: profileForm.tecnica
              ? Number(profileForm.tecnica)
              : null,
            resistencia: profileForm.resistencia
              ? Number(profileForm.resistencia)
              : null,
            indice_actualizado_en: new Date().toISOString(),
            visible: true,
          },
          { onConflict: 'alumno_id' }
        )

      if (profileError) throw new Error(profileError.message)

      const automaticFeedback = buildAutomaticTakeFeedback(
        takes,
        parsedRecords,
        nextTakeNumber,
        takeDate
      )

      const completeFeedback = [
        feedback.trim(),
        automaticFeedback,
      ]
        .filter(Boolean)
        .join('\n\n')

      const rows = parsedRecords.map((record) => ({
        alumno_id: selectedStudentId,
        numero_toma: nextTakeNumber,
        fecha: takeDate,
        distancia_km: record.parsedDistance,
        tiempo_segundos: record.parsedSeconds,
        devolucion: completeFeedback || null,
        origen: 'manual',
        creado_por: creator?.id || null,
      }))

      const { error } = await supabase
        .from('pr_performance_tomas')
        .insert(rows)

      if (error) throw new Error(error.message)

      let automaticBadges = []

      try {
        automaticBadges = await grantAutomaticPerformanceBadges({
          studentId: selectedStudentId,
          parsedRecords,
          existingTakes: takes,
          creator,
        })
      } catch (badgeError) {
        console.error('No se pudieron otorgar insignias automáticas:', badgeError)
      }

      resetTakeForm()

      const badgeMessage = automaticBadges.length
        ? ` También se otorgó automáticamente: ${automaticBadges.join(', ')}.`
        : ''

      setMsg(
        `Toma ${nextTakeNumber} guardada para ${selectedStudent?.nombre} con ${rows.length} distancia/s. Se calcularon ritmo, velocidad, evolución, récord personal y progreso de objetivos.${badgeMessage}`
      )
      await loadPerformance(selectedStudentId)
    } catch (error) {
      setMsg(`No se pudo guardar la toma: ${error.message}`)
    } finally {
      setSavingTake(false)
    }
  }

  async function importLegacyObservation(candidate) {
    if (!candidate.records.length) {
      setMsg(
        'No pude detectar distancia y tiempo en esta devolución. Revisaremos ese caso de forma manual.'
      )
      return
    }

    const confirmed = window.confirm(
      `¿Importar ${candidate.title} como Toma ${candidate.takeNumber} con ${candidate.records.length} distancia/s?`
    )

    if (!confirmed) return

    try {
      setImportingObservationId(String(candidate.id))
      setMsg(`Importando ${candidate.title}...`)

      const { error: profileError } = await supabase
        .from('pr_performance')
        .upsert(
          {
            alumno_id: selectedStudentId,
            perfil_rodaje: profileForm.perfilRodaje,
            tecnica: profileForm.tecnica
              ? Number(profileForm.tecnica)
              : null,
            resistencia: profileForm.resistencia
              ? Number(profileForm.resistencia)
              : null,
            indice_actualizado_en: new Date().toISOString(),
            visible: true,
          },
          { onConflict: 'alumno_id' }
        )

      if (profileError) throw new Error(profileError.message)

      const rows = candidate.records.map((record) => ({
        alumno_id: selectedStudentId,
        numero_toma: candidate.takeNumber,
        fecha: candidate.date,
        distancia_km: record.distance,
        tiempo_segundos: record.seconds,
        devolucion: candidate.description || candidate.title,
        origen: 'observacion_importada',
        observacion_original_id: String(candidate.id),
        creado_por: creator?.id || null,
      }))

      const { error } = await supabase
        .from('pr_performance_tomas')
        .insert(rows)

      if (error) throw new Error(error.message)

      setMsg(
        `${candidate.title} importada como Toma ${candidate.takeNumber} con ${rows.length} distancia/s.`
      )
      await loadPerformance(selectedStudentId)
    } catch (error) {
      setMsg(`No se pudo importar: ${error.message}`)
    } finally {
      setImportingObservationId('')
    }
  }

  async function removeTakeGroup(group) {
    const confirmed = window.confirm(
      `¿Eliminar completa la Toma ${group.numero_toma} de ${selectedStudent?.nombre}? Se quitarán todas sus distancias.`
    )

    if (!confirmed) return

    try {
      setMsg(`Eliminando Toma ${group.numero_toma}...`)

      const { error } = await supabase
        .from('pr_performance_tomas')
        .update({ eliminado: true })
        .eq('alumno_id', selectedStudentId)
        .eq('numero_toma', group.numero_toma)
        .eq('eliminado', false)

      if (error) throw new Error(error.message)

      setMsg(`Toma ${group.numero_toma} eliminada correctamente.`)
      await loadPerformance(selectedStudentId)
    } catch (error) {
      setMsg(`No se pudo eliminar la toma: ${error.message}`)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-pr-gold/25 bg-gradient-to-br from-pr-gold/[0.14] via-black/60 to-black p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-pr-gold text-[10px] font-bold uppercase tracking-[0.22em]">
              PR Performance
            </p>
            <h2 className="font-display text-3xl text-white mt-1">
              Tomas de rendimiento
            </h2>
            <p className="text-white/40 text-xs mt-2 leading-relaxed">
              Cada toma representa una instancia completa y puede incluir una o varias distancias. El sistema calcula ritmo y velocidad automáticamente.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-xl shrink-0">
            🏁
          </div>
        </div>
      </section>

      <section className={`${panel} p-4 space-y-3`}>
        <div>
          <p className="section-label">Alumno</p>
          <h3 className="font-display text-2xl text-white mt-1">
            Elegir perfil
          </h3>
        </div>

        <input
          value={studentQuery}
          onChange={(event) => setStudentQuery(event.target.value)}
          placeholder="Buscar alumno..."
          className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
        />

        <select
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
          className="w-full rounded-2xl bg-black/40 border border-pr-gold/20 px-4 py-4 text-sm outline-none text-white"
        >
          <option value="">Seleccionar alumno</option>
          {filteredStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.nombre} {student.apellido}
            </option>
          ))}
        </select>

        {selectedStudent && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-black/40 grid place-items-center shrink-0">
              {selectedStudent.foto ? (
                <img
                  src={selectedStudent.foto}
                  alt={selectedStudent.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">
                {selectedStudent.nombre} {selectedStudent.apellido}
              </p>
              <p className="text-pr-gold text-xs font-bold mt-1">
                Próxima: Toma {nextTakeNumber}
              </p>
            </div>
          </div>
        )}
      </section>

      {loadingPerformance ? (
        <section className={`${panel} p-4 text-white/45 text-sm`}>
          Cargando PR Performance...
        </section>
      ) : selectedStudent ? (
        <>
          <section className={`${panel} p-4 space-y-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Motor PR automático</p>
                <h3 className="font-display text-2xl text-white mt-1">
                  Evolución calculada
                </h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  Se recalcula con todas las tomas válidas del alumno, incluso cuando una distancia fue registrada con pequeñas diferencias.
                </p>
              </div>
              <span className="w-11 h-11 rounded-2xl border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-lg shrink-0">
                ⚙️
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <PerformancePreview
                label="Registros válidos"
                value={String(automaticPerformance.totalRecords)}
              />
              <PerformancePreview
                label="Instancias"
                value={String(automaticPerformance.totalTakeInstances)}
              />
              <PerformancePreview
                label="Distancias comparables"
                value={String(automaticPerformance.comparisonCount)}
              />
              <PerformancePreview
                label="Distancias mejoradas"
                value={String(automaticPerformance.improvedDistanceCount)}
              />
            </div>

            {automaticPrimarySummary ? (
              <div className="rounded-2xl border border-pr-gold/15 bg-pr-gold/[0.055] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-pr-gold text-[10px] font-bold uppercase tracking-[0.15em]">
                      {formatEngineDistance(automaticPrimarySummary.distance)}
                    </p>
                    <p className="text-white font-semibold mt-1">
                      {automaticMessage.title}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/50 text-[10px]">
                    {automaticPrimarySummary.count} toma/s
                  </span>
                </div>

                <p className="text-white/55 text-xs mt-2 leading-relaxed">
                  {automaticMessage.text}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <PerformancePreview
                    label="Mejor marca"
                    value={
                      automaticPrimarySummary.best
                        ? formatEngineDuration(
                            automaticPrimarySummary.best.tiempo_segundos
                          )
                        : 'Sin marca'
                    }
                  />
                  <PerformancePreview
                    label="Última marca"
                    value={
                      automaticPrimarySummary.latest
                        ? formatEngineDuration(
                            automaticPrimarySummary.latest.tiempo_segundos
                          )
                        : 'Sin marca'
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
                <p className="text-white/45 text-sm">
                  Todavía no hay tomas válidas para calcular una evolución.
                </p>
              </div>
            )}
          </section>

          <section className={`${panel} p-4 space-y-3`}>
            <div>
              <p className="section-label">Importación automática</p>
              <h3 className="font-display text-2xl text-white mt-1">
                Devoluciones anteriores
              </h3>
              <p className="text-white/40 text-xs mt-1 leading-relaxed">
                Detectamos las observaciones de Toma 1 y Toma 2 que ya existen. No tenés que volver a escribirlas.
              </p>
            </div>

            {legacyCandidates.length > 0 ? (
              <div className="space-y-3">
                {legacyCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-2xl border border-pr-gold/15 bg-pr-gold/[0.045] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {candidate.title}
                        </p>
                        <p className="text-pr-gold/70 text-[10px] mt-1 uppercase tracking-wider">
                          Se importará como Toma {candidate.takeNumber}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/45 text-[10px]">
                        {candidate.records.length} registro/s
                      </span>
                    </div>

                    {candidate.records.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {candidate.records.map((record, index) => (
                          <div
                            key={`${candidate.id}-${record.distance}-${record.seconds}-${index}`}
                            className="rounded-xl border border-white/5 bg-black/25 px-3 py-2 flex items-center justify-between gap-3"
                          >
                            <span className="text-white/70 text-xs">
                              {formatPerformanceDistance(record.distance)}
                            </span>
                            <span className="text-white text-xs font-semibold">
                              {formatPerformanceDuration(record.seconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-amber-200/80 text-xs mt-3 leading-relaxed">
                        Encontré la devolución, pero no pude detectar con seguridad la distancia y el tiempo. Este caso requiere revisión manual.
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={
                        !candidate.records.length ||
                        importingObservationId === String(candidate.id)
                      }
                      onClick={() => importLegacyObservation(candidate)}
                      className="mt-3 w-full rounded-2xl border border-pr-gold/25 bg-pr-gold/10 py-3 text-pr-gold text-xs font-bold disabled:opacity-35"
                    >
                      {importingObservationId === String(candidate.id)
                        ? 'Importando...'
                        : candidate.records.length
                        ? `Importar como Toma ${candidate.takeNumber}`
                        : 'Revisión manual pendiente'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
                <p className="text-white/45 text-sm">
                  No hay devoluciones antiguas pendientes de importar para este alumno.
                </p>
              </div>
            )}
          </section>

          <section className={`${panel} p-4 space-y-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Nueva instancia</p>
                <h3 className="font-display text-2xl text-white mt-1">
                  Toma {nextTakeNumber}
                </h3>
                <p className="text-white/35 text-xs mt-1">
                  Agregá todas las distancias realizadas en esta misma toma.
                </p>
              </div>
              <span className="rounded-full border border-pr-gold/20 bg-pr-gold/10 px-3 py-1.5 text-pr-gold text-[10px] font-bold">
                {records.length} DISTANCIA/S
              </span>
            </div>

            <AdminInput
              label="Fecha de la toma"
              value={takeDate}
              onChange={setTakeDate}
              type="date"
            />

            <div className="space-y-3">
              {records.map((record, index) => {
                const distance = Number(
                  record.distance === 'custom'
                    ? record.customDistance
                    : record.distance
                )
                const seconds = parseDuration(record.time)
                const pace = calculatePaceSeconds(distance, seconds)
                const speed = calculateSpeedKmh(distance, seconds)

                return (
                  <div
                    key={record.id}
                    className="rounded-3xl border border-white/8 bg-black/30 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white text-sm font-semibold">
                        Registro {index + 1}
                      </p>
                      {records.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRecord(record.id)}
                          className="text-red-200 text-xs"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div>
                      <span className="text-white/40 text-xs">Distancia</span>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {['2', '6', '12', 'custom'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              updateRecord(record.id, 'distance', option)
                            }
                            className={`rounded-2xl border py-3 text-xs font-bold ${
                              record.distance === option
                                ? 'border-pr-gold bg-pr-gold text-black'
                                : 'border-white/10 bg-white/[0.035] text-white'
                            }`}
                          >
                            {option === 'custom' ? 'Otra' : `${option}K`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {record.distance === 'custom' && (
                      <AdminInput
                        label="Distancia en kilómetros"
                        value={record.customDistance}
                        onChange={(value) =>
                          updateRecord(record.id, 'customDistance', value)
                        }
                        inputMode="decimal"
                        placeholder="Ej: 10"
                      />
                    )}

                    <AdminInput
                      label="Tiempo"
                      value={record.time}
                      onChange={(value) =>
                        updateRecord(record.id, 'time', value)
                      }
                      inputMode="text"
                      placeholder="Ej: 17:32 o 01:05:20"
                    />

                    {seconds > 0 && distance > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <PerformancePreview
                          label="Ritmo estimado"
                          value={`${formatEngineDuration(pace)}/km`}
                        />
                        <PerformancePreview
                          label="Velocidad estimada"
                          value={`${speed.toFixed(2)} km/h`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={addRecord}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3.5 text-white text-sm font-semibold"
            >
              + Agregar otra distancia a esta toma
            </button>

            <label className="block">
              <span className="text-white/40 text-xs">
                Devolución general de la Toma {nextTakeNumber}
              </span>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows="5"
                placeholder="Devolución técnica general para el alumno..."
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
              />
            </label>

            <button
              type="button"
              disabled={savingTake}
              onClick={saveTake}
              className="btn-gold w-full disabled:opacity-50"
            >
              {savingTake
                ? `Guardando Toma ${nextTakeNumber}...`
                : `Guardar Toma ${nextTakeNumber} completa`}
            </button>
          </section>

          <section className={`${panel} p-4 space-y-4`}>
            <div>
              <p className="section-label">Evaluación técnica</p>
              <h3 className="font-display text-2xl text-white mt-1">
                Perfil de rodaje
              </h3>
            </div>

            <label className="block">
              <span className="text-white/40 text-xs">Perfil de rodaje</span>
              <select
                value={profileForm.perfilRodaje}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    perfilRodaje: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
              >
                <option value="Recreativo">Recreativo</option>
                <option value="En evolución">En evolución</option>
                <option value="Competitivo">Competitivo</option>
                <option value="Racing Team">Racing Team</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <PerformanceRating
                label="Técnica"
                value={profileForm.tecnica}
                onChange={(value) =>
                  setProfileForm({ ...profileForm, tecnica: value })
                }
              />
              <PerformanceRating
                label="Resistencia"
                value={profileForm.resistencia}
                onChange={(value) =>
                  setProfileForm({ ...profileForm, resistencia: value })
                }
              />
            </div>

            <button
              type="button"
              disabled={savingProfile}
              onClick={savePerformanceProfile}
              className="w-full rounded-2xl border border-pr-gold/25 bg-pr-gold/10 py-4 text-pr-gold text-sm font-bold disabled:opacity-50"
            >
              {savingProfile ? 'Guardando perfil...' : 'Guardar perfil técnico'}
            </button>
          </section>

          <section className={`${panel} p-4 space-y-3`}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="section-label">Historial</p>
                <h3 className="font-display text-2xl text-white mt-1">
                  Tomas registradas
                </h3>
              </div>
              <span className="text-pr-gold text-xs font-bold">
                {groupedTakes.length} TOMAS
              </span>
            </div>

            {groupedTakes.length > 0 ? (
              groupedTakes.map((group) => (
                <div
                  key={group.numero_toma}
                  className="rounded-3xl border border-white/8 bg-black/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-pr-gold text-[10px] font-bold uppercase tracking-[0.18em]">
                        Toma {group.numero_toma}
                      </p>
                      <p className="text-white/35 text-xs mt-1">
                        {formatPerformanceDate(group.fecha)} ·{' '}
                        {group.registros.length} distancia/s
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTakeGroup(group)}
                      className="w-9 h-9 rounded-full border border-red-400/15 bg-red-400/[0.07] text-red-200 text-xs grid place-items-center shrink-0"
                      aria-label={`Eliminar toma ${group.numero_toma}`}
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-2 mt-3">
                    {group.registros.map((take) => (
                      <div
                        key={take.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.025] p-3"
                      >
                        <p className="text-white font-display text-lg">
                          {formatPerformanceDistance(take.distancia_km)} ·{' '}
                          {formatPerformanceDuration(take.tiempo_segundos)}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <PerformancePreview
                            label="Ritmo"
                            value={`${formatPerformanceDuration(
                              take.ritmo_segundos_km
                            )}/km`}
                          />
                          <PerformancePreview
                            label="Velocidad"
                            value={`${Number(take.velocidad_kmh).toFixed(
                              2
                            )} km/h`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {group.devolucion && (
                    <div className="rounded-2xl border border-pr-gold/10 bg-pr-gold/[0.04] p-3 mt-3">
                      <p className="text-white/30 text-[10px] uppercase tracking-wider">
                        Devolución de la toma
                      </p>
                      <p className="text-white/65 text-sm leading-relaxed mt-1 break-words">
                        {group.devolucion}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-black/25 border border-white/5 p-4">
                <p className="text-white/45 text-sm">
                  Este alumno todavía no tiene tomas registradas en PR Performance.
                </p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className={`${panel} p-4`}>
          <p className="text-white/45 text-sm">
            Seleccioná un alumno para administrar su rendimiento.
          </p>
        </section>
      )}
    </div>
  )
}

function buildLegacyPerformanceCandidates(observations, takes) {
  const importedIds = new Set(
    takes
      .map((take) => String(take.observacion_original_id || ''))
      .filter(Boolean)
  )

  return observations
    .map((observation) => {
      const combined = `${observation.titulo || ''} ${
        observation.descripcion || ''
      }`
      const takeNumber = inferLegacyTakeNumber(combined)

      if (!takeNumber || importedIds.has(String(observation.id))) {
        return null
      }

      return {
        id: observation.id,
        title: observation.titulo || `Toma ${takeNumber}`,
        description: observation.descripcion || '',
        date: String(observation.fecha || new Date().toISOString()).slice(0, 10),
        takeNumber,
        records: extractLegacyPerformanceRecords(combined),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.takeNumber - b.takeNumber)
}

function inferLegacyTakeNumber(value) {
  const normalized = normalizePerformanceText(value)

  const numeric = normalized.match(
    /(?:toma|devolucion|medicion|prueba)\s*(?:de\s+tiempo\s*)?(?:n[°ºo]?\s*)?([1-9]\d*)/
  )

  if (numeric) return Number(numeric[1])

  if (
    /(?:primer|primera|1ra|1era)\s+(?:toma|medicion|prueba)/.test(
      normalized
    )
  ) {
    return 1
  }

  if (
    /(?:segundo|segunda|2da)\s+(?:toma|medicion|prueba)/.test(
      normalized
    )
  ) {
    return 2
  }

  if (
    /(?:tercer|tercera|3ra)\s+(?:toma|medicion|prueba)/.test(
      normalized
    )
  ) {
    return 3
  }

  if (
    /(?:cuarta|4ta)\s+(?:toma|medicion|prueba)/.test(
      normalized
    )
  ) {
    return 4
  }

  if (
    /(?:quinta|5ta)\s+(?:toma|medicion|prueba)/.test(
      normalized
    )
  ) {
    return 5
  }

  return 0
}

function extractLegacyPerformanceRecords(value) {
  const text = normalizePerformanceText(value).replace(/,/g, '.')
  const matches = []
  const pattern = /(\d+(?:\.\d+)?)\s*(?:km|k)\b[^\d]{0,55}(\d{1,2}:\d{2}(?::\d{2})?)/g

  for (const match of text.matchAll(pattern)) {
    const distance = Number(match[1])
    const seconds = parsePerformanceTime(match[2])

    if (distance > 0 && seconds > 0) {
      matches.push({ distance, seconds })
    }
  }

  const unique = new Map()
  matches.forEach((record) => {
    const key = `${record.distance}-${record.seconds}`
    if (!unique.has(key)) unique.set(key, record)
  })

  return Array.from(unique.values())
}

function normalizePerformanceText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function PerformanceRating({ label, value, onChange }) {
  return (
    <div>
      <span className="text-white/40 text-xs">{label}</span>
      <div className="grid grid-cols-5 gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(String(rating))}
            className={`aspect-square rounded-xl border text-xs font-bold ${
              Number(value) === rating
                ? 'border-pr-gold bg-pr-gold text-black'
                : 'border-white/10 bg-white/[0.035] text-white/55'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  )
}

function PerformancePreview({ label, value }) {
  return (
    <div className="rounded-2xl border border-pr-gold/10 bg-pr-gold/[0.055] p-3">
      <p className="text-white/30 text-[9px] uppercase tracking-[0.14em]">
        {label}
      </p>
      <p className="text-white text-sm font-semibold mt-1">{value}</p>
    </div>
  )
}

function parsePerformanceTime(value) {
  const clean = String(value || '')
    .trim()
    .replace(/[,.]/g, ':')
  if (!clean) return 0

  if (/^\d+$/.test(clean)) {
    const seconds = Number(clean)
    return seconds > 0 ? seconds : 0
  }

  const parts = clean.split(':').map((part) => Number(part))
  if (
    parts.some((part) => !Number.isFinite(part) || part < 0) ||
    parts.length < 2 ||
    parts.length > 3
  ) {
    return 0
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    if (seconds >= 60) return 0
    return minutes * 60 + seconds
  }

  const [hours, minutes, seconds] = parts
  if (minutes >= 60 || seconds >= 60) return 0
  return hours * 3600 + minutes * 60 + seconds
}

function formatPerformanceDuration(value) {
  const totalSeconds = Math.round(Number(value) || 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`
}

function formatPerformanceDistance(value) {
  const distance = Number(value)
  if (!Number.isFinite(distance)) return `${value} km`
  return `${Number.isInteger(distance) ? distance : distance.toFixed(2)}K`
}

function formatPerformanceDate(value) {
  if (!value) return 'Sin fecha'

  const parts = String(value).split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  return formatDate(value)
}

function ActionsPanel({
  creator,
  canManageContent,
  selected,
  alumnos,
  reload,
  setMsg,
  actionType,
  setActionType,
}) {
  const [selectedStudents, setSelectedStudents] = useState(
    selected?.role === 'alumno' ? [selected.id] : []
  )
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [selectedBadges, setSelectedBadges] = useState([])
  const [existingBadges, setExistingBadges] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingBadges, setLoadingBadges] = useState(false)

  const allSelected =
    alumnos.length > 0 && selectedStudents.length === alumnos.length

  const existingBadgeKeys = new Set(
    existingBadges.map(
      (item) => `${item.alumno_id}::${normalizePerformanceText(item.titulo)}`
    )
  )

  const totalBadgeCombinations =
    selectedStudents.length * selectedBadges.length

  const pendingBadgeRows = selectedStudents.flatMap((studentId) =>
    selectedBadges
      .filter(
        (badge) =>
          !existingBadgeKeys.has(
            `${studentId}::${normalizePerformanceText(badge.title)}`
          )
      )
      .map((badge) => ({ studentId, badge }))
  )

  const skippedBadgeCombinations =
    totalBadgeCombinations - pendingBadgeRows.length

  useEffect(() => {
    if (actionType !== 'Insignia' || selectedStudents.length === 0) {
      setExistingBadges([])
      return
    }

    async function loadExistingBadges() {
      try {
        setLoadingBadges(true)
        const { data, error } = await supabase
          .from('actividad_pr')
          .select('alumno_id, titulo, creado_por_nombre')
          .in('alumno_id', selectedStudents)
          .eq('tipo', 'Insignia')
          .or('eliminado.is.null,eliminado.eq.false')

        if (error) throw new Error(error.message)
        setExistingBadges(data || [])
      } catch (error) {
        setMsg(`No se pudieron comprobar las insignias existentes: ${error.message}`)
      } finally {
        setLoadingBadges(false)
      }
    }

    loadExistingBadges()
  }, [actionType, selectedStudents.join('|')])

  function toggleAll() {
    setSelectedStudents(allSelected ? [] : alumnos.map((alumno) => alumno.id))
  }

  function toggleStudent(id, checked) {
    setSelectedStudents((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((studentId) => studentId !== id)
    )
  }

  function toggleBadge(badge) {
    setSelectedBadges((current) => {
      const exists = current.some((item) => item.title === badge.title)
      return exists
        ? current.filter((item) => item.title !== badge.title)
        : [...current, badge]
    })
  }

  async function saveAction() {
    if (!canManageContent) return

    try {
      setSaving(true)
      setMsg('Guardando acción...')

      if (selectedStudents.length === 0) {
        throw new Error('Seleccioná al menos un alumno.')
      }

      const creatorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'
      const date = new Date().toISOString()

      if (actionType === 'Insignia') {
        if (!selectedBadges.length) {
          throw new Error('Seleccioná al menos una insignia.')
        }

        if (!pendingBadgeRows.length) {
          throw new Error(
            'Todas las insignias seleccionadas ya estaban asignadas a esos alumnos.'
          )
        }

        const rows = pendingBadgeRows.map(({ studentId, badge }) => ({
          alumno_id: studentId,
          tipo: 'Insignia',
          titulo: badge.title,
          descripcion: badge.description,
          fecha: date,
          creado_por_id: creator?.id || '',
          creado_por_nombre: creatorName,
          creado_por_role: creator?.role || '',
          creado_por_foto: creator?.foto || '',
        }))

        const { error } = await supabase.from('actividad_pr').insert(rows)
        if (error) throw new Error(error.message)

        setSelectedBadges([])
        setMsg(
          `${rows.length} insignia/s otorgada/s. ${
            skippedBadgeCombinations
              ? `${skippedBadgeCombinations} asignación/es duplicada/s fueron omitidas.`
              : 'No hubo duplicados.'
          }`
        )
        await reload()
        return
      }

      if (!titulo.trim()) throw new Error('Falta el título.')

      const rows = selectedStudents.map((id) => ({
        alumno_id: id,
        tipo: actionType,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: date,
        creado_por_id: creator?.id || '',
        creado_por_nombre: creatorName,
        creado_por_role: creator?.role || '',
        creado_por_foto: creator?.foto || '',
      }))

      const { error } = await supabase.from('actividad_pr').insert(rows)
      if (error) throw new Error(error.message)

      setTitulo('')
      setDescripcion('')
      setMsg(`${actionType} guardada para ${selectedStudents.length} alumno/s.`)
      await reload()
    } catch (error) {
      setMsg(`No se pudo guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className={`${panel} p-4 space-y-3`}>
        <p className="section-label">Acción grupal o individual</p>

        <label className="block">
          <span className="text-white/40 text-xs">Tipo de acción</span>
          <select
            value={actionType}
            onChange={(event) => {
              setActionType(event.target.value)
              setTitulo('')
              setDescripcion('')
              setSelectedBadges([])
            }}
            className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
          >
            <option value="Nota">Observación / Nota</option>
            <option value="Insignia">Insignia</option>
            <option value="Evento">Participación / Evento</option>
          </select>
        </label>

        {actionType === 'Insignia' ? (
          <>
            <div>
              <p className="text-white/40 text-xs">Insignias</p>
              <p className="text-white/30 text-[10px] mt-1">
                Podés seleccionar varias. Tocá nuevamente para quitar una.
              </p>
            </div>
            <BadgePicker
              selectedTitles={selectedBadges.map((badge) => badge.title)}
              onSelect={toggleBadge}
              multi
            />

            <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/[0.07] p-3">
              <p className="section-label">Resumen de asignación</p>
              <p className="text-white font-semibold mt-1">
                {selectedStudents.length} alumno/s × {selectedBadges.length} insignia/s
              </p>
              <p className="text-pr-gold text-sm font-bold mt-2">
                {pendingBadgeRows.length} asignación/es nuevas
              </p>
              {skippedBadgeCombinations > 0 && (
                <p className="text-amber-200/75 text-xs mt-1">
                  {skippedBadgeCombinations} ya existen y se omitirán automáticamente.
                </p>
              )}
              {loadingBadges && (
                <p className="text-white/35 text-xs mt-2">
                  Comprobando insignias existentes...
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <AdminInput label="Título" value={titulo} onChange={setTitulo} />
            <label className="block">
              <span className="text-white/40 text-xs">Descripción</span>
              <textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
                rows="4"
              />
            </label>
          </>
        )}
      </section>

      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Alumnos</p>
            <p className="text-white/40 text-xs mt-1">
              Seleccionados: {selectedStudents.length}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAll}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs"
          >
            {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-3">
          {alumnos.map((alumno) => (
            <label
              key={alumno.id}
              className="flex items-center gap-3 rounded-2xl bg-black/25 border border-white/5 p-3"
            >
              <input
                type="checkbox"
                checked={selectedStudents.includes(alumno.id)}
                onChange={(event) =>
                  toggleStudent(alumno.id, event.target.checked)
                }
              />
              <span className="text-white text-sm">
                {alumno.nombre} {alumno.apellido}
              </span>
            </label>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={
          saving ||
          !canManageContent ||
          (actionType === 'Insignia' &&
            (loadingBadges || pendingBadgeRows.length === 0))
        }
        onClick={saveAction}
        className="btn-gold w-full disabled:opacity-50"
      >
        {saving
          ? 'Guardando...'
          : actionType === 'Insignia'
          ? `Otorgar ${pendingBadgeRows.length} asignación/es`
          : `Guardar ${actionType}`}
      </button>
    </div>
  )
}


function BadgePicker({
  selectedTitle = '',
  selectedTitles = [],
  onSelect,
  disabledBadges = new Map(),
  multi = false,
}) {
  const chosenTitles = multi ? selectedTitles : [selectedTitle]

  return (
    <div className="grid grid-cols-2 gap-3">
      {OFFICIAL_BADGES.map((badge) => {
        const selected = chosenTitles.includes(badge.title)
        const disabledItem = disabledBadges.get(
          normalizePerformanceText(badge.title)
        )
        const disabled = Boolean(disabledItem)

        return (
          <button
            key={badge.title}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(badge)}
            className={`rounded-3xl overflow-hidden border text-left transition-all ${
              disabled
                ? 'border-emerald-400/15 bg-emerald-400/[0.045] opacity-55 cursor-not-allowed'
                : selected
                ? 'border-pr-gold bg-pr-gold/10 shadow-[0_0_0_1px_rgba(201,168,76,0.25)]'
                : 'border-white/10 bg-white/[0.035]'
            }`}
          >
            <div className="aspect-square bg-black/30 p-3 grid place-items-center relative">
              <img
                src={badge.image}
                alt={badge.title}
                className="w-full h-full object-contain"
              />
              {disabled && (
                <span className="absolute top-2 right-2 w-8 h-8 rounded-full border border-emerald-300/20 bg-emerald-400/15 text-emerald-200 grid place-items-center font-bold">
                  ✓
                </span>
              )}
            </div>

            <div className="p-3">
              <p className="text-white text-xs font-semibold leading-tight">
                {badge.title}
              </p>
              <p
                className={`text-[10px] mt-1 font-bold ${
                  disabled
                    ? 'text-emerald-300/75'
                    : selected
                    ? 'text-pr-gold'
                    : 'text-white/30'
                }`}
              >
                {disabled
                  ? `Ya otorgada${
                      disabledItem?.creado_por_nombre
                        ? ` por ${disabledItem.creado_por_nombre}`
                        : ''
                    }`
                  : selected
                  ? multi
                    ? 'Seleccionada · tocar para quitar'
                    : 'Seleccionada'
                  : 'Tocar para elegir'}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}



const DEFAULT_ROLLER_EVENTS = [
  {
    titulo: 'Morning on Street by PR',
    descripcion:
      'Rodada exclusiva de 19 km hacia La Barra, ida y vuelta. Nos concentramos a las 10:00 en la Parada 2 y, al finalizar, nos vamos a almorzar todos juntos.',
    inicio: '2026-07-26T13:00:00.000Z',
    fin: '2026-07-26T15:00:00.000Z',
    mes_referencia: '',
    lugar: 'Parada 2, La Brava',
    link: '',
    color: 'street',
    estado: 'Publicado',
    visible_feed: true,
    creado_por_nombre: 'Equipo Punta Rollers',
  },
  {
    titulo: 'Primera Clínica de Patinaje con Miguel Flores',
    descripcion:
      'Tres jornadas intensivas de 2 horas cada una junto a Miguel Flores, argentino, subcampeón mundial máster y especialista con más de 40 años de experiencia. Horarios y ubicación a confirmar.',
    inicio: '2026-09-04T03:00:00.000Z',
    fin: '2026-09-07T02:59:00.000Z',
    mes_referencia:
      'Viernes 4, sábado 5 y domingo 6 de septiembre · horario a confirmar',
    lugar: 'Ubicación a confirmar',
    link: '',
    color: 'violet',
    estado: 'Publicado',
    visible_feed: true,
    creado_por_nombre: 'Equipo Punta Rollers',
  },
  {
    titulo: 'Segunda Clínica de Patinaje con Miguel Flores',
    descripcion:
      'En octubre volvemos a entrenar junto a Miguel Flores en una nueva clínica intensiva de patinaje. Próximamente anunciaremos las fechas, los horarios y la ubicación.',
    inicio: null,
    fin: null,
    mes_referencia: 'Octubre 2026 · fechas a confirmar',
    lugar: 'Ubicación a confirmar',
    link: '',
    color: 'electric',
    estado: 'Próximamente',
    visible_feed: true,
    creado_por_nombre: 'Equipo Punta Rollers',
  },
]


function normalizeEventTitle(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('es-UY')
}

function getDefaultRollerEvents() {
  return DEFAULT_ROLLER_EVENTS.map((event, index) => ({
    id: `default-event-${index + 1}`,
    created_at: event.inicio || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _isFallback: true,
    ...event,
  }))
}

function mergeRollerEvents(databaseEvents = []) {
  const byTitle = new Map(
    (databaseEvents || []).map((event) => [
      normalizeEventTitle(event.titulo),
      event,
    ])
  )

  const merged = getDefaultRollerEvents().map((fallback) => {
    const databaseVersion = byTitle.get(
      normalizeEventTitle(fallback.titulo)
    )

    if (databaseVersion) {
      byTitle.delete(normalizeEventTitle(fallback.titulo))
      return databaseVersion
    }

    return fallback
  })

  return [...merged, ...byTitle.values()]
}

const EVENT_COLOR_OPTIONS = [
  {
    id: 'street',
    label: 'Street · negro y rojo',
    preview: 'from-red-600/35 via-zinc-950 to-orange-500/20',
    card: 'from-[#2a0d0d] via-[#101014] to-[#27120b]',
    border: 'border-red-400/25',
    accent: 'text-red-200',
  },
  {
    id: 'violet',
    label: 'Clínica · violeta y fucsia',
    preview: 'from-violet-600/35 via-fuchsia-500/20 to-zinc-950',
    card: 'from-[#25103b] via-[#17101f] to-[#09090d]',
    border: 'border-fuchsia-300/25',
    accent: 'text-fuchsia-200',
  },
  {
    id: 'electric',
    label: 'Eléctrico · azul y celeste',
    preview: 'from-blue-600/35 via-cyan-500/20 to-zinc-950',
    card: 'from-[#0b2141] via-[#0d1724] to-[#08090d]',
    border: 'border-cyan-300/25',
    accent: 'text-cyan-200',
  },
  {
    id: 'gold',
    label: 'Premium · dorado y negro',
    preview: 'from-amber-500/35 via-yellow-300/10 to-zinc-950',
    card: 'from-[#2b2008] via-[#15130d] to-[#08080b]',
    border: 'border-amber-300/25',
    accent: 'text-amber-200',
  },
  {
    id: 'green',
    label: 'Energía · verde y esmeralda',
    preview: 'from-emerald-600/35 via-lime-400/15 to-zinc-950',
    card: 'from-[#0b2c22] via-[#0d1814] to-[#08090b]',
    border: 'border-emerald-300/25',
    accent: 'text-emerald-200',
  },
]

function emptyEventForm() {
  return {
    id: '',
    titulo: '',
    descripcion: '',
    inicio: '',
    fin: '',
    lugar: '',
    link: '',
    color: 'street',
    estado: 'Publicado',
    mesReferencia: '',
  }
}

function eventLocalInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function eventStatus(event) {
  if (event.estado === 'Cancelado') return 'Cancelado'
  if (!event.inicio) return 'Próximamente'

  const now = Date.now()
  const start = new Date(event.inicio).getTime()
  const end = event.fin ? new Date(event.fin).getTime() : start

  if (Number.isNaN(start)) return 'Próximamente'
  if (now < start) return 'Publicado'
  if (now <= end + 5 * 60000) return 'En curso'
  return 'Finalizado'
}

function formatEventRange(event) {
  if (event.mes_referencia) return event.mes_referencia
  if (!event.inicio) return 'Fecha a confirmar'

  const start = new Date(event.inicio)
  const end = event.fin ? new Date(event.fin) : null

  const startText = start.toLocaleString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (!end || Number.isNaN(end.getTime())) return startText

  const sameDay = start.toDateString() === end.toDateString()
  const endText = end.toLocaleString('es-UY', {
    weekday: sameDay ? undefined : 'long',
    day: sameDay ? undefined : 'numeric',
    month: sameDay ? undefined : 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${startText} · hasta ${endText}`
}

function EventsPanel({ creator, setMsg }) {
  const [events, setEvents] = useState(() => getDefaultRollerEvents())
  const [form, setForm] = useState(emptyEventForm())
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openForm, setOpenForm] = useState(false)

  const selectedColor =
    EVENT_COLOR_OPTIONS.find((option) => option.id === form.color) ||
    EVENT_COLOR_OPTIONS[0]

  async function loadEvents() {
    setLoadingEvents(true)

    try {
      const { data, error } = await supabase
        .from('rollerfeed_events')
        .select('*')

      if (error) {
        setEvents(getDefaultRollerEvents())
        setMsg(
          `Los eventos se muestran con la información oficial guardada en la app. Supabase respondió: ${error.message}`
        )
        return
      }

      const loadedEvents = mergeRollerEvents(data || [])

      loadedEvents.sort((a, b) => {
        if (!a.inicio && !b.inicio) {
          return String(b.created_at || '').localeCompare(
            String(a.created_at || '')
          )
        }
        if (!a.inicio) return 1
        if (!b.inicio) return -1
        return new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
      })

      setEvents(loadedEvents)
    } catch (error) {
      setEvents(getDefaultRollerEvents())
      setMsg(
        `Los eventos se muestran con la información oficial guardada en la app. No se pudo consultar Supabase: ${error.message}`
      )
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  function editEvent(event) {
    setForm({
      id: event.id,
      titulo: event.titulo || '',
      descripcion: event.descripcion || '',
      inicio: eventLocalInputValue(event.inicio),
      fin: eventLocalInputValue(event.fin),
      lugar: event.lugar || '',
      link: event.link || '',
      color: event.color || 'street',
      estado: event.estado || 'Publicado',
      mesReferencia: event.mes_referencia || '',
    })
    setOpenForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setForm(emptyEventForm())
    setOpenForm(false)
  }

  async function saveEvent() {
    try {
      setSaving(true)

      if (!form.titulo.trim()) {
        throw new Error('Falta el nombre del evento.')
      }

      if (form.inicio && form.fin) {
        const start = new Date(form.inicio).getTime()
        const end = new Date(form.fin).getTime()
        if (end <= start) {
          throw new Error('La finalización debe ser posterior al inicio.')
        }
      }

      const creatorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'

      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        inicio: form.inicio ? new Date(form.inicio).toISOString() : null,
        fin: form.fin ? new Date(form.fin).toISOString() : null,
        lugar: form.lugar.trim(),
        link: form.link.trim(),
        color: form.color,
        estado: form.estado,
        mes_referencia: form.mesReferencia.trim(),
        visible_feed: form.estado !== 'Cancelado',
        creado_por_nombre: creatorName,
        updated_at: new Date().toISOString(),
      }

      const isFallbackEvent = String(form.id || '').startsWith('default-event-')

      const request =
        form.id && !isFallbackEvent
          ? supabase.from('rollerfeed_events').update(payload).eq('id', form.id)
          : supabase.from('rollerfeed_events').insert(payload)

      const { error } = await request
      if (error) throw new Error(error.message)

      setMsg(form.id ? 'Evento actualizado correctamente.' : 'Evento publicado correctamente.')
      resetForm()
      await loadEvents()
    } catch (error) {
      setMsg(`No se pudo guardar el evento: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function removeEvent(event) {
    if (event._isFallback || String(event.id || '').startsWith('default-event-')) {
      setMsg(
        'Este es un evento oficial de respaldo. Podés editarlo y, al guardar, se creará su versión en Supabase.'
      )
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar "${event.titulo}"? Esta acción lo quitará también del RollerFeed.`
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('rollerfeed_events')
      .delete()
      .eq('id', event.id)

    if (error) {
      setMsg(`No se pudo eliminar el evento: ${error.message}`)
      return
    }

    setMsg('Evento eliminado correctamente.')
    if (form.id === event.id) resetForm()
    await loadEvents()
  }

  return (
    <div className="space-y-4">
      <section className={`${panel} overflow-hidden`}>
        <button
          type="button"
          onClick={() => setOpenForm((value) => !value)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div>
            <p className="section-label">RollerFeed</p>
            <h2 className="font-display text-2xl text-white mt-1">
              {form.id ? 'Editar evento' : 'Nuevo evento'}
            </h2>
            <p className="text-white/35 text-xs mt-1">
              Banners limpios, sin imágenes y con identidad propia.
            </p>
          </div>

          <span className="w-10 h-10 rounded-full bg-pr-gold/10 text-pr-gold grid place-items-center">
            {openForm ? '−' : '+'}
          </span>
        </button>

        {openForm && (
          <div className="px-4 pb-4 space-y-3 animate-fade-in">
            <div className={`relative overflow-hidden rounded-[28px] border ${selectedColor.border} bg-gradient-to-br ${selectedColor.card} p-5`}>
              <div className="absolute -right-10 -top-12 w-36 h-36 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${selectedColor.accent}`}>
                  Vista previa · Evento PR
                </p>
                <h3 className="font-display text-[28px] leading-tight text-white mt-3">
                  {form.titulo || 'Nombre del evento'}
                </h3>
                <p className="text-white/45 text-xs mt-3">
                  {form.inicio
                    ? formatEventRange({
                        inicio: new Date(form.inicio).toISOString(),
                        fin: form.fin ? new Date(form.fin).toISOString() : null,
                        mes_referencia: form.mesReferencia,
                      })
                    : form.mesReferencia || 'Fecha a confirmar'}
                </p>
                {form.lugar && (
                  <p className="text-white/55 text-xs mt-2">📍 {form.lugar}</p>
                )}
              </div>
            </div>

            <AdminInput
              label="Nombre del evento"
              value={form.titulo}
              onChange={(value) => setForm({ ...form, titulo: value })}
              placeholder="Ej: Morning on Street by PR"
            />

            <label className="block">
              <span className="text-white/40 text-xs">Descripción</span>
              <textarea
                value={form.descripcion}
                onChange={(event) =>
                  setForm({ ...form, descripcion: event.target.value })
                }
                rows={5}
                placeholder="Contá lo esencial del evento..."
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminInput
                label="Inicio"
                value={form.inicio}
                onChange={(value) => setForm({ ...form, inicio: value })}
                type="datetime-local"
              />
              <AdminInput
                label="Finalización"
                value={form.fin}
                onChange={(value) => setForm({ ...form, fin: value })}
                type="datetime-local"
              />
            </div>

            <p className="text-white/25 text-[10px] leading-relaxed">
              Si la fecha todavía no está confirmada, dejá Inicio y Finalización vacíos y completá el mes o texto de referencia.
            </p>

            <AdminInput
              label="Mes o fecha de referencia"
              value={form.mesReferencia}
              onChange={(value) => setForm({ ...form, mesReferencia: value })}
              placeholder="Ej: Octubre 2026 · fechas a confirmar"
            />

            <AdminInput
              label="Lugar"
              value={form.lugar}
              onChange={(value) => setForm({ ...form, lugar: value })}
              placeholder="Ej: Parada 2, La Brava"
            />

            <AdminInput
              label="Link opcional"
              value={form.link}
              onChange={(value) => setForm({ ...form, link: value })}
              placeholder="https://..."
              type="url"
            />

            <label className="block">
              <span className="text-white/40 text-xs">Color del banner</span>
              <select
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
              >
                {EVENT_COLOR_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-white/40 text-xs">Estado manual</span>
              <select
                value={form.estado}
                onChange={(event) => setForm({ ...form, estado: event.target.value })}
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
              >
                <option value="Publicado">Publicado</option>
                <option value="Próximamente">Próximamente</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/[0.04] py-4 text-white/60 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveEvent}
                className="btn-gold w-full disabled:opacity-50"
              >
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Publicar evento'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="section-label">Calendario PR</p>
            <h2 className="font-display text-2xl text-white mt-1">
              Eventos cargados
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/45 text-[10px] font-bold">
            {events.length} eventos
          </span>
        </div>

        {loadingEvents ? (
          <div className={`${panel} p-4 text-white/40 text-sm`}>
            Cargando eventos...
          </div>
        ) : events.length ? (
          events.map((event) => {
            const color =
              EVENT_COLOR_OPTIONS.find((option) => option.id === event.color) ||
              EVENT_COLOR_OPTIONS[0]
            const status = eventStatus(event)

            return (
              <article
                key={event.id}
                className={`relative overflow-hidden rounded-[30px] border ${color.border} bg-gradient-to-br ${color.card} p-5`}
              >
                <div className="absolute -right-12 -top-14 w-40 h-40 rounded-full bg-white/[0.08] blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.17em] ${color.accent}`}>
                      Evento PR
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/65 text-[9px] font-bold">
                      {status}
                    </span>
                  </div>

                  <h3 className="font-display text-[27px] leading-tight text-white mt-3">
                    {event.titulo}
                  </h3>

                  <p className="text-white/45 text-xs mt-3 leading-relaxed">
                    {formatEventRange(event)}
                  </p>

                  {event.lugar && (
                    <p className="text-white/55 text-xs mt-2">📍 {event.lugar}</p>
                  )}

                  {event.descripcion && (
                    <p className="text-white/45 text-sm leading-relaxed mt-4">
                      {event.descripcion}
                    </p>
                  )}

                  <div className="flex gap-2 mt-5 pt-4 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => editEvent(event)}
                      className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] py-3 text-white text-xs font-bold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEvent(event)}
                      className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-red-200 text-xs font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <div className={`${panel} p-6 text-center`}>
            <p className="text-white/50 text-sm">Todavía no hay eventos cargados.</p>
          </div>
        )}
      </section>
    </div>
  )
}


function CuposPanel({ cupos, setCupos, onSave }) {
  return (
    <section className={`${panel} p-4 space-y-3`}>
      <p className="section-label">Cupos manuales de la Home</p>
      <CupoInput
        label="Miércoles · Clases mixtas"
        value={cupos.miercoles.principiantes}
        onChange={(value) =>
          setCupos({
            ...cupos,
            miercoles: { ...cupos.miercoles, principiantes: value },
          })
        }
      />
      <CupoInput
        label="Sábado · Adultos 09:00"
        value={cupos.miercoles.avanzado}
        onChange={(value) =>
          setCupos({
            ...cupos,
            miercoles: { ...cupos.miercoles, avanzado: value },
          })
        }
      />
      <CupoInput
        label="Sábado · PR Kids 19:00"
        value={cupos.sabado.kids}
        onChange={(value) =>
          setCupos({
            ...cupos,
            sabado: { ...cupos.sabado, kids: value },
          })
        }
      />
      <CupoInput
        label="Sábado · Adultos 20:00"
        value={cupos.sabado.adultos}
        onChange={(value) =>
          setCupos({
            ...cupos,
            sabado: { ...cupos.sabado, adultos: value },
          })
        }
      />
      <button type="button" onClick={onSave} className="btn-gold w-full">
        Guardar cupos
      </button>
    </section>
  )
}

function ConfigPanel() {
  return (
    <section className={`${panel} p-4`}>
      <p className="section-label">
        Configuración general
      </p>

      <h2 className="font-display text-2xl text-white mt-1">
        PuntaRollers.app
      </h2>

      <p className="text-white/45 text-sm mt-2 leading-relaxed">
        La migración de usuarios a Supabase Auth ya fue completada.
        La gestión diaria de cuentas, PIN, pagos, clases particulares
        y contactos permanece activa desde este panel.
      </p>

      <div className="rounded-2xl bg-emerald-400/[0.08] border border-emerald-400/15 p-3 mt-4">
        <p className="text-emerald-200 text-xs leading-relaxed">
          Sistema de usuarios seguro y operativo.
        </p>
      </div>
    </section>
  )
}

function Stat({ label, value, alert }) {
  return (
    <div
      className={`rounded-3xl p-4 border ${
        alert
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-white/[0.035] border-white/10'
      }`}
    >
      <p className="text-2xl font-display text-white">{value}</p>
      <p className="text-white/35 text-[10px] uppercase tracking-[0.16em]">
        {label}
      </p>
    </div>
  )
}

function Quick({ icon, label, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl p-3 min-w-[74px] text-center border ${
        active
          ? 'bg-pr-gold text-black border-pr-gold'
          : 'bg-white/[0.035] text-white border-white/10'
      } ${disabled ? 'opacity-30' : ''}`}
    >
      <p>{icon}</p>
      <p className="text-[10px] font-bold mt-1">{label}</p>
    </button>
  )
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-black/25 border border-white/5 p-4 text-left"
    >
      <p className="text-xl">{icon}</p>
      <p className="text-white text-sm font-semibold mt-2">{label}</p>
    </button>
  )
}

function Field({ label, value }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
      <p className="text-white/30 text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-white/75 text-sm mt-1 break-words">{value}</p>
    </div>
  )
}

function List({ items }) {
  return (
    <div className="space-y-2">
      {items.length ? (
        items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="rounded-2xl bg-black/25 border border-white/5 p-3"
          >
            <p className="text-white text-sm font-semibold">{item.title}</p>
            <p className="text-white/40 text-xs mt-1">{item.desc}</p>
          </div>
        ))
      ) : (
        <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
          <p className="text-white/45 text-sm">Sin registros todavía.</p>
        </div>
      )}
    </div>
  )
}

function ToggleRow({ label, active, onClick }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/25 border border-white/5 p-4">
      <div>
        <p className="text-white font-semibold">{label}</p>
        <p
          className={
            active ? 'text-emerald-400 text-xs' : 'text-red-300 text-xs'
          }
        >
          {active ? 'Activo' : 'Inactivo'}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="px-3 py-2 rounded-xl bg-white/5 text-white/70 text-xs"
      >
        Cambiar
      </button>
    </div>
  )
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 border border-white/5 p-4">
      <span className="text-white text-sm">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="w-5 h-5"
      />
    </label>
  )
}

function CupoInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-white/40 text-xs">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />
    </label>
  )
}

function AdminInput({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  inputMode,
}) {
  return (
    <label className="block">
      <span className="text-white/40 text-xs">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />
    </label>
  )
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
        }

