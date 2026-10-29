import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PRCardRequestsAdmin() {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true)
    try {
      const { data, error: failure } = await supabase.functions.invoke('prcard-requests?admin=1', { method: 'GET' })
      if (failure || !Array.isArray(data?.requests)) throw new Error('No se pudieron cargar las solicitudes.')
      setError('')
      setRequests(data.requests)
    } catch {
      setError('No se pudieron cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])
  async function review(id, status) {
    if (!window.confirm(status === 'approved' ? '¿Registrar esta aprobación? La tarjeta NO se activa automáticamente.' : '¿Rechazar esta solicitud?')) return
    setBusy(id)
    setError('')
    try {
      const { data, error: failure } = await supabase.functions.invoke('prcard-requests', { body: { action: 'review', requestId: id, status } })
      if (failure || !data?.request?.id) throw new Error('No se pudo guardar la decisión.')
      setRequests(previous => previous.map(item => item.id === id ? { ...item, status } : item))
      await load()
    } catch {
      setError('No se pudo guardar la decisión. Actualizá antes de volver a intentar.')
    } finally {
      setBusy(null)
    }
  }
  return <section className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
    <h2 className="text-lg font-bold text-white">Solicitudes PR Card</h2>
    <p className="text-sm text-white/60">Aprobar una solicitud registra la revisión; no activa automáticamente la tarjeta. La vinculación se verifica por separado.</p>
    {loading && <p role="status" className="text-sm text-white/50">Cargando solicitudes…</p>}
    {error && <p role="alert" className="text-amber-200 text-sm">{error}</p>}
    <button type="button" onClick={load} className="text-sm text-yellow-200 underline">Actualizar solicitudes</button>
    {requests.filter(r => r.status === 'pending').map(r => <div key={r.id} className="rounded-xl border border-white/10 p-3">
      <p className="font-semibold text-white">{r.first_name} {r.last_name}</p>
      <p className="text-sm text-white/50">{r.email}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={busy === r.id} onClick={() => review(r.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50">Aprobar solicitud</button>
        <button type="button" disabled={busy === r.id} onClick={() => review(r.id, 'rejected')} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white disabled:opacity-50">Rechazar</button>
      </div>
    </div>)}
    {!loading && !error && !requests.some(r => r.status === 'pending') && <p className="text-sm text-white/50">No hay solicitudes pendientes en esta consulta.</p>}
  </section>
}
