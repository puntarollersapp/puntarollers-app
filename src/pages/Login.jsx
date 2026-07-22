import { useState } from 'react'
import {
  useNavigate,
  Link,
} from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { useAuth } from '../lib/auth'

export default function Login() {
  const [documento, setDocumento] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const result = await login(documento, pin)

      if (result?.error) {
        setError(result.error)
        return
      }

      const isAdmin =
        result?.user?.role === 'admin' ||
        result?.user?.role === 'profesor'

      navigate(
        isAdmin ? '/admin' : '/app/perfil',
        {
          replace: true,
        }
      )
    } catch {
      setError(
        'No pudimos iniciar sesión. Revisá tus datos.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-70px)] px-5 py-8 max-w-md mx-auto flex flex-col justify-center">
        <section className="text-center mb-8 animate-fade-up">
          <div className="w-20 h-20 mx-auto rounded-[26px] grid place-items-center bg-pr-gold/10 border border-pr-gold/20 shadow-[0_20px_55px_rgba(0,0,0,.35)]">
            <img
              src="/logo.png"
              alt="Punta Rollers"
              className="w-14 h-14 object-contain"
            />
          </div>

          <p className="section-label mt-6">
            PuntaRollers.app
          </p>

          <h1 className="font-display text-[38px] leading-none text-white mt-2">
            Tu club, en tu bolsillo.
          </h1>

          <p className="text-white/40 text-sm mt-3 max-w-[290px] mx-auto">
            Ingresá para ver tu perfil, progreso,
            beneficios y vida dentro de PR.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="pr-panel p-5 space-y-4 animate-fade-up stagger-1"
        >
          <label className="block">
            <span className="section-label">
              Documento
            </span>

            <input
              value={documento}
              onChange={(event) =>
                setDocumento(event.target.value)
              }
              inputMode="numeric"
              placeholder="Ej: 12345678"
              className="input-pr mt-2"
            />
          </label>

          <label className="block">
            <span className="section-label">
              PIN personal
            </span>

            <input
              value={pin}
              onChange={(event) =>
                setPin(event.target.value)
              }
              type="password"
              inputMode="numeric"
              placeholder="Ingresá tu PIN"
              className="input-pr mt-2"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full disabled:opacity-50"
          >
            {loading
              ? 'Ingresando…'
              : 'Ingresar a mi cuenta'}
          </button>
        </form>

        <Link
          to="/"
          className="text-center text-white/30 text-xs mt-6"
        >
          Volver al sitio público
        </Link>
      </div>
    </PublicLayout>
  )
}
