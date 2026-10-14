import { useEffect, useRef, useState } from 'react'

const palette=['#BBFF1F','#0D0303','#FF0055','#EFF8FF','#BBFF1F','#0D0303','#FF0055','#EFF8FF']
export default function PRTrainingV2Spin({duties=[],onComplete}){
 const [shown,setShown]=useState(0)
 const [angle,setAngle]=useState(0)
 const [running,setRunning]=useState(false)
 const [finished,setFinished]=useState(false)
 const timeout=useRef(null)
 const cancelled=useRef(false)
 useEffect(()=>()=>{cancelled.current=true;clearTimeout(timeout.current)},[])
 function start(){
  if(running||finished||shown>=6||duties.length!==6)return
  cancelled.current=false
  setRunning(true)
  const next=shown+1
  setAngle(previous=>previous+1800+((shown*3+1)%8)*45)
  timeout.current=setTimeout(()=>{
   if(cancelled.current)return
   setShown(next)
   setRunning(false)
   if(next===6)setFinished(true)
  },1250)
 }
 const sectors=palette.map((color,i)=>{
  const a=(-90+i*45)*Math.PI/180,b=(-90+(i+1)*45)*Math.PI/180
  const x=t=>150+120*Math.cos(t),y=t=>150+120*Math.sin(t)
  return <path key={i} d={`M150 150 L${x(a)} ${y(a)} A120 120 0 0 1 ${x(b)} ${y(b)} Z`} fill={color} stroke="#101010" strokeWidth="3"/>
 })
 return <div className="mx-auto max-w-lg text-center">
  <p className="text-xs font-black tracking-[.2em] text-[#BBFF1F]">PR SPIN</p>
  <h3 className="mt-2 text-2xl font-black">Descubrí tus seis deberes</h3>
  <p className="mt-2 text-sm text-white/50">Tocá el botón para girar la ruleta y descubrir un deber. Cuando termine, volvé a tocarlo para descubrir el siguiente. Son seis giros, uno por cada ejercicio.</p>
  <p className="mt-2 text-xs leading-5 text-white/60">Los deberes quedan guardados. No tenés que hacerlos todos hoy: podés completarlos durante el mes, a tu ritmo.</p>
  <svg viewBox="0 0 300 310" className="mx-auto mt-3 w-full max-w-[310px]" role="img" aria-label="Ruleta de ocho sectores">
   <g style={{transformOrigin:'150px 150px',transform:`rotate(${angle}deg)`,transition:'transform 1.2s cubic-bezier(.1,.75,.12,1)'}}>{sectors}<circle cx="150" cy="150" r="43" fill="#0D0303" stroke="#EFF8FF" strokeWidth="3"/><text x="150" y="159" fill="#BBFF1F" textAnchor="middle" fontSize="28" fontWeight="900">PR</text></g>
   <path d="M137 8 L163 8 L150 35 Z" fill="#BBFF1F" stroke="#EFF8FF" strokeWidth="2"/>
  </svg>
  <p className="mt-2 text-xs font-bold text-[#BBFF1F]" aria-live="polite">{shown} de 6 descubiertos</p>
  <div aria-live="polite" className="mt-2 grid grid-cols-2 gap-2 text-left">{Array.from({length:6},(_,i)=><div key={i} className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs"><span className="font-black text-[#BBFF1F]">{i+1}. </span>{i<shown?duties[i]?.title:'Por descubrir'}</div>)}</div>
  {finished?<button onClick={onComplete} className="mt-5 rounded-full bg-[#BBFF1F] px-6 py-3 font-black text-[#0D0303]">Ver mis deberes</button>:<button disabled={running||duties.length!==6} onClick={start} className="mt-5 rounded-full bg-[#BBFF1F] px-6 py-3 font-black text-[#0D0303] disabled:opacity-50">{running?'Girando…':`Girar · deber ${shown+1} de 6`}</button>}
 </div>
}
