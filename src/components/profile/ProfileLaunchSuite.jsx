import { useEffect, useMemo, useState } from 'react'
import ChibiAvatarStage from '../../features/avatar/components/ChibiAvatarStage'
import {
  CHIBI_EARRINGS,
  CHIBI_EYEWEAR,
  CHIBI_HEADS,
  CHIBI_HEADWEAR,
  CHIBI_HELMETS,
  CHIBI_JERSEYS,
  CHIBI_PIERCINGS,
  CHIBI_PROTECTIONS,
  CHIBI_SHORTS,
  CHIBI_SKATES,
  CHIBI_STICKERS,
} from '../../features/avatar/chibiCatalog'

const PR_WHATSAPP = '59899220929'

function isInstalled() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function InstallAppCard({ compact = false }) {
  const [installed, setInstalled] = useState(() => isInstalled())

  useEffect(() => {
    function refresh() {
      setInstalled(isInstalled())
    }
    window.addEventListener('appinstalled', refresh)
    return () => window.removeEventListener('appinstalled', refresh)
  }, [])

  return (
    <section className={`relative overflow-hidden rounded-[26px] border border-sky-300/15 bg-gradient-to-br from-sky-400/[.09] via-white/[.025] to-violet-400/[.06] ${compact ? 'p-4' : 'p-5'}`}>
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <img src="/pwa-192x192.png" alt="Punta Rollers App" className="h-14 w-14 shrink-0 rounded-[18px] border border-white/10 object-cover shadow-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-black uppercase tracking-[.17em] text-sky-200/70">📲 LLEVÁ PUNTA ROLLERS CON VOS</p>
          <h2 className="mt-1 font-display text-xl leading-none text-white">{installed ? 'Ya tenés la app PR' : 'Instalala en tu celular'}</h2>
          <p className="mt-1.5 text-[10px] leading-4 text-white/35">Entrá como a cualquier otra app, sin buscar el link cada vez.</p>
        </div>
      </div>
      {!installed && (
        <button type="button" onClick={() => window.dispatchEvent(new Event('pr:open-install'))} className="relative mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl border border-sky-200/15 bg-sky-300 px-4 text-xs font-black text-[#071018] active:scale-[.99]">
          <span>Ver instalación</span><span>→</span>
        </button>
      )}
    </section>
  )
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Imagen no disponible'))
      return
    }
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    image.src = src
  })
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (image.width - sw) / 2
  const sy = (image.height - sh) / 2
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height)
}

function drawContain(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height)
  const dw = image.width * scale
  const dh = image.height * scale
  ctx.drawImage(image, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh)
}

function motivation(stats, badgeCount) {
  const kilometers = Number(stats?.kilometers) || 0
  const sessions = Number(stats?.sessions) || 0

  if (kilometers >= 500) return 'Tu recorrido ya es parte de la historia PR.'
  if (kilometers >= 250) return 'Tu recorrido inspira nuevas vueltas.'
  if (sessions >= 50) return 'Tu constancia ya dejó una huella PR.'
  if (badgeCount >= 5) return 'Cada logro cuenta una parte de tu historia.'
  if (sessions > 0) return 'La próxima meta está un poco más cerca.'
  return 'Toda historia sobre ruedas empieza con una vuelta.'
}

function storyEnergy(stats) {
  const kilometers = Math.max(0, Number(stats?.kilometers) || 0)
  const sessions = Math.max(0, Number(stats?.sessions) || 0)
  return Math.min(100, Math.min(82, kilometers / 3) + Math.min(18, sessions * .8))
}

function percent(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace('%', ''))
  return Number.isFinite(parsed) ? parsed / 100 : fallback
}

function stageGeometry(option, headId) {
  const override = option?.stageByHead?.[headId]
  return {
    top: override?.top || option?.stageTop,
    width: override?.width || option?.stageWidth,
  }
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  })
  if (line) lines.push(line)

  lines.slice(0, maxLines).forEach((value, index) => {
    const isTrimmed = index === maxLines - 1 && lines.length > maxLines
    ctx.fillText(isTrimmed ? `${value.replace(/[.,;:]?$/, '')}…` : value, x, y + index * lineHeight)
  })
}

