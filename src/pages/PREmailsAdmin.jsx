import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PREmailsAdmin() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  async function call(action, extra = {}) {
    setBusy(action)
    setMessage('')
    const { data, error } = await supabase.functions.invoke('pr-emails-admin', { body: { action, ...extra } })
    setBusy('')
    if (error || data?.error) {
      setMessage('No se pudo completar: ' + (data?.detail?.message || data?.error || error?.message || 'error desconocido'))
      return null
    }
    return data
  }

  async function load() {
    const data = await call('summary')
    if (data) {
      setSummary(data)
      setTestEmail(data.test_email || '')
    }
  }

  useEffect(() => { load() }, [])

  async function sendTest() {
    const data = await call('test', { test_email: testEmail })
    if (data) setMessage('✓ Prueba oficial enviada únicamente a ' + data.recipient)
  }

  async function sendCampaign() {
    if (!summary || !window.confirm(`Vas a enviar el correo a ${summary.pending} destinatarios. ¿Continuar?`)) return
    const data = await call('send', { confirmation })
    if (data) {
      setMessage(`✓ Envío aceptado por Resend: ${data.sent} correos`)
      setConfirmation('')
      await load()
    }
  }

  return <main className="min-h-screen bg-[#080909] text-white pb-16">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090a09]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button onClick={() => navigate('/admin')} className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-black">← PR Control</button>
        <div className="text-right"><p className="text-[10px] font-black tracking-[.2em] text-lime-300">PUNTA ROLLERS</p><h1 className="font-black">PR Emails</h1></div>
      </div>
    </header>

    <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5">
      {message && <div className="rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm">{message}</div>}

      <section className="overflow-hidden rounded-[30px] border border-red-400/25 bg-gradient-to-br from-[#351011] via-[#151515] to-[#0b0b0b] p-6 sm:p-8">
        <p className="text-[10px] font-black tracking-[.24em] text-lime-300">CAMPAÑA DE REGRESO</p>
        <h2 className="mt-2 text-4xl font-black sm:text-5xl">Tenés una deuda importante.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Vista previa, prueba y envío general usan el mismo correo. Remitente oficial: <b className="text-white">hola@puntarollers.com</b>.</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Correos únicos" value={summary?.total ?? '—'} />
        <Stat label="Pendientes" value={summary?.pending ?? '—'} accent />
        <Stat label="Ya enviados" value={summary?.already_sent ?? '—'} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white">
          <div className="border-b border-black/10 bg-[#f4f5ef] px-5 py-3 text-xs font-black text-black/45">VISTA PREVIA EXACTA DEL MAIL</div>
          {summary?.html ? <iframe title="Vista previa del correo" srcDoc={summary.html} className="h-[720px] w-full border-0 bg-white" /> : <div className="grid h-72 place-items-center text-black/40">Cargando correo…</div>}
        </div>

        <div className="space-y-4">
          <section className="rounded-[26px] border border-white/10 bg-white/[.04] p-5">
            <p className="text-[10px] font-black tracking-[.18em] text-lime-300">1 · PRUEBA REAL</p>
            <h3 className="mt-2 text-xl font-black">Mandarlo solamente a vos</h3>
            <p className="mt-2 text-xs leading-5 text-white/40">El asunto, banner, texto y botón serán exactamente los mismos del envío final.</p>
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
            <button disabled={busy || !testEmail.includes('@')} onClick={sendTest} className="mt-3 w-full rounded-2xl bg-white py-4 font-black text-black disabled:opacity-30">{busy === 'test' ? 'ENVIANDO…' : 'ENVIAR PRUEBA OFICIAL'}</button>
          </section>

          <section className="rounded-[26px] border border-red-400/20 bg-red-500/[.06] p-5">
            <p className="text-[10px] font-black tracking-[.18em] text-red-300">2 · ENVÍO GENERAL</p>
            <h3 className="mt-2 text-xl font-black">Alumnos con correo</h3>
            <p className="mt-2 text-xs leading-5 text-white/45">Los correos se deduplican y cada destinatario queda registrado para impedir envíos repetidos.</p>
            <label className="mt-4 block text-[10px] font-black text-white/35">ESCRIBÍ: ENVIAR {summary?.pending ?? 0}</label>
            <input value={confirmation} onChange={e => setConfirmation(e.target.value.toUpperCase())} placeholder={`ENVIAR ${summary?.pending ?? 0}`} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-black outline-none" />
            <button disabled={busy || !summary?.pending || confirmation !== `ENVIAR ${summary.pending}`} onClick={sendCampaign} className="mt-3 w-full rounded-2xl bg-red-500 py-4 font-black text-white disabled:bg-white/10 disabled:text-white/25">{busy === 'send' ? 'ENVIANDO…' : `ENVIAR A ${summary?.pending ?? 0} CORREOS`}</button>
          </section>
        </div>
      </section>
    </div>
  </main>
}

function Stat({ label, value, accent = false }) {
  return <div className={`rounded-[22px] border p-4 ${accent ? 'border-lime-300/25 bg-lime-300/10' : 'border-white/10 bg-white/[.04]'}`}><p className="text-3xl font-black">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-white/35">{label}</p></div>
}
