import { useEffect, useState } from 'react'

const UPDATE_ART='/profile-badge.png'

export default function LoadingScreen({onDone}){
  const[leaving,setLeaving]=useState(false)
  useEffect(()=>{const t1=setTimeout(()=>setLeaving(true),2400),t2=setTimeout(()=>onDone?.(),2900);return()=>{clearTimeout(t1);clearTimeout(t2)}},[onDone])
  return <div className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#050610] transition-opacity duration-500 ${leaving?'pointer-events-none opacity-0':'opacity-100'}`}>
    <div className="absolute inset-0" style={{background:'radial-gradient(circle at 22% 22%,rgba(0,229,255,.18),transparent 30%),radial-gradient(circle at 78% 74%,rgba(145,70,255,.22),transparent 34%),radial-gradient(circle at 62% 28%,rgba(255,45,196,.10),transparent 24%),linear-gradient(145deg,#03050b 0%,#08061a 52%,#030711 100%)'}}/>
    <div className="absolute inset-0 opacity-30" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)',backgroundSize:'34px 34px',maskImage:'linear-gradient(to bottom,transparent,black 25%,black 80%,transparent)'}}/>
    <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-7 text-center">
      <div className="mb-7 w-64 max-w-[74vw]">
        <div className="h-[7px] overflow-hidden rounded-full border border-cyan-200/20 bg-white/[.055] p-[1px] shadow-[0_0_30px_rgba(0,229,255,.10)]"><div className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#00E5FF] via-[#8B5CFF] to-[#FF3DC8]" style={{animation:'prNextLoader 2.35s cubic-bezier(.2,.8,.2,1) both',boxShadow:'0 0 16px rgba(0,229,255,.45),0 0 24px rgba(139,92,255,.24)'}}/></div>
        <div className="mt-3 flex items-center justify-between font-mono text-[7px] font-black uppercase tracking-[.22em] text-white/30"><span>PR NEXT</span><span>CARGANDO</span></div>
      </div>
      <img src={UPDATE_ART} width="479" height="600" alt="Punta Rollers" className="block h-auto w-[210px] max-w-[64vw] object-contain" style={{filter:'drop-shadow(0 0 22px rgba(0,229,255,.20)) drop-shadow(0 0 34px rgba(139,92,255,.18))'}}/>
    </div>
    <style>{`@keyframes prNextLoader{0%{transform:scaleX(.025);opacity:.5}65%{transform:scaleX(.76);opacity:1}100%{transform:scaleX(1)}}`}</style>
  </div>
}