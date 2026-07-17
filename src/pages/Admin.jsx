import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import PaymentsPanel from '../components/admin/PaymentsPanel'
import PrivateLessonsPanel from '../components/admin/PrivateLessonsPanel'
import ContactsPanel from '../components/admin/ContactsPanel'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { getCupos, saveCupos } from '../data/cupos'

const panel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

const EMPTY_STATS = {
  eventos: 0,
  insignias: 0,
  notas: 0,
}

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
      id: 'acciones',
      icon: '⚡',
      label: 'Acciones',
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

  return (
    <div className="space-y-4">
      {canFullAdmin && (
        <CreateUserForm
          canCreateAdmin={canCreateAdmin}
          reload={reload}
          setMsg={setMsg}
        />
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
          <p className="text-white/40 text-sm mt-1">
            Probá con otra búsqueda.
          </p>
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
                <GroupsTab
                  profile={selected}
                  reload={reload}
                  setMsg={setMsg}
                />
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
                <ServicesTab
                  profile={selected}
                  reload={reload}
                  setMsg={setMsg}
                />
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
  return (
    <ActivityCreateTab
      creator={creator}
      profile={profile}
      tipo="Insignia"
      title="Otorgar insignia"
      label="Otorgar insignia"
      reload={reload}
      setMsg={setMsg}
    />
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

      <ProfileActivityList profileId={profile.id} tipo={tipo} />
    </div>
  )
}

function ProfileActivityList({ profileId, tipo }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function load() {
      let request = supabase
        .from('actividad_pr')
        .select('*')
        .eq('alumno_id', profileId)
        .order('fecha', { ascending: false })

      if (tipo) request = request.eq('tipo', tipo)

      const { data, error } = await request
      if (!error) setItems(data || [])
    }

    load()
  }, [profileId, tipo])

  return (
    <div className="space-y-2 pt-2">
      <p className="section-label">Registros actuales</p>
      <List
        items={items.map((item) => ({
          title: item.titulo,
          desc: `${item.tipo} · ${formatDate(item.fecha)} · ${
            item.descripcion || ''
          }${
            item.creado_por_nombre ? ` · ${item.creado_por_nombre}` : ''
          }`,
        }))}
      />
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
  const [saving, setSaving] = useState(false)

  const allSelected =
    alumnos.length > 0 && selectedStudents.length === alumnos.length

  function toggleAll() {
    setSelectedStudents(
      allSelected ? [] : alumnos.map((alumno) => alumno.id)
    )
  }

  function toggleStudent(id, checked) {
    setSelectedStudents((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((studentId) => studentId !== id)
    )
  }

  async function saveAction() {
    if (!canManageContent) return

    try {
      setSaving(true)
      setMsg('Guardando acción...')

      if (!titulo.trim()) throw new Error('Falta el título.')
      if (selectedStudents.length === 0) {
        throw new Error('Seleccioná al menos un alumno.')
      }

      const creatorName =
        `${creator?.nombre || ''} ${creator?.apellido || ''}`.trim() ||
        'Equipo Punta Rollers'
      const date = new Date().toISOString()

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
      setMsg(
        `${actionType} guardada para ${selectedStudents.length} alumno/s.`
      )
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
            onChange={(event) => setActionType(event.target.value)}
            className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
          >
            <option value="Nota">Observación / Nota</option>
            <option value="Insignia">Insignia</option>
            <option value="Evento">Participación / Evento</option>
          </select>
        </label>

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
        disabled={saving || !canManageContent}
        onClick={saveAction}
        className="btn-gold w-full disabled:opacity-50"
      >
        {saving ? 'Guardando...' : `Guardar ${actionType}`}
      </button>
    </div>
  )
}

function CuposPanel({ cupos, setCupos, onSave }) {
  return (
    <section className={`${panel} p-4 space-y-3`}>
      <p className="section-label">Cupos manuales de la Home</p>
      <CupoInput
        label="Miércoles · Principiantes"
        value={cupos.miercoles.principiantes}
        onChange={(value) =>
          setCupos({
            ...cupos,
            miercoles: { ...cupos.miercoles, principiantes: value },
          })
        }
      />
      <CupoInput
        label="Miércoles · Avanzado"
        value={cupos.miercoles.avanzado}
        onChange={(value) =>
          setCupos({
            ...cupos,
            miercoles: { ...cupos.miercoles, avanzado: value },
          })
        }
      />
      <CupoInput
        label="Sábado · Kids"
        value={cupos.sabado.kids}
        onChange={(value) =>
          setCupos({
            ...cupos,
            sabado: { ...cupos.sabado, kids: value },
          })
        }
      />
      <CupoInput
        label="Sábado · Adultos"
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
