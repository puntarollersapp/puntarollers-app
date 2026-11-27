import { Link, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useCardsAccess } from '../lib/cartas'
import { DECEMBER_NAV_START } from '../lib/prDecemberNavigation'
import './PRCollectiblesVisual.css'

const root='/pr-collectibles/'
export function CollectiblesFan({className=''}) {
 return <div className={'prc-fan '+className} aria-hidden="true">
   <div className="prc-orbit"/>
   <div className="prc-fan-card prc-fan-left"><img src={root+'PR-035.png'} alt="" decoding="async" draggable="false"/></div>
   <div className="prc-fan-card prc-fan-right"><img src={root+'PR-036.png'} alt="" decoding="async" draggable="false"/></div>
   <div className="prc-fan-card prc-fan-center"><img src={root+'PR-BACK.png'} alt="" decoding="async" draggable="false"/></div>
 </div>
}
export function CollectiblesHero() {
 return <header className="prc-hero"><div className="prc-hero-art" aria-hidden="true"><CollectiblesFan/></div><div className="prc-hero-copy"><p className="prc-eyebrow"><span/> PUNTA ROLLERS · COLECCIÓN 001</p><h1 className="prc-wordmark font-display"><span>PR</span><span>COLLECTIBLES</span></h1><p className="prc-hero-tag">LAS CARTAS NO SE COMPRAN.<br/><strong>SE VIVEN.</strong></p><p className="prc-hero-description">Tu historia sobre ruedas, convertida en colección.</p></div></header>
}
export function CollectiblesBanner({user}) {
 const allowed=useCardsAccess(user)
 if(!allowed)return null
 return <Link to="/app/cartas" className="prc-banner group" aria-label="Abrir álbum PR Collectibles"><CollectiblesFan/><div className="prc-banner-copy"><p className="prc-eyebrow"><span/> COLECCIÓN 001 · ÁLBUM DIGITAL</p><h2 className="prc-wordmark font-display"><span>PR</span><span>COLLECTIBLES</span></h2><p>Desbloqueá tus logros. Coleccioná tu historia.</p><span className="prc-banner-action">Abrir mi álbum <span aria-hidden="true">↗</span></span></div></Link>
}
export function PRSideShortcut({user}) {
 const allowed=useCardsAccess(user)
 const {pathname}=useLocation()
 const visible=pathname.startsWith('/app/')&&!/^\/app\/(?:rollermap|mensajes|comunidad)(?:\/|$)/.test(pathname)
 if(!visible||typeof document==='undefined')return null
 if(allowed){
   if(pathname.startsWith('/app/cartas'))return null
   return createPortal(<Link to="/app/cartas" className="prc-side" aria-label="Abrir mi álbum PR Collectibles"><span className="prc-side-card"><img src={root+'PR-BACK.png'} alt="" draggable="false" decoding="async"/><span className="prc-side-sheen"/></span></Link>,document.body)
 }
 if(Date.now()>=DECEMBER_NAV_START||pathname==='/app/conversometro')return null
 return createPortal(<Link to="/app/conversometro" className="pr-conversometro-shortcut" aria-label="Abrir Conversómetro PR"><span className="pr-conversometro-bubble" aria-hidden="true">💬</span><span className="pr-conversometro-vertical">CONVERSÓMETRO</span></Link>,document.body)
}
