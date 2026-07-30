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

const QUICK_LINKS = [
  {
    to: '/cuponeras',
    eyebrow: 'Beneficios',
    title: 'Cuponeras',
    subtitle: 'Todo lo que incluye tu experiencia PR.',
    icon: 'ticket',
  },
  {
    to: '/pasaporte-kids',
    eyebrow: 'PR Kids',
    title: 'Pasaporte Kids',
    subtitle: 'Progreso, logros y recorrido infantil.',
    icon: 'passport',
  },
  {
    to: '/uniformes',
    eyebrow: 'Identidad',
    title: 'Uniformes',
    subtitle: 'Remeras y buzos oficiales.',
    icon: 'shirt',
  },
  {
    to: '/tracking',
    eyebrow: 'Seguridad',
    title: 'PR Tracking',
    subtitle: 'Tecnología NFC para tus elementos.',
    icon: 'tracking',
  },
]

export default function Home() {
  const { user } = useAuth()
  const [day, setDay] = useState('miercoles')
  const [cupos, setCupos] = useState(getCupos())

  const isLoggedIn = Boolean(user)
  const isStaff =
    user?.role === 'admin' || user?.role === 'profesor'
  const privateDestination = isStaff
    ? '/admin'
    : '/app/dashboard'

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '')

      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
        })
      }, 200)
    }
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
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] overflow-hidden">
          <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-blue-700/20 blur-[100px]" />
          <div className="absolute -right-32 top-48 h-80 w-80 rounded-full bg-orange-500/10 blur-[110px]" />
          <div className="absolute left-1/2 top-0 h-px w-[88%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl space-y-20 px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <section className="animate-fade-up">
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#080d1a]/95 px-5 pb-6 pt-5 shadow-[0_32px_100px_rgba(0,0,0,0.45)] sm:px-8 sm:pb-8 sm:pt-7 lg:px-12 lg:py-11">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_12%_88%,rgba(37,99,235,0.2),transparent_34%)]" />
              <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full border border-orange-400/15" />
              <div className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 rounded-full border border-white/10" />

              <div className="relative grid items-end gap-8 lg:grid-cols-[1.2fr_.8fr]">
                <div>
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg">
                        <img
                          src="/logo.png"
                          alt="Punta Rollers"
                          className="h-full w-full object-contain p-1.5"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300/80">
                          PuntaRollers.app
                        </p>
                        <p className="mt-0.5 text-xs text-white/40">
                          Escuela · Comunidad · Evolución
                        </p>
                      </div>
                    </div>
                    <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:inline-flex">
                      Punta del Este · Uruguay
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
                    10 años sobre ruedas
                  </span>

                  <h1 className="mt-5 max-w-3xl text-[42px] font-extrabold leading-[0.95] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
                    No es solo patinar,
                    <span className="mt-2 block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300 bg-clip-text text-transparent">
                      es pertenecer.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                    Escuela y comunidad de patín en línea. Clases,
                    eventos, beneficios y evolución deportiva en un
                    mismo ecosistema.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={isLoggedIn ? privateDestination : '/login'}
                      className="group inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-orange-500 px-5 text-sm font-extrabold text-[#07101f] shadow-[0_16px_40px_rgba(249,115,22,0.22)] transition duration-200 hover:bg-orange-400 active:scale-[0.98] sm:min-w-[210px]"
                    >
                      {isLoggedIn
                        ? 'Entrar a mi espacio'
                        : 'Ingresar a Punta Rollers'}
                      <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <a
                      href="#inscripciones"
                      className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-5 text-sm font-bold text-white/85 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.98] sm:min-w-[180px]"
                    >
                      Ver clases
                      <Icon name="calendar" className="h-4 w-4 text-white/50" />
                    </a>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <MetricCard value="10" label="años de experiencia" />
                  <MetricCard value="2" label="sedes activas" />
                  <MetricCard value="360°" label="experiencia PR" />
                </div>
              </div>
            </div>
          </section>

          {isLoggedIn && (
            <section className="animate-fade-up stagger-1">
              <SectionHeading
                eyebrow="Tu espacio"
                title={`Hola, ${user.nombre}`}
                description="Tu sesión sigue activa mientras recorrés la experiencia pública de Punta Rollers."
              />

              <div className="mt-5 overflow-hidden rounded-[28px] border border-blue-400/15 bg-gradient-to-br from-blue-950/80 via-[#0b1425] to-[#0a0d15] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-blue-300/15 bg-blue-400/10 text-blue-200">
                      <Icon name="user" className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/60">
                        Sesión iniciada
                      </p>
                      <p className="mt-1 truncate text-lg font-bold text-white">
                        {user.nombre}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {isStaff
                          ? 'Acceso de administración y gestión habilitado.'
                          : 'Tu perfil, actividad y comunidad están disponibles.'}
                      </p>
                    </div>
                  </div>
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <PrivateAccessLink
                    to={privateDestination}
                    icon={isStaff ? 'settings' : 'home'}
                    title={isStaff ? 'Administración' : 'Mi espacio'}
                    subtitle={isStaff ? 'Gestionar Punta Rollers' : 'Ir al dashboard'}
                    featured
                  />
                  <PrivateAccessLink
                    to="/app/perfil"
                    icon="user"
                    title="Mi perfil"
                    subtitle="Identidad y progreso"
                  />
                  <PrivateAccessLink
                    to="/app/actividad"
                    icon="activity"
                    title="Actividad"
                    subtitle="Tu recorrido deportivo"
                  />
                </div>

                <Link
                  to="/app/comunidad"
                  className="group mt-3 flex items-center gap-4 rounded-2xl border border-sky-300/15 bg-sky-400/[0.07] p-4 transition hover:bg-sky-400/[0.11] active:scale-[0.99]"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-300/10 text-sky-200">
                    <Icon name="community" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">
                      Entrar a Comunidad
                    </p>
                    <p className="mt-0.5 text-xs text-white/40">
                      Amigos, solicitudes y personas de Punta Rollers.
                    </p>
                  </div>
                  <Icon name="arrow" className="h-4 w-4 text-sky-200/70 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </section>
          )}

          <section className="animate-fade-up stagger-1">
            <SectionHeading
              eyebrow="Quiénes somos"
              title="Una escuela. Una comunidad."
              description="Aprender, avanzar y compartir el camino sobre ruedas."
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-blue-600/[0.08]" />
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-300/15 bg-orange-400/10 text-orange-300">
                    <Icon name="skate" className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">
                    Punta Rollers acompaña cada etapa de tu evolución.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/55">
                    Somos una escuela con 10 años de experiencia
                    acompañando a niños, adolescentes, adultos y adultos
                    mayores en todo el proceso de aprendizaje.
                  </p>
                  <p className="mt-4 text-sm leading-7 text-white/45">
                    Trabajamos con dos profesores en simultáneo, clases al
                    aire libre, pista cerrada, salidas de calle, eventos,
                    entrenamientos competitivos y clases personalizadas
                    para todos los niveles y edades.
                  </p>
                </div>
              </article>

              <div className="grid gap-4">
                <InfoCard
                  icon="team"
                  eyebrow="Equipo PR"
                  title="Personas que sostienen la experiencia"
                >
                  Creada y dirigida por Claudio Facelli, acompañado por
                  David Almeida, profesor, y Lucía Bernales, tesorera y
                  administrativa.
                </InfoCard>
                <InfoCard
                  icon="spark"
                  eyebrow="Nuestra identidad"
                  title="Más que una clase"
                >
                  Técnica, comunidad, desafíos y recuerdos compartidos.
                  No es solo patinar: es pertenecer.
                </InfoCard>
              </div>
            </div>
          </section>

          <section className="animate-fade-up stagger-2">
            <SectionHeading
              eyebrow="Dónde estamos"
              title="Dos espacios, una misma energía."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <LocationCard
                icon="pin"
                type="Aire libre"
                title="Parada 2"
                location="Punta del Este"
                detail="Clases junto al mar y experiencia urbana."
              />
              <LocationCard
                icon="arena"
                type="Indoor"
                title="Pista cerrada"
                location="Maldonado"
                detail="Entrenamiento protegido y grupos organizados."
              />
            </div>
          </section>

          <section className="animate-fade-up stagger-3">
            <SectionHeading
              eyebrow="Horarios y cupos"
              title="Elegí tu momento para rodar."
              description="Los cupos disponibles se actualizan desde Administración."
            />

            <div className="mt-5 rounded-[28px] border border-white/10 bg-[#0b101c]/90 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-6">
              <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/25 p-1.5">
                <Tab
                  active={day === 'miercoles'}
                  onClick={() => setDay('miercoles')}
                >
                  Miércoles
                </Tab>
                <Tab
                  active={day === 'sabado'}
                  onClick={() => setDay('sabado')}
                >
                  Sábado
                </Tab>
              </div>

              <div className="mt-4 space-y-3">
                {day === 'miercoles' && (
                  <ScheduleCard
                    title="Clases mixtas"
                    detail="Principiantes, intermedios y avanzados"
                    time="19:30 - 20:30"
                    location="Parada 2 · Aire libre"
                    cupos={`${cupos.miercoles.principiantes} disponibles`}
                  />
                )}

                {day === 'sabado' && (
                  <>
                    <ScheduleCard
                      title="Adultos mixtos"
                      detail="Clase al aire libre"
                      time="09:00 - 10:00"
                      location="Parada 2 · Punta del Este"
                      cupos={`${cupos.miercoles.avanzado} disponibles`}
                    />
                    <ScheduleCard
                      title="PR Kids"
                      detail="Pista cerrada"
                      time="19:00 - 20:00"
                      location="Maldonado · Indoor"
                      cupos={`${cupos.sabado.kids} disponibles`}
                    />
                    <ScheduleCard
                      title="Adultos mixtos"
                      detail="Pista cerrada"
                      time="20:00 - 21:00"
                      location="Maldonado · Indoor"
                      cupos={`${cupos.sabado.adultos} disponibles`}
                    />
                  </>
                )}
              </div>
            </div>
          </section>

          <section
            id="inscripciones"
            className="scroll-mt-8 animate-fade-up stagger-4"
          >
            <SectionHeading
              eyebrow="Inscripciones"
              title="Tu próxima vuelta empieza acá."
              description="Elegí el grupo correcto y completá tu inscripción oficial."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <BannerLink
                href="https://form.jotform.com/Claudinio/inscripcioneskids"
                image="/banner-kids.png"
                alt="Inscripciones PR Kids"
                label="Inscripciones PR Kids"
              />
              <BannerLink
                href="https://form.jotform.com/Claudinio/Inscripciones2026"
                image="/banner-adultos.png"
                alt="Inscripciones adultos"
                label="Inscripciones adultos"
              />
            </div>
          </section>

          <section
            id="explorar"
            className="scroll-mt-8 animate-fade-up stagger-5"
          >
            <SectionHeading
              eyebrow="Explorar Punta Rollers"
              title="Todo el universo PR, conectado."
              description="Servicios, identidad, progreso y seguridad en un solo lugar."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {QUICK_LINKS.map((item, index) => (
                <ExploreCard key={item.to} {...item} index={index} />
              ))}

              <Link
                to="/terminos"
                className="group flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-300/20 hover:bg-white/[0.05] active:scale-[0.99] sm:col-span-2"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/65">
                  <Icon name="document" className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-white/35">
                    Información importante
                  </p>
                  <p className="mt-1 text-base font-bold text-white">
                    Reglas y condiciones
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Conocé el funcionamiento del club.
                  </p>
                </div>
                <Icon name="arrow" className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-orange-300" />
              </Link>
            </div>
          </section>

          <section className="animate-fade-up stagger-6">
            <SectionHeading
              eyebrow="Galería"
              title="Momentos que quedan."
              description="Clases, rolleadas y contenido de nuestra comunidad."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <GalleryCard
                href={GALLERY_LINKS.clases}
                icon="camera"
                number="01"
                title="Clases"
                subtitle="Fotos de cada jornada"
              />
              <GalleryCard
                href={GALLERY_LINKS.rolleadas}
                icon="celebration"
                number="02"
                title="Rolleadas"
                subtitle="Eventos y salidas"
              />
              <GalleryCard
                href={GALLERY_LINKS.contenido}
                icon="video"
                number="03"
                title="Contenido"
                subtitle="Material de Punta Rollers"
                className="sm:col-span-2"
                wide
              />
            </div>
          </section>

          <section className="animate-fade-up">
            <SectionHeading
              eyebrow="Plataformas PR"
              title="La experiencia sigue fuera de la pista."
              description="Herramientas propias creadas para ampliar la comunidad Punta Rollers."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <BannerLink
                href="https://puntarollerscard.com/"
                image="/banner-prcard.png"
                alt="Punta Rollers Card"
                label="Punta Rollers Card"
                external
              />
              <BannerLink
                href="https://rollermap.vercel.app/"
                image="/banner-rollermap.png"
                alt="RollerMap"
                label="RollerMap"
                external
              />
            </div>
          </section>

          <section className="animate-fade-up">
            <div className="relative overflow-hidden rounded-[30px] border border-blue-400/15 bg-gradient-to-br from-[#0c1830] via-[#0a1221] to-[#080b12] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.38)] sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
              <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.21em] text-blue-300/60">
                    Comunidad
                  </p>
                  <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
                    Alianza Rollers
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
                    Una comunidad nacional en expansión, conectando
                    personas, escuelas e iniciativas sobre ruedas.
                  </p>
                </div>

                <Link
                  to="/alianza"
                  className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-2xl border border-blue-300/20 bg-blue-400/10 px-5 text-sm font-bold text-blue-100 transition hover:bg-blue-400/15 active:scale-[0.98]"
                >
                  Conocer Alianza
                  <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300/65">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-white/42">
          {description}
        </p>
      )}
    </div>
  )
}

function MetricCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <p className="text-2xl font-extrabold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
    </div>
  )
}

function PrivateAccessLink({ to, icon, title, subtitle, featured = false }) {
  return (
    <Link
      to={to}
      className={`group rounded-2xl border p-4 transition active:scale-[0.98] ${
        featured
          ? 'border-orange-300/20 bg-orange-400/10 hover:bg-orange-400/15'
          : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'
      }`}
    >
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl ${
          featured
            ? 'bg-orange-400/15 text-orange-200'
            : 'bg-white/[0.05] text-white/65'
        }`}
      >
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-[11px] text-white/35">{subtitle}</p>
    </Link>
  )
}

function InfoCard({ icon, eyebrow, title, children }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-300/10 bg-blue-400/[0.07] text-blue-200">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300/50">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-bold leading-tight text-white">
            {title}
          </h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/45">{children}</p>
    </article>
  )
}

function LocationCard({ icon, type, title, location, detail }) {
  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-blue-300/20 hover:bg-white/[0.045] sm:p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/[0.07] blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-300/10 bg-blue-400/[0.08] text-blue-200">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.17em] text-white/40">
          {type}
        </span>
      </div>
      <h3 className="relative mt-5 text-2xl font-bold text-white">
        {title}
      </h3>
      <p className="relative mt-1 text-sm font-semibold text-orange-300/80">
        {location}
      </p>
      <p className="relative mt-3 text-xs leading-5 text-white/40">
        {detail}
      </p>
    </article>
  )
}

function ScheduleCard({ title, detail, time, location, cupos }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-bold text-white">{title}</p>
          {detail && (
            <p className="mt-1 text-xs text-white/38">{detail}</p>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {cupos}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-[11px] font-semibold text-white/65">
          <Icon name="clock" className="h-3.5 w-3.5 text-orange-300/70" />
          {time}
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-[11px] font-semibold text-white/45">
          <Icon name="pin" className="h-3.5 w-3.5 text-blue-300/70" />
          {location}
        </span>
      </div>
    </article>
  )
}

function Tab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] rounded-xl px-4 text-sm font-bold transition ${
        active
          ? 'bg-orange-500 text-[#07101f] shadow-[0_10px_25px_rgba(249,115,22,0.2)]'
          : 'text-white/40 hover:text-white/70'
      }`}
    >
      {children}
    </button>
  )
}

