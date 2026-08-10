import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'prday-media'
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const MAX_IMAGE_EDGE = 1600

const fullName = (profile) =>
  [profile?.nombre, profile?.apellido].filter(Boolean).join(' ').trim() ||
  'Rollero PR'

function remainingLabel(expiresAt, now = Date.now()) {
  const remaining = new Date(expiresAt).getTime() - now
  if (!Number.isFinite(remaining) || remaining <= 0) return 'finalizado'
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.max(0, Math.floor((remaining % 3600000) / 60000))
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`
}

function timeAgo(value) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 60000) return 'ahora'
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `hace ${hours} h` : 'hoy'
}

function normalizeError(error, fallback) {
  const message = String(error?.message || error || '').trim()
  if (message.includes('Tu PRday sigue activo')) {
    return 'Tu PRday sigue activo. Podrás publicar otro cuando termine el contador.'
  }
  if (message.includes('row-level security')) {
    return 'Esta cuenta todavía no tiene permiso para usar PRday.'
  }
  return message || fallback
}

async function compressImage(file) {
  if (!file) throw new Error('Elegí una foto para continuar.')

  let source
  let sourceUrl = ''

  try {
    if ('createImageBitmap' in window) {
      source = await createImageBitmap(file)
    } else {
      sourceUrl = URL.createObjectURL(file)
      source = await new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('No pudimos leer esa imagen.'))
        image.src = sourceUrl
      })
    }

    const sourceWidth = source.width || source.naturalWidth
    const sourceHeight = source.height || source.naturalHeight
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight))
    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    context.drawImage(source, 0, 0, width, height)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.84)
    )

    if (!blob) throw new Error('No pudimos preparar esa imagen.')
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error('La foto sigue siendo demasiado pesada. Probá con otra.')
    }

    return new File([blob], 'prday.webp', { type: 'image/webp' })
  } finally {
    if (source?.close) source.close()
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
  }
}

function ProfileAvatar({ profile, className = 'h-11 w-11' }) {
  return (
    <div
      className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#0a0a0f] bg-gradient-to-br from-orange-500 to-amber-200`}
    >
      {profile?.foto ? (
        <img
          src={profile.foto}
          alt={fullName(profile)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-lg">🛼</span>
      )}
    </div>
  )
}

