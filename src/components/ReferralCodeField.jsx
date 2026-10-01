import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ReferralCodeField({ value, onChange, onValidated, compact = false }) {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState(null)

  const validate = async () => {
    const code = String(value || '').trim().toUpperCase()
    onChange(code)
    if (!code) { setStatus(null); onValidated?.(null); return }
    setChecking(true)
    const { data, error } = await supabase.rpc('validate_pr_referral_code', { p_code: code })
    setChecking(false)
    const row = !error && Array.isArray(data) ? data[0] : null
    if (row) { setStatus({ ok: true, name: row.display_name, campaign: row.code === 'ROLLERWINPR' }); onValidated?.(row) }
    else { setStatus({ ok: false }); onValidated?.(null) }
  }

  const rollerween = String(value || '').replace(/\s+/g, '').toUpperCase() === 'ROLLERWINPR'

  return (
    <div style={{ marginTop: compact ? 14 : 18 }}>
      <div style={{ border: rollerween ? '1px solid rgba(192,132,252,.28)' : '1px solid rgba(52,211,153,.18)', background: rollerween ? 'linear-gradient(135deg,rgba(126,34,206,.15),rgba(249,115,22,.08))' : 'rgba(16,185,129,.055)', borderRadius: 20, padding: compact ? 14 : 16 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: rollerween ? 'rgb(253,186,116)' : 'rgba(167,243,208,.9)' }}>{rollerween ? '🎃 Beneficio RollerWeen' : '🎟️ ¿Tenés un código de beneficio?'}</div>
        <p style={{ margin: '7px 0 12px', fontSize: 11, lineHeight: 1.55, color: 'rgba(255,255,255,.48)' }}>Ingresá acá tu código promocional o código Amigos PR. Lo validamos antes de continuar y el descuento se calcula automáticamente antes del pago.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={value} onChange={(e) => { onChange(e.target.value.toUpperCase()); setStatus(null); onValidated?.(null) }} onBlur={() => value && validate()} placeholder="Ej.: ROLLERWIN PR" autoCapitalize="characters" style={{ minWidth: 0, flex: 1, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.25)', color: 'white', padding: '12px 13px', fontSize: 13, fontWeight: 800, outline: 'none' }} />
          <button type="button" onClick={validate} disabled={checking || !String(value || '').trim()} style={{ borderRadius: 14, border: '1px solid rgba(52,211,153,.2)', background: 'rgba(52,211,153,.12)', color: 'rgb(167,243,208)', padding: '0 14px', fontSize: 10, fontWeight: 900, opacity: checking || !String(value || '').trim() ? .5 : 1 }}>{checking ? 'Viendo…' : 'Aplicar'}</button>
        </div>
        {status?.ok && status.campaign && <div style={{ marginTop: 10, borderRadius: 12, background: 'rgba(192,132,252,.11)', padding: '10px 11px', fontSize: 10, lineHeight: 1.5, fontWeight: 800, color: 'rgb(233,213,255)' }}>✓ ROLLERWIN PR aplicado · 10% OFF activado. Vas a ver el importe con descuento antes de pagar.</div>}
        {status?.ok && !status.campaign && <div style={{ marginTop: 10, borderRadius: 12, background: 'rgba(52,211,153,.1)', padding: '9px 11px', fontSize: 10, fontWeight: 800, color: 'rgb(167,243,208)' }}>✓ Código válido · invitación de {status.name}. Se aplicará tu 10% OFF.</div>}
        {status && !status.ok && <div style={{ marginTop: 10, borderRadius: 12, background: 'rgba(248,113,113,.08)', padding: '9px 11px', fontSize: 10, fontWeight: 800, color: 'rgb(254,202,202)' }}>Ese código no es válido o ya no está activo. Revisalo o dejalo vacío para continuar sin descuento.</div>}
      </div>
      <div style={{ marginTop: 10, borderRadius: 16, border: '1px solid rgba(249,115,22,.18)', background: 'rgba(249,115,22,.06)', padding: '12px 14px' }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgb(253,186,116)' }}>¿Cómo funciona?</div>
        <p style={{ margin: '5px 0 0', fontSize: 10, lineHeight: 1.55, color: 'rgba(255,255,255,.5)' }}>Si llegaste desde RollerWeen, escribí <b style={{ color: 'white' }}>ROLLERWIN PR</b> y tocá <b style={{ color: 'white' }}>Aplicar</b>. El sistema valida el código y descuenta el 10% automáticamente antes de que elijas cómo pagar.</p>
      </div>
    </div>
  )
}
