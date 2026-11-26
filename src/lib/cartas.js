import { useEffect, useState } from 'react'
import { getBadgeImage, normalizeBadgeTitle } from './badges'
import { DECEMBER_NAV_START } from './prDecemberNavigation'

// Permanent collection, available from Dec 1 Uruguay time. Only Claudio can preview.
export function canSeeCards(user, now = Date.now()) {
  return Boolean(user?.id && user.role !== 'familiar' && (now >= DECEMBER_NAV_START || (user.id === 'admin-claudio' && user.role === 'admin')))
}
export function useCardsAccess(user) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const timer = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return canSeeCards(user, now)
}
const RARITY_RULES = [
  ['navidad', ['navidad', 'christmas', 'navideno', 'navidena']],
  ['prisma', ['travesia', '19k', 'shifter', 'campeon', 'awards', 'ganador']],
  ['oro', ['clinica', 'solidarios', '10k', 'primeros 10k', 'constancia', 'distancia', 'evento']],
  ['holo', ['frena', 'primeros 6k', 'tecnica', 'actitud', 'companero', 'espiritu', 'rodador']],
]
export function rarityFor(text, fallback = 'plata') {
  const t = normalizeBadgeTitle(text)
  for (const [rarity, words] of RARITY_RULES) if (words.some(w => t.includes(w))) return rarity
  return fallback
}
export function dateLabel(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-UY', { timeZone: 'America/Montevideo', day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}
export function badgeCards(rows = []) {
  const seen = new Set()
  const out = []
  for (const b of rows) {
    const key = normalizeBadgeTitle(b.titulo)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({
      id: 'badge-' + b.id, source: 'badge', title: b.titulo, subtitle: 'Insignia PR',
      art: getBadgeImage(b.titulo) || null, emoji: '🏅', rarity: rarityFor(b.titulo, 'holo'),
      locked: false, date: b.fecha, description: b.descripcion || '', by: b.creado_por_nombre || '',
    })
  }
  return out
}
export function frameCards(catalog = [], grants = []) {
  const granted = new Map(grants.filter(g => !g.revoked_at).map(g => [g.frame_code, g]))
  return catalog.filter(c => c.enabled !== false && (granted.has(c.code) || c.visible_locked))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(c => {
      const g = granted.get(c.code)
      return {
        id: 'frame-' + c.code, source: 'frame', title: c.title || c.code, subtitle: 'Marco coleccionable',
        art: null, emoji: '🖼️', rarity: rarityFor(c.code + ' ' + c.title, 'oro'),
        locked: !g, date: g?.granted_at || null, description: c.description || '', by: '',
      }
    })
}

const ACCENT = { plata: '#cfd3dc', holo: '#ff0055', oro: '#f5c451', prisma: '#9b7bff', navidad: '#ff3d6e' }
const RARITY_LABEL = { plata: 'COMÚN', holo: 'HOLO', oro: 'ÉPICA', prisma: 'LEGENDARIA', navidad: 'NAVIDAD' }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}
function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let cur = ''
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w } else cur = t }
  if (cur) lines.push(cur)
  return lines
}
function loadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null)
    const img = new Image(); img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), 8000)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    img.src = src
  })
}
export async function cardToBlob(card) {
  if (!card || card.locked) return null
  if (card.frontArt) {
    const response = await fetch(card.frontArt, {cache:'force-cache'})
    if (!response.ok) throw new Error('No se encontró el arte oficial')
    const blob = await response.blob()
    if (blob.type !== 'image/png') throw new Error('Formato de carta inválido')
    return blob
  }
  const W = 1000, H = 1400, accent = ACCENT[card.rarity] || ACCENT.holo
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#0b0b0f'; ctx.fillRect(0, 0, W, H)
  rr(ctx, 30, 30, W - 60, H - 60, 56); ctx.save(); ctx.clip()
  const bg = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 200, 1100)
  bg.addColorStop(0, accent + '66'); bg.addColorStop(0.6, '#191A20'); bg.addColorStop(1, '#13141a')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  const g = ctx.createLinearGradient(0, 0, W, H)
  ;['#ff0055aa', '#ffc43caa', '#3cffb8aa', '#3c8cffaa', '#be50ffaa', '#ff0055aa'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col))
  ctx.globalAlpha = 0.16; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1
  ctx.restore()
  rr(ctx, 30, 30, W - 60, H - 60, 56); ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.stroke()
  ctx.fillStyle = accent; ctx.font = '800 30px ui-monospace, monospace'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(RARITY_LABEL[card.rarity] || 'HOLO', 90, 110)
  if (card.number != null) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'right'; ctx.fillText(String(card.number).padStart(2, '0') + (card.total ? '/' + String(card.total).padStart(2, '0') : ''), W - 90, 110); ctx.textAlign = 'left' }
  rr(ctx, 90, 150, W - 180, 720, 36); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill()
  const img = await loadImage(card.art)
  if (img) {
    const s = Math.min((W - 220) / img.width, 660 / img.height)
    ctx.drawImage(img, W / 2 - (img.width * s) / 2, 510 - (img.height * s) / 2, img.width * s, img.height * s)
  } else { ctx.font = '300px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(card.emoji || '⚡', W / 2, 640); ctx.textAlign = 'left' }
  ctx.fillStyle = '#F3F1EC'
  let fontSize = 70, lines = []
  do { ctx.font = '900 ' + fontSize + 'px system-ui, sans-serif'; lines = wrap(ctx, String(card.title).toUpperCase(), W - 180); if (lines.length <= 2 && lines.every(l => ctx.measureText(l).width <= W - 180)) break; fontSize -= 4 } while (fontSize >= 30)
  lines = lines.slice(0, 3)
  const step = Math.max(fontSize + 6, 40)
  lines.forEach((l, i) => ctx.fillText(l, 90, 960 + i * step, W - 180))
  let y = 960 + (lines.length - 1) * step + 60
  ctx.fillStyle = 'rgba(243,241,236,.7)'; ctx.font = '600 38px system-ui, sans-serif'
  ctx.fillText(card.subtitle || '', 90, y, W - 180)
  if (card.date) { y += 60; ctx.fillStyle = 'rgba(243,241,236,.55)'; ctx.font = '700 32px ui-monospace, monospace'; ctx.fillText(dateLabel(card.date).toUpperCase(), 90, y) }
  ctx.fillStyle = 'rgba(243,241,236,.4)'; ctx.font = '800 26px ui-monospace, monospace'; ctx.fillText('PUNTA ROLLERS', 90, H - 80)
  return new Promise(resolve => c.toBlob(resolve, 'image/png'))
}
export async function shareOrDownloadCard(card) {
  const blob = await cardToBlob(card)
  if (!blob) return 'error'
  const name = card.frontArt && card.code ? card.code + '.png' : 'carta-' + normalizeBadgeTitle(card.title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png'
  const file = new File([blob], name, { type: 'image/png' })
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: card.title }); return 'shared' }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled' }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return 'downloaded'
}
