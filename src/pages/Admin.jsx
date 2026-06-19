import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { getCupos, saveCupos } from '../data/cupos'

const panel = 'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

function makeAlumnoId(documento) {
  return `alumno-${String(documento || '').trim()}`
}

function normalizeAlumno(p) {
  return {
    id: p.id,
    nombre: p.nombre || '',
    apellido: p.apellido || '',
    documento: p.documento || '',
    pin: p.pin || '',
    email: p.email || '',
    ciudad: p.ciudad || '',
    instagram: p.instagram || '',
    estado: p.estado || 'Activo',
    verificado: Boolean(p.verificado),
    prcardActiva: Boolean(p.prcard_activa),
    trackingActivo: Boolean(p.tracking_activo),
    gruposInfo: Array.isArray(p.grupos_info) ? p.grupos_info : [],
    estadisticas: p.estadisticas || { eventos: 0, insignias: 0, notas: 0 },
    ultimoIngreso: p.ultimo_ingreso || '',
    foto: p.foto || '',
    banner: p.banner || '',
    sobreMi: p.sobre_mi || '',
    miembroDesde: p.miembro_desde || '2026',
  }
}

function emptyAlumnoForm() {
  return {
    nombre: '',
    apellido: '',
    documento: '',
    pin: '',
    email: '',
    ciudad: '',
    instagram: '',
  }
}

