import { useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const META = {
  patines: { title: 'Mis patines', emoji: '🛼', hint: 'Subí una foto de tus patines acá' },
  ruedas: { title: 'Mis ruedas', emoji: '◉', hint: 'Subí una foto de tus ruedas acá' },
  calle: { title: 'Mi calle fav', emoji: '⌁', hint: 'Subí una foto de tu lugar favorito' },
  galeria: { title: 'Momento', emoji: '✦', hint: 'Un pedacito de tu mundo PR' },
}
const BUCKET = 'pr-profile-media'
const MAX = 25 * 1024 * 1024

function instagramUrl(value) {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://instagram.com/${raw.replace(/^@/, '')}`
}
function instagramHandle(value) {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw)
      const bits = u.pathname.split('/').filter(Boolean)
      return bits.length ? `@${bits[bits.length - 1].replace(/^@/, '')}` : 'Instagram'
    } catch (_) {
      return 'Instagram'
    }
  }
  return `@${raw.replace(/^@/, '')}`
}

export default function ProfileShowcase({ items = [], momentPhotos = [], instagram = '', tracking = false, onChange }) {
  const input = useRef(null)
  const [slot, setSlot] = useState('galeria')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const gallery = items.filter((x) => x.slot_key === 'galeria').slice(0, 6)
  const displayGallery = useMemo(() => {
    const manual = gallery.map((x) => ({ ...x, display_url: x.image_url, source: 'perfil' }))
    const used = new Set(manual.map((x) => x.display_url).filter(Boolean))
    const fromMoments = (momentPhotos || [])
      .filter((x) => x.signed_media_url && !used.has(x.signed_media_url))
      .map((x) => ({ id: `moment-${x.id}`, display_url: x.signed_media_url, source: 'Moment' }))
    return [...manual, ...fromMoments].slice(0, 6)
  }, [gallery, momentPhotos])

  function choose(key) {
    if (busy) return
    setSlot(key)
    setMsg('')
    requestAnimationFrame(() => input.current?.click())
  }

  async function upload(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX) {
      setMsg('Usá JPG, PNG o WEBP de hasta 25 MB.')
      return
    }
    setBusy(true)
    setMsg('Preparando tu foto en alta calidad…')
    let path = ''
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const { data: pathData, error: pathError } = await supabase.rpc('pr_profile_media_path', { p_slot_key: slot, p_ext: ext })
      if (pathError || !pathData) throw pathError || new Error('No pudimos preparar el espacio de la foto.')
      path = pathData
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      if (!publicData?.publicUrl) throw new Error('No pudimos generar la URL.')
      const sort = slot === 'galeria' ? Math.floor(Date.now() / 1000) : 0
      const { data: saved, error: saveError } = await supabase.rpc('pr_save_profile_showcase', {
        p_slot_key: slot,
        p_title: META[slot]?.title || 'Momento',
        p_image_url: publicData.publicUrl,
        p_sort_order: sort,
      })
      if (saveError) throw saveError
      onChange?.(slot === 'galeria' ? [saved, ...items] : [...items.filter((x) => x.slot_key !== slot), saved])
      setMsg('✓ Foto subida en alta calidad.')
    } catch (error) {
      if (path) await supabase.storage.from(BUCKET).remove([path])
      setMsg(`No pudimos subirla: ${error?.message || 'intentá otra vez.'}`)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  async function remove(item) {
    if (!item?.id || String(item.id).startsWith('moment-') || busy) return
    if (!window.confirm('¿Eliminar esta foto de tu perfil?')) return
    setBusy(true)
    try {
      const { error } = await supabase.rpc('pr_delete_profile_showcase', { p_item_id: item.id })
      if (error) throw error
      onChange?.(items.filter((x) => x.id !== item.id))
      setMsg('✓ Foto eliminada de tu perfil.')
    } catch (error) {
      setMsg(`No pudimos eliminarla: ${error?.message || 'intentá otra vez.'}`)
    } finally {
      setBusy(false)
    }
  }

  function controls(item, key) {
    if (!item || item.source === 'Moment') return null
    return (
      <div className="absolute right-2 top-2 z-20 flex gap-1">
        <button type="button" onClick={(e) => { e.stopPropagation(); choose(key) }} className="rounded-full bg-black/75 px-2 py-1 text-[7px] font-black text-white backdrop-blur">CAMBIAR</button>
        <button type="button" onClick={(e) => { e.stopPropagation(); remove(item) }} className="rounded-full bg-red-600/90 px-2 py-1 text-[7px] font-black text-white backdrop-blur">ELIMINAR</button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <section className="pr-moment-card relative overflow-hidden rounded-[30px] border border-fuchsia-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(217,70,239,.14),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-[8px] font-black uppercase tracking-[.18em] text-fuchsia-300/70">MI MOMENTO</p><h3 className="mt-1 text-sm font-black text-white">Tus momentos</h3><p className="mt-1 text-[9px] text-white/28">Fotos que subís acá + tus últimos PR Moments.</p></div>
          <button disabled={busy} onClick={() => choose('galeria')} className="shrink-0 rounded-full border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-[8px] font-black text-white/55">{busy ? 'PROCESANDO…' : 'SUBIR FOTO'}</button>
        </div>
        {displayGallery.length ? <div className="mt-3 grid grid-cols-3 gap-1.5">{displayGallery.slice(0, 3).map((x) => <div key={x.id} className="relative aspect-square overflow-hidden rounded-[17px] bg-white/[.03]"><img src={x.display_url} alt="" className="h-full w-full object-cover" />{controls(x, 'galeria')}{x.source === 'Moment' && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-1 text-[6px] font-black uppercase text-white/70">Moment</span>}</div>)}</div> : <button onClick={() => choose('galeria')} className="mt-3 grid w-full grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="grid aspect-square place-items-center rounded-[17px] border border-dashed border-white/[.08] bg-white/[.02] text-xl text-white/15">+</div>)}</button>}
        <div className="mt-3 flex items-center justify-between gap-3"><p className="text-[9px] leading-4 text-white/25">Alta calidad · JPG, PNG o WEBP · hasta 25 MB.</p>{instagram && <a href={instagramUrl(instagram)} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-fuchsia-300/15 bg-fuchsia-400/[.06] px-3 py-1.5 text-[8px] font-black text-fuchsia-200">IG {instagramHandle(instagram)} ↗</a>}</div>
      </section>
      <section className="overflow-hidden rounded-[30px] border border-sky-300/15 bg-[radial-gradient(circle_at_95%_0%,rgba(56,189,248,.12),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-4">
        <div className="flex items-end justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.18em] text-sky-300">MI SETUP</p><h3 className="mt-1 font-display text-[27px] text-white">Mi mundo sobre ruedas.</h3><p className="mt-1 text-[9px] text-white/28">Subí, cambiá o eliminá cada foto cuando quieras.</p></div>{tracking && <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1.5 text-[7px] font-black text-emerald-200">✓ PR TRACKING</span>}</div>
        <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">{['patines', 'ruedas', 'calle'].map((key) => { const x = items.find((v) => v.slot_key === key); const m = META[key]; return <div key={key} onClick={() => !x && choose(key)} className="relative h-[205px] w-[158px] shrink-0 cursor-pointer overflow-hidden rounded-[25px] border border-white/[.08] bg-black/25 text-left">{x?.image_url ? <img src={x.image_url} alt={m.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-white/[.05] to-sky-400/[.05]"><span className="text-4xl opacity-50">{m.emoji}</span></div>}{x && controls(x, key)}<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/5 to-transparent" /><div className="pointer-events-none absolute bottom-3 left-3 right-3"><p className="text-[7px] font-black uppercase tracking-[.12em] text-sky-200/70">{x ? 'TU SETUP' : 'SUBÍ TU FOTO ACÁ +'}</p><p className="mt-1 text-sm font-black text-white">{m.title}</p><p className="mt-1 text-[8px] leading-3 text-white/38">{m.hint}</p></div></div> })}</div>
        {msg && <p role="status" className={`mt-3 rounded-xl border p-2 text-[9px] ${msg.startsWith('✓') ? 'border-emerald-300/15 bg-emerald-400/[.07] text-emerald-200' : 'border-amber-300/15 bg-amber-400/[.07] text-amber-100'}`}>{msg}</p>}
      </section>
      <style>{`.pr-moment-card{animation:prMomentFloat 4.2s ease-in-out infinite}@keyframes prMomentFloat{50%{transform:translateY(-3px)}}@media(prefers-reduced-motion:reduce){.pr-moment-card{animation:none}}`}</style>
    </div>
  )
}
