import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const BADGE_IMAGES = {
  'primer evento pr': '/insignias-pr/primer-evento-pr.png',
  'rodador frecuente': '/insignias-pr/rodador-frecuente.png',
  'espiritu pr': '/insignias-pr/espiritu-pr.png',
  'primeros 6k': '/insignias-pr/primeros-6k.png',
  'primeros 10k': '/insignias-pr/primeros-10k.png',
  'ya frena en t': '/insignias-pr/frena-en-t.png',
  'frena en t': '/insignias-pr/frena-en-t.png',
  'ya frena con taco': '/insignias-pr/frena-con-taco.png',
  'frena con taco': '/insignias-pr/frena-con-taco.png',
  'buen companero': '/insignias-pr/buen-companero.png',
  'actitud positiva': '/insignias-pr/actitud-positiva.png',
  'entrenador potencial': '/insignias-pr/entrenador-potencial.png',
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function imageFor(title) {
  return BADGE_IMAGES[normalize(title)] || ''
}

function savedUser() {
  try { return JSON.parse(localStorage.getItem('pr_user') || '{}') } catch { return {} }
}

function dateLabel(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Insignias() {
  const { user } = useAuth()
  const profileId = ({ ...savedUser(), ...user }).id
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true

    async function load() {
      const { data, error } = await supabase
        .from('actividad_pr')
        .select('*')
        .eq('alumno_id', profileId)
        .eq('tipo', 'Insignia')
        .or('eliminado.is.null,eliminado.eq.false')
        .order('fecha', { ascending: false })

      if (!alive) return
      if (!error) setBadges(data || [])
      setLoading(false)
    }

    if (profileId) load()
    return () => { alive = false }
  }, [profileId])

  const unique = useMemo(() => {
    const seen = new Set()
    return badges.filter((badge) => {
      const key = normalize(badge.titulo)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [badges])

  return (
    <AppLayout title="Insignias" showBack>
      <div className="pr-page space-y-4 animate-page-enter pb-9">
        <section className="relative overflow-hidden rounded-[32px] border border-pr-gold/20 bg-gradient-to-br from-[#251907] via-[#0f0e12] to-[#07070a] p-5">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pr-gold/10 blur-3xl" />
          <div className="relative">
            <p className="text-[9px] font-black uppercase tracking-[.19em] text-pr-gold">🏅 Colección PR</p>
            <h1 className="mt-2 font-display text-[35px] leading-[.95] text-white">Tus logros<br/>cuentan tu historia.</h1>
            <p className="mt-3 max-w-[285px] text-xs leading-5 text-white/40">
              Constancia, técnica, eventos y espíritu de comunidad convertidos en recuerdos que quedan en tu perfil.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-[22px] border border-white/[.07] bg-black/25 p-4">
                <p className="font-display text-[34px] text-pr-gold">{unique.length}</p>
                <p className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/28">Conseguidas</p>
              </div>
              <div className="rounded-[22px] border border-white/[.07] bg-black/25 p-4">
                <p className="font-display text-[26px] text-white">{unique.length ? 'Activa' : 'Inicial'}</p>
                <p className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/28">Colección</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map((i) => <div key={i} className="aspect-[.88] animate-pulse rounded-[25px] bg-white/[.04]" />)}
          </div>
        ) : unique.length ? (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[.17em] text-white/28">Mi colección</p>
                <h2 className="mt-1 font-display text-[25px] text-white">Desbloqueadas</h2>
              </div>
              <p className="text-[9px] text-white/25">Tocá una para verla</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {unique.map((badge, index) => {
                const image = imageFor(badge.titulo)
                return (
                  <button key={badge.id} type="button" onClick={() => setSelected(badge)}
                    className="group relative overflow-hidden rounded-[25px] border border-white/[.08] bg-[#0e0e13] p-3 text-left active:scale-[.99]">
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-pr-gold/[.04]" />
                    <div className="relative aspect-square overflow-hidden rounded-[20px] border border-pr-gold/12 bg-gradient-to-b from-pr-gold/[.07] to-black/25 grid place-items-center">
                      {image ? <img src={image} alt="" className="h-full w-full object-contain p-2" /> : <span className="text-5xl">🏅</span>}
                      <span className="absolute right-2 top-2 rounded-full border border-pr-gold/15 bg-black/55 px-2 py-1 text-[7px] font-black text-pr-gold">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="mt-3 text-[12px] font-black leading-4 text-white">{badge.titulo}</p>
                    <p className="mt-1 text-[9px] text-white/28">{dateLabel(badge.fecha)}</p>
                  </button>
                )
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-[28px] border border-white/[.08] bg-white/[.025] p-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-pr-gold/15 bg-pr-gold/[.07] text-3xl">🏅</div>
            <h2 className="mt-4 font-display text-2xl text-white">Tu colección empieza acá</h2>
            <p className="mt-2 text-sm leading-6 text-white/35">Cuando el equipo PR te otorgue una insignia, va a aparecer en esta pantalla.</p>
          </section>
        )}

        {selected && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <div className="w-full max-w-md rounded-[30px] border border-pr-gold/20 bg-[#111116] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto aspect-square max-w-[210px] overflow-hidden rounded-[28px] border border-pr-gold/15 bg-pr-gold/[.06] grid place-items-center">
                {imageFor(selected.titulo) ? <img src={imageFor(selected.titulo)} alt="" className="h-full w-full object-contain p-3" /> : <span className="text-6xl">🏅</span>}
              </div>
              <p className="mt-5 text-[9px] font-black uppercase tracking-[.18em] text-pr-gold">Insignia PR</p>
              <h2 className="mt-2 font-display text-[30px] leading-none text-white">{selected.titulo}</h2>
              {selected.descripcion && <p className="mt-3 text-sm leading-6 text-white/45">{selected.descripcion}</p>}
              <p className="mt-4 text-[10px] text-white/25">
                {dateLabel(selected.fecha)}
                {selected.creado_por_nombre ? ` · Otorgada por ${selected.creado_por_nombre}` : ''}
              </p>
              <button type="button" onClick={() => setSelected(null)} className="mt-5 w-full rounded-2xl bg-pr-gold py-4 text-sm font-black text-black">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
