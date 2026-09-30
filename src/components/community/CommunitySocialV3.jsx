import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CommunitySocialV2 from './CommunitySocialV2'

export default function CommunitySocialV3(){
  const navigate=useNavigate()
  const root=useRef(null)

  useEffect(()=>{
    const host=root.current
    if(!host)return

    const enhance=()=>{
      const sections=[...host.querySelectorAll(':scope > div > section')]
      if(sections[0]&&!host.querySelector('[data-pr-messages]')){
        const banner=document.createElement('button')
        banner.type='button'
        banner.dataset.prMessages='true'
        banner.className='pr-messages-banner'
        banner.innerHTML='<span class="pr-msg-orb" aria-hidden="true">💬</span><span class="pr-msg-copy"><small>MENSAJES</small><strong>Tu círculo te espera</strong><em>Conversaciones PR en un solo lugar</em></span><span class="pr-msg-arrow" aria-hidden="true">→</span>'
        banner.addEventListener('click',()=>navigate('/app/mensajes'))
        sections[0].insertAdjacentElement('afterend',banner)
      }

      const albumModal=host.querySelector('.fixed.inset-0.z-\\[190\\]')
      const photoModal=host.querySelector('.fixed.inset-0.z-\\[200\\]')
      albumModal?.classList.add('pr-album-modal')
      photoModal?.classList.add('pr-photo-modal')

      if(photoModal&&!photoModal.querySelector('[data-pr-back-album]')){
        const shell=photoModal.querySelector('.mx-auto.max-w-md')
        if(shell){
          const bar=document.createElement('div')
          bar.dataset.prBackAlbum='true'
          bar.className='pr-photo-backbar'
          const back=document.createElement('button')
          back.type='button'
          back.className='pr-photo-back'
          back.innerHTML='<span>←</span><span><small>VOLVER</small><strong>Álbum</strong></span>'
          back.addEventListener('click',()=>{
            const close=[...photoModal.querySelectorAll('button')].find(b=>b.textContent.trim()==='×')
            close?.click()
          })
          bar.appendChild(back)
          shell.prepend(bar)
        }
      }

      document.documentElement.classList.toggle('pr-community-modal-open',Boolean(albumModal||photoModal))
      document.documentElement.classList.toggle('pr-community-photo-open',Boolean(photoModal))
    }

    enhance()
    const observer=new MutationObserver(enhance)
    observer.observe(host,{childList:true,subtree:true})
    return()=>{
      observer.disconnect()
      document.documentElement.classList.remove('pr-community-modal-open','pr-community-photo-open')
    }
  },[navigate])

  return <div ref={root} className="community-social-v3"><CommunitySocialV2/><style>{`
    .pr-messages-banner{position:relative;isolation:isolate;display:flex;width:100%;min-height:72px;align-items:center;gap:12px;overflow:hidden;border:1px solid rgba(52,211,153,.25);border-radius:24px;padding:11px 14px;text-align:left;background:radial-gradient(circle at 12% 50%,rgba(52,211,153,.20),transparent 30%),linear-gradient(100deg,#06251c 0%,#0a1715 52%,#07110f 100%);box-shadow:0 16px 38px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.04);color:white}
    .pr-messages-banner:after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.07) 50%,transparent 65%);transform:translateX(-120%);animation:prMsgSweep 5.8s ease-in-out infinite;pointer-events:none}
    .pr-msg-orb{display:grid;width:46px;height:46px;flex:0 0 46px;place-items:center;border:1px solid rgba(110,231,183,.22);border-radius:16px;background:rgba(16,185,129,.12);font-size:22px;box-shadow:0 0 24px rgba(16,185,129,.10);animation:prMsgFloat 2.8s ease-in-out infinite}
    .pr-msg-copy{display:flex;min-width:0;flex:1;flex-direction:column}.pr-msg-copy small{font-size:8px;font-weight:950;letter-spacing:.19em;color:#6ee7b7}.pr-msg-copy strong{margin-top:3px;font-size:14px;line-height:1.1}.pr-msg-copy em{margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-style:normal;color:rgba(255,255,255,.38)}
    .pr-msg-arrow{display:grid;width:34px;height:34px;place-items:center;border-radius:12px;background:rgba(255,255,255,.06);font-size:17px;color:#a7f3d0}
    .pr-photo-modal,.pr-album-modal{z-index:1000!important;padding-top:max(10px,env(safe-area-inset-top))!important;padding-bottom:max(14px,env(safe-area-inset-bottom))!important}
    .pr-photo-backbar{position:sticky;top:0;z-index:30;margin-bottom:10px;padding:2px 0 7px;background:linear-gradient(#000 70%,transparent)}
    .pr-photo-back{display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.11);border-radius:16px;padding:8px 12px;background:#101014;color:white;box-shadow:0 8px 28px rgba(0,0,0,.3)}.pr-photo-back>span:first-child{font-size:22px}.pr-photo-back>span:last-child{display:flex;flex-direction:column;text-align:left}.pr-photo-back small{font-size:7px;font-weight:900;letter-spacing:.15em;color:#a78bfa}.pr-photo-back strong{font-size:11px}
    html.pr-community-modal-open .pr-weekly-ranking-shortcut{display:none!important}
    @keyframes prMsgSweep{0%,68%,100%{transform:translateX(-120%)}82%{transform:translateX(120%)}}@keyframes prMsgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @media (prefers-reduced-motion:reduce){.pr-messages-banner:after,.pr-msg-orb{animation:none!important}}
  `}</style></div>
}
