import RollerFeedNewsInteractive from './RollerFeedNewsInteractive'
import { useEffect, useRef, useState } from 'react'
import '../styles/rollerfeed-news.css'
import { supabase } from '../lib/supabase'

const CHOICES = [{ value: 'yes', label: 'Me sumo' }, { value: 'no', label: 'Esta vez no' }]

export default function RollerFeedSeasonal({ section = 'polls' }) {
  const [polls, setPolls] = useState([])
  const [votes, setVotes] = useState([])
  const [news, setNews] = useState([])
  const [newsLimit, setNewsLimit] = useState(8)
  const newsLimitRef = useRef(8)
  const [hasMoreNews, setHasMoreNews] = useState(false)
  const [avatars, setAvatars] = useState([])
  const [avatarDialog, setAvatarDialog] = useState(null)
  const [uid, setUid] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  async function refresh() {
    if (section === 'news') {
      const result = await supabase.from('pr_feed_news')
        .select('id,title,body,image_url,event_at,created_at,kind,allow_rsvp')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(newsLimitRef.current + 1)
      if (result.error) setError('No pudimos cargar las novedades. Probá nuevamente.')
      else { setHasMoreNews((result.data || []).length > newsLimitRef.current); setNews((result.data || []).slice(0, newsLimitRef.current)); setError('') }
      setLoading(false)
      return
    }

    const [pollResult, voteResult, avatarResult] = await Promise.all([
      supabase.from('pr_feed_polls').select('id,title,sort_order').eq('active', true).order('sort_order'),
      supabase.from('pr_feed_poll_votes').select('poll_id,voter_uid,choice,gala_choice'),
      supabase.rpc('pr_feed_poll_avatars'),
    ])
    if (pollResult.error || voteResult.error) setError('No pudimos cargar las encuestas. Probá nuevamente.')
    else {
      setPolls(pollResult.data || [])
      setVotes(voteResult.data || [])
      setAvatars(avatarResult.error ? [] : avatarResult.data || [])
      setError('')
    }
    setLoading(false)
  }

  useEffect(() => {
    newsLimitRef.current = newsLimit
    if (section === 'news' && newsLimit > 8) refresh()
  }, [newsLimit, section])

  useEffect(() => {
    let live = true
    supabase.auth.getUser().then(({ data }) => { if (live) setUid(data?.user?.id || '') })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!live) return
      setUid(session?.user?.id || '')
      if (session?.user?.id) window.setTimeout(() => { if (live) refresh() }, 0)
    })
    refresh()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 60000)
    return () => { live = false; window.clearInterval(timer); listener.subscription.unsubscribe() }
  }, [])

  function voterAvatars(pollId) {
    const people = avatars.filter(a => a.poll_id === pollId)
    if (!people.length) return null
    const visible = people.slice(0, 7)
    const remaining = people.length - visible.length
    return <div className="mt-3 flex items-center gap-2" aria-label={people.length+' participantes que autorizaron mostrar su foto'}>
      <div className="flex -space-x-2">{visible.map((person,index) => <img key={index} src={person.photo_url} alt={person.display_name || 'Participante'} title={person.display_name || 'Participante'} loading="lazy" className="h-8 w-8 rounded-full border-2 border-[#0D0303] bg-[#191919] object-cover" />)}</div>
      {remaining > 0 && <button type="button" onClick={() => setAvatarDialog(pollId)} className="rounded-full border border-[#BBFF1F]/40 bg-[#BBFF1F]/10 px-2.5 py-1.5 text-[11px] font-black text-[#BBFF1F]" aria-label={'Ver '+remaining+' participantes más'}>+{remaining}</button>}
      <button type="button" onClick={() => setAvatarDialog(pollId)} className="text-[10px] font-bold text-white/55 underline decoration-white/25 underline-offset-2">Ver todas ({people.length})</button>
    </div>
  }

  async function vote(pollId, choice, galaChoice = null) {
    if (!uid || busy) return
    setBusy(pollId)
    const existing = votes.some(v => v.poll_id === pollId && v.voter_uid === uid)
    const query = existing
      ? supabase.from('pr_feed_poll_votes').update({ choice, gala_choice: choice === 'yes' ? galaChoice : null }).eq('poll_id', pollId).eq('voter_uid', uid)
      : supabase.from('pr_feed_poll_votes').insert({ poll_id: pollId, voter_uid: uid, choice, gala_choice: choice === 'yes' ? galaChoice : null })
    const { error: voteError } = await query
    if (voteError) setError('No se pudo guardar tu voto. Intentá de nuevo.')
    else await refresh()
    setBusy('')
  }

  return <div className="space-y-5">
    {section === 'polls' && <>
    <section className="relative overflow-hidden rounded-[30px] border border-[#FF0055]/25 bg-[#0D0303] p-4 shadow-[0_16px_45px_rgba(0,0,0,.35)] sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(255,0,85,.13),transparent_60%)]" />
      <div className="relative">
        <p className="text-center text-[10px] font-black uppercase tracking-[.22em] text-[#FF77A3]">Tu opinión cuenta</p>
        <h2 className="mx-auto mt-2 max-w-[320px] text-center font-display text-[27px] leading-tight text-white">Vos también decidís <span className="text-[#FF0055]">cómo cerramos el año.</span></h2>
        <p className="mt-2 text-center text-xs text-white/45">Participá en las tres votaciones.</p>
        <div className="mt-4 space-y-3">
          {polls.filter(p => p.sort_order === 1).map(poll => {
            const own = votes.find(v => v.poll_id === poll.id && v.voter_uid === uid)
            const all = votes.filter(v => v.poll_id === poll.id)
            const yes = all.filter(v => v.choice === 'yes').length
            return <article key={poll.id} className="rounded-[22px] border border-[#FF0055]/35 bg-[#FF0055]/[.055] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF78A5]">Encuesta principal</p>
              <h3 className="mt-2 font-display text-[24px] text-white">🥂 Fiesta de Fin de Año</h3>
              <p className="mt-1 text-xs text-white/60">¿Organizamos una fiesta para despedir el año juntos?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" disabled={!uid || busy === poll.id} aria-pressed={own?.choice === 'yes'} onClick={() => vote(poll.id, 'yes', own?.gala_choice || null)} className={`rounded-xl border px-2 py-3 text-[11px] font-bold disabled:opacity-45 ${own?.choice === 'yes' ? 'border-[#FF0055] bg-[#FF0055] text-white' : 'border-[#FF0055]/30 bg-[#FF0055]/10 text-white'}`}>¡Sí, queremos fiesta!</button>
                <button type="button" disabled={!uid || busy === poll.id} aria-pressed={own?.choice === 'no'} onClick={() => vote(poll.id, 'no')} className={`rounded-xl border px-2 py-3 text-[11px] font-bold disabled:opacity-45 ${own?.choice === 'no' ? 'border-[#FF0055] bg-[#FF0055] text-white' : 'border-white/15 bg-white/[.04] text-white/65'}`}>Esta vez no</button>
              </div>
              <p className="mt-3 text-[11px] font-bold text-white">Si hacemos fiesta, ¿qué estilo preferís?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" disabled={!uid || busy === poll.id || own?.choice !== 'yes'} aria-pressed={own?.gala_choice === 'gala'} onClick={() => vote(poll.id, 'yes', 'gala')} className={`rounded-xl border p-3 text-left disabled:opacity-40 ${own?.gala_choice === 'gala' ? 'border-[#FF0055] bg-[#FF0055]/15' : 'border-white/10 bg-black/25'}`}><span className="block text-[11px] font-bold text-white">Noche de gala</span><span className="mt-1 block text-[10px] leading-4 text-white/55">Vestimenta elegante y formal, con looks de gala.</span></button>
                <button type="button" disabled={!uid || busy === poll.id || own?.choice !== 'yes'} aria-pressed={own?.gala_choice === 'casual'} onClick={() => vote(poll.id, 'yes', 'casual')} className={`rounded-xl border p-3 text-left disabled:opacity-40 ${own?.gala_choice === 'casual' ? 'border-[#FF0055] bg-[#FF0055]/15' : 'border-white/10 bg-black/25'}`}><span className="block text-[11px] font-bold text-white">Noche sin gala</span><span className="mt-1 block text-[10px] leading-4 text-white/55">Ambiente relajado, sin código de vestimenta formal.</span></button>
              </div>
              <p className="mt-3 text-[10px] text-white/45">{all.length} votos · {yes} quieren fiesta · {all.filter(v=>v.gala_choice==='gala').length} gala · {all.filter(v=>v.gala_choice==='casual').length} sin gala</p>
              {voterAvatars(poll.id)}
            </article>
          })}
          <div className="grid grid-cols-2 gap-2">
            {polls.filter(p => p.sort_order !== 1).map(poll => {
              const own = votes.find(v => v.poll_id === poll.id && v.voter_uid === uid)
              const all = votes.filter(v => v.poll_id === poll.id)
              const yes = all.filter(v => v.choice === 'yes').length
              return <article key={poll.id} className="min-w-0 rounded-[20px] border border-[#BBFF1F]/25 bg-[#BBFF1F]/[.045] p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#BBFF1F]">{poll.sort_order === 2 ? 'Navidad' : 'Fin de año'}</p>
                <h3 className="mt-1 min-h-10 text-[12px] font-bold leading-snug text-white">{poll.sort_order === 2 ? '🎅 Rolleada navideña' : '🎆 Rolleada de Año Nuevo'}</h3>
                <div className="mt-2 grid grid-cols-2 gap-1.5">{CHOICES.map(option => <button key={option.value} type="button" disabled={!uid || busy === poll.id} aria-pressed={own?.choice === option.value} onClick={() => vote(poll.id, option.value)} className={`rounded-lg border px-1 py-2 text-[10px] font-bold disabled:opacity-45 ${own?.choice === option.value ? 'border-[#BBFF1F] bg-[#BBFF1F] text-[#0D0303]' : 'border-[#BBFF1F]/20 bg-black/25 text-white/75'}`}>{option.value === 'yes' ? 'Sí' : 'No'}</button>)}</div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#BBFF1F]" style={{width:`${all.length ? yes / all.length * 100 : 0}%`}} /></div>
                <p className="mt-1.5 text-[10px] text-white/45">{all.length} votos · {yes} sí</p>
                {voterAvatars(poll.id)}
              </article>
            })}
          </div>
        </div>
        {!uid && !loading && <p className="mt-3 text-center text-xs text-white/50">Iniciá sesión para participar.</p>}
        {loading && <p className="mt-4 text-center text-xs text-white/50">Cargando encuestas…</p>}
        {error && <p role="alert" className="mt-3 text-center text-xs text-red-300">{error}</p>}
      </div>
    </section>
    </>}
    {avatarDialog && <div role="dialog" aria-modal="true" aria-label="Participantes de la votación" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4" onClick={() => setAvatarDialog(null)}><div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[24px] border border-[#FF0055]/40 bg-[#151016] p-5" onClick={e=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-black text-white">Participantes ({avatars.filter(a=>a.poll_id===avatarDialog).length})</h3><button type="button" onClick={() => setAvatarDialog(null)} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white">Cerrar ✕</button></div><div className="grid grid-cols-4 gap-4">{avatars.filter(a=>a.poll_id===avatarDialog).map((person,index)=><div key={index} className="min-w-0 text-center"><img src={person.photo_url} alt={person.display_name||'Participante'} loading="lazy" className="mx-auto h-14 w-14 rounded-full border-2 border-[#FF0055]/40 object-cover" /><p className="mt-1 break-words text-[10px] text-white/75">{person.display_name||'Participante'}</p></div>)}</div><p className="mt-4 text-xs text-white/40">Solo aparecen quienes eligieron mostrar su foto. El total de votos incluye a todos.</p></div></div>}
    {section === 'news' && <>
    <section className="rf-news-shell rounded-[28px] border border-[#BBFF1F]/20 bg-[#0D0303] p-4 shadow-[0_16px_45px_rgba(0,0,0,.2)] sm:p-5">
      <div aria-hidden="true" className="rf-news-glow" />
      <div className="relative z-10 text-center">
        <div className="rf-news-signal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 10v4l3 1.5L18 19V5L8 8.5 5 10Z"/><path d="M8 15.5 9 20h3l-1.5-4"/><path d="M20 9a4 4 0 0 1 0 6"/></svg></div>
        <h2 className="mt-1 font-display text-[31px] leading-none text-white">Novedades<span className="text-[#BBFF1F]">.</span></h2>
        <div className="rf-news-line" aria-hidden="true" />
        <p className="mt-2 text-[11px] text-white/50"><span className="rf-news-indicator mr-2 align-middle" aria-hidden="true" /> Noticias, anuncios y lo último de nuestra comunidad</p>
      </div>
      <div className="relative z-10">
      {loading ? <p role="status" className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-center text-xs text-white/50">Cargando novedades…</p> : error ? <div role="alert" className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-center"><p className="text-xs text-amber-100/85">{error}</p><button type="button" onClick={() => { setLoading(true); refresh() }} className="mt-3 rounded-xl border border-[#BBFF1F]/35 px-4 py-2 text-xs font-bold text-[#BBFF1F]">Reintentar</button></div> : news.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{news.map(item => <RollerFeedNewsInteractive key={item.id} item={item} uid={uid} onImage={(url,title)=>setLightbox({url,title})} />)}{hasMoreNews && <button type="button" onClick={()=>setNewsLimit(n=>n+8)} className="rounded-xl border border-white/15 bg-white/[.035] px-4 py-3 text-xs font-bold text-[#BBFF1F] sm:col-span-2">Ver más novedades ↓</button>}</div> : <p className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-white/45">Pronto vas a encontrar acá noticias, anuncios y novedades de Punta Rollers.</p>}
      </div>
    </section>
    {lightbox && <div role="dialog" aria-modal="true" aria-label={'Imagen ampliada: '+lightbox.title} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={()=>setLightbox(null)}><button type="button" onClick={()=>setLightbox(null)} aria-label="Cerrar imagen" className="absolute right-4 top-4 rounded-xl border border-white/30 bg-black/60 px-4 py-2 text-sm text-white">Cerrar ✕</button><img src={lightbox.url} alt={lightbox.title} className="max-h-[85vh] max-w-full object-contain" onClick={e=>e.stopPropagation()} /></div>}
    </>}
  </div>
}
