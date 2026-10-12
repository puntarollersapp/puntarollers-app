import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProfileAvatar from './ProfileAvatar'

function birthdayParts(value) {
  const raw = String(value || '').trim()
  const iso = raw.match(/^(?:\d{4})-(\d{2})-(\d{2})/)
  if (iso) return { month: Number(iso[1]), day: Number(iso[2]) }
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : { month: date.getMonth() + 1, day: date.getDate() }
}

export default function CommunityBirthdays() {
  const [people, setPeople] = useState([])
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    supabase.from('profiles_feed').select('id,nombre,apellido,foto,fecha_nacimiento,verificado').limit(500).then(({data,error:err}) => {
      if (!active) return
      if (err) setError(true)
      else setPeople(data || [])
    })
    return () => { active = false }
  }, [])
  const upcoming = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
    return people.map(person => {
      const parts = birthdayParts(person.fecha_nacimiento)
      if (!parts) return null
      let next = new Date(now.getFullYear(), parts.month - 1, parts.day, 12)
      if (next.getMonth() !== parts.month - 1 || next.getDate() !== parts.day) return null
      if (next < today) next = new Date(now.getFullYear() + 1, parts.month - 1, parts.day, 12)
      const days = Math.round((next - today) / 86400000)
      return days <= 60 ? { ...person, days, date: next } : null
    }).filter(Boolean).sort((a,b) => a.days - b.days).slice(0,6)
  }, [people])
  return <section className="rounded-[28px] border border-[#FF0055]/20 bg-[radial-gradient(ellipse_at_100%_0%,rgba(255,0,85,.10),transparent_60%),#0D0303] p-4">
    <p className="text-[10px] font-black uppercase tracking-[.19em] text-[#FF77A3]">Agenda de la comunidad</p>
    <h2 className="mt-1 font-display text-[27px] text-white">Próximos cumpleaños<span className="text-[#FF0055]">.</span></h2>
    {upcoming.length ? <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{upcoming.map(person => <div key={person.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-2.5"><ProfileAvatar profile={person} className="h-11 w-11 shrink-0" rounded="rounded-full"/><div className="min-w-0"><p className="truncate text-[11px] font-bold text-white">{[person.nombre,person.apellido].filter(Boolean).join(' ')}</p><p className="mt-0.5 text-[10px] text-white/50">{person.days === 0 ? '¡Hoy!' : person.days === 1 ? 'Mañana' : person.date.toLocaleDateString('es-UY',{day:'numeric',month:'short'})}</p></div></div>)}</div> : <p className="mt-3 text-xs text-white/45">{error ? 'Los cumpleaños no están disponibles por ahora.' : 'No hay cumpleaños próximos para mostrar.'}</p>}
  </section>
}
