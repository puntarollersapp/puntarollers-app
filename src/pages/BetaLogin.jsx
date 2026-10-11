import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function BetaLogin() {
  const { user, loading: authLoading, betaLogin } = useAuth()
  const navigate = useNavigate()
  const [documento, setDocumento] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [setupBusy,setSetupBusy]=useState(false)
  const stagingSetup=import.meta.env.DEV||window.location.hostname==='beta.puntarollers.com'
  if (user) return <Navigate to="/app/perfil" replace />
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true);setError('')
    try {
      const result = await betaLogin(documento,password)
      if (result?.error) setError(result.error)
      else navigate('/app/perfil',{replace:true})
    } catch { setError('No pudimos iniciar la sesión Beta.') }
    finally { setBusy(false) }
  }
  async function createStagingBeta(){
    if(setupBusy)return
    const cleanDoc=String(documento||'').replace(/\D/g,'')
    if(!/^\d{6,12}$/.test(cleanDoc)||!/^[0-9]{4}$/.test(password)){setError('Para preparar la Beta usá un documento de prueba y un PIN Beta de 4 dígitos.');return}
    setSetupBusy(true);setError('')
    try{
      const email=`beta-${cleanDoc}@beta.puntarollers.com`; const authPassword=`PRB-${cleanDoc}-${password}`
      const {data:auth,error:authError}=await supabase.auth.signUp({email,password:authPassword,options:{data:{purpose:'puntarollers-staging-beta'}}})
      if(authError||!auth?.user)throw authError||new Error('auth')
      const profileId=`beta-${auth.user.id}`
      const {error:profileError}=await supabase.from('profiles').insert({id:profileId,auth_user_id:auth.user.id,documento:cleanDoc,nombre:'Beta',apellido:'Training 2.0',email,role:'beta',estado:'activo',participa_como_alumno:false,es_profesor:false,es_tesoreria:false,exento_mensualidad:true,acceso_habilitado:false})
      if(profileError)throw profileError
      const {error:accessError}=await supabase.from('pr_beta_access').insert({profile_id:profileId,enabled:true,features:{training2:true}})
      if(accessError)throw accessError
      setError('Cuenta de Staging preparada. Ya podés ingresar.')
      await supabase.auth.signOut()
    }catch(e){setError('No pudimos preparar la cuenta de Staging.')}
    finally{setSetupBusy(false)}
  }
  return <main className="min-h-screen bg-[#080a13] px-5 py-14 text-white">
    <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">Punta Rollers / Beta</p>
      <h1 className="mt-4 text-3xl font-bold">Ingresar a Beta</h1>
      <p className="mt-2 text-sm text-white/60">Acceso exclusivo para cuentas de prueba autorizadas.</p>
      {authLoading&&<p className="mt-3 text-xs text-violet-200/60">Verificando sesión segura…</p>}
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm">Documento
          <input required inputMode="numeric" autoComplete="username" value={documento} onChange={e=>setDocumento(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white" />
        </label>
        <label className="block text-sm">Contraseña Beta
          <input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white" />
        </label>
        {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
        {stagingSetup&&<button type="button" onClick={createStagingBeta} disabled={setupBusy||busy} className="w-full rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-200 disabled:opacity-50">{setupBusy?'Preparando…':'Preparar cuenta Beta de prueba'}</button>}
        <button type="submit" disabled={busy||authLoading} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold disabled:opacity-50">{busy?'Ingresando…':authLoading?'Verificando…':'Ingresar'}</button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-sm text-white/50 underline">Acceso habitual Punta Rollers</Link>
    </section>
  </main>
}
