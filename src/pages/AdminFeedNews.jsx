import { useEffect, useState } from 'react'
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
  const [notice, setNotice] = useState('')
  async function load() {
    const { data, error } = await supabase.from('pr_feed_news').select('*').order('created_at', { ascending: false })
    if (error) setNotice('No se pudieron cargar las novedades.')
    else setItems(data || [])
  }
  useEffect(() => { if (user?.role === 'admin') load() }, [user?.role])
  async function create(e) {
    e.preventDefault()
    if (busy || !title.trim()) return
    setBusy(true)
    const { error } = await supabase.from('pr_feed_news').insert({ title: title.trim(), body: body.trim(), image_url: image.trim() || null, event_at: eventAt ? new Date(eventAt).toISOString() : null, published })
    if (error) setNotice('No se pudo publicar. Verificá que ingresaste con la cuenta administradora autorizada.')
    else { setTitle(''); setBody(''); setImage(''); setEventAt(''); setPublished(false); setNotice('Novedad guardada.'); await load() }
    setBusy(false)
  }
  async function toggle(item) {
    const { error } = await supabase.from('pr_feed_news').update({ published: !item.published, updated_at: new Date().toISOString() }).eq('id', item.id)
    if (error) setNotice('No se pudo cambiar el estado de la publicación.')
    else { setNotice('Estado actualizado.'); await load() }
  }
  if (user?.role !== 'admin') return <AppLayout title="Novedades"><p className="p-6 text-white/60">Acceso reservado a administración.</p></AppLayout>
  return <AppLayout title="Novedades · Admin" showBack><div className="pr-page space-y-5 pb-16"><header className="rounded-[28px] border border-[#FF0055]/25 bg-[#0D0303] p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-[#FF0055]">Centro de control</p><h1 className="mt-2 font-display text-4xl text-white">Novedades.</h1><p className="mt-2 text-sm text-white/55">Creá recordatorios, anuncios y eventos para RollerFeed. Solo las publicaciones activas son visibles para los alumnos.</p></header><form onSubmit={create} className="space-y-3 rounded-[26px] border border-white/10 bg-white/[.025] p-4"><label className="block text-xs text-white/70">Título<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">Contenido<textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">URL de imagen (opcional)<input type="url" value={image} onChange={e=>setImage(e.target.value)} placeholder="https://…" className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">Fecha de evento (opcional)<input type="datetime-local" value={eventAt} onChange={e=>setEventAt(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)} /> Publicar ahora</label><button disabled={busy} className="w-full rounded-xl bg-[#BBFF1F] px-4 py-3 font-bold text-[#0D0303] disabled:opacity-50">{busy?'Guardando…':'Guardar novedad'}</button></form>{notice&&<p role="status" className="text-xs text-white/70">{notice}</p>}<section className="space-y-3"><h2 className="font-display text-2xl text-white">Publicaciones</h2>{items.map(item=><article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="min-w-0"><p className="truncate font-bold text-white">{item.title}</p><p className="mt-1 text-xs text-white/45">{item.published?'Publicada':'Borrador'}</p></div><button onClick={()=>toggle(item)} className="shrink-0 rounded-xl border border-[#FF0055]/35 px-3 py-2 text-xs font-bold text-[#FF77A3]">{item.published?'Ocultar':'Publicar'}</button></article>)}</section></div></AppLayout>
}
