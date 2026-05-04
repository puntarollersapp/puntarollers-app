import React from "react"


export default function Home() {
return (




  {/* HERO */}
  <div className="text-center space-y-2 animate-fade">
    <h1 className="text-2xl font-bold text-white">
      No es solo patinar, es pertenecer
    </h1>
    <p className="text-gray-400 text-sm">
      Bienvenido a Punta Rollers
    </p>
  </div>

  {/* INSCRIPCIONES */}
  <div className="space-y-4">

    <a
      href="https://form.jotform.com/Claudinio/inscripcioneskids"
      className="banner animate-fade"
    >
      <img src="/banner-kids.png" alt="Inscripciones Kids" />
    </a>

    <a
      href="https://form.jotform.com/Claudinio/Inscripciones2026"
      className="banner animate-fade delay-1"
    >
      <img src="/banner-adultos.png" alt="Inscripciones Adultos" />
    </a>

  </div>

  {/* PLATAFORMAS */}
  <div className="space-y-4">

    <a
      href="https://puntarollerscard.com/"
      className="banner animate-fade delay-2"
    >
      <img src="/banner-prcard.png" alt="PR Card" />
    </a>

    <a
      href="https://rollermap.vercel.app/"
      className="banner animate-fade delay-3"
    >
      <img src="/banner-rollermap.png" alt="RollerMap" />
    </a>

  </div>

  {/* ALIANZA */}
  <div className="space-y-4">

    <a
      href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0"
      className="banner animate-fade delay-4"
    >
      <img src="/banner-alianza.png" alt="Alianza Rollers" />
    </a>

    <a
      href="https://www.instagram.com/alianzaroller"
      className="animate-fade delay-5"
    >
      <div className="text-center text-sm text-gray-400 underline">
        Ver Instagram de Alianza
      </div>
    </a>

  </div>

</div>



)
}

