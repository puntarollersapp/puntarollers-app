import { useMemo, useState } from 'react'
import PublicLayout from '../layouts/PublicLayout'
import { getCupos, saveCupos } from '../data/cupos'
import { adminUsuarios, insignias, observaciones, participaciones, profesores } from '../data/mockData'

const tabs = [
  { id: 'dashboard', label: 'Inicio' },
  { id: 'alumnos', label: 'Alumnos' },
  { id: 'observaciones', label: 'Observaciones' },
  { id: 'insignias', label: 'Insignias' },
  { id: 'participaciones', label: 'Participaciones' },
  { id: 'cupos', label: 'Cupos' },
  { id: 'config', label: 'Config.' },
]

const studentTabs = [
  'Información',
  'Observaciones',
  'Insignias',
  'Participaciones',
  'Servicios',
  'Actividad',
]

function fmtDate(date) {
  if (!date) return 'Nunca ingresó'
  return new Date(date).toLocaleString('es-UY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function AdminCard({ children, className = '' }) {
  return <div className={`glass rounded-2xl p-4 ${className}`}>{children}</div>
}

function Pill({ children, active = false, tone = 'gold' }) {
  const colors = {
    gold: ['rgba(201,168,76,.12)', 'rgba(201,168,76,.24)', '#D9C371'],
    green: ['rgba(78,203,139,.12)', 'rgba(78,203,139,.24)', '#76e0ad'],
    red: ['rgba(255,99,99,.10)', 'rgba(255,99,99,.22)', '#ff9a9a'],
    gray: ['rgba(255,255,255,.05)', 'rgba(255,255,255,.08)', 'rgba(216,216,232,.55)'],
  }
  const c = colors[tone] || colors.gold
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: active ? c[0] : colors.gray[0], border: `1px solid ${active ? c[1] : colors.gray[1]}`, color: active ? c[2] : colors.gray[2] }}>
      {children}
    </span>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl p-3 bg-white/5 border border-white/10">
      <span className="text-sm text-white/70">{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 accent-yellow-500" />
    </label>
  )
}

