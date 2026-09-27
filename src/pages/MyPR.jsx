import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'

const cards = [
  { to: '/app/perfil', eyebrow: 'TU IDENTIDAD', title: 'Mi perfil', text: 'Foto, historia, datos personales y configuración de tu identidad PR.', accent: 'orange', art: 'profile', wide: true },
  { to: '/app/avatar-premium', eyebrow: 'TU PERSONAJE', title: 'PR Roller', text: 'Creá y modificá tu identidad sobre ruedas.', accent: 'sky', art: 'roller' },
  { to: '/app/insignias', eyebrow: 'TU HISTORIA', title: 'Insignias', text: 'Logros, hitos y reconocimientos de tu camino PR.', accent: 'amber', art: 'medal' },
  { to: '/app/tracking', eyebrow: 'TU EQUIPO', title: 'PR Tracking', text: 'Identidad y protección NFC para tus equipos.', accent: 'emerald', art: 'track' },
  { to: '/app/prcard', eyebrow: 'BENEFICIOS', title: 'PR Card', text: 'Tu membresía, beneficios y comercios PR.', accent: 'gold', art: 'card' },
  { to: '/app/musica', eyebrow: 'TU RITMO', title: 'PR Music', text: 'Playlists y música para salir a rodar.', accent: 'violet', art: 'music' },
]

const tones = {
  orange: 'border-orange-300/20 from-orange-400/[.14] text-orange-200',
  sky: 'border-sky-300/15 from-sky-300/[.10] text-sky-200',
  amber: 'border-amber-300/15 from-amber-300/[.11] text-amber-200',
  emerald: 'border-emerald-300/15 from-emerald-300/[.10] text-emerald-200',
  gold: 'border-yellow-300/15 from-yellow-300/[.10] text-yellow-200',
  violet: 'border-violet-300/15 from-violet-300/[.11] text-violet-200',
}

function Art({ type }) {
  if (type === 'profile') return <div className="relative grid h-16 w-16 place-items-center rounded-[22px] border border-current/25 bg-current/10"><span className="text-3xl">◉</span><span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#151016] bg-orange-400"/></div>
  if (type === 'roller') return <div className="relative text-4xl"><span>🛼</span><span className="absolute -right-3 -top-2 h-3 w-3 animate-pulse rounded-full bg-sky-300"/></div>
  if (type === 'music') return <div className="flex h-14 items-end gap-1">{[18,34,25,45,31].map((h,i)=><span key={i} className="mi-pr-eq w-1.5 rounded-full bg-current/70" style={{height:h,animationDelay:`${i*110}ms`}}/>)}</div>
  if (type === 'track') return <div className="relative grid h-16 w-16 place-items-center"><span className="absolute h-14 w-14 animate-ping rounded-full border border-current/20"/><span className="absolute h-10 w-10 rounded-full border border-current/35"/><span className="text-xl font-black">NFC</span></div>
  if (type === 'card') return <div className="mi-pr-card relative h-12 w-[74px] overflow-hidden rounded-xl border border-current/30 bg-current/10"><span className="absolute left-3 top-3 h-2 w-5 rounded bg-current/60"/><span className="absolute bottom-3 left-3 h-1 w-10 rounded bg-current/30"/></div>
  return <div className="mi-pr-medal grid h-14 w-14 place-items-center rounded-full border border-current/30 bg-current/10 text-2xl">★</div>
}

export default function MyPR() {
  const { user } = useAuth()
  return <AppLayout title="Mi PR">
    <div className="pr-page space-y-5 pb-12 animate-page-enter">
      <section className="relative overflow-hidden rounded-[34px] border border-pr-gold/15 bg-gradient-to-br from-pr-gold/[.10] via-white/[.025] to-transparent p-5">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-pr-gold/10 blur-3xl"/>
        <p className="text-[9px] font-black uppercase tracking-[.24em] text-pr-gold">TU ECOSISTEMA</p>
        <h1 className="mt-2 font-display text-[38px] leading-none text-white">Mi PR</h1>
        <p className="mt-3 max-w-[320px] text-sm leading-6 text-white/42">{user?.nombre ? `${user.nombre}, ` : ''}tu identidad, beneficios, logros y herramientas personales viven acá.</p>
        <div className="mt-4 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]"/><span className="text-[9px] font-bold uppercase tracking-[.14em] text-white/30">Ecosistema personal activo</span></div>
      </section>
      <section className="grid grid-cols-2 gap-3">
        {cards.map((item)=><Link key={item.to} to={item.to} className={`group relative ${item.wide ? 'col-span-2 min-h-[175px]' : 'min-h-[205px]'} overflow-hidden rounded-[28px] border bg-gradient-to-br ${tones[item.accent]} via-white/[.025] to-[#09090d] p-4 active:scale-[.98]`}>
          <div className={`${item.wide ? 'absolute right-7 top-7' : 'flex h-20 items-center justify-center'}`}><Art type={item.art}/></div>
          <div className={item.wide ? 'max-w-[65%]' : ''}><p className={`${item.wide ? 'mt-2' : 'mt-2'} text-[8px] font-black uppercase tracking-[.18em] opacity-60`}>{item.eyebrow}</p><h2 className={`${item.wide ? 'mt-2 text-2xl' : 'mt-1 text-lg'} font-black text-white`}>{item.title}</h2><p className="mt-1 text-[10px] leading-4 text-white/34">{item.text}</p></div>
          <span className="absolute bottom-4 right-4 text-lg opacity-45 transition-transform group-hover:translate-x-1">→</span>
        </Link>)}
      </section>
      <p className="px-2 text-center text-[9px] leading-4 text-white/20">Mi PR reúne lo personal. Entrenamiento, comunidad y actividad siguen teniendo sus espacios propios.</p>
      <style>{`.mi-pr-eq{animation:eq 1.15s ease-in-out infinite alternate;transform-origin:bottom}@keyframes eq{to{transform:scaleY(.45);opacity:.45}}.mi-pr-card{animation:cardFloat 3s ease-in-out infinite}.mi-pr-card:after{content:'';position:absolute;inset:-20%;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.35),transparent 65%);transform:translateX(-120%);animation:shine 3.2s ease-in-out infinite}@keyframes cardFloat{50%{transform:translateY(-4px) rotate(-2deg)}}@keyframes shine{45%,100%{transform:translateX(120%)}}.mi-pr-medal{animation:medalGlow 2.8s ease-in-out infinite}@keyframes medalGlow{50%{box-shadow:0 0 26px currentColor;transform:translateY(-2px)}}@media(prefers-reduced-motion:reduce){.mi-pr-eq,.mi-pr-card,.mi-pr-card:after,.mi-pr-medal{animation:none!important}}`}</style>
    </div>
  </AppLayout>
}