function drawPanel(ctx, x, y, width, height, radius = 42, fill = 'rgba(255,255,255,.045)', stroke = 'rgba(255,255,255,.1)') {
  roundedRect(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawStoryMetric(ctx, metric, x, y, width, highlight = false) {
  drawPanel(
    ctx,
    x,
    y,
    width,
    176,
    34,
    highlight ? 'rgba(255,119,23,.16)' : 'rgba(255,255,255,.045)',
    highlight ? 'rgba(255,174,91,.34)' : 'rgba(255,255,255,.09)'
  )
  ctx.textAlign = 'center'
  ctx.fillStyle = highlight ? '#ffb36e' : '#ffffff'
  ctx.font = '900 54px Arial, sans-serif'
  ctx.fillText(metric.value, x + width / 2, y + 78)
  ctx.fillStyle = 'rgba(255,255,255,.42)'
  ctx.font = '800 16px Arial, sans-serif'
  ctx.fillText(metric.label, x + width / 2, y + 126)
  ctx.fillStyle = 'rgba(255,255,255,.23)'
  ctx.font = '700 14px Arial, sans-serif'
  ctx.fillText(metric.detail, x + width / 2, y + 151)
  ctx.textAlign = 'left'
}

function drawRadar(ctx, axes, x, y, radius) {
  const entries = [
    ['VELOCIDAD', Number(axes?.velocidad) || 0],
    ['EVOLUCIÓN', Number(axes?.evolucion) || 0],
    ['CONSTANCIA', Number(axes?.constancia) || 0],
    ['TÉCNICA', Number(axes?.tecnica) || 0],
    ['RESISTENCIA', Number(axes?.resistencia) || 0],
  ]
  const point = (index, scale = 1) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / entries.length
    return [x + Math.cos(angle) * radius * scale, y + Math.sin(angle) * radius * scale]
  }

  ctx.lineWidth = 2
  ;[.33, .66, 1].forEach((scale) => {
    ctx.beginPath()
    entries.forEach((_, index) => {
      const [px, py] = point(index, scale)
      if (index === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.closePath()
    ctx.strokeStyle = 'rgba(255,255,255,.11)'
    ctx.stroke()
  })

  entries.forEach((_, index) => {
    const [px, py] = point(index)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(px, py)
    ctx.strokeStyle = 'rgba(255,255,255,.07)'
    ctx.stroke()
  })

  ctx.beginPath()
  entries.forEach(([, value], index) => {
    const [px, py] = point(index, Math.max(.05, Math.min(1, value / 100)))
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,119,23,.28)'
  ctx.fill()
  ctx.strokeStyle = '#ff9a4a'
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.font = '800 12px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,.48)'
  entries.forEach(([label], index) => {
    const [px, py] = point(index, 1.27)
    ctx.fillText(label, px, py + 5)
  })
  ctx.textAlign = 'left'
}

function drawActivityBars(ctx, trend, x, y, width, height) {
  const values = (trend || []).map((item) => Math.max(0, Number(item?.value) || 0))
  const maximum = Math.max(1, ...values)
  const gap = 18
  const barWidth = (width - gap * Math.max(0, values.length - 1)) / Math.max(1, values.length)

  ctx.strokeStyle = 'rgba(255,255,255,.08)'
  ctx.lineWidth = 2
  ;[0, .5, 1].forEach((level) => {
    ctx.beginPath()
    ctx.moveTo(x, y + height * level)
    ctx.lineTo(x + width, y + height * level)
    ctx.stroke()
  })

  values.forEach((value, index) => {
    const barHeight = Math.max(8, (value / maximum) * height)
    const bx = x + index * (barWidth + gap)
    const gradient = ctx.createLinearGradient(0, y + height - barHeight, 0, y + height)
    gradient.addColorStop(0, '#ffb36e')
    gradient.addColorStop(1, '#f35b10')
    roundedRect(ctx, bx, y + height - barHeight, barWidth, barHeight, Math.min(16, barWidth / 2))
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,.4)'
    ctx.font = '800 13px Arial, sans-serif'
    ctx.fillText(trend[index]?.label || `${index + 1}`, bx + barWidth / 2, y + height + 26)
  })
  ctx.textAlign = 'left'
}

async function drawAvatarAsset(ctx, option, stage, geometry) {
  if (!option?.src) return
  const image = await loadImage(option.src).catch(() => null)
  if (!image) return
  const width = stage.width * percent(geometry?.width, .5)
  const height = (image.height / image.width) * width
  const x = stage.x + (stage.width - width) / 2
  const y = stage.y + stage.height * percent(geometry?.top, 0)
  ctx.save()
  ctx.filter = option.filter || 'none'
  ctx.drawImage(image, x, y, width, height)
  ctx.restore()
}

async function drawPrRoller(ctx, selection, x, y, width, height, energy) {
  const stage = { x, y, width, height }
  const head = CHIBI_HEADS[selection?.head] || CHIBI_HEADS.masculine
  const jersey = CHIBI_JERSEYS[selection?.jersey] || CHIBI_JERSEYS.orange
  const shorts = CHIBI_SHORTS[selection?.shorts] || CHIBI_SHORTS.orange
  const skates = CHIBI_SKATES[selection?.skates] || CHIBI_SKATES.orange
  const protection = CHIBI_PROTECTIONS[selection?.protection] || CHIBI_PROTECTIONS.flex
  const earrings = CHIBI_EARRINGS[selection?.earrings] || CHIBI_EARRINGS.none
  const eyewear = CHIBI_EYEWEAR[selection?.eyewear] || CHIBI_EYEWEAR.none
  const headwear = CHIBI_HEADWEAR[selection?.headwear] || CHIBI_HEADWEAR.none
  const helmet = CHIBI_HELMETS[selection?.helmet] || CHIBI_HELMETS.none
  const piercing = CHIBI_PIERCINGS[selection?.piercing] || CHIBI_PIERCINGS.none
  const sticker = CHIBI_STICKERS[selection?.sticker] || CHIBI_STICKERS.none
  const scene = await loadImage('/avatar/v3/scenes/pr-locker-chibi-v1.jpg').catch(() => null)
  const logo = await loadImage('/avatar/v3/brand/pr-logo-official-v1.png').catch(() => null)

  ctx.save()
  roundedRect(ctx, x, y, width, height, 44)
  ctx.clip()
  ctx.fillStyle = '#09090d'
  ctx.fillRect(x, y, width, height)
  if (scene) drawCover(ctx, scene, x, y, width, height)
  if (logo) {
    ctx.globalAlpha = .07
    drawContain(ctx, logo, x + width * .24, y + height * .24, width * .52, width * .52)
    ctx.globalAlpha = 1
  }

  await drawAvatarAsset(ctx, jersey, stage, { top: '21%', width: '53%' })
  await drawAvatarAsset(ctx, shorts, stage, { top: '43%', width: '44%' })
  await drawAvatarAsset(ctx, head, stage, { top: head.stageTop || '2%', width: head.stageWidth || '50%' })
  await drawAvatarAsset(ctx, skates, stage, { top: skates.stageTop || '58%', width: skates.stageWidth || '52%' })
  await drawAvatarAsset(ctx, protection, stage, { top: protection.stageTop, width: protection.stageWidth })
  await drawAvatarAsset(ctx, earrings, stage, stageGeometry(earrings, head.id))
  await drawAvatarAsset(ctx, eyewear, stage, stageGeometry(eyewear, head.id))
  await drawAvatarAsset(ctx, headwear, stage, stageGeometry(headwear, head.id))
  await drawAvatarAsset(ctx, helmet, stage, { top: helmet.stageTop, width: helmet.stageWidth })

  if (sticker.kind === 'logo' && logo) {
    drawContain(ctx, logo, x + width * .47, y + height * .365, width * .06, width * .06)
  } else if (sticker.kind === 'bolt') {
    ctx.fillStyle = '#ffb36e'
    ctx.font = '900 18px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ϟϟ', x + width / 2, y + height * .402)
    ctx.textAlign = 'left'
  }

  if (piercing.kind === 'nose-stud') {
    ctx.beginPath()
    ctx.arc(x + width * .522, y + height * .238, width * .008, 0, Math.PI * 2)
    ctx.fillStyle = '#e8eef5'
    ctx.fill()
  } else if (piercing.kind === 'brow-stud') {
    ctx.save()
    ctx.translate(x + width * .434, y + height * .186)
    ctx.rotate(-.24)
    ctx.beginPath()
    ctx.arc(0, 0, width * .014, -.55, Math.PI + .55)
    ctx.strokeStyle = '#dce4ed'
    ctx.lineWidth = Math.max(2, width * .006)
    ctx.stroke()
    ctx.restore()
  }

  const shade = ctx.createLinearGradient(0, y, 0, y + height)
  shade.addColorStop(0, 'rgba(0,0,0,.15)')
  shade.addColorStop(.6, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,.32)')
  ctx.fillStyle = shade
  ctx.fillRect(x, y, width, height)

  ctx.fillStyle = 'rgba(0,0,0,.68)'
  roundedRect(ctx, x + 18, y + 18, width - 36, 54, 24)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,.62)'
  ctx.font = '900 13px Arial, sans-serif'
  ctx.fillText('MI PR ROLLER', x + 38, y + 51)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffb36e'
  ctx.fillText(`${Math.round(energy)}% ENERGÍA`, x + width - 38, y + 51)
  ctx.textAlign = 'left'
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,174,91,.38)'
  ctx.lineWidth = 3
  roundedRect(ctx, x, y, width, height, 44)
  ctx.stroke()
}

async function buildShareCard({
  profile,
  stats,
  badgeCount,
  recentBadges,
  chibiSelection,
  hasChibiAvatar,
  performance,
  activityTrend,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  const energy = storyEnergy(stats)
  const hasPerformance =
    Number(performance?.index) > 0 ||
    Object.values(performance?.axes || {}).some((value) => Number(value) > 0)

  const background = ctx.createLinearGradient(0, 0, 1080, 1920)
  background.addColorStop(0, '#050509')
  background.addColorStop(.45, '#171018')
  background.addColorStop(1, '#07070b')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 1080, 1920)

  const orangeGlow = ctx.createRadialGradient(860, 180, 20, 860, 180, 700)
  orangeGlow.addColorStop(0, 'rgba(255,105,20,.42)')
  orangeGlow.addColorStop(1, 'rgba(255,105,20,0)')
  ctx.fillStyle = orangeGlow
  ctx.fillRect(0, 0, 1080, 980)

  const violetGlow = ctx.createRadialGradient(120, 1510, 20, 120, 1510, 560)
  violetGlow.addColorStop(0, 'rgba(124,58,237,.2)')
  violetGlow.addColorStop(1, 'rgba(124,58,237,0)')
  ctx.fillStyle = violetGlow
  ctx.fillRect(0, 1040, 800, 880)

  ctx.strokeStyle = 'rgba(255,174,91,.24)'
  ctx.lineWidth = 3
  roundedRect(ctx, 48, 48, 984, 1824, 56)
  ctx.stroke()

  ctx.fillStyle = '#ff7a1a'
  roundedRect(ctx, 48, 48, 984, 13, 7)
  ctx.fill()

  const logo = await loadImage('/avatar/v3/brand/pr-logo-official-v1.png').catch(() => null)
  if (logo) {
    ctx.save()
    ctx.globalAlpha = .08
    drawContain(ctx, logo, 650, 30, 450, 450)
    ctx.restore()
    drawContain(ctx, logo, 82, 90, 94, 94)
  }

  ctx.fillStyle = 'rgba(255,255,255,.52)'
  ctx.font = '800 20px Arial, sans-serif'
  ctx.fillText('MI HISTORIA SOBRE RUEDAS', 204, 126)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 34px Arial, sans-serif'
  ctx.fillText('PUNTA ROLLERS', 204, 166)

  drawPanel(ctx, 78, 220, 924, 650, 52, 'rgba(12,10,15,.76)', 'rgba(255,174,91,.18)')

  if (hasChibiAvatar) {
    await drawPrRoller(ctx, chibiSelection, 106, 248, 376, 564, energy)
  } else {
    const portrait = await loadImage(profile?.foto).catch(() => null)
    ctx.save()
    roundedRect(ctx, 108, 294, 370, 370, 92)
    ctx.clip()
    const portraitBg = ctx.createLinearGradient(108, 294, 478, 664)
    portraitBg.addColorStop(0, '#2b1b14')
    portraitBg.addColorStop(1, '#11121a')
    ctx.fillStyle = portraitBg
    ctx.fillRect(108, 294, 370, 370)
    if (portrait) drawCover(ctx, portrait, 108, 294, 370, 370)
    else if (logo) {
      ctx.globalAlpha = .52
      drawContain(ctx, logo, 190, 376, 206, 206)
    }
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,174,91,.42)'
    ctx.lineWidth = 4
    roundedRect(ctx, 108, 294, 370, 370, 92)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.font = '800 17px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CREÁ TU PR ROLLER PARA PERSONALIZAR ESTA PLACA', 293, 726, 330)
    ctx.textAlign = 'left'
  }

  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ').trim() || 'Roller PR'
  ctx.fillStyle = 'rgba(255,170,90,.78)'
  ctx.font = '800 17px Arial, sans-serif'
  ctx.fillText('PERFIL OFICIAL · COMUNIDAD PR', 530, 330)
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 ${fullName.length > 20 ? 48 : 58}px Arial, sans-serif`
  drawWrappedText(ctx, fullName, 530, 405, 410, 60, 2)
  ctx.fillStyle = 'rgba(255,255,255,.47)'
  ctx.font = '700 23px Arial, sans-serif'
  ctx.fillText(profile?.ciudad || 'Punta Rollers · Uruguay', 530, 510)

  ctx.fillStyle = '#ffb36e'
  ctx.font = '900 31px Arial, sans-serif'
  drawWrappedText(ctx, `“${motivation(stats, badgeCount)}”`, 530, 590, 410, 42, 3)

  ctx.fillStyle = 'rgba(255,255,255,.28)'
  ctx.font = '700 16px Arial, sans-serif'
  ctx.fillText('ENERGÍA PR', 530, 742)
  ctx.fillStyle = 'rgba(255,255,255,.1)'
  roundedRect(ctx, 530, 765, 410, 18, 9)
  ctx.fill()
  const energyGradient = ctx.createLinearGradient(530, 0, 940, 0)
  energyGradient.addColorStop(0, '#ef5b12')
  energyGradient.addColorStop(1, '#ffd493')
  ctx.fillStyle = energyGradient
  roundedRect(ctx, 530, 765, Math.max(18, 410 * energy / 100), 18, 9)
  ctx.fill()
  ctx.fillStyle = '#ffbd7e'
  ctx.font = '900 25px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.round(energy)}%`, 940, 744)
  ctx.textAlign = 'left'

  const metrics = [
    { value: String(Number(stats?.sessions) || 0), label: 'ENTRENAMIENTOS', detail: 'historial total' },
    { value: (Number(stats?.kilometers) || 0).toLocaleString('es-UY', { maximumFractionDigits: 1 }), label: 'KILÓMETROS', detail: 'recorrido acumulado' },
    { value: String(Number(badgeCount) || 0), label: 'INSIGNIAS', detail: 'logros obtenidos' },
  ]

  metrics.forEach((metric, index) =>
    drawStoryMetric(ctx, metric, 78 + index * 312, 912, 288, index === 1)
  )

  drawPanel(ctx, 78, 1120, 924, 332, 44, 'rgba(255,255,255,.035)', 'rgba(255,255,255,.09)')
  ctx.fillStyle = '#ffae68'
  ctx.font = '900 17px Arial, sans-serif'
  ctx.fillText(hasPerformance ? 'PERFIL DE RENDIMIENTO' : 'RITMO DE ACTIVIDAD', 116, 1172)

  if (hasPerformance) {
    drawRadar(ctx, performance.axes, 304, 1300, 112)
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.font = '800 18px Arial, sans-serif'
    ctx.fillText('ÍNDICE DE EVOLUCIÓN', 555, 1250)
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 78px Arial, sans-serif'
    ctx.fillText(String(Math.round(Number(performance.index) || 0)), 555, 1332)
    ctx.fillStyle = '#ffb36e'
    ctx.font = '900 20px Arial, sans-serif'
    const performanceMessage = Number(performance.improvementPercent) > 0
      ? `${Number(performance.improvementPercent).toFixed(1)}% de mejora en tu distancia destacada`
      : 'Cada nueva toma vuelve este perfil más preciso'
    drawWrappedText(ctx, performanceMessage, 555, 1380, 370, 28, 2)
  } else if ((activityTrend || []).some((item) => Number(item?.value) > 0)) {
    drawActivityBars(ctx, activityTrend, 126, 1215, 828, 155)
    ctx.fillStyle = 'rgba(255,255,255,.32)'
    ctx.font = '700 16px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Tus últimas actividades importadas · km por sesión', 540, 1420)
    ctx.textAlign = 'left'
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.62)'
    ctx.font = '900 28px Arial, sans-serif'
    ctx.fillText('Tu evolución está esperando nuevas marcas.', 116, 1265)
    ctx.fillStyle = 'rgba(255,255,255,.34)'
    ctx.font = '700 20px Arial, sans-serif'
    drawWrappedText(ctx, 'Entrenamientos, tomas de rendimiento e insignias van completando esta placa automáticamente.', 116, 1320, 800, 32, 3)
  }

  drawPanel(ctx, 78, 1484, 924, 278, 44, 'rgba(255,255,255,.035)', 'rgba(255,255,255,.09)')
  ctx.fillStyle = '#ffae68'
  ctx.font = '900 17px Arial, sans-serif'
  ctx.fillText(`ÚLTIMAS INSIGNIAS · ${Number(badgeCount) || 0} EN TOTAL`, 116, 1538)

  const badgeItems = (recentBadges || []).slice(0, 3)
  if (badgeItems.length) {
    const badgeImages = await Promise.all(
      badgeItems.map((badge) => loadImage(badge.image).catch(() => null))
    )
    badgeItems.forEach((badge, index) => {
      const centerX = 234 + index * 306
      ctx.beginPath()
      ctx.arc(centerX, 1632, 66, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,119,23,.1)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,174,91,.28)'
      ctx.lineWidth = 3
      ctx.stroke()
      if (badgeImages[index]) drawContain(ctx, badgeImages[index], centerX - 56, 1576, 112, 112)
      else {
        ctx.textAlign = 'center'
        ctx.font = '46px Arial, sans-serif'
        ctx.fillText('🏅', centerX, 1648)
      }
      ctx.fillStyle = 'rgba(255,255,255,.7)'
      ctx.font = '800 16px Arial, sans-serif'
      ctx.textAlign = 'center'
      const shortTitle = String(badge.title || 'Insignia PR')
      ctx.fillText(shortTitle.length > 22 ? `${shortTitle.slice(0, 20)}…` : shortTitle, centerX, 1727)
    })
    ctx.textAlign = 'left'
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.58)'
    ctx.font = '900 27px Arial, sans-serif'
    ctx.fillText('Tus próximos logros van a aparecer acá.', 116, 1640)
    ctx.fillStyle = 'rgba(255,255,255,.3)'
    ctx.font = '700 18px Arial, sans-serif'
    ctx.fillText('La placa crece junto con tu recorrido dentro de PR.', 116, 1680)
  }

  ctx.fillStyle = 'rgba(255,255,255,.4)'
  ctx.font = '800 21px Arial, sans-serif'
  ctx.fillText('www.puntarollers.com', 80, 1824)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ff9a4a'
  ctx.font = '900 21px Arial, sans-serif'
  ctx.fillText('#MiHistoriaPR · CADA VUELTA SUMA', 1000, 1824)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('No se pudo crear la placa.')), 'image/png', .96)
  })
  return blob
}

