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
  if(running||finished||duties.length!==6)return
  cancelled.current=false;setRunning(true)
  let index=0,rotation=0
  const next=()=>{
   if(cancelled.current)return
   if(index===6){setRunning(false);setFinished(true);return}
   rotation+=1800+((index*3+1)%8)*45
   setAngle(rotation)
   timeout.current=setTimeout(()=>{
    if(cancelled.current)return
    index+=1;setShown(index)
    timeout.current=setTimeout(next,350)
   },1250)
  }
  next()
 }
 const sectors=palette.map((color,i)=>{
  const a=(-90+i*45)*Math.PI/180,b=(-90+(i+1)*45)*Math.PI/180
  const x=t=>150+120*Math.cos(t),y=t=>150+120*Math.sin(t)
  return <path key={i} d={`M150 150 L${x(a)} ${y(a)} A120 120 0 0 1 ${x(b)} ${y(b)} Z`} fill={color} stroke="#101010" strokeWidth="3"/>
 })
 return <div className="mx-auto max-w-lg text-center">
  <p className="text-xs font-black tracking-[.2em] text-[#BBFF1F]">PR SPIN</p>
  <h3 className="mt-2 text-2xl font-black">Descubrí tus seis deberes</h3>
  <svg viewBox="0 0 300 310" className="mx-auto mt-3 w-full max-w-[310px]" role="img" aria-label="Ruleta de ocho sectores">
   <g style={{transformOrigin:'150px 150px',transform:`rotate(${angle}deg)`,transition:'transform 1.2s cubic-bezier(.1,.75,.12,1)'}}>{sectors}<circle cx="150" cy="150" r="43" fill="#0D0303" stroke="#EFF8FF" strokeWidth="3"/><text x="150" y="159" fill="#BBFF1F" textAnchor="middle" fontSize="28" fontWeight="900">PR</text></g>
   <path d="M137 8 L163 8 L150 35 Z" fill="#BBFF1F" stroke="#EFF8FF" strokeWidth="2"/>
  </svg>
  <div aria-live="polite" className="mt-2 grid grid-cols-2 gap-2 text-left">{Array.from({length:6},(_,i)=><div key={i} className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs"><span className="font-black text-[#BBFF1F]">{i+1}. </span>{i<shown?duties[i]?.title:'Por descubrir'}</div>)}</div>
  {finished?<button onClick={onComplete} className="mt-5 rounded-full bg-[#BBFF1F] px-6 py-3 font-black text-[#0D0303]">Ver mis deberes</button>:<button disabled={running||duties.length!==6} onClick={start} className="mt-5 rounded-full bg-[#BBFF1F] px-6 py-3 font-black text-[#0D0303] disabled:opacity-50">{running?'Descubriendo…':'Girar PR SPIN'}</button>}
 </div>
}