function BannerLink({ href, image, alt, label, external = false }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="group relative block overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.025] shadow-[0_20px_55px_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5 hover:border-orange-300/20 active:scale-[0.99]"
    >
      <img
        src={image}
        alt={alt}
        className="aspect-[16/7] w-full object-cover transition duration-500 group-hover:scale-[1.025]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      <span className="sr-only">{label}</span>
    </a>
  )
}

function ExploreCard({ to, icon, eyebrow, title, subtitle, index }) {
  return (
    <Link
      to={to}
      className="group relative min-h-[184px] overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-orange-300/20 hover:bg-white/[0.045] active:scale-[0.99]"
    >
      <span className="absolute right-4 top-3 text-5xl font-extrabold text-white/[0.025]">
        0{index + 1}
      </span>
      <div className="relative flex h-full flex-col">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-300/10 bg-orange-400/[0.08] text-orange-200">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div className="mt-auto pt-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300/55">
            {eyebrow}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <Icon name="arrow" className="h-4 w-4 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-orange-300" />
          </div>
          <p className="mt-2 text-xs leading-5 text-white/38">
            {subtitle}
          </p>
        </div>
      </div>
    </Link>
  )
}

function GalleryCard({ href, icon, number, title, subtitle, className = '', wide = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`group relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0b101b] p-5 transition hover:border-blue-300/20 hover:bg-[#0d1422] active:scale-[0.99] ${className}`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/[0.08] blur-2xl" />
      <div className={`relative ${wide ? 'sm:flex sm:items-center sm:justify-between' : ''}`}>
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-300/10 bg-blue-400/[0.08] text-blue-200">
              <Icon name={icon} className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/20">
              {number}
            </span>
          </div>
          <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs text-white/38">{subtitle}</p>
        </div>
        {wide && (
          <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-blue-200/70 sm:mt-0">
            Abrir galería
            <Icon name="external" className="h-4 w-4" />
          </div>
        )}
      </div>
    </a>
  )
}

