import { useEffect, useMemo, useState } from 'react'
import { CHIBI_HEADS } from '../../features/avatar/chibiCatalog'

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

  if (kilometers >= 250) return 'Tu recorrido ya inspira nuevas vueltas.'
  if (sessions >= 50) return 'Tu constancia ya dejó una huella PR.'
  if (badgeCount >= 5) return 'Cada logro cuenta una parte de tu historia.'
  if (sessions > 0) return 'La próxima meta ya está un poco más cerca.'
  return 'Toda historia sobre ruedas empieza con una vuelta.'
}

async function buildShareCard({ profile, stats, badgeCount, chibiSelection, useChibiPhoto }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')

  const background = ctx.createLinearGradient(0, 0, 1080, 1350)
  background.addColorStop(0, '#07070b')
  background.addColorStop(.52, '#15101a')
  background.addColorStop(1, '#09090d')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 1080, 1350)

  const glow = ctx.createRadialGradient(850, 160, 10, 850, 160, 560)
  glow.addColorStop(0, 'rgba(255,119,23,.36)')
  glow.addColorStop(1, 'rgba(255,119,23,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 700)

  ctx.strokeStyle = 'rgba(255,174,91,.24)'
  ctx.lineWidth = 3
  roundedRect(ctx, 48, 48, 984, 1254, 48)
  ctx.stroke()

  ctx.fillStyle = '#ff7a1a'
  ctx.fillRect(48, 48, 984, 12)

  const logo = await loadImage('/avatar/v3/brand/pr-logo-official-v1.png').catch(() => null)
  if (logo) {
    ctx.save()
    ctx.globalAlpha = .12
    drawContain(ctx, logo, 650, 20, 420, 420)
    ctx.restore()
    drawContain(ctx, logo, 80, 84, 104, 104)
  }

  ctx.fillStyle = 'rgba(255,255,255,.55)'
  ctx.font = '700 24px Arial, sans-serif'
  ctx.letterSpacing = '4px'
  ctx.fillText('MI PERFIL PR', 212, 126)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 34px Arial, sans-serif'
  ctx.fillText('PUNTA ROLLERS', 212, 170)

  const head = CHIBI_HEADS[chibiSelection?.head] || CHIBI_HEADS.masculine
  const portraitSrc = useChibiPhoto ? head.src : profile?.foto || head.src
  const portrait = await loadImage(portraitSrc).catch(() => loadImage(head.src).catch(() => null))

  ctx.save()
  roundedRect(ctx, 80, 238, 360, 360, 86)
  ctx.clip()
  const portraitBg = ctx.createLinearGradient(80, 238, 440, 598)
  portraitBg.addColorStop(0, '#2b1b14')
  portraitBg.addColorStop(1, '#11121a')
  ctx.fillStyle = portraitBg
  ctx.fillRect(80, 238, 360, 360)
  if (portrait) {
    if (!useChibiPhoto && profile?.foto) drawCover(ctx, portrait, 80, 238, 360, 360)
    else drawContain(ctx, portrait, 80, 218, 360, 400)
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,174,91,.5)'
  ctx.lineWidth = 4
  roundedRect(ctx, 80, 238, 360, 360, 86)
  ctx.stroke()

  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ').trim() || 'Roller PR'
  ctx.fillStyle = 'rgba(255,170,90,.72)'
  ctx.font = '800 22px Arial, sans-serif'
  ctx.fillText('ROLLER DE LA COMUNIDAD', 492, 300)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 58px Arial, sans-serif'
  const displayName = fullName.length > 25 ? `${fullName.slice(0, 23)}…` : fullName
  ctx.fillText(displayName, 492, 374)
  ctx.fillStyle = 'rgba(255,255,255,.47)'
  ctx.font = '600 25px Arial, sans-serif'
  ctx.fillText(profile?.ciudad || 'Punta Rollers · Uruguay', 492, 420)

  ctx.fillStyle = '#ffb36e'
  ctx.font = '900 34px Arial, sans-serif'
  ctx.fillText(`“${motivation(stats, badgeCount)}”`, 492, 498, 485)

  const metrics = [
    { value: String(Number(stats?.sessions) || 0), label: 'ENTRENAMIENTOS' },
    { value: (Number(stats?.kilometers) || 0).toLocaleString('es-UY', { maximumFractionDigits: 1 }), label: 'KILÓMETROS' },
    { value: String(Number(badgeCount) || 0), label: 'INSIGNIAS' },
  ]

  metrics.forEach((metric, index) => {
    const x = 80 + index * 314
    roundedRect(ctx, x, 664, 286, 196, 34)
    ctx.fillStyle = index === 1 ? 'rgba(255,116,23,.16)' : 'rgba(255,255,255,.045)'
    ctx.fill()
    ctx.strokeStyle = index === 1 ? 'rgba(255,160,74,.35)' : 'rgba(255,255,255,.1)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = index === 1 ? '#ffb36e' : '#ffffff'
    ctx.font = '900 60px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(metric.value, x + 143, 752)
    ctx.fillStyle = 'rgba(255,255,255,.42)'
    ctx.font = '800 17px Arial, sans-serif'
    ctx.fillText(metric.label, x + 143, 808)
  })
  ctx.textAlign = 'left'

  roundedRect(ctx, 80, 910, 920, 238, 38)
  const panel = ctx.createLinearGradient(80, 910, 1000, 1148)
  panel.addColorStop(0, 'rgba(255,119,23,.15)')
  panel.addColorStop(1, 'rgba(139,92,246,.10)')
  ctx.fillStyle = panel
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.1)'
  ctx.stroke()
  ctx.fillStyle = '#ffb36e'
  ctx.font = '900 21px Arial, sans-serif'
  ctx.fillText('CADA VUELTA SUMA', 116, 970)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 44px Arial, sans-serif'
  ctx.fillText('No es solo patinar.', 116, 1038)
  ctx.fillText('Es pertenecer.', 116, 1092)

  ctx.fillStyle = 'rgba(255,255,255,.4)'
  ctx.font = '700 22px Arial, sans-serif'
  ctx.fillText('www.puntarollers.com', 80, 1230)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ff9a4a'
  ctx.font = '900 22px Arial, sans-serif'
  ctx.fillText('#MiHistoriaPR', 1000, 1230)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('No se pudo crear la placa.')), 'image/png', .96)
  })
  return blob
}

