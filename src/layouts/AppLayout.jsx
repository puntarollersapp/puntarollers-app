import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import MessagePopup from '../components/MessagePopup'
import InstallPrompt from '../components/InstallPrompt'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const LUCIA_WHATSAPP = '59899220929'
const PR_TIME_ZONE = 'America/Montevideo'

function montevideoDateParts(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: PR_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  )
  return { year: parts.year, month: parts.month, day: parts.day }
}
function currentTreasuryPeriod() {
  const { year, month } = montevideoDateParts()
  return `${year}-${month}-01`
}
function montevideoDayOfMonth() {
  return Number(montevideoDateParts().day || 0)
}

function parseExpirationDate(value) {
  if (!value) return null
  const normalizedDate = String(value).slice(0, 10)
  const date = new Date(`${normalizedDate}T23:59:59`)
  return Number.isNaN(date.getTime()) ? null : date
}
function formatExpirationDate(value) {
  const date = parseExpirationDate(value)
  if (!date) return 'Sin fecha registrada'
  return date.toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })
}
function shouldBlockAccess(profile, enforcementEnabled, monthlyDue) {
  if (!profile) return false
  if (profile.exentoMensualidad || profile.role === 'admin' || profile.role === 'profesor') return false
  if (profile.accesoHabilitado === false) return true
  if (!enforcementEnabled || !monthlyDue) return false
  if (montevideoDayOfMonth() < 11) return false
  if (['pagado', 'bonificado', 'acuerdo'].includes(String(monthlyDue.estado || '').toLowerCase())) return false
  const limitDate = parseExpirationDate(monthlyDue.gracia_hasta || monthlyDue.vencimiento)
  return Boolean(limitDate && limitDate.getTime() < Date.now())
}
function buildWhatsAppLink(profile) {
  const fullName = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim() || 'alumno/a'
  return `https://wa.me/${LUCIA_WHATSAPP}?text=${encodeURIComponent(`Hola Lucía, soy ${fullName}. Quisiera regularizar mi mensualidad de Punta Rollers.`)}`
}
function AccessBlocked({ profile, onLogout, onPublicHome }) {
  return <div className="min-h-[calc(100vh-72px)] px-4 py-8 flex items-center justify-center"><section className="w-full max-w-md rounded-[32px] border border-red-400/20 bg-gradient-to-br from-red-500/10 via-white/[0.035] to-white/[0.02] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5)]"><div className="w-16 h-16 rounded-[22px] bg-red-400/10 border border-red-400/20 grid place-items-center text-3xl">🔒</div><p className="section-label mt-6">Acceso temporalmente inhabilitado</p><h1 className="font-display text-3xl text-white mt-2 leading-tight">Tu mensualidad está vencida</h1><p className="text-white/55 text-sm mt-4 leading-relaxed">Hola, {profile?.nombre || 'alumno'}. Tu mensualidad del mes figura pendiente. Para volver a usar tu perfil PR, Strava, PRCard, PR Chip, tomas de tiempo, devoluciones, insignias y demás servicios privados, necesitás regularizarla.</p><div className="rounded-2xl bg-black/25 border border-white/[0.06] p-4 mt-5"><p className="text-white/30 text-[10px] uppercase tracking-[0.16em]">Vigencia anterior</p><p className="text-white font-semibold mt-1">Venció el {formatExpirationDate(profile?.mensualidadHasta)}</p></div><p className="text-white/35 text-xs mt-4 leading-relaxed">Una vez que Tesorería registre el pago, tu acceso se reactivará automáticamente. Si ya pagaste, escribinos para verificarlo.</p><a href={buildWhatsAppLink(profile)} target="_blank" rel="noreferrer" className="btn-gold w-full mt-6 flex items-center justify-center text-center">Regularizar por WhatsApp</a><button type="button" onClick={onPublicHome} className="w-full mt-3 rounded-2xl border border-white/10 bg-white/[0.035] py-4 text-white text-sm font-semibold">Ir a la página pública</button><button type="button" onClick={onLogout} className="w-full mt-3 py-3 text-white/40 text-xs">Cerrar sesión</button></section></div>
}

