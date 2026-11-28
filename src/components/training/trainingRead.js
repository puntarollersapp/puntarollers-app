import {supabase} from '../../lib/supabase'

export function trainingNetworkError(error){
 const message=String(error?.message||error||'')
 return /failed to fetch|networkerror|network request failed|load failed|fetch failed|aborterror|timed? ?out|connection reset/i.test(message)||[502,503,504].includes(Number(error?.status))
}
export function trainingErrorMessage(error){
 if(trainingNetworkError(error))return 'No pudimos conectar con Punta Rollers. Revisá tu conexión e intentá nuevamente.'
 return 'No pudimos completar la consulta. '+String(error?.message||error||'Intentá nuevamente.').slice(0,180)
}
// Retry only read operations. Never automatically repeat invitations or submissions.
export async function trainingRead(name,args={},signal){
 let result
 for(let attempt=0;attempt<2;attempt++){
  if(signal?.aborted)return {data:null,error:null,cancelled:true}
  try{let request=supabase.rpc(name,args);if(signal)request=request.abortSignal(signal);result=await request}catch(error){result={data:null,error}}
  if(signal?.aborted)return {data:null,error:null,cancelled:true}
  if(!result.error||!trainingNetworkError(result.error)||attempt===1)return result
  await new Promise(resolve=>setTimeout(resolve,650))
 }
 return result
}
