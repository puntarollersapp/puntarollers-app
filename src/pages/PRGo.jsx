import { useEffect, useRef, useState } from 'react'
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
const distance = meters => new Intl.NumberFormat('es-UY', { maximumFractionDigits: 2 }).format(meters / 1000)
const photoUrl = value => typeof value === 'string' && value.startsWith('https://') ? value : undefined

function readStandings(frame, token, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted || !frame) {
      reject(new Error('Conexión cancelada.'))
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

export default function PRGo() {
  const { user } = useAuth()
  const frame = useRef(null)
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const allowed = ['alumno', 'admin'].includes(user?.role)

  useEffect(() => {
    if (!allowed || !user?.id) return
    const controller = new AbortController()
    setResult(null)
    setError('')
    async function load() {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !data.session?.access_token) throw new Error('Volvé a entrar a Punta Rollers para consultar PR GO.')
      const standings = await readStandings(frame.current?.contentWindow, data.session.access_token, controller.signal)
      if (!controller.signal.aborted) setResult(standings)
    }
    load().catch(issue => {
      if (!controller.signal.aborted) setError(issue.message)
    })
    return () => controller.abort()
  }, [allowed, retry, user?.id])

  const myHouse = houses.find(house => house.id === result?.me.teamId)
  const sortedHouses = [...houses].sort((a, b) => (result?.teamMeters[b.id] || 0) - (result?.teamMeters[a.id] || 0))
  const maxMeters = result ? Math.max(1, ...houses.map(house => result.teamMeters[house.id] || 0)) : 1

  return (
    <AppLayout title="PR GO">
      <div className="prgo-panel">
        {allowed && <iframe ref={frame} hidden title="Conexión privada con PR GO" src={bridgeOrigin + '/?bridge=standings'} referrerPolicy="no-referrer" />}
        <header className="prgo-panel-hero">
          <span>PR GO / PUNTA ROLLERS</span>
          <h1>La ciudad<br /><em>en movimiento.</em></h1>
          <p>Tu gimnasio, tus salidas y las conquistas de la comunidad.</p>
        </header>
        {!allowed && <p className="prgo-panel-state">Esta página está reservada a las cuentas habilitadas de PR GO.</p>}
        {allowed && !result && <div className="prgo-panel-state" role="status">
          {error || 'Conectando con tu cuenta de PR GO…'}
          {error && <button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button>}
        </div>}
        {result && <>
          <div className="prgo-panel-metrics">
            <div><span>Mi gimnasio</span><strong style={{ color: myHouse?.color }}>{myHouse?.name || 'Por elegir'}</strong></div>
            <div><span>Mis salidas respaldadas</span><strong>{result.me.savedOutings}</strong></div>
            <div><span>Mis km compartidos</span><strong>{distance(result.me.sharedMeters)}</strong></div>
          </div>
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
            <h2>Ranking de patinadores</h2>
            {result.standings.length === 0 ? <p>Las primeras salidas compartidas aparecerán acá.</p> : <ol className="prgo-panel-rank">
              {result.standings.map((row, index) => <li key={row.id}>
                <span>{index + 1}</span>
                <span className="prgo-panel-avatar">{photoUrl(row.photo) ? <img src={photoUrl(row.photo)} alt="" loading="lazy" /> : row.name.slice(0, 1)}</span>
                <strong>{row.name}</strong><span>{distance(row.meters)} km</span>
              </li>)}
            </ol>}
          </section>
          <section>
            <h2>Conquistas activas</h2>
            <p>{result.zones.length} {result.zones.length === 1 ? 'zona conquistada' : 'zonas conquistadas'} en el mapa compartido de PR GO.</p>
          </section>
        </>}
      </div>
    </AppLayout>
  )
}
