import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

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
  const dimension = size === 'xl' ? 'h-24 w-24' : size === 'sm' ? 'h-11 w-11' : 'h-20 w-20'
  if (row?.photo) return <img src={row.photo} alt={row.name} className={`${dimension} rounded-full border-4 border-black/70 object-cover shadow-[0_15px_45px_rgba(0,0,0,.35)]`} />
  return <div className={`${dimension} grid place-items-center rounded-full border-4 border-black/70 bg-gradient-to-br from-amber-400/35 via-violet-500/15 to-white/10 text-xl font-black`}>{initials(row?.name)}</div>
}

function PrizeVisual({ campaign, level, totalKm, preview = false }) {
  const target = Number(campaign?.[`prize_${level}_target_km`] || 0)
  const unlocked = !preview && target > 0 && totalKm >= target
  const revealed = level === 1 || unlocked
  const progress = Math.min(100, Math.max(0, totalKm / Math.max(1,target) * 100))
  const prize = campaign?.[`prize_${level}_title`] || 'Premio'
  const icons = ['🍷','🍫','🎟️']
  return <article className={`group relative overflow-hidden rounded-[24px] border p-4 transition-colors sm:p-5 ${unlocked ? 'border-[#c9fb60]/45 bg-[#c9fb60]/[.09]' : 'border-white/10 bg-[#171c20]'}`}>
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-[#c9fb60]/[.055] blur-2xl"/>
    <div className="relative flex items-center gap-4">
      <div className={`relative grid h-[84px] w-[84px] shrink-0 place-items-center overflow-hidden rounded-[22px] border text-[39px] shadow-[inset_0_1px_0_rgba(255,255,255,.06)] ${unlocked ? 'border-[#c9fb60]/40 bg-[#c9fb60]/10' : 'border-white/10 bg-gradient-to-br from-[#30383a] to-[#111518]'}`} aria-hidden="true">
        {revealed ? <span className="drop-shadow-[0_6px_10px_rgba(0,0,0,.25)]">{icons[level-1]}</span> : <div className="relative"><span className="text-[50px] drop-shadow-lg">🎁</span><span className="absolute -right-1 top-3 grid h-6 w-6 place-items-center rounded-full border border-[#c9fb60]/50 bg-[#171c20] text-base font-black text-[#c9fb60]">?</span></div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1.5"><span className="text-[10px] font-black uppercase tracking-[.16em] text-[#c9fb60]">RECOMPENSA 0{level}</span><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${unlocked?'bg-[#c9fb60] text-[#111419]':'bg-white/[.07] text-white/50'}`}>{unlocked?'✓ Desbloqueada':preview?'Próximamente':'🔒 Bloqueada'}</span></div>
        <h3 className="mt-2 text-[17px] font-black leading-tight text-[#f3f1e9]">{revealed ? prize : 'Regalo misterioso'}</h3>
        <p className="mt-1 text-[11px] leading-4 text-white/50">{revealed ? campaign?.[`prize_${level}_detail`] : 'La sorpresa se revela cuando la comunidad alcanza este nivel.'}</p>
      </div>
    </div>
    <div className="relative mt-4 flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-white/45">Progreso del equipo</span><span className="text-[11px] font-black text-[#c9fb60]">{target.toLocaleString('es-UY')} KM</span></div>
    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`Progreso para desbloquear el premio ${level}`} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-[#a4e449] via-[#c9fb60] to-[#f1d48e] transition-all duration-700" style={{width:`${progress}%`}} /></div>
    <div className="mt-2 flex justify-between text-[10px] text-white/40"><span>{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})} km reunidos</span><span>{Math.round(progress)}%</span></div>
  </article>
}

function ProgressWheel({ pct, totalKm, maxTarget, targets = [] }) {
  const radius = 78, circumference = 2 * Math.PI * radius
  const safePct = Math.max(0, Math.min(100, pct))
  const milestones = targets.filter(t => Number(t) > 0).map((target, i) => ({target, i, pct: Math.min(100, Number(target) / Math.max(1,maxTarget) * 100)}))
  return <div className="relative mx-auto w-full max-w-[340px]">
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" role="img" aria-label={`Progreso comunitario: ${totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})} de ${maxTarget} kilómetros, ${safePct}%`}>
        <defs><linearGradient id="prUnlockRing" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c9fb60"/><stop offset="60%" stopColor="#e1f7a3"/><stop offset="100%" stopColor="#f4d78b"/></linearGradient><filter id="prUnlockGlow"><feGaussianBlur stdDeviation="4"/></filter></defs>
        <circle cx="110" cy="110" r="94" fill="none" stroke="rgba(255,255,255,.035)" strokeWidth="1" strokeDasharray="2 7"/>
        <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="16"/>
        <circle cx="110" cy="110" r={radius} fill="none" stroke="url(#prUnlockRing)" strokeWidth="18" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - safePct / 100)} opacity=".38" filter="url(#prUnlockGlow)" className="transition-all duration-700"/>
        <circle cx="110" cy="110" r={radius} fill="none" stroke="url(#prUnlockRing)" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - safePct / 100)} className="transition-all duration-700"/>
        {milestones.map(({target,i,pct:at}) => {const theta = (at / 100) * Math.PI * 2, x = 110 + radius * Math.cos(theta), y = 110 + radius * Math.sin(theta);return <circle key={target} cx={x} cy={y} r="5.5" fill={totalKm >= target ? '#c9fb60' : '#313b3a'} stroke="#12171b" strokeWidth="3" />})}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#c9fb60]">KM COMUNIDAD</p>
        <p className="mt-2 text-[clamp(35px,10vw,52px)] font-black leading-none tracking-tight">{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})}</p>
        <p className="mt-2 text-xs font-bold text-white/45">de {maxTarget.toLocaleString('es-UY')} km</p>
        <p className="mt-3 rounded-full bg-[#c9fb60]/10 px-3 py-1 text-xs font-black text-[#c9fb60]">{safePct}% COMPLETADO</p>
      </div>
    </div>
    <div className="mt-1 grid grid-cols-3 gap-2">{milestones.map(({target,i})=><div key={target} className="text-center"><span className={`mx-auto block h-1.5 w-1.5 rounded-full ${totalKm >= target ? 'bg-[#c9fb60]' : 'bg-white/25'}`}/><p className="mt-2 text-[10px] font-black text-white/65">N{i+1} · {target} km</p></div>)}</div>
  </div>
}

