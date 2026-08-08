import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const DEFAULT_AVATAR = {
  skin: '#D7A27F',
  hair: '#171310',
  hairStyle: 'soft',
  face: 'relaxed',
  top: 'pr-black',
  helmet: 'orange',
  protection: 'black',
  skateType: '4w',
  skateModel: 'fitness',
  skateColor: '#17191F',
  wheelColor: '#FF6B1A',
}

const SKINS = ['#F3D7C4','#EDC3A3','#D7A27F','#B97955','#8C583E','#5B392D']
const HAIR_COLORS = ['#171310','#3C261B','#73472D','#B77C46','#C7A26E','#DEDEDE']
const HAIRS = [
  ['soft','Soft'],['crop','Corto'],['wave','Ondas'],['fade','Fade'],['long','Largo'],['bun','Rodete']
]
const FACES = [['relaxed','Relax'],['focus','Focus'],['smile','Sonrisa'],['cool','Cool']]
const TOPS = [
  { id:'pr-black', label:'PR Black', body:'#101116', detail:'#F0C55A' },
  { id:'racing', label:'Racing', body:'#151519', detail:'#FF6B1A' },
  { id:'pr-red', label:'PR Red', body:'#A61F27', detail:'#FFFFFF' },
  { id:'pr-blue', label:'PR Blue', body:'#195B88', detail:'#FFFFFF' },
  { id:'pr-pink', label:'PR Pink', body:'#A53B75', detail:'#FFFFFF' },
  { id:'pr-white', label:'PR White', body:'#F1F1F1', detail:'#171717' },
]
const HELMETS = [
  ['orange','PR Orange','#FF6B1A'],['black','Carbon','#181A1F'],['white','Ice','#F0F0F0'],
  ['blue','Electric','#2563EB'],['pink','Pink','#D9468A'],['none','Sin casco','transparent']
]
const PROTECTION = [
  ['black','Carbon','#181A1F'],['orange','Orange','#FF6B1A'],['white','Ice','#F0F0F0'],['none','Minimal','transparent']
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
  const patch=x=>setAvatar(v=>({...v,...x}))

  async function save(){
    try{
      setSaving(true);setMessage('Guardando tu patinador…')
      const {error}=await supabase.from('profiles').update({pr_avatar:avatar,updated_at:new Date().toISOString()}).eq('id',profileId)
      if(error)throw error
      const next={...base,pr_avatar:avatar}
      localStorage.setItem('pr_user',JSON.stringify(next))
      updateUser?.({pr_avatar:avatar})
      setMessage('✓ Tu patinador PR quedó guardado.')
    }catch(e){setMessage(`No pudimos guardar: ${e.message}`)}finally{setSaving(false)}
  }

  return <AppLayout title="Mi patinador">
    <div className="pr-page space-y-4 animate-page-enter pb-9">
      <section className="overflow-hidden rounded-[34px] border border-orange-300/18 bg-[#09090d] shadow-[0_32px_100px_rgba(0,0,0,.5)]">

        <div className="relative min-h-[590px] overflow-hidden bg-gradient-to-b from-[#19131a] via-[#0b0b10] to-[#07070a]">
          <LockerRoom energy={energy}/>

          <div className="absolute left-4 top-4 z-30">
            <p className="text-[8px] font-black uppercase tracking-[.2em] text-orange-300">PR Roller Locker</p>
            <p className="mt-1 text-[10px] font-semibold text-white/36">Tu identidad sobre ruedas</p>
          </div>

          <button disabled={saving} onClick={save}
            className="absolute right-4 top-4 z-30 rounded-[18px] bg-gradient-to-b from-[#ffd965] to-[#f9b949] px-4 py-3 text-[11px] font-black uppercase tracking-[.04em] text-black shadow-[0_12px_32px_rgba(249,185,73,.25)] disabled:opacity-50">
            {saving?'Guardando…':'✓ Guardar'}
          </button>

          <div className="absolute left-4 top-[65px] z-30 rounded-[17px] border border-white/[.08] bg-black/35 px-3 py-2 backdrop-blur-md">
            <p className="text-[7px] font-black uppercase tracking-[.14em] text-white/28">Energía PR</p>
            <p className="mt-1 font-display text-[25px] leading-none text-white">{Math.round(energy)}<span className="text-[10px] text-white/22">%</span></p>
          </div>

          <div className="absolute right-4 top-[65px] z-30 rounded-[17px] border border-orange-300/14 bg-black/35 px-3 py-2 text-right backdrop-blur-md">
            <p className="text-[7px] font-black uppercase tracking-[.14em] text-orange-200/55">{level}</p>
            <p className="mt-1 text-[11px] font-black text-orange-200">{stats.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km</p>
          </div>

          <Avatar3D avatar={avatar}/>

          <div className="absolute bottom-[72px] left-4 right-4 z-30 rounded-[18px] border border-white/[.07] bg-black/45 px-3 py-3 backdrop-blur-md">
            <div className="flex justify-between text-[9px] font-bold text-white/40">
              <span>⚡ Energía vinculada a tu Strava</span><span className="text-orange-200">{stats.sessions} entrenos</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 shadow-[0_0_18px_rgba(251,146,60,.35)]" style={{width:`${Math.max(4,energy)}%`}}/>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/[.06] bg-[#0d0d12]/95 p-2.5 backdrop-blur-xl">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATS.map(([id,label])=><button key={id} onClick={()=>setCat(id)}
                className={`min-w-[76px] rounded-[18px] border px-3 py-2.5 text-center transition ${
                  cat===id
                  ? 'border-[#f6c85b]/35 bg-[#f6c85b]/10 shadow-[inset_0_0_0_1px_rgba(246,200,91,.07)]'
                  : 'border-white/[.04] bg-white/[.025]'
                }`}>
                <CatIcon type={id} active={cat===id}/>
                <p className={`mt-1.5 text-[7.5px] font-black uppercase tracking-[.07em] ${cat===id?'text-[#f6c85b]':'text-white/31'}`}>{label}</p>
              </button>)}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/[.08] bg-[#0d0d12] p-4 shadow-[0_18px_50px_rgba(0,0,0,.18)]">
        <Editor cat={cat} avatar={avatar} patch={patch}/>
      </section>

      <section className="rounded-[26px] border border-orange-300/12 bg-gradient-to-br from-orange-500/[.06] to-white/[.02] p-4">
        <p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-300">Sistema vivo</p>
        <p className="mt-2 text-sm font-black text-white">Tu avatar también evoluciona.</p>
        <p className="mt-1 text-[11px] leading-5 text-white/36">El rayo, la luz del locker y la barra de energía crecen con tus kilómetros reales sincronizados desde Strava.</p>
      </section>

      {message&&<div className="rounded-[20px] border border-orange-300/15 bg-orange-400/[.07] p-3 text-xs text-orange-100/65">{message}</div>}

      <div className="grid grid-cols-2 gap-2">
        <Link to="/app/perfil" className="rounded-2xl border border-white/[.08] bg-white/[.03] py-4 text-center text-xs font-bold text-white/55">Volver</Link>
        <button onClick={save} className="rounded-2xl bg-orange-400 py-4 text-xs font-black text-black">Guardar patinador</button>
      </div>
    </div>
  </AppLayout>
}

function LockerRoom({energy}){
  return <svg viewBox="0 0 390 590" className="absolute inset-0 h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#26151b"/><stop offset=".45" stopColor="#121116"/><stop offset="1" stopColor="#08090c"/></linearGradient>
      <linearGradient id="shelf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#241a1c"/><stop offset="1" stopColor="#0c0c10"/></linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe17e"/><stop offset=".5" stopColor="#d7a638"/><stop offset="1" stopColor="#805416"/></linearGradient>
      <linearGradient id="orangeLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF9B45" stopOpacity={.10+energy/500}/><stop offset="1" stopColor="#FF6B1A" stopOpacity="0"/></linearGradient>
      <radialGradient id="spot"><stop offset="0" stopColor="#fff" stopOpacity=".10"/><stop offset=".45" stopColor="#fff" stopOpacity=".025"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation={4+energy/20}/></filter>
    </defs>
    <rect width="390" height="590" fill="url(#wall)"/>

    <ellipse cx="195" cy="230" rx="160" ry="220" fill="url(#spot)"/>
    <path d="M253 35 150 272h70l-55 196 115-234h-73z" fill="url(#orangeLight)" filter="url(#blur)"/>

    {/* side trophy cabinets */}
    <g opacity=".9">
      <rect x="8" y="108" width="70" height="335" rx="20" fill="url(#shelf)" stroke="#fff" strokeOpacity=".05"/>
      <rect x="312" y="108" width="70" height="335" rx="20" fill="url(#shelf)" stroke="#fff" strokeOpacity=".05"/>
      {[170,258,346].map(y=><g key={y}><path d={`M15 ${y}h56`} stroke="#fff" strokeOpacity=".05"/><path d={`M319 ${y}h56`} stroke="#fff" strokeOpacity=".05"/></g>)}
      <Trophy x="31" y="130"/><Trophy x="335" y="130"/>
      <MiniWheel x="44" y="218"/><MiniWheel x="348" y="218"/>
      <MiniCone x="45" y="310"/><MiniCone x="349" y="310"/>
    </g>

    {/* back PR mark */}
    <circle cx="195" cy="150" r="78" fill="none" stroke="#FF8B34" strokeOpacity=".045" strokeWidth="3"/>
    <path d="M155 184 195 102l40 82-40-22z" fill="#FF8B34" opacity=".035"/>

    {/* podium */}
    <ellipse cx="195" cy="490" rx="118" ry="28" fill="#000" opacity=".52"/>
    <ellipse cx="195" cy="480" rx="105" ry="22" fill="#231716" stroke="#FF8B34" strokeOpacity=".13"/>
    <ellipse cx="195" cy="476" rx="88" ry="14" fill="#FF7A24" opacity=".075"/>
  </svg>
}

function Trophy({x,y}){
  return <g transform={`translate(${x} ${y})`} opacity=".62">
    <path d="M8 4h22v12c0 10-5 15-11 15S8 26 8 16z" fill="url(#gold)"/>
    <path d="M8 8H2v5c0 7 3 9 8 9M30 8h6v5c0 7-3 9-8 9" fill="none" stroke="#d8a63b" strokeWidth="3"/>
    <path d="M19 31v9M11 42h16" stroke="#d8a63b" strokeWidth="3" strokeLinecap="round"/>
  </g>
}
function MiniWheel({x,y}){return <g transform={`translate(${x} ${y})`} opacity=".45"><circle r="17" fill="#FF6B1A"/><circle r="7" fill="#202026"/><circle r="2" fill="#cfcfcf"/></g>}
function MiniCone({x,y}){return <g transform={`translate(${x} ${y})`} opacity=".42"><path d="M0 28 10 0l10 28z" fill="#FF6B1A"/><path d="M2 17h16" stroke="#fff" strokeOpacity=".65" strokeWidth="4"/><path d="M-4 29h28" stroke="#FF6B1A" strokeWidth="4" strokeLinecap="round"/></g>}

function Avatar3D({avatar}){
  const top=TOPS.find(x=>x.id===avatar.top)||TOPS[0]
  const helmet=HELMETS.find(x=>x[0]===avatar.helmet)||HELMETS[0]
  const protect=PROTECTION.find(x=>x[0]===avatar.protection)||PROTECTION[0]
  const skate=SKATES.find(x=>x.id===avatar.skateModel)||SKATES[0]

  return <svg viewBox="0 0 360 510" className="absolute bottom-[90px] left-1/2 z-20 h-[445px] w-[330px] -translate-x-1/2" aria-label="Vista previa de tu patinador PR">
    <defs>
      <radialGradient id="skinHead" cx=".34" cy=".24" r=".88">
        <stop offset="0" stopColor="#fff" stopOpacity=".20"/>
        <stop offset=".22" stopColor={avatar.skin}/>
        <stop offset=".72" stopColor={avatar.skin}/>
        <stop offset="1" stopColor="#6d4030" stopOpacity=".36"/>
      </radialGradient>
      <linearGradient id="skinLimb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".14"/>
        <stop offset=".18" stopColor={avatar.skin}/>
        <stop offset=".76" stopColor={avatar.skin}/>
        <stop offset="1" stopColor="#6d4030" stopOpacity=".30"/>
      </linearGradient>
      <linearGradient id="jersey" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".10"/><stop offset=".12" stopColor={top.body}/><stop offset=".74" stopColor={top.body}/><stop offset="1" stopColor="#000" stopOpacity=".34"/>
      </linearGradient>
      <linearGradient id="pants" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#24262c"/><stop offset="1" stopColor="#0d0e12"/></linearGradient>
      <radialGradient id="helmetGrad" cx=".35" cy=".15" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".30"/><stop offset=".18" stopColor={helmet[2]}/><stop offset="1" stopColor="#000" stopOpacity=".35"/></radialGradient>
      <linearGradient id="bootGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".16"/><stop offset=".15" stopColor={avatar.skateColor}/><stop offset="1" stopColor="#000" stopOpacity=".33"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="9" floodOpacity=".34"/></filter>
      <filter id="smallShadow"><feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity=".26"/></filter>
    </defs>

    <ellipse cx="181" cy="477" rx="104" ry="15" fill="#000" opacity=".48"/>

    {/* legs */}
    <path d="M126 334c14-7 31-5 43 3l-5 98-39 2-12-77z" fill="url(#pants)" filter="url(#shadow)"/>
    <path d="M168 336c16-5 32-2 43 8l18 88-38 6-31-79z" fill="url(#pants)" filter="url(#shadow)"/>
    <path d="M125 356c12 5 25 6 39 3M180 359c11 3 23 2 34-1" fill="none" stroke="#fff" strokeOpacity=".06" strokeWidth="2"/>

    {/* torso with 3d shoulders */}
    <path d="M111 209c19-18 87-21 112 2 13 28 22 68 24 111-33 20-105 22-142 2 2-43 5-84 6-115Z" fill="url(#jersey)" stroke="#fff" strokeOpacity=".08" filter="url(#shadow)"/>
    <path d="M118 228c31 11 65 10 97-2" fill="none" stroke={top.detail} strokeWidth="5.5" strokeLinecap="round"/>
    <path d="M133 306c24 7 53 7 78 0" fill="none" stroke="#fff" strokeOpacity=".06" strokeWidth="2"/>
    <path d="M117 217c10 2 19 8 26 16M219 216c-10 3-18 9-24 17" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="4" strokeLinecap="round"/>
    <text x="168" y="270" textAnchor="middle" fill={top.detail} fontSize="21" fontWeight="900" letterSpacing="3">PR</text>

    {/* arms */}
    <path d="M112 223c-22 9-35 30-43 62-8 31-6 62 11 76 14 12 31 3 33-15l10-75 15-30z" fill="url(#skinLimb)" stroke="#000" strokeOpacity=".10"/>
    <path d="M218 224c21 10 33 32 41 64 7 29 6 61-10 75-14 12-30 4-32-14l-11-75-13-31z" fill="url(#skinLimb)" stroke="#000" strokeOpacity=".10"/>

    {avatar.protection!=='none'&&<>
      <path d="M72 301c11-8 31-6 42 4l-3 28c-12 9-31 8-42-1z" fill={protect[2]} stroke="#fff" strokeOpacity=".10" filter="url(#smallShadow)"/>
      <path d="M218 304c11-10 30-12 42-4l5 28c-10 10-29 12-41 4z" fill={protect[2]} stroke="#fff" strokeOpacity=".10" filter="url(#smallShadow)"/>
    </>}

    {/* hands */}
    <path d="M70 353c8-12 25-11 32-1 6 8 4 17-2 24-8 9-22 9-29 0-6-7-6-16-1-23z" fill="url(#skinLimb)"/>
    <path d="M239 354c7-12 24-13 31-3 6 8 6 17 0 24-7 9-21 10-29 2-7-6-8-15-2-23z" fill="url(#skinLimb)"/>

    {/* neck */}
    <path d="M145 169h44l3 50-51 2z" fill="url(#skinLimb)"/>

    {/* back hair */}
    {avatar.hairStyle==='long'&&<path d="M105 97c6-68 125-71 132-2l-12 132-46-30-61 32z" fill={avatar.hair} filter="url(#smallShadow)"/>}
    {avatar.hairStyle==='bun'&&<circle cx="176" cy="49" r="26" fill={avatar.hair} filter="url(#smallShadow)"/>}

    {/* head */}
    <path d="M103 96c5-58 121-64 132-6l-3 45c-4 49-31 77-67 75-38-2-62-31-61-76z" fill="url(#skinHead)" stroke="#000" strokeOpacity=".10" filter="url(#shadow)"/>
    <ellipse cx="108" cy="142" rx="6" ry="10" fill={avatar.skin}/>
    <ellipse cx="230" cy="139" rx="5" ry="9" fill={avatar.skin}/>

    <Hair id={avatar.hairStyle} color={avatar.hair}/>

    {/* helmet */}
    {avatar.helmet!=='none'&&<>
      <path d="M99 108c-6-72 134-78 140 2l-11 14c-37-12-76-13-117 0z" fill="url(#helmetGrad)" stroke="#000" strokeOpacity=".22" strokeWidth="2.2" filter="url(#shadow)"/>
      <path d="M119 88c28-16 66-19 98-7" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="5" strokeLinecap="round"/>
      <path d="M120 105h17M153 92h19M191 99h19" stroke="#111" strokeOpacity=".28" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M225 118c9 15 11 31 7 49" fill="none" stroke="#181818" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="231" cy="166" r="3" fill="#181818"/>
    </>}

    <Face id={avatar.face}/>

    {/* nose / cheeks */}
    <path d="M169 142c-2 7-2 12 2 14" fill="none" stroke="#6e4637" strokeOpacity=".36" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="133" cy="160" rx="9" ry="4" fill="#d57c72" opacity=".10"/>
    <ellipse cx="204" cy="158" rx="9" ry="4" fill="#d57c72" opacity=".10"/>

    {/* skates */}
    <g transform="translate(80 417) rotate(-5) scale(1.06)"><Skate wheels={skate.wheels} low={skate.low} boot={avatar.skateColor} wheel={avatar.wheelColor}/></g>
    <g transform="translate(179 421) rotate(4) scale(1.06)"><Skate wheels={skate.wheels} low={skate.low} boot={avatar.skateColor} wheel={avatar.wheelColor}/></g>
  </svg>
}

function Hair({id,color}){
  if(id==='bun')return <path d="M103 106c9-51 116-59 130-9-26-18-53-19-76-14-21 4-37 12-54 23z" fill={color}/>
  if(id==='long')return <path d="M102 108c8-54 119-63 133-6-29-21-58-22-84-16-19 5-35 13-49 22z" fill={color}/>
  if(id==='wave')return <path d="M101 109c4-55 125-64 136-5-13-15-27-26-45-15-13 8-23-13-40-3-14 8-29-8-51 23z" fill={color}/>
  if(id==='fade')return <path d="M112 97c15-37 96-41 112-2-34-12-79-11-112 2z" fill={color}/>
  if(id==='crop')return <path d="M106 103c12-45 113-52 124-3-37-14-89-13-124 3z" fill={color}/>
  return <path d="M101 108c5-51 121-61 133-8-20-19-38-7-53-17-16 14-34 0-80 25z" fill={color}/>
}

function Face({id}){
  if(id==='cool')return <>
    <path d="M126 128h30l-5 17h-20zM176 128h30l-5 17h-20z" fill="#171717"/>
    <path d="M156 133h20" stroke="#171717" strokeWidth="3"/>
    <path d="M150 169c10 5 21 5 30-1" fill="none" stroke="#211c1a" strokeWidth="3.1" strokeLinecap="round"/>
  </>
  return <>
    <ellipse cx="141" cy="136" rx="5.8" ry={id==='focus'?4.2:6.3} fill="#211c1a"/>
    <ellipse cx="190" cy="135" rx="5.8" ry={id==='focus'?4.2:6.3} fill="#211c1a"/>
    <circle cx="139" cy="133.5" r="1.6" fill="#fff" opacity=".85"/><circle cx="188" cy="132.5" r="1.6" fill="#fff" opacity=".85"/>
    <path d={id==='focus'?'M151 167c9 1 18 1 26-1':id==='smile'?'M148 164c11 13 24 13 35 0':'M149 166c10 8 22 8 32-1'} fill="none" stroke="#211c1a" strokeWidth="3.2" strokeLinecap="round"/>
    {id==='focus'&&<><path d="M132 124c6-3 11-3 17-1M181 123c6-3 11-3 17-1" fill="none" stroke="#3a2c28" strokeWidth="2" strokeLinecap="round"/></>}
  </>
}

function Skate({wheels,low,boot,wheel}){
  const xs=wheels===3?[15,40,65]:[10,29,48,67]
  return <g>
    <path d={low?'M4 20 13 3h40l19 17-8 20H7z':'M4 34 10 0h36l9 18 21 11-9 18H8z'} fill="url(#bootGrad)" stroke="#fff" strokeOpacity=".20" strokeWidth="1.5"/>
    {!low&&<>
      <path d="M16 10h28M15 16h31M14 22h34" stroke="#fff" strokeOpacity=".36" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M31 3v26" stroke="#fff" strokeOpacity=".18" strokeWidth="1.2"/>
      <path d="M12 31c16 4 35 4 52 1" fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="2"/>
    </>}
    <path d="M8 46h70" stroke="#8d8d8d" strokeWidth="4" strokeLinecap="round"/>
    <path d="M13 44h60" stroke="#d8d8d8" strokeOpacity=".34" strokeWidth="1.2"/>
    {xs.map(x=><g key={x}>
      <circle cx={x} cy="55" r={wheels===3?9.5:7.7} fill={wheel} stroke="#121212" strokeWidth="1.5"/>
      <circle cx={x} cy="55" r="2.7" fill="#3d3d3d"/>
      <circle cx={x-2.4} cy="52.3" r="1.5" fill="#fff" opacity=".30"/>
    </g>)}
  </g>
}

function Editor({cat,avatar,patch}){
  if(cat==='skin')return <Shell eyebrow="Identidad" title="Tono de piel" text="Elegí el que mejor te represente."><div className="grid grid-cols-3 gap-2">{SKINS.map(c=><Color key={c} c={c} active={avatar.skin===c} onClick={()=>patch({skin:c})}/>)}</div></Shell>
  if(cat==='hair')return <Shell eyebrow="Estilo" title="Pelo" text="Forma y color en tiempo real."><div className="grid grid-cols-3 gap-2">{HAIRS.map(([id,label])=><SimpleChoice key={id} active={avatar.hairStyle===id} label={label} onClick={()=>patch({hairStyle:id})}><HairPreview id={id} color={avatar.hair}/></SimpleChoice>)}</div><Sub>Color</Sub><div className="grid grid-cols-3 gap-2">{HAIR_COLORS.map(c=><Color key={c} c={c} active={avatar.hair===c} onClick={()=>patch({hair:c})}/>)}</div></Shell>
  if(cat==='face')return <Shell eyebrow="Expresión" title="Rostro" text="Sutil, adulto y con actitud."><div className="grid grid-cols-2 gap-2">{FACES.map(([id,label])=><SimpleChoice key={id} active={avatar.face===id} label={label} onClick={()=>patch({face:id})}><FacePreview id={id}/></SimpleChoice>)}</div></Shell>
  if(cat==='top')return <Shell eyebrow="Punta Rollers" title="Ropa" text="Looks inspirados en nuestra identidad."><div className="grid grid-cols-2 gap-2">{TOPS.map(x=><button key={x.id} onClick={()=>patch({top:x.id})} className={`rounded-[20px] border p-3 text-left ${avatar.top===x.id?'border-[#f6c85b]/35 bg-[#f6c85b]/[.08]':'border-white/[.07] bg-white/[.025]'}`}><div className="relative h-20 rounded-[17px] shadow-inner" style={{background:`linear-gradient(135deg,rgba(255,255,255,.10),transparent 30%),${x.body}`}}><div className="absolute left-1/2 top-6 h-1.5 w-12 -translate-x-1/2 rounded-full" style={{background:x.detail}}/><span className="absolute inset-x-0 top-10 text-center text-[10px] font-black tracking-[.16em]" style={{color:x.detail}}>PR</span></div><p className="mt-2 text-[9px] font-bold text-white/55">{x.label}</p></button>)}</div></Shell>
  if(cat==='helmet')return <Shell eyebrow="Protección" title="Casco" text="Silueta deportiva, ventilación y color."><div className="grid grid-cols-3 gap-2">{HELMETS.map(([id,label,c])=><SimpleChoice key={id} active={avatar.helmet===id} label={label} onClick={()=>patch({helmet:id})}><HelmetPreview color={c} none={id==='none'}/></SimpleChoice>)}</div></Shell>
  if(cat==='protection')return <Shell eyebrow="Equipamiento" title="Protecciones" text="Muñequeras y detalles que acompañan el look."><div className="grid grid-cols-2 gap-2">{PROTECTION.map(([id,label,c])=><SimpleChoice key={id} active={avatar.protection===id} label={label} onClick={()=>patch({protection:id})}><ProtectPreview color={c}/></SimpleChoice>)}</div></Shell>
  return <SkateEditor avatar={avatar} patch={patch}/>
}

function SkateEditor({avatar,patch}){
  const items=SKATES.filter(x=>x.type===avatar.skateType)
  function type(t){const first=SKATES.find(x=>x.type===t);patch({skateType:t,skateModel:first.id})}
  return <Shell eyebrow="Tu setup" title="Patines" text="3 ruedas o 4. Fitness, Urban, Endurance o Speed.">
    <div className="grid grid-cols-2 gap-2">{['3w','4w'].map(t=><button key={t} onClick={()=>type(t)} className={`rounded-[20px] border p-3 text-left ${avatar.skateType===t?'border-[#f6c85b]/35 bg-[#f6c85b]/[.08]':'border-white/[.07] bg-white/[.025]'}`}><p className="font-display text-[30px] text-white">{t==='3w'?3:4} <span className="text-xs text-white/30">ruedas</span></p><SkatePreview wheels={t==='3w'?3:4} boot={avatar.skateColor} wheel={avatar.wheelColor}/></button>)}</div>
    <Sub>Modelo</Sub>
    <div className="space-y-2">{items.map(x=><button key={x.id} onClick={()=>patch({skateModel:x.id})} className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left ${avatar.skateModel===x.id?'border-[#f6c85b]/35 bg-[#f6c85b]/[.08]':'border-white/[.07] bg-white/[.025]'}`}><SkatePreview wheels={x.wheels} low={x.low} boot={avatar.skateColor} wheel={avatar.wheelColor} compact/><div className="flex-1"><p className="text-sm font-black text-white">{x.label}</p><p className="mt-0.5 text-[9px] text-white/30">{x.desc}</p></div>{avatar.skateModel===x.id&&<span className="text-[#f6c85b]">✓</span>}</button>)}</div>
    <Sub>Bota</Sub><div className="grid grid-cols-3 gap-2">{['#17191F','#F1F1F1','#A91D24','#2563EB','#D9468A','#FF6B1A'].map(c=><Color key={c} c={c} active={avatar.skateColor===c} onClick={()=>patch({skateColor:c})}/>)}</div>
    <Sub>Ruedas</Sub><div className="grid grid-cols-3 gap-2">{['#FF6B1A','#FACC15','#F2F2F2','#22C55E','#3B82F6','#D9468A'].map(c=><Color key={c} c={c} active={avatar.wheelColor===c} onClick={()=>patch({wheelColor:c})}/>)}</div>
  </Shell>
}

function Shell({eyebrow,title,text,children}){return <><p className="text-[8px] font-black uppercase tracking-[.18em] text-[#f6c85b]">{eyebrow}</p><h2 className="mt-2 font-display text-[28px] text-white">{title}</h2><p className="mt-1 text-[11px] leading-5 text-white/32">{text}</p><div className="mt-4">{children}</div></>}
function Sub({children}){return <p className="mb-2 mt-5 text-[8px] font-black uppercase tracking-[.16em] text-white/25">{children}</p>}
function Color({c,active,onClick}){return <button onClick={onClick} className={`relative h-16 rounded-[18px] border ${active?'border-[#f6c85b]/40 bg-[#f6c85b]/[.08]':'border-white/[.07] bg-white/[.025]'}`}><span className="mx-auto block h-9 w-9 rounded-full border border-white/10 shadow-[inset_0_-6px_12px_rgba(0,0,0,.15),0_4px_12px_rgba(0,0,0,.18)]" style={{background:c}}/>{active&&<span className="absolute right-2 top-2 text-[10px] font-black text-[#f6c85b]">✓</span>}</button>}
function SimpleChoice({active,label,onClick,children}){return <button onClick={onClick} className={`rounded-[18px] border p-2.5 ${active?'border-[#f6c85b]/35 bg-[#f6c85b]/[.08]':'border-white/[.07] bg-white/[.025]'}`}>{children}<p className="mt-1 truncate text-[8px] font-bold text-white/50">{label}</p></button>}
function HairPreview({id,color}){return <svg viewBox="0 0 70 55" className="mx-auto h-12"><defs><radialGradient id={`ph-${id}`}><stop stopColor="#e6b08c"/><stop offset="1" stopColor="#a86e50"/></radialGradient></defs><ellipse cx="35" cy="31" rx="19" ry="20" fill={`url(#ph-${id})`}/><g transform="translate(-129 -69) scale(.92)"><Hair id={id} color={color}/></g></svg>}
function FacePreview({id}){return <svg viewBox="0 0 78 58" className="mx-auto h-12"><defs><radialGradient id={`pf-${id}`}><stop stopColor="#e7b18e"/><stop offset="1" stopColor="#a86e50"/></radialGradient></defs><ellipse cx="39" cy="29" rx="23" ry="24" fill={`url(#pf-${id})`}/><g transform="translate(-125 -112)"><Face id={id}/></g></svg>}
function HelmetPreview({color,none}){return <svg viewBox="0 0 70 52" className="mx-auto h-12">{none?<path d="M10 42h50" stroke="rgba(255,255,255,.2)" strokeWidth="2"/>:<><path d="M9 36C7 7 61 6 62 36l-7 6c-13-5-27-5-40 0z" fill={color} stroke="rgba(255,255,255,.18)"/><path d="M18 24c11-8 24-10 36-5" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round"/><path d="M22 17h9M38 15h10" stroke="#111" strokeOpacity=".25" strokeWidth="2.5" strokeLinecap="round"/></>}</svg>}
function ProtectPreview({color}){return <div className="flex h-12 items-center justify-center gap-2"><span className="h-8 w-6 rounded-[9px] border border-white/10 shadow-inner" style={{background:color}}/><span className="h-8 w-6 rounded-[9px] border border-white/10 shadow-inner" style={{background:color}}/></div>}
function SkatePreview({wheels,low=false,boot,wheel,compact=false}){const xs=wheels===3?[18,42,66]:[12,30,48,66];return <svg viewBox="0 0 90 62" className={`${compact?'h-12 w-20':'mt-2 h-14 w-full'}`}><defs><linearGradient id={`pb-${wheels}-${low}`}><stop stopColor="#fff" stopOpacity=".14"/><stop offset=".2" stopColor={boot}/><stop offset="1" stopColor="#000" stopOpacity=".3"/></linearGradient></defs><path d={low?'M8 28 18 8h39l22 17-8 17H11z':'M8 38 15 4h36l10 19 21 10-9 15H12z'} fill={`url(#pb-${wheels}-${low})`} stroke="rgba(255,255,255,.18)"/>{!low&&<><path d="M22 16h27M20 22h32M18 28h36" stroke="#fff" strokeOpacity=".30" strokeWidth="1.2"/></>}<path d="M12 49h70" stroke="#8a8a8a" strokeWidth="3"/>{xs.map(x=><g key={x}><circle cx={x} cy="55" r={wheels===3?7:5.7} fill={wheel} stroke="#111"/><circle cx={x} cy="55" r="1.7" fill="#333"/></g>)}</svg>}
function CatIcon({type,active}){const c=active?'#f6c85b':'rgba(255,255,255,.38)';return <svg viewBox="0 0 32 24" className="mx-auto h-6 w-8" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  {type==='skin'&&<><circle cx="16" cy="8" r="5"/><path d="M8 23c1-6 15-6 16 0"/></>}
  {type==='hair'&&<path d="M7 14c0-12 18-13 18 0-5-6-12-5-18 0z"/>}
  {type==='face'&&<><circle cx="16" cy="12" r="9"/><circle cx="13" cy="10" r="1" fill={c}/><circle cx="19" cy="10" r="1" fill={c}/><path d="M13 15c2 2 4 2 6 0"/></>}
  {type==='top'&&<path d="M8 5 13 2h6l5 3 5 7-5 3v8H8v-8l-5-3z"/>}
  {type==='helmet'&&<><path d="M5 15c0-14 22-14 22 0H5z"/><path d="M24 15c2 2 3 4 2 7"/></>}
  {type==='protection'&&<path d="M16 2 27 6v7c0 6-5 9-11 11C10 22 5 19 5 13V6z"/>}
  {type==='skates'&&<><path d="M3 12 8 4h10l4 6 7 3-3 6H5z"/><circle cx="9" cy="21" r="2" fill={c}/><circle cx="17" cy="21" r="2" fill={c}/><circle cx="25" cy="21" r="2" fill={c}/></>}
</svg>}
