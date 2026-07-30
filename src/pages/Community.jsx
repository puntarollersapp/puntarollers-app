import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const tabs = [
  { id: 'explorar', label: 'Explorar', icon: '⌕' },
  { id: 'solicitudes', label: 'Solicitudes', icon: '🤝' },
  { id: 'amigos', label: 'Amigos', icon: '👥' },
]

function normalizeText(value) {
  return String(value || '').trim()
}

function fullName(profile) {
  return [profile?.nombre, profile?.apellido].filter(Boolean).join(' ').trim()
}

function Avatar({ profile, size = 'normal' }) {
  const sizeClass = size === 'large' ? 'h-20 w-20 rounded-[26px]' : 'h-14 w-14 rounded-[20px]'

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden border border-white/10 bg-gradient-to-br from-pr-gold/15 to-white/[0.03] grid place-items-center`}
    >
      {profile?.foto ? (
        <img
          src={profile.foto}
          alt={fullName(profile) || 'Perfil'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={size === 'large' ? 'text-3xl' : 'text-xl'}>🛼</span>
      )}
    </div>
  )
}

function StatusPill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.04] text-white/45',
    gold: 'border-pr-gold/20 bg-pr-gold/10 text-pr-gold',
    sky: 'border-sky-300/20 bg-sky-400/10 text-sky-200',
    green: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
    red: 'border-red-300/20 bg-red-400/10 text-red-200',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-7 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-pr-gold/15 bg-pr-gold/[0.08] text-3xl">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-2xl text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-[290px] text-sm leading-relaxed text-white/38">
        {description}
      </p>
    </div>
  )
}

function ProfileCard({
  profile,
  busy,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
}) {
  const relationship = profile.relationship_status || 'none'
  const incoming = relationship === 'incoming'
  const outgoing = relationship === 'outgoing'
  const isFriend = relationship === 'friend'

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-pr-gold/45 to-transparent" />

      <div className="flex items-start gap-4">
        <Avatar profile={profile} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white">
                {fullName(profile)}
              </h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {profile.ciudad && <StatusPill>{profile.ciudad}</StatusPill>}
                {profile.verificado && <StatusPill tone="sky">Verificado</StatusPill>}
                {isFriend && <StatusPill tone="green">Amigos</StatusPill>}
                {incoming && <StatusPill tone="gold">Te envió solicitud</StatusPill>}
                {outgoing && <StatusPill tone="neutral">Solicitud enviada</StatusPill>}
              </div>
            </div>
          </div>

          {profile.sobre_mi && (
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/42">
              {profile.sobre_mi}
            </p>
          )}

          <div className="mt-4">
            {incoming && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRejectRequest(profile.request_id)}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-xs font-bold text-white/55 disabled:opacity-40"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAcceptRequest(profile.request_id)}
                  className="rounded-2xl bg-pr-gold py-3 text-xs font-black text-black disabled:opacity-40"
                >
                  Aceptar
                </button>
              </div>
            )}

            {outgoing && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCancelRequest(profile.request_id)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-xs font-bold text-white/55 disabled:opacity-40"
              >
                Cancelar solicitud
              </button>
            )}

            {isFriend && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemoveFriend(profile.id)}
                className="w-full rounded-2xl border border-red-300/15 bg-red-400/[0.06] py-3 text-xs font-bold text-red-200 disabled:opacity-40"
              >
                Eliminar amistad
              </button>
            )}

            {relationship === 'none' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onSendRequest(profile.id)}
                className="w-full rounded-2xl bg-pr-gold py-3 text-xs font-black text-black disabled:opacity-40"
              >
                Enviar solicitud
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('explorar')
  const [query, setQuery] = useState('')
  const [directory, setDirectory] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')

  const requestCount = incomingRequests.length

  const currentList = useMemo(() => {
    if (activeTab === 'amigos') return friends
    if (activeTab === 'solicitudes') return incomingRequests
    return directory
  }, [activeTab, directory, incomingRequests, friends])

  async function loadCommunity() {
    setLoading(true)

    const { data, error } = await supabase.rpc('community_get_dashboard')

    if (error) {
      setMessage(`No pudimos cargar Comunidad: ${error.message}`)
      setLoading(false)
      return
    }

    const payload = data || {}
    setIncomingRequests(Array.isArray(payload.incoming_requests) ? payload.incoming_requests : [])
    setOutgoingRequests(Array.isArray(payload.outgoing_requests) ? payload.outgoing_requests : [])
    setFriends(Array.isArray(payload.friends) ? payload.friends : [])
    setLoading(false)
  }

  async function searchProfiles(value = query) {
    const cleanQuery = normalizeText(value)
    setSearching(true)

    const { data, error } = await supabase.rpc('community_search_profiles', {
      search_text: cleanQuery,
    })

    if (error) {
      setMessage(`No pudimos buscar perfiles: ${error.message}`)
      setDirectory([])
      setSearching(false)
      return
    }

    setDirectory(Array.isArray(data) ? data : [])
    setSearching(false)
  }

  useEffect(() => {
    loadCommunity()
    searchProfiles('')
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchProfiles(query)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  async function runAction(actionName, args, successMessage, targetId) {
    setBusyId(targetId || actionName)
    setMessage('')

    const { data, error } = await supabase.rpc(actionName, args)

    if (error || data?.success === false) {
      setMessage(data?.error || error?.message || 'No pudimos completar la acción.')
      setBusyId('')
      return
    }

    setMessage(successMessage)
    await Promise.all([loadCommunity(), searchProfiles(query)])
    setBusyId('')
  }

  function sendRequest(profileId) {
    runAction(
      'community_send_friend_request',
      { target_profile_id: profileId },
      'Solicitud enviada.',
      profileId
    )
  }

  function cancelRequest(requestId) {
    runAction(
      'community_cancel_friend_request',
      { request_id_value: requestId },
      'Solicitud cancelada.',
      requestId
    )
  }

  function acceptRequest(requestId) {
    runAction(
      'community_accept_friend_request',
      { request_id_value: requestId },
      'Ahora son amigos.',
      requestId
    )
  }

  function rejectRequest(requestId) {
    runAction(
      'community_reject_friend_request',
      { request_id_value: requestId },
      'Solicitud rechazada.',
      requestId
    )
  }

  function removeFriend(profileId) {
    const confirmed = window.confirm(
      '¿Querés eliminar esta amistad? La otra persona no recibirá una notificación.'
    )

    if (!confirmed) return

    runAction(
      'community_remove_friend',
      { target_profile_id: profileId },
      'Amistad eliminada.',
      profileId
    )
  }

  return (
    <AppLayout title="Comunidad" showBack>
      <div className="pr-page space-y-5 animate-page-enter pb-12">
        <section className="relative overflow-hidden rounded-[34px] border border-sky-300/15 bg-gradient-to-br from-sky-500/[0.12] via-[#11131a] to-[#08080d] p-5 shadow-[0_28px_90px_rgba(14,165,233,0.1)]">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Punta Rollers conecta</p>
              <h1 className="mt-1 font-display text-[34px] leading-none text-white">
                Comunidad
              </h1>
              <p className="mt-3 max-w-[295px] text-sm leading-relaxed text-white/42">
                Encontrá compañeros, conectá con ellos y compartí tu experiencia sin exponer tus datos privados.
              </p>
            </div>

            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border border-sky-300/20 bg-sky-400/10 text-3xl">
              👥
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-[20px] border border-white/[0.07] bg-black/20 p-3 text-center">
              <p className="font-display text-2xl text-white">{friends.length}</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/25">Amigos</p>
            </div>
            <div className="rounded-[20px] border border-white/[0.07] bg-black/20 p-3 text-center">
              <p className="font-display text-2xl text-pr-gold">{requestCount}</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/25">Solicitudes</p>
            </div>
            <div className="rounded-[20px] border border-white/[0.07] bg-black/20 p-3 text-center">
              <p className="font-display text-2xl text-sky-200">Privado</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/25">Resultados</p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-3 text-sm text-pr-gold">
            {message}
          </div>
        )}

        <section className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-2">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative min-h-14 rounded-[21px] px-2 text-[10px] font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-pr-gold text-black'
                    : 'text-white/42'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
                {tab.id === 'solicitudes' && requestCount > 0 && (
                  <span className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white">
                    {requestCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'explorar' && (
          <section>
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-2">
              <div className="flex items-center gap-2">
                <span className="pl-2 text-white/30">⌕</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre..."
                  className="min-h-12 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/25"
                />
                {searching && (
                  <span className="pr-3 text-[10px] text-white/25">Buscando…</span>
                )}
              </div>
            </div>

            <p className="mt-3 px-1 text-[10px] leading-relaxed text-white/28">
              Antes de aceptar una amistad solo se muestran nombre, foto y la información pública habilitada.
            </p>
          </section>
        )}

        {loading ? (
          <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-white/40">
            Cargando Comunidad…
          </div>
        ) : (
          <section className="space-y-3">
            {activeTab === 'explorar' && currentList.length === 0 && (
              <EmptyState
                icon="⌕"
                title="No encontramos perfiles"
                description="Probá con otro nombre o volvé a revisar cuando se sumen más alumnos."
              />
            )}

            {activeTab === 'solicitudes' && currentList.length === 0 && (
              <EmptyState
                icon="🤝"
                title="No tenés solicitudes"
                description="Cuando alguien quiera agregarte, su solicitud aparecerá en esta sección."
              />
            )}

            {activeTab === 'amigos' && currentList.length === 0 && (
              <EmptyState
                icon="👥"
                title="Tu comunidad empieza acá"
                description="Buscá compañeros de Punta Rollers y enviá tu primera solicitud."
              />
            )}

            {currentList.map((profile) => (
              <ProfileCard
                key={`${activeTab}-${profile.id}`}
                profile={profile}
                busy={Boolean(busyId)}
                onSendRequest={sendRequest}
                onCancelRequest={cancelRequest}
                onAcceptRequest={acceptRequest}
                onRejectRequest={rejectRequest}
                onRemoveFriend={removeFriend}
              />
            ))}
          </section>
        )}

        {activeTab === 'solicitudes' && outgoingRequests.length > 0 && (
          <section className="pt-2">
            <p className="section-label px-1">Enviadas por vos</p>
            <div className="mt-3 space-y-3">
              {outgoingRequests.map((profile) => (
                <ProfileCard
                  key={`outgoing-${profile.id}`}
                  profile={profile}
                  busy={Boolean(busyId)}
                  onSendRequest={sendRequest}
                  onCancelRequest={cancelRequest}
                  onAcceptRequest={acceptRequest}
                  onRejectRequest={rejectRequest}
                  onRemoveFriend={removeFriend}
                />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[26px] border border-emerald-300/10 bg-emerald-400/[0.045] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-200/70">
            Privacidad por defecto
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/38">
            Comunidad nunca muestra documento, PIN, email, pagos, devoluciones, objetivos, tiempos ni resultados deportivos de otro alumno.
          </p>
          <p className="mt-3 text-[10px] text-white/24">
            Sesión activa: {user?.nombre || 'Alumno PR'}
          </p>
        </section>
      </div>
    </AppLayout>
  )
      }
