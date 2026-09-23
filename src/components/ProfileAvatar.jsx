function profileName(profile) {
  return profile?.nombre_completo || profile?.display_name || [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || 'Integrante PR'
}

function profilePhoto(profile) {
  return profile?.foto_url || profile?.photo_url || profile?.avatar_url || profile?.foto || profile?.avatar || ''
}

function isProfessor(profile) {
  return Boolean(profile?.es_profesor) || profile?.role === 'profesor' || profile?.role === 'admin'
}

function initials(name) {
  return String(name || 'PR').split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]?.toUpperCase()).join('') || 'PR'
}

export default function ProfileAvatar({ profile, className='h-14 w-14', rounded='rounded-full', badge=true, imageClassName='' }) {
  const name=profileName(profile), photo=profilePhoto(profile), professor=isProfessor(profile)
  return <div className={`relative shrink-0 ${className}`} title={professor ? `${name} · Profe` : name}>
    <div className={`grid h-full w-full place-items-center overflow-hidden border border-white/10 bg-gradient-to-br from-orange-400/20 to-violet-500/15 ${rounded}`}>
      {photo ? <img src={photo} alt={name} className={`h-full w-full object-cover ${imageClassName}`} /> : <span className="text-xs font-black text-white/75">{initials(name)}</span>}
    </div>
    {badge && professor && <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-200/30 bg-[#f3c64f] px-2 py-[3px] text-[7px] font-black uppercase tracking-[.13em] text-black shadow-[0_5px_14px_rgba(0,0,0,.38)]">PROFE</span>}
  </div>
}

export { isProfessor, profileName, profilePhoto }
