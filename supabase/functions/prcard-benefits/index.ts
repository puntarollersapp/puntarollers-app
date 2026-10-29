import { createClient } from 'npm:@supabase/supabase-js@2.57.0'

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
})

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) return json({ error: 'Authentication required' }, 401)

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !secret) return json({ error: 'Service unavailable' }, 503)

  // Verify the actual Supabase Auth user; never trust a client-supplied profile ID or PIN.
  const authClient = createClient(url, anon, { auth: { persistSession: false } })
  const { data: auth, error: authError } = await authClient.auth.getUser(token)
  if (authError || !auth.user) return json({ error: 'Invalid session' }, 401)

  const admin = createClient(url, secret, { auth: { persistSession: false } })
  const { data: profiles, error: profileError } = await admin.from('profiles')
    .select('id,prcard_activa').eq('auth_user_id', auth.user.id).limit(2)
  if (profileError) return json({ error: 'Profile lookup unavailable' }, 503)
  if (!profiles || profiles.length !== 1) return json({ eligible: false, benefits: [] })

  const profile = profiles[0]
  if (!profile.prcard_activa) return json({ eligible: false, benefits: [] })

  const { data: links, error: linkError } = await admin.from('prcard_membership_links')
    .select('review_status,card_status,expires_date').eq('profile_id', profile.id).limit(2)
  if (linkError) return json({ error: 'Membership lookup unavailable' }, 503)
  if (!links || links.length !== 1 || links[0].review_status !== 'verified') {
    return json({ eligible: false, benefits: [] })
  }

  const link = links[0]
  if (String(link.card_status || '').toLowerCase() !== 'active') {
    return json({ eligible: false, benefits: [] })
  }
  if (link.expires_date && link.expires_date < new Date().toISOString().slice(0, 10)) {
    return json({ eligible: false, benefits: [] })
  }

  const { data: benefits, error: benefitsError } = await admin.from('prcard_benefits')
    .select('id,commerce,title,description,redeem,category,valid_until_label,logo_url,phone,social,active,featured,sort_order')
    .eq('active', true).order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (benefitsError) return json({ error: 'Catalog unavailable' }, 503)
  return json({ eligible: true, benefits: (benefits || []).map((b) => ({
    id: b.id, commerce: b.commerce, title: b.title, description: b.description,
    redeem: b.redeem, category: b.category, until: b.valid_until_label,
    logo: b.logo_url, phone: b.phone, social: b.social, active: b.active,
    featured: b.featured
  })) })
})
