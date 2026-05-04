import { useAuth } from '../lib/auth'

export default function Header() {
  const { user } = useAuth()

  return (
    <div className="glass-dark px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-white/40">Hola</p>
        <h2 className="text-sm font-semibold">
          {user?.nombre || 'Invitado'}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs">
          {user?.nombre?.[0] || 'PR'}
        </div>
      </div>
    </div>
  )
}
