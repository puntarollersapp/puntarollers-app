import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PRCardBenefitsAdmin() {
  const [items,setItems] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(null)
  async function load() {
    setLoading(true)
    try {
      const { data,error: failure } = await supabase.functions.invoke('prcard-admin-benefits',{method:'GET'})
      if (failure || !Array.isArray(data?.benefits)) throw new Error('No se pudo cargar el catálogo.')
      setItems(data.benefits)
      setError('')
    } catch { setError('No se pudo consultar el catálogo de comercios.') }
    finally { setLoading(false) }
  }
  useEffect(()=>{load()},[])
  async function update(id, changes) {
    setBusy(id)
    setError('')
    try {
      const { data,error: failure } = await supabase.functions.invoke('prcard-admin-benefits',{body:{id,...changes}})
      if (failure || !data?.benefit?.id) throw new Error('No se pudo guardar el cambio.')
      setItems(previous => previous.map(item => item.id === id ? {...item,...data.benefit} : item))
    } catch { setError('No se pudo guardar el cambio. Volvé a cargar el catálogo antes de intentar nuevamente.') }
    finally { setBusy(null) }
  }
  return <section className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-white">Comercios y beneficios</h2>
      <button type="button" onClick={load} className="text-sm text-yellow-200 underline">Actualizar</button>
    </div>
    <p className="text-sm text-white/60">Administrá la visibilidad y el orden del catálogo central. Los cambios requieren confirmación del servidor.</p>
    {loading && <p role="status" className="text-sm text-white/50">Cargando comercios…</p>}
    {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
    {!loading && !error && items.length === 0 && <p className="text-sm text-white/50">No hay comercios cargados.</p>}
    <div className="space-y-3">
      {items.map(item => <div key={item.id} className="rounded-2xl border border-white/10 p-3">
        <div className="flex items-center gap-3">
          {item.logo_url && <img src={item.logo_url} alt="" className="h-12 w-12 rounded-lg bg-white/10 object-contain" />}
          <div className="min-w-0 flex-1"><p className="font-semibold text-white">{item.commerce}</p><p className="text-xs text-white/60">{item.title}</p></div>
          <span className={item.active ? 'text-xs text-emerald-200' : 'text-xs text-white/40'}>{item.active ? 'Visible' : 'Oculto'}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{active:!item.active})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40">{item.active ? 'Ocultar' : 'Activar'}</button>
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{featured:!item.featured})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40">{item.featured ? 'Quitar destacado' : 'Destacar'}</button>
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{sort_order:(item.sort_order || 0)-1})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40" aria-label={'Subir orden de '+item.commerce}>↑ Orden</button>
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{sort_order:(item.sort_order || 0)+1})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40" aria-label={'Bajar orden de '+item.commerce}>↓ Orden</button>
        </div>
      </div>)}
    </div>
  </section>
}
