import React,{useEffect,useRef,useId} from 'react'
import {createPortal} from 'react-dom'

// Native modal top layer: unaffected by ancestor transforms, isolation or overflow.
export default function TrainingPartnerDialog({title,subtitle,query,onQuery,onClose,children,footer,theme='duo'}){
 const ref=useRef(null),closeRef=useRef(onClose),heading=useId()
 closeRef.current=onClose
 useEffect(()=>{
  const el=ref.current;if(!el)return
  const prior=document.activeElement
  const body=document.body,root=document.documentElement
  const prevBody=body.style.overflow,prevRoot=root.style.overflow
  body.style.overflow='hidden';root.style.overflow='hidden'
  const viewport=window.visualViewport
  const resize=()=>{const height=viewport?.height||window.innerHeight;el.style.setProperty('--partner-vh',height+'px');el.style.setProperty('--partner-top',(viewport?.offsetTop||0)+'px')}
  resize();viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',resize);window.addEventListener('resize',resize)
  el.showModal()
  return()=>{if(el.open)el.close();viewport?.removeEventListener('resize',resize);viewport?.removeEventListener('scroll',resize);window.removeEventListener('resize',resize);body.style.overflow=prevBody;root.style.overflow=prevRoot;prior?.focus?.({preventScroll:true})}
 },[])
 return createPortal(<dialog ref={ref} aria-labelledby={heading} aria-modal="true" onCancel={e=>{e.preventDefault();closeRef.current()}} className="pr-partner-dialog" style={{'--partner-bg':theme==='team'?'#18313B':'#201B2C','--partner-border':theme==='team'?'#67E8F955':'#A78BFA66'}}>
 <style>{`
 .pr-partner-dialog{position:fixed;inset:auto;top:var(--partner-top,0px);left:0;right:0;margin:0 auto;width:100%;max-width:none;height:var(--partner-vh,100dvh);max-height:none;padding:0;border:0;overflow:hidden;background:transparent;color:white;overscroll-behavior:none;}
 .pr-partner-dialog::backdrop{background:rgba(0,0,0,.85);}
 .pr-partner-shell{box-sizing:border-box;display:flex;align-items:center;justify-content:center;height:100%;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));}
 .pr-partner-panel{animation:prPartnerEnter .24s cubic-bezier(.2,.75,.2,1) both;display:flex;flex-direction:column;width:100%;max-width:448px;height:min(700px,100%);min-height:0;overflow:hidden;background:var(--partner-bg);border:1px solid var(--partner-border);border-radius:24px;box-shadow:0 20px 65px #0009;}
 .pr-partner-list{flex:1 1 0%;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-gutter:stable;padding:12px 16px;}
 .pr-partner-header,.pr-partner-footer{flex-shrink:0;padding:12px 16px;background:var(--partner-bg);}
 .pr-partner-header{border-bottom:1px solid #ffffff15;}
 .pr-partner-footer{border-top:1px solid #ffffff15;}
 .pr-partner-close{display:grid;place-items:center;min-width:44px;min-height:44px;border-radius:12px;background:#ffffff0d;font-size:23px;line-height:1;}
 .pr-partner-search{font-size:16px!important;}
 .pr-partner-row{display:flex;align-items:center;gap:12px;width:100%;min-height:66px;padding:11px 12px;border-radius:16px;border:1px solid #ffffff0b;background:linear-gradient(120deg,#ffffff09,#ffffff04);text-align:left;transition:background .16s,border-color .16s,transform .16s;}
 .pr-partner-row[aria-pressed=true]{border-color:var(--partner-border);background:#ffffff14;}
 .pr-partner-row:disabled{opacity:.65;cursor:default;}
 .pr-partner-avatar{width:44px;height:44px;flex:0 0 44px;border-radius:50%;position:relative;overflow:hidden;background:#ffffff15;display:grid;place-items:center;font-weight:900;}
 .pr-partner-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
 @keyframes prPartnerEnter{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
 @media(prefers-reduced-motion:reduce){.pr-partner-panel{animation:none}.pr-partner-row{transition:none}}
 @media(max-height:380px){.pr-partner-header,.pr-partner-footer{padding:6px 12px}.pr-partner-header p{display:none}.pr-partner-panel{border-radius:12px}.pr-partner-shell{padding:4px}}
 `}</style>
 <div className="pr-partner-shell" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div className="pr-partner-panel">
   <header className="pr-partner-header"><div className="flex items-center justify-between gap-3"><h3 id={heading} className="text-base font-black">{title}</h3><button type="button" autoFocus className="pr-partner-close" aria-label="Cerrar selector" onClick={onClose}>×</button></div>{subtitle&&<p className="mt-1 text-sm text-white/65">{subtitle}</p>}<input aria-label="Buscar por nombre" value={query} onChange={e=>onQuery(e.target.value)} placeholder="Buscar por nombre" className="pr-partner-search mt-2 w-full rounded-xl border border-white/15 bg-black/20 p-3 text-white"/></header>
   <div className="pr-partner-list">{children}</div>
   {footer&&<footer className="pr-partner-footer">{footer}</footer>}
  </div>
 </div>
 </dialog>,document.body)
}

export function TrainingPartnerRow({person,selected=false,busy=false,onSelect,theme='duo'}){
 const eligible=person.eligible!==false
 return <button type="button" disabled={busy||!eligible} aria-pressed={selected} onClick={onSelect} className="pr-partner-row"><span className="pr-partner-avatar"><span>{person.name?.[0]||'P'}</span>{person.foto&&<img src={person.foto} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>}</span><span className="min-w-0 flex-1"><strong className="block break-words text-sm">{person.name}</strong>{!eligible&&<small className="mt-1 block text-[11px] leading-4 text-white/65">{person.reason||'No disponible para este desafío'}</small>}</span><span className={'shrink-0 text-[11px] font-bold '+(eligible?(theme==='team'?'text-cyan-200':'text-violet-200'):'text-white/50')}>{eligible?(selected?'✓ Elegido':'Elegir'):'No disponible'}</span></button>
}