export default function Admin() {
  const { user, logout } = useAuth()
  const [section, setSection] = useState('dashboard')
  const [alumnos, setAlumnos] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [cupos, setCupos] = useState(getCupos())
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [adminActivity, setAdminActivity] = useState([])
  const [actionType, setActionType] = useState('Nota')

  const canFullAdmin = user?.role === 'admin'
  const canManageContent = user?.role === 'admin' || user?.role === 'profesor'

  async function loadAlumnos() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'alumno')
      .order('nombre', { ascending: true })

    if (error) {
      setMsg(`Error cargando alumnos: ${error.message}`)
      setLoading(false)
      return
    }

    const list = (data || []).map(normalizeAlumno)
    setAlumnos(list)

    if (!selectedId && list[0]?.id) setSelectedId(list[0].id)
    if (selectedId && !list.some(a => a.id === selectedId)) setSelectedId(list[0]?.id || '')

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
    await loadAlumnos()
    await loadAdminActivity()
  }

  useEffect(() => {
    reloadAll()
  }, [])

  const selected = alumnos.find(a => a.id === selectedId) || alumnos[0]

  const filtered = alumnos.filter(a =>
    `${a.nombre} ${a.apellido} ${a.documento} ${JSON.stringify(a.gruposInfo)}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )

  const active7 = alumnos.filter(a => {
    if (!a.ultimoIngreso) return false
    const date = new Date(a.ultimoIngreso)
    if (Number.isNaN(date.getTime())) return false
    const diff = Date.now() - date.getTime()
    return diff <= 7 * 24 * 60 * 60 * 1000
  }).length

  const saveCuposLocal = () => {
    saveCupos(cupos)
    setMsg('Cupos actualizados correctamente.')
  }

  const quickItems = [
    { id: 'dashboard', icon: '📊', label: 'Inicio', show: true },
    { id: 'alumnos', icon: '👥', label: 'Alumnos', show: true },
    { id: 'acciones', icon: '⚡', label: 'Acciones', show: canManageContent },
    { id: 'cupos', icon: '🟢', label: 'Cupos', show: canFullAdmin },
    { id: 'config', icon: '⚙️', label: 'Config', show: canFullAdmin },
  ].filter(item => item.show)

  return (
    <AppLayout title="Panel Admin">
      <div className="px-4 py-5 space-y-5 animate-page-enter">
        <section className={`${panel} p-5 bg-gradient-to-br from-pr-gold/10 to-white/[0.025]`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">PuntaRollers.app</p>
              <h1 className="font-display text-3xl text-white mt-1">
                Hola, {user?.nombre || 'Admin'}
              </h1>
              <p className="text-white/40 text-xs mt-1">
                {canFullAdmin
                  ? 'Gestión completa de alumnos, servicios, grupos, notas, insignias y actividad.'
                  : 'Panel de profesor para seguimiento de alumnos, observaciones, insignias y participaciones.'}
              </p>
            </div>
            <button onClick={logout} className="text-white/35 text-xs">Salir</button>
          </div>
        </section>

        {msg && (
          <div className="rounded-2xl bg-pr-gold/10 border border-pr-gold/20 p-3 text-pr-gold text-sm">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Alumnos" value={alumnos.length} />
          <Stat label="Activos 7 días" value={active7} />
          <Stat label="Registros" value={adminActivity.length} />
          <Stat label="Cumpleaños mes" value="—" />
        </div>

        <section className="flex gap-2 overflow-x-auto pb-1">
          {quickItems.map(item => (
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
            Cargando alumnos...
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

        {!loading && section === 'alumnos' && (
          <StudentsPanel
            query={query}
            setQuery={setQuery}
            alumnos={filtered}
            selected={selected}
            setSelectedId={setSelectedId}
            canFullAdmin={canFullAdmin}
            canManageContent={canManageContent}
            reload={reloadAll}
            setMsg={setMsg}
          />
        )}

        {!loading && section === 'acciones' && canManageContent && (
          <ActionsPanel
            canManageContent={canManageContent}
            selected={selected}
            alumnos={alumnos}
            reload={reloadAll}
            setMsg={setMsg}
            actionType={actionType}
            setActionType={setActionType}
          />
        )}

        {section === 'cupos' && canFullAdmin && (
          <CuposPanel cupos={cupos} setCupos={setCupos} onSave={saveCuposLocal} />
        )}

        {section === 'config' && canFullAdmin && <ConfigPanel />}
      </div>
    </AppLayout>
  )
}

function DashboardPanel({ setSection, adminActivity, canFullAdmin, canManageContent, setActionType }) {
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
            <ActionButton icon="➕" label="Crear alumno" onClick={() => setSection('alumnos')} />
          )}

          {canManageContent && (
            <>
              <ActionButton icon="📝" label="Observación" onClick={() => goAction('Nota')} />
              <ActionButton icon="🏅" label="Insignia" onClick={() => goAction('Insignia')} />
              <ActionButton icon="🎉" label="Participación" onClick={() => goAction('Evento')} />
            </>
          )}
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">Actividad reciente</p>

        <div className="space-y-3 mt-3">
          {adminActivity.length > 0 ? (
            adminActivity.map(item => (
              <div key={item.id} className="rounded-2xl bg-black/25 border border-white/5 p-3">
                <p className="text-white text-sm font-semibold">{item.titulo}</p>
                <p className="text-white/35 text-xs">
                  {item.tipo} · {formatDate(item.fecha)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
              <p className="text-white/45 text-sm">Todavía no hay actividad real cargada.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function StudentsPanel({ query, setQuery, alumnos, selected, setSelectedId, canFullAdmin, canManageContent, reload, setMsg }) {
  const [tab, setTab] = useState('info')

  const tabs = [
    { id: 'info', label: 'info', show: true },
    { id: 'editar', label: 'editar', show: canFullAdmin },
    { id: 'grupos', label: 'grupos', show: canFullAdmin },
    { id: 'observaciones', label: 'observaciones', show: canManageContent },
    { id: 'insignias', label: 'insignias', show: canManageContent },
    { id: 'participaciones', label: 'participaciones', show: canManageContent },
    { id: 'servicios', label: 'servicios', show: canFullAdmin },
    { id: 'actividad', label: 'actividad', show: true },
  ].filter(t => t.show)

  useEffect(() => {
    if (!tabs.some(t => t.id === tab)) setTab('info')
  }, [canFullAdmin, canManageContent])

  return (
    <div className="space-y-4">
      {canFullAdmin && <CreateAlumnoForm reload={reload} setMsg={setMsg} />}

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar alumno por nombre, cédula o grupo..."
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />

      {alumnos.length === 0 && (
        <section className={`${panel} p-4`}>
          <p className="text-white font-semibold">Todavía no hay alumnos creados</p>
          <p className="text-white/40 text-sm mt-1">
            {canFullAdmin
              ? 'Creá el primer alumno desde el formulario de arriba.'
              : 'Todavía no hay alumnos disponibles.'}
          </p>
        </section>
      )}

      {alumnos.length > 0 && selected && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {alumnos.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`shrink-0 px-4 py-3 rounded-2xl border text-left min-w-[190px] ${
                  selected?.id === a.id ? 'bg-pr-gold text-black border-pr-gold' : 'bg-white/[0.035] border-white/10 text-white'
                }`}
              >
                <p className="font-semibold text-sm">{a.nombre} {a.verificado ? '✓' : ''}</p>
                <p className={`text-xs ${selected?.id === a.id ? 'text-black/60' : 'text-white/35'}`}>
                  {a.estado} · {a.ultimoIngreso ? formatDate(a.ultimoIngreso) : 'Sin ingreso registrado'}
                </p>
              </button>
            ))}
          </div>

          <section className={`${panel} overflow-hidden`}>
            <div className="p-4 border-b border-white/5">
              <p className="section-label">Perfil administrativo</p>
              <h2 className="font-display text-2xl text-white mt-1">
                {selected.nombre} {selected.verificado && <span className="text-sky-400">✓</span>}
              </h2>
              <p className="text-white/35 text-xs">CI {selected.documento} · {selected.estado}</p>
            </div>

            <div className="flex overflow-x-auto border-b border-white/5">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-xs uppercase tracking-wider ${
                    tab === t.id ? 'text-pr-gold border-b border-pr-gold' : 'text-white/35'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === 'info' && <InfoTab alumno={selected} canFullAdmin={canFullAdmin} />}
              {tab === 'editar' && canFullAdmin && <EditAlumnoTab alumno={selected} canFullAdmin={canFullAdmin} reload={reload} setMsg={setMsg} />}
              {tab === 'grupos' && canFullAdmin && <GroupsTab alumno={selected} canFullAdmin={canFullAdmin} reload={reload} setMsg={setMsg} />}
              {tab === 'observaciones' && canManageContent && <ObservationTab alumno={selected} canManageContent={canManageContent} reload={reload} setMsg={setMsg} />}
              {tab === 'insignias' && canManageContent && <BadgeTab alumno={selected} canManageContent={canManageContent} reload={reload} setMsg={setMsg} />}
              {tab === 'participaciones' && canManageContent && <ParticipationTab alumno={selected} canManageContent={canManageContent} reload={reload} setMsg={setMsg} />}
              {tab === 'servicios' && canFullAdmin && <ServicesTab alumno={selected} canFullAdmin={canFullAdmin} reload={reload} setMsg={setMsg} />}
              {tab === 'actividad' && <ActivityTab alumno={selected} />}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function CreateAlumnoForm({ reload, setMsg }) {
  const [form, setForm] = useState(emptyAlumnoForm())
  const [saving, setSaving] = useState(false)

  async function createAlumno() {
    try {
      setSaving(true)
      setMsg('Creando alumno...')

      const documento = String(form.documento || '').trim()
      const pin = String(form.pin || '').trim()

      if (!form.nombre.trim()) throw new Error('Falta el nombre.')
      if (!documento) throw new Error('Falta el documento.')
      if (!pin) throw new Error('Falta el PIN.')

      const payload = {
        id: makeAlumnoId(documento),
        role: 'alumno',
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        documento,
        pin,
        email: form.email.trim(),
        ciudad: form.ciudad.trim(),
        instagram: form.instagram.trim(),
        estado: 'Activo',
        verificado: false,
        prcard_activa: false,
        tracking_activo: false,
        miembro_desde: '2026',
        grupos_info: [],
        estadisticas: { eventos: 0, insignias: 0, notas: 0 },
        foto: '',
        banner: '',
        sobre_mi: 'Mi espacio personal dentro de Punta Rollers.',
        ultimo_ingreso: null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').insert(payload)
      if (error) throw new Error(error.message)

      setForm(emptyAlumnoForm())
      setMsg('Alumno creado correctamente.')
      await reload()
    } catch (error) {
      setMsg(`No se pudo crear: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`${panel} p-4 space-y-3`}>
      <p className="section-label">Crear alumno</p>

      <AdminInput label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} />
      <AdminInput label="Apellido" value={form.apellido} onChange={v => setForm({ ...form, apellido: v })} />
      <AdminInput label="Documento / CI" value={form.documento} onChange={v => setForm({ ...form, documento: v })} />
      <AdminInput label="PIN" value={form.pin} onChange={v => setForm({ ...form, pin: v })} />
      <AdminInput label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
      <AdminInput label="Ciudad" value={form.ciudad} onChange={v => setForm({ ...form, ciudad: v })} />
      <AdminInput label="Instagram" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} />

      <button type="button" disabled={saving} onClick={createAlumno} className="btn-gold w-full disabled:opacity-50">
        {saving ? 'Creando...' : 'Crear alumno'}
      </button>

      <p className="text-white/30 text-xs">
        PRCard y Tracking quedan inactivos por defecto. Los grupos se asignan después desde la pestaña Grupos.
      </p>
    </section>
  )
}

