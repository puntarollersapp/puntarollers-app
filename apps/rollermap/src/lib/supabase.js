import { createClient } from '@supabase/supabase-js'
export const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY)
export async function getPRAdmin(authUser){
 if(!authUser)return null
 const {data,error}=await supabase.from('profiles').select('id,role,email,nombre').eq('auth_user_id',authUser.id).maybeSingle()
 return !error&&data?.role==='admin'?{...authUser,email:data.email||authUser.email}:null
}