function ShareCard({ profile, stats, badgeCount, chibiSelection, useChibiPhoto }) {
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
      const blob = await buildShareCard({ profile, stats, badgeCount, chibiSelection, useChibiPhoto })
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
        <div className="relative flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-orange-200/20 bg-orange-400/10 text-2xl">✨</div>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-black uppercase tracking-[.17em] text-orange-200/70">MI PLACA VIRTUAL PR</p>
            <h2 className="mt-1 font-display text-2xl leading-none text-white">Tu historia, lista para compartir.</h2>
            <p className="mt-2 text-[10px] leading-5 text-white/36">Una placa motivadora con tus resultados reales. Nunca incluye pagos, PIN, email ni datos privados.</p>
          </div>
        </div>
        <button type="button" onClick={generate} className="relative mt-4 flex min-h-12 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 px-4 text-xs font-black text-black active:scale-[.99]">
          <span>Crear mi placa PR</span><span>→</span>
        </button>
      </section>

      {open && (
        <div className="fixed inset-0 z-[160] overflow-y-auto bg-black/85 px-4 py-[max(20px,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[470px] rounded-[32px] border border-white/10 bg-[#0e0d13] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div><p className="section-label">MI PERFIL PR</p><h2 className="mt-1 font-display text-2xl text-white">Lista para salir a rodar</h2></div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-xl text-white/45">×</button>
            </div>
            {generating ? (
              <div className="grid aspect-[4/5] place-items-center rounded-[24px] border border-white/[.07] bg-white/[.025] text-sm text-white/40">Creando tu placa…</div>
            ) : cardUrl ? (
              <img src={cardUrl} alt="Placa virtual de perfil Punta Rollers" className="w-full rounded-[24px] border border-white/10" />
            ) : (
              <div className="grid aspect-[4/5] place-items-center rounded-[24px] border border-red-300/10 bg-red-400/[.05] p-6 text-center text-sm text-red-100/70">{notice || 'No pudimos crear la placa.'}</div>
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

export default function ProfileLaunchSuite({ profile, stats, badgeCount, chibiSelection, useChibiPhoto }) {
  return (
    <div className="space-y-3">
      <ShareCard profile={profile} stats={stats} badgeCount={badgeCount} chibiSelection={chibiSelection} useChibiPhoto={useChibiPhoto} />
      <InstallAppCard />
      <HelpCenter />
      <FeedbackCard profile={profile} />
    </div>
  )
}

