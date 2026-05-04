import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const [documento, setDocumento] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    if (!documento || !pin) { setError('Completá todos los campos.'); return }
    setLoading(true)
    const res = await login(documento, pin)
    setLoading(false)
    if (res.success) navigate('/app/dashboard')
    else setError(res.error || 'Error al ingresar.')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(201,168,76,0.08) 0%, #050508 70%)' }}
    >
      <Link to="/" className="absolute top-12 left-6 opacity-40 hover:opacity-80 transition-opacity">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="mb-8 animate-fade-up">
        <img
          src="/logo.png"
          alt="Punta Rollers"
          className="w-24 h-24 object-contain mx-auto"
          style={{ filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.5))' }}
        />
      </div>

      <div className="w-full max-w-sm animate-fade-up stagger-1">
        <h1 className="font-display text-3xl font-bold text-white text-center mb-1">Bienvenido</h1>
        <p className="text-white/40 text-sm font-body text-center mb-8">Ingresá con tu documento y PIN</p>

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm font-body text-red-400 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-white/40 font-body mb-2 uppercase tracking-wider">Documento</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Ej: 47839201"
            className="input-pr"
            value={documento}
            onChange={e => setDocumento(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-white/40 font-body mb-2 uppercase tracking-wider">PIN</label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              placeholder="••••"
              className="input-pr pr-12"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              maxLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity"
            >
              {showPin ? (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-gold w-full py-4 text-base relative overflow-hidden"
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            'Entrar al Club'
          )}
        </button>

        <div className="mt-6 p-4 rounded-xl glass text-center">
          <p className="text-white/40 text-xs font-body">
            Demo: Usá cualquier documento con el PIN <span className="text-pr-gold font-mono">1234</span>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs font-body mt-4">
          ¿No tenés cuenta?{' '}
          <a href="mailto:info@puntarollers.com" className="text-pr-gold hover:underline">
            Contactanos
          </a>
        </p>
      </div>
    </div>
  )
}
