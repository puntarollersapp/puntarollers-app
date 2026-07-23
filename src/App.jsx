import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { supabase } from '../lib/supabase'

export default function StravaCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const started = useRef(false)

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState(
    'Terminando la vinculación con Strava…'
  )
  const [importedActivities, setImportedActivities] = useState(0)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function finishConnection() {
      const error = searchParams.get('error')
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (error) {
        setStatus('error')
        setMessage(
          error === 'access_denied'
            ? 'Cancelaste la autorización de Strava.'
            : `Strava devolvió un error: ${error}`
        )
        return
      }

      if (!code || !state) {
        setStatus('error')
        setMessage(
          'No recibimos una autorización válida desde Strava.'
        )
        return
      }

      try {
        const { data, error: functionError } =
          await supabase.functions.invoke('strava-auth', {
            body: {
              action: 'exchange',
              code,
              state,
            },
          })

        if (functionError) {
          throw new Error(functionError.message)
        }

        if (!data?.success) {
          throw new Error(
            data?.error ||
              'La función no confirmó la vinculación.'
          )
        }

        setImportedActivities(
          Number(data.imported_activities) || 0
        )
        setStatus('success')
        setMessage(
          'Tu cuenta de Strava quedó vinculada correctamente.'
        )

        window.setTimeout(() => {
          navigate('/app/perfil?strava=connected', {
            replace: true,
          })
        }, 2200)
      } catch (connectionError) {
        setStatus('error')
        setMessage(
          connectionError instanceof Error
            ? connectionError.message
            : 'No se pudo completar la vinculación con Strava.'
        )
      }
    }

    finishConnection()
  }, [navigate, searchParams])

  return (
    <AppLayout title="Strava">
      <div className="pr-page animate-page-enter">
        <section className="rounded-[30px] border border-white/[0.08] bg-gradient-to-br from-orange-500/[0.14] via-[#111117] to-black p-6 text-center">
          <div
            className={`w-20 h-20 mx-auto rounded-[26px] border grid place-items-center text-4xl ${
              status === 'success'
                ? 'border-emerald-400/25 bg-emerald-400/10'
                : status === 'error'
                  ? 'border-red-400/25 bg-red-400/10'
                  : 'border-orange-400/25 bg-orange-400/10 animate-pulse'
            }`}
          >
            {status === 'success'
              ? '✓'
              : status === 'error'
                ? '!'
                : '🟠'}
          </div>

          <p className="section-label text-orange-300 mt-5">
            Strava + Punta Rollers
          </p>

          <h1 className="font-display text-3xl text-white mt-2">
            {status === 'success'
              ? '¡Conexión completada!'
              : status === 'error'
                ? 'No pudimos vincularla'
                : 'Conectando tu cuenta'}
          </h1>

          <p className="text-white/50 text-sm leading-relaxed mt-4">
            {message}
          </p>

          {status === 'success' && (
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/[0.07] p-4 mt-5">
              <p className="text-orange-200 font-semibold">
                {importedActivities} actividad
                {importedActivities === 1 ? '' : 'es'} importada
                {importedActivities === 1 ? '' : 's'}
              </p>
              <p className="text-white/35 text-xs mt-1">
                Te estamos llevando nuevamente a tu perfil.
              </p>
            </div>
          )}

          {status === 'error' && (
            <Link
              to="/app/perfil"
              className="btn-gold w-full mt-6 inline-flex items-center justify-center"
            >
              Volver a mi perfil
            </Link>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
