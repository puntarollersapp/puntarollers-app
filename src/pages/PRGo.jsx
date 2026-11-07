import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import './pr-go.css'

const bridgeOrigin = 'https://pr-go-comunidad-piloto-jt1051.v2.appdeploy.ai'
const houses = [
  { id: 'blue', name: 'Azul', coach: 'Claudio', color: '#62a5ff' },
  { id: 'green', name: 'Verde', coach: 'David', color: '#50e8a4' },
  { id: 'pink', name: 'Rosado', coach: 'Lucía', color: '#ff82c8' },
]
const zoneNames = {"dedos": "Los Dedos", "gorlero": "Gorlero", "mexico": "Plaza México", "muelle-pastora": "Muelle La Pastora", "san-fernando": "Plaza San Fernando", "vigia": "Torre del Vigía", "bicentenario": "Plaza Bicentenario"}
const distance = meters => new Intl.NumberFormat('es-UY', { maximumFractionDigits: 2 }).format(meters / 1000)
const photoUrl = value => typeof value === 'string' && value.startsWith('https://') ? value : undefined

function readStandings(frame, token, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted || !frame) {
      reject(new Error('La conexión todavía no está lista.'))
      return
    }
    const id = crypto.randomUUID()
    let sent = false
    const ping = () => frame.postMessage({ type: 'prgo:ping' }, bridgeOrigin)
    const interval = setInterval(ping, 350)
    const timeout = setTimeout(() => done(new Error('PR GO está demorando en responder.')), 18000)
    function done(error, data) {
      clearInterval(interval)
      clearTimeout(timeout)
      window.removeEventListener('message', receive)
      signal.removeEventListener('abort', abort)
      if (error) reject(error)
      else resolve(data)
    }
    function abort() {
      done(new Error('Conexión cancelada.'))
    }
    function receive(event) {
      if (event.origin !== bridgeOrigin || event.source !== frame) return
      if (!sent && event.data?.type === 'prgo:ready') {
        sent = true
        clearInterval(interval)
        frame.postMessage({ type: 'prgo:standings', id, token }, bridgeOrigin)
        return
      }
      if (event.data?.type !== 'prgo:standings-result' || event.data.id !== id) return
      const { data, error } = event.data
      if (error || data?.schema !== 1 || !data.me || !data.teamMeters || !Array.isArray(data.standings) || !Array.isArray(data.zones)) {
        done(new Error(error || 'No pudimos cargar los resultados de PR GO.'))
      } else done(null, data)
    }
    window.addEventListener('message', receive)
    signal.addEventListener('abort', abort, { once: true })
    ping()
  })
}

function PRGoMark() {
  return (
    <svg viewBox="0 0 512 512" role="img" aria-label="Logo de PR GO">
      <defs>
        <linearGradient id="prgo-panel-lime" x2="1" y2="1">
          <stop stopColor="#e4ff79" />
          <stop offset="1" stopColor="#a8e927" />
        </linearGradient>
      </defs>
      <path d="M132 351C108 321 94 281 91 235C80 133 127 53 256 53s176 80 165 182c-9 91-99 155-165 222"
        fill="none" stroke="url(#prgo-panel-lime)" strokeWidth="12" strokeLinecap="round" />
      <image x="143" y="94" width="227" height="227" href="/avatar/v3/brand/pr-logo-official-v1.png" />
      <path d="m111 361 46-26m198-1 44 26" stroke="#b99bff" strokeWidth="6" strokeLinecap="round" />
      <path d="M256 396v61m-45-43 45 43 45-43" fill="none" stroke="#d6ff52"
        strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <text x="194" y="374" fontFamily="Arial,sans-serif" fontSize="78" fontStyle="italic"
        fontWeight="900" fill="#d6ff52" letterSpacing="-7">GO</text>
    </svg>
  )
}

const crestPaths = {
  blue: 'M113 39 65 105h31l-9 55 54-78h-35Z M40 76h19M36 94h16M42 112h13',
  green: 'M57 44 129 134q7 9 18 3l9-7-17-15-8 7-60-85 M143 44 71 134q-7 9-18 3l-9-7 17-15 8 7 60-85 M85 152h30v9H85Z',
  pink: 'M71 53h27v44l29 11q12 4 13 17H57V89h14Z M65 88h30M66 99h30M60 130h81 M129 47v24M117 59h24',
}

