import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PREmailsAdmin() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [query, setQuery] = useState('')
  const [selectedEmails, setSelectedEmails] = useState([])
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
      setSelectedEmails((data.recipients || []).filter(row => !row.sent && !row.review && !row.active).map(row => row.email))
    }
  }

  useEffect(() => { load() }, [])

  async function sendTest() {
    const data = await call('test', { test_email: testEmail })
    if (data) setMessage('✓ Prueba RollerWeen enviada únicamente a ' + data.recipient)
  }

  async function sendCampaign() {
    if (!summary || !window.confirm(`Vas a enviar RollerWeen a ${selectedEmails.length} destinatarios seleccionados. ¿Continuar?`)) return
    const data = await call('send', { confirmation, recipients: selectedEmails })
    if (data) {
      setMessage(`✓ Envío aceptado por Resend: ${data.sent} correos`)
      setConfirmation('')
      await load()
    }
  }

  const recipients = summary?.recipients || []
  const visibleRecipients = recipients.filter(row => `${row.name || ''} ${row.email} ${row.source || ''} ${row.active ? 'activo' : 'inactivo'}`.toLowerCase().includes(query.trim().toLowerCase()))
  const selectedSet = new Set(selectedEmails)
  const toggleRecipient = email => setSelectedEmails(current => current.includes(email) ? current.filter(item => item !== email) : [...current, email])
  const recommended = () => setSelectedEmails(recipients.filter(row => !row.sent && !row.review && !row.active).map(row => row.email))

  return <main className="min-h-screen bg-[#08060b] text-white pb-16">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09070c]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button onClick={() => navigate('/admin')} className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-black">← PR Control</button>
        <div className="text-right"><p className="text-[10px] font-black tracking-[.2em] text-orange-300">ROLLERWEEN · 2026</p><h1 className="font-black">PR Emails</h1></div>
      </div>
    </header>

    <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5">
      {message && <div className="rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm">{message}</div>}

      <section className="overflow-hidden rounded-[30px] border border-purple-400/25 bg-gradient-to-br from-[#35104f] via-[#17101e] to-[#0b090d] p-6 sm:p-8">
        <p className="text-[10px] font-black tracking-[.24em] text-orange-300">NUEVA CAMPAÑA · ROLLERWEEN</p>
        <h2 className="mt-2 text-4xl font-black sm:text-5xl">BUU! 👻 Tu señal para patinar.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Campaña de captación con 10% OFF durante los dos primeros meses · código <b className="text-lime-300">ROLLERWINPR</b>. Los alumnos activos quedan destildados por defecto.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Correos habilitados" value={summary?.total ?? '—'} />
        <Stat label="Activos PR" value={summary?.active_total ?? '—'} />
        <Stat label="Recomendados" value={summary?.recommended_total ?? '—'} accent />
        <Stat label="En plataforma" value={summary?.platform_total ?? '—'} />
        <Stat label="Solo histórica" value={summary?.historical_only ?? '—'} />
        <Stat label="Seleccionados" value={selectedEmails.length} accent />
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[.04] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-black tracking-[.18em] text-orange-300">BASE DE CORREOS</p><h3 className="mt-1 text-2xl font-black">Elegí quiénes reciben RollerWeen</h3><p className="mt-1 text-xs text-white/45">Por defecto seleccionamos históricos e inactivos. Los perfiles que hoy figuran como Activo en PR quedan visibles pero destildados para evitar ofrecerles una promo de captación.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={recommended} className="rounded-xl bg-lime-300 px-3 py-2 text-xs font-black text-black">Recomendados</button><button onClick={() => setSelectedEmails(recipients.filter(row => !row.sent && !row.review).map(row => row.email))} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-black">Tildar todos</button><button onClick={() => setSelectedEmails([])} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">Destildar todos</button></div>
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre, correo o estado…" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {visibleRecipients.map(row => <label key={row.email} className={`flex items-center gap-3 rounded-2xl border p-3 ${row.sent || row.review ? 'border-white/5 bg-white/[.02] opacity-50' : row.active ? 'border-sky-400/15 bg-sky-400/[.04]' : 'border-white/10 bg-black/20'}`}>
            <input type="checkbox" disabled={row.sent || row.review} checked={!row.sent && !row.review && selectedSet.has(row.email)} onChange={() => toggleRecipient(row.email)} className="h-5 w-5 accent-lime-400" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-black">{row.name || 'Sin nombre'}</p><SourceBadge source={row.source} />{row.active && <span className="shrink-0 rounded-full bg-sky-400/15 px-2 py-1 text-[8px] font-black tracking-wide text-sky-300">ACTIVO PR · DESTILDADO</span>}</div>
              <p className="truncate text-xs text-white/40">{row.email}</p>
              {row.review && <p className="mt-1 text-[10px] font-bold text-amber-300">{row.observation || 'Revisar dirección antes de habilitar'}</p>}
            </div>
            <span className={`text-[9px] font-black ${row.sent ? 'text-emerald-300' : row.review ? 'text-amber-300' : row.active ? 'text-sky-300' : 'text-white/25'}`}>{row.sent ? 'ENVIADO' : row.review ? 'BLOQUEADO' : row.active ? 'ACTIVO' : 'PENDIENTE'}</span>
          </label>)}
          {!visibleRecipients.length && <p className="py-8 text-center text-sm text-white/35">No encontramos contactos.</p>}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white">
          <div className="border-b border-black/10 bg-[#f4f5ef] px-5 py-3 text-xs font-black text-black/45">VISTA PREVIA EXACTA · ROLLERWEEN</div>
          {summary?.html ? <iframe title="Vista previa del correo" srcDoc={summary.html} className="h-[820px] w-full border-0 bg-white" /> : <div className="grid h-72 place-items-center text-black/40">Cargando correo…</div>}
        </div>

        <div className="space-y-4">
          <section className="rounded-[26px] border border-white/10 bg-white/[.04] p-5">
            <p className="text-[10px] font-black tracking-[.18em] text-orange-300">1 · PRUEBA REAL</p>
            <h3 className="mt-2 text-xl font-black">Mandarlo solamente a vos</h3>
            <p className="mt-2 text-xs leading-5 text-white/40">El asunto, banner, texto, código y botón serán exactamente los mismos del envío final.</p>
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
            <button disabled={busy || !testEmail.includes('@')} onClick={sendTest} className="mt-3 w-full rounded-2xl bg-white py-4 font-black text-black disabled:opacity-30">{busy === 'test' ? 'ENVIANDO…' : 'ENVIAR PRUEBA ROLLERWEEN'}</button>
          </section>

          <section className="rounded-[26px] border border-purple-400/20 bg-purple-500/[.07] p-5">
            <p className="text-[10px] font-black tracking-[.18em] text-purple-300">2 · ENVÍO GENERAL</p>
            <h3 className="mt-2 text-xl font-black">Base seleccionada</h3>
            <p className="mt-2 text-xs leading-5 text-white/45">Los correos se deduplican y esta campaña tiene un ID nuevo, independiente del mail anterior. Los activos pueden seleccionarse manualmente si realmente querés incluirlos.</p>
            <label className="mt-4 block text-[10px] font-black text-white/35">ESCRIBÍ: ENVIAR {selectedEmails.length}</label>
            <input value={confirmation} onChange={e => setConfirmation(e.target.value.toUpperCase())} placeholder={`ENVIAR ${selectedEmails.length}`} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-black outline-none" />
            <button disabled={busy || !selectedEmails.length || confirmation !== `ENVIAR ${selectedEmails.length}`} onClick={sendCampaign} className="mt-3 w-full rounded-2xl bg-purple-600 py-4 font-black text-white disabled:bg-white/10 disabled:text-white/25">{busy === 'send' ? 'ENVIANDO…' : `ENVIAR A ${selectedEmails.length} CORREOS`}</button>
          </section>
        </div>
      </section>
    </div>
  </main>
}

function Stat({ label, value, accent = false }) {
  return <div className={`rounded-[22px] border p-4 ${accent ? 'border-lime-300/25 bg-lime-300/10' : 'border-white/10 bg-white/[.04]'}`}><p className="text-3xl font-black">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-white/35">{label}</p></div>
}

function SourceBadge({ source }) {
  const label = source === 'platform' ? 'PLATAFORMA' : source === 'historical' ? 'HISTÓRICA' : 'REVISAR'
  const style = source === 'platform' ? 'bg-sky-400/15 text-sky-300' : source === 'historical' ? 'bg-lime-300/15 text-lime-300' : 'bg-amber-300/15 text-amber-300'
  return <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black tracking-wide ${style}`}>{label}</span>
}
