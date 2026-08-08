import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const DEFAULT_AVATAR = {
  skin: '#D3A07C',
  hair: '#181411',
  hairStyle: 'texture',
  face: 'relaxed',
  top: 'pr-black',
  helmet: 'orange',
  protection: 'black',
  skateType: '4w',
  skateModel: 'fitness',
  skateColor: '#17191F',
  wheelColor: '#FF6B1A',
}

const SKINS = ['#F2D4C0','#E9BC98','#D3A07C','#B77A58','#89583F','#5C3B2E']
const HAIR_COLORS = ['#171310','#3A251B','#72472E','#B67C46','#C7A36F','#D9D9D9']
const HAIRS = [
  ['texture','Textura'],['crop','Corto'],['wave','Ondas'],['fade','Fade'],['long','Largo'],['bun','Rodete']
]
const FACES = [['relaxed','Relax'],['focus','Focus'],['smile','Sonrisa'],['cool','Cool']]
const TOPS = [
  { id:'pr-black', label:'PR Black', body:'#101116', detail:'#E8BC52' },
  { id:'racing', label:'Racing', body:'#111217', detail:'#FF6B1A' },
  { id:'pr-red', label:'PR Red', body:'#A71F27', detail:'#FFFFFF' },
  { id:'pr-blue', label:'PR Blue', body:'#185A87', detail:'#FFFFFF' },
  { id:'pr-pink', label:'PR Pink', body:'#A63B75', detail:'#FFFFFF' },
  { id:'pr-white', label:'PR White', body:'#F0F0F0', detail:'#171717' },
]
const HELMETS = [
  ['orange','PR Orange','#FF6B1A'],['black','Carbon','#17191D'],['white','Ice','#EFEFEF'],
  ['blue','Electric','#2563EB'],['pink','Pink','#D9468A'],['none','Sin casco','transparent']
]
const PROTECTION = [
  ['black','Carbon','#17191D'],['orange','Orange','#FF6B1A'],['white','Ice','#EFEFEF'],['none','Minimal','transparent']
]
const SKATES = [
  { id:'fitness', type:'4w', label:'Fitness 4', desc:'Bota alta · control', wheels:4, low:false },
  { id:'urban4', type:'4w', label:'Urban 4', desc:'Calle · maniobra', wheels:4, low:false },
  { id:'speed4', type:'4w', label:'Speed 4', desc:'Bota baja · pista', wheels:4, low:true },
  { id:'triskate', type:'3w', label:'Tri Skate', desc:'3 ruedas · versátil', wheels:3, low:false },
  { id:'endurance3', type:'3w', label:'Endurance 3', desc:'Ruta · distancia', wheels:3, low:false },
  { id:'speed3', type:'3w', label:'Speed 3', desc:'Bota baja · racing', wheels:3, low:true },
]
const CATS = [
  ['skin','Piel'],['hair','Pelo'],['face','Rostro'],['top','Ropa'],['helmet','Casco'],['protection','Protección'],['skates','Patines']
]

function savedUser(){try{return JSON.parse(localStorage.getItem('pr_user')||'{}')}catch{return{}}}
function clamp(v,min=0,max=100){return Math.max(min,Math.min(max,Number(v)||0))}
function merged(v){return {...DEFAULT_AVATAR,...(v&&typeof v==='object'?v:{})}}

