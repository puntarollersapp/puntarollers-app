import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Beta account creation remains disabled until isolated provisioning is verified.
// Never enroll an existing student profile into testing from this panel.
export default function BetaUsersPanel() {
  const [access, setAccess] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

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
      Área de pruebas independiente. El alta y la gestión de accesos permanecerán
      deshabilitadas hasta verificar que las cuentas de prueba no aparezcan en
      alumnos, Tesorería ni otros procesos de producción.
    </p>
    <p className="text-amber-200 text-sm" role="status">
      Creación de cuentas Beta pendiente de habilitación segura.
    </p>
    {message && <p role="alert" className="text-red-200 text-sm">{message}</p>}
    <h3 className="text-white font-semibold">Registros Beta (solo lectura)</h3>
    {loading ? <p className="text-white/60 text-sm">Cargando…</p>
      : access.length === 0 ? <p className="text-white/60 text-sm">Sin registros visibles.</p>
      : <ul className="space-y-2">{access.map(item =>
        <li key={item.profile_id} className="border-t border-white/10 py-3 text-white/70 text-sm">
          {item.profile_id} — {item.enabled ? 'Activo' : 'Pausado'}
        </li>
      )}</ul>}
  </section>
}
