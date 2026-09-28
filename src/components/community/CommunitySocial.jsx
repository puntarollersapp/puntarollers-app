import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const REACTIONS = [['heart','❤️'],['fire','🔥'],['skate','🛼'],['clap','👏']]
const MAX_FILE = 25 * 1024 * 1024
const POST_LIMIT = 10
const ALBUM_BATCH_LIMIT = 30

export default function CommunitySocial() {
  const [posts, setPosts] = useState([])
  const [notes, setNotes] = useState([])
  const [friends, setFriends] = useState([])
  const [albums, setAlbums] = useState([])
  const [body, setBody] = useState('')
  const [postFiles, setPostFiles] = useState([])
  const [tags, setTags] = useState([])
  const [comments, setComments] = useState({})
  const [mode, setMode] = useState('post')
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumMembers, setAlbumMembers] = useState([])
  const [albumTarget, setAlbumTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const postInput = useRef(null)
  const createAlbumInput = useRef(null)
  const addAlbumInput = useRef(null)

  async function load() {
    const [{ data: p }, { data: n }, { data: f }, { data: a }] = await Promise.all([
      supabase.rpc('community_social_feed'),
      supabase.rpc('community_my_notifications'),
      supabase.rpc('community_my_friends'),
      supabase.rpc('community_my_albums'),
    ])
    setPosts(Array.isArray(p) ? p : [])
    setNotes(Array.isArray(n) ? n : [])
    setFriends(Array.isArray(f) ? f : [])
    setAlbums(Array.isArray(a) ? a : [])
  }

  useEffect(() => { load() }, [])

  function toggle(list, setter, id) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  function validateFiles(fileList, limit) {
    const all = [...fileList]
    const picked = all.slice(0, limit)
    if (all.length > limit) setMsg(`Podés subir hasta ${limit} fotos por tanda.`)
    if (picked.some((file) => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > MAX_FILE)) {
      setMsg('Las fotos deben ser JPG, PNG o WEBP de hasta 25 MB cada una.')
      return []
    }
    return picked
  }

  async function uploadPhotos(files, kind) {
    const bucket = kind === 'album' ? 'community-albums' : 'community-media'
    const urls = []
    for (const file of files) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const { data: path, error: pathError } = await supabase.rpc('community_media_path', { p_kind: kind, p_ext: ext })
      if (pathError) throw pathError
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      urls.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl)
    }
    return urls
  }

  function pickPostFiles(event) {
    const picked = validateFiles(event.target.files, POST_LIMIT)
    setPostFiles(picked)
    if (picked.length) setMsg(`${picked.length} foto${picked.length === 1 ? '' : 's'} lista${picked.length === 1 ? '' : 's'} para el post.`)
  }

  async function publishPost() {
    if (!body.trim() && !postFiles.length) return
    setBusy(true)
    setMsg('Publicando…')
    try {
      const urls = await uploadPhotos(postFiles, 'post')
      const { error } = await supabase.rpc('community_create_post', {
        p_body: body.trim() || null,
        p_media_paths: urls,
        p_tag_profile_ids: tags,
      })
      if (error) throw error
      setBody('')
      setPostFiles([])
      setTags([])
      if (postInput.current) postInput.current.value = ''
      setMsg('✓ Post publicado para tus amigos.')
      await load()
    } catch (error) {
      setMsg(`No pudimos publicar: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  function beginCreateAlbum() {
    if (!albumTitle.trim()) {
      setMsg('Poné un nombre al álbum antes de elegir las fotos.')
      return
    }
    createAlbumInput.current?.click()
  }

  async function createAlbumFromFiles(event) {
    const picked = validateFiles(event.target.files, ALBUM_BATCH_LIMIT)
    if (!picked.length) return
    setBusy(true)
    setMsg('Creando álbum y subiendo fotos…')
    try {
      const { data: albumId, error: createError } = await supabase.rpc('community_create_album', {
        p_title: albumTitle.trim(),
        p_description: null,
        p_member_ids: albumMembers,
      })
      if (createError) throw createError
      const urls = await uploadPhotos(picked, 'album')
      for (const url of urls) {
        const { error } = await supabase.rpc('community_add_album_photo', { p_album_id: albumId, p_media_path: url, p_caption: null })
        if (error) throw error
      }
      setAlbumTitle('')
      setAlbumMembers([])
      if (createAlbumInput.current) createAlbumInput.current.value = ''
      setMsg('✓ Álbum creado con sus fotos. Después pueden seguir agregando más.')
      await load()
    } catch (error) {
      setMsg(`No pudimos crear el álbum: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  function openAlbumUploader(album) {
    setAlbumTarget(album)
    requestAnimationFrame(() => addAlbumInput.current?.click())
  }

  async function addPhotosToAlbum(event) {
    const picked = validateFiles(event.target.files, ALBUM_BATCH_LIMIT)
    if (!picked.length || !albumTarget) return
    setBusy(true)
    setMsg(`Subiendo fotos a ${albumTarget.title}…`)
    try {
      const urls = await uploadPhotos(picked, 'album')
      for (const url of urls) {
        const { error } = await supabase.rpc('community_add_album_photo', { p_album_id: albumTarget.id, p_media_path: url, p_caption: null })
        if (error) throw error
      }
      setMsg(`✓ ${picked.length} foto${picked.length === 1 ? '' : 's'} agregada${picked.length === 1 ? '' : 's'} al álbum.`)
      await load()
    } catch (error) {
      setMsg(`No pudimos agregar las fotos: ${error.message}`)
    } finally {
      setBusy(false)
      setAlbumTarget(null)
      if (addAlbumInput.current) addAlbumInput.current.value = ''
    }
  }

  async function react(post, reaction) {
    await supabase.rpc('community_toggle_reaction', { p_post_id: post.id, p_reaction: reaction })
    load()
  }

  async function comment(post) {
    const value = (comments[post.id] || '').trim()
    if (!value) return
    await supabase.rpc('community_add_comment', { p_post_id: post.id, p_body: value })
    setComments((prev) => ({ ...prev, [post.id]: '' }))
    load()
  }

  async function repost(post) {
    await supabase.rpc('community_toggle_repost', { p_post_id: post.id })
    load()
  }

  async function readAll() {
    await supabase.rpc('community_mark_notifications_read')
    load()
  }

  const unread = notes.filter((n) => !n.read_at).length

  return (
    <div className="space-y-4">
      <input ref={postInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickPostFiles} />
      <input ref={createAlbumInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={createAlbumFromFiles} />
      <input ref={addAlbumInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={addPhotosToAlbum} />

      <section className="rounded-[28px] border border-violet-300/15 bg-[#0d0e13] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black tracking-[.18em] text-violet-300">🔔 TU COMUNIDAD</p>
            <h2 className="mt-1 font-display text-2xl text-white">Notificaciones {unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 py-1 text-[10px]">{unread}</span>}</h2>
          </div>
          {unread > 0 && <button onClick={readAll} className="text-[9px] font-black text-violet-200">MARCAR LEÍDAS</button>}
        </div>
        {notes.length ? <div className="mt-3 space-y-2">{notes.slice(0,5).map((n) => <div key={n.id} className={`rounded-2xl border p-3 text-xs ${n.read_at ? 'border-white/[.05] text-white/35' : 'border-violet-300/20 bg-violet-500/[.08] text-white/75'}`}>{n.text}</div>)}</div> : <p className="mt-3 text-xs text-white/30">Etiquetas, comentarios, reacciones e invitaciones aparecen acá.</p>}
      </section>

      <section className="rounded-[30px] border border-orange-300/15 bg-gradient-to-br from-orange-500/[.09] to-transparent p-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMode('post')} className={`rounded-2xl py-3 text-[10px] font-black ${mode === 'post' ? 'bg-orange-500 text-black' : 'bg-white/[.04] text-white/50'}`}>＋ POST</button>
          <button onClick={() => setMode('album')} className={`rounded-2xl py-3 text-[10px] font-black ${mode === 'album' ? 'bg-violet-500 text-white' : 'bg-white/[.04] text-white/50'}`}>▦ ÁLBUM COLABORATIVO</button>
        </div>

        {mode === 'post' ? <>
          <div className="mt-3 rounded-2xl border border-orange-300/10 bg-orange-500/[.04] p-3">
            <p className="text-[10px] font-black text-orange-100">Post normal</p>
            <p className="mt-1 text-[9px] leading-4 text-white/35">Compartí texto o hasta 10 fotos con tus amigos. Esto aparece en el feed.</p>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1200} placeholder="¿Qué pasó hoy sobre ruedas?" className="mt-3 w-full resize-none rounded-2xl border border-white/[.08] bg-black/20 p-3 text-sm text-white outline-none" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => postInput.current?.click()} className="rounded-2xl border border-white/10 bg-white/[.04] py-3 text-[10px] font-black text-white">📷 {postFiles.length ? `${postFiles.length} FOTO${postFiles.length > 1 ? 'S' : ''}` : 'SUBIR FOTOS'}</button>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] py-3 text-center text-[10px] font-black text-white">👥 ETIQUETAR</div>
          </div>
          {postFiles.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto">{postFiles.map((file,index) => <img key={index} src={URL.createObjectURL(file)} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />)}</div>}
          {friends.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{friends.map((friend) => <button key={friend.id} onClick={() => toggle(tags,setTags,friend.id)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${tags.includes(friend.id) ? 'border-orange-300 bg-orange-500/15 text-orange-200' : 'border-white/10 text-white/40'}`}>{tags.includes(friend.id) ? '✓ ' : ''}{friend.nombre}</button>)}</div>}
          <button disabled={busy || (!body.trim() && !postFiles.length)} onClick={publishPost} className="mt-3 w-full rounded-2xl bg-orange-500 py-3 text-xs font-black text-black disabled:opacity-30">{busy ? 'PUBLICANDO…' : 'PUBLICAR POST'}</button>
          <p className="mt-2 text-[9px] text-white/25">Hasta 10 fotos por post · 25 MB cada una · solo tus amigos.</p>
        </> : <>
          <div className="mt-3 rounded-2xl border border-violet-300/15 bg-violet-500/[.06] p-3">
            <p className="text-[10px] font-black text-violet-100">Álbum colaborativo</p>
            <p className="mt-1 text-[9px] leading-4 text-white/40">Pensado para salidas y rolleadas. Crealo con las primeras fotos y después todos los colaboradores aceptados pueden seguir sumando.</p>
          </div>
          <input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="Ej: 21 km · Masa Crítica" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none" />
          <p className="mt-3 text-[9px] font-black text-white/35">INVITÁ COLABORADORES</p>
          <div className="mt-2 flex gap-2 overflow-x-auto">{friends.map((friend) => <button key={friend.id} onClick={() => toggle(albumMembers,setAlbumMembers,friend.id)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${albumMembers.includes(friend.id) ? 'border-violet-300 bg-violet-500/15 text-violet-100' : 'border-white/10 text-white/40'}`}>{albumMembers.includes(friend.id) ? '✓ ' : ''}{friend.nombre}</button>)}</div>
          <button disabled={busy || !albumTitle.trim()} onClick={beginCreateAlbum} className="mt-4 w-full rounded-2xl bg-violet-500 py-3 text-xs font-black text-white disabled:opacity-30">{busy ? 'CREANDO…' : 'CREAR ÁLBUM Y ELEGIR FOTOS'}</button>
          <p className="mt-2 text-[9px] leading-4 text-white/25">Al tocar el botón se abre tu galería. Hasta 30 fotos por tanda; después pueden seguir agregando más.</p>
        </>}
        {msg && <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2 text-[9px] text-white/60">{msg}</p>}
      </section>

      {albums.length > 0 && <section>
        <p className="mb-1 text-[9px] font-black tracking-wider text-violet-300">ÁLBUMES DE TU CÍRCULO</p>
        <p className="mb-2 text-[9px] text-white/25">No quedan limitados a una sola tanda. Se pueden seguir completando.</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {albums.map((album) => <article key={album.id} className="w-60 shrink-0 rounded-[24px] border border-violet-300/10 bg-violet-500/[.05] p-4">
            <p className="text-sm font-black text-white">{album.title}</p>
            <p className="mt-1 text-[9px] text-white/30">{album.status === 'owner' ? 'Creado por vos' : `de ${album.owner_name}`}</p>
            {album.photos?.length > 0 && <div className="mt-3 grid grid-cols-3 gap-1">{album.photos.slice(0,6).map((photo) => <img key={photo.id} src={photo.url} alt="" className="aspect-square w-full rounded-lg object-cover" />)}</div>}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[9px] text-violet-200/60">{album.photos?.length || 0} fotos</span>
              {(album.status === 'owner' || album.status === 'accepted') && <button disabled={busy} onClick={() => openAlbumUploader(album)} className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1.5 text-[8px] font-black text-violet-100">＋ AGREGAR FOTOS</button>}
            </div>
          </article>)}
        </div>
      </section>}

      <section className="space-y-3">
        {posts.map((post) => <article key={post.id} className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#0d0e13]">
          <div className="p-4">
            <div className="flex items-center gap-2">
              {post.author?.foto ? <img src={post.author.foto} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="h-9 w-9 rounded-full bg-orange-500/15" />}
              <div><p className="text-xs font-black text-white">{post.author?.nombre} {post.author?.apellido}</p><p className="text-[8px] text-white/25">POST DE TU CÍRCULO</p></div>
            </div>
            {post.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/75">{post.body}</p>}
            {post.tags?.length > 0 && <p className="mt-2 text-[9px] text-violet-200/60">con {post.tags.map((tag) => tag.nombre).join(', ')}</p>}
          </div>
          {post.media?.length > 0 && <div className={`grid gap-0.5 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{post.media.map((media) => <img key={media.id} src={media.url} alt="" className="aspect-square w-full object-cover" />)}</div>}
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {REACTIONS.map(([key,emoji]) => <button key={key} onClick={() => react(post,key)} className="rounded-full border border-white/10 px-3 py-2 text-xs">{emoji} {post.reactions?.filter((r) => r.reaction === key).length || ''}</button>)}
              <button onClick={() => repost(post)} className={`rounded-full border px-3 py-2 text-[10px] font-black ${post.reposted ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-white/40'}`}>↻ REPOST {post.repost_count || ''}</button>
            </div>
            {post.comments?.length > 0 && <div className="mt-3 space-y-1">{post.comments.map((item) => <div key={item.id} className="rounded-xl bg-white/[.035] px-3 py-2 text-[11px] text-white/55"><b className="text-white/70">{item.nombre}</b> {item.body}</div>)}</div>}
            <div className="mt-3 flex gap-2"><input value={comments[post.id] || ''} onChange={(e) => setComments((prev) => ({ ...prev, [post.id]: e.target.value }))} placeholder="Comentá…" className="min-h-11 flex-1 rounded-2xl border border-white/[.08] bg-black/20 px-3 text-xs text-white outline-none" /><button onClick={() => comment(post)} className="rounded-2xl bg-white/[.07] px-4 text-xs font-black text-white">↑</button></div>
          </div>
        </article>)}
        {!posts.length && <div className="rounded-[26px] border border-dashed border-white/10 p-8 text-center text-xs text-white/30">Todavía no hay publicaciones. Podés inaugurar el nuevo feed.</div>}
      </section>
    </div>
  )
}
