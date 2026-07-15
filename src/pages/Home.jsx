import React, {
  useEffect,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { getCupos } from '../data/cupos'
import { useAuth } from '../lib/auth'

export default function Home() {
  const { user } = useAuth()

  const [day, setDay] =
    useState('miercoles')

  const [cupos, setCupos] =
    useState(getCupos())

  const isLoggedIn = Boolean(user)

  const privateDestination =
    user?.role === 'admin' ||
    user?.role === 'profesor'
      ? '/admin'
      : '/app/dashboard'

  useEffect(() => {
    if (window.location.hash) {
      const id =
        window.location.hash.replace(
          '#',
          ''
        )

      setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({
            behavior: 'smooth',
          })
      }, 200)
    }
  }, [])

  return (
    <PublicLayout>
      <div className="px-4 py-8 space-y-14">
        <section className="text-center space-y-6 animate-fade-up">
          <h1 className="text-4xl font-bold leading-tight">
            No es solo patinar,
            <span className="block text-gold-gradient">
              es pertenecer.
            </span>
          </h1>

          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Escuela y comunidad de patín
            en línea en Punta del Este:
            clases, eventos, beneficios
            y evolución sobre ruedas.
          </p>

          {isLoggedIn && (
            <div className="pr-card p-4 text-left">
              <p className="section-label">
                Sesión iniciada
              </p>

              <p className="text-white font-semibold mt-1">
                Hola, {user.nombre}
              </p>

              <p className="text-white/35 text-xs mt-1">
                Podés recorrer la página
                pública sin cerrar tu
                sesión.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link
              to={
                isLoggedIn
                  ? privateDestination
                  : '/login'
              }
              className="btn-gold w-full"
            >
              {isLoggedIn
                ? 'Entrar a mi espacio'
                : 'Ingresar'}
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/app/perfil"
                  className="btn-ghost w-full"
                >
                  Ver mi perfil
                </Link>

                <Link
                  to="/app/actividad"
                  className="btn-ghost w-full"
                >
                  Ver mi actividad
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="btn-ghost w-full"
              >
                Acceso administrador
              </Link>
            )}
          </div>
        </section>

        <section className="space-y-4 animate-fade-up stagger-1">
          <p className="section-label text-center">
            Quiénes somos
          </p>

          <div className="glass p-6 rounded-2xl text-center space-y-3">
            <p className="text-xl font-semibold">
              🛼 Punta Rollers
            </p>

            <p className="text-gray-300 text-sm">
              Somos una escuela con 10
              años de experiencia
              acompañando a niños,
              adolescentes, adultos y
              adultos mayores en todo el
              proceso de aprendizaje.
            </p>

            <p className="text-gray-400 text-sm">
              Trabajamos con dos
              profesores en simultáneo,
              clases al aire libre, pista
              cerrada, salidas de calle,
              eventos y seguimiento
              personalizado.
            </p>

            <p className="text-gray-500 text-xs">
              Creada por Claudio Facelli
              junto al equipo PR. No es
              solo patinar: es pertenecer.
            </p>
          </div>
        </section>

        <section className="space-y-4 animate-fade-up stagger-2">
          <p className="section-label">
            Dónde estamos
          </p>

          <div className="grid gap-3">
            <div className="glass p-4 rounded-2xl">
              <p className="text-white font-semibold">
                📍 Parada 2
              </p>

              <p className="text-gray-400 text-sm">
                Punta del Este · Aire libre
              </p>
            </div>

            <div className="glass p-4 rounded-2xl">
              <p className="text-white font-semibold">
                🏟️ Pista cerrada
              </p>

              <p className="text-gray-400 text-sm">
                Maldonado · Clases indoor
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 animate-fade-up stagger-3">
          <p className="section-label">
            Horarios
          </p>

          <div className="flex gap-2 justify-center">
            <Tab
              active={
                day === 'miercoles'
              }
              onClick={() =>
                setDay('miercoles')
              }
            >
              Miércoles
            </Tab>

            <Tab
              active={day === 'sabado'}
              onClick={() =>
                setDay('sabado')
              }
            >
              Sábado
            </Tab>
          </div>

          {day === 'miercoles' && (
            <div className="space-y-3">
              <ScheduleCard
                title="Principiantes"
                time="19:00 - 20:00"
                cupos={`${cupos.miercoles.principiantes} disponibles`}
              />

              <ScheduleCard
                title="Avanzado"
                time="20:00 - 21:00"
                cupos={`${cupos.miercoles.avanzado} disponibles`}
              />
            </div>
          )}

          {day === 'sabado' && (
            <div className="space-y-3">
              <ScheduleCard
                title="PR Kids"
                time="19:00 - 20:00"
                cupos={`${cupos.sabado.kids} disponibles`}
              />

              <ScheduleCard
                title="Adultos"
                time="20:00 - 21:00"
                cupos={`${cupos.sabado.adultos} disponibles`}
              />
            </div>
          )}
        </section>

        <section
          id="inscripciones"
          className="space-y-4 animate-fade-up stagger-4"
        >
          <p className="section-label">
            Inscripciones
          </p>

          <a href="https://form.jotform.com/Claudinio/inscripcioneskids">
            <img
              src="/banner-kids.png"
              alt="Inscripciones PR Kids"
              className="rounded-xl"
            />
          </a>

          <a href="https://form.jotform.com/Claudinio/Inscripciones2026">
            <img
              src="/banner-adultos.png"
              alt="Inscripciones adultos"
              className="rounded-xl"
            />
          </a>
        </section>

        <section
          id="explorar"
          className="space-y-4 animate-fade-up stagger-5"
        >
          <p className="section-label">
            Explorar Punta Rollers
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Card
              link="/cuponeras"
              icon="🎟️"
              title="Cuponeras"
              subtitle="Cómo funcionan"
            />

            <Card
              link="/pasaporte-kids"
              icon="🧒"
              title="Pasaporte Kids"
              subtitle="Progreso infantil"
            />

            <Card
              link="/uniformes"
              icon="👕"
              title="Uniformes"
              subtitle="Remeras y buzos"
            />

            <Card
              link="/tracking"
              icon="🏷️"
              title="PR Tracking"
              subtitle="NFC y legitimidad"
            />

            <Link
              to="/terminos"
              className="glass p-4 rounded-2xl text-center col-span-2"
            >
              <p className="text-white font-semibold">
                📜 Reglas y condiciones
              </p>

              <p className="text-gray-400 text-xs">
                Funcionamiento del club
              </p>
            </Link>
          </div>
        </section>

        <section className="space-y-4 animate-fade-up stagger-6">
          <p className="section-label">
            Galería
          </p>

          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://drive.google.com/..."
              target="_blank"
              rel="noreferrer"
              className="glass p-4 rounded-2xl text-center"
            >
              <p className="text-white font-semibold">
                📸 Clases
              </p>

              <p className="text-gray-400 text-xs">
                Se actualiza luego de cada
                clase
              </p>
            </a>

            <a
              href="https://drive.google.com/..."
              target="_blank"
              rel="noreferrer"
              className="glass p-4 rounded-2xl text-center"
            >
              <p className="text-white font-semibold">
                🎉 Rolleadas
              </p>

              <p className="text-gray-400 text-xs">
                Eventos y salidas
              </p>
            </a>
          </div>
        </section>

        <section className="space-y-4 animate-fade-up">
          <p className="section-label">
            Plataformas PR
          </p>

          <a
            href="https://puntarollerscard.com/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/banner-prcard.png"
              alt="Punta Rollers Card"
              className="rounded-xl"
            />
          </a>

          <a
            href="https://rollermap.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/banner-rollermap.png"
              alt="RollerMap"
              className="rounded-xl"
            />
          </a>
        </section>

        <section className="space-y-4 animate-fade-up">
          <p className="section-label">
            Comunidad
          </p>

          <Link
            to="/alianza"
            className="glass p-4 rounded-2xl flex justify-between"
          >
            <div>
              <p className="text-white font-semibold">
                🛼 Alianza Rollers
              </p>

              <p className="text-gray-400 text-sm">
                Comunidad nacional en
                expansión
              </p>
            </div>

            <span className="text-gray-500">
              →
            </span>
          </Link>
        </section>
      </div>
    </PublicLayout>
  )
}

function ScheduleCard({
  title,
  time,
  cupos,
}) {
  return (
    <div className="glass p-4 rounded-2xl flex justify-between items-center">
      <div>
        <p className="text-white font-semibold">
          {title}
        </p>

        <p className="text-gray-400 text-sm">
          {time}
        </p>
      </div>

      <p className="text-green-400 text-xs">
        ● {cupos}
      </p>
    </div>
  )
}

function Tab({
  active,
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm ${
        active
          ? 'bg-pr-gold text-black'
          : 'glass text-gray-400'
      }`}
    >
      {children}
    </button>
  )
}

function Card({
  link,
  icon,
  title,
  subtitle,
}) {
  return (
    <Link
      to={link}
      className="glass p-4 rounded-2xl text-center"
    >
      <p className="text-xl">
        {icon}
      </p>

      <p className="text-white text-sm font-semibold">
        {title}
      </p>

      <p className="text-gray-400 text-xs">
        {subtitle}
      </p>
    </Link>
  )
}
