import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useLocations({ type = null } = {}) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    let cancelled = false

    async function fetchLocations() {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('pr_rollermap_locations')
        .select('id,name,type,description,city,department,address,lat,lng,instagram,whatsapp,schedule,verified,featured,image_url')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('name',     { ascending: true })

      if (type) query = query.eq('type', type)

      const { data, error: sbError } = await query

      if (cancelled) return
      if (sbError) { setError(sbError.message); setLoading(false); return }

      setLocations(data ?? [])
      setLoading(false)
    }

    fetchLocations()
    return () => { cancelled = true }
  }, [type, revision])

  return { locations, loading, error, retry }
}
