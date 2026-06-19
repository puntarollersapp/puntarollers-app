import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import PublicLayout from "../layouts/PublicLayout"
import { useAuth } from "../lib/auth"

export default function Login() {
  const [documento, setDocumento] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/app/dashboard"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const result = await login(documento, pin)

      if (result?.error) {
        setError(result.error)
        return
      }

      const destination =
        result?.user?.role === "admin" || result?.user?.role === "profesor"
          ? "/admin"
          : from

      navigate(destination, { replace: true })
    } catch {
      setError("No pudimos iniciar sesión. Revisá tus datos.")
    }
  }

  return (
    <PublicLayout>
      <div className="px-4 py-10 max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <h1 className="text-3xl text-white font-bold">Ingresar</h1>
          <p className="text-gray-400 text-sm">
            Accedé a tu perfil PR, observaciones, insignias y participaciones.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="glass p-5 rounded-2xl space-y-4">
          <div className="space-y-2">
            <label className="text-gray-400 text-xs">Documento</label>
            <input
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              type="text"
              placeholder="Ej: 12345678"
              className="input-pr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-xs">PIN</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              type="password"
              placeholder="Tu PIN"
              className="input-pr"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" className="btn-gold w-full">
            Entrar
          </button>
        </form>

        <a href="/" className="block text-center text-xs text-gray-500 underline">
          Volver al inicio
        </a>
      </div>
    </PublicLayout>
  )
}
