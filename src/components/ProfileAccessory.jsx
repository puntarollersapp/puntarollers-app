import {useState,useEffect} from 'react'
import {useAuth} from '../lib/auth'
import {ACCESSORY_RELEASE,accessoryUrl,useEquippedAccessory,useProfileVisualRefresh} from '../lib/profileAccessories'

// Mount inside a position:relative avatar wrapper, OUTSIDE its clipped photo.
export default function ProfileAccessory({profileId,preview,large=false}){
 const {user}=useAuth()
 const visualRefresh=useProfileVisualRefresh(user)
 const [now,setNow]=useState(Date.now)
 useEffect(()=>{if(now>=ACCESSORY_RELEASE)return;const t=setTimeout(()=>setNow(Date.now()),Math.min(ACCESSORY_RELEASE-now,60000));return()=>clearTimeout(t)},[now])
 const visible=Boolean(user?.id&&(now>=ACCESSORY_RELEASE||(user.id==='admin-claudio'&&user.role==='admin'&&profileId==='admin-claudio')))
 const equipped=useEquippedAccessory(!preview&&visible?profileId:null)
 const item=preview||(visible?equipped:null)
 const src=accessoryUrl(item?.asset_file)
 const [failed,setFailed]=useState('')
 if(!src||failed===src)return null
 return <img src={src} onError={()=>setFailed(src)} alt={item.title||'Accesorio PR'} title={item.title||'Accesorio PR'} draggable={false} decoding="async" className="pointer-events-none absolute z-[21] object-contain select-none" style={{right:'-7%',bottom:'-4%',width:large?(visualRefresh?'42%':'38%'):(visualRefresh?'50%':'43%'),height:large?(visualRefresh?'42%':'38%'):(visualRefresh?'50%':'43%'),objectFit:'contain',filter:'drop-shadow(0 2px 3px rgba(0,0,0,.75))'}}/>
}
