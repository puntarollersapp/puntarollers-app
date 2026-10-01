import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { ROLLERWEEN, isRollerweenActive } from '../lib/rollerween'

function lower(value) {
  return String(value || '').trim().toLowerCase()
}

function isRankingEligible(activity) {
  return activity && activity.eliminada !== true
}

function profileName(profile) {
  return profile?.nombre_completo || profile?.display_name || [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || 'Integrante PR'
}

function profilePhoto(profile) {
  return profile?.foto_url || profile?.photo_url || profile?.avatar_url || profile?.foto || profile?.avatar || ''
}

function buildProfileMap(profiles) {
  const map = new Map()
  ;(profiles || []).forEach((profile) => {
    if (profile?.id) map.set(String(profile.id), profile)
  })
  return map
}

function shiftDate(value, amount) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function montevideoToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: parts.weekday, year: Number(parts.year), month: Number(parts.month) }
}

function dateRanges() {
  const now = montevideoToday()
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(now.weekday)
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const currentWeekStart = shiftDate(now.date, mondayOffset)
  const monthStart = `${now.year}-${String(now.month).padStart(2, '0')}-01`
  const previousMonthEndDate = new Date(Date.UTC(now.year, now.month - 1, 0, 12))
  const previousMonthStartDate = new Date(Date.UTC(previousMonthEndDate.getUTCFullYear(), previousMonthEndDate.getUTCMonth(), 1, 12))
  const previousMonthStart = previousMonthStartDate.toISOString().slice(0, 10)
  const previousMonthEnd = previousMonthEndDate.toISOString().slice(0, 10)
  return {
    week: { start: currentWeekStart, end: now.date },
    month: { start: monthStart, end: now.date },
    previousMonth: { start: previousMonthStart, end: previousMonthEnd },
  }
}

