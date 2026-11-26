import {useCallback,useEffect,useState} from 'react'
import {supabase} from './supabase'
const EVENT='pr-notifications-changed'
export function useRollerFeedNotices(profileId, countOnly=false){
  const [state,setState]=useState({owner:null,items:[],unread:0,status:'loading'})
  const [refreshKey,setRefreshKey]=useState(0)
  const refresh=useCallback(()=>setRefreshKey(n=>n+1),[])
  useEffect(()=>{
    if(!profileId)return
    let active=true, seq=0
    async function load(){
      const request=++seq
      try{
        const {data,error}=await supabase.rpc('pr_rollerfeed_notifications',{p_count_only:countOnly})
        if(!active||request!==seq)return
        if(error)throw error
        setState({owner:profileId,items:Array.isArray(data?.items)?data.items:[],unread:Number(data?.unread_count)||0,status:'ok'})
      }catch{if(active&&request===seq)setState(prev=>prev.owner===profileId?{...prev,status:'error'}:{owner:profileId,items:[],unread:0,status:'error'})}
    }
    const visible=()=>{if(document.visibilityState!=='hidden')load()}
    load()
    const interval=window.setInterval(visible,30000)
    window.addEventListener(EVENT,visible);window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible)
    const channel=supabase.channel('pr-rf-notices-'+(countOnly?'nav-':'panel-')+profileId).on('postgres_changes',{event:'*',schema:'public',table:'community_notifications',filter:'recipient_id=eq.'+profileId},visible).subscribe()
    return()=>{active=false;window.clearInterval(interval);window.removeEventListener(EVENT,visible);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);supabase.removeChannel(channel)}
  },[profileId,countOnly,refreshKey])
  const mark=useCallback(async(id=null)=>{
    try{const {error}=await supabase.rpc('pr_rollerfeed_mark_read',{p_notice:id});if(error)return false;window.dispatchEvent(new Event(EVENT));return true}catch{return false}
  },[])
  return {...(state.owner===profileId?state:{items:[],unread:0,status:'loading'}),mark,refresh}
}
export function rollerFeedTarget(kind,entityId){
  if(kind==='pr_general_staff_post'&&entityId)return '/app/actividad?socialPost='+encodeURIComponent(entityId)
  if(kind==='pr_general_feedback_nov24')return '/app/voice'
  if(kind==='pr_general_poll_results_nov24')return '#rollerfeed-votaciones'
  if(kind==='pr_profile_verified')return '/app/perfil'
  if(kind.startsWith('training_'))return '/app/deberes'
  if(kind.startsWith('pr_awards_'))return '/pr-awards'
  if(kind==='pr_general_valentino_badge')return '/app/insignias'
  if(kind==='rollermap_explorer_launch')return '/app/rollermap'
  return '#rollerfeed-novedades'
}
export function rollerFeedNoticeIcon(kind){
  if(kind==='pr_general_staff_post')return '📸'
  if(kind.includes('feedback')&&!kind.startsWith('training_'))return '💬'
  if(kind.startsWith('training_'))return '🏅'
  if(kind.includes('awards')||kind.includes('poll_results'))return '🏆'
  if(kind.includes('badge')||kind.includes('verified'))return '✦'
  return '📣'
}
export function noticeDate(value){
  const time=Date.parse(value);if(!Number.isFinite(time))return ''
  const m=Math.max(0,Math.floor((Date.now()-time)/60000))
  if(m<1)return 'Ahora';if(m<60)return 'Hace '+m+' min';if(m<1440)return 'Hace '+Math.floor(m/60)+' h'
  return new Intl.DateTimeFormat('es-UY',{timeZone:'America/Montevideo',day:'numeric',month:'short'}).format(new Date(time))
}