export default function RollerAvatar(){
  const {user,updateUser}=useAuth()
  const base={...savedUser(),...user}
  const profileId=base.id
  const [avatar,setAvatar]=useState(DEFAULT_AVATAR)
  const [cat,setCat]=useState('skin')
  const [stats,setStats]=useState({km:0,sessions:0})
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{
    let alive=true
    async function load(){
      const [p,a]=await Promise.all([
        supabase.from('profiles').select('pr_avatar').eq('id',profileId).maybeSingle(),
        supabase.from('pr_activities').select('distancia_metros').eq('alumno_id',profileId).eq('fuente','strava').eq('eliminada',false).limit(1000),
      ])
      if(!alive)return
      if(!p.error)setAvatar(merged(p.data?.pr_avatar))
      if(!a.error){
        const rows=a.data||[]
        setStats({sessions:rows.length,km:rows.reduce((s,r)=>s+(Number(r.distancia_metros)||0)/1000,0)})
      }
    }
    if(profileId)load()
    return()=>{alive=false}
  },[profileId])

  const energy=useMemo(()=>clamp(Math.min(82,stats.km/3)+Math.min(18,stats.sessions*.8)),[stats])
  const level=stats.km>=500?'Leyenda PR':stats.km>=250?'Motor PR':stats.km>=100?'Ritmo PR':stats.km>=25?'En movimiento':'Primeras vueltas'
  const patch=(x)=>setAvatar(v=>({...v,...x}))

  async function save(){
    try{
      setSaving(true);setMessage('Guardando…')
      const {error}=await supabase.from('profiles').update({pr_avatar:avatar,updated_at:new Date().toISOString()}).eq('id',profileId)
      if(error)throw error
      const next={...base,pr_avatar:avatar}
      localStorage.setItem('pr_user',JSON.stringify(next));updateUser?.({pr_avatar:avatar})
      setMessage('✓ Tu patinador quedó guardado.')
    }catch(e){setMessage(`No pudimos guardar: ${e.message}`)}finally{setSaving(false)}
  }

  return <AppLayout title="Mi patinador">
    <div className="pr-page space-y-4 animate-page-enter pb-9">
      <section className="overflow-hidden rounded-[32px] border border-orange-300/18 bg-[#08090c] shadow-[0_30px_90px_rgba(0,0,0,.45)]">
        <div className="relative p-5 pb-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_0%,rgba(249,115,22,.14),transparent_60%)]"/>
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.21em] text-orange-300">PR Roller Studio</p>
              <h1 className="mt-3 font-display text-[34px] leading-[.94] text-white">Diseñá tu<br/>identidad PR.</h1>
              <p className="mt-2 text-[11px] leading-5 text-white/36">Más deportivo. Más adulto. Más vos.</p>
            </div>
            <button disabled={saving} onClick={save} className="rounded-2xl bg-orange-400 px-4 py-3 text-xs font-black text-black">{saving?'…':'Guardar'}</button>
          </div>
        </div>

        <div className="relative min-h-[535px] overflow-hidden border-y border-white/[.06] bg-gradient-to-b from-[#111218] via-[#090a0e] to-[#07070a]">
          <StudioBackdrop energy={energy}/>
          <div className="absolute left-4 top-4 z-20 rounded-[18px] border border-white/[.08] bg-black/40 px-3 py-2.5 backdrop-blur-md">
            <p className="text-[7px] font-black uppercase tracking-[.15em] text-white/30">Energía PR</p>
            <p className="mt-1 font-display text-[27px] leading-none text-white">{Math.round(energy)}<span className="text-xs text-white/25">%</span></p>
          </div>
          <div className="absolute right-4 top-4 z-20 rounded-[18px] border border-orange-300/14 bg-black/40 px-3 py-2.5 text-right backdrop-blur-md">
            <p className="text-[7px] font-black uppercase tracking-[.15em] text-orange-200/55">{level}</p>
            <p className="mt-1 text-xs font-black text-orange-200">{stats.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p>
          </div>

          <StudioAvatar avatar={avatar}/>

          <div className="absolute bottom-4 left-4 right-4 z-20 rounded-[18px] border border-white/[.07] bg-black/45 px-3 py-3 backdrop-blur-md">
            <div className="flex justify-between text-[9px] font-bold text-white/40"><span>⚡ Energía conectada a Strava</span><span className="text-orange-200">{stats.sessions} entrenos</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300" style={{width:`${Math.max(4,energy)}%`}}/></div>
          </div>
        </div>

        <div className="p-3">
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATS.map(([id,label])=><button key={id} onClick={()=>setCat(id)}
              className={`min-w-[82px] rounded-[17px] border px-3 py-2.5 text-left ${cat===id?'border-orange-300/28 bg-orange-400/[.09]':'border-transparent bg-white/[.025]'}`}>
              <CatIcon type={id} active={cat===id}/><p className={`mt-2 text-[8px] font-black uppercase tracking-[.08em] ${cat===id?'text-orange-200':'text-white/32'}`}>{label}</p>
            </button>)}
          </div>
        </div>
      </section>

      <section className="rounded-[29px] border border-white/[.08] bg-[#0d0e12] p-4"><Editor cat={cat} avatar={avatar} patch={patch}/></section>

      <section className="rounded-[25px] border border-orange-300/12 bg-orange-400/[.045] p-4">
        <p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-300">Sistema vivo</p>
        <p className="mt-2 text-sm font-black text-white">Tu avatar no es una pegatina.</p>
        <p className="mt-1 text-[11px] leading-5 text-white/36">La energía del estudio responde a tus kilómetros reales. Más constancia, más presencia visual.</p>
      </section>

      {message&&<div className="rounded-[20px] border border-orange-300/15 bg-orange-400/[.07] p-3 text-xs text-orange-100/65">{message}</div>}
      <div className="grid grid-cols-2 gap-2"><Link to="/app/perfil" className="rounded-2xl border border-white/[.08] bg-white/[.03] py-4 text-center text-xs font-bold text-white/55">Volver</Link><button onClick={save} className="rounded-2xl bg-orange-400 py-4 text-xs font-black text-black">Guardar</button></div>
    </div>
  </AppLayout>
}