function Avatar({ user }) {
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.22),rgba(255,255,255,.06))', border: '1px solid rgba(201,168,76,.22)', color: '#E7D38A' }}>
      {user.foto_url ? <img src={user.foto_url} alt="" className="w-full h-full object-cover" /> : <span className="font-display font-bold">{initials(user.nombre)}</span>}
    </div>
  )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [students, setStudents] = useState(adminUsuarios)
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(adminUsuarios[0])
  const [activeStudentTab, setActiveStudentTab] = useState('Información')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [cupos, setCupos] = useState(getCupos())
  const [toast, setToast] = useState('')

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim()
    return students.filter(u => {
      const matchSearch = !q || u.nombre.toLowerCase().includes(q) || u.documento.includes(q) || u.email.toLowerCase().includes(q)
      const matchFilter = filter === 'Todos'
        || (filter === 'Nunca ingresaron' && !u.ultimo_acceso)
        || (filter === 'Verificados' && u.verificado)
        || (filter === 'Con PR Card' && u.prcard)
        || (filter === 'Con Tracking' && u.tracking)
        || u.estado === filter
        || u.grupos?.includes(filter)
      return matchSearch && matchFilter
    })
  }, [students, search, filter])

  const stats = useMemo(() => {
    const now = new Date()
    const daysAgo = d => new Date(now.getTime() - d * 86400000)
    const active7 = students.filter(u => u.ultimo_acceso && new Date(u.ultimo_acceso) >= daysAgo(7))
    const active30 = students.filter(u => u.ultimo_acceso && new Date(u.ultimo_acceso) >= daysAgo(30))
    const never = students.filter(u => !u.ultimo_acceso)
    return { active7, active30, never }
  }, [students])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 2200)
  }

  const updateStudent = (id, patch) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
    if (selectedStudent?.id === id) setSelectedStudent(prev => ({ ...prev, ...patch }))
    showToast('Cambios guardados sin borrar otros datos')
  }

  const resetPin = (id) => {
    const newPin = String(Math.floor(1000 + Math.random() * 9000))
    updateStudent(id, { pin: newPin })
    showToast(`PIN nuevo generado: ${newPin}`)
  }

  const createStudent = () => {
    const id = String(Date.now())
    const pin = String(Math.floor(1000 + Math.random() * 9000))
    const newStudent = {
      id,
      nombre: 'Nuevo alumno',
      documento: 'Sin CI',
      email: 'sin@email.com',
      grupos: ['Principiante'],
      estado: 'Activo',
      miembro: 'Nuevo',
      verificado: false,
      prcard: false,
      tracking: false,
      ultimo_acceso: null,
      foto_url: null,
      banner_url: null,
      pin,
    }
    setStudents(prev => [newStudent, ...prev])
    setSelectedStudent(newStudent)
    setActiveTab('alumnos')
    showToast(`Alumno creado. PIN: ${pin}`)
  }

  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const bulkAction = (label) => {
    if (!selectedIds.length) return showToast('Seleccioná al menos un alumno')
    showToast(`${label} aplicado a ${selectedIds.length} alumno/s`)
  }

  const updateCup = (day, key, value) => {
    const newData = { ...cupos, [day]: { ...cupos[day], [key]: Number(value) } }
    setCupos(newData)
    saveCupos(newData)
    showToast('Cupos actualizados en la Home')
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-pr-black pb-10">
        {toast && <div className="fixed bottom-5 left-4 right-4 z-[90] glass-dark rounded-2xl p-3 text-center text-sm text-pr-gold border border-pr-gold/20">{toast}</div>}

        <header className="sticky top-0 z-40 glass-dark border-b border-white/5">
          <div className="px-4 py-4">
            <p className="section-label">Panel Administrador</p>
            <h1 className="font-display text-2xl text-white">Punta Rollers</h1>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                  style={{ background: activeTab === t.id ? '#C9A84C' : 'rgba(255,255,255,.05)', color: activeTab === t.id ? '#050508' : 'rgba(216,216,232,.55)' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <AdminCard>
                <p className="text-white/55 text-sm">Hola Claudio 👋</p>
                <h2 className="font-display text-2xl text-white mt-1">Centro de control PR</h2>
                <p className="text-sm text-white/45 mt-2">Gestión rápida, mobile first y sin tocar código.</p>
              </AdminCard>

              <div className="grid grid-cols-2 gap-3">
                <Stat title="Alumnos" value={students.length} />
                <Stat title="Activos 7 días" value={stats.active7.length} tone="green" />
                <Stat title="Activos 30 días" value={stats.active30.length} tone="gold" />
                <Stat title="Nunca ingresaron" value={stats.never.length} tone="red" />
              </div>

              <AdminCard>
                <p className="section-label mb-3">Acciones rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  <Quick label="Crear alumno" onClick={createStudent} />
                  <Quick label="Crear observación" onClick={() => setActiveTab('observaciones')} />
                  <Quick label="Otorgar insignia" onClick={() => setActiveTab('insignias')} />
                  <Quick label="Registrar participación" onClick={() => setActiveTab('participaciones')} />
                  <Quick label="Crear aviso" onClick={() => setActiveTab('config')} />
                  <Quick label="Editar cupos" onClick={() => setActiveTab('cupos')} />
                </div>
              </AdminCard>

              <AdminCard>
                <p className="section-label mb-3">Actividad de plataforma</p>
                <MiniList title="Activos últimos 7 días" users={stats.active7} />
                <MiniList title="Nunca ingresaron" users={stats.never} />
              </AdminCard>
            </div>
          )}

          {activeTab === 'alumnos' && (
            <div className="space-y-4">
              <AdminCard>
                <div className="flex gap-2">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno, CI o email..." className="input-pr flex-1" />
                  <button onClick={createStudent} className="btn-gold px-4 py-2 text-sm">+</button>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {['Todos','Activo','Pausado','Inactivo','Nunca ingresaron','Verificados','Con PR Card','Con Tracking','Racing','Parada 2','Pista Cerrada','Principiante'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap" style={{ background: filter === f ? 'rgba(201,168,76,.16)' : 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: filter === f ? '#D9C371' : 'rgba(216,216,232,.5)' }}>{f}</button>
                  ))}
                </div>
              </AdminCard>

              <AdminCard>
                <p className="section-label mb-3">Acciones masivas ({selectedIds.length} seleccionados)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Quick label="Otorgar insignia" onClick={() => bulkAction('Insignia')} />
                  <Quick label="Registrar participación" onClick={() => bulkAction('Participación')} />
                  <Quick label="Enviar aviso" onClick={() => bulkAction('Aviso')} />
                  <Quick label="Asignar grupo" onClick={() => bulkAction('Grupo')} />
                </div>
              </AdminCard>

              <div className="space-y-3">
                {filteredStudents.map(u => (
                  <StudentRow key={u.id} user={u} checked={selectedIds.includes(u.id)} onCheck={() => toggleSelected(u.id)} onOpen={() => { setSelectedStudent(u); setActiveStudentTab('Información') }} />
                ))}
              </div>

              {selectedStudent && <StudentAdminPanel user={selectedStudent} tab={activeStudentTab} setTab={setActiveStudentTab} updateStudent={updateStudent} resetPin={resetPin} />}
            </div>
          )}

          {activeTab === 'observaciones' && <ObservacionesAdmin students={students} showToast={showToast} />}
          {activeTab === 'insignias' && <InsigniasAdmin students={students} showToast={showToast} />}
          {activeTab === 'participaciones' && <ParticipacionesAdmin students={students} showToast={showToast} />}
          {activeTab === 'cupos' && <CuposAdmin cupos={cupos} updateCup={updateCup} />}
          {activeTab === 'config' && <ConfigAdmin showToast={showToast} />}
        </main>
      </div>
    </PublicLayout>
  )
}

