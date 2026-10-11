import { supabase } from './supabase'

/** Beta eligibility is server-authorized through pr_beta_access RLS. */
export async function getBetaAccess(profileId) {
  if (!profileId) return { enabled: false, features: {} }
  const { data, error } = await supabase.from('pr_beta_access')
    .select('enabled, features').eq('profile_id', profileId).maybeSingle()
  if (error || !data?.enabled) return { enabled: false, features: {} }
  return { enabled: true, features: data.features || {} }
}

export function isBetaFeatureEnabled(access, feature) {
  return Boolean(access?.enabled && access?.features?.[feature] === true)
}
