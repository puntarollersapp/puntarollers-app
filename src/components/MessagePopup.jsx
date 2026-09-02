import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mensajesGlobales } from '../data/mockData'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TOMA_EVENT_DATE = '2026-09-02'
const TOMA_SYNC_UNTIL = '2026-09-05'

function todayUruguay() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default function MessagePopup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [msg, setMsg] = useState(null)
  const [newToma, setNewToma] = useState(null)

  useEffect(() => {
    let active = true
    let timer

    async function checkNewStravaToma() {
      const profileId = user?.id
      if (!profileId) return false

      try {
        const today = todayUruguay()

        // Durante la ventana de la Toma 3 actualizamos primero Strava y luego
        // intentamos transformar únicamente una coincidencia fuerte en toma.
        // Fuera de la ventana seguimos pudiendo mostrar el aviso pendiente,
        // pero no hacemos llamadas innecesarias a Strava.
        if (today >= TOMA_EVENT_DATE && today <= TOMA_SYNC_UNTIL) {
          const { error: syncError } = await supabase.functions.invoke(
            'strava-auth',
            {
              body: {
                action: 'sync',
                profile_id: profileId,
              },
            }
          )

          // No tener Strava conectado no es un error para la experiencia del
          // alumno: simplemente no habrá toma automática.
          if (!syncError) {
            await supabase.functions.invoke('pr-toma-strava', {
              body: {
                profile_id: profileId,
                date: TOMA_EVENT_DATE,
              },
            })
          }
        }

        const { data, error } = await supabase
          .from('pr_performance_tomas')
          .select(
            'id, numero_toma, fecha, distancia_km, tiempo_segundos, devolucion, origen, created_at'
          )
          .eq('alumno_id', profileId)
          .eq('fecha', TOMA_EVENT_DATE)
          .eq('origen', 'strava')
          .eq('eliminado', false)
          .gte('numero_toma', 3)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error || !data || !active) return false

        const seenKey = `pr_toma_report_seen:${data.id}`
        if (localStorage.getItem(seenKey)) return false

        setNewToma(data)
        timer = window.setTimeout(() => {
          if (active) setVisible(true)
        }, 700)
        return true
      } catch {
        return false
      }
    }

    async function boot() {
      const hasPerformanceAlert = await checkNewStravaToma()
      if (!active || hasPerformanceAlert) return

      const dismissed = sessionStorage.getItem('pr_msg_dismissed')
      const globalMessage = mensajesGlobales.find((item) => item.visible)
      if (globalMessage && !dismissed) {
        setMsg(globalMessage)
        timer = window.setTimeout(() => {
          if (active) setVisible(true)
        }, 1400)
      }
    }

    boot()

    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [user?.id])

  function rememberToma() {
    if (!newToma?.id) return
    localStorage.setItem(`pr_toma_report_seen:${newToma.id}`, '1')
  }

  function dismiss() {
    if (newToma) {
      rememberToma()
    } else {
      sessionStorage.setItem('pr_msg_dismissed', '1')
    }
    setVisible(false)
  }

  function openReport() {
    rememberToma()
    setVisible(false)
    navigate('/app/mi-evolucion')
  }

  if (!visible) return null

  if (newToma) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 pb-24 sm:items-center sm:pb-4">
        <button
          type="button"
          aria-label="Cerrar aviso"
          className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          onClick={dismiss}
        />

        <section className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-orange-300/25 bg-gradient-to-br from-[#351405] via-[#120d0d] to-[#07070b] p-5 shadow-[0_30px_100px_rgba(249,115,22,.28)] animate-page-enter">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-[20px] border border-orange-300/25 bg-orange-400/10 text-2xl shadow-[0_0_30px_rgba(249,115,22,.15)]">
                ⚡
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/[.07] bg-white/[.035] text-white/35 transition hover:text-white"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/[.08] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span className="text-[8px] font-black uppercase tracking-[.18em] text-emerald-200">
                STRAVA · TOMA REGISTRADA
              </span>
            </div>

            <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-orange-300">
              PR PERFORMANCE
            </p>
            <h2 className="mt-2 font-display text-[34px] leading-[.95] text-white">
              ¡Nueva toma<br />
              <span className="text-orange-300">registrada!</span>
            </h2>

            <p className="mt-4 text-xs leading-5 text-white/48">
              Strava registró tu Toma {newToma.numero_toma}. Tu evolución ya fue actualizada y tu nuevo reporte está listo para ver.
            </p>

            <div className="mt-5 grid grid-cols-2 divide-x divide-white/[.07] rounded-[22px] border border-white/[.07] bg-black/25">
              <div className="px-3 py-3.5 text-center">
                <p className="font-display text-[24px] leading-none text-white">
                  {Number(newToma.distancia_km).toLocaleString('es-UY', {
                    maximumFractionDigits: 2,
                  })}K
                </p>
                <p className="mt-2 text-[7px] font-black uppercase tracking-[.14em] text-white/25">
                  DISTANCIA
                </p>
              </div>
              <div className="px-3 py-3.5 text-center">
                <p className="font-display text-[24px] leading-none text-orange-300">
                  TOMA {newToma.numero_toma}
                </p>
                <p className="mt-2 text-[7px] font-black uppercase tracking-[.14em] text-white/25">
                  HISTORIAL PR
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openReport}
              className="mt-5 flex min-h-14 w-full items-center justify-between rounded-[20px] bg-gradient-to-r from-orange-500 to-amber-300 px-5 text-sm font-black text-[#160b04] shadow-[0_14px_35px_rgba(249,115,22,.22)] transition active:scale-[.99]"
            >
              <span>Ver mi nuevo reporte</span>
              <span className="text-lg">→</span>
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="mt-2 w-full py-2 text-[10px] font-bold text-white/30"
            >
              Ver más tarde
            </button>

            <p className="mt-3 text-center text-[8px] leading-4 text-white/20">
              No es solo patinar. Es pertenecer.
            </p>
          </div>
        </section>
      </div>
    )
  }

  if (!msg) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 pb-28">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(5,5,8,0.5)' }}
        onClick={dismiss}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl p-5"
        style={{
          background: 'rgba(9,9,20,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          zIndex: 1,
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🎯</span>
          <div className="flex-1">
            <p className="font-display text-base font-semibold text-white">{msg.titulo}</p>
            <p
              className="text-sm font-body mt-1.5 leading-relaxed"
              style={{ color: 'rgba(216,216,232,0.55)' }}
            >
              {msg.contenido}
            </p>
          </div>
          <button onClick={dismiss} className="opacity-30 hover:opacity-70">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button onClick={dismiss} className="mt-4 w-full btn-ghost py-2.5 text-xs">
          Entendido
        </button>
      </div>
    </div>
  )
}
