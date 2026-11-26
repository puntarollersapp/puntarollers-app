import {useState} from 'react'
import {accessoryUrl,useEquippedAccessory} from '../lib/profileAccessories'

// Mount inside a position:relative avatar wrapper, OUTSIDE its clipped photo.
export default function ProfileAccessory({profileId,preview,large=false}){
 const equipped=useEquippedAccessory(preview?null:profileId)
 const item=preview||equipped
 const src=accessoryUrl(item?.asset_file)
 const [failed,setFailed]=useState('')
 if(!src||failed===src)return null
 return <img src={src} onError={()=>setFailed(src)} alt={item.title||'Accesorio PR'} title={item.title||'Accesorio PR'} draggable={false} decoding="async" className="pointer-events-none absolute z-[21] object-contain select-none" style={{right:'-7%',bottom:'-4%',width:large?'38%':'43%',height:large?'38%':'43%',filter:'drop-shadow(0 2px 3px rgba(0,0,0,.75))'}}/>
}
