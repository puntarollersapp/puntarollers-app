import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import './AdminInscripciones2026.css'

const monthKey = (value) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit' }).formatToParts(new Date(value)).filter(x => x.type !== 'literal').map(x => [x.type,x.value]))
  return `${parts.year}-${parts.month}`
}
const currentMonth = () => monthKey(new Date())
const phoneForWhatsApp = (value) => {
  const digits = String(value || '').replace(/\D/g, '').replace(/^00/, '')
  if (!digits) return ''
  return digits.startsWith('598') ? digits : '598' + digits.replace(/^0/, '')
}
const whatsappMessage = (row) => {
  const name = row.nombre_responsable || row.nombre_completo || row.nombre_alumno || '¿cómo estás?'
  if (row.isLoan) return `Hola ${name}, ¿cómo estás? Te contactamos de Punta Rollers 🛼. Recibimos la solicitud de inscripción de ${row.nombre_alumno} y quedó en lista de espera por disponibilidad de patines talle ${row.talle_calzado}. Te avisaremos cuando podamos confirmar un par. Por ahora no necesitás realizar ningún pago. ¡Gracias!`
  if (['pago_verificado','confirmado'].includes(row.estado)) return `Hola ${name}, te contactamos de Punta Rollers 🛼. Tu inscripción a ${modeLabel(row.modalidad).replace(/^.. /, '')} figura confirmada. ¡Te esperamos!`
  return `Hola ${name}, ¿cómo estás? Te contactamos de Punta Rollers 🛼. Recibimos tu inscripción a ${modeLabel(row.modalidad).replace(/^.. /, '')}. Queríamos ayudarte a completar la inscripción y consultar si necesitás información sobre el pago. ¡Quedamos atentos!`
}
const whatsappLink = (row) => {
  const phone = phoneForWhatsApp(row.telefono)
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage(row))}` : ''
}
const statusLabel = {
  pre_reserva: 'Pre-reserva',
  pago_pendiente: 'Pago pendiente',
  pago_verificado: 'Pago verificado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

const modeLabel = (modalidad) => {
  if (modalidad === 'grupales') return '👥 Grupales'
  if (modalidad === 'personalizadas') return '⭐ Personalizadas'
  if (modalidad === 'kids') return '🌈 PR Kids'
  return modalidad
}

export default function AdminInscripciones2026() {
  const [rows, setRows] = useState([])
  const [loans, setLoans] = useState([])
  const [period, setPeriod] = useState('actual')
  const [type, setType] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('todas')
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [updatingLoan, setUpdatingLoan] = useState('')
  const [personalizadasAbiertas, setPersonalizadasAbiertas] = useState(true)
  const [toggleLoading, setToggleLoading] = useState(true)

  const loadRegistrationStatus = async () => {
    setToggleLoading(true)
    const { data, error: statusError } = await supabase.rpc('estado_inscripciones_2026')
    if (statusError) setError(statusError.message)
    else setPersonalizadasAbiertas(data?.personalizadas_abiertas !== false)
    setToggleLoading(false)
  }

  const load = async () => {
    setLoading(true)
    setError('')
    const [registrations, skateLoans] = await Promise.all([
      supabase.from('pr_inscripciones_2026').select('*').order('created_at', { ascending: false }),
      supabase.from('pr_prestamo_patines_espera').select('*').order('creado_en', { ascending: false })
    ])
    if (registrations.error || skateLoans.error) setError(registrations.error?.message || skateLoans.error?.message)
    if (!registrations.error) setRows(registrations.data || [])
    if (!skateLoans.error) setLoans(skateLoans.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    loadRegistrationStatus()
  }, [])

  const allRows = useMemo(() => [...rows, ...loans.map(loan => ({
    ...loan, isLoan: true, nombre_completo: loan.nombre_alumno,
    modalidad: loan.tipo === 'kids' ? 'kids' : loan.modalidad,
    created_at: loan.creado_en, estado: loan.estado || 'espera_patines'
  }))].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)), [rows, loans])
  const visible = useMemo(() => allRows.filter(row => {
    if (filter !== 'todas' && row.modalidad !== filter) return false
    if (type === 'patines' && !row.isLoan) return false
    if (type === 'inscripciones' && row.isLoan) return false
    const month = monthKey(row.created_at)
    if (period === 'actual' && month !== currentMonth()) return false
    if (period === 'anteriores' && month === currentMonth()) return false
    const haystack = `${row.nombre_completo || ''} ${row.nombre_responsable || ''} ${row.email || ''} ${row.telefono || ''} ${row.localidad || ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [allRows, filter, query, period, type])

  const stats = useMemo(() => ({
    total: allRows.length,
    prestamo: loans.length,
    actuales: allRows.filter(r => monthKey(r.created_at) === currentMonth()).length,
    grupales: rows.filter(r => r.modalidad === 'grupales').length,
    personalizadas: rows.filter(r => r.modalidad === 'personalizadas').length,
    kids: rows.filter(r => r.modalidad === 'kids').length,
    confirmadas: rows.filter(r => ['pago_verificado','confirmado'].includes(r.estado)).length,
  }), [rows, loans, allRows])

  const togglePersonalizadas = async () => {
    const nextValue = !personalizadasAbiertas
    const action = nextValue ? 'ABRIR' : 'PAUSAR'
    const confirmed = window.confirm(`${action} las nuevas inscripciones de Clases Personalizadas?`)
    if (!confirmed) return

    setToggleLoading(true)
    setError('')
    const { data, error: toggleError } = await supabase.rpc('set_personalizadas_abiertas_2026', { p_abiertas: nextValue })
    if (toggleError) setError(toggleError.message)
    else setPersonalizadasAbiertas(data?.personalizadas_abiertas === true)
    setToggleLoading(false)
  }

  const setStatus = async (id, estado) => {
    const { error: updateError } = await supabase
      .from('pr_inscripciones_2026')
      .update({ estado, comprobante_recibido: ['pago_verificado','confirmado'].includes(estado), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (updateError) return setError(updateError.message)
    setRows(prev => prev.map(row => row.id === id ? { ...row, estado, comprobante_recibido: ['pago_verificado','confirmado'].includes(estado) } : row))
  }

  const setLoanStatus = async (id, estado) => {
    setUpdatingLoan(id)
    setError('')
    const { data, error: updateError } = await supabase.from('pr_prestamo_patines_espera').update({ estado }).eq('id', id).select('id,estado').single()
    if (updateError || !data) setError(updateError?.message || 'No pudimos actualizar la solicitud.')
    else setLoans(prev => prev.map(row => row.id === id ? { ...row, estado: data.estado } : row))
    setUpdatingLoan('')
  }

  const deleteRegistration = async (row) => {
    const confirmed = window.confirm(`¿Eliminar definitivamente la inscripción de ${row.nombre_completo}?\n\nEsta acción no se puede deshacer.`)
    if (!confirmed) return

    setDeletingId(row.id)
    setError('')
    const { error: deleteError } = await supabase
      .from('pr_inscripciones_2026')
      .delete()
      .eq('id', row.id)

    if (deleteError) {
      setError(deleteError.message)
      setDeletingId('')
      return
    }

    setRows(prev => prev.filter(item => item.id !== row.id))
    setDeletingId('')
  }

  return (
    <main className="pr-admin-reg">
      <header>
        <div><p>ADMIN · PUNTA ROLLERS</p><h1>Inscripciones 2026</h1></div>
        <button onClick={load}>Actualizar</button>
      </header>

      <section className="pr-admin-registration-control">
        <div>
          <span>CLASES PERSONALIZADAS</span>
          <h2>{toggleLoading ? 'Consultando estado…' : personalizadasAbiertas ? 'Inscripciones abiertas' : 'Inscripciones pausadas'}</h2>
          <p>{personalizadasAbiertas ? 'Se están aceptando nuevas preinscripciones.' : 'No pueden entrar nuevas preinscripciones. Podés volver a abrirlas el domingo de tarde.'}</p>
        </div>
        <button className={personalizadasAbiertas ? 'is-open' : 'is-closed'} onClick={togglePersonalizadas} disabled={toggleLoading}>
          {toggleLoading ? 'Procesando…' : personalizadasAbiertas ? 'Pausar inscripciones' : 'Abrir inscripciones'}
        </button>
      </section>

      <section className="pr-admin-stats">
        <article><span>Total histórico</span><strong>{stats.total}</strong></article><article><span>Este mes</span><strong>{stats.actuales}</strong></article><article><span>Esperando patines</span><strong>{stats.prestamo}</strong></article>
        <article><span>Grupales</span><strong>{stats.grupales}</strong></article>
        <article><span>Personalizadas</span><strong>{stats.personalizadas}</strong></article>
        <article><span>PR Kids</span><strong>{stats.kids}</strong></article>
        <article><span>Pagos verificados</span><strong>{stats.confirmadas}</strong></article>
      </section>


      <section className="pr-admin-tools">
        <select value={period} onChange={e => setPeriod(e.target.value)} aria-label="Período"><option value="actual">Este mes · activos a gestionar</option><option value="anteriores">Histórico · meses anteriores</option><option value="todos">Todos los meses</option></select>
        <select value={type} onChange={e => setType(e.target.value)} aria-label="Tipo de solicitud"><option value="todas">Inscripciones y préstamos</option><option value="inscripciones">Inscripciones con pago</option><option value="patines">Lista de espera por patines</option></select>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar alumno, responsable, email, teléfono…" />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="grupales">Grupales</option>
          <option value="personalizadas">Personalizadas</option>
          <option value="kids">PR Kids</option>
        </select>
      </section>

      <p className="pr-admin-empty">El histórico se conserva para consultar pagos y contactos. Los meses anteriores no se mezclan con las gestiones del mes actual. Ningún registro se borra automáticamente.</p>
      {error && <p className="pr-admin-error">{error}</p>}
      {loading ? <p className="pr-admin-empty">Cargando inscripciones…</p> : visible.length === 0 ? <p className="pr-admin-empty">Todavía no hay inscripciones para mostrar.</p> : (
        <section className="pr-admin-list">
          {visible.map(row => {
            const isKids = row.modalidad === 'kids'
            return (
              <article className="pr-admin-row" key={row.id}>
                <div className="pr-admin-row-top">
                  <div>
                    <span className={`pr-admin-mode ${row.modalidad}`}>{modeLabel(row.modalidad)}</span>
                    <h2>{row.nombre_completo}</h2>
                    <p>{isKids ? `${row.edad} años · ${row.nivel}` : `${row.localidad || 'Sin localidad'} · ${row.edad} años · ${row.nivel}`}</p>
                  </div>
                  <time>{new Date(row.created_at).toLocaleString('es-UY')}</time>
                </div>

                <div className="pr-admin-grid">
                  <div>
                    <span>{isKids ? 'Adulto responsable' : 'Contacto'}</span>
                    <b>{isKids ? (row.nombre_responsable || 'No indicado') : row.telefono}</b>
                    <small>{isKids ? `${row.telefono} · ${row.email}` : row.email}</small>
                  </div>
                  <div>
                    <span>Modalidad</span>
                    <b>{isKids ? 'Sábado 19:00–20:00' : row.modalidad === 'grupales' ? row.turno_sabado : '4 clases · $2.900'}</b>
                    <small>{isKids ? 'Pista cerrada · Maldonado' : row.modalidad === 'personalizadas' ? row.objetivo_personalizadas : 'Miércoles 19:30 incluido'}</small>
                  </div>
                  {isKids && (
                    <div>
                      <span>Remera PR Kids</span>
                      <b>{row.quiere_remera ? 'Sí · agregar remera' : 'No por ahora'}</b>
                      <small>{row.quiere_remera ? '$690 · personalizada' : 'Solo mensualidad'}</small>
                    </div>
                  )}
                  <div>
                    <span>Pago</span>
                    <b>{row.isLoan ? `En espera · talle ${row.talle_calzado}` : `${row.metodo_pago || 'Pago'} · ${Number(row.monto).toLocaleString('es-UY')}`}</b>
                    <small>{row.isLoan ? 'No cobrar antes de confirmar disponibilidad' : row.comprobante_recibido ? 'Comprobante recibido' : 'Comprobante pendiente'}</small>
                  </div>
                </div>

                <div className="pr-admin-actions">
                  {!row.isLoan && <select value={row.estado} onChange={e => setStatus(row.id, e.target.value)}>
                    {Object.entries(statusLabel).map(([value,label]) => <option value={value} key={value}>{label}</option>)}
                  </select>}
                  {row.isLoan && <select aria-label="Estado de préstamo de patines" disabled={updatingLoan === row.id} value={row.estado} onChange={e => setLoanStatus(row.id, e.target.value)}><option value="pendiente">🛼 Esperando patines</option><option value="contactado">📲 Contactado</option><option value="asignado">✅ Patines asignados</option><option value="cancelado">✕ Cancelado</option></select>}
                  {whatsappLink(row) && <a href={whatsappLink(row)} target="_blank" rel="noreferrer">WhatsApp · mensaje listo</a>}
                  {!row.isLoan && <button type="button" className="pr-admin-delete" onClick={() => deleteRegistration(row)} disabled={deletingId === row.id}>
                    {deletingId === row.id ? 'Eliminando…' : 'Eliminar'}
                  </button>}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
