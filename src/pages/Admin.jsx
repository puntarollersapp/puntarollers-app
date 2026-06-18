import { useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { alumnos, insignias, observaciones, participaciones, contactosPR, actividad } from '../data/mockData'
import { getCupos, saveCupos } from '../data/cupos'

const panel = 'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

export default function Admin() {
  const { user, logout } = useAuth()
  const [section, setSection] = useState('dashboard')
  const [selectedId, setSelectedId] = useState(alumnos[0]?.id)
  const [query, setQuery] = useState('')
  const [cupos, setCupos] = useState(getCupos())

  const selected = alumnos.find(a => a.id === selectedId) || alumnos[0]
  const filtered = alumnos.filter(a => `${a.nombre} ${a.documento} ${a.grupos?.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  const active7 = alumnos.filter(a => !String(a.ultimoIngreso).includes('Nunca')).length
  const never = alumnos.filter(a => String(a.ultimoIngreso).includes('Nunca'))

  const canFullAdmin = user?.role === 'admin'

  const saveCuposLocal = () => {
    saveCupos(cupos)
    alert('Cupos actualizados. La Home toma estos valores manuales.')
  }

  return (
    <AppLayout title="Panel Admin">
      <div className="px-4 py-5 space-y-5 animate-page-enter">
        <section className={`${panel} p-5 bg-gradient-to-br from-pr-gold/10 to-white/[0.025]`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">PuntaRollers.app</p>
              <h1 className="font-display text-3xl text-white mt-1">Hola, {user?.nombre || 'Claudio'}</h1>
              <p className="text-white/40 text-xs mt-1">Panel mobile first para gestionar alumnos, evolución y pertenencia.</p>
            </div>
            <button onClick={logout} className="text-white/35 text-xs">Salir</button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Alumnos" value={alumnos.length} />
          <Stat label="Activos 7 días" value={active7} />
          <Stat label="Nunca ingresaron" value={never.length} alert />
          <Stat label="Cumpleaños mes" value="3" />
        </div>

        <section className="grid grid-cols-5 gap-2 overflow-x-auto pb-1">
          <Quick active={section === 'dashboard'} onClick={() => setSection('dashboard')} icon="📊" label="Inicio" />
          <Quick active={section === 'alumnos'} onClick={() => setSection('alumnos')} icon="👥" label="Alumnos" />
          <Quick active={section === 'acciones'} onClick={() => setSection('acciones')} icon="⚡" label="Acciones" />
          <Quick active={section === 'cupos'} onClick={() => setSection('cupos')} icon="🟢" label="Cupos" disabled={!canFullAdmin} />
          <Quick active={section === 'config'} onClick={() => setSection('config')} icon="⚙️" label="Config" disabled={!canFullAdmin} />
        </section>

        {section === 'dashboard' && <DashboardPanel setSection={setSection} never={never} />}
        {section === 'alumnos' && <StudentsPanel query={query} setQuery={setQuery} alumnos={filtered} selected={selected} setSelectedId={setSelectedId} canFullAdmin={canFullAdmin} />}
        {section === 'acciones' && <ActionsPanel canFullAdmin={canFullAdmin} selected={selected} />}
        {section === 'cupos' && canFullAdmin && <CuposPanel cupos={cupos} setCupos={setCupos} onSave={saveCuposLocal} />}
        {section === 'config' && canFullAdmin && <ConfigPanel />}
      </div>
    </AppLayout>
  )
}

function DashboardPanel({ setSection, never }) {
  return (
    <div className="space-y-4">
      <section className={`${panel} p-4`}>
        <p className="section-label">Acciones rápidas</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <ActionButton icon="➕" label="Crear alumno" onClick={() => setSection('alumnos')} />
          <ActionButton icon="📝" label="Observación" onClick={() => setSection('acciones')} />
          <ActionButton icon="🏅" label="Insignia" onClick={() => setSection('acciones')} />
          <ActionButton icon="🎉" label="Participación" onClick={() => setSection('acciones')} />
        </div>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">Actividad reciente</p>
        <div className="space-y-3 mt-3">
          {actividad.slice(0, 4).map(item => <div key={item.id} className="rounded-2xl bg-black/25 border border-white/5 p-3"><p className="text-white text-sm font-semibold">{item.nombre}</p><p className="text-white/35 text-xs">{item.fecha} · {item.hora} · {item.origen}</p></div>)}
        </div>
      </section>

      {never.length > 0 && (
        <section className="rounded-3xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-red-200 font-semibold">Usuarios que nunca ingresaron</p>
          <p className="text-red-100/50 text-xs mt-1">{never.map(n => n.nombre).join(', ')}</p>
        </section>
      )}
    </div>
  )
}

function StudentsPanel({ query, setQuery, alumnos, selected, setSelectedId, canFullAdmin }) {
  const [tab, setTab] = useState('info')
  return (
    <div className="space-y-4">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar alumno por nombre, cédula o grupo..." className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {alumnos.map(a => <button key={a.id} onClick={() => setSelectedId(a.id)} className={`shrink-0 px-4 py-3 rounded-2xl border text-left min-w-[190px] ${selected?.id === a.id ? 'bg-pr-gold text-black border-pr-gold' : 'bg-white/[0.035] border-white/10 text-white'}`}><p className="font-semibold text-sm">{a.nombre} {a.verificado ? '✓' : ''}</p><p className={`text-xs ${selected?.id === a.id ? 'text-black/60' : 'text-white/35'}`}>{a.estado} · {a.ultimoIngreso}</p></button>)}
      </div>

      <section className={`${panel} overflow-hidden`}>
        <div className="p-4 border-b border-white/5">
          <p className="section-label">Perfil administrativo</p>
          <h2 className="font-display text-2xl text-white mt-1">{selected.nombre} {selected.verificado && <span className="text-sky-400">✓</span>}</h2>
          <p className="text-white/35 text-xs">CI {selected.documento} · {selected.estado}</p>
        </div>
        <div className="flex overflow-x-auto border-b border-white/5">
          {['info','observaciones','insignias','participaciones','servicios','actividad'].map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs uppercase tracking-wider ${tab === t ? 'text-pr-gold border-b border-pr-gold' : 'text-white/35'}`}>{t}</button>)}
        </div>
        <div className="p-4">
          {tab === 'info' && <InfoTab alumno={selected} canFullAdmin={canFullAdmin} />}
          {tab === 'observaciones' && <ObservationTab alumno={selected} />}
          {tab === 'insignias' && <BadgeTab alumno={selected} />}
          {tab === 'participaciones' && <ParticipationTab alumno={selected} />}
          {tab === 'servicios' && <ServicesTab alumno={selected} canFullAdmin={canFullAdmin} />}
          {tab === 'actividad' && <ActivityTab alumno={selected} />}
        </div>
      </section>
    </div>
  )
}

