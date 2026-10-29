import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function usePRCardBenefits(enabled) {
  const [result, setResult] = useState({ benefits: [], loading: false, eligible: false, error: false })
  useEffect(() => {
    let cancelled = false
    if (!enabled) {
      setResult({ benefits: [], loading: false, eligible: false, error: false })
      return
    }
    setResult({ benefits: [], loading: true, eligible: false, error: false })
    supabase.functions.invoke('prcard-benefits', { method: 'GET' })
      .then(({ data, error }) => {
        if (cancelled) return
        const eligible = !error && data?.eligible === true
        setResult({
          eligible,
          benefits: Array.isArray(data?.benefits) ? data.benefits : [],
          loading: false,
          error: Boolean(error) || !data || typeof data.eligible !== 'boolean',
        })
      })
      .catch(() => {
        if (!cancelled) setResult({ benefits: [], loading: false, eligible: false, error: true })
      })
    return () => { cancelled = true }
  }, [enabled])
  return result
}
