import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pr_install_prompt_views'
const LEGACY_STORAGE_KEY = 'pr_install_prompt_closed'
const MAX_VIEWS = 3

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function getPromptViews() {
  const stored = Number(localStorage.getItem(STORAGE_KEY) || '0')
  return Number.isFinite(stored) && stored >= 0 ? stored : 0
}

function registerPromptView() {
  const next = Math.min(getPromptViews() + 1, MAX_VIEWS)
  localStorage.setItem(STORAGE_KEY, String(next))
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandaloneMode()) return

    localStorage.removeItem(LEGACY_STORAGE_KEY)

    if (getPromptViews() >= MAX_VIEWS) return

    const ios = isIosDevice()
    let showTimer

    if (ios) {
      showTimer = setTimeout(() => setVisible(true), 1800)
      return () => clearTimeout(showTimer)
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallEvent(event)
      clearTimeout(showTimer)
      showTimer = setTimeout(() => setVisible(true), 1200)
    }

    function handleInstalled() {
      setVisible(false)
      setInstallEvent(null)
      localStorage.setItem('pr_app_installed', 'true')
      localStorage.setItem(STORAGE_KEY, String(MAX_VIEWS))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      clearTimeout(showTimer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  function closePrompt() {
    setVisible(false)
    setShowIosHelp(false)
    registerPromptView()
  }

  async function installApp() {
    if (isIosDevice()) {
      setShowIosHelp(true)
      return
    }

    if (!installEvent) return

    try {
      setInstalling(true)
      await installEvent.prompt()
      const choice = await installEvent.userChoice

      if (choice.outcome === 'accepted') {
        setVisible(false)
        localStorage.setItem(STORAGE_KEY, String(MAX_VIEWS))
      } else {
        registerPromptView()
        setVisible(false)
      }

      setInstallEvent(null)
    } catch (error) {
      console.error('No se pudo iniciar la instalación:', error)
    } finally {
      setInstalling(false)
    }
  }

  if (!visible || isStandaloneMode()) return null

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm animate-fade-in" />

      <section className="fixed left-1/2 bottom-0 z-[100] w-full max-w-[500px] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-t-[26px] border border-white/[0.08] bg-[#101016] px-4 pt-4 pb-[max(18px,env(safe-area-inset-bottom))] shadow-[0_-20px_70px_rgba(0,0,0,.55)] animate-fade-up max-h-[min(88dvh,720px)]">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/15" />

        <button
          type="button"
          onClick={closePrompt}
          aria-label="Cerrar"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/[0.07] bg-white/[0.04] text-white/45"
        >
          ×
        </button>

        <div className="flex items-center gap-3 pr-9">
          <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[18px] border border-pr-gold/25 bg-black shadow-[0_10px_28px_rgba(0,0,0,.4)] sm:h-[70px] sm:w-[70px]">
            <img
              src="/pwa-192x192.png"
              alt="Punta Rollers App"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <p className="section-label">Aplicación oficial</p>
            <h2 className="font-display mt-1 text-[22px] leading-[1.05] text-white sm:text-[25px]">
              Instalá Punta Rollers
            </h2>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/40 sm:text-xs">
              Accedé más rápido a tu perfil, actividad, PRCard y comunidad.
            </p>
          </div>
        </div>

        {!showIosHelp ? (
          <>
            <div className="my-4 grid grid-cols-3 gap-2">
              <Feature icon="⚡" label="Acceso rápido" />
              <Feature icon="🛼" label="Tu perfil PR" />
              <Feature icon="🏅" label="Tus logros" />
            </div>

            <button
              type="button"
              onClick={installApp}
              disabled={installing || (!installEvent && !isIosDevice())}
              className="btn-gold w-full disabled:opacity-50"
            >
              {installing ? 'Preparando instalación…' : 'Instalar aplicación'}
            </button>

            {!installEvent && !isIosDevice() && (
              <p className="mt-2 text-center text-[10px] leading-relaxed text-white/28">
                El instalador aparecerá cuando el navegador termine de verificar la aplicación.
              </p>
            )}

            <button
              type="button"
              onClick={closePrompt}
              className="mt-2 w-full py-2 text-xs font-semibold text-white/35"
            >
              Ahora no
            </button>
          </>
        ) : (
          <IosInstructions onClose={closePrompt} />
        )}
      </section>
    </>
  )
}

function Feature({ icon, label }) {
  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.025] px-1.5 py-2.5 text-center">
      <div className="text-lg">{icon}</div>
      <p className="mt-1 text-[9px] font-semibold leading-tight text-white/45">
        {label}
      </p>
    </div>
  )
}

function IosInstructions({ onClose }) {
  return (
    <div className="mt-4">
      <div className="rounded-[18px] border border-pr-gold/20 bg-pr-gold/10 p-3.5">
        <p className="font-display text-lg text-white">Instalación en iPhone</p>

        <div className="mt-3 space-y-3">
          <Instruction
            number="1"
            title="Abrí esta página en Safari"
            text="La instalación no funciona desde el navegador interno de WhatsApp o Instagram."
          />
          <Instruction
            number="2"
            title="Tocá el botón Compartir"
            text="Es el cuadrado con una flecha hacia arriba."
          />
          <Instruction
            number="3"
            title="Elegí Agregar a pantalla de inicio"
            text="Después tocá Agregar para confirmar."
          />
        </div>
      </div>

      <button type="button" onClick={onClose} className="btn-gold mt-3 w-full">
        Entendido
      </button>
    </div>
  )
}

function Instruction({ number, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pr-gold font-display text-xs font-bold text-black">
        {number}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-white/38">{text}</p>
      </div>
    </div>
  )
}
