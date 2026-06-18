import { useLocation } from "react-router-dom"

export default function PublicLayout({ children }) {
  const location = useLocation()

  const goTo = (target) => (e) => {
    e.preventDefault()

    if (location.pathname !== "/") {
      window.location.href = `/${target}`
      return
    }

    const id = target.replace("#", "")
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white pb-24">
      <div key={location.pathname} className="animate-page-enter">
        {children}
      </div>

      <nav className="fixed bottom-0 left-0 w-full glass-dark border-t border-white/5 px-4 py-3 flex justify-around items-center z-50">
        <NavItem href="/" label="Inicio" icon="🏠" active={location.pathname === "/"} />
        <NavItem href="/#inscripciones" label="Clases" icon="🎟️" onClick={goTo("#inscripciones")} />
        <NavItem href="/#explorar" label="Explorar" icon="🧭" onClick={goTo("#explorar")} />
        <NavItem href="/login" label="Perfil" icon="👤" active={location.pathname === "/login"} />
      </nav>
    </div>
  )
}

function NavItem({ href, label, icon, active, onClick }) {
  return (
    <a href={href} onClick={onClick} className="flex flex-col items-center text-xs">
      <span className={`text-lg ${active ? "nav-active scale-110" : "text-gray-400"}`}>
        {icon}
      </span>
      <span className={`mt-1 ${active ? "text-yellow-500" : "text-gray-500"}`}>
        {label}
      </span>
    </a>
  )
}
