import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center text-[10px] ${
      isActive ? 'text-[#C9A84C]' : 'text-white/40'
    }`

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 pb-safe">
      <div className="flex justify-around py-2">

        <NavLink to="/app/dashboard" className={linkClass}>
          <span>🏠</span>
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/app/actividad" className={linkClass}>
          <span>📊</span>
          <span>Actividad</span>
        </NavLink>

        <NavLink to="/app/prcard" className={linkClass}>
          <span>💳</span>
          <span>PRCard</span>
        </NavLink>

        <NavLink to="/app/servicios" className={linkClass}>
          <span>⚡</span>
          <span>Servicios</span>
        </NavLink>

        <NavLink to="/app/perfil" className={linkClass}>
          <span>👤</span>
          <span>Perfil</span>
        </NavLink>

      </div>
    </div>
  )
}
