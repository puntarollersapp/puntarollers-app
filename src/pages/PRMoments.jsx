import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import SkateMomentMask from '../components/SkateMomentMask'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { loadActiveMoments, MOMENT_REACTIONS, relativeTime, timeLeft } from '../lib/moments'

const VISIBILITY = [{ key: 'all', label: 'Todos PR' }, { key: 'friends', label: 'Solo amigos' }, { key: 'private', label: 'Solo yo' }]
const displayName = (profile = {}) => [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Roller PR'

export default function PRMoments() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [moments, setMoments] = useState([])
  const [profiles, setProfiles] = useState({})
  const [reactions, setReactions] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [composer, setComposer] = useState(params.get('create') === '1')
  const [kind, setKind] = useState('text')
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [file, setFile] = useState(null)
  const currentId = String(user?.id || '')
  const canModerate = ['admin', 'profesor'].includes(user?.role)
  const selectedId = params.get('moment')

  const load = useCallback(async () => {
    setLoading(true); setMessage('')
    try {
      const rows = await loadActiveMoments()
      setMoments(rows)
      const ids = [...new Set(rows.map((row) => row.profile_id).filter(Boolean))]
      if (!ids.length) setProfiles({})
      else {
        const { data, error } = await supabase.from('profiles_feed').select('id,nombre,apellido,foto').in('id', ids)
        if (error) throw error
        setProfiles(Object.fromEntries((data || []).map((profile) => [String(profile.id), profile])))
      }
    } catch (error) { setMessage(error?.message || 'No pudimos cargar PR Moments.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  const groups = useMemo(() => {
    const map = new Map()
    moments.forEach((moment) => { const key = String(moment.profile_id); if (!map.has(key)) map.set(key, []); map.get(key).push(moment) })
    return [...map.entries()]
  }, [moments])
  const foundIndex = moments.findIndex((item) => item.id === selectedId)
  const selectedIndex = Math.max(0, foundIndex)
  const selected = selectedId && foundIndex >= 0 ? moments[foundIndex] : null

  useEffect(() => {
    if (!selected?.id) return
    let active = true
    Promise.all([
      supabase.from('pr_moment_reactions').select('*').eq('moment_id', selected.id).order('created_at'),
      supabase.from('pr_moment_comments').select('*').eq('moment_id', selected.id).order('created_at'),
    ]).then(async ([reactionResult, commentResult]) => {
      if (!active) return
      setReactions(reactionResult.data || []); setComments(commentResult.data || [])
      const ids = [...new Set((commentResult.data || []).map((row) => row.profile_id).filter(Boolean))]
      const missing = ids.filter((id) => !profiles[String(id)])
      if (missing.length) {
        const { data } = await supabase.from('profiles_feed').select('id,nombre,apellido,foto').in('id', missing)
        if (active) setProfiles((current) => ({ ...current, ...Object.fromEntries((data || []).map((p) => [String(p.id), p])) }))
      }
    })
    return () => { active = false }
  }, [selected?.id])

  function closeViewer() { params.delete('moment'); setParams(params, { replace: true }) }
  function move(direction) { const next = moments[selectedIndex + direction]; if (next) setParams({ moment: next.id }); else closeViewer() }

  async function createMoment(event) {
    event.preventDefault()
    const cleanCaption = caption.trim()
    if (kind === 'text' && !cleanCaption) return setMessage('Escribí algo para publicar tu Moment.')
    if (kind !== 'text' && !file) return setMessage('Elegí una foto o un video.')
    if (file?.size > 15 * 1024 * 1024) return setMessage('El archivo supera el máximo de 15 MB.')
    setSaving(true); setMessage('')
    let storagePath = null
    try {
      if (file) {
        const extension = (file.name.split('.').pop() || (kind === 'video' ? 'mp4' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '')
        storagePath = `${currentId}/${crypto.randomUUID()}.${extension}`
        const { error } = await supabase.storage.from('pr-moments').upload(storagePath, file, { contentType: file.type, upsert: false })
        if (error) throw error
      }
      const { error } = await supabase.from('pr_moments').insert({ profile_id: currentId, media_type: kind, caption: cleanCaption, media_url: storagePath, visibility })
      if (error) throw error
      setCaption(''); setFile(null); setComposer(false); setParams({}, { replace: true }); await load()
    } catch (error) {
      if (storagePath) await supabase.storage.from('pr-moments').remove([storagePath])
      setMessage(error?.message || 'No pudimos publicar tu Moment.')
    } finally { setSaving(false) }
  }

  async function react(key) {
    if (!selected || saving) return
    setSaving(true)
    const mine = reactions.find((item) => String(item.profile_id) === currentId)
    const query = mine?.reaction === key
      ? supabase.from('pr_moment_reactions').delete().eq('id', mine.id)
      : supabase.from('pr_moment_reactions').upsert({ moment_id: selected.id, profile_id: currentId, reaction: key, updated_at: new Date().toISOString() }, { onConflict: 'moment_id,profile_id' })
    const { error } = await query
    if (error) setMessage(error.message)
    else { const { data } = await supabase.from('pr_moment_reactions').select('*').eq('moment_id', selected.id); setReactions(data || []) }
    setSaving(false)
  }

  async function postComment(event) {
    event.preventDefault(); const body = comment.trim()
    if (!body || !selected || saving) return
    setSaving(true)
    const { error } = await supabase.from('pr_moment_comments').insert({ moment_id: selected.id, profile_id: currentId, body })
    if (error) setMessage(error.message)
    else { setComment(''); const { data } = await supabase.from('pr_moment_comments').select('*').eq('moment_id', selected.id).order('created_at'); setComments(data || []) }
    setSaving(false)
  }

  async function removeMoment() {
    if (!selected || !window.confirm('¿Eliminar este Moment?')) return
    const mediaPath = selected.media_url
    const { error } = await supabase.from('pr_moments').delete().eq('id', selected.id)
    if (error) return setMessage(error.message)
    if (mediaPath) await supabase.storage.from('pr-moments').remove([mediaPath])
    closeViewer(); await load()
  }

  async function removeComment(id) {
    const { error } = await supabase.from('pr_moment_comments').delete().eq('id', id)
    if (!error) setComments((rows) => rows.filter((row) => row.id !== id))
  }

  return <AppLayout title="PR Moments" showBack>
    <div className="pr-page space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-[34px] border border-violet-300/20 bg-gradient-to-br from-violet-600/25 via-[#14101b] to-[#08080c] p-5"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" /><div className="relative"><p className="text-[9px] font-black uppercase tracking-[.2em] text-violet-200">24 horas sobre ruedas</p><h1 className="mt-2 font-display text-4xl text-white">PR Moments</h1><p className="mt-3 max-w-xs text-sm leading-6 text-white/45">Fotos, videos o palabras de la comunidad. Libres, espontáneos y bien PR.</p></div></section>
      {message && <div role="alert" className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs text-amber-100">{message}</div>}
      <section className="rounded-[28px] border border-white/[.07] bg-white/[.025] p-4"><div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button type="button" onClick={() => setComposer(true)} className="flex w-[72px] shrink-0 flex-col items-center gap-2"><span className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-violet-300/50 bg-violet-500/10 text-2xl text-violet-200">+</span><span className="text-[9px] font-bold text-white/55">Nuevo</span></button>
        {groups.map(([profileId, items]) => { const profile = profiles[profileId] || {}; const name = displayName(profile); return <button key={profileId} type="button" onClick={() => setParams({ moment: items[0].id })} className="flex w-[72px] shrink-0 flex-col items-center gap-2"><span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 border-violet-400 bg-[#141019] p-[2px]">{profile.foto ? <img src={profile.foto} alt={name} className="h-full w-full rounded-full object-cover" /> : '🛼'}</span><span className="max-w-[70px] truncate text-[9px] font-bold text-white/55">{profileId === currentId ? 'Vos' : name.split(' ')[0]}</span></button> })}
      </div>{!loading && !moments.length && <div className="py-10 text-center"><div className="text-4xl">⚡</div><h2 className="mt-3 font-display text-2xl text-white">La pista está lista</h2><p className="mt-2 text-xs text-white/35">Sé la primera persona en compartir un Moment.</p></div>}{loading && <p className="py-8 text-center text-xs text-white/35">Cargando Moments…</p>}</section>
      <button type="button" onClick={() => setComposer(true)} className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 text-sm font-black text-white">+ Crear un Moment</button>
    </div>

    {composer && <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#08080c]/95 px-4 py-6 backdrop-blur-xl"><form onSubmit={createMoment} className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#121119] p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">Nuevo PR Moment</p><h2 className="mt-1 font-display text-3xl text-white">Compartí tu roll</h2></div><button type="button" onClick={() => setComposer(false)} className="h-11 w-11 rounded-full bg-white/[.06] text-white">×</button></div><div className="mt-5 grid grid-cols-3 gap-2">{[['text','Texto'],['photo','Foto'],['video','Video']].map(([key,label]) => <button key={key} type="button" onClick={() => { setKind(key); setFile(null) }} className={`rounded-2xl border py-3 text-xs font-bold ${kind === key ? 'border-violet-300/40 bg-violet-500/20 text-violet-100' : 'border-white/[.07] text-white/40'}`}>{label}</button>)}</div>{kind !== 'text' && <label className="mt-4 grid min-h-28 cursor-pointer place-items-center rounded-3xl border border-dashed border-violet-300/30 bg-violet-500/[.05] p-5 text-center text-xs text-white/45"><input type="file" className="sr-only" accept={kind === 'photo' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime,video/webm'} onChange={(e) => setFile(e.target.files?.[0] || null)} />{file ? file.name : `Elegí ${kind === 'photo' ? 'una foto' : 'un video'} · máx. 15 MB`}</label>}<textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={600} rows={kind === 'text' ? 7 : 3} placeholder="Escribí lo que quieras…" className="mt-4 w-full resize-none rounded-3xl border border-white/[.08] bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/25" /><label className="mt-4 block text-[10px] font-black uppercase tracking-wider text-white/35">Quién puede verlo<select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/[.08] bg-[#1a1820] p-3 text-sm normal-case tracking-normal text-white">{VISIBILITY.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label><button disabled={saving} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 text-sm font-black text-white disabled:opacity-40">{saving ? 'Publicando…' : 'Publicar por 24 h'}</button></form></div>}

    {selected && <div className="fixed inset-0 z-[130] flex flex-col bg-[#050507] text-white"><div className="flex gap-1 px-3 pt-3">{moments.map((item, index) => <span key={item.id} className={`h-1 flex-1 rounded-full ${index <= selectedIndex ? 'bg-violet-400' : 'bg-white/15'}`} />)}</div><header className="flex items-center gap-3 px-4 py-3"><div className="h-10 w-10 overflow-hidden rounded-full bg-white/10">{profiles[String(selected.profile_id)]?.foto ? <img src={profiles[String(selected.profile_id)].foto} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center">🛼</span>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{displayName(profiles[String(selected.profile_id)])}</p><p className="text-[10px] text-white/40">{relativeTime(selected.created_at)} · queda {timeLeft(selected.expires_at)}</p></div>{(String(selected.profile_id) === currentId || canModerate) && <button type="button" onClick={removeMoment} className="rounded-full px-3 py-2 text-xs text-red-300">Eliminar</button>}<button type="button" onClick={closeViewer} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl">×</button></header><main className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-2"><button type="button" aria-label="Anterior" onClick={() => move(-1)} className="absolute inset-y-0 left-0 z-10 w-1/5" /><button type="button" aria-label="Siguiente" onClick={() => move(1)} className="absolute inset-y-0 right-0 z-10 w-1/5" />{selected.media_type === 'text' ? <div className="max-w-sm whitespace-pre-wrap break-words text-center font-display text-4xl leading-tight">{selected.caption}</div> : <div className="w-full max-w-md">{selected.media_type === 'photo' ? <SkateMomentMask className="aspect-[1.06]"><img src={selected.signed_media_url} alt={selected.caption || 'PR Moment'} className="h-full w-full object-cover" /></SkateMomentMask> : <video src={selected.signed_media_url} controls playsInline className="max-h-[52vh] w-full rounded-[28px] bg-black object-contain" />}{selected.caption && <p className="mt-3 whitespace-pre-wrap text-center text-sm text-white/75">{selected.caption}</p>}</div>}</main><footer className="max-h-[38vh] overflow-y-auto border-t border-white/10 bg-[#0b0a0f] p-4"><div className="flex flex-wrap gap-2">{MOMENT_REACTIONS.map((option) => { const selectedReaction = reactions.find((row) => String(row.profile_id) === currentId)?.reaction === option.key; const count = reactions.filter((row) => row.reaction === option.key).length; return <button type="button" key={option.key} onClick={() => react(option.key)} className={`rounded-full border px-3 py-2 text-xs ${selectedReaction ? 'border-violet-300/50 bg-violet-500/25' : 'border-white/10 bg-white/[.04]'}`}>{option.icon} {count || ''}</button> })}</div><div className="mt-3 space-y-2">{comments.map((row) => { const profile = profiles[String(row.profile_id)] || {}; const removable = String(row.profile_id) === currentId || canModerate; return <div key={row.id} className="rounded-2xl bg-white/[.04] px-3 py-2"><div className="flex gap-2"><p className="min-w-0 flex-1 text-[10px] font-black text-white/65">{displayName(profile)}</p>{removable && <button type="button" onClick={() => removeComment(row.id)} className="text-[9px] text-red-300/70">Eliminar</button>}</div><p className="mt-1 whitespace-pre-wrap break-words text-xs text-white/70">{row.body}</p></div> })}</div><form onSubmit={postComment} className="mt-3 flex gap-2"><input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="Escribí un comentario…" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-xs outline-none" /><button disabled={!comment.trim() || saving} className="h-11 rounded-2xl bg-violet-500 px-4 text-xs font-black disabled:opacity-30">Enviar</button></form></footer></div>}
  </AppLayout>
}
