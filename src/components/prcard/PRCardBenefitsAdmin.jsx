import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PRCardBenefitsAdmin() {
  const [items,setItems] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(null)
  const [editing,setEditing] = useState(null)
  const [draft,setDraft] = useState({})
  const [filter,setFilter] = useState('all')
  const [search,setSearch] = useState('')
  const visibleItems = items.filter(item => (filter === 'all' || (filter === 'active' ? item.active : !item.active)) && [item.commerce,item.title,item.category].some(value => String(value || '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id)
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
      setItems(previous => previous.map(item => item.id === id ? {...item,...changes,...data.benefit} : item))
      return true
    } catch { setError('No se pudo guardar el cambio. Volvé a cargar el catálogo antes de intentar nuevamente.'); return false }
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
    <div className="flex flex-wrap gap-2"><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar comercio o beneficio" aria-label="Buscar comercio" className="min-w-0 flex-1 rounded-xl border border-white/20 bg-black/20 p-2 text-sm text-white" /><select value={filter} onChange={event=>setFilter(event.target.value)} aria-label="Filtrar comercios" className="rounded-xl border border-white/20 bg-neutral-900 p-2 text-sm text-white"><option value="all">Todos ({items.length})</option><option value="active">Activos ({items.filter(item=>item.active).length})</option><option value="inactive">Inactivos ({items.filter(item=>!item.active).length})</option></select></div>
    {!loading && !error && visibleItems.length === 0 && items.length > 0 && <p className="text-sm text-white/50">No hay coincidencias con los filtros.</p>}
    <div className="space-y-3">
      {visibleItems.map(item => <div key={item.id} className="rounded-2xl border border-white/10 p-3">
        <div className="flex items-center gap-3">
          {item.logo_url && <img src={item.logo_url} alt="" className="h-12 w-12 rounded-lg bg-white/10 object-contain" />}
          <div className="min-w-0 flex-1"><p className="font-semibold text-white">{item.commerce}</p><p className="text-xs text-white/60">{item.title}</p></div>
          <span className={item.active ? 'text-xs text-emerald-200' : 'text-xs text-white/40'}>{item.active ? 'Visible' : 'Oculto'}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={()=>{setEditing(item.id);setDraft({commerce:item.commerce||'',title:item.title||'',description:item.description||'',redeem:item.redeem||'',category:item.category||'',valid_until_label:item.valid_until_label||'',logo_url:item.logo_url||'',phone:item.phone||'',social:item.social||''})}} className="rounded-lg border border-yellow-300/30 px-3 py-2 text-xs text-yellow-200">Editar información</button>
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{active:!item.active})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40">{item.active ? 'Ocultar' : 'Activar'}</button>
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{featured:!item.featured})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40">{item.featured ? 'Quitar destacado' : 'Destacar'}</button>
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{sort_order:(item.sort_order || 0)-1})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40" aria-label={'Subir orden de '+item.commerce}>↑ Orden</button>
          <button type="button" disabled={busy === item.id} onClick={()=>update(item.id,{sort_order:(item.sort_order || 0)+1})} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-40" aria-label={'Bajar orden de '+item.commerce}>↓ Orden</button>
        </div>
        {editing === item.id && <div className="mt-4 grid gap-3 rounded-xl border border-yellow-300/20 p-3">
          {Object.entries({commerce:'Comercio',title:'Beneficio',description:'Descripción y condiciones',redeem:'Cómo canjear',category:'Categoría',valid_until_label:'Vigencia',logo_url:'Logo HTTPS',phone:'Contacto',social:'Red social HTTPS'}).map(([key,label])=><label key={key} className="grid gap-1 text-xs text-white/70">{label}<textarea rows={key === 'description' || key === 'redeem' ? 3 : 1} value={draft[key]||''} onChange={event=>setDraft(previous=>({...previous,[key]:event.target.value}))} className="w-full rounded-lg border border-white/15 bg-black/30 p-2 text-sm text-white" /></label>)}
          <div className="flex gap-2"><button type="button" disabled={busy === item.id} onClick={async()=>{if(await update(item.id,draft))setEditing(null)}} className="rounded-lg bg-yellow-300 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Guardar cambios</button><button type="button" onClick={()=>setEditing(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">Cancelar</button></div>
        </div>}
      </div>)}
    </div>
  </section>
}
