import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { getCupos } from '../data/cupos'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const GALLERY_LINKS = {
  clases: 'https://drive.google.com/drive/folders/1Bn4Yy6IDiy8lJYyKf12z99Qyx5GllSST',
  rolleadas: 'https://drive.google.com/drive/folders/1b7I4VFk36V9CTcXsCJDogcD8ayC1WIfJ',
  contenido: 'https://drive.google.com/drive/folders/1hnBU-O1sjZC88O6EqMa_1dKAE5HybkW_',
}

const DEFAULT_EVENTS = [
  {
    titulo: 'Primera Clínica de Patinaje con Miguel Flores',
    inicio: '2026-09-04T03:00:00.000Z',
    mes_referencia: '4, 5 y 6 de septiembre · horario a confirmar',
    lugar: 'Ubicación a confirmar',
    estado: 'Publicado',
    visible_feed: true,
    color: 'violet',
  },
  {
    titulo: 'Segunda Clínica de Patinaje con Miguel Flores',
    inicio: '2026-10-28T03:00:00.000Z',
    mes_referencia: '28, 29 y 30 de octubre · horario a confirmar',
    lugar: 'Ubicación a confirmar',
    estado: 'Próximamente',
    visible_feed: true,
    color: 'electric',
  },
]

const MINI_LINKS = [
  { to: '/pasaporte-kids', icon: '📕', title: 'Pasaporte Kids', text: 'Progreso y aventuras PR Kids' },
  { to: '/cuponeras', icon: '🎟️', title: 'Cuponeras', text: 'Beneficios de tu experiencia PR' },
  { to: '/uniformes', icon: '👕', title: 'Uniformes', text: 'La identidad oficial del equipo' },
  { to: '/tracking', icon: '📍', title: 'PR Tracking', text: 'Protegé tus elementos con NFC' },
]