function shortDate(value) {
  return new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

function longDate(value) {
  return new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

function insideRange(value, range) {
  const stamp = new Date(value).getTime()
  if (!Number.isFinite(stamp)) return false
  const start = new Date(`${range.start}T00:00:00-03:00`).getTime()
  const end = new Date(`${range.end}T23:59:59-03:00`).getTime()
  return stamp >= start && stamp <= end
}

function makeRanking(rows, profiles, range) {
  const grouped = new Map()
  ;(rows || []).filter(isRankingEligible).filter((row) => lower(row.fuente || 'strava') === 'strava').filter((row) => insideRange(row.fecha_inicio, range)).forEach((row) => {
    const id = String(row.alumno_id || '')
    if (!id) return
    const km = Math.max(0, Number(row.distancia_metros) || 0) / 1000
    if (!km) return
    const current = grouped.get(id) || { alumnoId: id, km: 0, sessions: 0 }
    current.km += km
    current.sessions += 1
    grouped.set(id, current)
  })
  return [...grouped.values()].map((entry) => {
    const profile = profiles.get(entry.alumnoId) || {}
    return { ...entry, name: profileName(profile), photo: profilePhoto(profile) }
  }).sort((a, b) => b.km - a.km || b.sessions - a.sessions || a.name.localeCompare(b.name))
}

function initials(name) {
  return String(name || 'PR').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'PR'
}

function PodiumAvatar({ row, size = 'lg' }) {
  const dimension = size === 'xl' ? 'h-24 w-24' : 'h-20 w-20'
  if (row?.photo) return <img src={row.photo} alt={row.name} className={`${dimension} rounded-full border-4 border-black/70 object-cover shadow-[0_15px_45px_rgba(0,0,0,.35)]`} />
  return <div className={`${dimension} grid place-items-center rounded-full border-4 border-black/70 bg-gradient-to-br from-amber-400/35 via-violet-500/15 to-white/10 text-xl font-black`}>{initials(row?.name)}</div>
}

function PrizeVisual({ campaign, level, totalKm }) {
  const target = Number(campaign?.[`prize_${level}_target_km`] || 0)
  const title = campaign?.[`prize_${level}_title`] || ''
  const detail = campaign?.[`prize_${level}_detail`] || ''
  const image = campaign?.[`prize_${level}_image_url`] || ''
  const unlocked = totalKm >= target
  const previousTarget = level === 1 ? 0 : Number(campaign?.[`prize_${level - 1}_target_km`] || 0)
  const revealed = level === 1 || totalKm >= previousTarget
  const icon = level === 1 ? '🍫' : level === 2 ? '🍷' : '🎟️'
  const left = Math.max(0, target - totalKm)
  return (
    <div className={`relative overflow-hidden rounded-[24px] border p-4 transition ${unlocked ? 'border-emerald-300/30 bg-emerald-400/[.08]' : revealed ? 'border-orange-300/20 bg-white/[.035]' : 'border-white/[.07] bg-black/25'}`}>
      {!revealed && <div className="absolute inset-0 z-10 bg-black/58 backdrop-blur-[2px]" />}
      <div className="relative z-20 flex items-start gap-3">
        <div className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[18px] border text-2xl ${unlocked ? 'border-emerald-300/30 bg-emerald-300/15' : 'border-white/10 bg-black/30'}`}>
          {image ? <img src={image} alt={title} className="h-full w-full object-cover" /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">NIVEL 0{level} · {target.toLocaleString('es-UY')} KM</p>
            <span className={`rounded-full px-2 py-1 text-[8px] font-black ${unlocked ? 'bg-emerald-300 text-black' : revealed ? 'bg-orange-400/15 text-orange-200' : 'bg-white/8 text-white/35'}`}>{unlocked ? 'UNLOCKED ✓' : revealed ? `${left.toLocaleString('es-UY',{maximumFractionDigits:1})} KM LEFT` : 'BLOQUEADO'}</span>
          </div>
          <h3 className="mt-1 text-base font-black">{revealed ? title : level === 3 ? 'PREMIO MÁXIMO' : 'PRÓXIMO PREMIO'}</h3>
          <p className="mt-1 text-[10px] leading-4 text-white/38">{revealed ? detail : 'Desbloqueá el nivel anterior para revelarlo.'}</p>
        </div>
      </div>
    </div>
  )
}

function ProgressWheel({ pct, totalKm, maxTarget }) {
  const radius=74, circumference=2*Math.PI*radius, offset=circumference-(Math.max(0,Math.min(100,pct))/100)*circumference
  return <div className="relative mx-auto h-[210px] w-[210px]">
    <svg viewBox="0 0 180 180" className="-rotate-90 h-full w-full">
      <defs><linearGradient id="prUnlockRing" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fb923c"/><stop offset="48%" stopColor="#f472b6"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="13"/>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="url(#prUnlockRing)" strokeWidth="13" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700"/>
    </svg>
    <div className="absolute inset-0 grid place-items-center text-center">
      <div><p className="text-[9px] font-black uppercase tracking-[.19em] text-white/32">KM COMUNIDAD</p><p className="mt-1 text-[38px] font-black leading-none">{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})}</p><p className="mt-1 text-xs font-black text-fuchsia-300">de {maxTarget.toLocaleString('es-UY')} km</p><p className="mt-2 text-[10px] font-black text-white/45">{pct}% COMPLETADO</p></div>
    </div>
  </div>
}

function PRUnlock({ campaign, ranking = [], result }) {
  if (!campaign) return null
  const campaignRanking = ranking
  const totalKm = campaignRanking.reduce((sum, row) => sum + row.km, 0)
  const maxTarget = Number(campaign.prize_3_target_km || 1)
  const pct = Math.min(100, Math.round((totalKm / maxTarget) * 100))
  const targets = [1,2,3].map((level) => Number(campaign[`prize_${level}_target_km`] || 0))
  const unlockedLevel = totalKm >= targets[2] ? 3 : totalKm >= targets[1] ? 2 : totalKm >= targets[0] ? 1 : 0
  const nextTarget = targets[Math.min(unlockedLevel, 2)]
  const nextLeft = unlockedLevel >= 3 ? 0 : Math.max(0, nextTarget - totalKm)
  const activePrizeLevel = unlockedLevel
  const activePrizeTitle = activePrizeLevel ? campaign[`prize_${activePrizeLevel}_title`] : null
  const activePrizeDetail = activePrizeLevel ? campaign[`prize_${activePrizeLevel}_detail`] : null
  const activePrizeIcon = activePrizeLevel === 1 ? '🍫' : activePrizeLevel === 2 ? '🍷🍷' : activePrizeLevel === 3 ? '🎟️🎟️' : '🔒'
  const leader = campaignRanking[0]
  const today = montevideoToday().date
  const finished = today > campaign.ends_on
  const contributors = campaignRanking.slice(0,12)
  const official = result && String(result.campaign_id)===String(campaign.id) ? result : null
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-fuchsia-300/20 bg-[radial-gradient(circle_at_90%_0%,rgba(236,72,153,.24),transparent_35%),radial-gradient(circle_at_5%_95%,rgba(124,58,237,.25),transparent_40%),linear-gradient(145deg,#171018,#09090d_65%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,.38)]">
      <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-orange-300/15" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-fuchsia-300">PR UNLOCK · MISIÓN DEL MES</p>
            <h2 className="mt-1 text-[31px] font-black leading-none">Todos desbloqueamos.<br/><span className="text-orange-400">Uno se lo lleva.</span></h2>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-wider ${finished ? 'border-white/10 bg-white/5 text-white/40' : 'border-emerald-300/20 bg-emerald-400/[.08] text-emerald-300'}`}>{finished ? 'CERRADA' : '● EN VIVO'}</span>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/48">Cada kilómetro de patinaje inline suma dos veces: a tu posición personal y al objetivo colectivo. El grupo desbloquea el premio; al cierre de la misión, el <b className="text-white">#1 del ranking de este desafío</b> se lleva el premio de mayor nivel alcanzado.</p>
        <div className="mt-4 rounded-[20px] border border-sky-300/20 bg-sky-400/[.07] p-4">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-300">📍 EL DESAFÍO ARRANCA DESDE CERO</p>
          <p className="mt-2 text-[10px] leading-5 text-white/48">El Ranking PR sigue mostrando los kilómetros del mes calendario. <b className="text-white">PR UNLOCK cuenta únicamente lo registrado desde el 25/09 hasta el 25/10.</b> Los kilómetros anteriores no se pierden: simplemente pertenecen al ranking normal y no a esta misión.</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.12em]">
          <span className="rounded-full border border-orange-300/15 bg-orange-400/[.07] px-3 py-2 text-orange-200">{shortDate(campaign.starts_on)} → {shortDate(campaign.ends_on)}</span>
          <span className="rounded-full border border-white/8 bg-white/[.035] px-3 py-2 text-white/45">PREMIO EVOLUTIVO · NO ACUMULATIVO</span>
        </div>
        <div className={`mt-5 overflow-hidden rounded-[28px] border p-4 ${activePrizeLevel ? 'border-amber-300/25 bg-[radial-gradient(circle_at_90%_10%,rgba(251,191,36,.18),transparent_34%),linear-gradient(135deg,rgba(249,115,22,.12),rgba(124,58,237,.10))]' : 'border-white/10 bg-white/[.035]'}`}>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300">{activePrizeLevel >= 3 ? '🏆 PREMIO MÁXIMO DESBLOQUEADO' : activePrizeLevel ? '🏆 PREMIO ACTUAL EN JUEGO' : '🔒 TODAVÍA NO HAY PREMIO DESBLOQUEADO'}</p>
          <div className="mt-3 flex items-center gap-4">
            <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-[24px] border text-4xl ${activePrizeLevel ? 'border-amber-300/25 bg-amber-300/10 shadow-[0_0_35px_rgba(251,191,36,.10)]' : 'border-white/10 bg-black/25'}`}>{activePrizeIcon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black">{activePrizeLevel ? activePrizeTitle : `Faltan ${Math.max(0,targets[0]-totalKm).toLocaleString('es-UY',{maximumFractionDigits:1})} km para activar el Nivel 1`}</h3>
              <p className="mt-1 text-[10px] leading-4 text-white/40">{activePrizeLevel ? activePrizeDetail : 'Cuando el grupo llegue al primer checkpoint, el premio empieza a estar oficialmente en juego.'}</p>
            </div>
          </div>
          {leader && <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-white/[.08] bg-black/25 p-3">
            <PodiumAvatar row={leader} />
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/28">{activePrizeLevel ? 'SI LA MISIÓN CERRARA HOY' : 'LÍDER ACTUAL DE LA MISIÓN'}</p>
              <p className="mt-1 truncate text-sm font-black">{leader.name}</p>
              <p className="mt-1 text-[10px] text-white/38">{leader.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km {activePrizeLevel ? `· se llevaría ${activePrizeTitle}` : '· sigue liderando mientras el grupo busca el primer unlock'}</p>
            </div>
          </div>}
        </div>

        {official && <div className="mt-5 overflow-hidden rounded-[30px] border border-amber-300/30 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,.22),transparent_38%),linear-gradient(145deg,rgba(124,58,237,.14),rgba(249,115,22,.08))] p-5">
          <p className="text-center text-[9px] font-black uppercase tracking-[.2em] text-amber-300">🏆 RESULTADO OFICIAL · PR UNLOCK</p>
          <div className="mt-4 flex flex-col items-center text-center">
            <div className="relative">{official.winner_photo?<img src={official.winner_photo} alt={official.winner_name||'Ganador'} className="h-24 w-24 rounded-full border-4 border-amber-300/40 object-cover shadow-[0_0_45px_rgba(251,191,36,.2)]"/>:<div className="grid h-24 w-24 place-items-center rounded-full border-4 border-amber-300/40 bg-amber-300/10 text-2xl font-black">{initials(official.winner_name)}</div>}<span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-3 py-1 text-[9px] font-black text-black">#1</span></div>
            <h3 className="mt-5 text-2xl font-black">{official.winner_name||'Ganador PR'}</h3>
            <p className="mt-1 text-sm font-black text-amber-300">{Number(official.winner_km||0).toLocaleString('es-UY',{maximumFractionDigits:1})} km</p>
            <p className="mt-3 text-[10px] leading-5 text-white/45">La comunidad cerró con <b className="text-white">{Number(official.group_km||0).toLocaleString('es-UY',{maximumFractionDigits:1})} km</b> y alcanzó el <b className="text-white">Nivel {String(official.unlocked_level||0).padStart(2,'0')}</b>.</p>
            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.08] px-4 py-3 text-sm font-black text-amber-200">{official.prize_title||'Misión completada'}</div>
          </div>
        </div>}

        <div className="mt-6 rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(236,72,153,.10),transparent_45%),rgba(0,0,0,.30)] p-5">
          <ProgressWheel pct={pct} totalKm={totalKm} maxTarget={maxTarget} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">PRÓXIMO UNLOCK</p><p className="mt-1 text-lg font-black text-orange-300">{unlockedLevel >= 3 ? 'TODO DESBLOQUEADO' : `${nextLeft.toLocaleString('es-UY',{maximumFractionDigits:1})} km`}</p><p className="text-[9px] text-white/28">{unlockedLevel >= 3 ? 'Misión máxima alcanzada' : 'faltan para el próximo premio'}</p></div>
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">LÍDER DEL DESAFÍO</p>{leader ? <><p className="mt-1 truncate text-sm font-black">{leader.name}</p><p className="text-[9px] text-fuchsia-200/70">{leader.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km · {leader.sessions} entrenos</p></> : <p className="mt-1 text-sm font-black text-white/35">Tabla abierta</p>}</div>
          </div>
        </div>

        <div className="mt-4 rounded-[26px] border border-white/10 bg-black/30 p-4">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">KM GRUPALES</p><p className="mt-1 text-4xl font-black">{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})}<span className="text-lg text-white/30"> / {maxTarget.toLocaleString('es-UY')} km</span></p></div>
            <div className="text-right"><p className="text-2xl font-black text-fuchsia-300">{pct}%</p><p className="text-[8px] uppercase tracking-wider text-white/25">hacia nivel 03</p></div>
          </div>
          <div className="relative mt-5 pb-7">
            <div className="relative h-5 overflow-hidden rounded-full border border-white/10 bg-white/[.06] p-1">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-fuchsia-400 to-violet-400 shadow-[0_0_24px_rgba(236,72,153,.45)] transition-all" style={{width:`${pct}%`}} />
            </div>
            {[1,2,3].map((level)=>{const target=targets[level-1],pos=Math.min(100,(target/maxTarget)*100),unlocked=totalKm>=target;return <div key={level} className="absolute top-[-4px] -translate-x-1/2 text-center" style={{left:`${pos}%`}}><div className={`mx-auto grid h-7 w-7 place-items-center rounded-full border-2 border-[#111016] text-[9px] font-black ${unlocked?'bg-emerald-300 text-black':'bg-white/15 text-white/60'}`}>{unlocked?'✓':level}</div><p className="mt-1 whitespace-nowrap text-[7px] font-black text-white/35">{target.toLocaleString('es-UY')} KM</p></div>})}
            <span className="absolute left-0 top-7 text-[7px] font-black text-white/25">0 KM</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">PRÓXIMO UNLOCK</p><p className="mt-1 text-lg font-black text-orange-300">{unlockedLevel >= 3 ? 'TODO DESBLOQUEADO' : `${nextLeft.toLocaleString('es-UY',{maximumFractionDigits:1})} km`}</p><p className="text-[9px] text-white/28">{unlockedLevel >= 3 ? 'Misión máxima alcanzada' : 'faltan para el próximo premio'}</p></div>
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">LÍDER DEL DESAFÍO</p>{leader ? <><p className="mt-1 truncate text-sm font-black">{leader.name}</p><p className="text-[9px] text-fuchsia-200/70">{leader.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km · {leader.sessions} entrenos</p></> : <p className="mt-1 text-sm font-black text-white/35">Tabla abierta</p>}</div>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-[28px] border border-fuchsia-300/15 bg-fuchsia-400/[.045] p-4">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-fuchsia-300">QUIÉNES ESTÁN MOVIENDO LA RUEDA</p><h3 className="mt-1 text-lg font-black">Aporte al PR Unlock</h3></div><span className="rounded-full bg-white/[.06] px-3 py-1 text-[9px] font-black text-white/40">{campaignRanking.length} rollers</span></div>
          {contributors.length ? <div className="mt-4 flex gap-3 overflow-x-auto pb-2">{contributors.map((row,index)=><div key={row.alumnoId} className="min-w-[108px] rounded-[20px] border border-white/[.08] bg-black/25 p-3 text-center"><div className="relative mx-auto w-fit">{row.photo?<img src={row.photo} alt={row.name} className="h-14 w-14 rounded-full border-2 border-fuchsia-300/20 object-cover"/>:<div className="grid h-14 w-14 place-items-center rounded-full border-2 border-fuchsia-300/20 bg-fuchsia-400/10 text-sm font-black">{initials(row.name)}</div>}<span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#100d13] bg-fuchsia-300 text-[8px] font-black text-black">{index+1}</span></div><p className="mt-3 truncate text-[10px] font-black">{row.name.split(' ')[0]}</p><p className="mt-1 text-[9px] font-black text-fuchsia-200">{row.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p></div>)}</div>:<p className="mt-3 text-[10px] text-white/30">Todavía no hay kilómetros dentro de esta misión.</p>}
        </div>
        <div className="mt-5 space-y-3">
          {[1,2,3].map((level)=><PrizeVisual key={level} campaign={campaign} level={level} totalKm={totalKm} />)}
        </div>
      </div>
    </section>
  )
}

function Podium({ ranking, period, statuses }) {
  const first = ranking[0], second = ranking[1], third = ranking[2]
  const card = (row, order) => row ? (
    <div key={row.alumnoId} className={`flex min-w-0 flex-1 flex-col items-center ${order === 1 ? '-translate-y-3' : ''}`}>
      <div className="relative">
        {order === 1 && <div className="absolute -inset-6 rounded-full bg-amber-300/10 blur-2xl" />}
        <PodiumAvatar row={row} size={order === 1 ? 'xl' : 'lg'} />
        <span className={`absolute -bottom-2 left-1/2 grid -translate-x-1/2 place-items-center rounded-full border-[3px] border-[#0b0c10] font-black ${order === 1 ? 'h-8 w-8 bg-amber-300 text-black' : order === 2 ? 'h-7 w-7 bg-slate-200 text-black' : 'h-7 w-7 bg-orange-700 text-white'}`}>{order}</span>
      </div>
      <p className="mt-5 max-w-[115px] truncate text-center text-sm font-black">{row.name}</p>
      <p className={`mt-1 text-xl font-black ${order === 1 ? 'text-amber-300' : 'text-white'}`}>{row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km</p>
      <p className="mt-1 text-[9px] uppercase tracking-[.13em] text-white/30">{row.sessions} entreno{row.sessions === 1 ? '' : 's'}</p>
      {statuses?.[String(row.alumnoId)] ? <p className="mt-2 max-w-[125px] break-words rounded-xl border border-white/[.07] bg-black/25 px-2 py-2 text-center text-[9px] font-bold leading-3 text-white/60">“{statuses[String(row.alumnoId)]}”</p> : null}
      <div className={`mt-3 flex w-full items-start justify-center rounded-t-[18px] border border-white/10 bg-gradient-to-b pt-3 text-2xl ${order === 1 ? 'h-28 from-amber-400/20 to-white/[.03]' : order === 2 ? 'h-20 from-slate-300/10 to-white/[.02]' : 'h-16 from-orange-700/15 to-white/[.02]'}`}>{order === 1 ? '👑' : order === 2 ? '🥈' : '🥉'}</div>
    </div>
  ) : <div key={`empty-${order}`} className="min-w-0 flex-1" />
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300">TOP 3 · {period === 'week' ? 'ESTA SEMANA' : 'ESTE MES'}</p>
          <h2 className="mt-1 text-2xl font-black">El podio PR</h2>
        </div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-300">STRAVA</span>
      </div>
      <div className="grid grid-cols-3 items-end gap-2">{card(second, 2)}{card(first, 1)}{card(third, 3)}</div>
    </div>
  )
}

function RollerweenChallenge({ ranking=[] }) {
  if (!isRollerweenActive()) return null
  const total = ranking.reduce((sum,row)=>sum+Number(row.km||0),0)
  const candy = ROLLERWEEN.weeklyChallengeKm
  const bombons = ROLLERWEEN.weeklyBombonsKm
  const pct = Math.min(100, Math.round((total/bombons)*100))
  const candyReached = total >= candy
  const bombonsReached = total >= bombons
  const nextTarget = bombonsReached ? null : candyReached ? bombons : candy
  const left = nextTarget ? Math.max(0,nextTarget-total) : 0
  return <section className="pr-rollerween-card rounded-[32px] p-5">
    <div className="relative z-10">
      <div className="flex items-start justify-between gap-4">
        <div><div className="pr-rw-stamp">ROLLERWEEN // WEEKLY DROP</div><p className="mt-4 pr-rw-kicker">DESAFÍO GRUPAL · STRAVA</p><h2 className="pr-rw-title mt-1 text-[38px] text-white">200 → 350 KM<br/><span className={bombonsReached?'pr-rw-acid':'pr-rw-purple'}>{bombonsReached?'BOMBONES ON.':candyReached?'CARAMELOS ON.':'EN JUEGO.'}</span></h2></div>
        <div className="pr-rw-pumpkin-wheel shrink-0 scale-[.78]" aria-hidden="true"/>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-white/45">Cada kilómetro inline del grupo suma esta semana. A los <b className="text-white">200 km</b> desbloqueamos caramelos para la clase del sábado; a los <b className="text-[#BEFF37]">350 km</b>, hacemos upgrade a bombones.</p>
      <div className="mt-5 rounded-[22px] border border-white/[.07] bg-black/30 p-4">
        <div className="flex items-end justify-between"><div><p className="font-mono text-[8px] font-black uppercase tracking-[.15em] text-white/25">KM GRUPALES · ESTA SEMANA</p><p className="mt-1 text-[35px] font-black text-white">{total.toLocaleString('es-UY',{maximumFractionDigits:1})}<span className="text-base text-white/28"> / {bombons} km</span></p></div><p className="text-2xl font-black text-[#BEFF37]">{pct}%</p></div>
        <div className="mt-4 grid grid-cols-2 gap-2"><div className={`rounded-[15px] border p-3 ${candyReached?'border-violet-300/30 bg-violet-400/10':'border-white/10 bg-white/[.025]'}`}><p className="text-[8px] font-black text-white/28">NIVEL 01 · 200 KM</p><p className={`mt-1 text-[10px] font-black ${candyReached?'text-violet-200':'text-white/45'}`}>{candyReached?'✓ CARAMELOS':'🍬 CARAMELOS'}</p></div><div className={`rounded-[15px] border p-3 ${bombonsReached?'border-[#BEFF37]/30 bg-[#BEFF37]/10':'border-white/10 bg-white/[.025]'}`}><p className="text-[8px] font-black text-white/28">NIVEL 02 · 350 KM</p><p className={`mt-1 text-[10px] font-black ${bombonsReached?'text-[#BEFF37]':'text-white/45'}`}>{bombonsReached?'✓ BOMBONES':'🍫 BOMBONES'}</p></div></div>
        <div className="mt-4 h-4 overflow-hidden rounded-full border border-white/[.08] bg-white/[.04] p-[3px]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-[#BEFF37]" style={{width:`${Math.max(2,pct)}%`}}/></div>
        <div className="mt-3 flex items-center justify-between text-[9px] font-black uppercase tracking-[.08em]"><span className="text-white/28">RESET AUTOMÁTICO · LUNES</span><span className={bombonsReached?'text-[#BEFF37]':candyReached?'text-violet-200':'text-white/35'}>{bombonsReached?'BOMBONES DESBLOQUEADOS':candyReached?`FALTAN ${left.toLocaleString('es-UY',{maximumFractionDigits:1})} KM PARA BOMBONES`:`FALTAN ${left.toLocaleString('es-UY',{maximumFractionDigits:1})} KM PARA CARAMELOS`}</span></div>
      </div>
    </div>
  </section>
}
export default function PublicWeeklyRanking() {
  const { user } = useAuth()
  const ranges = useMemo(() => dateRanges(), [])
  const [params, setParams] = useSearchParams()
  const requested = params.get('period')
  const initialPeriod = requested === 'week' ? 'week' : 'month'
  const [period, setPeriod] = useState(initialPeriod)
  const [loading, setLoading] = useState(true)
  const [rankingRows, setRankingRows] = useState({ week: [], month: [], previousMonth: [] })
  const [unlockRanking, setUnlockRanking] = useState([])
  const [profiles, setProfiles] = useState(new Map())
  const [message, setMessage] = useState('')
  const [statuses, setStatuses] = useState({})
  const [unlockCampaign, setUnlockCampaign] = useState(null)
  const [unlockResult, setUnlockResult] = useState(null)
  function changePeriod(next) {
    setPeriod(next)
    setParams({ period: next })
  }

  useEffect(() => {
    let active = true
    async function load({ silent = false } = {}) {
      if (!silent) setLoading(true)
      setMessage('')
      try {
        const [profilesResponse, weekResponse, monthResponse, previousMonthResponse, statusesResponse, unlockResponse] = await Promise.all([
          supabase.from('profiles_public').select('*').limit(500),
          supabase.rpc('pr_get_inline_ranking', { p_start_date: ranges.week.start, p_end_date: ranges.week.end }),
          supabase.rpc('pr_get_inline_ranking', { p_start_date: ranges.month.start, p_end_date: ranges.month.end }),
          supabase.rpc('pr_get_inline_ranking', { p_start_date: ranges.previousMonth.start, p_end_date: ranges.previousMonth.end }),
          supabase.from('pr_ranking_statuses').select('alumno_id,status_text,updated_at'),
          supabase.from('pr_unlock_campaigns').select('*').eq('active', true).order('starts_on', { ascending: false }).limit(1).maybeSingle(),
        ])
        if (!active) return
        if (weekResponse.error) throw weekResponse.error
        if (monthResponse.error) throw monthResponse.error
        if (previousMonthResponse.error) throw previousMonthResponse.error
        const profileMap = buildProfileMap(profilesResponse.data || [])
        const hydrateRanking = (rows) => (rows || []).map((row) => {
          const alumnoId = String(row.alumno_id || '')
          const profile = profileMap.get(alumnoId) || {}
          return {
            alumnoId,
            km: Number(row.km) || 0,
            sessions: Number(row.sessions) || 0,
            name: profileName(profile),
            photo: profilePhoto(profile),
          }
        }).sort((a, b) => b.km - a.km || b.sessions - a.sessions || a.name.localeCompare(b.name))
        setRankingRows({
          week: hydrateRanking(weekResponse.data),
          month: hydrateRanking(monthResponse.data),
          previousMonth: hydrateRanking(previousMonthResponse.data),
        })
        setStatuses(Object.fromEntries((statusesResponse.data || []).map((row) => [String(row.alumno_id), row.status_text || ''])))
        setProfiles(profileMap)
        setUnlockCampaign(unlockResponse.data || null)
        if (unlockResponse.data?.id) {
          const [unlockRankingResponse, resultResponse] = await Promise.all([
            supabase.rpc('pr_get_inline_ranking', {
              p_start_date: unlockResponse.data.starts_on,
              p_end_date: unlockResponse.data.ends_on,
            }),
            supabase.from('pr_unlock_results').select('*').eq('campaign_id', unlockResponse.data.id).maybeSingle(),
          ])
          if (unlockRankingResponse.error) throw unlockRankingResponse.error
          if (active) {
            setUnlockRanking(hydrateRanking(unlockRankingResponse.data))
            setUnlockResult(resultResponse.data || null)
          }
        } else if (active) {
          setUnlockRanking([])
          setUnlockResult(null)
        }
      } catch (error) {
        if (active) setMessage(error?.message || 'No pudimos cargar el ranking.')
      } finally {
        if (active && !silent) setLoading(false)
      }
    }
    load()
    const interval = window.setInterval(() => load({ silent: true }), 60000)
    const onFocus = () => load({ silent: true })
    const onVisibility = () => { if (document.visibilityState === 'visible') load({ silent: true }) }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ranges])

  const ranking = rankingRows[period] || []
  const previousMonthRanking = rankingRows.previousMonth || []
  const myId = String(user?.id || '')
  const myPosition = ranking.findIndex((row) => String(row.alumnoId) === myId) + 1
  const myRow = myPosition > 0 ? ranking[myPosition - 1] : null
  const totalKm = ranking.reduce((sum, row) => sum + row.km, 0)
  const topFive = ranking.slice(0, 5)
  const currentRange = period === 'week' ? ranges.week : ranges.month
  const periodLabel = period === 'week' ? 'ESTA SEMANA' : 'ESTE MES'
  const previousWinner = previousMonthRanking[0]
  const fourth = ranking[3]
  const third = ranking[2]
  const gapToPodium = fourth && third ? Math.max(0, third.km - fourth.km) : null
  const fifth = ranking[4]
  const fourthGap = fifth && fourth ? Math.max(0, fourth.km - fifth.km) : null
  const Shell = user ? AppLayout : PublicLayout

  return (
    <Shell>
      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5">
        <section className="relative overflow-hidden rounded-[34px] border border-amber-300/20 bg-[radial-gradient(circle_at_90%_0%,rgba(251,191,36,.16),transparent_32%),radial-gradient(circle_at_5%_100%,rgba(124,58,237,.24),transparent_40%),linear-gradient(145deg,#1a1206,#0a0b10_55%,#100919)] p-5 shadow-[0_30px_90px_rgba(0,0,0,.42)]">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-amber-300/10" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.22em] text-amber-300">PR KM CHALLENGE · STRAVA</p>
                <h1 className="mt-1 text-[34px] font-black leading-none">RANKING<br/><span className="text-orange-400">SOBRE RUEDAS.</span></h1>
                <p className="mt-3 max-w-[440px] text-[11px] leading-5 text-white/45">Cada kilómetro de patinaje inline cuenta. También tus deberes de entrenamiento: una sola actividad alimenta tu perfil, tu evolución y esta tabla.</p>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-wider text-emerald-300">● LIVE</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-[20px] border border-white/[.08] bg-black/25 p-1.5">
              <button onClick={() => changePeriod('week')} className={`rounded-[15px] px-4 py-3 text-[10px] font-black transition ${period === 'week' ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-black shadow-[0_10px_30px_rgba(251,146,60,.18)]' : 'text-white/40'}`}>ESTA SEMANA</button>
              <button onClick={() => changePeriod('month')} className={`rounded-[15px] px-4 py-3 text-[10px] font-black transition ${period === 'month' ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 text-black shadow-[0_10px_30px_rgba(192,132,252,.18)]' : 'text-white/40'}`}>ESTE MES</button>
            </div>
          </div>
        </section>

        {loading ? <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[.03] p-6 text-center text-xs text-white/35">Actualizando kilómetros de Strava…</div> : message ? <div className="mt-4 rounded-[28px] border border-red-300/15 bg-red-400/[.06] p-5 text-xs text-red-200">{message}</div> : <div className="mt-4 space-y-4">
          <RollerweenChallenge ranking={rankingRows.week} />

          <PRUnlock campaign={unlockCampaign} ranking={unlockRanking} result={unlockResult} />

          <section className="rounded-[30px] border border-white/[.08] bg-white/[.03] p-5">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-[9px] font-black uppercase tracking-[.17em] text-white/30">{periodLabel}</p><h2 className="mt-1 text-2xl font-black">{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})} km en juego</h2></div>
              <div className="text-right"><p className="text-2xl font-black text-orange-300">{ranking.length}</p><p className="text-[8px] font-black uppercase text-white/25">rollers sumando</p></div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-violet-400" style={{width:`${ranking.length ? 100 : 0}%`}} /></div>
            <p className="mt-3 text-[9px] text-white/28">Período: {longDate(currentRange.start)} → {longDate(currentRange.end)}</p>
          </section>

          {ranking.length > 0 && <section className="rounded-[32px] border border-white/[.08] bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,.09),transparent_35%),rgba(255,255,255,.025)] p-5"><Podium ranking={ranking} period={period} statuses={statuses} /></section>}

          {myRow && <section className="overflow-hidden rounded-[30px] border border-violet-300/20 bg-[radial-gradient(circle_at_100%_0%,rgba(167,139,250,.20),transparent_35%),rgba(139,92,246,.06)] p-5">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">TU POSICIÓN · {periodLabel}</p>
            <div className="mt-3 flex items-center gap-4">
              <PodiumAvatar row={myRow} />
              <div className="min-w-0 flex-1"><p className="text-3xl font-black">#{myPosition}</p><p className="truncate text-sm font-black">{myRow.name}</p><p className="mt-1 text-xs font-black text-violet-200">{myRow.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km · {myRow.sessions} entrenos</p></div>
            </div>
          </section>}

          {fourth && <section className="rounded-[28px] border border-orange-300/15 bg-orange-400/[.05] p-4">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-orange-300">🔥 LA PELEA POR EL PODIO</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[18px] border border-white/[.07] bg-black/20 p-3"><p className="text-[8px] font-black text-white/25">#4 {fourth.name}</p><p className="mt-1 text-lg font-black">{fourth.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p><p className="text-[9px] text-white/30">{gapToPodium !== null ? `a ${gapToPodium.toLocaleString('es-UY',{maximumFractionDigits:1})} km del #3` : 'peleando el podio'}</p></div>
              <div className="rounded-[18px] border border-white/[.07] bg-black/20 p-3"><p className="text-[8px] font-black text-white/25">PRESIÓN DESDE ABAJO</p><p className="mt-1 text-lg font-black">{fifth ? fifth.name : 'Tabla abierta'}</p><p className="text-[9px] text-white/30">{fifth && fourthGap !== null ? `a ${fourthGap.toLocaleString('es-UY',{maximumFractionDigits:1})} km del #4` : 'cada km puede cambiar todo'}</p></div>
            </div>
          </section>}

          <section className="overflow-hidden rounded-[32px] border border-white/[.08] bg-white/[.025]">
            <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">CLASIFICACIÓN COMPLETA</p><h2 className="mt-1 text-xl font-black">{periodLabel}</h2></div><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[9px] font-black text-white/40">{ranking.length}</span></div>
            {ranking.length ? <div className="divide-y divide-white/[.06]">{ranking.map((row,index)=>{
              const rank=index+1, status=statuses[String(row.alumnoId)] || ''
              return <div key={row.alumnoId} className={`flex items-center gap-3 px-4 py-3 ${String(row.alumnoId)===myId?'bg-violet-400/[.07]':''}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${rank===1?'bg-amber-300 text-black':rank===2?'bg-slate-200 text-black':rank===3?'bg-orange-700 text-white':'bg-white/[.06] text-white/45'}`}>{rank}</span><PodiumAvatar row={row}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{row.name}</p><p className="text-[9px] text-white/30">{row.sessions} entreno{row.sessions===1?'':'s'}{status?` · “${status}”`:''}</p></div><div className="text-right"><p className={`text-sm font-black ${rank<=3?'text-amber-300':'text-white'}`}>{row.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p></div></div>
            })}</div> : <div className="p-8 text-center text-xs text-white/30">Todavía no hay kilómetros para este período.</div>}
          </section>

          {period === 'month' && previousWinner && <section className="rounded-[28px] border border-sky-300/15 bg-sky-400/[.045] p-4"><p className="text-[9px] font-black uppercase tracking-[.17em] text-sky-300">🏆 CIERRE DEL MES ANTERIOR</p><div className="mt-3 flex items-center gap-3"><PodiumAvatar row={previousWinner}/><div><p className="text-sm font-black">{previousWinner.name}</p><p className="mt-1 text-[10px] text-white/40">cerró #1 con {previousWinner.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km registrados</p></div></div></section>}

          <section className="rounded-[28px] border border-white/[.07] bg-black/20 p-4 text-[10px] leading-5 text-white/35"><b className="text-white/65">Cómo suma:</b> entran únicamente actividades de patinaje inline registradas en PR. Las actividades rechazadas o eliminadas no cuentan. Los deberes de Shifter que llegan desde Strava también forman parte del mismo kilometraje: no se duplican.</section>
        </div>}

        <Link to={user ? '/app/actividad' : '/'} className="mt-5 flex min-h-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[.04] text-xs font-black text-white/55">{user ? 'VOLVER AL ROLLER FEED' : 'VOLVER A PUNTA ROLLERS'}</Link>
      </div>
    </Shell>
  )
}
