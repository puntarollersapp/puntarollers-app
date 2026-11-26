import {useState,useEffect} from 'react'
import {useAuth} from '../lib/auth'
import {ACCESSORY_RELEASE,accessoryUrl,useEquippedAccessory} from '../lib/profileAccessories'

// Mount inside a position:relative avatar wrapper, OUTSIDE its clipped photo.
export default function ProfileAccessory({profileId,preview,large=false}){
 const {user}=useAuth()
 const [now,setNow]=useState(Date.now)
 useEffect(()=>{if(now>=ACCESSORY_RELEASE)return;const t=setTimeout(()=>setNow(Date.now()),Math.min(ACCESSORY_RELEASE-now,60000));return()=>clearTimeout(t)},[now])
 const visible=Boolean(user?.id&&(now>=ACCESSORY_RELEASE||(user.id==='admin-claudio'&&user.role==='admin'&&profileId==='admin-claudio')))
 const equipped=useEquippedAccessory(!preview&&visible?profileId:null)
 const item=preview||(visible?equipped:null)
 const src=accessoryUrl(item?.asset_file)
 const [failed,setFailed]=useState('')
 if(!src||failed===src)return null
 return <img src={src} onError={()=>setFailed(src)} alt={item.title||'Accesorio PR'} title={item.title||'Accesorio PR'} draggable={false} decoding="async" className="pointer-events-none absolute z-[21] object-contain select-none" style={{right:large?'-15%':'-7%',top:large?'50%':undefined,bottom:large?undefined:'-4%',transform:large?'translateY(-50%)':undefined,width:large?'34%':'43%',height:large?'34%':'43%',objectFit:'contain',filter:'drop-shadow(0 3px 5px rgba(0,0,0,.65))'}}/>
}
