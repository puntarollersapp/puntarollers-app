import { useLocation } from "react-router-dom"

export default function PublicLayout({ children }) {
  const location = useLocation()

  const scrollToInscripciones = (e) => {
    e.preventDefault()
    const el = document.getElementById("inscripciones")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white pb-24">

      {/* CONTENIDO */}
      <div key={location.pathname} className="animate-page-enter">
        {children}
      </div>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 w-full glass-dark border-t border-white/5 px-4 py-3 flex justify-around items-center z-50">

        <NavItem href="/" label="Inicio" icon="🏠" active={location.pathname === "/"} />

        <a onClick={scrollToInscripciones} className="flex flex-col items-center text-xs cursor-pointer">
          <span className="text-gray-400 text-lg">🎟️</span>
          <span className="text-gray-500 mt-1">Clases</span>
        </a>

        <NavItem href="/cuponeras" label="Explorar" icon="🧭" active={location.pathname.includes("cuponeras")} />

        <NavItem href="/login" label="Perfil" icon="👤" active={location.pathname.includes("login")} />

      </nav>

    </div>
  )
}

function NavItem({ href, label, icon, active }) {
  return (
    <a href={href} className="flex flex-col items-center text-xs">

      <span className={`text-lg ${
        active ? "text-yellow-500 scale-110 drop-shadow-[0_0_6px_rgba(201,168,76,0.6)]" : "text-gray-400"
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
