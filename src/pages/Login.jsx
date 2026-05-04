import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [documento, setDocumento] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await login(documento, pin)

    if (error) {
      setError('Error al ingresar.')
      setLoading(false)
      return
    }

    // LOGIN OK
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050508] text-white">
      <div className="w-full max-w-md">

        <h1 className="text-2xl mb-6 text-center">Bienvenido</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/30 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="text"
            placeholder="Documento"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className="input-pr"
          />

          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input-pr"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full"
          >
            {loading ? 'Entrando...' : 'Entrar al club'}
          </button>

        </form>

        <p className="text-xs text-white/40 mt-4 text-center">
          Demo: documento 123 / PIN 1234
        </p>

      </div>
    </div>
  )
}
