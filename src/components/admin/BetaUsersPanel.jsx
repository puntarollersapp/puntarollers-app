import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const FUNCTION_NAME = 'pr-staging-beta-admin-v2'

// supabase.functions.invoke devuelve data=null cuando la función responde 4xx/5xx;
// el mensaje real del servidor viaja en error.context (un Response).
async function describeError(error, data) {
  const fmt = body => (body?.error ? (body.detail ? `${body.error} (${body.detail})` : body.error) : '')
  const fromData = fmt(data)
  if (fromData) return fromData
  try {
    const body = await error?.context?.json?.()
    const fromBody = fmt(body)
    if (fromBody) return fromBody
  } catch { /* sin cuerpo legible */ }
  return error?.message || 'Error desconocido.'
}

async function callAdmin(body) {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body })
  if (error || !data?.success) throw new Error(await describeError(error, data))
  return data
}

// Nunca se inscribe un perfil de alumno existente desde este panel.
export default function BetaUsersPanel() {
  const [testers, setTesters] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [documento, setDocumento] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetTarget, setResetTarget] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [togglingId, setTogglingId] = useState('')

  const loadTesters = useCallback(async () => {
    try {
      const data = await callAdmin({ action: 'list' })
      setTesters(data.testers || [])
      return true
    } catch (err) {
      setMessage('No se pudo consultar los accesos beta: ' + (err.message || 'error'))
      return false
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      await loadTesters()
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [loadTesters])

  async function handleCreate(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true); setMessage('')
    try {
      await callAdmin({
        action: 'create',
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        documento: documento.trim(),
        password,
      })
      setMessage(`Tester Beta creado. Ya puede entrar en /beta/login con documento ${documento.trim()} y su PIN.`)
      setNombre(''); setApellido(''); setDocumento(''); setPassword('')
      await loadTesters()
    } catch (err) {
      setMessage(err.message || 'No se pudo crear la cuenta Beta.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(item) {
    if (togglingId) return
    setTogglingId(item.profile_id); setMessage('')
    try {
      await callAdmin({ action: 'set_enabled', profile_id: item.profile_id, enabled: !item.enabled })
      setMessage(item.enabled ? 'Acceso pausado: el tester ya no puede iniciar sesión.' : 'Acceso habilitado nuevamente.')
      await loadTesters()
    } catch (err) {
      setMessage(err.message || 'No se pudo cambiar el acceso.')
    } finally {
      setTogglingId('')
    }
  }

  async function handleReset(event, profileId) {
    event.preventDefault()
    if (resetting || !/^[0-9]{4}$/.test(resetPassword)) return
    setResetting(true); setMessage('')
    try {
      await callAdmin({ action: 'reset_password', profile_id: profileId, password: resetPassword })
      setMessage('PIN Beta actualizado correctamente.')
      setResetTarget(''); setResetPassword('')
    } catch (err) {
      setMessage(err.message || 'No se pudo actualizar el PIN.')
    } finally {
      setResetting(false)
    }
  }

  return <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 space-y-4">
    <h2 className="text-2xl font-bold text-white">Usuarios Beta</h2>
    <p className="text-white/60 text-sm">
      Área de pruebas independiente. Creá solamente usuarios nuevos de prueba, sin reutilizar documentos ni perfiles de alumnos o personal.
    </p>
    <p className="text-amber-200 text-sm" role="status">
      Alta sujeta a autorización y verificación del servidor; no se modifica ninguna cuenta existente.
    </p>
    {message && <p role="alert" className="text-violet-100 text-sm break-words">{message}</p>}

    <form onSubmit={handleCreate} className="rounded-2xl border border-violet-300/20 bg-violet-500/5 p-4 space-y-3">
      <h3 className="font-semibold text-white">Alta de cuentas de prueba</h3>
      <p className="text-sm text-amber-200">El servidor verifica que seas administrador y deja al tester con su asignación de Training lista.</p>
      <label className="block text-sm text-white/70">Nombre<input required maxLength={100} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <label className="block text-sm text-white/70">Apellido<input maxLength={100} value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Apellido" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <label className="block text-sm text-white/70">Documento nuevo<input required inputMode="numeric" pattern="[0-9]{6,12}" value={documento} onChange={e => setDocumento(e.target.value)} placeholder="Solo números" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <label className="block text-sm text-white/70">PIN Beta<input required type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label>
      <button disabled={submitting} type="submit" className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white disabled:opacity-40">{submitting ? 'Creando…' : 'Crear usuario Beta'}</button>
    </form>

    <h3 className="text-white font-semibold">Testers Beta</h3>
    {loading ? <p className="text-white/60 text-sm">Cargando…</p>
      : testers.length === 0 ? <p className="text-white/60 text-sm">Todavía no hay testers.</p>
      : <ul className="space-y-2">{testers.map(item =>
        <li key={item.profile_id} className="border-t border-white/10 py-3 text-white/70 text-sm">
          <div className="font-semibold text-white">{[item.nombre, item.apellido].filter(Boolean).join(' ') || 'Sin nombre'}</div>
          <div>Documento {item.documento} — {item.enabled ? 'Activo' : 'Pausado'}</div>
          <div className="text-white/50">
            {item.training?.assigned
              ? `Training noviembre: ${item.training.progress}/${item.training.target} revelados${item.training.discovered ? ' · ruleta completada' : ''}`
              : 'Training noviembre: sin asignación'}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setResetTarget(item.profile_id); setResetPassword(''); setMessage('') }}
              className="rounded-lg border border-violet-300/30 px-3 py-2 text-violet-200">Restablecer PIN</button>
            <button type="button" disabled={togglingId === item.profile_id} onClick={() => handleToggle(item)}
              className="rounded-lg border border-white/20 px-3 py-2 text-white/70 disabled:opacity-40">
              {togglingId === item.profile_id ? 'Guardando…' : item.enabled ? 'Pausar acceso' : 'Habilitar acceso'}
            </button>
          </div>
          {resetTarget === item.profile_id && <form className="mt-3 space-y-2" onSubmit={e => handleReset(e, item.profile_id)}>
            <label className="block text-sm text-white/70">Nuevo PIN Beta
              <input required type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="new-password"
                value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button disabled={resetting || !/^[0-9]{4}$/.test(resetPassword)} type="submit"
                className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white disabled:opacity-40">{resetting ? 'Guardando…' : 'Guardar nuevo PIN'}</button>
              <button type="button" onClick={() => { setResetTarget(''); setResetPassword('') }}
                className="rounded-xl border border-white/20 px-4 py-2 text-white/70">Cancelar</button>
            </div>
          </form>}
        </li>
      )}</ul>}
  </section>
}