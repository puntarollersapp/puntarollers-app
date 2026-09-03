import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

const PODIUM_SLUG = 'toma-3-2026-09-02'
const REFRESH_MS = 20000

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
    : `${minutes}:${String(rest).padStart(2, '0')}`
}

function initials(name) {
  return String(name || 'PR')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PR'
}

function Place({ item, rank }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
  const winner = rank === 1

  return (
    <div className={`min-w-0 rounded-[22px] border p-3 text-center ${winner ? 'border-amber-300/30 bg-amber-300/[.08]' : 'border-white/[.08] bg-white/[.025]'}`}>
      <div className={`mx-auto grid ${winner ? 'h-16 w-16' : 'h-14 w-14'} place-items-center overflow-hidden rounded-full border-2 border-white/10 bg-white/[.05] text-sm font-black`}>
        {item?.photo ? <img src={item.photo} alt={item.display_name || 'Roller PR'} className="h-full w-full object-cover" /> : initials(item?.display_name)}
      </div>
      <div className="mt-2 text-xl">{medal}</div>
      <p className="mt-1 truncate text-[11px] font-black text-white">{item?.display_name || 'Esperando toma…'}</p>
      {item ? (
        <>
          <p className={`mt-1 text-lg font-black ${winner ? 'text-amber-300' : 'text-orange-300'}`}>{Number(item.speed_kmh || 0).toFixed(1)} km/h</p>
          <p className="mt-1 text-[8px] text-white/30">{Number(item.distance_km || 0).toLocaleString('es-UY', { maximumFractionDigits: 2 })} km · {formatTime(item.time_seconds)}</p>
        </>
      ) : null}
    </div>
  )
}

function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('es-UY')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function findFeedListAndBirthdays() {
  const labels = [...document.querySelectorAll('p')].filter((node) => {
    const text = normalizeText(node.textContent)
    return text.includes('proximo cumpleanos') || text.includes('celebracion pr') || text.includes('cumpleanos de este mes')
  })

  const wrappers = []
  let feedList = null

  labels.forEach((label) => {
    let node = label
    while (node?.parentElement && !node.parentElement.classList.contains('space-y-4')) {
      node = node.parentElement
    }

    if (node?.parentElement?.classList.contains('space-y-4')) {
      feedList = node.parentElement
      if (!wrappers.includes(node)) wrappers.push(node)
    }
  })

  if (!feedList) {
    const candidates = [...document.querySelectorAll('div.space-y-4')]
    feedList = candidates.find((node) => node.querySelector('article, section, [class*="rounded-"]')) || null
  }

  return { feedList, birthdayWrappers: wrappers.slice(0, 3) }
}

export default function RollerFeedPinnedPodium() {
  const [host, setHost] = useState(null)
  const [rows, setRows] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    const node = document.createElement('div')
    node.setAttribute('data-pr-pinned-podium', 'true')
    setHost(node)

    function placeHost() {
      const { feedList, birthdayWrappers } = findFeedListAndBirthdays()
      if (!feedList) return

      const lastBirthday = birthdayWrappers[birthdayWrappers.length - 1]
      if (lastBirthday) {
        if (lastBirthday.nextSibling !== node) {
          feedList.insertBefore(node, lastBirthday.nextSibling)
        }
      } else if (feedList.firstChild !== node) {
        feedList.insertBefore(node, feedList.firstChild)
      }
    }

    placeHost()
    const observer = new MutationObserver(placeHost)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(placeHost, 1000)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      node.remove()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error } = await supabase.rpc('get_rollerfeed_live_podium', { p_slug: PODIUM_SLUG })
      if (!active) return
      if (!error) {
        setRows(Array.isArray(data) ? data : [])
        setLastUpdated(new Date())
      }
    }

    load()
    const timer = window.setInterval(load, REFRESH_MS)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const podium = useMemo(() => {
    const ranked = rows.filter((row) => Number(row.rank) >= 1 && Number(row.rank) <= 3)
    return {
      first: ranked.find((row) => Number(row.rank) === 1) || null,
      second: ranked.find((row) => Number(row.rank) === 2) || null,
      third: ranked.find((row) => Number(row.rank) === 3) || null,
    }
  }, [rows])

  const post = rows[0] || null
  if (!host || !post) return null

  return createPortal(
    <div className="pt-1 pb-1">
      <article className="relative overflow-hidden rounded-[30px] border border-amber-300/30 bg-gradient-to-br from-[#351704] via-[#16100d] to-[#08080b] p-5 shadow-[0_24px_80px_rgba(249,115,22,.18)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-violet-500/[.08] blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-300/25 bg-orange-400/[.12] px-3 py-1 text-[8px] font-black uppercase tracking-[.16em] text-orange-100">📌 FIJO · 72 HORAS</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/20 bg-red-400/[.09] px-3 py-1 text-[8px] font-black uppercase tracking-[.16em] text-red-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" /> EN VIVO</span>
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[.20em] text-orange-300">⚡ RANKING ESPECIAL · STRAVA</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[32px] leading-none text-white">PODIO · TOMA 3</h2>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[.08em] text-amber-200/65">MIÉRCOLES 2 DE SEPTIEMBRE · 2026</p>
            </div>
            <span className="text-3xl">🏆</span>
          </div>

          <p className="mt-3 text-[10px] leading-4 text-white/38">Este post se mantiene fijo después de los cumpleaños y se actualiza con cada nueva marca válida de la Toma 3 que entra al sistema.</p>

          <div className="mt-5 grid grid-cols-3 items-end gap-2">
            <Place item={podium.second} rank={2} />
            <div className="-translate-y-2"><Place item={podium.first} rank={1} /></div>
            <Place item={podium.third} rank={3} />
          </div>

          <div className="mt-3 rounded-[18px] border border-white/[.07] bg-black/20 px-4 py-3">
            <p className="text-[9px] font-black text-white/60">Podio provisional · se recalcula automáticamente según las tomas registradas.</p>
            <p className="mt-1 text-[8px] text-white/25">{lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}` : 'Actualizando…'} · Strava + PR Performance</p>
          </div>

          <p className="mt-3 text-center text-[8px] font-semibold tracking-[.04em] text-white/20">No es solo patinar. Es pertenecer.</p>
        </div>
      </article>
    </div>,
    host
  )
}