function InfoTab({ alumno, canFullAdmin }) {
  return (
    <div className="space-y-3">
      <Field label="Nombre" value={`${alumno.nombre} ${alumno.apellido || ''}`} />
      <Field label="Documento" value={alumno.documento} />
      {canFullAdmin && <Field label="PIN actual" value={alumno.pin || 'Sin PIN'} />}
      <Field label="Email" value={alumno.email || 'Sin cargar'} />
      <Field label="Instagram" value={alumno.instagram || 'Sin cargar'} />
      <Field label="Ciudad" value={alumno.ciudad || 'Sin cargar'} />
      <Field label="Grupos WhatsApp" value={alumno.gruposInfo?.length ? alumno.gruposInfo.map(g => g.titulo).join(' · ') : 'Sin grupos'} />
      <Field label="Último ingreso" value={alumno.ultimoIngreso ? formatDate(alumno.ultimoIngreso) : 'Sin ingreso registrado'} />
    </div>
  )
}

function EditAlumnoTab({ alumno, canFullAdmin, reload, setMsg }) {
  const [form, setForm] = useState({
    nombre: alumno.nombre || '',
    apellido: alumno.apellido || '',
    documento: alumno.documento || '',
    pin: alumno.pin || '',
    email: alumno.email || '',
    ciudad: alumno.ciudad || '',
    instagram: alumno.instagram || '',
    estado: alumno.estado || 'Activo',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      nombre: alumno.nombre || '',
      apellido: alumno.apellido || '',
      documento: alumno.documento || '',
      pin: alumno.pin || '',
      email: alumno.email || '',
      ciudad: alumno.ciudad || '',
      instagram: alumno.instagram || '',
      estado: alumno.estado || 'Activo',
    })
  }, [alumno.id])

  async function saveAlumno() {
    try {
      setSaving(true)
      setMsg('Guardando alumno...')

      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: form.nombre,
          apellido: form.apellido,
          documento: form.documento,
          pin: form.pin,
          email: form.email,
          ciudad: form.ciudad,
          instagram: form.instagram,
          estado: form.estado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alumno.id)

      if (error) throw new Error(error.message)

      setMsg('Alumno actualizado correctamente.')
      await reload()
    } catch (error) {
      setMsg(`No se pudo actualizar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function deleteAlumno() {
    if (!canFullAdmin) return
    const ok = window.confirm(`¿Eliminar definitivamente a ${alumno.nombre}?`)
    if (!ok) return

    try {
      setMsg('Eliminando alumno...')

      await supabase.from('actividad_pr').delete().eq('alumno_id', alumno.id)

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', alumno.id)

      if (error) throw new Error(error.message)

      setMsg('Alumno eliminado correctamente.')
      await reload()
    } catch (error) {
      setMsg(`No se pudo eliminar: ${error.message}`)
    }
  }

  if (!canFullAdmin) return null

  return (
    <div className="space-y-3">
      <AdminInput label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} />
      <AdminInput label="Apellido" value={form.apellido} onChange={v => setForm({ ...form, apellido: v })} />
      <AdminInput label="Documento" value={form.documento} onChange={v => setForm({ ...form, documento: v })} />
      <AdminInput label="PIN de ingreso" value={form.pin} onChange={v => setForm({ ...form, pin: v })} />
      <AdminInput label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
      <AdminInput label="Ciudad" value={form.ciudad} onChange={v => setForm({ ...form, ciudad: v })} />
      <AdminInput label="Instagram" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} />

      <label className="block">
        <span className="text-white/40 text-xs">Estado</span>
        <select
          value={form.estado}
          onChange={e => setForm({ ...form, estado: e.target.value })}
          className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
        >
          <option value="Activo">Activo</option>
          <option value="Pausado">Pausado</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </label>

      <button disabled={saving} onClick={saveAlumno} className="btn-gold w-full disabled:opacity-50">
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      <button onClick={deleteAlumno} className="w-full rounded-2xl border border-red-500/25 bg-red-500/10 py-4 text-red-200 text-sm font-bold">
        Eliminar alumno
      </button>
    </div>
  )
}

function GroupsTab({ alumno, canFullAdmin, reload, setMsg }) {
  const [groups, setGroups] = useState(alumno.gruposInfo?.length ? alumno.gruposInfo : [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setGroups(alumno.gruposInfo?.length ? alumno.gruposInfo : [])
  }, [alumno.id])

  function addGroup() {
    setGroups([...groups, { titulo: '', link: '' }])
  }

  function updateGroup(index, field, value) {
    setGroups(groups.map((g, i) => i === index ? { ...g, [field]: value } : g))
  }

  function removeGroup(index) {
    setGroups(groups.filter((_, i) => i !== index))
  }

  async function saveGroups() {
    try {
      setSaving(true)
      setMsg('Guardando grupos...')

      const cleanGroups = groups
        .map(g => ({
          titulo: String(g.titulo || '').trim(),
          link: String(g.link || '').trim(),
        }))
        .filter(g => g.titulo)

      const { error } = await supabase
        .from('profiles')
        .update({
          grupos_info: cleanGroups,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alumno.id)

      if (error) throw new Error(error.message)

      setMsg('Grupos actualizados correctamente.')
      await reload()
    } catch (error) {
      setMsg(`No se pudieron guardar los grupos: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!canFullAdmin) return null

  return (
    <div className="space-y-3">
      <p className="text-white/45 text-sm">
        Cargá uno o más grupos. El alumno verá el título y el botón para abrir WhatsApp.
      </p>

      {groups.map((group, index) => (
        <div key={index} className="rounded-2xl bg-black/25 border border-white/5 p-3 space-y-2">
          <AdminInput label="Título del grupo" value={group.titulo} onChange={v => updateGroup(index, 'titulo', v)} placeholder="Ej: Miércoles principiantes" />
          <AdminInput label="Link de WhatsApp" value={group.link} onChange={v => updateGroup(index, 'link', v)} placeholder="https://chat.whatsapp.com/..." />
          <button onClick={() => removeGroup(index)} className="text-red-300 text-xs">Eliminar grupo</button>
        </div>
      ))}

      <button onClick={addGroup} className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 text-white text-sm">
        + Agregar grupo
      </button>

      <button disabled={saving} onClick={saveGroups} className="btn-gold w-full disabled:opacity-50">
        {saving ? 'Guardando...' : 'Guardar grupos'}
      </button>
    </div>
  )
}