function InfoTab({ alumno, canFullAdmin }) { return <div className="space-y-3"><Field label="Nombre" value={alumno.nombre} /><Field label="Email" value={alumno.email} /><Field label="Instagram" value={alumno.instagram || 'Sin cargar'} /><Field label="Ciudad" value={alumno.ciudad} /><Field label="Grupos" value={alumno.grupos.join(' · ')} /><Field label="Último ingreso" value={alumno.ultimoIngreso} />{canFullAdmin && <div className="grid grid-cols-2 gap-2 pt-2"><button className="btn-gold">Resetear PIN</button><button className="rounded-xl bg-sky-500/15 border border-sky-400/20 text-sky-200 text-xs font-bold">Verificar perfil</button></div>}<p className="text-white/30 text-xs">Los alumnos pueden editar datos personales, pero no grupos, verificación, PR Card, Tracking, insignias, observaciones ni participaciones.</p></div> }
function ObservationTab({ alumno }) { const items = observaciones.filter(o => o.alumnoId === alumno.id || alumno.id === 'alumno-001'); return <div className="space-y-3"><AdminForm title="Nueva observación" fields="Alumno seleccionado · Tipo · Título · Descripción · Imagen opcional" /><List items={items.map(o => ({ title: o.titulo, desc: `${o.tipo} · ${o.fecha} · ${o.descripcion}` }))} /></div> }
function BadgeTab({ alumno }) { const earned = insignias.filter(i => i.desbloqueada).slice(0, 8); return <div className="space-y-3"><AdminForm title="Otorgar insignia" fields="Seleccionar insignia · Comentario opcional · Guardar" /><div className="grid grid-cols-2 gap-2">{earned.map(i => <div key={i.id} className="rounded-2xl bg-pr-gold/10 border border-pr-gold/20 p-3"><p className="text-white text-sm">{i.emoji} {i.nombre}</p><p className="text-white/35 text-[10px]">Otorgada</p></div>)}</div></div> }
function ParticipationTab({ alumno }) { return <div className="space-y-3"><AdminForm title="Registrar participación" fields="Evento · Fecha · Tipo · Selección masiva disponible" /><List items={participaciones.map(p => ({ title: p.nombre, desc: `${p.tipo} · ${p.fecha}` }))} /></div> }
function ServicesTab({ alumno, canFullAdmin }) { return <div className="space-y-3"><ToggleRow label="PR Card" active={alumno.prcard?.activa} disabled={!canFullAdmin} /><ToggleRow label="PR Tracking" active={alumno.tracking?.activo} disabled={!canFullAdmin} /><ToggleRow label="Perfil verificado" active={alumno.verificado} disabled={!canFullAdmin} /><p className="text-white/30 text-xs">Estos estados los define Claudio manualmente desde administración.</p></div> }
function ActivityTab({ alumno }) { return <List items={[{ title: 'Último ingreso', desc: alumno.ultimoIngreso }, { title: 'Actualizó perfil', desc: 'Historial interno visible solo para administradores.' }, { title: 'PR Card modificada', desc: 'Ejemplo de historial de cambios.' }]} /> }

