import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function AdminFeedNews() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [eventAt, setEventAt] = useState('')
  const [published, setPublished] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [notice, setNotice] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [preview, setPreview] = useState(false)
  async function load() {
    const { data, error } = await supabase.from('pr_feed_news').select('*').order('created_at', { ascending: false })
    setLoadError(Boolean(error))
    if (error) setNotice('No se pudieron cargar las novedades.')
    else { setItems(data || []); setNotice('') }
  }
  useEffect(() => { if (user?.role === 'admin') load() }, [user?.role])
  async function create(e) {
    e.preventDefault()
    if (busy || !title.trim()) return
    setBusy(true)
    const payload = { title: title.trim(), body: body.trim(), image_url: image.trim() || null, event_at: eventAt ? new Date(eventAt).toISOString() : null, published }
    const { error } = editingId ? await supabase.from('pr_feed_news').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId) : await supabase.from('pr_feed_news').insert(payload)
    if (error) setNotice('No se pudo publicar. Verificá que ingresaste con la cuenta administradora autorizada.')
    else { setTitle(''); setBody(''); setImage(''); setEventAt(''); setPublished(false); setEditingId(''); setNotice('Novedad guardada.'); await load() }
    setBusy(false)
  }
  function edit(item) { setEditingId(item.id); setTitle(item.title || ''); setBody(item.body || ''); setImage(item.image_url || ''); setEventAt(item.event_at ? new Date(new Date(item.event_at).getTime() - new Date(item.event_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''); setPublished(Boolean(item.published)); setNotice('Editando novedad.'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function cancelEdit() { setEditingId(''); setTitle(''); setBody(''); setImage(''); setEventAt(''); setPublished(false); setNotice('Edición cancelada.') }
  async function toggle(item) {
    const { error } = await supabase.from('pr_feed_news').update({ published: !item.published, updated_at: new Date().toISOString() }).eq('id', item.id)
    if (error) setNotice('No se pudo cambiar el estado de la publicación.')
    else { setNotice('Estado actualizado.'); await load() }
  }
  const publishedCount = items.filter(item => item.published).length
  if (user?.role !== 'admin') return <AppLayout title="Novedades"><p className="p-6 text-white/60">Acceso reservado a administración.</p></AppLayout>
  return <AppLayout title="Novedades · Admin" showBack><div className="pr-page space-y-5 pb-16"><header className="rounded-[28px] border border-[#FF0055]/25 bg-[#0D0303] p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-[#FF0055]">Centro de control</p><h1 className="mt-2 font-display text-4xl text-white">Novedades.</h1><p className="mt-2 text-sm text-white/55">Creá recordatorios, anuncios y eventos para RollerFeed. Solo las publicaciones activas son visibles para los alumnos.</p></header><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3"><p className="text-xs text-white/60"><span className="font-bold text-[#BBFF1F]">{publishedCount}</span> publicadas · <span className="font-bold text-white">{items.length - publishedCount}</span> borradores</p><Link to="/app/actividad#rollerfeed-novedades" className="rounded-xl border border-[#BBFF1F]/30 px-3 py-2 text-xs font-bold text-[#BBFF1F]">Ver en RollerFeed ↗</Link></div><form onSubmit={create} className="space-y-3 rounded-[26px] border border-white/10 bg-white/[.025] p-4"><label className="block text-xs text-white/70">Título<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">Contenido<textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">URL de imagen (opcional)<input type="url" value={image} onChange={e=>setImage(e.target.value)} placeholder="https://…" className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">Fecha de evento (opcional)<input type="datetime-local" value={eventAt} onChange={e=>setEventAt(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)} /> Publicar ahora</label><button disabled={busy} className="w-full rounded-xl bg-[#BBFF1F] px-4 py-3 font-bold text-[#0D0303] disabled:opacity-50">{busy?'Guardando…':editingId?'Guardar cambios':'Guardar novedad'}</button><button type="button" onClick={() => setPreview(value => !value)} className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/70">{preview ? 'Ocultar vista previa' : 'Vista previa de la tarjeta'}</button>{preview && <div className="rounded-[22px] border border-white/10 bg-[#111013] p-4"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#BBFF1F]">Así se verá en RollerFeed · {published ? 'Publicación' : 'Borrador'}</p><h3 className="mt-2 break-words text-lg font-bold text-white">{title.trim() || 'Título de la novedad'}</h3>{body.trim() && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">{body.trim()}</p>}{image.trim() && <p className="mt-2 break-all text-[11px] text-white/40">Imagen: {image.trim()}</p>}{eventAt && <p className="mt-2 text-xs text-[#BBFF1F]">Evento: {new Date(eventAt).toLocaleString('es-UY')}</p>}</div>}{editingId&&<button type="button" onClick={cancelEdit} className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs text-white/65">Cancelar edición</button>}</form>{notice&&<p role="status" className="text-xs text-white/70">{notice}</p>}<section className="space-y-3"><h2 className="font-display text-2xl text-white">Publicaciones</h2>{loadError && <div role="alert" className="rounded-xl border border-amber-400/25 p-3 text-sm text-amber-200">No se pudo consultar la lista. <button type="button" onClick={load} className="ml-2 font-bold underline">Reintentar</button></div>}{!loadError && !items.length && <p className="rounded-xl border border-white/10 p-4 text-sm text-white/50">Todavía no hay novedades guardadas.</p>}{items.map(item=><article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="min-w-0"><p className="truncate font-bold text-white">{item.title}</p><p className="mt-1 text-xs text-white/45">{item.published?'Publicada':'Borrador'}</p></div><div className="flex shrink-0 gap-2"><button onClick={()=>edit(item)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/75">Editar</button><button onClick={()=>toggle(item)} className="rounded-xl border border-[#FF0055]/35 px-3 py-2 text-xs font-bold text-[#FF77A3]">{item.published?'Ocultar':'Publicar'}</button></div></article>)}</section></div></AppLayout>
}