function StudioBackdrop({energy}){
  return <svg viewBox="0 0 390 535" className="absolute inset-0 h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#161820"/><stop offset="1" stopColor="#08090c"/></linearGradient>
      <linearGradient id="bolt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFB36C" stopOpacity={.12+energy/600}/><stop offset=".5" stopColor="#FF6B1A" stopOpacity={.04+energy/600}/><stop offset="1" stopColor="#FACC15" stopOpacity=".02"/></linearGradient>
      <radialGradient id="spot"><stop offset="0" stopColor="#fff" stopOpacity=".06"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation={3+energy/24}/></filter>
    </defs>
    <rect width="390" height="535" fill="url(#floor)"/>
    <ellipse cx="195" cy="170" rx="165" ry="220" fill="url(#spot)"/>
    <path d="M267 42 139 280h78l-61 216 139-268h-86z" fill="url(#bolt)" filter="url(#glow)"/>
    <path d="M18 432h354" stroke="#fff" strokeOpacity=".035"/>
    <ellipse cx="198" cy="457" rx="128" ry="22" fill="#FF6B1A" opacity=".055"/>
  </svg>
}

function StudioAvatar({avatar}){
  const top=TOPS.find(x=>x.id===avatar.top)||TOPS[0]
  const helmet=HELMETS.find(x=>x[0]===avatar.helmet)||HELMETS[0]
  const protect=PROTECTION.find(x=>x[0]===avatar.protection)||PROTECTION[0]
  const skate=SKATES.find(x=>x.id===avatar.skateModel)||SKATES[0]

  return <svg viewBox="0 0 360 520" className="absolute bottom-8 left-1/2 z-10 h-[470px] w-[330px] -translate-x-1/2" aria-label="Vista previa de tu patinador">
    <defs>
      <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={avatar.skin}/><stop offset=".7" stopColor={avatar.skin}/><stop offset="1" stopColor="#6b3f2d" stopOpacity=".35"/></linearGradient>
      <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={top.body}/><stop offset=".68" stopColor={top.body}/><stop offset="1" stopColor="#000" stopOpacity=".28"/></linearGradient>
      <filter id="bodyShadow"><feDropShadow dx="0" dy="9" stdDeviation="8" floodOpacity=".32"/></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="1.1"/></filter>
    </defs>

    <ellipse cx="182" cy="476" rx="112" ry="17" fill="#000" opacity=".5"/>

    {/* rear leg */}
    <path d="M173 337c16-5 31-1 42 8l19 89-34 7-36-81z" fill="#15161b" filter="url(#bodyShadow)"/>
    {/* front leg */}
    <path d="M128 334c15-7 31-5 43 4l-12 104-37-2-7-79z" fill="#191a1f" filter="url(#bodyShadow)"/>

    {/* torso: athletic tapered, slight twist */}
    <path d="M113 213c23-16 79-18 110 2 12 30 21 68 23 111-31 20-101 22-139 3 4-44 6-82 6-116Z" fill="url(#shirt)" stroke="rgba(255,255,255,.09)" filter="url(#bodyShadow)"/>
    <path d="M121 229c29 9 60 9 92-1" fill="none" stroke={top.detail} strokeWidth="5.5" strokeLinecap="round"/>
    <path d="M131 309c24 8 54 8 82 0" fill="none" stroke="#fff" strokeOpacity=".05" strokeWidth="2"/>
    <text x="168" y="275" textAnchor="middle" fill={top.detail} fontSize="22" fontWeight="900" letterSpacing="3">PR</text>

    {/* left arm relaxed, angled */}
    <path d="M117 224c-21 8-34 27-43 57-9 31-8 66 11 80 15 10 30 0 31-18l9-72 15-31z" fill="url(#skin)" stroke="rgba(0,0,0,.12)"/>
    {/* right arm slightly back */}
    <path d="M218 225c20 10 31 31 40 62 8 29 8 61-8 76-14 12-31 4-33-15l-10-73-13-33z" fill="url(#skin)" stroke="rgba(0,0,0,.12)"/>

    {/* elbows/wrists */}
    {avatar.protection!=='none'&&<>
      <path d="M75 300c10-8 31-6 41 4l-3 29c-13 8-30 8-41-1z" fill={protect[2]} stroke="rgba(255,255,255,.12)"/>
      <path d="M218 303c11-10 31-12 41-4l5 29c-10 10-28 12-41 4z" fill={protect[2]} stroke="rgba(255,255,255,.12)"/>
    </>}

    {/* neck */}
    <path d="M145 173h43l4 48-50 2z" fill="url(#skin)"/>

    {/* back hair for long */}
    {avatar.hairStyle==='long'&&<path d="M107 104c5-68 121-69 128-1l-12 126-45-29-58 31z" fill={avatar.hair}/>}

    {/* head 3/4 */}
    <path d="M105 105c4-57 116-61 125-5l-3 42c-4 46-30 72-65 70-36-2-58-30-57-72z" fill="url(#skin)" stroke="rgba(0,0,0,.12)" filter="url(#bodyShadow)"/>

    <Hair id={avatar.hairStyle} color={avatar.hair}/>

    {avatar.helmet!=='none'&&<>
      <path d="M101 112c-5-70 128-74 133 3l-10 12c-34-11-72-12-111 0z" fill={helmet[2]} stroke="rgba(0,0,0,.25)" strokeWidth="2"/>
      <path d="M118 95c28-17 63-19 94-7" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round"/>
      <path d="M220 122c9 13 11 27 8 43" fill="none" stroke="#171717" strokeWidth="4" strokeLinecap="round"/>
      <path d="M116 110h18M153 100h18M190 106h17" stroke="#000" strokeOpacity=".25" strokeWidth="3" strokeLinecap="round"/>
    </>}

    <Face id={avatar.face}/>

    {/* subtle nose / ear */}
    <path d="M169 145c-2 6-2 11 2 13" fill="none" stroke="#6e4637" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="108" cy="145" rx="5" ry="9" fill={avatar.skin} opacity=".9"/>

    {/* hands */}
    <path d="M75 351c9-10 25-7 30 3 3 7 1 15-5 21-8 8-21 7-27-2-5-8-4-16 2-22z" fill="url(#skin)"/>
    <path d="M237 354c7-11 23-12 30-3 6 7 6 16 1 24-6 9-19 11-27 4-8-6-10-16-4-25z" fill="url(#skin)"/>

    {/* skates, perspective */}
    <g transform="translate(83 418) rotate(-5) scale(1.05)"><Skate wheels={skate.wheels} low={skate.low} boot={avatar.skateColor} wheel={avatar.wheelColor}/></g>
    <g transform="translate(179 422) rotate(4) scale(1.05)"><Skate wheels={skate.wheels} low={skate.low} boot={avatar.skateColor} wheel={avatar.wheelColor}/></g>
  </svg>
}

