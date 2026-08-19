import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const paymentLabel = {
  pagar_ahora: 'Pagar ahora',
  bonificacion_rifa: 'Bonificación rifa',
  ya_pague: 'Ya pagó',
}

const statusLabel = {
  confirmado: 'Confirmado',
  pendiente_aprobacion: 'Pendiente pago',
  pendiente_bonificacion: 'Validar bonificación',
  lista_espera: 'Lista de espera',
  cancelado: 'Cancelado',
}

export default function ClinicaAdminMini() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    return { total: rows.length, principal, espera }
  }, [rows])

  return (
    <section style={{margin:'18px 0 22px',padding:'18px',border:'1px solid rgba(34,201,235,.18)',borderRadius:'22px',background:'linear-gradient(135deg,rgba(34,201,235,.06),rgba(255,255,255,.025))'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:'14px',alignItems:'center',marginBottom:'14px'}}>
        <div>
          <p style={{margin:0,color:'#55d9ef',fontSize:'10px',fontWeight:900,letterSpacing:'.14em'}}>CLÍNICA MIGUEL FLORES</p>
          <h2 style={{margin:'5px 0 0',fontSize:'20px'}}>Inscripciones</h2>
        </div>
        <button type="button" onClick={load} style={{border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.05)',color:'#fff',borderRadius:'12px',padding:'9px 11px',fontWeight:800}}>Actualizar</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
        <Stat label="Total" value={stats.total} />
        <Stat label="Cupos" value={`${stats.principal}/30`} />
        <Stat label="Espera" value={stats.espera} />
      </div>

      {error && <p style={{color:'#ff9aaf',fontSize:'12px'}}>{error}</p>}
      {loading ? <p style={{color:'rgba(255,255,255,.45)',fontSize:'12px'}}>Cargando…</p> : rows.length === 0 ? (
        <p style={{margin:0,color:'rgba(255,255,255,.42)',fontSize:'12px'}}>Todavía no hay inscripciones para la clínica.</p>
      ) : (
        <div style={{display:'grid',gap:'8px'}}>
          {rows.map((row, index) => {
            const wait = index >= 30 || row.estado === 'lista_espera'
            return (
              <div key={row.id} style={{display:'grid',gridTemplateColumns:'34px minmax(0,1fr) auto',gap:'10px',alignItems:'center',padding:'11px 12px',borderRadius:'14px',background:'rgba(255,255,255,.035)',border:'1px solid rgba(255,255,255,.06)'}}>
                <strong style={{fontSize:'12px',color:wait ? '#ffd16a' : '#62def3'}}>#{index + 1}</strong>
                <div style={{minWidth:0}}>
                  <b style={{display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontSize:'13px'}}>{row.nombre_completo}</b>
                  <small style={{display:'block',marginTop:'3px',color:'rgba(255,255,255,.42)',fontSize:'10px'}}>{paymentLabel[row.opcion_pago] || row.opcion_pago}</small>
                </div>
                <span style={{fontSize:'9px',fontWeight:900,color:wait ? '#ffd16a' : 'rgba(255,255,255,.62)',textAlign:'right'}}>{wait ? 'EN ESPERA' : (statusLabel[row.estado] || row.estado)}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value }) {
  return <div style={{padding:'10px',borderRadius:'14px',background:'rgba(255,255,255,.04)',textAlign:'center'}}><span style={{display:'block',fontSize:'9px',color:'rgba(255,255,255,.4)'}}>{label}</span><strong style={{display:'block',marginTop:'3px',fontSize:'18px'}}>{value}</strong></div>
}
