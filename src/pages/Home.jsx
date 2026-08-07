import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { getCupos } from '../data/cupos'
import { useAuth } from '../lib/auth'

const GALLERY_LINKS = {
  clases:
    'https://drive.google.com/drive/folders/1Bn4Yy6IDiy8lJYyKf12z99Qyx5GllSST',
  rolleadas:
    'https://drive.google.com/drive/folders/1b7I4VFk36V9CTcXsCJDogcD8ayC1WIfJ',
  contenido:
    'https://drive.google.com/drive/folders/1hnBU-O1sjZC88O6EqMa_1dKAE5HybkW_',
}

const EXPLORE_LINKS = [
  {
    to: '/cuponeras',
    kicker: 'Beneficios',
    title: 'Cuponeras',
    description: 'Cómo funcionan tus clases personalizadas y beneficios PR.',
  },
  {
    to: '/pasaporte-kids',
    kicker: 'PR Kids',
    title: 'Pasaporte Kids',
    description: 'Un recorrido pensado para acompañar cada logro de los más chicos.',
  },
  {
    to: '/uniformes',
    kicker: 'Identidad',
    title: 'Uniformes',
    description: 'Remeras y buzos oficiales para sentirte parte dentro y fuera de pista.',
  },
  {
    to: '/tracking',
    kicker: 'Tecnología',
    title: 'PR Tracking',
    description: 'Identificación NFC para patines, cascos y elementos personales.',
  },
]

