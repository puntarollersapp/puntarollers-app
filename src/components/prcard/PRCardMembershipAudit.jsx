import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PRCardMembershipAudit() {
  const [data,setData] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [search,setSearch] = useState('')
  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const { data: result, error: failure } = await supabase.functions.invoke('prcard-admin-benefits?audit=1', { method: 'GET' })
      if (failure || !result?.summary || !Array.isArray(result?.pending)) throw new Error('No se pudo consultar la conciliación.')
      setData(result)
    } catch { setError('No se pudo cargar la auditoría. Reintentá en unos momentos.') }
    finally { setLoading(false) }
  }
  useEffect(() => { refresh() }, [])
  return <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
    <h2 className="text-lg font-bold text-white">Verificación de membresías</h2>
    <p className="text-sm text-white/60">Auditoría de solo lectura. Ninguna tarjeta se activa, desactiva ni vincula desde esta pantalla.</p>
    <button type="button" onClick={refresh} disabled={loading} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-yellow-200 disabled:opacity-50">Actualizar auditoría</button>
    {loading && <p role="status" className="text-sm text-white/60">Consultando registros…</p>}
    {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
    {data && !loading && <><div className="grid grid-cols-2 gap-3">
      {[['Tarjetas marcadas activas',data.summary.flagged],['Vínculos verificados',data.summary.verified],['Por revisar',data.summary.withoutVerifiedLink],['Beneficios activos',data.summary.activeBenefits]].map(([label,value])=><div key={label} className="rounded-xl bg-black/25 p-3"><p className="text-2xl font-bold text-yellow-200">{value}</p><p className="text-xs text-white/60">{label}</p></div>)}
    </div><h3 className="font-semibold text-white">Perfiles activos sin vínculo verificado</h3>
    <label className="block text-xs text-white/60">Buscar perfil pendiente<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nombre o identificador" className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30" /></label>
    {data.pending.length === 0 ? <p className="text-sm text-emerald-200">No hay perfiles pendientes de vinculación.</p> : <div className="max-h-80 space-y-2 overflow-y-auto">{data.pending.filter(p => (p.name + ' ' + p.profile_id).toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))).map(p=><div key={p.profile_id} className="rounded-lg border border-white/10 p-3"><p className="text-sm text-white">{p.name}</p><p className="break-all text-xs text-white/40">Perfil: {p.profile_id}</p></div>)}</div>}
    <p className="text-xs text-white/50">Para habilitar descuentos se requiere verificar la identidad y la membresía original. No se utiliza el nombre como prueba de coincidencia. Los perfiles sin coincidencia documental, telefónica ni por correo deben revisarse individualmente con documentación comprobable antes de cualquier vinculación.</p></>}
  </section>
}