function Hair({id,color}){
  if(id==='bun')return <><circle cx="174" cy="64" r="25" fill={color}/><path d="M104 112c8-50 112-57 126-8-25-19-50-20-72-15-19 4-34 12-54 23z" fill={color}/></>
  if(id==='long')return <path d="M104 112c7-52 114-60 127-6-27-21-56-22-79-16-18 4-33 12-48 22z" fill={color}/>
  if(id==='wave')return <path d="M103 113c3-53 120-62 131-5-13-14-26-26-43-15-13 8-22-12-38-3-13 8-28-7-50 23z" fill={color}/>
  if(id==='fade')return <path d="M113 101c14-36 92-39 108-1-32-12-76-12-108 1z" fill={color}/>
  if(id==='crop')return <path d="M107 107c11-44 110-50 120-3-34-14-85-13-120 3z" fill={color}/>
  return <path d="M104 112c4-49 116-58 127-7-20-18-37-7-51-17-15 14-32 0-76 24z" fill={color}/>
}

function Face({id}){
  if(id==='cool')return <><path d="M127 132h29l-5 16h-19zM174 132h29l-5 16h-19z" fill="#171717"/><path d="M156 136h18" stroke="#171717" strokeWidth="3"/><path d="M149 169c10 5 20 5 29-1" fill="none" stroke="#211c1a" strokeWidth="3.2" strokeLinecap="round"/></>
  return <>
    <ellipse cx="142" cy="139" rx="5.7" ry={id==='focus'?4.2:6.2} fill="#211c1a"/>
    <ellipse cx="187" cy="138" rx="5.7" ry={id==='focus'?4.2:6.2} fill="#211c1a"/>
    <circle cx="140" cy="136.5" r="1.5" fill="#fff" opacity=".8"/><circle cx="185" cy="135.5" r="1.5" fill="#fff" opacity=".8"/>
    <path d={id==='focus'?'M151 168c8 1 16 1 24-1':id==='smile'?'M148 165c10 12 22 12 32 0':'M149 166c10 8 21 8 30-1'} fill="none" stroke="#211c1a" strokeWidth="3.2" strokeLinecap="round"/>
    <path d={id==='focus'?'M134 127c5-3 10-3 15-1M180 126c5-3 10-3 15-1':''} fill="none" stroke="#3a2c28" strokeWidth="2" strokeLinecap="round"/>
  </>
}