function Stat({ title, value, tone = 'gold' }) {
  const color = tone === 'green' ? '#76e0ad' : tone === 'red' ? '#ff9a9a' : '#D9C371'
  return <AdminCard className="text-center"><p className="font-display text-3xl font-bold" style={{ color }}>{value}</p><p className="section-label mt-1">{title}</p></AdminCard>
}

function Quick({ label, onClick }) {
  return <button onClick={onClick} className="rounded-xl px-3 py-3 text-sm font-semibold bg-white/5 border border-white/10 text-white/65 text-left active:scale-[.98]">{label}</button>
}

function MiniList({ title, users }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-sm text-white font-semibold">{title}</p>
      <div className="mt-2 space-y-1">
        {users.slice(0, 5).map(u => <p key={u.id} className="text-xs text-white/45">• {u.nombre} <span className="text-white/25">{fmtDate(u.ultimo_acceso)}</span></p>)}
        {!users.length && <p className="text-xs text-white/30">Sin registros.</p>}
      </div>
    </div>
  )
}

function StudentRow({ user, checked, onCheck, onOpen }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={checked} onChange={onCheck} className="w-5 h-5 accent-yellow-500" />
        <Avatar user={user} />
        <button onClick={onOpen} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2"><p className="font-semibold text-white truncate">{user.nombre}</p>{user.verificado && <span className="text-sky-400">✓</span>}</div>
          <p className="text-xs text-white/38 truncate">{user.grupos?.join(' · ')} · {fmtDate(user.ultimo_acceso)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill active={user.estado === 'Activo'} tone={user.estado === 'Inactivo' ? 'red' : 'green'}>{user.estado}</Pill>
            <Pill active={user.prcard}>PR Card</Pill>
            <Pill active={user.tracking} tone="green">Tracking</Pill>
          </div>
        </button>
      </div>
    </div>
  )
}