export default function AppLayout({ children, title, showBack = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, updateUser } = useAuth()
  const [accessProfile, setAccessProfile] = useState(user || null)
  const [checkingAccess, setCheckingAccess] = useState(Boolean(user?.id))
  const [enforcementEnabled, setEnforcementEnabled] = useState(false)
  const [monthlyDue, setMonthlyDue] = useState(null)
  const [dmUnread, setDmUnread] = useState(0)
  const [dmToast, setDmToast] = useState(null)
  const dmSeenRef = useState(() => ({ total: null }))[0]

  useEffect(() => {
    let active = true
    async function checkAccess() {
      if (!user?.id) { if (active) { setAccessProfile(user || null); setCheckingAccess(false) }; return }
      setCheckingAccess(true)
      const currentPeriod = currentTreasuryPeriod()
      const [{ data, error }, { data: treasuryConfig }, { data: dueRow }] = await Promise.all([
        supabase.from('profiles').select('id, role, nombre, apellido, mensualidad_hasta, acceso_habilitado, exento_mensualidad, es_profesor, participa_como_alumno').eq('id', user.id).maybeSingle(),
        supabase.from('pr_tesoreria_config').select('enforcement_enabled').eq('id', 1).maybeSingle(),
        supabase.from('pr_mensualidades').select('periodo,monto,vencimiento,estado,gracia_hasta,fecha_pago').eq('alumno_id', user.id).eq('periodo', currentPeriod).maybeSingle(),
      ])
      setEnforcementEnabled(Boolean(treasuryConfig?.enforcement_enabled)); setMonthlyDue(dueRow || null)
      if (!active) return
      if (error || !data) { setAccessProfile(user); setCheckingAccess(false); return }
      const updatedProfile = { ...user, role: data.role || user.role, nombre: data.nombre || user.nombre, apellido: data.apellido || user.apellido || '', mensualidadHasta: data.mensualidad_hasta || '', accesoHabilitado: typeof data.acceso_habilitado === 'boolean' ? data.acceso_habilitado : true, exentoMensualidad: Boolean(data.exento_mensualidad) || data.role === 'admin' || data.role === 'profesor', esProfesor: Boolean(data.es_profesor) || data.role === 'admin' || data.role === 'profesor', participaComoAlumno: Boolean(data.participa_como_alumno) || data.role === 'alumno' }
      setAccessProfile(updatedProfile)
      try { localStorage.setItem('pr_user', JSON.stringify(updatedProfile)) } catch {}
      updateUser?.(updatedProfile); setCheckingAccess(false)
    }
    checkAccess()
    const timer = window.setInterval(checkAccess, 60 * 1000)
    window.addEventListener('focus', checkAccess)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', checkAccess) }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || shouldBlockAccess(accessProfile, enforcementEnabled, monthlyDue)) {
      setDmUnread(0)
      setDmToast(null)
      return undefined
    }
    let active = true
    async function checkDirectMessages() {
      const { data, error } = await supabase.rpc('pr_dm_inbox')
      if (!active || error || !Array.isArray(data)) return
      const total = data.reduce((sum, item) => sum + Number(item.unread_count || 0), 0)
      const previous = dmSeenRef.total; setDmUnread(total)
      if (previous !== null && total > previous && !location.pathname.startsWith('/app/mensajes')) {
        const newest = data.find((item) => Number(item.unread_count || 0) > 0)
        if (newest) { setDmToast({ id: newest.id, name: [newest.other_profile?.nombre, newest.other_profile?.apellido].filter(Boolean).join(' ') || 'PR Chat', text: newest.last_message || 'Nuevo mensaje' }); window.setTimeout(() => setDmToast(null), 6000) }
      }
      dmSeenRef.total = total
    }
    checkDirectMessages(); const timer = window.setInterval(checkDirectMessages, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [user?.id, location.pathname, accessProfile?.id, accessProfile?.accesoHabilitado, accessProfile?.exentoMensualidad, accessProfile?.role, enforcementEnabled, monthlyDue?.estado, monthlyDue?.vencimiento, monthlyDue?.gracia_hasta])

  const accessBlocked = useMemo(
    () => shouldBlockAccess(accessProfile, enforcementEnabled, monthlyDue),
    [accessProfile, enforcementEnabled, monthlyDue]
  )

  async function handleLogout() { await logout?.(); navigate('/') }
  function handlePublicHome() { navigate('/') }

  return <div className="app-shell pb-24"><Header title={title} showBack={accessBlocked ? false : showBack} onBack={() => navigate(-1)} /><main>{checkingAccess ? <div className="min-h-[60vh] grid place-items-center px-4"><div className="text-center"><div className="w-12 h-12 mx-auto rounded-2xl bg-pr-gold/10 border border-pr-gold/20 grid place-items-center">🛼</div><p className="mt-3 text-white/40 text-xs">Verificando tu acceso…</p></div></div> : accessBlocked ? <AccessBlocked profile={accessProfile} onLogout={handleLogout} onPublicHome={handlePublicHome} /> : children}</main>{!accessBlocked && <BottomNav />}{!accessBlocked && <InstallPrompt />}{!accessBlocked && dmToast && <MessagePopup title={dmToast.name} message={dmToast.text} onClick={() => navigate(`/app/mensajes?chat=${dmToast.id}`)} onClose={() => setDmToast(null)} />}{dmUnread > 0 && !accessBlocked && !location.pathname.startsWith('/app/mensajes') && <button type="button" onClick={() => navigate('/app/mensajes')} className="fixed bottom-24 right-4 z-40 rounded-full border border-orange-300/20 bg-orange-500 px-3 py-2 text-[10px] font-black text-black shadow-xl">💬 {dmUnread}</button>}</div>
}