function ActionsPanel({ canFullAdmin, selected }) {
  const [selectedStudents, setSelectedStudents] = useState([selected?.id])
  return (
    <div className="space-y-4">
      <section className={`${panel} p-4`}>
        <p className="section-label">Acciones masivas</p>
        <p className="text-white font-semibold mt-1">Seleccionar alumnos</p>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {alumnos.map(a => <label key={a.id} className="flex items-center gap-3 rounded-2xl bg-black/25 border border-white/5 p-3"><input type="checkbox" checked={selectedStudents.includes(a.id)} onChange={e => setSelectedStudents(e.target.checked ? [...selectedStudents, a.id] : selectedStudents.filter(id => id !== a.id))} /><span className="text-white text-sm">{a.nombre}</span></label>)}
        </div>
      </section>
      <section className="grid grid-cols-1 gap-3">
        <MassAction icon="🏅" title="Otorgar insignia" detail="Se asigna a todos los alumnos seleccionados." />
        <MassAction icon="🎉" title="Registrar participación" detail="Ideal para Roller Night, Roller Sunset, Travesías y eventos." />
        <MassAction icon="📢" title="Enviar aviso" detail="Aviso para todos, grupo específico o alumnos seleccionados." />
        <MassAction icon="🏷️" title="Asignar grupo" detail="Un alumno puede pertenecer a más de un grupo." disabled={!canFullAdmin} />
      </section>
    </div>
  )
}

