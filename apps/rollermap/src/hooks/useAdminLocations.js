import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminLocations() {
  const [locations, setLocations] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [notice,setNotice]=useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: sbErr } = await supabase
      .from('pr_rollermap_locations')
      .select('id,created_at,name,type,city,department,address,lat,lng,instagram,whatsapp,schedule,description,status,verified,featured,image_url')
      .order('created_at', { ascending: false })
    if (sbErr) { setError(sbErr.message); setLoading(false); return }
    const [{data:contacts,error:contactError},{data:jobs,error:jobError}]=await Promise.all([supabase.from('pr_rollermap_contacts').select('id,email'),supabase.from('pr_rollermap_welcome').select('location_id,status,sent_at,last_error')])
    if(jobError){setError(jobError.message);setLoading(false);return}
    if(contactError){setError(contactError.message);setLoading(false);return}
    const emails=new Map((contacts??[]).map(c=>[c.id,c.email]))
    const welcomes=new Map((jobs??[]).map(j=>[j.location_id,j]))
    setLocations((data??[]).map(l=>({...l,email:emails.get(l.id)??null,welcome:welcomes.get(l.id)??null})))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const applyLocal = (id, patch) =>
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l))

  const welcomeAction=useCallback(async(id,action)=>{
    setError(null);setNotice('')
    const {data,error}=await supabase.functions.invoke('pr-rollermap-admin',{body:{action,id}})
    if(error||data?.error){setError(data?.error||error?.message||'No se pudo completar la aprobación.');return false}
    if(data?.approved)applyLocal(id,{status:'approved'})
    const sent=data?.email_status==='sent'
    setNotice(sent?'Lugar aprobado. Resend aceptó el correo de bienvenida.':`Lugar aprobado. Correo: ${data?.email_error||data?.email_status||'pendiente'}`)
    await fetch();return Boolean(data?.approved)
  },[fetch])
  const updateStatus = useCallback(async (id, newStatus) => {
    if(newStatus==='approved')return welcomeAction(id,'approve')
    const { error: sbErr } = await supabase.from('pr_rollermap_locations').update({ status: newStatus }).eq('id', id).select('id').single()
    if (sbErr) { setError(sbErr.message); return false }
    applyLocal(id, { status: newStatus });return true
  }, [welcomeAction])
  const retryWelcome=useCallback(id=>welcomeAction(id,'retry'),[welcomeAction])

  const updateLocation = useCallback(async (id, patch) => {
    const {email,...locationPatch}=patch
    if(email!==undefined){
      const {error}=await supabase.from('pr_rollermap_contacts').upsert({id,email})
      if(error){setError(error.message);return false}
    }
    applyLocal(id, patch)
    const { error: sbErr } = await supabase
      .from('pr_rollermap_locations').update(locationPatch).eq('id', id)
    if (sbErr) { setError(sbErr.message); fetch(); return false }
    return true
  }, [fetch])

  const deleteLocation = useCallback(async (id) => {
    setLocations((prev) => prev.filter((l) => l.id !== id))
    const { error: sbErr } = await supabase
      .from('pr_rollermap_locations').delete().eq('id', id)
    if (sbErr) { setError(sbErr.message); fetch(); return false }
    return true
  }, [fetch])

  const toggleFlag = useCallback(async (id, flag, currentValue) => {
    return updateLocation(id, { [flag]: !currentValue })
  }, [updateLocation])

  return { locations, loading, error, notice, retryWelcome, refetch: fetch, updateStatus, updateLocation, deleteLocation, toggleFlag }
}