function GymPlate({ house }) {
  const portrait = '/prgo-art/' + house.id + '.webp'
  return (
    <figure className="prgo-panel-gym-plate" aria-label={'Placa del Gimnasio ' + house.name}>
      <svg className="prgo-plate-circuits" viewBox="0 0 400 500" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-30 410 80 340 80 230 195 230 195 100 450-20 M-50 300 40 300 40 150 155 150 155 20 260-30 M-10 470 120 390 270 390 270 260 460 160" />
      </svg>
      <span className="prgo-plate-brand" aria-hidden="true">PR GO / PUNTA ROLLERS</span>
      <span className="prgo-plate-watermark" aria-hidden="true">GIMNASIO</span>
      <img className="prgo-plate-shadow" src={portrait} alt="" />
      <img className="prgo-plate-portrait" src={portrait} alt={house.coach} />
      <svg className="prgo-plate-crest" viewBox="0 0 200 200" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d={'M100 13 169 52v84l-69 49-69-49V52Z ' + crestPaths[house.id]} />
          {house.id === 'pink' && [66, 88, 110, 132].map(x => <circle key={x} cx={x} cy="144" r="7" />)}
        </g>
      </svg>
      <figcaption><span>Gimnasio {house.name}</span><strong>{house.coach}</strong></figcaption>
      <img className="prgo-plate-wheel" src="/prgo-art/wheel.webp" alt="" />
    </figure>
  )
}

function Portrait({ person }) {
  return <span className="prgo-panel-avatar">{photoUrl(person.photo)
    ? <img src={photoUrl(person.photo)} alt="" loading="lazy" />
    : person.name.slice(0, 1)}</span>
}

function Podium({ standings }) {
  if (!standings.length) return <div className="prgo-panel-empty">Las primeras salidas compartidas aparecerán acá.</div>
  const leaderMeters = Math.max(1, standings[0].meters)
  return <>
    <ol className="prgo-panel-podium" aria-label="Podio por kilómetros compartidos">
      {standings.slice(0, 3).map((person, index) => {
        const teamColor = houses.find(house => house.id === person.teamId)?.color || '#c4a4ff'
        return (
          <li key={person.id} data-rank={index + 1} style={{
            '--prgo-rank-color': teamColor,
            '--prgo-rank-angle': Math.min(360, person.meters / leaderMeters * 360) + 'deg',
          }}>
            <span className="prgo-panel-place">0{index + 1}</span>
            <div className="prgo-panel-rank-ring"><Portrait person={person} /></div>
            <strong>{person.name}</strong>
            <span>{distance(person.meters)} km</span>
          </li>
        )
      })}
    </ol>
    {standings.length > 3 && <ol className="prgo-panel-rank" start={4}>
      {standings.slice(3).map((person, index) => <li key={person.id}>
        <span>{index + 4}</span><Portrait person={person} />
        <strong>{person.name}</strong><span>{distance(person.meters)} km</span>
      </li>)}
    </ol>}
  </>
}

