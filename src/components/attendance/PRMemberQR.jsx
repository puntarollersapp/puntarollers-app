import { useEffect,useRef,useState } from 'react'
import QRCode from 'qrcode'
export function buildPRCheckPayload(profileId){return `PRCHECK:2026:${profileId}`}
export default function PRMemberQR({profileId,size=240}){
 const canvas=useRef(null),[ok,setOk]=useState(false)
 useEffect(()=>{let alive=true;if(!profileId||!canvas.current)return;QRCode.toCanvas(canvas.current,buildPRCheckPayload(profileId),{width:size,margin:2,errorCorrectionLevel:'M',color:{dark:'#09090d',light:'#ffffff'}},err=>{if(alive)setOk(!err)});return()=>{alive=false}},[profileId,size])
 return <div className="relative grid place-items-center"><div className="absolute -inset-5 rounded-[36px] bg-cyan-300/[.06] blur-2xl"/><div className="relative rounded-[28px] border border-white/[.12] bg-white p-4 shadow-[0_20px_70px_rgba(34,211,238,.12)]"><canvas ref={canvas} aria-label="QR personal Punta Rollers" className="block max-w-full rounded-[14px]"/>{!ok&&<div className="absolute inset-0 grid place-items-center bg-white text-[9px] font-black text-black">GENERANDO PR ID…</div>}</div><div className="relative mt-3 rounded-full border border-cyan-200/15 bg-cyan-200/[.045] px-3 py-1.5 text-[7px] font-black tracking-[.16em] text-cyan-100/55">ID ÚNICO · {profileId?.slice(0,8)?.toUpperCase()}</div></div>
}