export default function Home() {
  const { user } = useAuth()
  const [day, setDay] = useState('miercoles')
  const [cupos, setCupos] = useState(getCupos())

  const isLoggedIn = Boolean(user)
  const isStaff = user?.role === 'admin' || user?.role === 'profesor'
  const privateDestination = isStaff ? '/admin' : '/app/dashboard'

  useEffect(() => {
    if (!window.location.hash) return

    const id = window.location.hash.replace('#', '')
    const timeoutId = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 200)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const refreshCupos = () => setCupos(getCupos())

    window.addEventListener('focus', refreshCupos)
    window.addEventListener('storage', refreshCupos)

    return () => {
      window.removeEventListener('focus', refreshCupos)
      window.removeEventListener('storage', refreshCupos)
    }
  }, [])

  return (
    <PublicLayout>
      <main className="overflow-hidden bg-[#090a0d] text-white">
        <Hero
          isLoggedIn={isLoggedIn}
          privateDestination={privateDestination}
        />

        {isLoggedIn && (
          <LoggedInStrip
            user={user}
            isStaff={isStaff}
            privateDestination={privateDestination}
          />
        )}

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <section className="border-b border-white/10 py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <SectionLead
                eyebrow="Quiénes somos"
                title="Una escuela que se convirtió en comunidad."
              />

              <div className="space-y-6 text-[15px] leading-7 text-white/55 sm:text-base sm:leading-8">
                <p className="text-white/80">
                  Punta Rollers lleva 10 años acompañando a niños, adolescentes,
                  adultos y adultos mayores en todo su proceso de aprendizaje.
                </p>
                <p>
                  Entrenamos con dos profesores en simultáneo, clases al aire libre,
                  pista cerrada, salidas de calle, eventos, preparación competitiva y
                  clases personalizadas para todos los niveles.
                </p>
                <div className="grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
                  <EditorialFact
                    number="01"
                    title="Equipo PR"
                    text="Claudio Facelli, David Almeida y Lucía Bernales sostienen la experiencia deportiva y humana de la escuela."
                  />
                  <EditorialFact
                    number="02"
                    title="Nuestra identidad"
                    text="Técnica, pertenencia, evolución y recuerdos compartidos. No es solo patinar: es pertenecer."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-white/10 py-16 sm:py-20">
            <SectionHeader
              eyebrow="Dónde estamos"
              title="Dos espacios. La misma energía."
              description="Elegimos cada espacio según la experiencia y el tipo de entrenamiento."
            />

            <div className="mt-9 divide-y divide-white/10 border-y border-white/10">
              <LocationRow
                index="01"
                title="Parada 2"
                city="Punta del Este"
                type="Aire libre"
                description="Clases junto al mar, salidas de calle y entrenamiento urbano."
              />
              <LocationRow
                index="02"
                title="Pista cerrada"
                city="Maldonado"
                type="Indoor"
                description="Entrenamientos organizados, PR Kids y grupos de adultos en un entorno protegido."
              />
            </div>
          </section>

          <section className="border-b border-white/10 py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <SectionLead
                eyebrow="Horarios y cupos"
                title="Elegí cuándo salir a rodar."
                description="Los cupos se actualizan desde Administración."
              />

              <div>
                <div className="mb-7 flex gap-6 border-b border-white/10">
                  <DayTab
                    active={day === 'miercoles'}
                    onClick={() => setDay('miercoles')}
                  >
                    Miércoles
                  </DayTab>
                  <DayTab
                    active={day === 'sabado'}
                    onClick={() => setDay('sabado')}
                  >
                    Sábado
                  </DayTab>
                </div>

                <div className="divide-y divide-white/10">
                  {day === 'miercoles' && (
                    <ScheduleRow
                      title="Clases mixtas"
                      detail="Principiantes, intermedios y avanzados"
                      time="19:30 — 20:30"
                      location="Parada 2 · Aire libre"
                      cupos={`${cupos.miercoles.principiantes} disponibles`}
                    />
                  )}

                  {day === 'sabado' && (
                    <>
                      <ScheduleRow
                        title="Adultos mixtos"
                        detail="Clase al aire libre"
                        time="09:00 — 10:00"
                        location="Parada 2 · Punta del Este"
                        cupos={`${cupos.miercoles.avanzado} disponibles`}
                      />
                      <ScheduleRow
                        title="PR Kids"
                        detail="Pista cerrada"
                        time="19:00 — 20:00"
                        location="Maldonado · Indoor"
                        cupos={`${cupos.sabado.kids} disponibles`}
                      />
                      <ScheduleRow
                        title="Adultos mixtos"
                        detail="Pista cerrada"
                        time="20:00 — 21:00"
                        location="Maldonado · Indoor"
                        cupos={`${cupos.sabado.adultos} disponibles`}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section
            id="inscripciones"
            className="scroll-mt-8 border-b border-white/10 py-16 sm:py-20"
          >
            <SectionHeader
              eyebrow="Inscripciones"
              title="Tu próxima vuelta empieza acá."
              description="Elegí el grupo y completá tu inscripción oficial."
            />

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <ImageLink
                href="https://form.jotform.com/Claudinio/inscripcioneskids"
                image="/banner-kids.png"
                alt="Inscripciones PR Kids"
                label="PR Kids"
              />
              <ImageLink
                href="https://form.jotform.com/Claudinio/Inscripciones2026"
                image="/banner-adultos.png"
                alt="Inscripciones adultos"
                label="Adultos"
              />
            </div>
          </section>

          <section
            id="explorar"
            className="scroll-mt-8 border-b border-white/10 py-16 sm:py-20"
          >
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <SectionLead
                eyebrow="Explorar Punta Rollers"
                title="Todo lo que acompaña a la pista."
                description="Beneficios, identidad, tecnología y progreso."
              />

              <div className="divide-y divide-white/10 border-y border-white/10">
                {EXPLORE_LINKS.map((item, index) => (
                  <ExploreRow key={item.to} item={item} index={index + 1} />
                ))}
                <Link
                  to="/terminos"
                  className="group grid gap-3 py-6 transition sm:grid-cols-[70px_1fr_auto] sm:items-center"
                >
                  <span className="text-xs font-bold tracking-[0.22em] text-white/20">
                    05
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/60">
                      Información
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-white">
                      Reglas y condiciones
                    </h3>
                    <p className="mt-1 text-sm text-white/38">
                      Funcionamiento general del club y sus servicios.
                    </p>
                  </div>
                  <span className="hidden text-2xl text-white/20 transition group-hover:translate-x-1 group-hover:text-orange-300 sm:block">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </section>

          <section className="border-b border-white/10 py-16 sm:py-20">
            <SectionHeader
              eyebrow="Galería"
              title="Lo que pasa sobre ruedas también queda."
              description="Clases, rolleadas y contenido de nuestra comunidad."
            />

            <div className="mt-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
              <GalleryLink
                href={GALLERY_LINKS.clases}
                number="01"
                title="Clases"
                subtitle="Fotos de cada jornada"
              />
              <GalleryLink
                href={GALLERY_LINKS.rolleadas}
                number="02"
                title="Rolleadas"
                subtitle="Eventos y salidas"
              />
              <GalleryLink
                href={GALLERY_LINKS.contenido}
                number="03"
                title="Contenido"
                subtitle="Material Punta Rollers"
              />
            </div>
          </section>

          <section className="border-b border-white/10 py-16 sm:py-20">
            <SectionHeader
              eyebrow="Plataformas PR"
              title="La experiencia sigue fuera de esta pantalla."
            />

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <ImageLink
                href="https://puntarollerscard.com/"
                image="/banner-prcard.png"
                alt="Punta Rollers Card"
                label="Punta Rollers Card"
                external
              />
              <ImageLink
                href="https://rollermap.vercel.app/"
                image="/banner-rollermap.png"
                alt="RollerMap"
                label="RollerMap"
                external
              />
            </div>
          </section>

          <section className="py-16 sm:py-20">
            <div className="grid overflow-hidden border-y border-white/10 lg:grid-cols-[1.1fr_.9fr]">
              <div className="py-9 lg:border-r lg:border-white/10 lg:pr-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300/70">
                  Comunidad
                </p>
                <h2 className="mt-3 max-w-xl text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-5xl">
                  El patín también se construye con gente alrededor.
                </h2>
              </div>

              <div className="border-t border-white/10 py-9 lg:border-t-0 lg:pl-12">
                <p className="max-w-md text-sm leading-7 text-white/45">
                  Alianza Rollers conecta la comunidad y amplía el movimiento a nivel nacional.
                </p>
                <Link
                  to="/alianza"
                  className="group mt-7 inline-flex items-center gap-3 text-sm font-bold text-orange-300"
                >
                  Conocer Alianza Rollers
                  <span className="transition group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}

function Hero({ isLoggedIn, privateDestination }) {
  return (
    <section className="relative border-b border-white/10 bg-[#07090d]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-12%] top-[-16%] h-[520px] w-[520px] rounded-full bg-orange-500/[0.10] blur-[130px]" />
        <div className="absolute bottom-[-35%] left-[-12%] h-[480px] w-[480px] rounded-full bg-blue-600/[0.12] blur-[140px]" />
      </div>

      <div className="relative mx-auto grid min-h-[620px] w-full max-w-6xl content-between px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:min-h-[680px] lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Punta Rollers"
              className="h-11 w-11 rounded-xl object-contain"
            />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-white">
                Punta Rollers
              </p>
              <p className="mt-0.5 text-[10px] text-white/35">
                Punta del Este · Uruguay
              </p>
            </div>
          </div>

          <Link
            to={isLoggedIn ? privateDestination : '/login'}
            className="text-xs font-bold text-white/60 transition hover:text-orange-300"
          >
            {isLoggedIn ? 'Mi espacio →' : 'Ingresar →'}
          </Link>
        </div>

        <div className="max-w-4xl pb-4 pt-20 sm:pt-28">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-12 bg-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
              10 años sobre ruedas
            </span>
          </div>

          <h1 className="text-[54px] font-extrabold leading-[0.86] tracking-[-0.055em] text-white sm:text-7xl lg:text-[96px]">
            No es solo
            <span className="block text-orange-400">patinar.</span>
            <span className="block text-white/95">Es pertenecer.</span>
          </h1>

          <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              Escuela, comunidad, evolución deportiva, eventos y beneficios.
              Todo Punta Rollers en un mismo lugar.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={isLoggedIn ? privateDestination : '/login'}
                className="inline-flex min-h-[52px] items-center justify-center bg-orange-500 px-6 text-sm font-black text-black transition hover:bg-orange-400 active:scale-[0.98]"
              >
                {isLoggedIn ? 'Entrar a mi espacio' : 'Ingresar a Punta Rollers'}
              </Link>
              <a
                href="#inscripciones"
                className="inline-flex min-h-[52px] items-center justify-center border border-white/15 px-6 text-sm font-bold text-white/75 transition hover:border-white/30 hover:text-white"
              >
                Ver clases
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 pt-5 text-left">
          <HeroStat value="10+" label="años" />
          <HeroStat value="2" label="sedes" />
          <HeroStat value="1" label="comunidad" />
        </div>
      </div>
    </section>
  )
}

function HeroStat({ value, label }) {
  return (
    <div>
      <p className="text-2xl font-extrabold text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
        {label}
      </p>
    </div>
  )
}

function LoggedInStrip({ user, isStaff, privateDestination }) {
  return (
    <section className="border-b border-white/10 bg-[#0d0f14]">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/65">
            Sesión iniciada
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">Hola, {user.nombre}</h2>
          <p className="mt-1 text-xs text-white/35">
            {isStaff
              ? 'Tu panel de administración está disponible.'
              : 'Tu perfil, actividad y comunidad están a un toque.'}
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-white/55">
          <Link className="hover:text-orange-300" to={privateDestination}>
            {isStaff ? 'Administración' : 'Mi espacio'} →
          </Link>
          <Link className="hover:text-orange-300" to="/app/perfil">
            Perfil →
          </Link>
          <Link className="hover:text-orange-300" to="/app/actividad">
            Actividad →
          </Link>
          <Link className="hover:text-sky-300" to="/app/comunidad">
            Comunidad →
          </Link>
        </nav>
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[10px] font-black uppercase tracking-[0.23em] text-orange-300/65">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40">
          {description}
        </p>
      )}
    </div>
  )
}

function SectionLead({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.23em] text-orange-300/65">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-4xl font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-7 text-white/38">{description}</p>
      )}
    </div>
  )
}

