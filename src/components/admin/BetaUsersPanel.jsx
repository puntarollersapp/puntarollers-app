import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Beta account creation remains disabled until isolated provisioning is verified.
// Never enroll an existing student profile into testing from this panel.
export default function BetaUsersPanel() {
  const [access, setAccess] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [documento, setDocumento] = useState('')
  const [apellido, setApellido] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetTarget, setResetTarget] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const provisioningReady = false // Pilot finished; server also rejects new Beta account creation.

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase
        .from('pr_beta_access')
        .select('profile_id,enabled,features')
      if (!active) return
      if (error) setMessage('No se pudo consultar los accesos beta: ' + error.message)
      else setAccess(data || [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  return <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 space-y-4">
    <h2 className="text-2xl font-bold text-white">Usuarios Beta</h2>
    <p className="text-white/60 text-sm">
      Área de pruebas independiente. Creá solamente usuarios nuevos de prueba, sin reutilizar documentos ni perfiles de alumnos o personal.
    </p>
    <p className="text-amber-200 text-sm" role="status">
      Alta sujeta a autorización y verificación del servidor; no se modifica ninguna cuenta existente.
    </p>
    {message && <p role="alert" className="text-red-200 text-sm">{message}</p>}
    <form onSubmit={async event => {
      event.preventDefault()
      if (submitting || !provisioningReady) return
      setSubmitting(true);setMessage('')
      try {
        const { data, error } = await supabase.functions.invoke('pr-beta-admin', {
          body: { action: 'create', nombre: nombre.trim(), apellido: apellido.trim(), documento: documento.trim(), password }
        })
        if (error || !data?.success) throw new Error(data?.error || error?.message || 'No se pudo crear la cuenta.')
        setMessage('Cuenta Beta creada correctamente.')
        setNombre('');setApellido('');setDocumento('');setPassword('')
        const { data: refreshed } = await supabase.from('pr_beta_access').select('profile_id,enabled,features')
        if (refreshed) setAccess(refreshed)
      } catch (err) { setMessage(err.message || 'No se pudo crear la cuenta Beta.') }
      finally { setSubmitting(false) }
    }} className="rounded-2xl border border-violet-300/20 bg-violet-500/5 p-4 space-y-3">
      <h3 className="font-semibold text-white">Alta de cuentas de prueba</h3>
      <p className="text-sm text-amber-200">El servidor verifica que seas administrador antes de autorizar una cuenta Beta.</p>
      <label className="block text-sm text-white/70">Nombre<input required maxLength={100} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <label className="block text-sm text-white/70">Apellido<input maxLength={100} value={apellido} onChange={e=>setApellido(e.target.value)} placeholder="Apellido" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <label className="block text-sm text-white/70">Documento nuevo<input required inputMode="numeric" pattern="[0-9]{6,12}" value={documento} onChange={e=>setDocumento(e.target.value)} placeholder="Solo números" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <label className="block text-sm text-white/70">Contraseña Beta<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <button disabled={submitting || !provisioningReady} type="submit" className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white disabled:opacity-40">{submitting?'Creando…':'Crear usuario Beta'}</button>
    </form>
    <h3 className="text-white font-semibold">Registros Beta (solo lectura)</h3>
    {loading ? <p className="text-white/60 text-sm">Cargando…</p>
      : access.length === 0 ? <p className="text-white/60 text-sm">Sin registros visibles.</p>
      : <ul className="space-y-2">{access.map(item =>
        <li key={item.profile_id} className="border-t border-white/10 py-3 text-white/70 text-sm">
          <div>{item.profile_id} — {item.enabled ? 'Activo' : 'Pausado'}</div>
          <button type="button" onClick={() => { setResetTarget(item.profile_id);setResetPassword('');setMessage('') }}
            className="mt-2 rounded-lg border border-violet-300/30 px-3 py-2 text-violet-200">Restablecer contraseña</button>
          {resetTarget === item.profile_id && <form className="mt-3 space-y-2" onSubmit={async event => {
            event.preventDefault()
            if (resetting || resetPassword.length < 12) return
            setResetting(true);setMessage('')
            try {
              const { data, error } = await supabase.functions.invoke('pr-beta-admin', {
                body: { action: 'reset_password', profile_id: item.profile_id, password: resetPassword }
              })
              if (error || !data?.success) throw new Error(data?.error || error?.message || 'No se pudo actualizar la contraseña.')
              setMessage('Contraseña Beta actualizada correctamente.')
              setResetTarget('');setResetPassword('')
            } catch (err) { setMessage(err.message || 'No se pudo actualizar la contraseña.') }
            finally { setResetting(false) }
          }}>
            <label className="block text-sm text-white/70">Nueva contraseña Beta
              <input required type="password" minLength={12} maxLength={128} autoComplete="new-password"
                value={resetPassword} onChange={event => setResetPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button disabled={resetting || resetPassword.length < 12} type="submit"
                className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white disabled:opacity-40">{resetting?'Guardando…':'Guardar nueva contraseña'}</button>
              <button type="button" onClick={() => { setResetTarget('');setResetPassword('') }}
                className="rounded-xl border border-white/20 px-4 py-2 text-white/70">Cancelar</button>
            </div>
          </form>}
        </li>
      )}</ul>}
  </section>
}