function MiniStoryPreview({ profile, stats, badgeCount, recentBadges, chibiSelection, hasChibiAvatar }) {
  const energy = storyEnergy(stats)
  return (
    <div className="relative aspect-[9/16] w-[116px] shrink-0 overflow-hidden rounded-[20px] border border-orange-200/30 bg-gradient-to-b from-[#2b160e] via-[#111017] to-[#08080c] shadow-[0_18px_44px_rgba(0,0,0,.55)] sm:w-[132px]">
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-orange-500/25 blur-2xl" />
      <img src="/avatar/v3/brand/pr-logo-official-v1.png" alt="" className="absolute left-2.5 top-2.5 z-30 h-5 w-5 object-contain" />
      <p className="absolute left-9 top-3 z-30 text-[4px] font-black uppercase tracking-[.14em] text-white/60">Mi historia PR</p>

      {hasChibiAvatar ? (
        <div className="absolute inset-x-2 top-[16%] z-10 flex h-[48%] justify-center overflow-hidden rounded-[12px]">
          <ChibiAvatarStage selection={chibiSelection} energy={energy} showHud={false} className="!h-full !rounded-[12px] !border-orange-200/15" />
        </div>
      ) : profile?.foto ? (
        <img src={profile.foto} alt="" className="absolute left-1/2 top-[22%] h-[34%] w-[72%] -translate-x-1/2 rounded-[14px] border border-orange-200/20 object-cover" />
      ) : (
        <img src="/avatar/v3/brand/pr-logo-official-v1.png" alt="" className="absolute left-1/2 top-[27%] w-[45%] -translate-x-1/2 opacity-25" />
      )}

      <div className="absolute inset-x-2 bottom-[23%] z-30">
        <p className="truncate text-[7px] font-black text-white">{profile?.nombre || 'Roller PR'}</p>
        <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-orange-400" style={{ width: `${Math.max(5, energy)}%` }} /></div>
      </div>

      <div className="absolute inset-x-2 bottom-[9%] z-30 grid grid-cols-3 gap-1">
        {[
          [Number(stats?.sessions) || 0, 'ENT'],
          [(Number(stats?.kilometers) || 0).toLocaleString('es-UY', { maximumFractionDigits: 0 }), 'KM'],
          [Number(badgeCount) || 0, 'INS'],
        ].map(([value, label]) => <div key={label} className="rounded-md border border-white/[.07] bg-white/[.045] py-1 text-center"><p className="text-[6px] font-black text-white">{value}</p><p className="text-[3px] font-bold text-white/35">{label}</p></div>)}
      </div>

      <div className="absolute bottom-1.5 left-2 flex gap-0.5">
        {(recentBadges || []).slice(0, 3).map((badge) => badge.image ? <img key={badge.id || badge.title} src={badge.image} alt="" className="h-2.5 w-2.5 rounded-full object-contain" /> : null)}
      </div>
      <p className="absolute bottom-1.5 right-2 text-[3px] font-black text-orange-300">puntarollers.com</p>
    </div>
  )
}