function PRUnlock({ campaign, ranking = [], result, preview = false, demo = false }) {
  if (!campaign) return null
  const campaignRanking = ranking
  const totalKm = demo ? 580 : preview ? 0 : campaignRanking.reduce((sum, row) => sum + row.km, 0)
  const maxTarget = Number(campaign.prize_3_target_km || 1)
  const pct = Math.min(100, Math.round((totalKm / maxTarget) * 100))
  const targets = [1,2,3].map((level) => Number(campaign[`prize_${level}_target_km`] || 0))
  const unlockedLevel = totalKm >= targets[2] ? 3 : totalKm >= targets[1] ? 2 : totalKm >= targets[0] ? 1 : 0
  const nextTarget = targets[Math.min(unlockedLevel, 2)]
  const nextLeft = unlockedLevel >= 3 ? 0 : Math.max(0, nextTarget - totalKm)
  const activePrizeLevel = unlockedLevel
  const activePrizeTitle = activePrizeLevel ? campaign[`prize_${activePrizeLevel}_title`] : null
  const activePrizeDetail = activePrizeLevel ? campaign[`prize_${activePrizeLevel}_detail`] : null
  const activePrizeIcon = activePrizeLevel === 1 ? '🍷' : activePrizeLevel === 2 ? '🍫' : activePrizeLevel === 3 ? '🎟️' : '🔒'
  const leader = demo || preview ? null : campaignRanking[0]
  const today = montevideoToday().date
  const finished = !preview && today > campaign.ends_on
  const contributors = demo || preview ? [] : campaignRanking.slice(0,12)
  const official = !demo && !preview && finished && result?.finalized_at && String(result.campaign_id)===String(campaign.id) ? result : null
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[#c9fb60]/25 bg-[radial-gradient(circle_at_90%_0%,rgba(201,251,96,.12),transparent_40%),linear-gradient(145deg,#181e20,#0e1316_65%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,.38)]">
      <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-orange-300/15" />
      <div className="relative">
        {demo && <div className="mb-4 rounded-[18px] border border-[#c9fb60]/50 bg-[#c9fb60]/15 px-4 py-3 text-[11px] font-black leading-5 text-[#c9fb60]">👁️ VISTA DEMO DE DISEÑO · 580 KM SIMULADOS. No modifica kilómetros, premios, fechas ni ganadores reales.</div>}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#c9fb60]">PR UNLOCK · MISIÓN DEL MES</p>
            <h2 className="mt-1 text-[31px] font-black leading-none">Todos sumamos.<br/><span className="text-[#c9fb60]">Uno gana.</span></h2>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-wider ${finished ? 'border-white/10 bg-white/5 text-white/40' : 'border-emerald-300/20 bg-emerald-400/[.08] text-emerald-300'}`}>{demo ? '● DEMOSTRACIÓN' : preview ? 'PRÓXIMAMENTE · 01 NOV' : finished ? 'CERRADA' : '● EN VIVO'}</span>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/48">Cada kilómetro de patinaje inline suma dos veces: a tu posición personal y al objetivo colectivo. El grupo desbloquea los niveles; al cierre de la misión, el <b className="text-white">#1 del ranking del desafío</b> gana únicamente el premio de mayor nivel alcanzado.</p>
        <div className="mt-4 rounded-[20px] border border-sky-300/20 bg-sky-400/[.07] p-4">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-300">📍 EL DESAFÍO ARRANCA DESDE CERO</p>
          <p className="mt-2 text-[10px] leading-5 text-white/48">El Ranking PR sigue mostrando los kilómetros del mes calendario. <b className="text-white">PR UNLOCK cuenta únicamente los kilómetros registrados durante las fechas indicadas de esta misión.</b> Los kilómetros anteriores no se pierden: simplemente pertenecen al ranking normal y no a esta misión.</p>
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

        <div className="mt-6 rounded-[30px] border border-[#c9fb60]/15 bg-[radial-gradient(circle_at_50%_30%,rgba(201,251,96,.09),transparent_48%),rgba(0,0,0,.30)] p-5">
          <ProgressWheel pct={pct} totalKm={totalKm} maxTarget={maxTarget} targets={targets} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">PRÓXIMO UNLOCK</p><p className="mt-1 text-lg font-black text-[#c9fb60]">{unlockedLevel >= 3 ? 'TODO DESBLOQUEADO' : `${nextLeft.toLocaleString('es-UY',{maximumFractionDigits:1})} km`}</p><p className="text-[9px] text-white/28">{unlockedLevel >= 3 ? 'Misión máxima alcanzada' : 'faltan para el próximo premio'}</p></div>
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">LÍDER DEL DESAFÍO</p>{leader ? <><p className="mt-1 truncate text-sm font-black">{leader.name}</p><p className="text-[9px] text-[#c9fb60]/75">{leader.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km · {leader.sessions} entrenos</p></> : <p className="mt-1 text-sm font-black text-white/35">Tabla abierta</p>}</div>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-[#c9fb60]/15 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-[#c9fb60]">⚡ ENERGÍA COLECTIVA</p><p className="mt-1 text-[11px] text-white/45">Cada kilómetro acerca al equipo al siguiente premio.</p></div><span className="text-lg font-black text-[#c9fb60]">{pct}%</span></div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso total de la comunidad"><div className="h-full rounded-full bg-gradient-to-r from-[#a9e54b] via-[#c9fb60] to-[#f4d78b] transition-all duration-700" style={{width:`${pct}%`}} /></div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold text-white/45"><span>{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})} km aportados</span><span>{unlockedLevel >= 3 ? '¡META COMPLETA!' : `Faltan ${nextLeft.toLocaleString('es-UY',{maximumFractionDigits:1})} km`}</span></div>
        </div>
        <div className="mt-4 overflow-hidden rounded-[28px] border border-[#c9fb60]/15 bg-[#c9fb60]/[.035] p-4">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#c9fb60]">QUIÉNES ESTÁN MOVIENDO LA RUEDA</p><h3 className="mt-1 text-lg font-black">Aporte al PR Unlock</h3></div><span className="rounded-full bg-white/[.06] px-3 py-1 text-[9px] font-black text-white/40">{campaignRanking.length} rollers</span></div>
          {contributors.length ? <div className="mt-4 flex gap-3 overflow-x-auto pb-2">{contributors.map((row,index)=><div key={row.alumnoId} className="min-w-[108px] rounded-[20px] border border-white/[.08] bg-black/25 p-3 text-center"><div className="relative mx-auto w-fit">{row.photo?<img src={row.photo} alt={row.name} className="h-14 w-14 rounded-full border-2 border-[#c9fb60]/25 object-cover"/>:<div className="grid h-14 w-14 place-items-center rounded-full border-2 border-fuchsia-300/20 bg-[#c9fb60]/10 text-sm font-black">{initials(row.name)}</div>}<span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#100d13] bg-[#c9fb60] text-[8px] font-black text-black">{index+1}</span></div><p className="mt-3 truncate text-[10px] font-black">{row.name.split(' ')[0]}</p><p className="mt-1 text-[9px] font-black text-[#c9fb60]">{row.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p></div>)}</div>:<p className="mt-3 text-[10px] text-white/30">Todavía no hay kilómetros dentro de esta misión.</p>}
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#c9fb60]">REWARD VAULT / NOVIEMBRE</p><h3 className="mt-1 text-xl font-black">Abrí el siguiente nivel.</h3></div><span className="text-2xl" aria-hidden="true">🎀</span></div>
          {[1,2,3].map((level)=><PrizeVisual key={level} campaign={campaign} level={level} totalKm={totalKm} preview={preview} />)}
        </div>
      </div>
    </section>
  )
}

function Podium({ ranking, period, statuses }) {
  const cards = [ranking[1],ranking[0],ranking[2]]
  return <div>
    <div className="mb-7 flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#c9fb60]">TOP 03 / {period === 'week' ? 'SEMANA' : 'MES'}</p><h2 className="mt-1 text-3xl font-black uppercase italic tracking-tight">El podio<span className="text-[#c9fb60]">.</span></h2></div><span className="rounded-full border border-[#c9fb60]/20 px-3 py-1 text-[9px] font-black text-[#c9fb60]">STRAVA / LIVE</span></div>
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">{cards.map((row,index)=>{const rank=[2,1,3][index];return row?<div key={row.alumnoId} className={`min-w-0 rounded-[20px] border px-2 pb-0 pt-4 text-center sm:px-4 ${rank===1?'border-[#c9fb60]/40 bg-[#c9fb60]/[.09]':'border-white/10 bg-white/[.035]'}`}>
      <div className="relative mx-auto w-fit"><div className={`overflow-hidden rounded-full border-2 ${rank===1?'border-[#c9fb60]':'border-white/20'}`}><div className="scale-[.85]"><PodiumAvatar row={row} size={rank===1?'xl':'lg'}/></div></div><span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-1 text-[10px] font-black ${rank===1?'bg-[#c9fb60] text-[#111419]':'bg-[#353c40] text-white'}`}>#{rank}</span></div>
      <p className="mt-5 truncate text-[11px] font-black sm:text-sm">{row.name}</p><p className={`mt-1 text-lg font-black sm:text-2xl ${rank===1?'text-[#c9fb60]':'text-[#f3f1e9]'}`}>{row.km.toLocaleString('es-UY',{maximumFractionDigits:1})}<span className="ml-1 text-[10px] text-white/45">km</span></p>
      <p className="mt-1 truncate text-[9px] text-white/40">{row.sessions} entrenos</p><div className={`mt-4 grid place-items-center rounded-t-[12px] border-t border-white/10 font-black ${rank===1?'h-20 bg-[#c9fb60]/15 text-4xl text-[#c9fb60]':'h-12 bg-white/5 text-2xl text-white/40'}`}>{String(rank).padStart(2,'0')}</div>
    </div>:<div key={rank} className="min-w-0" />})}</div>
  </div>
}

