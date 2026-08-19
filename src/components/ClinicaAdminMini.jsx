import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const paymentLabel = {
  pagar_ahora: 'Pagar ahora',
  bonificacion_rifa: 'Bonificación rifa',
  ya_pague: 'Ya pagó',
}

const statusLabel = {
  confirmado: 'Cupo confirmado',
  pendiente_aprobacion: 'Pendiente pago',
  pendiente_bonificacion: 'Validar bonificación',
  lista_espera: 'Lista de espera',
  cancelado: 'Cancelado',
}

export default function ClinicaAdminMini() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('pr_clinica_sept_2026_inscripciones')
      .select('id,nombre_completo,opcion_pago,estado,created_at')
      .neq('estado', 'cancelado')
      .order('created_at', { ascending: true })

    if (loadError) setError(loadError.message)
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const principal = Math.min(rows.length, 30)
    const espera = Math.max(rows.length - 30, 0)
    const confirmados = rows.filter(r => r.estado === 'confirmado').length
    return { total: rows.length, principal, espera, confirmados }
  }, [rows])

  const updateStatus = async (row, estado) => {
    setSavingId(row.id)
    setError('')

    const { error: updateError } = await supabase
      .from('pr_clinica_sept_2026_inscripciones')
      .update({ estado })
      .eq('id', row.id)

    if (updateError) {
      setError(updateError.message)
      setSavingId('')
      return
    }

    setRows(prev => prev.map(item => item.id === row.id ? { ...item, estado } : item))
    setSavingId('')
  }

  const returnToPending = (row) => {
    const next = row.opcion_pago === 'bonificacion_rifa' ? 'pendiente_bonificacion' : row.opcion_pago === 'ya_pague' ? 'confirmado' : 'pendiente_aprobacion'
    if (next === 'confirmado') return
    updateStatus(row, next)
  }

  return (
    <section style={{margin:'18px 0 22px',padding:'18px',border:'1px solid rgba(34,201,235,.18)',borderRadius:'22px',background:'linear-gradient(135deg,rgba(34,201,235,.06),rgba(255,255,255,.025))'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:'14px',alignItems:'center',marginBottom:'14px'}}>
        <div>
          <p style={{margin:0,color:'#55d9ef',fontSize:'10px',fontWeight:900,letterSpacing:'.14em'}}>CLÍNICA MIGUEL FLORES</p>
          <h2 style={{margin:'5px 0 0',fontSize:'20px'}}>Inscripciones</h2>
        </div>
        <button type="button" onClick={load} style={{border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.05)',color:'#fff',borderRadius:'12px',padding:'9px 11px',fontWeight:800}}>Actualizar</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'14px'}}>
        <Stat label="Total" value={stats.total} />
        <Stat label="Cupos" value={`${stats.principal}/30`} />
        <Stat label="Confirmados" value={stats.confirmados} tone="green" />
        <Stat label="Espera" value={stats.espera} />
      </div>

      {error && <p style={{color:'#ff9aaf',fontSize:'12px'}}>{error}</p>}
      {loading ? <p style={{color:'rgba(255,255,255,.45)',fontSize:'12px'}}>Cargando…</p> : rows.length === 0 ? (
        <p style={{margin:0,color:'rgba(255,255,255,.42)',fontSize:'12px'}}>Todavía no hay inscripciones para la clínica.</p>
      ) : (
        <div style={{display:'grid',gap:'8px'}}>
          {rows.map((row, index) => {
            const wait = index >= 30 || row.estado === 'lista_espera'
            const confirmed = row.estado === 'confirmado' && !wait
            const pendingState = row.opcion_pago === 'bonificacion_rifa' ? 'pendiente_bonificacion' : 'pendiente_aprobacion'

            return (
              <div key={row.id} style={{padding:'11px 12px',borderRadius:'14px',background:confirmed ? 'rgba(57,221,150,.09)' : wait ? 'rgba(255,209,90,.06)' : 'rgba(255,255,255,.035)',border:confirmed ? '1px solid rgba(57,221,150,.34)' : wait ? '1px solid rgba(255,209,90,.2)' : '1px solid rgba(255,255,255,.06)',boxShadow:confirmed ? 'inset 0 0 0 1px rgba(57,221,150,.05)' : 'none'}}>
                <div style={{display:'grid',gridTemplateColumns:'34px minmax(0,1fr) auto',gap:'10px',alignItems:'center'}}>
                  <strong style={{fontSize:'12px',color:confirmed ? '#5ee6a7' : wait ? '#ffd16a' : '#62def3'}}>#{index + 1}</strong>
                  <div style={{minWidth:0}}>
                    <b style={{display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontSize:'13px'}}>{row.nombre_completo}</b>
                    <small style={{display:'block',marginTop:'3px',color:'rgba(255,255,255,.42)',fontSize:'10px'}}>{paymentLabel[row.opcion_pago] || row.opcion_pago}</small>
                  </div>
                  <span style={{fontSize:'9px',fontWeight:900,color:confirmed ? '#5ee6a7' : wait ? '#ffd16a' : 'rgba(255,255,255,.62)',textAlign:'right'}}>{wait ? 'EN ESPERA' : (statusLabel[row.estado] || row.estado)}</span>
                </div>

                {!wait && (
                  <div style={{display:'flex',gap:'8px',marginTop:'10px',justifyContent:'flex-end'}}>
                    {confirmed ? (
                      <>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'8px 10px',borderRadius:'10px',background:'rgba(57,221,150,.12)',color:'#68e7af',fontSize:'10px',fontWeight:900}}>✓ CLÍNICA RESERVADA</span>
                        {row.opcion_pago !== 'ya_pague' && (
                          <button type="button" onClick={() => updateStatus(row, pendingState)} disabled={savingId === row.id} style={{border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'rgba(255,255,255,.62)',borderRadius:'10px',padding:'8px 10px',fontSize:'10px',fontWeight:800}}>{savingId === row.id ? 'Guardando…' : 'Deshacer'}</button>
                        )}
                      </>
                    ) : (
                      <button type="button" onClick={() => updateStatus(row, 'confirmado')} disabled={savingId === row.id} style={{border:'1px solid rgba(57,221,150,.28)',background:'rgba(57,221,150,.09)',color:'#68e7af',borderRadius:'10px',padding:'9px 12px',fontSize:'10px',fontWeight:900}}>{savingId === row.id ? 'Guardando…' : row.estado === 'pendiente_bonificacion' ? '✓ Validar bonificación y confirmar' : '✓ Pago aprobado · confirmar cupo'}</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, tone }) {
  return <div style={{padding:'10px',borderRadius:'14px',background:tone === 'green' ? 'rgba(57,221,150,.06)' : 'rgba(255,255,255,.04)',textAlign:'center',border:tone === 'green' ? '1px solid rgba(57,221,150,.12)' : '1px solid transparent'}}><span style={{display:'block',fontSize:'9px',color:tone === 'green' ? '#68e7af' : 'rgba(255,255,255,.4)'}}>{label}</span><strong style={{display:'block',marginTop:'3px',fontSize:'18px',color:tone === 'green' ? '#68e7af' : '#fff'}}>{value}</strong></div>
}