function EditorialFact({ number, title, text }) {
  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.2em] text-orange-300/50">
        {number}
      </p>
      <h3 className="mt-2 text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/38">{text}</p>
    </div>
  )
}

function LocationRow({ index, title, city, type, description }) {
  return (
    <article className="grid gap-4 py-7 sm:grid-cols-[70px_1fr_auto] sm:items-center">
      <span className="text-xs font-bold tracking-[0.2em] text-white/18">{index}</span>
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <span className="text-xs font-bold uppercase tracking-[0.13em] text-orange-300/65">
            {type}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-white/50">{city}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">{description}</p>
      </div>
      <span className="hidden text-3xl text-white/10 sm:block">↗</span>
    </article>
  )
}

function DayTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative pb-3 text-sm font-bold transition ${
        active ? 'text-white' : 'text-white/30 hover:text-white/55'
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-orange-400" />}
    </button>
  )
}

function ScheduleRow({ title, detail, time, location, cupos }) {
  return (
    <article className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/35">{detail}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-white/45">
          <span>{time}</span>
          <span className="text-white/18">•</span>
          <span>{location}</span>
        </div>
      </div>
      <div className="sm:text-right">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {cupos}
        </span>
      </div>
    </article>
  )
}

function ImageLink({ href, image, alt, label, external = true }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="group relative block overflow-hidden border border-white/10 bg-[#0d1016]"
    >
      <img
        src={image}
        alt={alt}
        className="aspect-[16/7] w-full object-cover transition duration-500 group-hover:scale-[1.015]"
      />
      <span className="sr-only">{label}</span>
    </a>
  )
}

function ExploreRow({ item, index }) {
  return (
    <Link
      to={item.to}
      className="group grid gap-3 py-6 transition sm:grid-cols-[70px_1fr_auto] sm:items-center"
    >
      <span className="text-xs font-bold tracking-[0.22em] text-white/20">
        {String(index).padStart(2, '0')}
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/60">
          {item.kicker}
        </p>
        <h3 className="mt-1 text-xl font-bold text-white">{item.title}</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-white/38">
          {item.description}
        </p>
      </div>
      <span className="hidden text-2xl text-white/20 transition group-hover:translate-x-1 group-hover:text-orange-300 sm:block">
        →
      </span>
    </Link>
  )
}

function GalleryLink({ href, number, title, subtitle }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group min-h-[210px] bg-[#0b0d11] p-6 transition hover:bg-[#10131a] sm:min-h-[245px]"
    >
      <div className="flex h-full flex-col justify-between">
        <span className="text-xs font-bold tracking-[0.2em] text-white/18">{number}</span>
        <div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="text-sm text-white/35">{subtitle}</p>
            <span className="text-xl text-white/20 transition group-hover:translate-x-1 group-hover:text-orange-300">
              ↗
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
