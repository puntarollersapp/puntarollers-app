import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {useSocialStatus} from '../components/community/PRSocial2'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
const dateLabel=value=>{const d=new Date(value),now=new Date();if(d.toDateString()===now.toDateString())return 'Hoy';const yesterday=new Date(now);yesterday.setDate(now.getDate()-1);return d.toDateString()===yesterday.toDateString()?'Ayer':d.toLocaleDateString('es-UY',{day:'numeric',month:'long',year:'numeric'})}
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
  const { user } = useAuth()
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
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const recorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const status=useSocialStatus(),modern=Boolean(status?.enabled),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[messageMenu,setMessageMenu]=useState(null),[chatMenu,setChatMenu]=useState(false),[chatLoading,setChatLoading]=useState(false),[newChat,setNewChat]=useState(false),[lightbox,setLightbox]=useState(null)
  const activeRef=useRef(null),refreshRef=useRef(null),openingRef=useRef(false),recorderStream=useRef(null),mounted=useRef(true),inboxSequence=useRef(0)
  const matches=p=>normalize(nameOf(p)).includes(normalize(query))
  const visibleConversations=modern?conversations.filter(c=>matches(c.other_profile)&&(filter!=='unread'||Number(c.unread_count)>0)):conversations
  const visibleFriends=modern?friends.filter(matches):friends
  const unreadTotal=conversations.reduce((sum,c)=>sum+Math.max(0,Number(c.unread_count)||0),0)
  const notifyChanged=()=>window.dispatchEvent(new Event('pr-notifications-changed'))
  const activeOther = useMemo(() => active?.other_profile || null, [active])

  async function loadInbox({ silent = false } = {}) {
    const seq=++inboxSequence.current
    if (!silent) setLoading(true)
    const [{ data: inbox, error: inboxError }, { data: community }] = await Promise.all([
      supabase.rpc('pr_dm_inbox'),
      supabase.rpc('community_get_dashboard'),
    ])
    if(!mounted.current||seq!==inboxSequence.current)return Array.isArray(inbox)?inbox:[]
    if (inboxError) setNotice('No pudimos actualizar tus mensajes. Revisá tu conexión.')
    else setConversations(Array.isArray(inbox) ? inbox : [])
    setFriends(Array.isArray(community?.friends) ? community.friends : [])
    if (!silent) setLoading(false)
    return Array.isArray(inbox) ? inbox : []
  }

  async function openConversation(conversation) {
    if(sending||uploading||recording)return
    activeRef.current=conversation.id
    setActive(conversation)
    setDraft('');setMessageMenu(null);setChatMenu(false);setChatLoading(true)
    setMessages([])
    setNotice('')
    setParams({ chat: conversation.id }, { replace: true })
    const { data, error } = await supabase.rpc('pr_dm_messages', { conversation_id_value: conversation.id })
    if(!mounted.current||activeRef.current!==conversation.id)return
    setChatLoading(false)
    if (error) { setNotice(error.message); return }
    setMessages(Array.isArray(data) ? data : [])
    const {error:readError}=await supabase.rpc('pr_dm_mark_read', { conversation_id_value: conversation.id })
    if(!readError){notifyChanged();loadInbox({silent:true})}
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function startWith(profileId) {
    if(openingRef.current)return;openingRef.current=true
    setNotice('')
    try{const { data, error } = await supabase.rpc('pr_dm_open', { target_profile_id: profileId })
    if (error || !data?.success) { setNotice(data?.error || error?.message || 'No pudimos abrir el chat.'); return }
    const inbox = await loadInbox({ silent: true })
    const found = inbox.find((item) => item.id === data.conversation_id)
    if (found) await openConversation(found);else setNotice('No pudimos encontrar la conversación. Intentá nuevamente.')}finally{openingRef.current=false}
  }

  async function refreshActive({ markRead = true } = {}) {
    const id=activeRef.current
    if(!id||refreshRef.current===id||document.visibilityState==='hidden')return
    refreshRef.current=id
    try{const { data,error } = await supabase.rpc('pr_dm_messages', { conversation_id_value: id })
    if(!mounted.current||activeRef.current!==id)return
    if (!error&&Array.isArray(data)) setMessages(old=>JSON.stringify(old)===JSON.stringify(data)?old:data)
    if (!error&&markRead&&data?.some(m=>!m.is_mine&&!m.read_at)){const{error:readError}=await supabase.rpc('pr_dm_mark_read', { conversation_id_value: id });if(!readError)notifyChanged()}
    }finally{if(refreshRef.current===id)refreshRef.current=null}
  }

  async function uploadMedia(file, mediaType) {
    if (!file || !active?.id || uploading) return
    if(mediaType==='image'&&!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){setNotice('Elegí una imagen JPG, PNG, WEBP o GIF.');return}
    if (file.size > 10 * 1024 * 1024) {
      setNotice('El archivo supera el máximo de 10 MB.')
      return
    }
    setUploading(true)
    setNotice('')
    try {
      const ext = (file.name?.split('.').pop() || (mediaType === 'audio' ? 'webm' : 'jpg')).replace(/[^a-z0-9]/gi, '')
      const objectPath = `${active.id}/${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('pr-chat-media').upload(objectPath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from('pr-chat-media').getPublicUrl(objectPath)
      const { data, error } = await supabase.rpc('pr_dm_send_media', {
        conversation_id_value: active.id,
        media_type_value: mediaType,
        media_url_value: publicData.publicUrl,
        media_name_value: file.name || null,
        body_value: null,
      })
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'No se pudo enviar el archivo.')
      await refreshActive()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
    } catch (error) {
      setNotice(error.message || 'No se pudo enviar el archivo.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    try {
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setNotice('Este dispositivo no permite grabar audio desde el navegador.');return}
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });recorderStream.current=stream
      if(!mounted.current){stream.getTracks().forEach(t=>t.stop());return}
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunksRef.current.push(event.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        recorderStream.current=null
        if(!mounted.current)return
        setRecording(false)
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const ext=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm'
        const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' })
        await uploadMedia(file, 'audio')
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      recorderStream.current?.getTracks().forEach(t=>t.stop());recorderStream.current=null
      setNotice('Necesitamos permiso del micrófono para grabar un audio.')
    }
  }

  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      setNotice('Este navegador no permite notificaciones web.')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    if (permission === 'granted') setNotice('Avisos activados. Mientras Punta Rollers esté abierta podremos avisarte de mensajes nuevos.')
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

  async function deleteForMe(messageId) {
    const confirmed = window.confirm('¿Ocultar este mensaje solo para vos?')
    if (!confirmed) return

    const { data, error } = await supabase.rpc('pr_dm_hide_message', {
      message_id_value: messageId,
    })

    if (error || !data?.success) {
      setNotice(data?.error || error?.message || 'No se pudo ocultar el mensaje.')
      return
    }

    await refreshActive()
  }

  async function deleteForAll(messageId) {
    const confirmed = window.confirm(
      '¿Eliminar este mensaje para ambos? Esta acción no se puede deshacer.'
    )
    if (!confirmed) return

    const { data, error } = await supabase.rpc('pr_dm_delete_message_for_all', {
      message_id_value: messageId,
    })

    if (error || !data?.success) {
      setNotice(data?.error || error?.message || 'No se pudo eliminar el mensaje.')
      return
    }

    await refreshActive()
  }

  async function clearForMe() {
    if (!active?.id) return
    const confirmed = window.confirm(
      '¿Dejar esta conversación vacía solo para vos? La otra persona seguirá viendo sus mensajes.'
    )
    if (!confirmed) return

    const { data, error } = await supabase.rpc('pr_dm_clear_for_me', {
      conversation_id_value: active.id,
    })

    if (error || !data?.success) {
      setNotice(data?.error || error?.message || 'No se pudo limpiar la conversación.')
      return
    }

    setMessages([])
    await loadInbox({ silent: true })
    setNotice('Conversación limpia para vos.')
  }

  async function adminClearForAll() {
    if (!active?.id || user?.role !== 'admin') return
    const confirmed = window.confirm(
      '¿Vaciar esta conversación PARA AMBOS? Usalo solo para pruebas o moderación.'
    )
    if (!confirmed) return

    const { data, error } = await supabase.rpc('pr_dm_admin_clear_conversation', {
      conversation_id_value: active.id,
    })

    if (error || !data?.success) {
      setNotice(data?.error || error?.message || 'No se pudo vaciar la conversación.')
      return
    }

    setMessages([])
    await loadInbox({ silent: true })
    setNotice('Chat vaciado para ambos.')
  }

  useEffect(() => {
    let alive = true;mounted.current=true
    ;(async () => {
      const inbox = await loadInbox()
      if (!alive) return
      const chatId = params.get('chat')
      if (chatId) {
        const found = inbox.find((item) => item.id === chatId)
        if (found) await openConversation(found)
      } else if (initialFriend) await startWith(initialFriend)
    })()
    return () => { alive = false;mounted.current=false;activeRef.current=null;if(recorderRef.current){recorderRef.current.onstop=null;if(recorderRef.current.state==='recording')recorderRef.current.stop()}recorderStream.current?.getTracks().forEach(t=>t.stop()) }
  }, [])

  useEffect(() => {
    if(!user?.id)return
    let timer=null;const reload=()=>{if(document.visibilityState==='hidden')return;clearTimeout(timer);timer=setTimeout(()=>{if(activeRef.current)refreshActive();loadInbox({silent:true})},220)}
    const channel=supabase.channel('pr-messenger-live-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'pr_dm_messages'},reload).subscribe()
    const interval=window.setInterval(reload,active?.id?8000:20000);window.addEventListener('focus',reload);document.addEventListener('visibilitychange',reload);return()=>{clearTimeout(timer);clearInterval(interval);supabase.removeChannel(channel);window.removeEventListener('focus',reload);document.removeEventListener('visibilitychange',reload)}
  }, [active?.id,user?.id])
  useEffect(()=>{if(!modern||(!messageMenu&&!chatMenu&&!lightbox))return;const handler=e=>{if(e.key==='Escape'){setMessageMenu(null);setChatMenu(false);setLightbox(null)}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[modern,messageMenu,chatMenu,lightbox])
  function exitChat(){if(sending||uploading||recording)return;activeRef.current=null;setActive(null);setDraft('');setMessageMenu(null);setChatMenu(false);setParams({}, {replace:true});loadInbox({silent:true})}

  if (active) {
    return <AppLayout title={modern?'PR Messenger':'PR Chat'} showBack>
      <div className="pr-page pb-28 animate-page-enter">
        <section className="sticky top-0 z-20 -mx-1 mb-4 border-b border-white/[0.06] bg-[#09090e]/90 px-1 pb-3 pt-1 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button type="button" onClick={exitChat} disabled={sending||uploading||recording} className="grid h-11 w-11 place-items-center rounded-[17px] border border-white/10 bg-white/[0.035] text-white/70">←</button>
            {modern?<button type="button" disabled={sending||uploading||recording} aria-label="Ver perfil de tu amigo" onClick={()=>navigate('/app/comunidad/perfil/'+encodeURIComponent(activeOther.id))}><Avatar profile={activeOther} small /></button>:<Avatar profile={activeOther} small />}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-white">{nameOf(activeOther)}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.13em] text-emerald-300/65">Amigo PR · chat privado</p></div>
            {modern?<button type="button" onClick={()=>setChatMenu(v=>!v)} aria-expanded={chatMenu} aria-label="Opciones del chat" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-xl text-violet-100">···</button>:<><button type="button" onClick={clearForMe} className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] border border-white/10 bg-white/[0.035] text-sm text-white/55" aria-label="Limpiar para mí">🧹</button>
            {user?.role === 'admin' && <button type="button" onClick={adminClearForAll} className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] border border-red-400/15 bg-red-500/[0.08] text-sm text-red-200" aria-label="Vaciar para ambos">⚠️</button>}</>}
          </div>
          {modern&&chatMenu&&<div className="mt-2 space-y-2 rounded-2xl border border-violet-300/20 bg-[#191324] p-3"><button type="button" onClick={()=>{setChatMenu(false);clearForMe()}} className="block w-full rounded-xl bg-white/5 p-3 text-left text-xs text-white">Limpiar conversación solo para mí</button>{user?.role==='admin'&&<button type="button" onClick={()=>{setChatMenu(false);adminClearForAll()}} className="block w-full rounded-xl bg-red-500/10 p-3 text-left text-xs text-red-200">Vaciar para ambos (administración)</button>}<button type="button" onClick={()=>setChatMenu(false)} className="w-full p-2 text-xs text-white/60">Cancelar</button></div>}
        </section>

        {notice && <div className="mb-4 rounded-2xl border border-orange-300/15 bg-orange-400/[0.07] p-3 text-xs text-orange-100/80">{notice}</div>}

        <div className="space-y-2.5">
          {chatLoading&&<p role="status" className="p-6 text-center text-xs text-violet-200/70">Abriendo conversación…</p>}{!chatLoading&&messages.length === 0 && <div className="py-14 text-center"><div className="text-4xl">👋</div><h2 className="mt-4 font-display text-2xl text-white">Empiecen a rodar la charla.</h2><p className="mx-auto mt-2 max-w-[270px] text-xs leading-relaxed text-white/32">Este espacio es privado entre ustedes. Mandá el primer mensaje.</p></div>}
          {messages.map((m,index) => <div key={m.id}>{modern&&(index===0||dateLabel(messages[index-1].created_at)!==dateLabel(m.created_at))&&<p className="my-4 text-center text-[10px] font-bold text-white/45">{dateLabel(m.created_at)}</p>}<div className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-[22px] px-4 py-3 ${m.is_mine ? (modern?'rounded-br-md bg-gradient-to-br from-[#7750c5] to-[#50309c] text-white':'rounded-br-md bg-gradient-to-br from-sky-300 to-cyan-300 text-[#071018]') : 'rounded-bl-md border border-white/[0.07] bg-white/[0.045] text-white'}`}>
              {m.media_type === 'image' && m.media_url && (modern?<button type="button" onClick={()=>setLightbox(m.media_url)} aria-label="Ampliar foto"><img src={m.media_url} loading="lazy" alt="Foto compartida" className="mb-2 max-h-[360px] w-full rounded-[16px] object-contain"/></button>:<img src={m.media_url} alt="Foto compartida" className="mb-2 max-h-[360px] w-full rounded-[16px] object-cover" />)}
              {m.media_type === 'audio' && m.media_url && <audio src={m.media_url} controls preload="metadata" className="mb-1 w-[245px] max-w-full" />}
              {m.body && <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{m.body}</p>}
              <div className="mt-1.5 flex items-center justify-end gap-2">
                <p className={`text-right text-[8px] font-bold ${m.is_mine ? (modern?'text-white/70':'text-black/45') : 'text-white/40'}`}>{timeOf(m.created_at)}{m.is_mine?(m.read_at?' · ✓✓ Leído':modern?' · ✓ Enviado':''):''}</p>
                <button
                  type="button"
                  onClick={() => {
                    if(modern){setMessageMenu(m);return}
                    if (m.is_mine) {
                      const choice = window.confirm('Aceptar = eliminar para ambos. Cancelar = ocultar solo para vos.')
                      if (choice) deleteForAll(m.id)
                      else deleteForMe(m.id)
                    } else {
                      deleteForMe(m.id)
                    }
                  }}
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${m.is_mine ? (modern?'text-white/75':'text-black/45') : 'text-white/50'}`}
                  aria-label="Opciones del mensaje"
                >
                  ···
                </button>
              </div>
            </div>
          </div></div>)}
          <div ref={bottomRef} />
        </div>

        {modern&&messageMenu&&<div role="dialog" aria-modal="true" aria-label="Opciones del mensaje" className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/75 p-4" onClick={()=>setMessageMenu(null)}><div className="w-full max-w-md space-y-2 rounded-3xl border border-violet-300/20 bg-[#191324] p-4" onClick={e=>e.stopPropagation()}><h2 className="text-sm font-bold text-white">Opciones del mensaje</h2>{messageMenu.body&&<button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(messageMenu.body);setNotice('Mensaje copiado.')}catch{setNotice('No pudimos copiar el mensaje.')}setMessageMenu(null)}} className="w-full rounded-xl bg-white/5 p-3 text-left text-xs text-white">Copiar texto</button>}<button type="button" onClick={()=>{const id=messageMenu.id;setMessageMenu(null);deleteForMe(id)}} className="w-full rounded-xl bg-white/5 p-3 text-left text-xs text-white">Ocultar solo para mí</button>{messageMenu.is_mine&&<button type="button" onClick={()=>{const id=messageMenu.id;setMessageMenu(null);deleteForAll(id)}} className="w-full rounded-xl bg-red-500/10 p-3 text-left text-xs text-red-200">Eliminar para ambos</button>}<button type="button" onClick={()=>setMessageMenu(null)} className="w-full p-3 text-xs text-violet-200">Cancelar</button></div></div>}{modern&&lightbox&&<div role="dialog" aria-modal="true" aria-label="Foto ampliada" className="fixed inset-0 z-[9990] flex flex-col items-center justify-center bg-black/95 p-4" onClick={()=>setLightbox(null)}><button type="button" className="mb-3 self-end rounded-xl bg-white/10 p-3 text-white" onClick={()=>setLightbox(null)}>Cerrar ×</button><img src={lightbox} alt="Foto ampliada" className="max-h-[75vh] max-w-full object-contain" onClick={e=>e.stopPropagation()}/></div>}
        <form data-pr-chat-composer="true" onSubmit={sendMessage} className="fixed bottom-[72px] left-1/2 z-40 w-full max-w-[520px] -translate-x-1/2 border-t border-white/[0.07] bg-[#09090e]/95 p-3 backdrop-blur-xl">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0], 'image')} />
          <div className="flex items-end gap-1.5 rounded-[24px] border border-white/[0.09] bg-white/[0.04] p-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || recording} className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] text-lg text-white/65 active:bg-white/10 disabled:opacity-30" aria-label="Enviar foto">📷</button>
            <button type="button" onClick={toggleRecording} disabled={uploading} className={`grid h-11 w-11 shrink-0 place-items-center rounded-[16px] text-lg ${recording ? 'bg-red-500 text-white animate-pulse' : 'text-white/65 active:bg-white/10'} disabled:opacity-30`} aria-label={recording?"Detener grabación y enviar audio":"Grabar audio"}>{recording ? '■' : '🎙️'}</button>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 1200))} rows={1} placeholder={recording ? 'Grabando audio…' : uploading ? 'Subiendo…' : 'Mensaje…'} className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/25" />
            <button type="submit" disabled={!draft.trim() || sending || uploading || recording} aria-label="Enviar mensaje" className={"grid h-11 w-11 shrink-0 place-items-center rounded-[17px] font-black disabled:opacity-30 "+(modern?"bg-violet-500 text-white":"bg-gradient-to-br from-orange-400 to-amber-300 text-[#130b04]")}>➤</button>
          </div>
        </form>
      </div>
    </AppLayout>
  }

  return <AppLayout title={modern?"PR Messenger":"PR Chat"} showBack>
    <div className="pr-page space-y-5 pb-12 animate-page-enter">
      {modern?<section className="rounded-[26px] border border-violet-300/20 bg-gradient-to-br from-[#241936] to-[#111019] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.18em] text-violet-300">PUNTA ROLLERS / NETWORK</p><h1 className="mt-1 font-display text-3xl text-white">Messenger<span className="text-violet-400">.</span></h1><p className="mt-2 text-xs text-white/60">{unreadTotal>0?unreadTotal+" mensajes sin leer":"Conversaciones con tu círculo"}</p></div><button type="button" onClick={()=>setNewChat(v=>!v)} aria-expanded={newChat} className="shrink-0 rounded-2xl bg-violet-500 px-4 py-3 text-xs font-bold text-white">＋ Nuevo</button></div><label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3"><span aria-hidden="true">⌕</span><input aria-label="Buscar conversaciones y amigos" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar amigos o chats…" className="min-h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none"/></label><div className="mt-3 flex gap-2">{[["all","Todos"],["unread","Sin leer"]].map(([key,label])=><button key={key} type="button" aria-pressed={filter===key} onClick={()=>setFilter(key)} className={"rounded-xl px-4 py-3 text-xs font-bold "+(filter===key?"bg-violet-500/30 text-violet-100":"bg-white/5 text-white/60")}>{label}{key==="unread"&&unreadTotal>0?" · "+unreadTotal:""}</button>)}</div></section>:<section className="relative overflow-hidden rounded-[34px] border border-violet-300/15 bg-gradient-to-br from-[#251934] via-[#11121a] to-[#08080d] p-5">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200/70">PR CHAT · SOLO AMIGOS</p><h1 className="mt-2 font-display text-[36px] leading-none text-white">Más cerca,<br/>también fuera de pista.</h1><p className="mt-3 max-w-[300px] text-sm leading-relaxed text-white/40">Conversaciones privadas entre miembros de tu comunidad Punta Rollers.</p></div>
      </section>}

      {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
        <button type="button" onClick={enableNotifications} className="w-full rounded-[22px] border border-orange-300/15 bg-orange-400/[0.07] p-3.5 text-left">
          <div className="flex items-center gap-3"><span className="text-xl">🔔</span><div><p className="text-xs font-black text-white">Activar avisos de PR Chat</p><p className="mt-0.5 text-[10px] text-white/35">Enterate cuando llegue un mensaje mientras la app esté abierta.</p></div></div>
        </button>
      )}

      {notice && <div className="rounded-2xl border border-orange-300/15 bg-orange-400/[0.07] p-3 text-xs text-orange-100/80">{notice}</div>}

      {friends.length > 0 && (!modern||newChat||Boolean(query.trim())) && <section><div className="mb-3 px-1"><p className="section-label">Nuevo mensaje</p><h2 className="mt-1 font-display text-2xl text-white">Tus amigos</h2></div><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{visibleFriends.map((f) => <button key={f.id} type="button" onClick={() => startWith(f.id)} className="w-[72px] shrink-0 text-center"><div className="mx-auto rounded-full bg-gradient-to-br from-violet-300 to-sky-300 p-[2px]"><div className="overflow-hidden rounded-full bg-[#101018] p-[2px]"><div className="h-14 w-14 overflow-hidden rounded-full grid place-items-center">{f.foto ? <img src={f.foto} alt={nameOf(f)} className="h-full w-full object-cover"/> : <span className="text-xl">🛼</span>}</div></div></div><p className="mt-2 truncate text-[9px] font-bold text-white/55">{f.nombre}</p></button>)}</div></section>}

      <section><div className="mb-3 px-1"><p className="section-label">Bandeja privada</p><h2 className="mt-1 font-display text-2xl text-white">Conversaciones</h2></div>
        {loading ? <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-white/35">Cargando PR Chat…</div> : visibleConversations.length === 0 ? <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-7 text-center"><div className="text-4xl">💬</div><h3 className="mt-4 font-display text-2xl text-white">{modern&&conversations.length?'No hay coincidencias':'Todavía no hay chats'}</h3><p className="mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-white/32">{modern&&conversations.length?'Probá otra búsqueda o cambiá el filtro.':'Cuando tengas amigos, podés empezar una conversación.'}</p><button onClick={() => modern&&friends.length?setNewChat(true):navigate('/app/comunidad')} className="mt-5 rounded-2xl bg-gradient-to-r from-sky-300 to-cyan-300 px-5 py-3 text-xs font-black text-[#071018]">{modern&&friends.length?'Nuevo mensaje':'Descubrir comunidad'}</button></div> : <div className="space-y-2">{visibleConversations.map((c) => <button key={c.id} type="button" onClick={() => openConversation(c)} className="flex w-full items-center gap-3 rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-3.5 text-left active:scale-[0.99]"><Avatar profile={c.other_profile} small/><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-black text-white">{nameOf(c.other_profile)}</p><span className="text-[9px] text-white/25">{dayOf(c.last_message_at || c.updated_at)}</span></div><p className={`mt-1 truncate text-[11px] ${c.unread_count > 0 ? 'font-bold text-white/70' : 'text-white/30'}`}>{c.last_message || 'Conversación lista para empezar'}</p></div>{c.unread_count > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-violet-500 px-1 text-[9px] font-black text-white">{c.unread_count > 9 ? '9+' : c.unread_count}</span>}</button>)}</div>}
      </section>
    </div>
  </AppLayout>
}
