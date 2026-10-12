import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CHOICES = [{ value: 'yes', label: 'Me sumo' }, { value: 'no', label: 'Esta vez no' }]

export default function RollerFeedSeasonal() {
  const [polls, setPolls] = useState([])
  const [votes, setVotes] = useState([])
  const [news, setNews] = useState([])
  const [uid, setUid] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const [pollResult, voteResult, newsResult] = await Promise.all([
      supabase.from('pr_feed_polls').select('id,title,sort_order').eq('active', true).order('sort_order'),
      supabase.from('pr_feed_poll_votes').select('poll_id,voter_uid,choice,gala_choice'),
      supabase.from('pr_feed_news').select('id,title,body,image_url,event_at,created_at').eq('published', true).order('created_at', { ascending: false }).limit(8),
    ])
    if (pollResult.error || voteResult.error || newsResult.error) setError('No pudimos cargar las encuestas o novedades. Probá nuevamente.')
    else { setPolls(pollResult.data || []); setVotes(voteResult.data || []); setNews(newsResult.data || []); setError('') }
    setLoading(false)
  }

  useEffect(() => {
    let live = true
    supabase.auth.getUser().then(({ data }) => { if (live) setUid(data?.user?.id || '') })
    refresh()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 60000)
    return () => { live = false; window.clearInterval(timer) }
  }, [])

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
    <section className="relative overflow-hidden rounded-[30px] border border-[#FF0055]/25 bg-[#0D0303] p-4 shadow-[0_16px_45px_rgba(0,0,0,.35)] sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(255,0,85,.13),transparent_60%)]" />
      <div className="relative">
        <p className="text-center text-[10px] font-black uppercase tracking-[.22em] text-[#FF77A3]">Tu opinión cuenta</p>
        <h2 className="mx-auto mt-2 max-w-[320px] text-center font-display text-[27px] leading-tight text-white">Vos también decidís <span className="text-[#FF0055]">cómo cerramos el año.</span></h2>
        <p className="mt-2 text-center text-xs text-white/45">Participá en las tres votaciones.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {polls.map((poll, index) => {
            const own = votes.find(v => v.poll_id === poll.id && v.voter_uid === uid)
            const all = votes.filter(v => v.poll_id === poll.id)
            const yes = all.filter(v => v.choice === 'yes').length
            return <article key={poll.id} className="rounded-[22px] border border-white/10 bg-white/[.045] p-4 transition-colors hover:border-[#FF0055]/35">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#FF77A3]">Votación 0{index + 1}</p>
              <h3 className="mt-2 min-h-11 text-[15px] font-bold leading-snug text-white">{poll.title}</h3>
              <div className="mt-3 flex gap-2">
                {CHOICES.map(option => <button key={option.value} type="button" disabled={!uid || busy === poll.id} onClick={() => vote(poll.id, option.value)} aria-pressed={own?.choice === option.value} className={`flex-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold transition-all disabled:opacity-45 ${own?.choice === option.value ? 'border-[#BBFF1F] bg-[#BBFF1F] text-[#0D0303]' : 'border-white/15 bg-black/35 text-white/75 hover:border-[#FF0055]/60'}`}>{option.label}</button>)}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF0055] transition-all duration-500" style={{ width: `${all.length ? yes / all.length * 100 : 0}%` }} /></div>
              <p className="mt-2 text-[10px] text-white/45">{all.length} {all.length === 1 ? 'voto' : 'votos'} · {all.length ? Math.round(yes / all.length * 100) : 0}% se suma</p>
            </article>
          })}
        </div>
        {!uid && !loading && <p className="mt-3 text-center text-xs text-white/50">Iniciá sesión para participar.</p>}
        {loading && <p className="mt-4 text-center text-xs text-white/50">Cargando encuestas…</p>}
        {error && <p role="alert" className="mt-3 text-center text-xs text-red-300">{error}</p>}
      </div>
    </section>
    <section className="rounded-[30px] border border-[#BBFF1F]/20 bg-[#0D0303] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#BBFF1F]">Desde Punta Rollers</p><h2 className="mt-1 font-display text-[30px] text-white">Novedades<span className="text-[#BBFF1F]">.</span></h2></div><span className="h-2 w-2 rounded-full bg-[#BBFF1F] shadow-[0_0_14px_rgba(187,255,31,.55)]" /></div>
      {news.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{news.map(item => <article key={item.id} className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[.035]">{item.image_url && <img src={item.image_url} alt="" loading="lazy" className="max-h-48 w-full object-cover" />}<div className="p-4"><h3 className="font-bold text-white">{item.title}</h3>{item.body && <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-white/60">{item.body}</p>}{item.event_at && <p className="mt-3 text-[11px] font-bold text-[#BBFF1F]">{new Date(item.event_at).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}</div></article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-white/45">Las próximas novedades de PR van a aparecer acá.</p>}
    </section>
  </div>
}