export default function Home() {
  const { user } = useAuth()
  const [day, setDay] = useState('miercoles')
  const [cupos, setCupos] = useState(getCupos())
  const [events, setEvents] = useState(DEFAULT_EVENTS)
  const [feedPulse, setFeedPulse] = useState({
    activitiesToday: 0,
    kilometersToday: 0,
    skatersToday: 0,
    latestName: '',
    latestTitle: '',
    totalActivities: 0,
    totalKilometers: 0,
    activeThisWeek: 0,
    loading: true,
  })
  const [ambientPulse, setAmbientPulse] = useState({
    count: 0,
    active: false,
  })

  const isLoggedIn = Boolean(user)
  const isStaff = user?.role === 'admin' || user?.role === 'profesor'
  const privateDestination = isStaff ? '/admin' : '/app/dashboard'

  useEffect(() => {
    if (!window.location.hash) return
    const id = window.location.hash.replace('#', '')
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 180)
  }, [])

  useEffect(() => {
    const refresh = () => setCupos(getCupos())
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadEvents() {
      try {
        const { data, error } = await supabase.from('rollerfeed_events').select('*')
        if (error || !active) return
        const visible = (data || [])
          .filter((event) => event.visible_feed !== false && event.estado !== 'Cancelado')
          .filter((event) => !event.inicio || new Date(event.inicio).getTime() >= Date.now() - 86400000)
          .sort((a, b) => {
            if (!a.inicio) return 1
            if (!b.inicio) return -1
            return new Date(a.inicio) - new Date(b.inicio)
          })
        if (visible.length) setEvents(visible)
      } catch (_) {}
    }
    loadEvents()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    async function loadRollerFeedPulse() {
      try {
        const start = new Date()
        start.setHours(0, 0, 0, 0)

        const weekStart = new Date(Date.now() - 7 * 86400000).toISOString()
        const [activitiesResponse, profilesResponse, historyResponse] = await Promise.all([
          supabase
            .from('pr_activities')
            .select('*')
            .eq('eliminada', false)
            .gte('fecha_inicio', start.toISOString())
            .order('fecha_inicio', { ascending: false })
            .limit(60),

          supabase
            .from('profiles_feed')
            .select('*')
            .limit(500),

          supabase
            .from('pr_activities')
            .select('*')
            .eq('eliminada', false)
            .order('fecha_inicio', { ascending: false })
            .limit(1000),
        ])

        if (!active) return

        const publicActivities = (activitiesResponse.data || []).filter(
          (activity) =>
            activity &&
            activity.eliminada !== true &&
            activity.es_privada !== true &&
            activity.privada !== true &&
            activity.privado !== true &&
            activity.visible_feed !== false
        )

        const profiles = profilesResponse.data || []
        const publicHistory = (historyResponse.data || []).filter(
          (activity) =>
            activity &&
            activity.eliminada !== true &&
            activity.es_privada !== true &&
            activity.privada !== true &&
            activity.privado !== true &&
            activity.visible_feed !== false
        )
        const profilesById = new Map()

        profiles.forEach((profile) => {
          if (profile?.id) profilesById.set(String(profile.id), profile)
          if (profile?.auth_user_id) profilesById.set(String(profile.auth_user_id), profile)
        })

        const kilometersToday =
          publicActivities.reduce(
            (sum, activity) => sum + (Number(activity.distancia_metros) || 0),
            0
          ) / 1000

        const skatersToday = new Set(
          publicActivities
            .map((activity) => activity.alumno_id)
            .filter(Boolean)
            .map(String)
        ).size

        const latest = publicActivities[0]
        const latestProfile = latest?.alumno_id
          ? profilesById.get(String(latest.alumno_id))
          : null

        const latestName =
          latestProfile?.nombre_completo ||
          latestProfile?.display_name ||
          [latestProfile?.nombre, latestProfile?.apellido].filter(Boolean).join(' ') ||
          latest?.alumno_nombre ||
          latest?.nombre_alumno ||
          ''

        const totalKilometers = publicHistory.reduce(
          (sum, activity) => sum + (Number(activity.distancia_metros) || 0),
          0
        ) / 1000

        const activeThisWeek = new Set(
          publicHistory
            .filter((activity) => String(activity.fecha_inicio || '') >= weekStart)
            .map((activity) => activity.alumno_id)
            .filter(Boolean)
            .map(String)
        ).size

        setFeedPulse({
          activitiesToday: publicActivities.length,
          kilometersToday,
          skatersToday,
          latestName,
          latestTitle: latest?.nombre || 'Entrenamiento sobre ruedas',
          totalActivities: publicHistory.length,
          totalKilometers,
          activeThisWeek,
          loading: false,
        })
      } catch (_) {
        if (!active) return
        setFeedPulse((current) => ({ ...current, loading: false }))
      }
    }

    loadRollerFeedPulse()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function updateAmbientPulse() {
      const now = new Date()
      const hour = now.getHours()
      const active = hour >= 8 && hour < 21

      if (!active) {
        setAmbientPulse({ count: 0, active: false })
        return
      }

      // Pulso visual estable por bloques de 4 minutos.
      // No representa presencia real: evita mostrar datos personales
      // y da sensación de comunidad activa sin exponer a nadie.
      const slot = Math.floor(now.getTime() / (4 * 60 * 1000))
      const sequence = [3, 5, 7, 4, 8, 6, 5, 7, 3, 6, 8, 4]
      const count = sequence[slot % sequence.length]

      setAmbientPulse({ count, active: true })
    }

    updateAmbientPulse()
    const timer = window.setInterval(updateAmbientPulse, 60 * 1000)

    return () => window.clearInterval(timer)
  }, [])

  const totalCupos = useMemo(() => (
    Number(cupos?.miercoles?.principiantes || 0) +
    Number(cupos?.miercoles?.avanzado || 0) +
    Number(cupos?.sabado?.kids || 0) +
    Number(cupos?.sabado?.adultos || 0)
  ), [cupos])

  return (
    <PublicLayout>
      <main className="overflow-hidden bg-[#050508] text-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">

          {/* HERO */}
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#090a0d] shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(249,115,22,.19),transparent_34%),radial-gradient(circle_at_5%_100%,rgba(37,99,235,.15),transparent_38%)]" />
            <div className="relative p-5 sm:p-8 lg:p-11">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Punta Rollers" className="h-12 w-12 rounded-2xl object-contain" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">Punta Rollers</p>
                    <p className="text-xs text-white/45">Punta del Este · Uruguay</p>
                  </div>
                </div>
                <Link to={isLoggedIn ? privateDestination : '/login'} className="rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-bold text-white transition active:scale-95">
                  {isLoggedIn ? 'Mi espacio' : 'Ingresar'}
                </Link>
              </div>

              <div className="mt-10 max-w-2xl sm:mt-14">
                <p className="text-xs font-black uppercase tracking-[.22em] text-orange-400">10 años sobre ruedas</p>
                <h1 className="mt-3 text-[43px] font-black leading-[.94] tracking-[-.045em] sm:text-6xl lg:text-7xl">
                  No es solo<br />patinar. <span className="text-orange-500">Es pertenecer.</span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-6 text-white/60 sm:text-base">Escuela, entrenamientos y una comunidad que comparte cada kilómetro. Todo Punta Rollers, en un mismo lugar.</p>
                <a href="#clases" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-2xl bg-orange-500 px-5 text-sm font-black text-black shadow-[0_12px_35px_rgba(249,115,22,.22)] active:scale-[.98]">Ver horarios y cupos <span>→</span></a>
              </div>

              <div className="mt-9 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-5">
                <HeroStat value="10" label="años juntos" />
                <HeroStat value={totalCupos} label="cupos hoy" />
                <HeroStat value="2" label="sedes PR" />
              </div>
            </div>
          </section>

          {/* LOGGED USER */}
          {isLoggedIn && (
            <section className="mt-5 flex items-center gap-3 rounded-2xl border border-orange-400/20 bg-orange-500/[.08] p-4">
              <span className="text-2xl">👋</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">Hola, {user.nombre}</p>
                <p className="text-xs text-white/45">Tu sesión está activa.</p>
              </div>
              <Link to={privateDestination} className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-black">Entrar</Link>
            </section>
          )}

          {/* CLASES + CUPOS: PRIORIDAD */}
          <section id="clases" className="scroll-mt-8 pt-10">
            <SectionTitle emoji="🛼" eyebrow="Clases PR" title="Elegí cuándo rodar." text="Horarios, ubicación y cupos reales. Todo a mano." />

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/[.05] p-1.5">
              <DayButton active={day === 'miercoles'} onClick={() => setDay('miercoles')}>Miércoles</DayButton>
              <DayButton active={day === 'sabado'} onClick={() => setDay('sabado')}>Sábado</DayButton>
            </div>

            <div className="mt-3 space-y-3">
              {day === 'miercoles' ? (
                <ClassRow emoji="🌊" title="Clases mixtas" subtitle="Principiantes · Intermedios · Avanzados" time="19:30 — 20:30" location="Parada 2 · Punta del Este" seats={cupos.miercoles.principiantes} />
              ) : (
                <>
                  <ClassRow emoji="☀️" title="Adultos mixtos" subtitle="Clase al aire libre" time="09:00 — 10:00" location="Parada 2 · Punta del Este" seats={cupos.miercoles.avanzado} />
                  <ClassRow emoji="🧒" title="PR Kids" subtitle="Pista cerrada" time="19:00 — 20:00" location="Maldonado · Indoor" seats={cupos.sabado.kids} />
                  <ClassRow emoji="⚡" title="Adultos mixtos" subtitle="Pista cerrada" time="20:00 — 21:00" location="Maldonado · Indoor" seats={cupos.sabado.adultos} />
                </>
              )}
            </div>

            <div id="inscripciones" className="mt-4 grid grid-cols-2 gap-3 scroll-mt-8">
              <ActionLink href="https://form.jotform.com/Claudinio/inscripcioneskids" emoji="🎒" title="PR Kids" label="Inscripción" />
              <ActionLink href="/inscripciones-2026" emoji="🛼" title="Adultos" label="Inscripción" internal />
            </div>
            <p className="mt-3 text-center text-[11px] leading-5 text-white/35">Las cuentas de la app son creadas por el equipo Punta Rollers. Las inscripciones no crean usuarios automáticamente.</p>
          </section>


          {/* QUIÉNES SOMOS — inmediatamente después de clases */}
          <section className="pt-9">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0c10]">
              <div className="p-5 sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">
                  🧡 ¿Quiénes somos?
                </p>
                <h2 className="mt-2 text-[28px] font-black leading-tight tracking-[-.03em] sm:text-4xl">
                  Una escuela. Una comunidad.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                  Hace 10 años acompañamos a niños, adolescentes, adultos y adultos mayores
                  en su camino sobre ruedas. Clases, calle, pista, eventos, competencia y
                  experiencias compartidas.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Place emoji="🌊" title="Parada 2" text="Punta del Este · Aire libre" />
                  <Place emoji="🏟️" title="Pista cerrada" text="Maldonado · Indoor" />
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white">Equipo Punta Rollers</p>
                    <p className="mt-1 text-[11px] leading-4 text-white/40">
                      Claudio Facelli · David Almeida · Lucía Bernales
                    </p>
                  </div>
                  <span className="shrink-0 text-2xl">🛼</span>
                </div>
              </div>
            </div>
          </section>

          {/* ROLLERFEED — preview público + pulso visual */}
          <section className="pt-9">
            <div className="relative overflow-hidden rounded-[30px] border border-orange-300/20 bg-gradient-to-br from-[#28160d] via-[#0c0c11] to-violet-500/[.08] p-5 sm:p-7">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-300">MÁS QUE VENIR A CLASE</p>
                <h2 className="mt-2 max-w-xl text-[30px] font-black leading-[.98] tracking-[-.035em] sm:text-4xl">Cada alumno tiene su propio ecosistema PR.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Actividad, objetivos, evolución, logros y comunidad. Un lugar para registrar el recorrido y acompañar todo lo que pasa entre una clase y la siguiente.</p>

                <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 rounded-[24px] border border-white/10 bg-black/20 py-5">
                  <ProofStat value={feedPulse.loading ? '…' : feedPulse.totalKilometers.toLocaleString('es-UY', { maximumFractionDigits: 1 })} label="km compartidos" />
                  <ProofStat value={feedPulse.loading ? '…' : feedPulse.totalActivities} label="entrenamientos" />
                  <ProofStat value={feedPulse.loading ? '…' : feedPulse.activeThisWeek} label="activos esta semana" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded-[20px] border border-white/[.08] bg-white/[.035] p-4"><span className="text-xl">🎯</span><p className="mt-2 text-xs font-black">Objetivos propios</p><p className="mt-1 text-[10px] leading-4 text-white/35">Metas y devoluciones que acompañan el proceso.</p></div>
                  <div className="rounded-[20px] border border-white/[.08] bg-white/[.035] p-4"><span className="text-xl">📈</span><p className="mt-2 text-xs font-black">Evolución real</p><p className="mt-1 text-[10px] leading-4 text-white/35">Progreso construido con actividad y tomas.</p></div>
                </div>
              </div>
            </div>
          </section>

          {/* ROLLERFEED — preview público + pulso visual */}
          <section className="pt-9">
            <div className="relative overflow-hidden rounded-[28px] border border-orange-400/20 bg-[#0a0b0f]">
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">
                        RollerFeed
                      </p>

                      {ambientPulse.active ? (
                        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.08] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-300">
                          ⚡ Pulso PR · {ambientPulse.count} rodando ahora
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white/35">
                          🌙 PR descansa
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 text-[28px] font-black leading-tight tracking-[-.03em] sm:text-4xl">
                      Mirá lo que está pasando.
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                      Entrenos, kilómetros, eventos y movimiento de la comunidad.
                      Una pequeña ventana pública al mundo Punta Rollers.
                    </p>
                  </div>

                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-xl">
                    ⚡
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-3.5">
                  <div className="flex -space-x-2">
                    {['👩🏻‍🦰', '👨🏽‍🦱', '👩🏼', '👨🏻', '👩🏽‍🦱', '👨🏼‍🦰']
                      .slice(0, Math.min(4, Math.max(3, ambientPulse.count || 3)))
                      .map((emoji, item) => (
                        <div
                          key={`${emoji}-${item}`}
                          className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#0a0b0f] bg-gradient-to-br from-orange-500/25 to-blue-500/20 text-base shadow-lg"
                          aria-hidden="true"
                        >
                          {emoji}
                        </div>
                      ))}
                  </div>

                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[11px] font-black text-white">
                      {ambientPulse.active
                        ? `${ambientPulse.count} patinadores en movimiento`
                        : 'La comunidad vuelve a rodar mañana'}
                    </p>
                    <p className="mt-0.5 text-[9px] text-white/30">
                      Pulso visual anónimo · 08:00 a 21:00
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[.035] py-4">
                  <PulseStat
                    value={feedPulse.loading ? '…' : feedPulse.skatersToday}
                    label="rodaron hoy"
                  />
                  <PulseStat
                    value={feedPulse.loading ? '…' : feedPulse.activitiesToday}
                    label="actividades"
                  />
                  <PulseStat
                    value={
                      feedPulse.loading
                        ? '…'
                        : feedPulse.kilometersToday > 0
                          ? feedPulse.kilometersToday.toLocaleString('es-UY', {
                              maximumFractionDigits: 1,
                            })
                          : '0'
                    }
                    label="km hoy"
                  />
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-lg">
                      🛼
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[.12em] text-orange-300">
                        Actividad de hoy
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/60">
                        {feedPulse.activitiesToday > 0
                          ? `${feedPulse.activitiesToday} ${feedPulse.activitiesToday === 1 ? 'entreno registrado' : 'entrenos registrados'} · ${feedPulse.kilometersToday.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km compartidos`
                          : 'La próxima vuelta puede ser la primera actividad del día.'}
                      </p>
                    </div>
                  </div>

                  {events?.[0] && (
                    <div className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-lg">
                        🗓️
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[.12em] text-blue-300">
                          Se viene
                        </p>
                        <p className="mt-1 truncate text-xs font-black text-white/75">
                          {events[0].titulo}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-fuchsia-500/10 text-lg">
                      🏅
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[.12em] text-fuchsia-300">
                        Comunidad PR
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/55">
                        Logros, insignias, cumpleaños, actividades y momentos compartidos viven dentro de RollerFeed.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/rollerfeed"
                  className="mt-5 flex min-h-12 items-center justify-between rounded-2xl bg-orange-500 px-4 text-sm font-black text-black transition active:scale-[.98]"
                >
                  <span>Chusmear RollerFeed</span>
                  <span>→</span>
                </Link>

                <p className="mt-3 text-[9px] leading-4 text-white/25">
                  “Pulso PR” es un indicador visual anónimo de comunidad activa y no representa
                  presencia individual en tiempo real. RollerFeed público muestra únicamente contenido
                  marcado como visible/público; los datos privados de cada alumno siguen protegidos.
                </p>
              </div>
            </div>
          </section>

          {/* QUICK 4 BLOCKS */}
          <section id="explorar" className="scroll-mt-8 pt-11">
            <SectionTitle emoji="✨" eyebrow="Universo PR" title="Mucho más que clases." text="Todo lo que ya forma parte de Punta Rollers, sin convertir el Home en un chorizo infinito." />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {MINI_LINKS.map((item) => <MiniCard key={item.to} {...item} />)}
            </div>
          </section>

          {/* PLATAFORMAS 4 compact */}
          <section className="pt-11">
            <SectionTitle emoji="📲" eyebrow="Ecosistema PR" title="Todo conectado." />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <ExternalMini href="https://puntarollerscard.com/" emoji="💳" title="PR Card" text="Beneficios y comercios" />
              <ExternalMini href="https://rollermap.vercel.app/" emoji="🗺️" title="RollerMap" text="Lugares para rodar" />
              <LinkMini to="/alianza" emoji="🤝" title="Alianza Rollers" text="La red que nos conecta" />
              <LinkMini to="/terminos" emoji="📋" title="Reglas PR" text="Cómo funciona el club" />
            </div>
          </section>

          {/* GALLERY */}
          <section className="pt-11">
            <SectionTitle emoji="📸" eyebrow="Somos esto" title="Fotos, rolleadas y recuerdos." text="La comunidad también se guarda." />
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <GalleryTile href={GALLERY_LINKS.clases} emoji="📷" title="Clases" />
              <GalleryTile href={GALLERY_LINKS.rolleadas} emoji="🎉" title="Rolleadas" />
              <GalleryTile href={GALLERY_LINKS.contenido} emoji="🎬" title="Videos" />
            </div>
          </section>

          {/* EVENTS AT BOTTOM */}
          <section className="pt-11">
            <SectionTitle emoji="🗓️" eyebrow="Agenda PR" title="Próximos eventos." text="Se ven sin iniciar sesión y se actualizan desde el sistema de eventos." />
            <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {events.slice(0, 5).map((event, index) => <EventCard key={event.id || `${event.titulo}-${index}`} event={event} />)}
            </div>
          </section>

          {/* FINAL */}
          <section className="pb-5 pt-11">
            <div className="border-t border-white/10 pt-7 text-center">
              <img src="/logo.png" alt="Punta Rollers" className="mx-auto h-14 w-14 object-contain" />
              <p className="mt-3 text-lg font-black">No es solo patinar.</p>
              <p className="text-lg font-black text-orange-500">Es pertenecer.</p>
              <p className="mt-3 text-xs text-white/30">Punta del Este · Maldonado · Uruguay</p>
            </div>
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}

function HeroStat({ value, label }) {
  return <div className="px-3 first:pl-0"><p className="text-xl font-black text-white sm:text-2xl">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-white/35">{label}</p></div>
}

function SectionTitle({ emoji, eyebrow, title, text }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">{emoji} {eyebrow}</p><h2 className="mt-2 text-[28px] font-black leading-tight tracking-[-.03em] sm:text-4xl">{title}</h2>{text && <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">{text}</p>}</div>
}

function DayButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`min-h-11 rounded-xl text-sm font-black transition ${active ? 'bg-white text-black shadow-lg' : 'text-white/45'}`}>{children}</button>
}