function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-2.12 2.12-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21h-3v-.61A1.8 1.8 0 0 0 10.4 18.7a1.8 1.8 0 0 0-1.98.36l-.06.06-2.12-2.12.06-.06A1.8 1.8 0 0 0 6.66 15a1.8 1.8 0 0 0-1.65-1.1H4v-3h.61A1.8 1.8 0 0 0 6.3 9.8a1.8 1.8 0 0 0-.36-1.98l-.06-.06L8 5.64l.06.06a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 11.1 4.4V4h3v.61a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06 2.12 2.12-.06.06a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.65 1.1H21v3h-.61A1.8 1.8 0 0 0 19.4 15Z" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
    community: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 5" />
      </>
    ),
    skate: (
      <>
        <path d="M4 14h11a4 4 0 0 0 4-4V7h-6l-2-3H7v7H4a2 2 0 0 0 0 4Z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="16" cy="18" r="2" />
      </>
    ),
    team: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 8 4" />
      </>
    ),
    spark: <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    arena: (
      <>
        <path d="M3 20V9l9-5 9 5v11" />
        <path d="M7 20v-7h10v7M3 9h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    ticket: <path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4V7ZM13 7v10" />,
    passport: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="11" r="3" />
        <path d="M9 11h6M12 8v6M9 17h6" />
      </>
    ),
    shirt: <path d="m8 4-5 3 2 5 3-1v10h8V11l3 1 2-5-5-3a4 4 0 0 1-8 0Z" />,
    tracking: (
      <>
        <path d="M12 3a9 9 0 0 0-9 9M12 21a9 9 0 0 0 9-9" />
        <path d="M12 7a5 5 0 0 0-5 5M12 17a5 5 0 0 0 5-5" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h9l4 4v14H6V3Z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    camera: (
      <>
        <path d="M4 7h3l2-3h6l2 3h3v13H4V7Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    celebration: <path d="m4 20 4-14 10 10-14 4ZM9 8l7-4M13 12l7-2M16 15l4 3" />,
    video: (
      <>
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="m17 10 4-2v8l-4-2v-4Z" />
      </>
    ),
    external: <path d="M14 4h6v6M20 4l-9 9M19 13v7H4V5h7" />,
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.arrow}
    </svg>
  )
}
