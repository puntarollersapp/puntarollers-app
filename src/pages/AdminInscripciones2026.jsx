import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import ClinicaAdminMini from '../components/ClinicaAdminMini'
import './AdminInscripciones2026.css'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('todas')
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('pr_inscripciones_2026')
      .select('*')
      .order('created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(() => rows.filter(row => {
    if (filter !== 'todas' && row.modalidad !== filter) return false
    const haystack = `${row.nombre_completo || ''} ${row.nombre_responsable || ''} ${row.email || ''} ${row.telefono || ''} ${row.localidad || ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [rows, filter, query])

  const stats = useMemo(() => ({
    total: rows.length,
    grupales: rows.filter(r => r.modalidad === 'grupales').length,
    personalizadas: rows.filter(r => r.modalidad === 'personalizadas').length,
    kids: rows.filter(r => r.modalidad === 'kids').length,
    confirmadas: rows.filter(r => ['pago_verificado','confirmado'].includes(r.estado)).length,
  }), [rows])

  const setStatus = async (id, estado) => {
    const { error: updateError } = await supabase
      .from('pr_inscripciones_2026')
      .update({ estado, comprobante_recibido: ['pago_verificado','confirmado'].includes(estado), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (updateError) return setError(updateError.message)
    setRows(prev => prev.map(row => row.id === id ? { ...row, estado, comprobante_recibido: ['pago_verificado','confirmado'].includes(estado) } : row))
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

      <section className="pr-admin-stats">
        <article><span>Total</span><strong>{stats.total}</strong></article>
        <article><span>Grupales</span><strong>{stats.grupales}</strong></article>
        <article><span>Personalizadas</span><strong>{stats.personalizadas}</strong></article>
        <article><span>PR Kids</span><strong>{stats.kids}</strong></article>
        <article><span>Pagos verificados</span><strong>{stats.confirmadas}</strong></article>
      </section>

      <ClinicaAdminMini />

      <section className="pr-admin-tools">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar alumno, responsable, email, teléfono…" />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="grupales">Grupales</option>
          <option value="personalizadas">Personalizadas</option>
          <option value="kids">PR Kids</option>
        </select>
      </section>

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
                    <b>Prex · ${Number(row.monto).toLocaleString('es-UY')}</b>
                    <small>{row.comprobante_recibido ? 'Comprobante recibido' : 'Comprobante pendiente'}</small>
                  </div>
                </div>

                <div className="pr-admin-actions">
                  <select value={row.estado} onChange={e => setStatus(row.id, e.target.value)}>
                    {Object.entries(statusLabel).map(([value,label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                  <a href={`https://wa.me/598${String(row.telefono).replace(/\D/g,'').replace(/^598/,'').replace(/^0/,'')}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  <button type="button" className="pr-admin-delete" onClick={() => deleteRegistration(row)} disabled={deletingId === row.id}>
                    {deletingId === row.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