function ClassRow({ emoji, title, subtitle, time, location, seats }) {
  const low = Number(seats) <= 2
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#0b0c10] p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[.06] text-xl">{emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="text-sm font-black">{title}</h3><p className="mt-0.5 text-[11px] text-white/40">{subtitle}</p></div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${low ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{seats} cupos</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55"><span>🕐 {time}</span><span>📍 {location}</span></div>
        </div>
      </div>
    </article>
  )
}

function ActionLink({ href, emoji, title, label, internal = false }) {
  const className = 'rounded-[22px] border border-orange-400/20 bg-orange-500/[.08] p-4 transition active:scale-[.98]'
  const content = <><span className="text-2xl">{emoji}</span><p className="mt-3 text-sm font-black">{title}</p><p className="mt-1 text-[11px] font-bold text-orange-300">{label} →</p></>
  return internal ? <Link to={href} className={className}>{content}</Link> : <a href={href} target="_blank" rel="noreferrer" className={className}>{content}</a>
}

function MiniCard({ to, icon, title, text }) {
  return <Link to={to} className="group min-h-[145px] rounded-[24px] border border-white/10 bg-[#0b0c10] p-4 transition active:scale-[.98]"><div className="text-3xl">{icon}</div><p className="mt-4 text-sm font-black">{title}</p><p className="mt-1 text-[11px] leading-4 text-white/40">{text}</p><span className="mt-3 block text-xs font-black text-orange-400">Ver →</span></Link>
}