function ConquestFlag({ color }) {
  return <svg viewBox="0 0 30 30" width="29" height="29" aria-hidden="true" style={{ color }}>
    <path d="M7 26V4m0 2 15 5-15 6" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

export default function PRGo() {
  const { user } = useAuth()
  const [frame, setFrame] = useState(null)
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const allowed = ['alumno', 'admin'].includes(user?.role)

  useEffect(() => {
    if (!allowed || !user?.id || !frame) return
    const controller = new AbortController()
    setResult(null)
    setError('')
    async function load() {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !data.session?.access_token) throw new Error('Volvé a entrar a Punta Rollers para consultar PR GO.')
      const standings = await readStandings(frame.contentWindow, data.session.access_token, controller.signal)
      if (!controller.signal.aborted) setResult(standings)
    }
    load().catch(issue => {
      if (!controller.signal.aborted) setError(issue.message)
    })
    return () => controller.abort()
  }, [allowed, frame, retry, user?.id])

  const myHouse = houses.find(house => house.id === result?.me.teamId)
  const sortedHouses = [...houses].sort((a, b) => (result?.teamMeters[b.id] || 0) - (result?.teamMeters[a.id] || 0))
  const maxMeters = result ? Math.max(1, ...houses.map(house => result.teamMeters[house.id] || 0)) : 1

  return (
    <AppLayout title="PR GO">
      <div className="prgo-panel">
        {allowed && <iframe ref={setFrame} hidden title="Conexión privada con PR GO" src={bridgeOrigin + '/?bridge=standings'} referrerPolicy="no-referrer" />}
        <header className="prgo-panel-hero">
          <div className="prgo-panel-brand-copy">
            <span className="prgo-panel-eyebrow">PR GO / PUNTA ROLLERS</span>
            <h1>La ciudad<br /><em>en movimiento.</em></h1>
            <p>Tu gimnasio, tus salidas y las conquistas de la comunidad.</p>
          </div>
          <div className="prgo-panel-brand"><PRGoMark /></div>
        </header>
        {!allowed && <p className="prgo-panel-state">Esta página está reservada a las cuentas habilitadas de PR GO.</p>}
        {allowed && !result && <div className="prgo-panel-state" role="status">
          {error ? <div className="prgo-panel-connect">
            <span className="prgo-panel-eyebrow">PUNTA ROLLERS × PR GO</span>
            <h2>Establecer conexión</h2>
            <p>Conectá tu cuenta para ver tu gimnasio y tus salidas respaldadas.</p>
            <button type="button" onClick={() => setRetry(value => value + 1)}>Conectar <span aria-hidden="true">↗</span></button>
          </div> : 'Conectando con tu cuenta de PR GO…'}
        </div>}
        {result && <>
          <section className="prgo-panel-my-gym" style={{ '--prgo-house': myHouse?.color || '#c4a4ff' }}>
            <div className="prgo-panel-gym-copy">
              <span className="prgo-panel-eyebrow">TU EQUIPO</span>
              <h2>Mi gimnasio</h2>
              <strong>{myHouse ? myHouse.name + ' · ' + myHouse.coach : 'Por elegir'}</strong>
              <p>{myHouse ? 'Tu elección confirmada en PR GO.' : 'Elegí tu gimnasio en la app para ver tu placa acá.'}</p>
              <div className="prgo-panel-metrics">
                <div><span>Salidas respaldadas</span><strong>{result.me.savedOutings}</strong></div>
                <div><span>Km privados respaldados</span><strong>{Number.isFinite(result.me.privateMeters) ? distance(result.me.privateMeters) : '—'}</strong></div>
                <div><span>Km compartidos</span><strong>{distance(result.me.sharedMeters)}</strong></div>
              </div>
            </div>
            {myHouse && <GymPlate house={myHouse} />}
          </section>
          <section>
            <h2>Marcador de gimnasios</h2>
            <p>Kilómetros de las salidas compartidas con la comunidad.</p>
            {sortedHouses.map(house => {
              const meters = result.teamMeters[house.id] || 0
              return <div className="prgo-panel-house" key={house.id} style={{ '--prgo-house': house.color }}>
                <div><strong>{house.name} · {house.coach}</strong><span>{distance(meters)} km</span></div>
                <progress aria-label={'Kilómetros de ' + house.name} value={meters} max={maxMeters} />
              </div>
            })}
          </section>
          <section>
            <span className="prgo-panel-eyebrow">TABLA DE POSICIONES</span>
            <h2>Ranking de patinadores</h2>
            <Podium standings={result.standings} />
          </section>
          <section>
            <span className="prgo-panel-eyebrow">MAPA COMPARTIDO</span>
            <h2>Conquistas activas</h2>
            {result.zones.length ? <ul className="prgo-panel-zones">{result.zones.map(zone => (
              <li key={zone.id}>
                <ConquestFlag color={zone.color} /><div>
                  <strong>{zoneNames[zone.id] || 'Zona del piloto'}</strong>
                  <small>{zone.owner.name}</small>
                </div><Portrait person={zone.owner} />
              </li>
            ))}</ul> : <div className="prgo-panel-empty"><ConquestFlag color="#c4a4ff" />Las banderas aparecerán cuando se compartan conquistas.</div>}
          </section>
        </>}
      </div>
    </AppLayout>
  )
}