export function ProfileStoryCard({
  profile,
  stats,
  badgeCount,
  recentBadges,
  chibiSelection,
  hasChibiAvatar,
  performance,
  activityTrend,
}) {
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [cardUrl, setCardUrl] = useState('')
  const [cardBlob, setCardBlob] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => () => {
    if (cardUrl) URL.revokeObjectURL(cardUrl)
  }, [cardUrl])

  async function generate() {
    setOpen(true)
    setGenerating(true)
    setNotice('')
    try {
      const blob = await buildShareCard({
        profile,
        stats,
        badgeCount,
        recentBadges,
        chibiSelection,
        hasChibiAvatar,
        performance,
        activityTrend,
      })
      if (cardUrl) URL.revokeObjectURL(cardUrl)
      setCardBlob(blob)
      setCardUrl(URL.createObjectURL(blob))
    } catch (error) {
      setNotice(error.message || 'No pudimos crear la placa.')
    } finally {
      setGenerating(false)
    }
  }

  function download() {
    if (!cardUrl) return
    const link = document.createElement('a')
    link.href = cardUrl
    link.download = `mi-perfil-pr-${String(profile?.nombre || 'roller').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
    link.click()
  }

  async function share() {
    if (!cardBlob) return
    const file = new File([cardBlob], 'mi-perfil-punta-rollers.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Mi perfil Punta Rollers', text: 'Cada vuelta suma. Mi historia vive en www.puntarollers.com 🛼⚡' })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    download()
    setNotice('La placa se descargó. Ya podés compartirla en Instagram o WhatsApp.')
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-orange-300/18 bg-gradient-to-br from-[#26160e] via-[#111016] to-violet-400/[.07] p-5">
        <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <MiniStoryPreview profile={profile} stats={stats} badgeCount={badgeCount} recentBadges={recentBadges} chibiSelection={chibiSelection} hasChibiAvatar={hasChibiAvatar} />
          <div className="min-w-0 flex-1 py-1">
            <span className="inline-flex rounded-full border border-orange-300/20 bg-orange-400/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-[.15em] text-orange-200">Story 9:16 · viva</span>
            <h2 className="mt-3 font-display text-[26px] leading-[.95] text-white">Tu Placa Virtual PR</h2>
            <p className="mt-3 text-[10px] leading-5 text-white/40">Se actualiza con tu evolución, kilómetros, entrenamientos, rendimiento e insignias. Si todavía faltan datos, la placa irá creciendo con vos.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/[.045] px-2 py-1 text-[7px] font-bold text-white/38">Instagram</span>
              <span className="rounded-full bg-white/[.045] px-2 py-1 text-[7px] font-bold text-white/38">WhatsApp</span>
              <span className="rounded-full bg-white/[.045] px-2 py-1 text-[7px] font-bold text-white/38">Datos reales</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={generate} className="relative mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 px-4 text-xs font-black text-black active:scale-[.99]">
          <span>Ver y compartir mi Story PR</span><span>→</span>
        </button>
        <p className="relative mt-2 text-center text-[8px] text-white/24">Nunca muestra pagos, PIN, email ni información privada.</p>
      </section>

      {open && (
        <div className="fixed inset-0 z-[160] overflow-y-auto bg-black/85 px-4 py-[max(20px,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[470px] rounded-[32px] border border-white/10 bg-[#0e0d13] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div><p className="section-label">STORY PR · 1080 × 1920</p><h2 className="mt-1 font-display text-2xl text-white">Tu historia, lista para rodar</h2></div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-xl text-white/45">×</button>
            </div>
            {generating ? (
              <div className="grid aspect-[9/16] max-h-[68vh] w-full place-items-center rounded-[24px] border border-white/[.07] bg-white/[.025] text-sm text-white/40">Construyendo tu Story con datos reales…</div>
            ) : cardUrl ? (
              <img src={cardUrl} alt="Story virtual de perfil Punta Rollers" className="mx-auto max-h-[68vh] w-auto rounded-[24px] border border-white/10" />
            ) : (
              <div className="grid aspect-[9/16] max-h-[68vh] place-items-center rounded-[24px] border border-red-300/10 bg-red-400/[.05] p-6 text-center text-sm text-red-100/70">{notice || 'No pudimos crear la placa.'}</div>
            )}
            {notice && cardUrl && <p className="mt-3 rounded-xl bg-white/[.04] p-3 text-[10px] text-white/45">{notice}</p>}
            {cardUrl && <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={download} className="min-h-12 rounded-2xl border border-white/10 text-xs font-black text-white/65">Descargar</button><button type="button" onClick={share} className="min-h-12 rounded-2xl bg-orange-500 text-xs font-black text-black">Compartir</button></div>}
          </div>
        </div>
      )}
    </>
  )
}

const HELP_ITEMS = [
  ['¿Cómo conecto Strava?', 'Abrí Perfil, buscá Tu actividad Strava y tocá Conectar. Autorizás una vez y las nuevas sesiones llegan automáticamente.'],
  ['¿Cómo agrego amigos?', 'Entrá a Comunidad, escribí al menos dos letras del nombre y enviá una solicitud. PR Chat se habilita cuando ambos son amigos.'],
  ['¿Cómo funciona Mi Evolución?', 'Combina tomas, objetivos, clases y actividad deportiva. Con una segunda toma comparable empezamos a mostrar tu progreso.'],
  ['¿Cómo instalo la app?', 'Usá el bloque “Llevá Punta Rollers con vos”. Android ofrece instalación directa; en iPhone se agrega desde Safari y el botón Compartir.'],
  ['¿Cómo contacto a PR?', 'Podés abrir Contactos PR o usar el formulario de lanzamiento de esta misma sección.'],
]

function HelpCenter() {
  const [open, setOpen] = useState(-1)
  return (
    <section className="rounded-[28px] border border-white/[.07] bg-white/[.025] p-4">
      <p className="section-label">CENTRO DE AYUDA</p>
      <h2 className="mt-1 font-display text-2xl text-white">¿Necesitás ayuda?</h2>
      <div className="mt-4 space-y-2">
        {HELP_ITEMS.map(([question, answer], index) => (
          <div key={question} className="overflow-hidden rounded-[18px] border border-white/[.07] bg-black/15">
            <button type="button" onClick={() => setOpen(open === index ? -1 : index)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-xs font-black text-white/68"><span>{question}</span><span className="text-orange-300">{open === index ? '−' : '+'}</span></button>
            {open === index && <p className="border-t border-white/[.06] px-4 py-3 text-[10px] leading-5 text-white/38">{answer}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function FeedbackCard({ profile }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('Problema')
  const [details, setDetails] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [notice, setNotice] = useState('')

  const feedbackText = useMemo(() => [
    'Hola Punta Rollers 👋',
    `Feedback de lanzamiento: ${type}`,
    `Alumno/a: ${[profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || 'Roller PR'}`,
    `Detalle: ${details.trim()}`,
  ].join('\n'), [details, profile?.nombre, profile?.apellido, type])

  async function send() {
    if (details.trim().length < 5) {
      setNotice('Contanos un poquito más para poder revisarlo.')
      return
    }

    if (screenshot && navigator.share) {
      const file = new File([screenshot], screenshot.name || 'captura-pr.png', { type: screenshot.type || 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Feedback Punta Rollers', text: feedbackText })
          setNotice('Gracias. Tu teléfono abrió las opciones para enviarlo con la captura.')
          return
        } catch (error) {
          if (error?.name === 'AbortError') return
        }
      }
    }

    window.open(`https://wa.me/${PR_WHATSAPP}?text=${encodeURIComponent(feedbackText)}`, '_blank', 'noopener,noreferrer')
    setNotice(screenshot ? 'WhatsApp no adjunta archivos automáticamente: agregá la captura desde el chat antes de enviar.' : 'Gracias por ayudarnos a mejorar el lanzamiento.')
  }

  return (
    <section className="rounded-[26px] border border-emerald-300/12 bg-emerald-400/[.045] p-4">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <div><p className="text-[8px] font-black uppercase tracking-[.17em] text-emerald-200/65">FEEDBACK DE LANZAMIENTO</p><h2 className="mt-1 font-display text-xl text-white">¿Encontraste algo raro?</h2><p className="mt-1 text-[10px] text-white/34">Problema, sugerencia o captura. Nos ayuda muchísimo.</p></div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-emerald-200">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-4 space-y-3 border-t border-white/[.06] pt-4">
        <div className="grid grid-cols-2 gap-2">{['Problema', 'Sugerencia'].map((item) => <button key={item} type="button" onClick={() => setType(item)} className={`min-h-11 rounded-2xl text-xs font-black ${type === item ? 'bg-emerald-300 text-[#07110d]' : 'border border-white/10 text-white/45'}`}>{item}</button>)}</div>
        <textarea value={details} onChange={(event) => setDetails(event.target.value.slice(0, 700))} rows="4" placeholder="Contanos qué pasó o qué mejorarías…" className="input-pr resize-none" />
        <label className="flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/12 px-4 text-xs text-white/45"><span>{screenshot ? `📎 ${screenshot.name}` : '📷 Agregar captura (opcional)'}</span><input type="file" accept="image/*" className="hidden" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} /></label>
        <button type="button" onClick={send} className="min-h-12 w-full rounded-2xl bg-emerald-300 text-xs font-black text-[#07110d]">Enviar a Punta Rollers</button>
        {notice && <p className="rounded-xl bg-black/20 p-3 text-[10px] leading-4 text-white/45">{notice}</p>}
      </div>}
    </section>
  )
}

export default function ProfileLaunchSuite({ profile }) {
  return (
    <div className="space-y-3">
      <InstallAppCard />
      <HelpCenter />
      <FeedbackCard profile={profile} />
    </div>
  )
}
