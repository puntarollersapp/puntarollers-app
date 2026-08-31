import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const statusStyles = {
  pendiente: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  perfil_creado: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  activo: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  rechazado: 'border-white/10 bg-white/5 text-white/45',
}

const statusLabels = {
  pendiente: 'Pendiente',
  perfil_creado: 'Perfil creado',
  activo: 'Acceso activo',
  rechazado: 'Rechazado',
}

export default function AdminAccessRequests() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('todos')

  const invoke = useCallback(async (body) => {
    const { data, error: invokeError } = await supabase.functions.invoke('pr-access-admin', { body })
    if (invokeError || data?.error) throw new Error(data?.error || invokeError?.message || 'No se pudo completar la acción.')
    return data
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await invoke({ action: 'list' })
      setRows(result?.requests || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [invoke])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => filter === 'todos' ? rows : rows.filter((row) => row.estado === filter), [rows, filter])
  const pendingCount = rows.filter((row) => row.estado === 'pendiente').length

  async function runAction(id, action) {
    setWorking(`${action}:${id}`)
    setError('')
    try {
      await invoke({ action, id })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setWorking('')
    }
  }

  return (
    <main className="min-h-screen bg-[#09090a] text-white">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => navigate('/admin')} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-black text-white/70">← Admin</button>
          <button onClick={load} disabled={loading} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-black text-white/70 disabled:opacity-40">↻ Actualizar</button>
        </div>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.24em] text-red-400">Punta Rollers · Admin</div>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-5xl">Nuevos accesos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Alumnos que ya completaron su bienvenida. Importá sus datos para crear el perfil y, después de su primera clase, habilitá el acceso.</p>
          </div>
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 px-5 py-4"><div className="text-xs font-black uppercase tracking-[.16em] text-amber-200/70">Por crear</div><div className="mt-1 text-3xl font-black text-amber-100">{pendingCount}</div></div>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
          {[
            ['todos','Todos'],['pendiente','Pendientes'],['perfil_creado','Perfil creado'],['activo','Activos']
          ].map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black ${filter === value ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[.03] text-white/50'}`}>{label}</button>)}
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}

        <div className="mt-6 space-y-4">
          {loading ? <div className="py-20 text-center text-sm font-bold text-white/35">Cargando solicitudes…</div> : filtered.length === 0 ? <div className="rounded-3xl border border-white/10 bg-white/[.025] py-16 text-center text-sm font-bold text-white/35">No hay solicitudes en esta sección.</div> : filtered.map((row) => {
            const importing = working === `import:${row.id}`
            const activating = working === `activate:${row.id}`
            return (
              <article key={row.id} className="rounded-[28px] border border-white/10 bg-white/[.035] p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">{row.nombre_completo}</h2><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${statusStyles[row.estado] || statusStyles.rechazado}`}>{statusLabels[row.estado] || row.estado}</span></div>
                    <div className="mt-4 grid gap-2 text-sm text-white/60 sm:grid-cols-2">
                      <div><span className="text-white/30">Documento:</span> <strong className="text-white/75">{row.documento}</strong></div>
                      <div><span className="text-white/30">WhatsApp:</span> <strong className="text-white/75">{row.telefono}</strong></div>
                      <div className="sm:col-span-2 break-all"><span className="text-white/30">Email:</span> <strong className="text-white/75">{row.email}</strong></div>
                    </div>
                    <div className="mt-3 text-xs text-white/25">Registrado {new Date(row.created_at).toLocaleString('es-UY')}</div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:w-52">
                    {row.estado === 'pendiente' && <button onClick={() => runAction(row.id, 'import')} disabled={Boolean(working)} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-40">{importing ? 'Creando…' : 'Importar y crear perfil'}</button>}
                    {row.estado === 'perfil_creado' && <button onClick={() => runAction(row.id, 'activate')} disabled={Boolean(working)} className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black disabled:opacity-40">{activating ? 'Habilitando…' : '✓ Habilitar acceso'}</button>}
                    {row.profile_id && <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-center text-xs font-bold text-white/40">Perfil: {row.profile_id.slice(0, 18)}…</div>}
                  </div>
                </div>
                {row.estado === 'pendiente' && <div className="mt-5 rounded-2xl border border-white/8 bg-black/25 p-4 text-xs leading-5 text-white/40">“Importar y crear perfil” genera automáticamente su cuenta segura usando el documento y el PIN que eligió. El acceso queda bloqueado hasta que vos lo habilites después de la primera clase.</div>}
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
