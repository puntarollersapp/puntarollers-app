import PublicLayout from '../layouts/PublicLayout'

const items = [
  { title: 'Identidad', text: 'Cada chip identifica un equipo registrado dentro del ecosistema Punta Rollers.', icon: 'id' },
  { title: 'Recuperación', text: 'Si el equipo se pierde, el Track ID permite acceder a los datos de contacto autorizados por su dueño.', icon: 'search' },
  { title: 'Una URL por equipo', text: 'La información vive en Punta Rollers: un mismo equipo puede usar uno o varios NFC físicos sin cambiar su URL, incluso si se reemplaza un chip.', icon: 'link' },
]

function Icon({ type }) {
  const p = { width: 25, height: 25, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'id') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c.5-1.8 1.3-2.7 2.5-2.7s2 .9 2.5 2.7M14 9h4M14 13h4"/></svg>
  if (type === 'search') return <svg {...p}><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg>
  return <svg {...p}><path d="M10 13a5 5 0 0 0 7.1.1l1.8-1.8a5 5 0 0 0-7.1-7.1L10.7 5.3"/><path d="M14 11a5 5 0 0 0-7.1-.1l-1.8 1.8a5 5 0 0 0 7.1 7.1l1.1-1.1"/></svg>
}

export default function TrackingPublic() {
  return <PublicLayout><div className="px-4 py-8 pb-14"><section className="relative overflow-hidden rounded-[34px] border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[.12] via-white/[.025] to-transparent p-6"><div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl"/><div className="relative"><div className="mb-5 grid h-16 w-16 place-items-center rounded-[22px] border border-emerald-200/20 bg-emerald-300/[.08] text-emerald-200"><span className="text-[12px] font-black tracking-[.12em]">NFC</span></div><p className="text-[9px] font-black uppercase tracking-[.24em] text-emerald-200/70">PUNTA ROLLERS · TRACK ID</p><h1 className="mt-2 font-display text-[42px] leading-none text-white">PR Tracking</h1><p className="mt-4 max-w-md text-sm leading-6 text-white/50">Identidad digital para el equipamiento de nuestros alumnos. Un sistema pensado para vincular, identificar y ayudar a recuperar lo que sale a rodar con vos.</p></div></section><section className="mt-5 grid gap-3">{items.map(item=><article key={item.title} className="rounded-[26px] border border-white/[.07] bg-white/[.035] p-5"><div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] text-emerald-200"><Icon type={item.icon}/></div><div><h2 className="font-black text-white">{item.title}</h2><p className="mt-1 text-xs leading-5 text-white/40">{item.text}</p></div></div></article>)}</section><section className="mt-5 rounded-[28px] border border-white/[.06] bg-black/20 p-5"><p className="text-[9px] font-black uppercase tracking-[.2em] text-white/30">PRIVACIDAD POR DISEÑO</p><p className="mt-2 text-sm leading-6 text-white/45">El Track ID muestra únicamente la información habilitada para identificación y contacto. El perfil privado del alumno y sus datos internos de Punta Rollers no forman parte de la ficha pública.</p></section></div></PublicLayout>
}
