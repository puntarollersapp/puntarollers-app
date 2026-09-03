import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ReferralCodeField({ value, onChange, onValidated, compact = false }) {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState(null)

  const validate = async () => {
    const code = String(value || '').trim().toUpperCase()
    onChange(code)
    if (!code) {
      setStatus(null)
      onValidated?.(null)
      return
    }
    setChecking(true)
    const { data, error } = await supabase.rpc('validate_pr_referral_code', { p_code: code })
    setChecking(false)
    const row = !error && Array.isArray(data) ? data[0] : null
    if (row) {
      setStatus({ ok: true, name: row.display_name })
      onValidated?.(row)
    } else {
      setStatus({ ok: false })
      onValidated?.(null)
    }
  }

  return (
    <div style={{ marginTop: compact ? 14 : 18, border: '1px solid rgba(52,211,153,.18)', background: 'rgba(16,185,129,.055)', borderRadius: 20, padding: compact ? 14 : 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(167,243,208,.9)' }}>🤝 ¿Tenés un código Amigos PR?</div>
      <p style={{ margin: '7px 0 12px', fontSize: 11, lineHeight: 1.55, color: 'rgba(255,255,255,.48)' }}>Si un alumno de Punta Rollers te invitó, ingresá su código. Si no tenés uno, podés continuar normalmente.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value.toUpperCase()); setStatus(null); onValidated?.(null) }}
          onBlur={() => value && validate()}
          placeholder="Ej.: AMIGOEJEMPLOPR"
          autoCapitalize="characters"
          style={{ minWidth: 0, flex: 1, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.25)', color: 'white', padding: '12px 13px', fontSize: 13, fontWeight: 800, outline: 'none' }}
        />
        <button type="button" onClick={validate} disabled={checking || !String(value || '').trim()} style={{ borderRadius: 14, border: '1px solid rgba(52,211,153,.2)', background: 'rgba(52,211,153,.12)', color: 'rgb(167,243,208)', padding: '0 14px', fontSize: 10, fontWeight: 900, opacity: checking || !String(value || '').trim() ? .5 : 1 }}>
          {checking ? 'Viendo…' : 'Aplicar'}
        </button>
      </div>
      {status?.ok && <div style={{ marginTop: 10, borderRadius: 12, background: 'rgba(52,211,153,.1)', padding: '9px 11px', fontSize: 10, fontWeight: 800, color: 'rgb(167,243,208)' }}>✓ Código válido · invitación de {status.name}. Se aplicará tu 10% OFF.</div>}
      {status && !status.ok && <div style={{ marginTop: 10, borderRadius: 12, background: 'rgba(248,113,113,.08)', padding: '9px 11px', fontSize: 10, fontWeight: 800, color: 'rgb(254,202,202)' }}>Ese código no es válido o ya no está activo. Revisalo o dejalo vacío para continuar sin descuento.</div>}
    </div>
  )
}