function StudentAdminPanel({ user, tab, setTab, updateStudent, resetPin }) {
  return (
    <AdminCard>
      <div className="flex items-center gap-3 mb-3">
        <Avatar user={user} />
        <div>
          <p className="font-display text-xl text-white">{user.nombre} {user.verificado && <span className="text-sky-400">✓</span>}</p>
          <p className="text-xs text-white/40">CI {user.documento} · PIN {user.pin}</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {studentTabs.map(t => <button key={t} onClick={() => setTab(t)} className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ background: tab === t ? '#C9A84C' : 'rgba(255,255,255,.05)', color: tab === t ? '#050508' : 'rgba(216,216,232,.55)' }}>{t}</button>)}
      </div>

      {tab === 'Información' && <div className="space-y-3">
        <input className="input-pr" value={user.nombre} onChange={e => updateStudent(user.id, { nombre: e.target.value })} />
        <input className="input-pr" value={user.email} onChange={e => updateStudent(user.id, { email: e.target.value })} />
        <input className="input-pr" value={user.grupos?.join(', ')} onChange={e => updateStudent(user.id, { grupos: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} />
        <select className="input-pr" value={user.estado} onChange={e => updateStudent(user.id, { estado: e.target.value })}>
          <option>Activo</option><option>Pausado</option><option>Inactivo</option>
        </select>
        <ToggleRow label="Perfil verificado" checked={user.verificado} onChange={v => updateStudent(user.id, { verificado: v })} />
        <button onClick={() => resetPin(user.id)} className="btn-gold w-full">Resetear PIN</button>
      </div>}

      {tab === 'Observaciones' && <div className="space-y-3">
        {observaciones.map(o => <div key={o.id} className="rounded-xl p-3 bg-white/5 border border-white/10"><p className="text-sm font-semibold text-white">{o.titulo}</p><p className="text-xs text-white/40">{o.tipo} · {o.fecha}</p><p className="text-sm text-white/55 mt-1">{o.descripcion}</p></div>)}
        <button className="btn-gold w-full">Nueva observación</button>
      </div>}

      {tab === 'Insignias' && <div className="space-y-2">
        {insignias.filter(i => i.desbloqueada).map(i => <div key={i.id} className="rounded-xl p-3 bg-white/5 border border-white/10"><p className="text-sm font-semibold text-white">🏅 {i.nombre}</p><p className="text-xs text-white/40">{i.descripcion}</p></div>)}
        <button className="btn-gold w-full">Otorgar insignia</button>
      </div>}

      {tab === 'Participaciones' && <div className="space-y-2">
        {participaciones.map(p => <div key={p.id} className="rounded-xl p-3 bg-white/5 border border-white/10"><p className="text-sm font-semibold text-white">🎉 {p.nombre}</p><p className="text-xs text-white/40">{p.fecha}</p></div>)}
        <button className="btn-gold w-full">Registrar participación</button>
      </div>}

      {tab === 'Servicios' && <div className="space-y-3">
        <ToggleRow label="PR Card activa" checked={user.prcard} onChange={v => updateStudent(user.id, { prcard: v })} />
        <ToggleRow label="PR Tracking activo" checked={user.tracking} onChange={v => updateStudent(user.id, { tracking: v })} />
      </div>}

      {tab === 'Actividad' && <div className="space-y-2 text-sm text-white/55">
        <p>Último ingreso: {fmtDate(user.ultimo_acceso)}</p>
        <p>Historial de cambios visible solo para Admin.</p>
        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-xs text-white/40">Claudio activó PR Card · David otorgó insignia · Alumno actualizó Instagram</div>
      </div>}
    </AdminCard>
  )
}

