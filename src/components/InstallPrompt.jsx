import { useEffect, useState } from 'react'

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [showAndroidHelp, setShowAndroidHelp] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandaloneMode()) return undefined

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallEvent(event)
    }

    function handleOpenInstall() {
      setShowIosHelp(false)
      setShowAndroidHelp(false)
      setVisible(true)
    }

    function handleInstalled() {
      setVisible(false)
      setInstallEvent(null)
      localStorage.setItem('pr_app_installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('pr:open-install', handleOpenInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('pr:open-install', handleOpenInstall)
    }
  }, [])

  function closePrompt() {
    setVisible(false)
    setShowIosHelp(false)
    setShowAndroidHelp(false)
  }

  async function installApp() {
    if (isIosDevice()) {
      setShowIosHelp(true)
      return
    }

    if (!installEvent) {
      setShowAndroidHelp(true)
      return
    }

    try {
      setInstalling(true)
      await installEvent.prompt()
      const choice = await installEvent.userChoice

      if (choice.outcome === 'accepted') {
        setVisible(false)
      } else {
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

      <section className="fixed inset-x-0 bottom-0 z-[100] mx-auto w-full max-w-[500px] overflow-y-auto overscroll-contain rounded-t-[26px] border border-white/[0.08] bg-[#101016] px-4 pt-4 pb-[max(18px,env(safe-area-inset-bottom))] shadow-[0_-20px_70px_rgba(0,0,0,.55)] animate-fade-up max-h-[min(88dvh,720px)]">
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

        {!showIosHelp && !showAndroidHelp ? (
          <>
            <div className="my-4 grid grid-cols-3 gap-2">
              <Feature icon="⚡" label="Acceso rápido" />
              <Feature icon="🛼" label="Tu perfil PR" />
              <Feature icon="🏅" label="Tus logros" />
            </div>

            <button
              type="button"
              onClick={installApp}
              disabled={installing}
              className="btn-gold w-full disabled:opacity-50"
            >
              {installing
                ? 'Preparando instalación…'
                : installEvent || isIosDevice()
                  ? 'Instalar aplicación'
                  : 'Ver cómo instalar'}
            </button>

            <button
              type="button"
              onClick={closePrompt}
              className="mt-2 w-full py-2 text-xs font-semibold text-white/35"
            >
              Ahora no
            </button>
          </>
        ) : showIosHelp ? (
          <IosInstructions onClose={closePrompt} />
        ) : (
          <AndroidInstructions onClose={closePrompt} />
        )}
      </section>
    </>
  )
}

function AndroidInstructions({ onClose }) {
  return (
    <div className="mt-4">
      <div className="rounded-[18px] border border-pr-gold/20 bg-pr-gold/10 p-3.5">
        <p className="font-display text-lg text-white">Instalación en Android</p>
        <div className="mt-3 space-y-3">
          <Instruction number="1" title="Abrí el menú de Chrome" text="Tocá los tres puntos de la esquina superior derecha." />
          <Instruction number="2" title="Elegí Instalar aplicación" text="También puede aparecer como Agregar a pantalla principal." />
          <Instruction number="3" title="Confirmá la instalación" text="Punta Rollers quedará junto a tus otras apps." />
        </div>
      </div>
      <button type="button" onClick={onClose} className="btn-gold mt-3 w-full">Entendido</button>
    </div>
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