function StoryCard({ post, profile, reactions, comments, now, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[4/5] w-[190px] shrink-0 snap-start overflow-hidden rounded-[26px] border border-white/10 bg-[#111118] text-left shadow-[0_18px_50px_rgba(0,0,0,.28)] active:scale-[.985]"
    >
      {post.mediaUrl ? (
        <img
          src={post.mediaUrl}
          alt={`PRday de ${fullName(profile)}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
        />
      ) : (
        <div className="grid h-full place-items-center bg-gradient-to-br from-orange-500/20 to-violet-500/10 text-4xl">
          🛼
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/20" />
      <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
        <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-white backdrop-blur-md">
          PRday
        </span>
        <span className="rounded-full border border-orange-300/20 bg-black/55 px-2.5 py-1.5 text-[8px] font-black text-orange-200 backdrop-blur-md">
          {remainingLabel(post.expires_at, now)}
        </span>
      </div>
      <div className="absolute inset-x-3 bottom-3">
        <div className="flex items-center gap-2">
          <ProfileAvatar profile={profile} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black text-white">
              {fullName(profile)}
            </p>
            <p className="text-[8px] text-white/55">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        {post.caption && (
          <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/80">
            {post.caption}
          </p>
        )}
        <div className="mt-2 flex gap-2 text-[8px] font-black text-white/65">
          <span>⚡ {reactions}</span>
          <span>💬 {comments}</span>
        </div>
      </div>
    </button>
  )
}

export default function PRDayModule({ user, onConnect }) {
  const fileInputRef = useRef(null)
  const [access, setAccess] = useState('loading')
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [ownWindow, setOwnWindow] = useState(null)
  const [profiles, setProfiles] = useState({})
  const [reactions, setReactions] = useState([])
  const [comments, setComments] = useState([])
  const [selectedPostId, setSelectedPostId] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [busyReaction, setBusyReaction] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let active = true

    async function checkAccess() {
      if (!user?.id) {
        if (active) setAccess('denied')
        return
      }
      const { data, error: accessError } = await supabase
        .from('prday_testers')
        .select('enabled')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (!active) return
      setAccess(!accessError && data?.enabled ? 'granted' : 'denied')
    }

    checkAccess()
    return () => {
      active = false
    }
  }, [user?.id])

  async function loadFeed() {
    if (!user?.id || access !== 'granted') return
    setLoading(true)
    setError('')
    const isoNow = new Date().toISOString()

    const [postsResult, ownResult] = await Promise.all([
      supabase
        .from('prday_posts')
        .select('id,profile_id,caption,media_path,created_at,expires_at,deleted_at')
        .is('deleted_at', null)
        .gt('expires_at', isoNow)
        .order('created_at', { ascending: false }),
      supabase
        .from('prday_posts')
        .select('id,profile_id,caption,media_path,created_at,expires_at,deleted_at')
        .eq('profile_id', user.id)
        .maybeSingle(),
    ])

    if (postsResult.error) {
      setError(normalizeError(postsResult.error, 'No pudimos cargar PRday.'))
      setLoading(false)
      return
    }

    const rows = Array.isArray(postsResult.data) ? postsResult.data : []
    const postIds = rows.map((post) => post.id)
    const authorIds = rows.map((post) => post.profile_id)

    const [reactionResult, commentResult, urlResults] = await Promise.all([
      postIds.length
        ? supabase
            .from('prday_reactions')
            .select('id,post_id,profile_id,reaction,created_at')
            .in('post_id', postIds)
        : Promise.resolve({ data: [], error: null }),
      postIds.length
        ? supabase
            .from('prday_comments')
            .select('id,post_id,profile_id,body,created_at')
            .in('post_id', postIds)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      Promise.all(
        rows.map((post) =>
          supabase.storage.from(BUCKET).createSignedUrl(post.media_path, 3600)
        )
      ),
    ])

    const nextComments = Array.isArray(commentResult.data)
      ? commentResult.data
      : []
    const profileIds = [
      ...new Set([
        ...authorIds,
        ...nextComments.map((comment) => comment.profile_id),
      ]),
    ]
    const profileResult = profileIds.length
      ? await supabase
          .from('profiles_feed')
          .select('id,nombre,apellido,foto,verificado')
          .in('id', profileIds)
      : { data: [], error: null }

    const profileMap = Object.fromEntries(
      (profileResult.data || []).map((profile) => [profile.id, profile])
    )
    if (!profileMap[user.id]) {
      profileMap[user.id] = {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        foto: user.foto,
        verificado: user.verificado,
      }
    }

    setProfiles(profileMap)
    setReactions(Array.isArray(reactionResult.data) ? reactionResult.data : [])
    setComments(nextComments)
    setPosts(
      rows.map((post, index) => ({
        ...post,
        mediaUrl: urlResults[index]?.data?.signedUrl || '',
      }))
    )
    setOwnWindow(ownResult.data || null)
    setLoading(false)
  }

  useEffect(() => {
    if (access !== 'granted') return undefined
    loadFeed()
    const id = window.setInterval(loadFeed, 60000)
    return () => window.clearInterval(id)
  }, [access, user?.id])

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl]
  )

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) || null,
    [posts, selectedPostId]
  )
  const selectedProfile = selectedPost
    ? profiles[selectedPost.profile_id]
    : null
  const selectedComments = selectedPost
    ? comments.filter((comment) => comment.post_id === selectedPost.id)
    : []
  const selectedReactions = selectedPost
    ? reactions.filter((reaction) => reaction.post_id === selectedPost.id)
    : []
  const reactedByMe = selectedReactions.some(
    (reaction) => reaction.profile_id === user?.id
  )
  const blockedUntil = ownWindow?.expires_at
    ? new Date(ownWindow.expires_at).getTime()
    : 0
  const canCreate = !blockedUntil || blockedUntil <= now
  function openComposer() {
    setError('')
    setNotice('')
    if (!canCreate) {
      setNotice(
        `Tu próximo PRday se habilita en ${remainingLabel(
          ownWindow.expires_at,
          now
        )}.`
      )
      return
    }
    setComposerOpen(true)
  }

  function closeComposer() {
    if (publishing) return
    setComposerOpen(false)
  }

  async function handleFile(event) {
    const original = event.target.files?.[0]
    event.target.value = ''
    if (!original) return
    setError('')
    try {
      const prepared = await compressImage(original)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setSelectedFile(prepared)
      setPreviewUrl(URL.createObjectURL(prepared))
    } catch (fileError) {
      setError(normalizeError(fileError, 'No pudimos preparar esa foto.'))
    }
  }

  async function publish() {
    if (!selectedFile || publishing) {
      setError('Elegí una foto para continuar.')
      return
    }

    setPublishing(true)
    setError('')
    const path = `${user.id}/${crypto.randomUUID()}.webp`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, selectedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp',
      })

    if (uploadError) {
      setError(normalizeError(uploadError, 'No pudimos subir la foto.'))
      setPublishing(false)
      return
    }

    const { data, error: createError } = await supabase.rpc(
      'prday_create_post',
      { p_caption: caption, p_media_path: path }
    )

    if (createError) {
      await supabase.storage.from(BUCKET).remove([path])
      setError(normalizeError(createError, 'No pudimos publicar tu PRday.'))
      setPublishing(false)
      return
    }

    if (data?.previous_media_path && data.previous_media_path !== path) {
      await supabase.storage
        .from(BUCKET)
        .remove([data.previous_media_path])
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl('')
    setCaption('')
    setComposerOpen(false)
    setNotice('Tu PRday ya está vivo durante 24 horas ⚡')
    setPublishing(false)
    await loadFeed()
  }

  async function toggleReaction() {
    if (!selectedPost || busyReaction) return
    setBusyReaction(true)
    setError('')
    const ownReaction = reactions.find(
      (reaction) =>
        reaction.post_id === selectedPost.id &&
        reaction.profile_id === user.id
    )

    const result = ownReaction
      ? await supabase
          .from('prday_reactions')
          .delete()
          .eq('id', ownReaction.id)
      : await supabase.from('prday_reactions').insert({
          post_id: selectedPost.id,
          profile_id: user.id,
          reaction: 'impulso',
        })

    if (result.error) {
      setError(normalizeError(result.error, 'No pudimos guardar tu reacción.'))
    } else {
      await loadFeed()
    }
    setBusyReaction(false)
  }

  async function addComment(event) {
    event.preventDefault()
    const body = commentBody.trim()
    if (!selectedPost || !body || commenting) return
    setCommenting(true)
    setError('')
    const { error: commentError } = await supabase
      .from('prday_comments')
      .insert({
        post_id: selectedPost.id,
        profile_id: user.id,
        body,
      })

    if (commentError) {
      setError(normalizeError(commentError, 'No pudimos publicar tu comentario.'))
    } else {
      setCommentBody('')
      await loadFeed()
    }
    setCommenting(false)
  }

  if (access !== 'granted') return null

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-orange-300/15 bg-[#0c0c12] p-4 shadow-[0_20px_60px_rgba(0,0,0,.2)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300">
              ⚡ PRday · prueba privada
            </p>
            <h2 className="mt-1 font-display text-[28px] leading-none text-white">
              ¿Qué estás haciendo hoy?
            </h2>
            <p className="mt-2 max-w-[250px] text-[10px] leading-4 text-white/35">
              Una foto, unas palabras y 24 horas para compartirlo.
            </p>
          </div>
          <button
            type="button"
            onClick={openComposer}
            className={`shrink-0 rounded-2xl px-3.5 py-3 text-[10px] font-black shadow-lg active:scale-[.98] ${
              canCreate
                ? 'bg-gradient-to-r from-orange-500 to-amber-300 text-black shadow-orange-500/15'
                : 'border border-white/10 bg-white/[.04] text-white/45'
            }`}
          >
            {canCreate
              ? '+ Crear mi PRday'
              : `⏱ ${remainingLabel(ownWindow?.expires_at, now)}`}
          </button>
        </div>

        {(notice || error) && (
          <div
            className={`relative mt-4 rounded-2xl border p-3 text-[10px] leading-4 ${
              error
                ? 'border-red-300/15 bg-red-400/[.07] text-red-100/75'
                : 'border-emerald-300/15 bg-emerald-400/[.06] text-emerald-100/75'
            }`}
          >
            {error || notice}
          </div>
        )}

        {loading ? (
          <div className="relative mt-4 rounded-[22px] border border-white/[.07] bg-white/[.025] p-5 text-center text-[10px] text-white/35">
            Preparando el pulso de hoy…
          </div>
        ) : posts.length ? (
          <div className="relative mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">
                El pulso de hoy
              </p>
              <p className="text-[9px] text-white/25">
                {posts.length} {posts.length === 1 ? 'PRday activo' : 'PRdays activos'}
              </p>
            </div>
            <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {posts.map((post) => (
                <StoryCard
                  key={post.id}
                  post={post}
                  profile={profiles[post.profile_id]}
                  reactions={
                    reactions.filter((reaction) => reaction.post_id === post.id)
                      .length
                  }
                  comments={
                    comments.filter((comment) => comment.post_id === post.id)
                      .length
                  }
                  now={now}
                  onOpen={() => setSelectedPostId(post.id)}
                />
              ))}
            </div>
            <p className="mt-2 text-[9px] text-white/25">
              Deslizá para recorrerlos y tocá uno para reaccionar o comentar.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={openComposer}
            className="relative mt-4 w-full overflow-hidden rounded-[24px] border border-dashed border-orange-300/25 bg-gradient-to-br from-orange-500/[.09] to-violet-500/[.05] p-5 text-left active:scale-[.99]"
          >
            <span className="text-3xl">📸</span>
            <p className="mt-3 text-sm font-black text-white">
              {canCreate ? 'Sé el primero en encender PRday' : 'Tu PRday está descansando'}
            </p>
            <p className="mt-1 max-w-[280px] text-[10px] leading-4 text-white/35">
              {canCreate
                ? 'Probalo con una foto real de tu día. Solo tu cuenta puede ver esta función.'
                : `Tu publicación sigue activa. Faltan ${remainingLabel(
                    ownWindow?.expires_at,
                    now
                  )}.`}
            </p>
          </button>
        )}

        <div className="relative mt-4 flex items-center gap-2 border-t border-white/[.06] pt-3 text-[9px] text-white/24">
          <span>🛡️</span>
          <span>Visible únicamente para tu cuenta durante esta prueba.</span>
        </div>
      </section>

      {composerOpen && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 px-3 py-4 backdrop-blur-xl">
          <div className="mx-auto flex min-h-full max-w-[430px] items-center">
            <section className="w-full rounded-[30px] border border-white/10 bg-[#101018] p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">
                    Tu momento de hoy
                  </p>
                  <h3 className="mt-1 font-display text-3xl text-white">
                    Crear mi PRday
                  </h3>
                  <p className="mt-1 text-[10px] text-white/35">
                    Se mostrará durante 24 horas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-lg text-white/55"
                >
                  ×
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative mt-4 grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[24px] border border-dashed border-orange-300/30 bg-gradient-to-br from-orange-500/10 to-violet-500/10"
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Vista previa de tu PRday"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-3 rounded-full bg-black/65 px-3 py-2 text-[9px] font-black text-white backdrop-blur-md">
                      Cambiar foto
                    </span>
                  </>
                ) : (
                  <span className="text-center">
                    <b className="block text-4xl">📸</b>
                    <strong className="mt-3 block text-xs text-white">
                      Tomar o elegir una foto
                    </strong>
                    <span className="mt-1 block text-[9px] text-white/30">
                      La optimizamos para Android y iPhone
                    </span>
                  </span>
                )}
              </button>

              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={220}
                placeholder="¿Qué estás haciendo hoy?"
                className="mt-3 min-h-24 w-full resize-none rounded-[20px] border border-white/10 bg-white/[.04] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-300/35"
              />
              <div className="mt-1 text-right text-[8px] text-white/20">
                {caption.length}/220
              </div>

              {error && (
                <div className="mt-2 rounded-2xl border border-red-300/15 bg-red-400/[.07] p-3 text-[10px] text-red-100/75">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={publish}
                disabled={publishing || !selectedFile}
                className="mt-3 min-h-14 w-full rounded-[19px] bg-gradient-to-r from-orange-500 to-amber-300 text-xs font-black text-black shadow-lg shadow-orange-500/15 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {publishing ? 'Publicando tu momento…' : 'Publicar por 24 horas ⚡'}
              </button>
              <p className="mt-3 text-center text-[9px] leading-4 text-white/25">
                Solo podés publicar uno cada 24 horas.
              </p>
            </section>
          </div>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 px-3 py-4 backdrop-blur-xl">
          <div className="mx-auto flex min-h-full max-w-[430px] items-center">
            <article className="w-full overflow-hidden rounded-[30px] border border-white/10 bg-[#0e0e15] shadow-2xl">
              <div className="flex items-center gap-3 p-4">
                <ProfileAvatar profile={selectedProfile} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">
                    {fullName(selectedProfile)}
                    {selectedProfile?.verificado ? ' ✓' : ''}
                  </p>
                  <p className="mt-1 text-[9px] text-white/35">
                    {timeAgo(selectedPost.created_at)} · quedan{' '}
                    {remainingLabel(selectedPost.expires_at, now)}
                  </p>
                </div>
                {selectedPost.profile_id !== user.id && (
                  <button
                    type="button"
                    onClick={() => onConnect?.(selectedPost.profile_id)}
                    className="rounded-xl border border-orange-300/20 bg-orange-500/10 px-3 py-2 text-[9px] font-black text-orange-200"
                  >
                    + Conectar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPostId('')}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/55"
                >
                  ×
                </button>
              </div>

              <div className="relative aspect-[4/5] overflow-hidden bg-black">
                <img
                  src={selectedPost.mediaUrl}
                  alt={`PRday de ${fullName(selectedProfile)}`}
                  className="h-full w-full object-contain"
                />
                <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-[9px] font-black text-orange-200 backdrop-blur-md">
                  PRday · {remainingLabel(selectedPost.expires_at, now)}
                </span>
              </div>

              <div className="p-4">
                {selectedPost.caption && (
                  <p className="text-sm leading-6 text-white/80">
                    {selectedPost.caption}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleReaction}
                    disabled={busyReaction}
                    className={`min-h-12 rounded-2xl border text-[10px] font-black ${
                      reactedByMe
                        ? 'border-orange-300/30 bg-orange-500/15 text-orange-200'
                        : 'border-white/10 bg-white/[.04] text-white/55'
                    }`}
                  >
                    ⚡ {selectedReactions.length} impulsos
                  </button>
                  <div className="grid min-h-12 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-[10px] font-black text-white/55">
                    💬 {selectedComments.length} comentarios
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedComments.length ? (
                    selectedComments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2.5">
                        <ProfileAvatar
                          profile={profiles[comment.profile_id]}
                          className="h-8 w-8"
                        />
                        <div className="min-w-0 flex-1 rounded-2xl bg-white/[.04] px-3 py-2.5">
                          <p className="text-[9px] font-black text-white">
                            {fullName(profiles[comment.profile_id])}
                          </p>
                          <p className="mt-1 break-words text-[10px] leading-4 text-white/60">
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-[10px] text-white/30">
                      Todo vínculo empieza con un comentario buena onda 👋
                    </div>
                  )}
                </div>

                <form onSubmit={addComment} className="mt-4 flex gap-2">
                  <input
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    maxLength={280}
                    placeholder="Escribí algo buena onda…"
                    className="min-h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[.04] px-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-orange-300/35"
                  />
                  <button
                    type="submit"
                    disabled={commenting || !commentBody.trim()}
                    className="grid w-12 place-items-center rounded-2xl bg-orange-500 font-black text-black disabled:opacity-35"
                  >
                    ↑
                  </button>
                </form>

              </div>
            </article>
          </div>
        </div>
      )}
    </>
  )
}