function ObservationTab({ alumno, canManageContent, reload, setMsg }) {
  return <ActivityCreateTab alumno={alumno} tipo="Nota" title="Nueva observación" label="Guardar observación" canManageContent={canManageContent} reload={reload} setMsg={setMsg} />
}

function BadgeTab({ alumno, canManageContent, reload, setMsg }) {
  return <ActivityCreateTab alumno={alumno} tipo="Insignia" title="Otorgar insignia" label="Otorgar insignia" canManageContent={canManageContent} reload={reload} setMsg={setMsg} />
}

function ParticipationTab({ alumno, canManageContent, reload, setMsg }) {
  return <ActivityCreateTab alumno={alumno} tipo="Evento" title="Registrar participación" label="Registrar participación" canManageContent={canManageContent} reload={reload} setMsg={setMsg} />
}

function ActivityCreateTab({ alumno, tipo, title, label, canManageContent, reload, setMsg }) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveItem() {
    if (!canManageContent) return

    try {
      setSaving(true)
      setMsg('Guardando actividad...')

      if (!titulo.trim()) throw new Error('Falta el título.')

      const { error } = await supabase
        .from('actividad_pr')
        .insert({
          alumno_id: alumno.id,
          tipo,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fecha: new Date().toISOString(),
        })

      if (error) throw new Error(error.message)

      const key = tipo === 'Nota' ? 'notas' : tipo === 'Insignia' ? 'insignias' : 'eventos'
      const currentStats = alumno.estadisticas || { eventos: 0, insignias: 0, notas: 0 }
      const newStats = {
        ...currentStats,
        [key]: Number(currentStats[key] || 0) + 1,
      }

      const { error: statsError } = await supabase
        .from('profiles')
        .update({
          estadisticas: newStats,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alumno.id)

      if (statsError) throw new Error(statsError.message)

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

  if (!canManageContent) return null

  return (
    <div className="space-y-3">
      <p className="section-label">{title}</p>

      <AdminInput label="Título" value={titulo} onChange={setTitulo} />
      <label className="block">
        <span className="text-white/40 text-xs">Descripción</span>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
          rows="4"
        />
      </label>

      <button disabled={saving} onClick={saveItem} className="btn-gold w-full disabled:opacity-50">
        {saving ? 'Guardando...' : label}
      </button>

      <AlumnoActivityList alumnoId={alumno.id} tipo={tipo} />
    </div>
  )
}

function AlumnoActivityList({ alumnoId, tipo }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function load() {
      let query = supabase
        .from('actividad_pr')
        .select('*')
        .eq('alumno_id', alumnoId)
        .order('fecha', { ascending: false })

      if (tipo) query = query.eq('tipo', tipo)

      const { data, error } = await query
      if (!error) setItems(data || [])
    }

    load()
  }, [alumnoId, tipo])

  return (
    <div className="space-y-2 pt-2">
      <p className="section-label">Registros actuales</p>
      <List items={items.map(i => ({ title: i.titulo, desc: `${i.tipo} · ${formatDate(i.fecha)} · ${i.descripcion || ''}` }))} />
    </div>
  )
}

