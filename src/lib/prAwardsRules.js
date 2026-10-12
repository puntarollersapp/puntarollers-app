/** PR Awards participant rules — Beta. No production data is read or changed here. */
export const PR_AWARDS_TEAM_MEMBERS = Object.freeze(['Claudio', 'Lucía', 'David'])
/**
 * The public nominee directory must include eligible team members as well as
 * students. IDs must come from actual approved records; never fabricate IDs.
 * A profile is published only if it is explicitly marked public for awards.
 */
export function awardsEligibleProfiles(profiles = []) {
  const byId = new Map()
  for (const profile of profiles) {
    if (!profile || !profile.id || !profile.awards_public_opt_in) continue
    if (!profile.display_name || !String(profile.display_name).trim()) continue
    if (!['student', 'teacher', 'admin', 'staff'].includes(profile.awards_role)) continue
    byId.set(String(profile.id), {
      id: String(profile.id),
      display_name: String(profile.display_name).trim(),
      photo_url: profile.awards_photo_public ? (profile.photo_url || null) : null,
    })
  }
  return [...byId.values()].sort((a,b)=>a.display_name.localeCompare(b.display_name,'es'))
}
