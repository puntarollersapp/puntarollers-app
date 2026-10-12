import { supabase } from './supabase'

/** All reads are from explicit public-facing awards tables. Never query private profiles here. */
export async function getAwardsDirectory() {
 const {data,error}=await supabase.from('pr_awards_candidates').select('id,display_name,public_photo_url').eq('is_public',true).order('display_name')
 if(error) throw error
 return data || []
}
export async function getAwardsCategories() {
 const {data,error}=await supabase.from('pr_awards_categories').select('id,title,description,section,is_automatic,sort_order').eq('is_active',true).order('sort_order')
 if(error) throw error
 return data || []
}
export async function getAwardsFinalists() {
 const {data,error}=await supabase.from('pr_awards_finalists').select('id,category_id,candidate_id,finalist_position').order('finalist_position')
 if(error) throw error
 return data || []
}
export async function submitAwardsNomination(categoryId,candidateId=null,manualName=null) {
 const {data,error}=await supabase.rpc('pr_awards_submit_nomination',{p_category:categoryId,p_candidate:candidateId,p_manual_name:manualName})
 if(error) throw error
 return data
}
export async function submitAwardsSuggestion(title,description) {
 const {data,error}=await supabase.rpc('pr_awards_submit_suggestion',{p_title:title,p_description:description})
 if(error) throw error
 return data
}
export async function castAwardsVote(finalistId) {
 const {data,error}=await supabase.rpc('pr_awards_cast_vote',{p_finalist:finalistId})
 if(error) throw error
 return data
}
