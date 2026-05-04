import React from "react"

export default function Home() {
  return (
    <div className="px-4 py-6 space-y-6">

      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">
          No es solo patinar, es pertenecer
        </h1>
        <p className="text-gray-400 text-sm">
          Bienvenido a Punta Rollers
        </p>
      </div>

      <div>
        <a href="https://form.jotform.com/Claudinio/inscripcioneskids">
          <img src="/banner-kids.png" style={{borderRadius: "12px", width: "100%"}} />
        </a>
      </div>

      <div>
        <a href="https://form.jotform.com/Claudinio/Inscripciones2026">
          <img src="/banner-adultos.png" style={{borderRadius: "12px", width: "100%"}} />
        </a>
      </div>

      <div>
        <a href="https://puntarollerscard.com/">
          <img src="/banner-prcard.png" style={{borderRadius: "12px", width: "100%"}} />
        </a>
      </div>

      <div>
        <a href="https://rollermap.vercel.app/">
          <img src="/banner-rollermap.png" style={{borderRadius: "12px", width: "100%"}} />
        </a>
      </div>

      <div>
        <a href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0">
          <img src="/banner-alianza.png" style={{borderRadius: "12px", width: "100%"}} />
        </a>
      </div>

      <div style={{textAlign: "center"}}>
        <a href="https://www.instagram.com/alianzaroller" style={{color: "#aaa", fontSize: "14px"}}>
          Ver Instagram de Alianza
        </a>
      </div>

    </div>
  )
}
