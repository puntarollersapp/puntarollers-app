import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function usePRCardBenefits(enabled) {
  const [result, setResult] = useState({ benefits: [], loading: false, eligible: false })
  useEffect(() => {
    let cancelled = false
    if (!enabled) {
      setResult({ benefits: [], loading: false, eligible: false })
      return
    }
    setResult({ benefits: [], loading: true, eligible: false })
    supabase.functions.invoke('prcard-benefits', { method: 'GET' })
      .then(({ data, error }) => {
        if (cancelled) return
        const eligible = !error && data?.eligible === true
        setResult({
          eligible,
          benefits: eligible && Array.isArray(data?.benefits) ? data.benefits : [],
          loading: false,
        })
      })
      .catch(() => {
        if (!cancelled) setResult({ benefits: [], loading: false, eligible: false })
      })
    return () => { cancelled = true }
  }, [enabled])
  return result
}
