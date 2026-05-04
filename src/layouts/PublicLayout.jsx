import { useLocation } from "react-router-dom"

export default function PublicLayout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#050508] text-white pb-20">

      {/* CONTENIDO */}
      <div>{children}</div>

      {/* BARRA INFERIOR */}
      <nav className="fixed bottom-0 left-0 w-full glass-dark border-t border-white/5 px-4 py-2 flex justify-around items-center z-50">

        <NavItem
          href="/"
          label="Inicio"
          icon="🏠"
          active={location.pathname === "/"}
        />

        <NavItem
          href="/cuponeras"
          label="Explorar"
          icon="🧭"
          active={location.pathname.includes("cuponeras")}
        />

        <NavItem
          href="/uniformes"
          label="PR"
          icon="👕"
          active={location.pathname.includes("uniformes")}
        />

        <NavItem
          href="/login"
          label="Perfil"
          icon="👤"
          active={location.pathname.includes("login")}
        />

      </nav>

    </div>
  )
}

function NavItem({ href, label, icon, active }) {
  return (
    <a href={href} className="flex flex-col items-center text-xs">

      <span className={`text-lg transition ${
        active ? "text-yellow-500 scale-110" : "text-gray-400"
      }`}>
        {icon}
      </span>

      <span className={`mt-1 ${
        active ? "text-yellow-500" : "text-gray-500"
      }`}>
        {label}
      </span>

    </a>
  )
}
