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
 .pr-partner-panel{display:flex;flex-direction:column;width:100%;max-width:448px;height:min(700px,100%);min-height:0;overflow:hidden;background:var(--partner-bg);border:1px solid var(--partner-border);border-radius:24px;box-shadow:0 20px 65px #0009;}
 .pr-partner-list{flex:1 1 0%;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-gutter:stable;padding:12px 16px;}
 .pr-partner-header,.pr-partner-footer{flex-shrink:0;padding:12px 16px;background:var(--partner-bg);}
 .pr-partner-header{border-bottom:1px solid #ffffff15;}
 .pr-partner-footer{border-top:1px solid #ffffff15;}
 .pr-partner-close{display:grid;place-items:center;min-width:44px;min-height:44px;border-radius:12px;background:#ffffff0d;font-size:23px;line-height:1;}
 .pr-partner-search{font-size:16px!important;}
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
