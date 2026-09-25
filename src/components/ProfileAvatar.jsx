function profileName(profile) {
  return profile?.nombre_completo || profile?.display_name || [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || 'Integrante PR'
}

function profilePhoto(profile) {
  return profile?.foto_url || profile?.photo_url || profile?.avatar_url || profile?.foto || profile?.avatar || ''
}

function isTreasury(profile) {
  // es_tesoreria is the canonical flag. Lucia's stable profile id keeps the
  // community badge correct even in older community RPC payloads that do not
  // yet expose that private permission flag.
  return Boolean(profile?.es_tesoreria) || profile?.id === 'alumno-48812609'
}

function isProfessor(profile) {
  if (isTreasury(profile)) return false
  return Boolean(profile?.es_profesor) || profile?.role === 'profesor' || profile?.role === 'admin'
}

function initials(name) {
  return String(name || 'PR').split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]?.toUpperCase()).join('') || 'PR'
}

export default function ProfileAvatar({ profile, className='h-14 w-14', rounded='rounded-full', badge=true, imageClassName='' }) {
  const name=profileName(profile), photo=profilePhoto(profile), treasury=isTreasury(profile), professor=isProfessor(profile)
  const title=treasury ? `${name} · Tesorera` : professor ? `${name} · Profe` : name
  return <div className={`relative shrink-0 ${className}`} title={title}>
    <div className={`grid h-full w-full place-items-center overflow-hidden border border-white/10 bg-gradient-to-br from-orange-400/20 to-violet-500/15 ${rounded}`}>
      {photo ? <img src={photo} alt={name} className={`h-full w-full object-cover ${imageClassName}`} /> : <span className="text-xs font-black text-white/75">{initials(name)}</span>}
    </div>
    {badge && treasury && <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-200/25 bg-emerald-300 px-2 py-[3px] text-[7px] font-black uppercase tracking-[.13em] text-[#07120d] shadow-[0_5px_14px_rgba(0,0,0,.38)]">TESORERA</span>}
    {badge && !treasury && professor && <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-200/30 bg-[#f3c64f] px-2 py-[3px] text-[7px] font-black uppercase tracking-[.13em] text-black shadow-[0_5px_14px_rgba(0,0,0,.38)]">PROFE</span>}
  </div>
}

export { isProfessor, isTreasury, profileName, profilePhoto }
