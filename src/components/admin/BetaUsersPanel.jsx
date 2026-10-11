import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function BetaUsersPanel() {
  const [profiles, setProfiles] = useState([])
  const [access, setAccess] = useState([])
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function reload() {
    const [p, a] = await Promise.all([
      supabase.from('profiles').select('id,nombre,apellido,documento,role').order('nombre'),
      supabase.from('pr_beta_access').select('profile_id,enabled,features')
    ])
    if (p.error || a.error) {
      setMessage(p.error?.message || a.error?.message)
      return
    }
    setAccess(a.data || [])
    setProfiles((p.data || []).filter(item => !a.data?.some(b => b.profile_id === item.id)))
  }

  useEffect(() => { reload() }, [])

  async function authorize() {
    if (!selected || busy) return
    setBusy(true)
    const { error } = await supabase.from('pr_beta_access').insert({
      profile_id: selected, enabled: true, features: { home: true }
    })
    setMessage(error ? error.message : 'Acceso beta habilitado.')
    await reload()
    setBusy(false)
  }

  async function toggle(item) {
    setBusy(true)
    const { error } = await supabase.from('pr_beta_access')
      .update({ enabled: !item.enabled }).eq('profile_id', item.profile_id)
    setMessage(error ? error.message : 'Acceso actualizado.')
    await reload()
    setBusy(false)
  }

  return <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 space-y-4">
    <h2 className="text-2xl font-bold text-white">Usuarios Beta</h2>
    <p className="text-white/60 text-sm">Accesos exclusivos para pruebas. No modifica el alta habitual de alumnos. La creación de cuentas nuevas seguirá usando el alta segura existente.</p>
    <label className="block text-white/70 text-sm">Autorizar cuenta existente para testing</label>
    <select value={selected} onChange={e => setSelected(e.target.value)}
      className="w-full bg-black text-white rounded-xl p-3 border border-white/20">
      <option value="">Seleccionar usuario</option>
      {profiles.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.documento}</option>)}
    </select>
    <button type="button" disabled={!selected || busy} onClick={authorize}
      className="rounded-xl bg-white text-black px-4 py-3 disabled:opacity-40">Habilitar Beta</button>
    {message && <p role="status" className="text-sm text-white/70">{message}</p>}
    <h3 className="text-white font-semibold">Accesos registrados</h3>
    {access.map(item => <div key={item.profile_id} className="flex items-center justify-between gap-3 border-t border-white/10 py-3">
      <span className="text-white/70 text-sm">{item.profile_id} — {item.enabled ? 'Activo' : 'Pausado'}</span>
      <button type="button" disabled={busy} onClick={() => toggle(item)}
        className="border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
        {item.enabled ? 'Pausar' : 'Activar'}
      </button>
    </div>)}
  </section>
}