function Skate({wheels,low,boot,wheel}){
  const xs=wheels===3?[15,40,65]:[10,29,48,67]
  return <g>
    <path d={low?'M4 20 13 3h39l19 17-8 20H7z':'M4 34 10 0h35l9 18 21 11-9 18H8z'} fill={boot} stroke="rgba(255,255,255,.22)" strokeWidth="1.5"/>
    {!low&&<><path d="M16 11h27M15 17h31M14 23h34" stroke="#fff" strokeOpacity=".32" strokeWidth="1.5" strokeLinecap="round"/><path d="M31 4v25" stroke="#fff" strokeOpacity=".18" strokeWidth="1.2"/></>}
    <path d="M8 46h70" stroke="#8b8b8b" strokeWidth="4" strokeLinecap="round"/>
    <path d="M14 44h58" stroke="#c5c5c5" strokeOpacity=".35" strokeWidth="1"/>
    {xs.map(x=><g key={x}><circle cx={x} cy="55" r={wheels===3?9.5:7.7} fill={wheel} stroke="#121212" strokeWidth="1.5"/><circle cx={x} cy="55" r="2.6" fill="#3d3d3d"/><circle cx={x-2} cy="52.5" r="1.4" fill="#fff" opacity=".28"/></g>)}
  </g>
}

function Editor({cat,avatar,patch}){
  if(cat==='skin')return <Shell eyebrow="Identidad" title="Tono de piel"><div className="grid grid-cols-3 gap-2">{SKINS.map(c=><Color key={c} c={c} active={avatar.skin===c} onClick={()=>patch({skin:c})}/>)}</div></Shell>
  if(cat==='hair')return <Shell eyebrow="Estilo" title="Pelo"><div className="grid grid-cols-3 gap-2">{HAIRS.map(([id,label])=><SimpleChoice key={id} active={avatar.hairStyle===id} label={label} onClick={()=>patch({hairStyle:id})}><HairPreview id={id} color={avatar.hair}/></SimpleChoice>)}</div><Sub>Color</Sub><div className="grid grid-cols-3 gap-2">{HAIR_COLORS.map(c=><Color key={c} c={c} active={avatar.hair===c} onClick={()=>patch({hair:c})}/>)}</div></Shell>
  if(cat==='face')return <Shell eyebrow="Expresión" title="Rostro"><div className="grid grid-cols-2 gap-2">{FACES.map(([id,label])=><SimpleChoice key={id} active={avatar.face===id} label={label} onClick={()=>patch({face:id})}><FacePreview id={id}/></SimpleChoice>)}</div></Shell>
  if(cat==='top')return <Shell eyebrow="Punta Rollers" title="Ropa"><div className="grid grid-cols-2 gap-2">{TOPS.map(x=><button key={x.id} onClick={()=>patch({top:x.id})} className={`rounded-[19px] border p-3 text-left ${avatar.top===x.id?'border-orange-300/35 bg-orange-400/[.08]':'border-white/[.07] bg-white/[.025]'}`}><div className="relative h-16 rounded-[15px]" style={{background:x.body}}><div className="absolute left-1/2 top-5 h-1.5 w-12 -translate-x-1/2 rounded-full" style={{background:x.detail}}/><span className="absolute inset-x-0 top-8 text-center text-[9px] font-black tracking-[.14em]" style={{color:x.detail}}>PR</span></div><p className="mt-2 text-[9px] font-bold text-white/55">{x.label}</p></button>)}</div></Shell>
  if(cat==='helmet')return <Shell eyebrow="Protección" title="Casco"><div className="grid grid-cols-3 gap-2">{HELMETS.map(([id,label,c])=><SimpleChoice key={id} active={avatar.helmet===id} label={label} onClick={()=>patch({helmet:id})}><HelmetPreview color={c} none={id==='none'}/></SimpleChoice>)}</div></Shell>
  if(cat==='protection')return <Shell eyebrow="Equipamiento" title="Protecciones"><div className="grid grid-cols-2 gap-2">{PROTECTION.map(([id,label,c])=><SimpleChoice key={id} active={avatar.protection===id} label={label} onClick={()=>patch({protection:id})}><ProtectPreview color={c}/></SimpleChoice>)}</div></Shell>
  return <SkateEditor avatar={avatar} patch={patch}/>
}