function ExternalMini({ href, emoji, title, text }) {
  return <a href={href} target="_blank" rel="noreferrer" className="rounded-[22px] border border-white/10 bg-white/[.035] p-4 active:scale-[.98]"><span className="text-2xl">{emoji}</span><p className="mt-3 text-sm font-black">{title}</p><p className="mt-1 text-[11px] text-white/40">{text}</p></a>
}

function LinkMini({ to, emoji, title, text }) {
  return <Link to={to} className="rounded-[22px] border border-white/10 bg-white/[.035] p-4 active:scale-[.98]"><span className="text-2xl">{emoji}</span><p className="mt-3 text-sm font-black">{title}</p><p className="mt-1 text-[11px] text-white/40">{text}</p></Link>
}

function GalleryTile({ href, emoji, title }) {
  return <a href={href} target="_blank" rel="noreferrer" className="flex aspect-[.9] flex-col justify-between rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[.06] to-white/[.02] p-3 active:scale-[.98]"><span className="text-3xl">{emoji}</span><div><p className="text-xs font-black sm:text-sm">{title}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-orange-400">Abrir ↗</p></div></a>
}

function PulseStat({ value, label }) {
  return (
    <div className="px-2 text-center">
      <p className="text-xl font-black text-white sm:text-2xl">{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-white/30 sm:text-[9px]">
        {label}
      </p>
    </div>
  )
}

function ProofStat({ value, label }) {
  return <div className="min-w-0 px-2 text-center"><p className="truncate text-xl font-black text-white sm:text-2xl">{value}</p><p className="mt-1 text-[7px] font-black uppercase tracking-[.1em] text-white/30 sm:text-[8px]">{label}</p></div>
}

function Place({ emoji, title, text }) {
  return <div className="rounded-2xl bg-white/[.045] p-3"><span className="text-xl">{emoji}</span><p className="mt-2 text-xs font-black">{title}</p><p className="mt-1 text-[10px] leading-4 text-white/40">{text}</p></div>
}

function EventCard({ event }) {
  const date = event.inicio ? new Date(event.inicio) : null
  const day = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('es-UY', { day: '2-digit' }).format(date) : 'PR'
  const month = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('es-UY', { month: 'short' }).format(date).replace('.', '').toUpperCase() : 'EVENTO'
  return (
    <article className="min-w-[82%] snap-start overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0c10] sm:min-w-[360px]">
      <div className="h-1.5 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-orange-500 text-center text-black"><div><p className="text-xl font-black leading-none">{day}</p><p className="mt-1 text-[9px] font-black">{month}</p></div></div>
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-orange-400">Evento Punta Rollers</p><h3 className="mt-1 text-base font-black leading-5">{event.titulo}</h3></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/50">{event.mes_referencia || 'Próximamente más información'}</p>
        <p className="mt-2 text-xs text-white/35">📍 {event.lugar || 'Ubicación a confirmar'}</p>
      </div>
    </article>
  )
}
