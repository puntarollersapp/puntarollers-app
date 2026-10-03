export { supabase } from '../../../../src/lib/supabase'
import { supabase } from '../../../../src/lib/supabase'
export async function getPRAdmin(authUser){
 if(!authUser)return null
 const {data,error}=await supabase.from('profiles').select('id,role,email,nombre').eq('auth_user_id',authUser.id).maybeSingle()
 return !error&&data?.role==='admin'?{...authUser,email:data.email||authUser.email}:null
}