function SkateEditor({avatar,patch}){
  const items=SKATES.filter(x=>x.type===avatar.skateType)
  function type(t){const first=SKATES.find(x=>x.type===t);patch({skateType:t,skateModel:first.id})}
  return <Shell eyebrow="Tu setup" title="Patines">
    <div className="grid grid-cols-2 gap-2">{['3w','4w'].map(t=><button key={t} onClick={()=>type(t)} className={`rounded-[19px] border p-3 text-left ${avatar.skateType===t?'border-orange-300/35 bg-orange-400/[.08]':'border-white/[.07] bg-white/[.025]'}`}><p className="font-display text-[28px] text-white">{t==='3w'?3:4} <span className="text-xs text-white/30">ruedas</span></p><SkatePreview wheels={t==='3w'?3:4} boot={avatar.skateColor} wheel={avatar.wheelColor}/></button>)}</div>
    <Sub>Modelo</Sub>
    <div className="space-y-2">{items.map(x=><button key={x.id} onClick={()=>patch({skateModel:x.id})} className={`flex w-full items-center gap-3 rounded-[19px] border p-3 text-left ${avatar.skateModel===x.id?'border-orange-300/35 bg-orange-400/[.08]':'border-white/[.07] bg-white/[.025]'}`}><SkatePreview wheels={x.wheels} low={x.low} boot={avatar.skateColor} wheel={avatar.wheelColor} compact/><div className="flex-1"><p className="text-sm font-black text-white">{x.label}</p><p className="mt-0.5 text-[9px] text-white/30">{x.desc}</p></div>{avatar.skateModel===x.id&&<span className="text-orange-300">✓</span>}</button>)}</div>
    <Sub>Bota</Sub><div className="grid grid-cols-3 gap-2">{['#17191F','#F1F1F1','#A91D24','#2563EB','#D9468A','#FF6B1A'].map(c=><Color key={c} c={c} active={avatar.skateColor===c} onClick={()=>patch({skateColor:c})}/>)}</div>
    <Sub>Ruedas</Sub><div className="grid grid-cols-3 gap-2">{['#FF6B1A','#FACC15','#F2F2F2','#22C55E','#3B82F6','#D9468A'].map(c=><Color key={c} c={c} active={avatar.wheelColor===c} onClick={()=>patch({wheelColor:c})}/>)}</div>
  </Shell>
}

