import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PRMomentsRail({ currentProfileId }) {
  const navigate = useNavigate()
  const [moments, setMoments] = useState([])
  const [profiles, setProfiles] = useState({})

  async function load() {
    const { data } = await supabase
      .from('pr_moments')
      .select('id,profile_id,media_type,caption,created_at,expires_at')
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(100)
    const rows = data || []
    setMoments(rows)
    const ids = [...new Set(rows.map((row) => row.profile_id).filter(Boolean))]
    if (!ids.length) return setProfiles({})
    const { data: people } = await supabase
      .from('profiles_feed')
      .select('id,nombre,apellido,foto')
      .in('id', ids)
    setProfiles(Object.fromEntries((people || []).map((person) => [String(person.id), person])))
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 60000)
    return () => window.clearInterval(timer)
  }, [])

  const groups = useMemo(() => {
    const map = new Map()
    moments.forEach((moment) => {
      const key = String(moment.profile_id)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(moment)
    })
    return [...map.entries()]
  }, [moments])

  return (
    <section className="rounded-[28px] border border-violet-300/10 bg-gradient-to-br from-violet-500/[.08] via-[#0b0b10] to-[#09090d] px-4 py-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-violet-300">PR MOMENTS</p><p className="mt-1 text-xs text-white/35">24 horas. Tu momento. Tu roll.</p></div>
        <button type="button" onClick={() => navigate('/app/moments?create=1')} className="rounded-2xl border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-[10px] font-black text-violet-200">+ Nuevo</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => navigate('/app/moments?create=1')} className="flex w-[72px] shrink-0 flex-col items-center gap-2"><div className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-violet-300/40 bg-violet-400/[.07] text-2xl text-violet-200">+</div><span className="text-[9px] font-bold text-white/45">Tu momento</span></button>
        {groups.map(([profileId, items]) => {
          const profile = profiles[profileId] || {}
          const name = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Roller PR'
          const own = String(profileId) === String(currentProfileId)
          return <button key={profileId} type="button" onClick={() => navigate(`/app/moments?moment=${items[0].id}`)} className="flex w-[72px] shrink-0 flex-col items-center gap-2"><div className={`grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 ${own ? 'border-amber-300' : 'border-violet-400'} bg-white/[.04] p-[2px]`}>{profile.foto ? <img src={profile.foto} alt={name} className="h-full w-full rounded-full object-cover" /> : <span>🛼</span>}</div><span className="max-w-[70px] truncate text-[9px] font-bold text-white/55">{own ? 'Vos' : name.split(' ')[0]}</span></button>
        })}
      </div>
    </section>
  )
}