function ServicesTab({ alumno, canFullAdmin, reload, setMsg }) {
  async function toggleField(field, value) {
    if (!canFullAdmin) return

    try {
      setMsg('Actualizando servicio...')

      const { error } = await supabase
        .from('profiles')
        .update({
          [field]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alumno.id)

      if (error) throw new Error(error.message)

      setMsg('Servicio actualizado.')
      await reload()
    } catch (error) {
      setMsg(`No se pudo actualizar: ${error.message}`)
    }
  }

  if (!canFullAdmin) return null

  return (
    <div className="space-y-3">
      <ToggleRow label="PR Card" active={alumno.prcardActiva} disabled={!canFullAdmin} onClick={() => toggleField('prcard_activa', !alumno.prcardActiva)} />
      <ToggleRow label="PR Tracking" active={alumno.trackingActivo} disabled={!canFullAdmin} onClick={() => toggleField('tracking_activo', !alumno.trackingActivo)} />
      <ToggleRow label="Perfil verificado" active={alumno.verificado} disabled={!canFullAdmin} onClick={() => toggleField('verificado', !alumno.verificado)} />

      <p className="text-white/30 text-xs">
        Estos cambios se reflejan en Perfil, Home, PRCard y servicios del alumno.
      </p>
    </div>
  )
}

function ActivityTab({ alumno }) {
  return <AlumnoActivityList alumnoId={alumno.id} tipo="" />
}

function ActionsPanel({ canManageContent, selected, alumnos, reload, setMsg, actionType, setActionType }) {
  const [selectedStudents, setSelectedStudents] = useState(selected?.id ? [selected.id] : [])
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  const allSelected = alumnos.length > 0 && selectedStudents.length === alumnos.length

  function toggleAll() {
    if (allSelected) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(alumnos.map(a => a.id))
    }
  }

  function toggleStudent(id, checked) {
    if (checked) {
      setSelectedStudents([...new Set([...selectedStudents, id])])
    } else {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id))
    }
  }

  async function saveAction() {
    if (!canManageContent) return

    try {
      setSaving(true)
      setMsg('Guardando acción...')

      if (!titulo.trim()) throw new Error('Falta el título.')
      if (selectedStudents.length === 0) throw new Error('Seleccioná al menos un alumno.')

      const rows = selectedStudents.map(id => ({
        alumno_id: id,
        tipo: actionType,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: new Date().toISOString(),
      }))

      const { error } = await supabase.from('actividad_pr').insert(rows)
      if (error) throw new Error(error.message)

      const key = actionType === 'Nota' ? 'notas' : actionType === 'Insignia' ? 'insignias' : 'eventos'

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, estadisticas')
        .in('id', selectedStudents)

      if (profileError) throw new Error(profileError.message)

      for (const profile of profiles || []) {
        const currentStats = profile.estadisticas || { eventos: 0, insignias: 0, notas: 0 }
        const newStats = {
          ...currentStats,
          [key]: Number(currentStats[key] || 0) + 1,
        }

        await supabase
          .from('profiles')
          .update({
            estadisticas: newStats,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
      }

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
            onChange={e => setActionType(e.target.value)}
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
            onChange={e => setDescripcion(e.target.value)}
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
          {alumnos.map(a => (
            <label key={a.id} className="flex items-center gap-3 rounded-2xl bg-black/25 border border-white/5 p-3">
              <input
                type="checkbox"
                checked={selectedStudents.includes(a.id)}
                onChange={e => toggleStudent(a.id, e.target.checked)}
              />
              <span className="text-white text-sm">{a.nombre}</span>
            </label>
          ))}
        </div>
      </section>

      <button disabled={saving || !canManageContent} onClick={saveAction} className="btn-gold w-full disabled:opacity-50">
        {saving ? 'Guardando...' : `Guardar ${actionType}`}
      </button>
    </div>
  )
}

function CuposPanel({ cupos, setCupos, onSave }) {
  return (
    <section className={`${panel} p-4 space-y-3`}>
      <p className="section-label">Cupos manuales de la Home</p>
      <CupoInput label="Miércoles · Principiantes" value={cupos.miercoles.principiantes} onChange={v => setCupos({ ...cupos, miercoles: { ...cupos.miercoles, principiantes: v } })} />
      <CupoInput label="Miércoles · Avanzado" value={cupos.miercoles.avanzado} onChange={v => setCupos({ ...cupos, miercoles: { ...cupos.miercoles, avanzado: v } })} />
      <CupoInput label="Sábado · Kids" value={cupos.sabado.kids} onChange={v => setCupos({ ...cupos, sabado: { ...cupos.sabado, kids: v } })} />
      <CupoInput label="Sábado · Adultos" value={cupos.sabado.adultos} onChange={v => setCupos({ ...cupos, sabado: { ...cupos.sabado, adultos: v } })} />
      <button onClick={onSave} className="btn-gold w-full">Guardar cupos</button>
    </section>
  )
}

function ConfigPanel() {
  return (
    <section className={`${panel} p-4`}>
      <p className="section-label">Config</p>
      <p className="text-white/45 text-sm mt-2">
        Configuración global preparada. Los contactos PR ya se cargan desde Supabase en el perfil del alumno.
      </p>
    </section>
  )
}

function Stat({ label, value, alert }) {
  return (
    <div className={`rounded-3xl p-4 border ${alert ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.035] border-white/10'}`}>
      <p className="text-2xl font-display text-white">{value}</p>
      <p className="text-white/35 text-[10px] uppercase tracking-[0.16em]">{label}</p>
    </div>
  )
}

function Quick({ icon, label, active, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} className={`rounded-2xl p-3 min-w-[70px] text-center border ${active ? 'bg-pr-gold text-black border-pr-gold' : 'bg-white/[0.035] text-white border-white/10'} ${disabled ? 'opacity-30' : ''}`}>
      <p>{icon}</p>
      <p className="text-[10px] font-bold mt-1">{label}</p>
    </button>
  )
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-black/25 border border-white/5 p-4 text-left">
      <p className="text-xl">{icon}</p>
      <p className="text-white text-sm font-semibold mt-2">{label}</p>
    </button>
  )
}

function Field({ label, value }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-3">
      <p className="text-white/30 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-white/75 text-sm mt-1 break-words">{value}</p>
    </div>
  )
}

function List({ items }) {
  return (
    <div className="space-y-2">
      {items.length ? (
        items.map((item, idx) => (
          <div key={idx} className="rounded-2xl bg-black/25 border border-white/5 p-3">
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

function ToggleRow({ label, active, disabled, onClick }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/25 border border-white/5 p-4">
      <div>
        <p className="text-white font-semibold">{label}</p>
        <p className={active ? 'text-emerald-400 text-xs' : 'text-red-300 text-xs'}>
          {active ? 'Activo' : 'Inactivo'}
        </p>
      </div>

      <button disabled={disabled} onClick={onClick} className="px-3 py-2 rounded-xl bg-white/5 text-white/70 text-xs disabled:opacity-30">
        Cambiar
      </button>
    </div>
  )
}

function CupoInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-white/40 text-xs">{label}</span>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white" />
    </label>
  )
}

function AdminInput({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="block">
      <span className="text-white/40 text-xs">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
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