function Shell({eyebrow,title,children}){return <><p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-300">{eyebrow}</p><h2 className="mt-2 font-display text-[27px] text-white">{title}</h2><p className="mt-1 text-[11px] leading-5 text-white/32">Elegí cada detalle y miralo aplicado en tiempo real.</p><div className="mt-4">{children}</div></>}
function Sub({children}){return <p className="mb-2 mt-5 text-[8px] font-black uppercase tracking-[.16em] text-white/25">{children}</p>}
function Color({c,active,onClick}){return <button onClick={onClick} className={`relative h-16 rounded-[18px] border ${active?'border-orange-300/40 bg-orange-400/[.08]':'border-white/[.07] bg-white/[.025]'}`}><span className="mx-auto block h-9 w-9 rounded-full border border-white/10" style={{background:c}}/>{active&&<span className="absolute right-2 top-2 text-[10px] font-black text-orange-300">✓</span>}</button>}
function SimpleChoice({active,label,onClick,children}){return <button onClick={onClick} className={`rounded-[18px] border p-2.5 ${active?'border-orange-300/35 bg-orange-400/[.08]':'border-white/[.07] bg-white/[.025]'}`}>{children}<p className="mt-1 truncate text-[8px] font-bold text-white/50">{label}</p></button>}
function HairPreview({id,color}){return <svg viewBox="0 0 70 55" className="mx-auto h-12"><ellipse cx="35" cy="31" rx="19" ry="20" fill="#c99170"/><g transform="translate(-129 -69) scale(.92)"><Hair id={id} color={color}/></g></svg>}
function FacePreview({id}){return <svg viewBox="0 0 78 58" className="mx-auto h-12"><ellipse cx="39" cy="29" rx="23" ry="24" fill="#d3a07c"/><g transform="translate(-125 -112)"><Face id={id}/></g></svg>}
function HelmetPreview({color,none}){return <svg viewBox="0 0 70 52" className="mx-auto h-12">{none?<path d="M10 42h50" stroke="rgba(255,255,255,.2)" strokeWidth="2"/>:<><path d="M9 36C7 7 61 6 62 36l-7 6c-13-5-27-5-40 0z" fill={color} stroke="rgba(255,255,255,.18)"/><path d="M18 24c11-8 24-10 36-5" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round"/></>}</svg>}
function ProtectPreview({color}){return <div className="flex h-12 items-center justify-center gap-2"><span className="h-8 w-6 rounded-[9px] border border-white/10" style={{background:color}}/><span className="h-8 w-6 rounded-[9px] border border-white/10" style={{background:color}}/></div>}
function SkatePreview({wheels,low=false,boot,wheel,compact=false}){const xs=wheels===3?[18,42,66]:[12,30,48,66];return <svg viewBox="0 0 90 62" className={`${compact?'h-12 w-20':'mt-2 h-14 w-full'}`}><path d={low?'M8 28 18 8h39l22 17-8 17H11z':'M8 38 15 4h36l10 19 21 10-9 15H12z'} fill={boot} stroke="rgba(255,255,255,.18)"/><path d="M12 49h70" stroke="#8a8a8a" strokeWidth="3"/>{xs.map(x=><g key={x}><circle cx={x} cy="55" r={wheels===3?7:5.7} fill={wheel} stroke="#111"/><circle cx={x} cy="55" r="1.7" fill="#333"/></g>)}</svg>}
function CatIcon({type,active}){const c=active?'#FDBA74':'rgba(255,255,255,.42)';return <svg viewBox="0 0 32 24" className="h-6 w-8" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  {type==='skin'&&<><circle cx="16" cy="8" r="5"/><path d="M8 23c1-6 15-6 16 0"/></>}
  {type==='hair'&&<path d="M7 14c0-12 18-13 18 0-5-6-12-5-18 0z"/>}
  {type==='face'&&<><circle cx="16" cy="12" r="9"/><circle cx="13" cy="10" r="1" fill={c}/><circle cx="19" cy="10" r="1" fill={c}/><path d="M13 15c2 2 4 2 6 0"/></>}
  {type==='top'&&<path d="M8 5 13 2h6l5 3 5 7-5 3v8H8v-8l-5-3z"/>}
  {type==='helmet'&&<><path d="M5 15c0-14 22-14 22 0H5z"/><path d="M24 15c2 2 3 4 2 7"/></>}
  {type==='protection'&&<path d="M16 2 27 6v7c0 6-5 9-11 11C10 22 5 19 5 13V6z"/>}
  {type==='skates'&&<><path d="M3 12 8 4h10l4 6 7 3-3 6H5z"/><circle cx="9" cy="21" r="2" fill={c}/><circle cx="17" cy="21" r="2" fill={c}/><circle cx="25" cy="21" r="2" fill={c}/></>}
</svg>}