function CuposPanel({ cupos, setCupos, onSave }) { return <section className={`${panel} p-4 space-y-3`}><p className="section-label">Cupos manuales de la Home</p><CupoInput label="Miércoles · Principiantes" value={cupos.miercoles.principiantes} onChange={v => setCupos({ ...cupos, miercoles: { ...cupos.miercoles, principiantes: v } })} /><CupoInput label="Miércoles · Avanzado" value={cupos.miercoles.avanzado} onChange={v => setCupos({ ...cupos, miercoles: { ...cupos.miercoles, avanzado: v } })} /><CupoInput label="Sábado · Kids" value={cupos.sabado.kids} onChange={v => setCupos({ ...cupos, sabado: { ...cupos.sabado, kids: v } })} /><CupoInput label="Sábado · Adultos" value={cupos.sabado.adultos} onChange={v => setCupos({ ...cupos, sabado: { ...cupos.sabado, adultos: v } })} /><button onClick={onSave} className="btn-gold w-full">Guardar cupos</button><p className="text-white/30 text-xs">Los cupos no se calculan automáticamente. Claudio los escribe y la Home refleja el valor.</p></section> }
function ConfigPanel() { return <div className="space-y-4"><section className={`${panel} p-4`}><p className="section-label">Contactos PR configurables</p><div className="space-y-2 mt-3">{contactosPR.map(c => <Field key={c.id} label={c.nombre} value={c.valor} />)}</div></section><section className={`${panel} p-4`}><p className="section-label">Fase 2 pausada</p><p className="text-white/55 text-sm mt-2">Pagos integrados, reservas automáticas, cursos online, tienda avanzada y NFC automático quedan fuera de v1.</p></section></div> }

function Stat({ label, value, alert }) { return <div className={`rounded-3xl p-4 border ${alert ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.035] border-white/10'}`}><p className="text-2xl font-display text-white">{value}</p><p className="text-white/35 text-[10px] uppercase tracking-[0.16em]">{label}</p></div> }
function Quick({ icon, label, active, disabled, onClick }) { return <button disabled={disabled} onClick={onClick} className={`rounded-2xl p-3 min-w-[70px] text-center border ${active ? 'bg-pr-gold text-black border-pr-gold' : 'bg-white/[0.035] text-white border-white/10'} ${disabled ? 'opacity-30' : ''}`}><p>{icon}</p><p className="text-[10px] font-bold mt-1">{label}</p></button> }
function ActionButton({ icon, label, onClick }) { return <button onClick={onClick} className="rounded-2xl bg-black/25 border border-white/5 p-4 text-left"><p className="text-xl">{icon}</p><p className="text-white text-sm font-semibold mt-2">{label}</p></button> }
function Field({ label, value }) { return <div className="rounded-2xl bg-black/25 border border-white/5 p-3"><p className="text-white/30 text-[10px] uppercase tracking-wider">{label}</p><p className="text-white/75 text-sm mt-1">{value}</p></div> }
function AdminForm({ title, fields }) { return <div className="rounded-2xl bg-pr-gold/10 border border-pr-gold/20 p-4"><p className="text-pr-gold font-semibold">{title}</p><p className="text-white/45 text-xs mt-1">{fields}</p><button className="mt-3 px-4 py-2 rounded-xl bg-pr-gold text-black text-xs font-bold">Crear / guardar</button></div> }
function List({ items }) { return <div className="space-y-2">{items.map((item, idx) => <div key={idx} className="rounded-2xl bg-black/25 border border-white/5 p-3"><p className="text-white text-sm font-semibold">{item.title}</p><p className="text-white/40 text-xs mt-1">{item.desc}</p></div>)}</div> }
function ToggleRow({ label, active, disabled }) { return <div className="flex items-center justify-between rounded-2xl bg-black/25 border border-white/5 p-4"><div><p className="text-white font-semibold">{label}</p><p className={active ? 'text-emerald-400 text-xs' : 'text-red-300 text-xs'}>{active ? 'Activo' : 'Inactivo'}</p></div><button disabled={disabled} className="px-3 py-2 rounded-xl bg-white/5 text-white/50 text-xs">Cambiar</button></div> }
function MassAction({ icon, title, detail, disabled }) { return <div className={`rounded-3xl border border-white/10 bg-white/[0.035] p-4 ${disabled ? 'opacity-40' : ''}`}><p className="text-2xl">{icon}</p><p className="text-white font-semibold mt-2">{title}</p><p className="text-white/40 text-xs mt-1">{detail}</p></div> }
function CupoInput({ label, value, onChange }) { return <label className="block"><span className="text-white/40 text-xs">{label}</span><input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none" /></label> }
