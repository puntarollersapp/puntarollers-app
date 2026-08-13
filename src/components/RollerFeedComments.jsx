import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RollerFeedComments({ feedKey, currentProfileId }) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [profiles, setProfiles] = useState({})
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadComments() {
    if (!feedKey) return
    const { data } = await supabase
      .from('rollerfeed_comments')
      .select('id,feed_key,profile_id,body,created_at')
      .eq('feed_key', String(feedKey))
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    const rows = data || []
    setComments(rows)
    const ids = [...new Set(rows.map((row) => row.profile_id).filter(Boolean))]
    if (!ids.length) {
      setProfiles({})
      return
    }
    const { data: people } = await supabase
      .from('profiles_feed')
      .select('id,nombre,apellido,foto')
      .in('id', ids)
    setProfiles(Object.fromEntries((people || []).map((person) => [String(person.id), person])))
  }

  useEffect(() => {
    if (open) loadComments()
  }, [open, feedKey])

  async function publish(event) {
    event.preventDefault()
    const body = text.trim()
    if (!body || !currentProfileId || busy) return
    setBusy(true)
    const { error } = await supabase
      .from('rollerfeed_comments')
      .insert({ feed_key: String(feedKey), profile_id: String(currentProfileId), body })
    if (!error) {
      setText('')
      await loadComments()
    }
    setBusy(false)
  }

  return (
    <div className="mt-3 border-t border-white/[.06] pt-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-[10px] font-bold text-white/45">
        💬 {open ? 'Ocultar comentarios' : comments.length ? `${comments.length} comentarios` : 'Comentar'}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {comments.map((comment) => {
            const profile = profiles[String(comment.profile_id)] || {}
            const name = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Roller PR'
            return (
              <div key={comment.id} className="flex gap-2.5">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[.06]">
                  {profile.foto ? <img src={profile.foto} alt={name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xs">🛼</span>}
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-white/[.035] px-3 py-2.5">
                  <p className="text-[10px] font-black text-white/70">{name}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-white/65">{comment.body}</p>
                </div>
              </div>
            )
          })}
          <form onSubmit={publish} className="flex items-end gap-2">
            <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} rows={1} placeholder="Escribí un comentario…" className="min-h-11 flex-1 resize-none rounded-2xl border border-white/[.08] bg-black/25 px-3 py-3 text-[11px] text-white outline-none placeholder:text-white/22" />
            <button type="submit" disabled={!text.trim() || busy} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 text-white disabled:opacity-25">↑</button>
          </form>
        </div>
      )}
    </div>
  )
}