function PodiumDuel({ challenger, defender, gap }) {
  if (!challenger || !defender) return null
  const player = (row, rank) => <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center">
    <div className="relative">
      <div aria-hidden="true" className="absolute -inset-3 rounded-full bg-red-600/20 blur-xl motion-safe:animate-pulse" />
      <div aria-hidden="true" className="absolute -inset-2 rounded-full border-2 border-dashed border-red-500/75 motion-safe:animate-[spin_9s_linear_infinite]" />
      <div aria-hidden="true" className="absolute -inset-1 rounded-full border border-[#c9fb60]/65 motion-safe:animate-[spin_6s_linear_infinite_reverse]" />
      <div className="relative rounded-full border-[3px] border-red-500 bg-[#1b1e1f] p-1 shadow-[0_0_25px_rgba(220,38,38,.38)]"><PodiumAvatar row={row} size="lg"/></div>
      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c9fb60] px-2.5 py-1 text-[10px] font-black text-black shadow-[0_0_18px_rgba(201,251,96,.35)]">#{rank}</span>
    </div>
    <p className="mt-6 w-full truncate text-center text-xs font-black">{row.name}</p>
    <p className="mt-1 text-sm font-black text-[#c9fb60]">{row.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p>
  </div>
  return <section className="relative isolate overflow-hidden rounded-[30px] border border-red-500/40 bg-[radial-gradient(ellipse_at_50%_100%,rgba(153,27,27,.32),transparent_70%),linear-gradient(145deg,#200e15,#101418_75%)] p-5 shadow-[0_20px_60px_rgba(185,28,28,.18)] sm:p-7">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(185,16,32,.52),transparent_70%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 440" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="prRedFireOuter" x1="0" y1="440" x2="0" y2="35" gradientUnits="userSpaceOnUse"><stop stopColor="#9f0716"/><stop offset=".3" stopColor="#e11d2e" stopOpacity=".94"/><stop offset=".67" stopColor="#ef4444" stopOpacity=".56"/><stop offset="1" stopColor="#fb7185" stopOpacity="0"/></linearGradient>
          <linearGradient id="prRedFireInner" x1="0" y1="440" x2="0" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#ff6b35"/><stop offset=".32" stopColor="#fb233f"/><stop offset=".8" stopColor="#ef4444" stopOpacity=".3"/><stop offset="1" stopColor="#ef4444" stopOpacity="0"/></linearGradient>
          <filter id="prRedFireMotion" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".012 .026" numOctaves="3" seed="8" result="noise"><animate attributeName="baseFrequency" values=".012 .026;.018 .038;.012 .026" dur="5s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="27" xChannelSelector="R" yChannelSelector="G"/></filter>
          <filter id="prRedFireGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
        </defs>
        <g opacity=".65" filter="url(#prRedFireGlow)" fill="#e11d48"><ellipse cx="120" cy="405" rx="180" ry="135"/><ellipse cx="770" cy="405" rx="195" ry="145"/><ellipse cx="460" cy="450" rx="255" ry="90"/></g>
        <g filter="url(#prRedFireMotion)">
          <path d="M-40 460L-40 310C35 346 50 232 76 178C83 262 135 284 140 225C171 136 160 101 188 64C193 156 275 205 245 295C302 259 312 190 328 167C340 272 395 322 420 460Z" fill="url(#prRedFireOuter)" opacity=".92"/>
          <path d="M940 460L940 300C870 346 864 228 833 151C816 244 771 271 761 214C742 144 739 107 716 56C713 166 626 208 657 302C601 261 586 186 575 163C562 282 510 330 489 460Z" fill="url(#prRedFireOuter)" opacity=".95"/>
          <path d="M-20 460C46 372 65 359 88 257C116 349 148 357 161 309C189 258 198 210 202 168C226 302 305 352 349 460Z" fill="url(#prRedFireInner)" opacity=".8"/>
          <path d="M920 460C849 374 835 361 816 253C783 346 758 365 742 312C711 253 704 208 696 159C674 303 598 357 558 460Z" fill="url(#prRedFireInner)" opacity=".85"/>
          <path d="M200 460C285 401 296 336 315 274C339 365 368 387 397 331C420 291 425 249 439 209C458 333 526 389 591 460Z" fill="url(#prRedFireOuter)" opacity=".45"/>
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#b91c1c]/35 to-transparent" />
      <div className="absolute left-[8%] top-[24%] h-1 w-1 rounded-full bg-rose-300 shadow-[0_0_14px_5px_rgba(244,63,94,.45)] motion-safe:animate-ping [animation-duration:3.5s]" />
      <div className="absolute right-[12%] top-[31%] h-1 w-1 rounded-full bg-red-300 shadow-[0_0_12px_4px_rgba(248,113,113,.5)] motion-safe:animate-ping [animation-duration:4.2s]" />
    </div>
    <div className="relative">
      <p className="text-center text-[10px] font-black uppercase tracking-[.22em] text-rose-300">✦ BATALLA POR EL PODIO ✦</p>
      <h2 className="mt-2 text-center text-[clamp(20px,5vw,31px)] font-black uppercase italic leading-tight text-[#f3f1e9]">El próximo puesto <span className="text-red-500">está en juego</span></h2>
      <div className="mt-8 flex items-center gap-2 sm:gap-5">
        {player(defender,3)}
        <div className="relative z-10 shrink-0 text-center">
          <div aria-hidden="true" className="absolute inset-0 scale-150 rounded-full bg-amber-400/20 blur-2xl motion-safe:animate-pulse" />
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/35 motion-safe:animate-[spin_7s_linear_infinite]" />
          <div className="relative mx-auto grid h-20 w-20 place-items-center sm:h-24 sm:w-24" aria-label="Choque de energía">
            <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden="true"><defs><filter id="duelBoltGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="50" cy="50" r="32" stroke="#fbbf24" strokeOpacity=".3" strokeWidth="1" fill="none" className="origin-center motion-safe:animate-[spin_5s_linear_infinite]" strokeDasharray="8 9"/><path d="M57 5L31 47H48L37 94L74 41H53Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" filter="url(#duelBoltGlow)" className="origin-center motion-safe:animate-[pulse_.85s_ease-in-out_infinite]"/><path d="M17 23L30 43L14 57M83 23L70 43L87 60M18 75L35 64M83 77L67 65" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" filter="url(#duelBoltGlow)" className="motion-safe:animate-[pulse_1.2s_ease-in-out_infinite]"/></svg>
          </div>
          <p className="relative mt-2 text-3xl font-black italic text-[#c9fb60] [text-shadow:0_0_18px_rgba(201,251,96,.45)]">VS</p>
        </div>
        {player(challenger,4)}
      </div>
      <p className="mt-7 text-center text-xs text-white/70">A solo <b className="text-[#c9fb60]">{gap.toLocaleString('es-UY',{maximumFractionDigits:1})} km</b> de cambiar el podio.</p>
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
  const [octoberResult, setOctoberResult] = useState(null)
  const [octoberSnapshot, setOctoberSnapshot] = useState(null)
  const [unlockResult, setUnlockResult] = useState(null)
  const [designDemo, setDesignDemo] = useState(false)
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
        const [profilesResponse, weekResponse, monthResponse, previousMonthResponse, statusesResponse, unlockResponse, octoberResultResponse, octoberCampaignResponse, octoberRankingResponse] = await Promise.all([
          supabase.from('profiles_public').select('*').limit(500),
          supabase.rpc('pr_get_inline_ranking', { p_start_date: ranges.week.start, p_end_date: ranges.week.end }),
          supabase.rpc('pr_get_inline_ranking', { p_start_date: ranges.month.start, p_end_date: ranges.month.end }),
          supabase.rpc('pr_get_inline_ranking', { p_start_date: ranges.previousMonth.start, p_end_date: ranges.previousMonth.end }),
          supabase.from('pr_ranking_statuses').select('alumno_id,status_text,updated_at'),
          supabase.from('pr_unlock_campaigns').select('*').eq('slug', 'pr-unlock-noviembre-2026').maybeSingle(),
          supabase.from('pr_unlock_results').select('*').eq('campaign_id','cae7fa65-2dfc-4e02-ac23-dd50f78d0ac9').maybeSingle(),
          supabase.from('pr_unlock_campaigns').select('*').eq('slug','pr-unlock-2026-09-25').maybeSingle(),
          supabase.rpc('pr_get_inline_ranking', { p_start_date:'2026-09-25', p_end_date:'2026-10-31' }),
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
        setOctoberResult(octoberResultResponse.data || null)
        if (!octoberRankingResponse.error && octoberCampaignResponse.data) {
          const rows = hydrateRanking(octoberRankingResponse.data)
          const total = rows.reduce((sum,row)=>sum+row.km,0)
          const campaign = octoberCampaignResponse.data
          const level = [1,2,3].reduce((acc,n)=>total>=Number(campaign[`prize_${n}_target_km`]||Infinity)?n:acc,0)
          setOctoberSnapshot({total,participants:rows.length,level,prize:level?campaign[`prize_${level}_title`]:null,leader:rows[0]||null})
        }
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
      <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 text-[#f3f1e9]">
        <section className="relative isolate overflow-hidden rounded-[30px] border border-[#c9fb60]/20 bg-[#111419] px-5 pb-6 pt-7 shadow-[0_25px_80px_rgba(0,0,0,.38)] sm:px-8 sm:py-9">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#c9fb60]/[.12] blur-[85px] motion-safe:animate-pulse" />
            <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#c9fb60]/[.10] blur-[90px] motion-safe:animate-pulse [animation-delay:1.2s]" />
            <div className="absolute left-1/2 top-[42%] h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9fb60]/[.12] motion-safe:animate-[spin_32s_linear_infinite] sm:h-[440px] sm:w-[440px]"><span className="absolute left-1/2 top-0 h-2 w-2 rounded-full bg-[#c9fb60] shadow-[0_0_22px_#c9fb60]" /></div>
            <div className="absolute left-1/2 top-[42%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[.11] motion-safe:animate-[spin_45s_linear_infinite_reverse] sm:h-[340px] sm:w-[340px]" />
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(201,251,96,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(201,251,96,.07)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
            <span className="absolute left-[11%] top-[32%] text-xl text-[#c9fb60]/60 motion-safe:animate-pulse">✦</span><span className="absolute right-[12%] top-[58%] text-2xl text-[#c9fb60]/50 motion-safe:animate-pulse [animation-delay:1s]">✳</span>
          </div>
          <div className="relative">
            <div className="flex flex-wrap items-center justify-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#c9fb60] sm:text-[10px]"><span className="h-2 w-2 rounded-full bg-[#c9fb60] shadow-[0_0_15px_#c9fb60] motion-safe:animate-pulse" /> PUNTA ROLLERS / PERFORMANCE</span>
              <span className="rounded-full border border-[#c9fb60]/25 bg-[#c9fb60]/[.08] px-3 py-1.5 text-[9px] font-black tracking-[.14em] text-[#c9fb60]">● EN VIVO</span>
            </div>
            <div className="relative mt-10 text-center sm:mt-12">
              <p className="text-[10px] font-bold uppercase tracking-[.34em] text-white/55 sm:text-xs">Cada kilómetro cuenta.</p>
              <h1 className="relative mt-4 flex items-baseline justify-center whitespace-nowrap text-[clamp(53px,13vw,118px)] font-black uppercase italic leading-[.9] tracking-[-.095em] drop-shadow-[0_12px_35px_rgba(0,0,0,.4)]" aria-label="RUN KING, ranking de Punta Rollers"><span className="text-[#f3f1e9]">RUN</span><span className="text-[#c9fb60] [text-shadow:0_0_45px_rgba(201,251,96,.25)]">KING.</span></h1>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[.26em] text-[#c9fb60]/70">RUN THE DISTANCE · OWN THE CROWN</p>
            </div>
            <p className="mx-auto mt-7 max-w-lg text-center text-[13px] leading-6 text-white/65">No se trata solo de llegar primero. Se trata de sumar kilómetros, superar tus marcas y avanzar con la comunidad.</p>
            <div className="mt-7 grid grid-cols-2 gap-2 rounded-[18px] border border-white/10 bg-black/30 p-1.5" role="group" aria-label="Período del ranking">
              <button type="button" onClick={() => changePeriod('week')} aria-pressed={period === 'week'} className={`min-h-12 rounded-[13px] px-3 text-xs font-black uppercase tracking-[.08em] transition ${period === 'week' ? 'bg-[#c9fb60] text-[#111419] shadow-[0_5px_24px_rgba(201,251,96,.18)]' : 'text-white/55 hover:bg-white/5'}`}>Esta semana</button>
              <button type="button" onClick={() => changePeriod('month')} aria-pressed={period === 'month'} className={`min-h-12 rounded-[13px] px-3 text-xs font-black uppercase tracking-[.08em] transition ${period === 'month' ? 'bg-[#c9fb60] text-[#111419] shadow-[0_5px_24px_rgba(201,251,96,.18)]' : 'text-white/55 hover:bg-white/5'}`}>Este mes</button>
            </div>
          </div>
        </section>

        {!loading && !message && octoberSnapshot && montevideoToday().date <= '2026-11-07' && <section className="relative mt-5 overflow-hidden rounded-[32px] border border-[#c9fb60]/35 bg-[radial-gradient(circle_at_80%_0%,rgba(201,251,96,.19),transparent_45%),linear-gradient(145deg,#252c28,#111719_70%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-7" aria-label="Celebración PR Unlock octubre">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true"><span className="absolute left-[8%] top-[10%] text-2xl opacity-65 motion-safe:animate-bounce">✦</span><span className="absolute right-[12%] top-[15%] text-xl text-[#c9fb60] opacity-70 motion-safe:animate-pulse">✳</span><span className="absolute left-[65%] top-[45%] text-3xl opacity-45 motion-safe:animate-pulse">✦</span><span className="absolute bottom-7 left-[16%] text-lg opacity-50">✳</span><span className="absolute bottom-5 right-[7%] text-2xl opacity-60">✦</span></div>
          <div className="relative"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#c9fb60]">🎉 PR UNLOCK / OCTUBRE 2026</p><span className="rounded-full border border-[#c9fb60]/25 bg-[#c9fb60]/10 px-3 py-1 text-[9px] font-black uppercase text-[#c9fb60]">{octoberResult?.finalized_at && montevideoToday().date > '2026-10-31' ? '🏆 RESULTADO OFICIAL' : montevideoToday().date <= '2026-10-31' ? 'EN CURSO · CIERRA 31/10' : 'CIERRE EN VERIFICACIÓN'}</span></div>
            <h2 className="mt-5 max-w-[540px] text-[clamp(29px,7vw,54px)] font-black uppercase italic leading-[.97] tracking-tight text-[#f3f1e9]">{montevideoToday().date <= '2026-10-31' ? '¡ESTAMOS HACIENDO HISTORIA!' : '¡ESTO LO LOGRAMOS JUNTOS!'} <span className="text-[#c9fb60]">✦</span></h2>
            <p className="mt-3 max-w-lg text-xs leading-5 text-white/60">Cada vuelta, cada entrenamiento y cada kilómetro cuentan. Mirá lo que construimos entre todos en esta misión.</p>
            <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-[20px] border border-white/10 bg-black/30 p-4"><p className="text-[9px] font-black uppercase tracking-[.13em] text-white/45">KILÓMETROS DE LA COMUNIDAD</p><p className="mt-2 text-[clamp(27px,6vw,42px)] font-black leading-none text-[#c9fb60]">{(octoberResult?.finalized_at ? Number(octoberResult.group_km ?? octoberSnapshot.total) : octoberSnapshot.total).toLocaleString('es-UY',{maximumFractionDigits:1})}<span className="ml-1 text-base text-white/60">km</span></p><p className="mt-2 text-[10px] text-white/40">{octoberSnapshot.participants} rollers participaron</p></div><div className="rounded-[20px] border border-white/10 bg-black/30 p-4"><p className="text-[9px] font-black uppercase tracking-[.13em] text-white/45">{octoberResult?.finalized_at ? 'PREMIO CONSEGUIDO' : 'PREMIO DESBLOQUEADO HASTA AHORA'}</p><p className="mt-2 text-lg font-black leading-tight text-[#f3f1e9]">{octoberResult?.finalized_at ? (octoberResult.prize_title || 'Sin premio confirmado') : (octoberSnapshot.prize || 'Todavía por desbloquear')}</p><p className="mt-2 text-[10px] text-[#c9fb60]">Nivel {octoberResult?.finalized_at ? octoberResult.unlocked_level : octoberSnapshot.level} de 3</p></div></div>
            <div className="mt-4 flex items-center gap-4 rounded-[22px] border border-[#c9fb60]/20 bg-[#c9fb60]/[.06] p-4">{octoberResult?.finalized_at && octoberResult.winner_profile_id ? <PodiumAvatar row={{name:octoberResult.winner_name,photo:octoberResult.winner_photo}} size="xl"/> : octoberSnapshot.leader ? <PodiumAvatar row={octoberSnapshot.leader} size="xl"/> : <span className="text-4xl">🏆</span>}<div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#c9fb60]">{octoberResult?.finalized_at && octoberResult.winner_profile_id && montevideoToday().date > '2026-10-31' ? '🏆 LA PERSONA GANADORA ES...' : '⚡ QUIEN MÁS KILÓMETROS SUMÓ HASTA AHORA'}</p><h3 className="mt-1 truncate text-xl font-black sm:text-2xl">{octoberResult?.finalized_at && octoberResult.winner_profile_id && montevideoToday().date > '2026-10-31' ? octoberResult.winner_name : octoberSnapshot.leader?.name || 'Por definir'}</h3><p className="mt-1 text-xs text-white/55">{octoberResult?.finalized_at && octoberResult.winner_profile_id && montevideoToday().date > '2026-10-31' ? '¡Felicitaciones! Nos pondremos en contacto con la persona ganadora.' : `${octoberSnapshot.leader?.km.toLocaleString('es-UY',{maximumFractionDigits:1}) || '0'} km · Liderazgo provisional, sujeto a verificación.`}</p></div></div>
            {montevideoToday().date > '2026-10-31' && !octoberResult?.finalized_at && <p className="mt-3 text-[11px] font-medium text-white/50">El resultado oficial se publicará después de verificar las actividades y el premio.</p>}
          </div>
        </section>}

        {loading ? <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[.03] p-6 text-center text-xs text-white/35">Actualizando kilómetros de Strava…</div> : message ? <div className="mt-4 rounded-[28px] border border-red-300/15 bg-red-400/[.06] p-5 text-xs text-red-200">{message}</div> : <div className="mt-5 space-y-5">




          <section className="rounded-[26px] border border-white/10 bg-[#191d21] p-5 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-[9px] font-black uppercase tracking-[.17em] text-white/30">{periodLabel}</p><h2 className="mt-1 text-3xl font-black tracking-tight text-[#c9fb60]">{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})} km en juego</h2></div>
              <div className="text-right"><p className="text-2xl font-black text-[#c9fb60]">{ranking.length}</p><p className="text-[8px] font-black uppercase text-white/25">rollers sumando</p></div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-[#a4e449] via-[#c9fb60] to-[#e7d48c]" style={{width:`${ranking.length ? 100 : 0}%`}} /></div>
            <p className="mt-3 text-[9px] text-white/28">Período: {longDate(currentRange.start)} → {longDate(currentRange.end)}</p>
          </section>

          {ranking.length > 0 && <section className="overflow-hidden rounded-[30px] border border-[#c9fb60]/20 bg-[radial-gradient(circle_at_50%_0%,rgba(201,251,96,.12),transparent_48%),#14181b] p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.24em] text-[#c9fb60]">01 / LOS QUE MARCAN EL RITMO</span><span className="text-xl">🏆</span></div><Podium ranking={ranking} period={period} statuses={statuses} /></section>}

          {unlockCampaign && montevideoToday().date < '2026-11-01' && <div className="rounded-[24px] border border-[#c9fb60]/25 bg-[#c9fb60]/[.065] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#c9fb60]">LABORATORIO DE DISEÑO · NOVIEMBRE</p><h3 className="mt-1 text-lg font-black">Probá las recompensas antes del lanzamiento.</h3><p className="mt-2 text-[11px] leading-5 text-white/50">Activá una simulación de 580 km para ver los niveles desbloqueados y las cajas sorpresa. El desafío real sigue comenzando el 1.º de noviembre con 0 km.</p></div></div><button type="button" onClick={()=>setDesignDemo(v=>!v)} className="mt-4 min-h-11 w-full rounded-xl bg-[#c9fb60] px-4 py-2 text-xs font-black text-[#111419]">{designDemo ? '↩ VOLVER A VISTA REAL' : '👁 VER DEMO CON PREMIOS DESBLOQUEADOS'}</button></div>}
          <PRUnlock campaign={unlockCampaign} ranking={unlockRanking} result={unlockResult} preview={montevideoToday().date < '2026-11-01' && !designDemo} demo={montevideoToday().date < '2026-11-01' && designDemo} />

          {myRow && <section className="overflow-hidden rounded-[30px] border border-[#c9fb60]/25 bg-[radial-gradient(circle_at_100%_0%,rgba(201,251,96,.16),transparent_40%),#171d20] p-5">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#c9fb60]">TU POSICIÓN · {periodLabel}</p>
            <div className="mt-3 flex items-center gap-4">
              <PodiumAvatar row={myRow} />
              <div className="min-w-0 flex-1"><p className="text-3xl font-black">#{myPosition}</p><p className="truncate text-sm font-black">{myRow.name}</p><p className="mt-1 text-xs font-black text-[#c9fb60]">{myRow.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km · {myRow.sessions} entrenos</p></div>
            </div>
          </section>}

          <PodiumDuel challenger={fourth} defender={third} gap={gapToPodium || 0} />

          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#191d21]">
            <div className="flex items-center justify-between border-b border-[#c9fb60]/15 px-5 py-5"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">CLASIFICACIÓN COMPLETA</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#f3f1e9]">{periodLabel}</h2></div><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[9px] font-black text-white/40">{ranking.length}</span></div>
            {ranking.length ? <div className="divide-y divide-white/[.06]">{ranking.map((row,index)=>{
              const rank=index+1, status=statuses[String(row.alumnoId)] || ''
              return <div key={row.alumnoId} className={`flex items-center gap-2.5 px-3 py-2.5 sm:px-5 ${String(row.alumnoId)===myId?'bg-[#c9fb60]/[.07]':''}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-black ${rank===1?'bg-[#c9fb60] text-black':rank===2?'bg-slate-200 text-black':rank===3?'bg-orange-700 text-white':'bg-white/[.06] text-white/45'}`}>{rank}</span><PodiumAvatar row={row} size="sm"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{row.name}</p><p className="truncate text-[9px] text-white/30">{row.sessions} entreno{row.sessions===1?'':'s'}{status?` · “${status}”`:''}</p></div><div className="text-right"><p className={`whitespace-nowrap text-xs font-black sm:text-sm ${rank<=3?'text-[#c9fb60]':'text-white'}`}>{row.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p></div></div>
            })}</div> : <div className="p-8 text-center text-xs text-white/30">Todavía no hay kilómetros para este período.</div>}
          </section>

          {period === 'month' && previousWinner && <section className="rounded-[28px] border border-sky-300/15 bg-sky-400/[.045] p-4"><p className="text-[9px] font-black uppercase tracking-[.17em] text-sky-300">📊 LÍDER DEL RANKING DEL MES ANTERIOR</p><div className="mt-3 flex items-center gap-3"><PodiumAvatar row={previousWinner}/><div><p className="text-sm font-black">{previousWinner.name}</p><p className="mt-1 text-[10px] text-white/40">registró el primer puesto con {previousWinner.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km registrados</p></div></div></section>}

          <section className="rounded-[28px] border border-white/[.07] bg-black/20 p-4 text-[10px] leading-5 text-white/35"><b className="text-white/65">Cómo suma:</b> entran únicamente actividades de patinaje inline registradas en PR. Las actividades rechazadas o eliminadas no cuentan. Los deberes de Shifter que llegan desde Strava también forman parte del mismo kilometraje: no se duplican.</section>
        </div>}

        <Link to={user ? '/app/actividad' : '/'} className="mt-5 flex min-h-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[.04] text-xs font-black text-white/55">{user ? 'VOLVER AL ROLLER FEED' : 'VOLVER A PUNTA ROLLERS'}</Link>
      </div>
    </Shell>
  )
}
