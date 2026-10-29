import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export function usePRCardRequests(enabled = true) {
  const [state, setState] = useState({ requests: [], loading: Boolean(enabled), error: '' })
  const refresh = useCallback(async () => {
    if (!enabled) return
    setState(prev => ({ ...prev, loading: true, error: '' }))
    try {
      const { data, error } = await supabase.functions.invoke('prcard-requests', { method: 'GET' })
      if (error || !Array.isArray(data?.requests)) throw new Error('No se pudo consultar el estado de la solicitud.')
      setState({ requests: data.requests, loading: false, error: '' })
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'No pudimos consultar tus solicitudes.' }))
    }
  }, [enabled])
  useEffect(() => { if (enabled) refresh() }, [enabled, refresh])
  const submit = async () => {
    const { data, error } = await supabase.functions.invoke('prcard-requests', { body: { action: 'request' } })
    if (error || !data?.request?.id) throw new Error('No pudimos guardar la solicitud. Intentá nuevamente.')
    await refresh()
    return data.request
  }
  return { ...state, refresh, submit }
}
