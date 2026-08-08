import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { supabase } from '../lib/supabase'

const nameOf = (p) => [p?.nombre, p?.apellido].filter(Boolean).join(' ').trim() || 'Roller PR'
const timeOf = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
}
const dayOf = (value) => {
  if (!value) return ''
  const d = new Date(value)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return timeOf(value)
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })
}

function Avatar({ profile, small = false }) {
  const size = small ? 'h-11 w-11' : 'h-12 w-12'
  return <div className={`${size} shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] grid place-items-center`}>
    {profile?.foto ? <img src={profile.foto} alt={nameOf(profile)} className="h-full w-full object-cover" /> : <span className="text-xl">🛼</span>}
  </div>
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const initialFriend = params.get('with') || ''
  const [conversations, setConversations] = useState([])
  const [friends, setFriends] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const bottomRef = useRef(null)

  const activeOther = useMemo(() => active?.other_profile || null, [active])

  async function loadInbox({ silent = false } = {}) {
    if (!silent) setLoading(true)
    const [{ data: inbox, error: inboxError }, { data: community }] = await Promise.all([
      supabase.rpc('pr_dm_inbox'),
      supabase.rpc('community_get_dashboard'),
    ])
    if (inboxError) setNotice(`PR Chat necesita activarse en Supabase: ${inboxError.message}`)
    else setConversations(Array.isArray(inbox) ? inbox : [])
    setFriends(Array.isArray(community?.friends) ? community.friends : [])
    if (!silent) setLoading(false)
    return Array.isArray(inbox) ? inbox : []
  }

  async function openConversation(conversation) {
    setActive(conversation)
    setMessages([])
    setNotice('')
    setParams({ chat: conversation.id }, { replace: true })
    const { data, error } = await supabase.rpc('pr_dm_messages', { conversation_id_value: conversation.id })
    if (error) { setNotice(error.message); return }
    setMessages(Array.isArray(data) ? data : [])
    await supabase.rpc('pr_dm_mark_read', { conversation_id_value: conversation.id })
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function startWith(profileId) {
    setNotice('')
    const { data, error } = await supabase.rpc('pr_dm_open', { target_profile_id: profileId })
    if (error || !data?.success) { setNotice(data?.error || error?.message || 'No pudimos abrir el chat.'); return }
    const inbox = await loadInbox({ silent: true })
    const found = inbox.find((item) => item.id === data.conversation_id)
    if (found) await openConversation(found)
  }

  async function sendMessage(event) {
    event?.preventDefault()
    const body = draft.trim()
    if (!body || !active?.id || sending) return
    setSending(true)
    setDraft('')
    const { data, error } = await supabase.rpc('pr_dm_send', { conversation_id_value: active.id, body_value: body })
    if (error || !data?.success) {
      setDraft(body)
      setNotice(data?.error || error?.message || 'No se pudo enviar el mensaje.')
      setSending(false)
      return
    }
    const { data: rows } = await supabase.rpc('pr_dm_messages', { conversation_id_value: active.id })
    setMessages(Array.isArray(rows) ? rows : [])
    await loadInbox({ silent: true })
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      const inbox = await loadInbox()
      if (!alive) return
      const chatId = params.get('chat')
      if (chatId) {
        const found = inbox.find((item) => item.id === chatId)
        if (found) await openConversation(found)
      } else if (initialFriend) await startWith(initialFriend)
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!active?.id) return
    const timer = window.setInterval(async () => {
      const { data } = await supabase.rpc('pr_dm_messages', { conversation_id_value: active.id })
      if (Array.isArray(data)) setMessages(data)
    }, 12000)
    return () => window.clearInterval(timer)
  }, [active?.id])

  if (active) {
    return <AppLayout title="PR Chat" showBack>
      <div className="pr-page pb-28 animate-page-enter">
        <section className="sticky top-0 z-20 -mx-1 mb-4 border-b border-white/[0.06] bg-[#09090e]/90 px-1 pb-3 pt-1 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setActive(null); setParams({}, { replace: true }) }} className="grid h-11 w-11 place-items-center rounded-[17px] border border-white/10 bg-white/[0.035] text-white/70">←</button>
            <Avatar profile={activeOther} small />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-white">{nameOf(activeOther)}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.13em] text-emerald-300/65">Amigo PR · chat privado</p></div>
          </div>
        </section>

        {notice && <div className="mb-4 rounded-2xl border border-orange-300/15 bg-orange-400/[0.07] p-3 text-xs text-orange-100/80">{notice}</div>}

        <div className="space-y-2.5">
          {messages.length === 0 && <div className="py-14 text-center"><div className="text-4xl">👋</div><h2 className="mt-4 font-display text-2xl text-white">Empiecen a rodar la charla.</h2><p className="mx-auto mt-2 max-w-[270px] text-xs leading-relaxed text-white/32">Este espacio es privado entre ustedes. Mandá el primer mensaje.</p></div>}
          {messages.map((m) => <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-[22px] px-4 py-3 ${m.is_mine ? 'rounded-br-md bg-gradient-to-br from-sky-300 to-cyan-300 text-[#071018]' : 'rounded-bl-md border border-white/[0.07] bg-white/[0.045] text-white'}`}>
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{m.body}</p>
              <p className={`mt-1.5 text-right text-[8px] font-bold ${m.is_mine ? 'text-black/45' : 'text-white/25'}`}>{timeOf(m.created_at)}{m.is_mine && m.read_at ? ' · leído' : ''}</p>
            </div>
          </div>)}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="fixed bottom-[72px] left-1/2 z-40 w-full max-w-[520px] -translate-x-1/2 border-t border-white/[0.07] bg-[#09090e]/95 p-3 backdrop-blur-xl">
          <div className="flex items-end gap-2 rounded-[24px] border border-white/[0.09] bg-white/[0.04] p-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 1200))} rows={1} placeholder="Escribí un mensaje…" className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/25" />
            <button type="submit" disabled={!draft.trim() || sending} className="grid h-11 w-11 shrink-0 place-items-center rounded-[17px] bg-gradient-to-br from-sky-300 to-cyan-300 font-black text-[#071018] disabled:opacity-30">➤</button>
          </div>
        </form>
      </div>
    </AppLayout>
  }

  return <AppLayout title="PR Chat" showBack>
    <div className="pr-page space-y-5 pb-12 animate-page-enter">
      <section className="relative overflow-hidden rounded-[34px] border border-violet-300/15 bg-gradient-to-br from-[#251934] via-[#11121a] to-[#08080d] p-5">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200/70">PR CHAT · SOLO AMIGOS</p><h1 className="mt-2 font-display text-[36px] leading-none text-white">Más cerca,<br/>también fuera de pista.</h1><p className="mt-3 max-w-[300px] text-sm leading-relaxed text-white/40">Conversaciones privadas entre miembros de tu comunidad Punta Rollers.</p></div>
      </section>

      {notice && <div className="rounded-2xl border border-orange-300/15 bg-orange-400/[0.07] p-3 text-xs text-orange-100/80">{notice}</div>}

      {friends.length > 0 && <section><div className="mb-3 px-1"><p className="section-label">Nuevo mensaje</p><h2 className="mt-1 font-display text-2xl text-white">Tus amigos</h2></div><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{friends.map((f) => <button key={f.id} type="button" onClick={() => startWith(f.id)} className="w-[72px] shrink-0 text-center"><div className="mx-auto rounded-full bg-gradient-to-br from-violet-300 to-sky-300 p-[2px]"><div className="overflow-hidden rounded-full bg-[#101018] p-[2px]"><div className="h-14 w-14 overflow-hidden rounded-full grid place-items-center">{f.foto ? <img src={f.foto} alt={nameOf(f)} className="h-full w-full object-cover"/> : <span className="text-xl">🛼</span>}</div></div></div><p className="mt-2 truncate text-[9px] font-bold text-white/55">{f.nombre}</p></button>)}</div></section>}

      <section><div className="mb-3 px-1"><p className="section-label">Bandeja privada</p><h2 className="mt-1 font-display text-2xl text-white">Conversaciones</h2></div>
        {loading ? <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-white/35">Cargando PR Chat…</div> : conversations.length === 0 ? <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-7 text-center"><div className="text-4xl">💬</div><h3 className="mt-4 font-display text-2xl text-white">Todavía no hay chats</h3><p className="mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-white/32">Cuando tengas amigos, tocá uno arriba para empezar una conversación.</p><button onClick={() => navigate('/app/comunidad')} className="mt-5 rounded-2xl bg-gradient-to-r from-sky-300 to-cyan-300 px-5 py-3 text-xs font-black text-[#071018]">Descubrir comunidad</button></div> : <div className="space-y-2">{conversations.map((c) => <button key={c.id} type="button" onClick={() => openConversation(c)} className="flex w-full items-center gap-3 rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-3.5 text-left active:scale-[0.99]"><Avatar profile={c.other_profile} small/><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-black text-white">{nameOf(c.other_profile)}</p><span className="text-[9px] text-white/25">{dayOf(c.last_message_at || c.updated_at)}</span></div><p className={`mt-1 truncate text-[11px] ${c.unread_count > 0 ? 'font-bold text-white/70' : 'text-white/30'}`}>{c.last_message || 'Conversación lista para empezar'}</p></div>{c.unread_count > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-sky-300 px-1 text-[9px] font-black text-[#071018]">{c.unread_count > 9 ? '9+' : c.unread_count}</span>}</button>)}</div>}
      </section>
    </div>
  </AppLayout>
    }
