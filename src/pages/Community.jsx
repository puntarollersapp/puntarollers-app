import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const tabs = [
  { id: 'explorar', label: 'Descubrir', icon: '✨' },
  { id: 'solicitudes', label: 'Solicitudes', icon: '🤝' },
  { id: 'amigos', label: 'Amigos', icon: '👥' },
]
const fullName = (p) => [p?.nombre, p?.apellido].filter(Boolean).join(' ').trim() || 'Roller PR'
const clean = (v) => String(v || '').trim()

function Avatar({ profile, className = 'h-14 w-14 rounded-[20px]' }) {
  return <div className={`${className} shrink-0 overflow-hidden border border-white/10 bg-white/[.04] grid place-items-center`}>
    {profile?.foto ? <img src={profile.foto} alt={fullName(profile)} className="h-full w-full object-cover" /> : <span className="text-xl">🛼</span>}
  </div>
}

function Pill({ children, tone = 'neutral' }) {
  const styles = { neutral: 'border-white/10 bg-white/[.04] text-white/42', sky: 'border-sky-300/15 bg-sky-400/[.08] text-sky-200', green: 'border-emerald-300/15 bg-emerald-400/[.08] text-emerald-200' }
  return <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] ${styles[tone]}`}>{children}</span>
}

function ProfileCard({ profile, busy, onSendRequest, onCancelRequest, onAcceptRequest, onRejectRequest, onRemoveFriend, onMessageFriend }) {
  const relationship = profile.relationship_status || 'none'
  return <article className="rounded-[24px] border border-white/[.07] bg-[#0d0e13] p-4">
    <div className="flex gap-3">
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black text-white">{fullName(profile)}</h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {profile.ciudad && <Pill>{profile.ciudad}</Pill>}
          {profile.verificado && <Pill tone="sky">Verificado</Pill>}
          {relationship === 'friend' && <Pill tone="green">Amigo PR</Pill>}
        </div>
        {profile.sobre_mi && <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/38">{profile.sobre_mi}</p>}
      </div>
    </div>
    <div className="mt-3">
      {relationship === 'incoming' && <div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => onRejectRequest(profile.request_id)} className="rounded-2xl border border-white/10 py-3 text-xs font-bold text-white/50">Rechazar</button><button disabled={busy} onClick={() => onAcceptRequest(profile.request_id)} className="rounded-2xl bg-orange-500 py-3 text-xs font-black text-black">Aceptar</button></div>}
      {relationship === 'outgoing' && <button disabled={busy} onClick={() => onCancelRequest(profile.request_id)} className="w-full rounded-2xl border border-white/10 py-3 text-xs font-bold text-white/55">Solicitud enviada · cancelar</button>}
      {relationship === 'friend' && <div className="grid grid-cols-[1fr_auto] gap-2"><button disabled={busy} onClick={() => onMessageFriend(profile.id)} className="rounded-2xl bg-orange-500 py-3 text-xs font-black text-black">💬 Escribir</button><button disabled={busy} onClick={() => onRemoveFriend(profile.id)} className="rounded-2xl border border-white/10 px-4 text-white/45">···</button></div>}
      {relationship === 'none' && <button disabled={busy} onClick={() => onSendRequest(profile.id)} className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 py-3 text-xs font-black text-black">Agregar a mi círculo</button>}
    </div>
  </article>
}

function Empty({ icon, title, text }) {
  return <div className="rounded-[26px] border border-white/[.07] bg-white/[.025] p-7 text-center"><div className="text-3xl">{icon}</div><h3 className="mt-3 font-display text-2xl text-white">{title}</h3><p className="mx-auto mt-2 max-w-[280px] text-xs leading-5 text-white/35">{text}</p></div>
}

export default function CommunityPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('explorar')
  const [query, setQuery] = useState('')
  const [directory, setDirectory] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const requestCount = incomingRequests.length

  async function loadCommunity() {
    setLoading(true)
    const { data, error } = await supabase.rpc('community_get_dashboard')
    if (error) { setMessage(`No pudimos cargar Comunidad: ${error.message}`); setLoading(false); return }
    const p = data || {}
    setIncomingRequests(Array.isArray(p.incoming_requests) ? p.incoming_requests : [])
    setOutgoingRequests(Array.isArray(p.outgoing_requests) ? p.outgoing_requests : [])
    setFriends(Array.isArray(p.friends) ? p.friends : [])
    setLoading(false)
  }

  async function loadSuggestions() {
    const { data } = await supabase.rpc('community_search_profiles', { search_text: '' })
    const rows = Array.isArray(data) ? data : []
    // Solo una vidriera corta. Priorizamos perfiles con foto y que todavía no sean amigos.
    const ordered = [...rows].sort((a, b) => Number(Boolean(b.foto)) - Number(Boolean(a.foto)))
    setSuggestions(ordered.filter((p) => (p.relationship_status || 'none') !== 'friend').slice(0, 8))
  }

  async function searchProfiles(value) {
    const q = clean(value)
    if (q.length < 2) { setDirectory([]); setSearching(false); return }
    setSearching(true)
    const { data, error } = await supabase.rpc('community_search_profiles', { search_text: q })
    if (error) { setMessage(`No pudimos buscar perfiles: ${error.message}`); setDirectory([]) }
    else setDirectory(Array.isArray(data) ? data : [])
    setSearching(false)
  }

  useEffect(() => { loadCommunity(); loadSuggestions() }, [])
  useEffect(() => { const id = setTimeout(() => searchProfiles(query), 300); return () => clearTimeout(id) }, [query])

  async function runAction(name, args, success, target) {
    setBusyId(target || name); setMessage('')
    const { data, error } = await supabase.rpc(name, args)
    if (error || data?.success === false) { setMessage(data?.error || error?.message || 'No pudimos completar la acción.'); setBusyId(''); return }
    setMessage(success)
    await Promise.all([loadCommunity(), loadSuggestions(), query.length >= 2 ? searchProfiles(query) : Promise.resolve()])
    setBusyId('')
  }
  const sendRequest = (id) => runAction('community_send_friend_request', { target_profile_id: id }, 'Solicitud enviada.', id)
  const cancelRequest = (id) => runAction('community_cancel_friend_request', { request_id_value: id }, 'Solicitud cancelada.', id)
  const acceptRequest = (id) => runAction('community_accept_friend_request', { request_id_value: id }, 'Ahora son amigos.', id)
  const rejectRequest = (id) => runAction('community_reject_friend_request', { request_id_value: id }, 'Solicitud rechazada.', id)
  const messageFriend = (id) => navigate(`/app/mensajes?with=${encodeURIComponent(id)}`)
  const removeFriend = (id) => { if (window.confirm('¿Eliminar esta amistad?')) runAction('community_remove_friend', { target_profile_id: id }, 'Amistad eliminada.', id) }

  const list = useMemo(() => activeTab === 'amigos' ? friends : activeTab === 'solicitudes' ? incomingRequests : directory, [activeTab, friends, incomingRequests, directory])
  const props = { busy: Boolean(busyId), onSendRequest: sendRequest, onCancelRequest: cancelRequest, onAcceptRequest: acceptRequest, onRejectRequest: rejectRequest, onRemoveFriend: removeFriend, onMessageFriend: messageFriend }

  return <AppLayout title="Comunidad" showBack>
    <div className="pr-page space-y-5 pb-12 animate-page-enter">
      <section className="relative overflow-hidden rounded-[34px] border border-orange-400/15 bg-[#0b0b0f] p-5">
        <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-orange-400">⚡ COMUNIDAD PR</p><h1 className="mt-2 font-display text-[38px] leading-[.95] text-white">Rodamos juntos.<br/><span className="text-orange-400">También acá.</span></h1></div><div className="grid h-14 w-14 place-items-center rounded-2xl border border-orange-400/15 bg-orange-500/10 text-2xl">👥</div></div>
          <p className="mt-4 max-w-[315px] text-sm leading-6 text-white/42">Encontrá compañeros, armá tu círculo y hablá en privado. La parte social de Punta Rollers, sin exponer tus datos deportivos ni personales.</p>
          <div className="mt-5 flex items-center gap-5 border-t border-white/[.06] pt-4"><div><b className="text-xl text-white">{friends.length}</b><p className="text-[8px] uppercase tracking-[.14em] text-white/25">amigos</p></div><div><b className="text-xl text-orange-300">{requestCount}</b><p className="text-[8px] uppercase tracking-[.14em] text-white/25">solicitudes</p></div><div className="ml-auto"><Pill tone="green">🔒 privado</Pill></div></div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[['1','🔎','Buscá','Encontrá por nombre'],['2','🤝','Conectá','Acepten amistad'],['3','💬','Charlá','Chat solo amigos']].map(([n,i,t,x]) => <div key={n} className="rounded-[20px] border border-white/[.07] bg-white/[.025] p-3"><span className="text-lg">{i}</span><p className="mt-2 text-[11px] font-black text-white">{t}</p><p className="mt-1 text-[9px] leading-4 text-white/28">{x}</p></div>)}
      </section>

      <button onClick={() => navigate('/app/mensajes')} className="w-full rounded-[25px] border border-orange-400/15 bg-gradient-to-r from-orange-500/[.12] to-white/[.025] p-4 text-left active:scale-[.99]">
        <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-[17px] bg-orange-500 text-xl">💬</div><div className="flex-1"><p className="text-[9px] font-black uppercase tracking-[.16em] text-orange-300">PR CHAT</p><p className="mt-0.5 text-sm font-black text-white">Tus conversaciones</p><p className="mt-1 text-[10px] text-white/32">Mensajes, fotos y audios con tus amigos PR.</p></div><span className="text-white/30">→</span></div>
      </button>

      {message && <div className="rounded-2xl border border-orange-300/15 bg-orange-400/[.07] p-3 text-xs text-orange-100/80">{message}</div>}

      {!loading && friends.length > 0 && <section><div className="mb-3 flex items-end justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-white/28">TU CÍRCULO</p><h2 className="mt-1 font-display text-2xl text-white">Gente que ya rueda con vos</h2></div><button onClick={() => setActiveTab('amigos')} className="text-[10px] font-black text-orange-300">Ver amigos</button></div><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{friends.slice(0,8).map(f => <button key={f.id} onClick={() => messageFriend(f.id)} className="w-[70px] shrink-0 text-center"><div className="mx-auto rounded-full bg-gradient-to-br from-orange-400 to-amber-200 p-[2px]"><Avatar profile={f} className="h-14 w-14 rounded-full border-2 border-[#09090e]" /></div><p className="mt-2 truncate text-[9px] font-bold text-white/55">{f.nombre}</p></button>)}</div></section>}

      <section className="rounded-[28px] border border-white/[.07] bg-white/[.025] p-2"><div className="grid grid-cols-3 gap-2">{tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`relative min-h-14 rounded-[20px] text-[10px] font-black ${activeTab===t.id ? 'bg-orange-500 text-black' : 'text-white/40'}`}><span className="mr-1">{t.icon}</span>{t.label}{t.id==='solicitudes'&&requestCount>0&&<span className="absolute right-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] text-white">{requestCount}</span>}</button>)}</div></section>

      {activeTab === 'explorar' && <>
        <section><p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[.18em] text-white/28">BUSCAR EN PUNTA ROLLERS</p><div className="rounded-[22px] border border-white/[.09] bg-[#0d0e13] p-2"><div className="flex items-center gap-2"><span className="pl-2 text-lg text-orange-300">⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Escribí un nombre…" className="min-h-12 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/25" />{query && <button onClick={()=>setQuery('')} className="px-3 text-white/30">×</button>}</div></div><p className="mt-2 px-1 text-[10px] text-white/25">Escribí al menos 2 letras. No mostramos una lista interminable de alumnos.</p></section>

        {query.length < 2 && suggestions.length > 0 && <section><div className="mb-3"><p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300/70">PARA DESCUBRIR</p><h2 className="mt-1 font-display text-2xl text-white">Algunos rollers de la comunidad</h2><p className="mt-1 text-[10px] text-white/28">Una pequeña selección. Deslizá para conocer más.</p></div><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{suggestions.map(p => <div key={p.id} className="w-[145px] shrink-0 rounded-[22px] border border-white/[.07] bg-[#0d0e13] p-3"><Avatar profile={p} className="h-16 w-16 rounded-[20px]"/><p className="mt-3 truncate text-xs font-black text-white">{fullName(p)}</p><p className="mt-1 truncate text-[9px] text-white/30">{p.ciudad || 'Punta Rollers'}</p><button disabled={busyId} onClick={()=>sendRequest(p.id)} className="mt-3 w-full rounded-xl bg-white/[.06] py-2 text-[9px] font-black text-orange-300">+ Conectar</button></div>)}</div></section>}
      </>}

      {loading ? <div className="rounded-[24px] border border-white/[.07] p-5 text-xs text-white/35">Cargando Comunidad…</div> : <section className="space-y-3">
        {activeTab==='explorar' && query.length>=2 && searching && <div className="py-8 text-center text-xs text-white/30">Buscando rollers…</div>}
        {activeTab==='explorar' && query.length>=2 && !searching && list.length===0 && <Empty icon="🔎" title="No encontramos ese nombre" text="Probá con nombre o apellido. Solo aparecen perfiles habilitados para Comunidad."/>}
        {activeTab==='explorar' && query.length>=2 && list.map(p=><ProfileCard key={p.id} profile={p} {...props}/>)}
        {activeTab==='solicitudes' && list.length===0 && <Empty icon="🤝" title="Todo al día" text="Cuando alguien quiera conectar con vos, aparecerá acá."/>}
        {activeTab==='solicitudes' && list.map(p=><ProfileCard key={p.id} profile={p} {...props}/>)}
        {activeTab==='amigos' && list.length===0 && <Empty icon="👥" title="Tu círculo empieza acá" text="Usá Descubrir para encontrar compañeros y mandar una solicitud."/>}
        {activeTab==='amigos' && list.map(p=><ProfileCard key={p.id} profile={p} {...props}/>)}
      </section>}

      {activeTab==='solicitudes' && outgoingRequests.length>0 && <section><p className="mb-3 text-[9px] font-black uppercase tracking-[.18em] text-white/28">ENVIADAS POR VOS</p><div className="space-y-3">{outgoingRequests.map(p=><ProfileCard key={p.id} profile={p} {...props}/>)}</div></section>}

      <section className="rounded-[24px] border border-emerald-300/10 bg-emerald-400/[.04] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-200/70">🔒 TU PARTE PRIVADA SIGUE PRIVADA</p><p className="mt-2 text-[11px] leading-5 text-white/35">Comunidad no comparte pagos, PIN, email, devoluciones, objetivos, tiempos ni resultados deportivos. Vos decidís con quién conectar.</p><p className="mt-2 text-[9px] text-white/20">Sesión: {user?.nombre || 'Alumno PR'}</p></section>
    </div>
  </AppLayout>
}
