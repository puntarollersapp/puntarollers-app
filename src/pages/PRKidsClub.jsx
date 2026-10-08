import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const sections=[
  {icon:'✦',title:'Así entrenamos',detail:'Cada clase queda guardada con su fecha, ejercicios y fotografías autorizadas.',wide:true},
  {icon:'▦',title:'Mi pasaporte',detail:'Asistencias y sellos digitales, junto al pasaporte de papel.'},
  {icon:'◈',title:'Mis insignias',detail:'Reconocimientos por habilidades, compañerismo y constancia.'},
  {icon:'▧',title:'Galerías',detail:'Recuerdos privados de las clases y eventos.'},
  {icon:'◎',title:'Mi PR Kids ID',detail:'Identificación para registrar la asistencia por QR.'},
  {icon:'♡',title:'Mi hijo',detail:'Perfil deportivo y datos importantes para su cuidado.'},
  {icon:'◉',title:'Comunicados',detail:'Avisos y novedades para las familias.'},
]
export default function PRKidsClub(){
  const {user}=useAuth()
  return <main className="min-h-screen bg-[#0c1120] text-white">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_70%_0%,rgba(122,74,240,.27),transparent_60%)]"/>
    <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-7 sm:pt-12">
      <header className="mb-12 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3"><img src="/logo.png" alt="Punta Rollers" className="h-11 w-11 object-contain"/><span className="text-sm font-black tracking-wide">PUNTA ROLLERS</span></Link>
        <Link to={user?'/app/perfil':'/login'} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold hover:bg-white/10">{user?'Mi cuenta':'Ingresar'}</Link>
      </header>
      <div className="max-w-3xl">
        <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.18em] text-violet-200">Una nueva experiencia para las familias</span>
        <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">PR <span className="text-[#a995ff]">Kids Club.</span></h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">Cada clase, un recuerdo. Cada avance, un motivo para celebrar. El espacio familiar de los pequeños rollers de Punta Rollers.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={user?'/app/perfil':'/login'} className="rounded-xl bg-[#b5a0ff] px-6 py-3.5 text-sm font-black text-[#151126] shadow-[0_12px_35px_rgba(132,91,255,.22)] hover:bg-[#c6b6ff]">{user?'Ir a mi cuenta':'Ya tengo documento y PIN →'}</Link>
          <a href="https://wa.me/59899220929?text=Hola%2C%20quiero%20solicitar%20el%20acceso%20familiar%20a%20PR%20Kids%20Club." target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10">Solicitar acceso familiar</a>
        </div>
        <p className="mt-4 max-w-xl text-xs leading-relaxed text-slate-400">El acceso a los perfiles de menores requiere vinculación y autorización de Punta Rollers. Si ya sos alumno, conservás tu documento y PIN actuales. La experiencia privada está en preparación.</p>
      </div>
      <section className="mt-14 grid gap-3 sm:grid-cols-2">
        {sections.map(s=><article key={s.title} className={`rounded-2xl border border-white/10 bg-[#19233a] p-6 ${s.wide?'sm:col-span-2 bg-[linear-gradient(110deg,#33235d,#19233a)]':''}`}>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl text-[#c5b5ff]">{s.icon}</div>
          <h2 className="text-xl font-black">{s.title}</h2><p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">{s.detail}</p>
        </article>)}
      </section>
      <section className="mt-8 rounded-2xl border border-[#aa97ff]/20 bg-[#1d1a37] p-6">
        <p className="text-xs font-black uppercase tracking-widest text-[#c4b4ff]">Para madres, padres y tutores</p>
        <h2 className="mt-2 text-2xl font-black">Una cuenta. Sus aventuras sobre ruedas.</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">Quienes ya tienen una cuenta de alumno conservarán su acceso habitual. PR Kids Club solo se habilitará cuando Punta Rollers confirme el vínculo familiar. Las fotografías y los datos de salud estarán sujetos a permisos específicos.</p>
      </section>
      <footer className="mt-12 text-center text-xs text-slate-500">Punta Rollers · No es solo patinar, es pertenecer.</footer>
    </div>
  </main>
}