import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pr_install_prompt_closed'

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(
    window.navigator.userAgent
  )
}

function isStandaloneMode() {
  return (
    window.matchMedia(
      '(display-mode: standalone)'
    ).matches ||
    window.navigator.standalone === true
  )
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState(null)

  const [visible, setVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] =
    useState(false)

  const [installing, setInstalling] =
    useState(false)

  useEffect(() => {
    if (isStandaloneMode()) {
      return
    }

    const wasClosed =
      localStorage.getItem(STORAGE_KEY) === 'true'

    if (wasClosed) {
      return
    }

    const ios = isIosDevice()

    if (ios) {
      const timer = setTimeout(() => {
        setVisible(true)
      }, 1800)

      return () => clearTimeout(timer)
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallEvent(event)

      const timer = setTimeout(() => {
        setVisible(true)
      }, 1200)

      return () => clearTimeout(timer)
    }

    function handleInstalled() {
      setVisible(false)
      setInstallEvent(null)

      localStorage.setItem(
        'pr_app_installed',
        'true'
      )
    }

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    )

    window.addEventListener(
      'appinstalled',
      handleInstalled
    )

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )

      window.removeEventListener(
        'appinstalled',
        handleInstalled
      )
    }
  }, [])

  function closePrompt() {
    setVisible(false)
    setShowIosHelp(false)

    localStorage.setItem(
      STORAGE_KEY,
      'true'
    )
  }

  async function installApp() {
    if (isIosDevice()) {
      setShowIosHelp(true)
      return
    }

    if (!installEvent) {
      return
    }

    try {
      setInstalling(true)

      await installEvent.prompt()

      const choice =
        await installEvent.userChoice

      if (choice.outcome === 'accepted') {
        setVisible(false)
      }

      setInstallEvent(null)
    } catch (error) {
      console.error(
        'No se pudo iniciar la instalación:',
        error
      )
    } finally {
      setInstalling(false)
    }
  }

  if (!visible || isStandaloneMode()) {
    return null
  }

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm animate-fade-in" />

      <section className="fixed left-1/2 bottom-0 z-[100] w-full max-w-[520px] -translate-x-1/2 rounded-t-[30px] border border-white/[0.08] bg-[#101016] px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-20px_70px_rgba(0,0,0,.55)] animate-fade-up">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />

        <button
          type="button"
          onClick={closePrompt}
          aria-label="Cerrar"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/[0.07] bg-white/[0.04] text-white/45"
        >
          ×
        </button>

        <div className="flex items-center gap-4 pr-10">
          <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[22px] border border-pr-gold/25 bg-black shadow-[0_12px_35px_rgba(0,0,0,.4)]">
            <img
              src="/pwa-192x192.png"
              alt="Punta Rollers App"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="section-label">
              Aplicación oficial
            </p>

            <h2 className="font-display mt-1 text-[27px] leading-none text-white">
              Instalá Punta Rollers
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Accedé más rápido a tu perfil,
              actividad, PRCard y comunidad.
            </p>
          </div>
        </div>

        {!showIosHelp ? (
          <>
            <div className="my-5 grid grid-cols-3 gap-2">
              <Feature
                icon="⚡"
                label="Acceso rápido"
              />

              <Feature
                icon="🛼"
                label="Tu perfil PR"
              />

              <Feature
                icon="🏅"
                label="Tus logros"
              />
            </div>

            <button
              type="button"
              onClick={installApp}
              disabled={
                installing ||
                (!installEvent &&
                  !isIosDevice())
              }
              className="btn-gold w-full disabled:opacity-50"
            >
              {installing
                ? 'Preparando instalación…'
                : 'Instalar aplicación'}
            </button>

            {!installEvent &&
              !isIosDevice() && (
                <p className="mt-3 text-center text-[10px] text-white/28">
                  El instalador aparecerá cuando
                  el navegador termine de verificar
                  la aplicación.
                </p>
              )}

            <button
              type="button"
              onClick={closePrompt}
              className="mt-3 w-full py-2 text-xs font-semibold text-white/35"
            >
              Ahora no
            </button>
          </>
        ) : (
          <IosInstructions
            onClose={closePrompt}
          />
        )}
      </section>
    </>
  )
}

function Feature({ icon, label }) {
  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.025] px-2 py-3 text-center">
      <div className="text-xl">
        {icon}
      </div>

      <p className="mt-1 text-[9px] font-semibold leading-tight text-white/45">
        {label}
      </p>
    </div>
  )
}

function IosInstructions({ onClose }) {
  return (
    <div className="mt-6">
      <div className="rounded-[20px] border border-pr-gold/20 bg-pr-gold/10 p-4">
        <p className="font-display text-xl text-white">
          Instalación en iPhone
        </p>

        <div className="mt-4 space-y-4">
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

      <button
        type="button"
        onClick={onClose}
        className="btn-gold mt-4 w-full"
      >
        Entendido
      </button>
    </div>
  )
}

function Instruction({
  number,
  title,
  text,
}) {
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pr-gold font-display text-sm font-bold text-black">
        {number}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-relaxed text-white/38">
          {text}
        </p>
      </div>
    </div>
  )
}