function ObservacionesAdmin({ students, showToast }) {
  return <AdminCard><p className="section-label mb-3">Crear observación</p><FormSelect students={students} /><input className="input-pr mt-3" placeholder="Título: Prueba 6K" /><textarea className="input-pr mt-3 min-h-[120px]" placeholder="Descripción / observación del entrenador" /><input type="file" className="mt-3 text-xs text-white/45" /><button onClick={() => showToast('Observación creada para el alumno seleccionado')} className="btn-gold w-full mt-4">Guardar observación</button></AdminCard>
}
function InsigniasAdmin({ students, showToast }) {
  return <div className="space-y-4"><AdminCard><p className="section-label mb-3">Otorgar insignia</p><FormSelect students={students} /><select className="input-pr mt-3">{insignias.map(i => <option key={i.id}>{i.nombre}</option>)}</select><button onClick={() => showToast('Insignia otorgada')} className="btn-gold w-full mt-4">Otorgar</button></AdminCard><AdminCard><p className="section-label mb-3">Crear insignia personalizada</p><input className="input-pr" placeholder="Nombre" /><textarea className="input-pr mt-3" placeholder="Descripción" /><input type="file" className="mt-3 text-xs text-white/45" /><p className="text-xs text-white/35 mt-2">Formato recomendado: PNG 1024x1024, fondo transparente. Todas se mostrarán en tamaño uniforme.</p><button onClick={() => showToast('Insignia cargada al catálogo')} className="btn-gold w-full mt-4">Crear insignia</button></AdminCard></div>
}
function ParticipacionesAdmin({ students, showToast }) {
  return <AdminCard><p className="section-label mb-3">Registrar participación masiva</p><input className="input-pr" placeholder="Nombre: Roller Night 2026" /><textarea className="input-pr mt-3" placeholder="Descripción: Participaste en... junto a la comunidad Punta Rollers." /><div className="mt-3 max-h-56 overflow-auto space-y-2">{students.map(s => <label key={s.id} className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" className="accent-yellow-500" /> {s.nombre}</label>)}</div><button onClick={() => showToast('Participación registrada para los alumnos seleccionados')} className="btn-gold w-full mt-4">Registrar participación</button></AdminCard>
}
function FormSelect({ students }) {
  return <select className="input-pr"><option>Seleccionar alumno...</option>{students.map(s => <option key={s.id}>{s.nombre}</option>)}</select>
}
function CuposAdmin({ cupos, updateCup }) {
  return <div className="space-y-4"><CupSection title="Miércoles" data={cupos.miercoles} onChange={(k,v) => updateCup('miercoles', k, v)} /><CupSection title="Sábado" data={cupos.sabado} onChange={(k,v) => updateCup('sabado', k, v)} /></div>
}
function CupSection({ title, data, onChange }) {
  return <AdminCard><p className="font-semibold text-white mb-3">{title}</p>{Object.keys(data).map(key => <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"><span className="capitalize text-sm text-white/60">{key}</span><input type="number" value={data[key]} onChange={e => onChange(key, e.target.value)} className="input-pr w-24 text-center" /></div>)}</AdminCard>
}
function ConfigAdmin({ showToast }) {
  return <div className="space-y-4"><AdminCard><p className="section-label mb-3">Contactos PR</p><input className="input-pr" placeholder="Profe Claudio WhatsApp" /><input className="input-pr mt-3" placeholder="Profe David WhatsApp" /><input className="input-pr mt-3" placeholder="Tesorera Lucía WhatsApp" /><input className="input-pr mt-3" placeholder="Grupo correspondiente" /><button onClick={() => showToast('Contactos PR actualizados')} className="btn-gold w-full mt-4">Guardar contactos</button></AdminCard><AdminCard><p className="section-label mb-3">Clases personalizadas</p><select className="input-pr"><option>Próximamente</option><option>Activo</option></select><input className="input-pr mt-3" placeholder="Link Shoform" /><button onClick={() => showToast('Configuración guardada')} className="btn-gold w-full mt-4">Guardar</button></AdminCard></div>
}
