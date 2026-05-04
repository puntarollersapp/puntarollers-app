import React from "react"

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* CONTENEDOR PREMIUM */}
      <div className="max-w-md mx-auto px-4 py-6">

        {children}

      </div>

    </div>
  )
}
