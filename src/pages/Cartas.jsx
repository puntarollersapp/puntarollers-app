import { CollectiblesHero } from '../components/PRCollectiblesVisual'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import HoloCard, { HOLO_CSS, motionNeedsPermission, requestMotionPermission } from '../components/HoloCard'
import { dateLabel, shareOrDownloadCard, useCardsAccess } from '../lib/cartas'
import { buildCollectibles } from '../lib/prCollectiblesAlbum'

const TABS = [['todas','Todas'],['plata','Classic'],['holo','Prism'],['oro','Gold'],['ruby','Rubí'],['diamond','Diamond'],['navidad','Limited Edition']]
const RARITY_TONE={plata:"#d2d5e3",holo:"#74d5ef",oro:"#f6cc72",ruby:"#ff6c95",diamond:"#b9e7ff",navidad:"#cbb5ff"}
const EMPTY = { loading: true, error: '', badges: [], grants: [], metrics: {}, previewEligible: [] }
export default function Cartas() {
  const { user } = useAuth()
  const allowed = useCardsAccess(user)
  const uid = user?.id
  const isOwner=user?.id==='admin-claudio'&&user?.role==='admin'
  const [designPreview,setDesignPreview]=useState(false)
  const preview=isOwner&&designPreview
  const [state, setState] = useState(EMPTY)
  const [tab, setTab] = useState('todas')
  const [open, setOpen] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [sensor, setSensor] = useState(false)
  const [motionDenied,setMotionDenied]=useState(false)
  const motionRequest=useRef(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const closeRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    setState(EMPTY); setOpen(null)
    if (!uid || !allowed) return undefined
    let live = true
    ;(async () => {
      try {
        const sync=await supabase.rpc('pr_collectibles_sync_my_cards')
        const [b,g]=await Promise.all([
          supabase.from('actividad_pr').select('id,titulo,descripcion,fecha,creado_por_nombre').eq('alumno_id',uid).eq('tipo','Insignia').or('eliminado.is.null,eliminado.eq.false').order('fecha',{ascending:false}),
          supabase.from('pr_collectibles_grants').select('card_code,granted_at,reason,source').eq('profile_id',uid),
        ])
        if(b.error)throw b.error
        const errors=[sync.error?'No se pudo sincronizar el progreso.':null,g.error?'No se pudieron leer las entregas.':null].filter(Boolean)
        if(live)setState({loading:false,error:errors.join(' '),badges:b.data||[],grants:g.data||[],metrics:sync.error?{}:sync.data?.metrics||{},previewEligible:sync.data?.preview?sync.data.eligible_numbers||[]:[]})
      } catch (e) {
        if (live) setState({ ...EMPTY, loading: false, error: 'No se pudieron cargar tus cartas. Probá de nuevo.' })
      }
    })()
    return () => { live = false }
  }, [uid, allowed, retry])
  const cards=useMemo(()=>buildCollectibles(state),[state])
  const owned=cards.filter(c=>!c.locked).length
  const permanent=cards.filter(c=>c.countsTowardMain&&!c.locked).length
  const limited=owned-permanent
  const total=cards.length
  const mainTotal=cards.filter(c=>c.countsTowardMain).length
  const limitedTotal=total-mainTotal
  const published=cards.filter(c=>!c.upcoming).length
  const progress=total?owned/total*100:0
  const shown=cards.filter(c=>(!preview||!c.upcoming)&&(tab==='todas'||c.category===tab)).sort((a,b)=>Number(a.upcoming)-Number(b.upcoming)||a.number-b.number)
  const viewLocked=c=>c.locked&&!(preview&&!c.upcoming)
  const current=open?cards.find(c=>c.id===open):null
  const next=cards.filter(c=>c.locked&&!c.upcoming&&c.countsTowardMain&&c.progress!==null&&c.progress<1).sort((a,b)=>b.progress-a.progress)[0]
  function openCard(id) {
    openerRef.current = document.activeElement
    setFlipped(false); setMsg(''); setOpen(id)
    const selected=cards.find(c=>c.id===id)
    if (!selected || viewLocked(selected) || typeof window==='undefined' || !('DeviceOrientationEvent' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    if (!motionNeedsPermission()) { setSensor(true); return }
    // iOS requires a trusted user gesture: request directly from the card tap.
    // Reuse the result for this session, so subsequent cards open without a second prompt.
    if (!motionRequest.current) {
      motionRequest.current=requestMotionPermission()
      motionRequest.current.then(ok=>{setSensor(ok);setMotionDenied(!ok)})
    }
  }
  function closeCard() { setOpen(null); setMsg(''); requestAnimationFrame(() => openerRef.current?.focus?.()) }
  useEffect(() => {
    if (!current) return undefined
    const k = e => { if (e.key === 'Escape') { setOpen(null); requestAnimationFrame(() => openerRef.current?.focus?.()) } }
    document.addEventListener('keydown', k)
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [current])
  async function save() {
    if (busy || !current || current.locked) return
    setBusy(true); setMsg('Preparando imagen…')
    try {
      const r = await shareOrDownloadCard(current)
      setMsg(r === 'downloaded' ? 'Imagen descargada.' : r === 'shared' ? 'Listo.' : r === 'cancelled' ? '' : 'No se pudo generar la imagen.')
    } catch { setMsg('No se pudo generar la imagen. Intentá nuevamente.') }
    finally { setBusy(false) }
  }
  if (!allowed) return <Navigate to="/app/insignias" replace/>
  return (
    <AppLayout title="PR Collectibles" showBack>
      <style>{HOLO_CSS}</style>
      <div className="pr-page animate-page-enter space-y-5 pb-28">
        <CollectiblesHero/>
        <section className="prc-stats">
          <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-widest text-white/50">COLECCIÓN 001 · ÁLBUM COMPLETO</p><p className="mt-1 text-4xl font-black text-white">{state.loading?'—':owned}<span className="text-xl text-white/35"> / {total}</span></p></div><span className="font-black text-violet-200">{state.loading?'—':Math.round(progress)+'%'}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="prc-progress h-full rounded-full" style={{width:progress+'%'}}/></div>
          <p className="mt-3 text-xs text-white/60">{permanent}/{mainTotal} colección principal · {limited}/{limitedTotal} ediciones limitadas</p>
          <div className="mt-4 grid grid-cols-3 gap-2">{TABS.slice(1).map(([key,label])=><div key={key} className="prc-rarity-stat" style={{'--tone':RARITY_TONE[key]}}><strong>{cards.filter(c=>c.category===key&&!c.locked).length}</strong><p>{label}</p></div>)}</div>
          <p className="mt-3 text-xs leading-5 text-white/60">Coleccioná con tus asistencias, kilómetros y experiencias. {published} diseños publicados · {total-published} por descubrir.</p>
          {isOwner&&<button type="button" aria-pressed={preview} onClick={()=>{setDesignPreview(v=>!v);setOpen(null);setTab('todas')}} className={"mt-4 block w-full rounded-xl border px-4 py-3 text-xs font-black "+(preview?"border-amber-300/60 bg-amber-300/10 text-amber-200":"border-white/15 bg-white/5 text-white")}>{preview?"Salir de la vista de diseño (10 cartas)":"Vista de diseño · probar los 10 frentes"}</button>}
          {preview&&<p className="mt-2 text-[10px] text-amber-200/80">Vista exclusiva del administrador. No otorga cartas ni modifica los logros reales.</p>}
          <Link to="/app/insignias" className="mt-4 inline-block text-xs text-white/65 underline">Ver mis insignias</Link>
          {user?.role==='admin'&&<Link to="/admin/collectibles" className="ml-4 text-xs font-bold text-[#FF79A5] underline">Administrar</Link>}
        </section>
        <div className="prc-filters" role="group" aria-label="Filtro de cartas">
          {TABS.map(([k, l]) => <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)}
            className="prc-filter">{l}</button>)}
        </div>
        {state.error && <div className="rounded-2xl bg-rose-500/15 px-4 py-3 text-xs text-rose-200" role="alert">{state.error} <button type="button" onClick={() => setRetry(v => v + 1)} className="ml-2 font-bold underline">Reintentar</button></div>}
        {state.loading ? (
          <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-6">{[0,1,2,3].map(i => <div key={i} className="aspect-[5/7] w-full max-w-[190px] animate-pulse rounded-[22px] bg-white/[.05]"/>)}</div>
        ) : shown.length ? (
          <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-6">
            {shown.map(c => <HoloCard key={c.id} size="grid" rarity={c.rarity} title={c.title} subtitle={c.subtitle} art={c.art} frontArt={c.frontArt} backArt={c.backArt} upcoming={c.upcoming} emoji={c.emoji} number={c.number} total={c.total} locked={viewLocked(c)} onClick={() => openCard(c.id)}/>)}
          </div>
        ) : !state.error && (
          <section className="rounded-[28px] border border-white/[.08] bg-white/[.025] p-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-white/[.06] text-3xl">🃏</div>
            <h2 className="mt-4 text-xl font-black text-white">{cards.length ? 'No tenés cartas de este tipo todavía' : 'Tu colección empieza acá'}</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">Las cartas se consiguen con logros, asistencias, kilómetros y experiencias.</p>
          </section>
        )}
        {next&&!state.loading&&<section className="rounded-3xl border border-emerald-300/20 bg-[#19251f] p-4"><p className="text-[10px] font-black tracking-widest text-emerald-300">ESTÁS MUY CERCA</p><h2 className="mt-2 text-xl font-black text-white">{next.title}</h2><p className="mt-1 text-xs text-white/60">Próxima carta · progreso registrado</p><div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300" style={{width:next.progress*100+'%'}}/></div><div className="mt-2 flex justify-between text-xs text-white/70"><span>{Number(next.progressValue.toFixed(1)).toLocaleString('es-UY')} / {next.progressTarget}</span><span>{Math.round(next.progress*100)}%</span></div><p className="mt-2 text-[10px] text-white/45">El progreso se sincroniza con tus registros verificados al abrir el álbum.</p></section>}
      </div>
      {current && (
        <div className="fixed inset-0 z-[160] flex flex-col items-center overflow-y-auto bg-black/85 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={current.title} onClick={closeCard}>
          <div className="my-auto flex w-full max-w-sm flex-col items-center gap-5" onClick={e => e.stopPropagation()}>
            <HoloCard size="large" rarity={current.rarity} title={current.title} subtitle={current.subtitle} art={current.art} frontArt={current.frontArt} backArt={current.backArt} upcoming={current.upcoming} emoji={current.emoji}
              number={current.number} total={current.total} locked={viewLocked(current)} sensor={sensor} flipped={flipped}
              stats={current.locked ? [] : [{ label: 'CONSEGUIDA', value: dateLabel(current.date) || '—' }]}
              back={current.upcoming ? <><h4>Próximamente</h4><p>{current.earned?'Tu logro ya está registrado. La carta estará disponible cuando se publique el diseño.':'Esta carta forma parte de la colección y se publicará próximamente.'}</p></> : current.locked ? <><h4>Carta bloqueada</h4><p>{current.description || 'Todavía no la conseguiste.'}</p></> : <><h4>{current.title}</h4>{current.description && <p>{current.description}</p>}<small>{dateLabel(current.date)}{current.by ? ' · Otorgada por ' + current.by : ''}</small></>}/>
            {flipped&&current.backArt&&!viewLocked(current)&&<div className="w-full rounded-2xl bg-white/5 p-4 text-center text-xs text-white/75"><p className="font-bold text-white">{current.title}</p><p className="mt-1">{current.description}</p><p className="mt-1">{dateLabel(current.date)}{current.by?' · Otorgada por '+current.by:''}</p></div>}
            {preview&&current.locked&&<p className="text-center text-[11px] text-amber-200">Vista de diseño · este logro aún no está conseguido.</p>}
            {motionDenied&&!viewLocked(current)&&<p className="text-center text-[11px] text-white/55">Mové la carta con el dedo si el sensor de inclinación no está disponible.</p>}
            {msg && <p className="text-center text-xs text-white/70" role="status">{msg}</p>}
            <div className="flex w-full flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setFlipped(v => !v)} className="min-h-[44px] rounded-full bg-white/10 px-5 text-xs font-black uppercase tracking-widest text-white active:scale-95">{flipped ? 'Ver frente' : 'Ver dorso'}</button>
              {!current.locked && <button type="button" disabled={busy} onClick={save} className="min-h-[44px] rounded-full bg-[#FF0055] px-5 text-xs font-black uppercase tracking-widest text-white active:scale-95 disabled:opacity-50">{busy ? 'Preparando…' : 'Guardar imagen'}</button>}
            </div>
            <button ref={closeRef} type="button" onClick={closeCard} className="min-h-[44px] px-6 text-xs font-bold text-white/70">Cerrar</button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
