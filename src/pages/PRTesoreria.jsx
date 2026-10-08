import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const money = (v) => new Intl.NumberFormat('es-UY',{style:'currency',currency:'UYU',maximumFractionDigits:0}).format(Number(v||0))
const monthLabel = (d) => new Date(d+'T12:00:00').toLocaleDateString('es-UY',{month:'long',year:'numeric'})
const PR_TIME_ZONE='America/Montevideo'
function montevideoParts(date=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:PR_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return p}
const today = () => {const p=montevideoParts();return `${p.year}-${p.month}-${p.day}`}
const currentPeriod = () => {const p=montevideoParts();return `${p.year}-${p.month}-01`}

function statusMeta(row,profile){
  if(String(profile?.estado||'').toLowerCase()==='pausado') return ['PAUSADO','bg-white/10 text-white/50 border-white/10']
  if(row?.estado==='pagado') return ['PAGADO','bg-emerald-500/15 text-emerald-300 border-emerald-400/20']
  if(row?.estado==='bonificado') return ['BONIFICADO','bg-sky-500/15 text-sky-300 border-sky-400/20']
  if(row?.estado==='acuerdo') return ['ACUERDO','bg-violet-500/15 text-violet-300 border-violet-400/20']
  if(row?.estado==='vencido') return ['VENCIDO','bg-red-500/15 text-red-300 border-red-400/20']
  if(row?.estado==='pendiente' && row?.vencimiento && today()<=String(row.vencimiento).slice(0,10)) return ['EN PLAZO','bg-sky-500/15 text-sky-200 border-sky-400/20']
  return ['PENDIENTE','bg-amber-500/15 text-amber-200 border-amber-400/20']
}

export default function PRTesoreria(){
  const { user } = useAuth()
  const navigate = useNavigate()
  const [periodo,setPeriodo]=useState(currentPeriod())
  const [profiles,setProfiles]=useState([])
  const [dues,setDues]=useState([])
  const [moves,setMoves]=useState([])
  const [config,setConfig]=useState(null)
  const [query,setQuery]=useState('')
  const [filter,setFilter]=useState('por_cobrar')
  const [busy,setBusy]=useState(false)
  const [selected,setSelected]=useState(null)
  const [expenseOpen,setExpenseOpen]=useState(false)
  const [msg,setMsg]=useState('')
  const [testEmail,setTestEmail]=useState(user?.email||'')
  const [amountsOpen,setAmountsOpen]=useState(false)
  const [amountDrafts,setAmountDrafts]=useState({})
  const [createTreasuryOpen,setCreateTreasuryOpen]=useState(false)
  const [showDetails,setShowDetails]=useState(false)
  const [lastSynced,setLastSynced]=useState(null)

  const isAdmin = user?.role==='admin'

  async function load(){
    setBusy(true)
    try{
      await supabase.rpc('pr_asegurar_mensualidades',{p_periodo:periodo})
      await supabase.functions.invoke('pr-tesoreria-montos',{body:{action:'sync',periodo}})
      await supabase.rpc('pr_actualizar_estado_mensualidades')
      const [{data:p,error:pe},{data:d,error:de},{data:m,error:me},{data:c,error:ce}] = await Promise.all([
        supabase.from('profiles').select('id,nombre,apellido,telefono,email,foto,role,estado,auth_user_id,es_solo_personalizadas').eq('role','alumno').neq('estado','Inactivo').eq('es_solo_personalizadas',false).order('nombre'),
        supabase.from('pr_mensualidades').select('*').eq('periodo',periodo).order('created_at'),
        supabase.from('pr_tesoreria_movimientos').select('*').gte('fecha',periodo).lt('fecha',new Date(new Date(periodo+'T12:00:00').setMonth(new Date(periodo+'T12:00:00').getMonth()+1)).toISOString().slice(0,10)).order('fecha',{ascending:false}),
        supabase.from('pr_tesoreria_config').select('*').eq('id',1).single()
      ])
      if(pe||de||me||ce) throw new Error(pe?.message||de?.message||me?.message||ce?.message)
      setProfiles((p||[]).filter(x=>!String(x.id).startsWith('personal_')))
      setDues(d||[]);setMoves(m||[]);setConfig(c);setLastSynced(new Date())
    }catch(e){setMsg('No se pudo cargar Tesorería: '+e.message)}
    finally{setBusy(false)}
  }

  useEffect(()=>{load()},[periodo,user?.id])

  const merged=useMemo(()=>profiles.map(p=>({...p,due:dues.find(d=>d.alumno_id===p.id)})),[profiles,dues])
  const shown=useMemo(()=>merged.filter(x=>{
    const q=query.trim().toLowerCase()
    const okq=!q||`${x.nombre||''} ${x.apellido||''} ${x.telefono||''}`.toLowerCase().includes(q)
    const paused=String(x.estado||'').toLowerCase()==='pausado'
    const st=x.due?.estado||'pendiente'
    const method=String(x.due?.metodo||'')
    const okf=
      filter==='sin_cuenta' ? (isAdmin && !x.auth_user_id && ['pendiente','vencido'].includes(st) && !paused) :
      filter==='pausado' ? paused :
      filter==='por_cobrar' ? (!paused && ['pendiente','vencido'].includes(st)) :
      filter==='pago_claudio' ? (!paused && st==='pagado' && method==='Transferencia Claudio') :
      filter==='pago_lucia' ? (!paused && st==='pagado' && method==='Transferencia Lucía') :
      filter==='pagado' ? (!paused && st==='pagado') :
      filter==='todos' ? true :
      (!paused && st===filter)
    return okq&&okf
  }),[merged,query,filter,isAdmin])

  const stats=useMemo(()=>{
    const paid=dues.filter(x=>x.estado==='pagado')
    const special=dues.filter(x=>['bonificado','acuerdo'].includes(x.estado))
    const pending=dues.filter(x=>x.estado==='pendiente')
    const overdue=dues.filter(x=>x.estado==='vencido')
    const ingresos=moves.filter(x=>x.tipo==='ingreso').reduce((a,b)=>a+Number(b.monto||0),0)
    const gastos=moves.filter(x=>x.tipo==='gasto').reduce((a,b)=>a+Number(b.monto||0),0)
    const income=moves.filter(x=>x.tipo==='ingreso'&&x.categoria==='mensualidad')
    const claudio=income.filter(x=>x.metodo==='Transferencia Claudio').reduce((a,b)=>a+Number(b.monto||0),0)
    const lucia=income.filter(x=>x.metodo==='Transferencia Lucía').reduce((a,b)=>a+Number(b.monto||0),0)
    const totalPagado=income.reduce((a,b)=>a+Number(b.monto||0),0)
    return {paid,special,pending,overdue,ingresos,gastos,saldo:ingresos-gastos,claudio,lucia,totalPagado}
  },[dues,moves])

  async function registerPayment(profile, form){
    if(busy)return
    const amount=Number(form.monto)
    if(!Number.isFinite(amount)||amount<=0){setMsg('Ingresá el importe real que pagó el alumno.');return}
    const existing=dues.find(d=>d.alumno_id===profile.id)
    if(existing?.estado==='pagado'){setMsg('Este mes ya tiene un pago registrado. Revisá el movimiento antes de volver a acreditarlo.');return}
    if(!window.confirm(`Registrar ${money(amount)} para ${profile.nombre} ${profile.apellido||''} · ${monthLabel(periodo)} · ${form.metodo}?`))return
    setBusy(true);setMsg('')
    try{
      // Revalidar contra Supabase: la lista local puede estar desactualizada si
      // Claudio y Lucía tienen Tesorería abierta en dispositivos distintos.
      // Esto reduce dobles cobros, pero el bloqueo atómico debe estar en el RPC.
      const {data:latestDue,error:latestDueError}=await supabase
        .from('pr_mensualidades')
        .select('estado')
        .eq('alumno_id',profile.id)
        .eq('periodo',periodo)
        .maybeSingle()
      if(latestDueError)throw new Error('No se pudo verificar el estado actual del pago. No se registró ningún cobro. Actualizá Tesorería e intentá nuevamente.')
      if(latestDue?.estado==='pagado'){
        await load()
        setSelected(null)
        setMsg('Este alumno ya figura como PAGADO en Supabase. Es posible que otro integrante de Tesorería lo haya registrado. No se generó un nuevo cobro.')
        return
      }
      const by=`${user?.nombre||''} ${user?.apellido||''}`.trim()||'Tesorería PR'
      const {error}=await supabase.rpc('pr_registrar_mensualidad',{
        p_alumno_id:profile.id,p_periodo:periodo,p_monto:amount,
        p_fecha_pago:today(),p_metodo:form.metodo,p_observacion:form.observacion||null,
        p_registrado_por_id:user?.id||null,p_registrado_por_nombre:by
      })
      if(error)throw error
      setSelected(null);await load();setMsg('✓ Pago registrado y alumno habilitado')
    }catch(error){setMsg('No se pudo registrar el pago: '+(error.message||'Intentá nuevamente.'))}
    finally{setBusy(false)}
  }

  async function special(profile,estado,gracia_hasta=null){
    if(busy)return
    if(!window.confirm(`${estado==='bonificado'?'Bonificar sin cobrar':'Registrar acuerdo de pago para'} ${profile.nombre} ${profile.apellido||''} · ${monthLabel(periodo)}?`))return
    setBusy(true);setMsg('')
    try{
      // Evitar que una pantalla desactualizada cambie a bonificado/acuerdo
      // una mensualidad que otra persona acaba de acreditar como pagada.
      const {data:latestDue,error:latestDueError}=await supabase
        .from('pr_mensualidades')
        .select('estado')
        .eq('alumno_id',profile.id)
        .eq('periodo',periodo)
        .maybeSingle()
      if(latestDueError)throw new Error('No se pudo verificar el estado actual. No se modificó la mensualidad.')
      if(latestDue?.estado==='pagado'){
        await load()
        setSelected(null)
        setMsg('Esta mensualidad ya figura como PAGADA. No se cambió a bonificación ni acuerdo. Revisá el pago registrado.')
        return
      }
      const by=`${user?.nombre||''} ${user?.apellido||''}`.trim()||'Tesorería PR'
      const {error}=await supabase.rpc('pr_marcar_mensualidad_especial',{
        p_alumno_id:profile.id,p_periodo:periodo,p_estado:estado,p_gracia_hasta:gracia_hasta,
        p_observacion:estado==='bonificado'?'Bonificación PR':'Acuerdo de pago',
        p_registrado_por_id:user?.id||null,p_registrado_por_nombre:by
      })
      if(error)throw error
      setSelected(null);await load();setMsg('✓ Estado actualizado')
    }catch(error){setMsg('No se pudo actualizar el estado: '+(error.message||'Intentá nuevamente.'))}
    finally{setBusy(false)}
  }

  async function updateStudent(profile, updates){
    setBusy(true)
    const {error}=await supabase.from('profiles').update(updates).eq('id',profile.id)
    if(error)setMsg('No se pudo actualizar el perfil: '+error.message)
    else{setMsg('✓ Perfil actualizado');setSelected(null);await load()}
    setBusy(false)
  }

  async function pauseStudent(profile){await updateStudent(profile,{estado:'Pausado'})}
  async function resumeStudent(profile){await updateStudent(profile,{estado:'Activo'})}

  async function deleteExpense(move){
    const ok=window.confirm(`¿Eliminar el gasto "${move.concepto||'Sin concepto'}" por ${money(move.monto)}?`)
    if(!ok)return
    setBusy(true)
    const {error}=await supabase.from('pr_tesoreria_movimientos').delete().eq('id',move.id).eq('tipo','gasto')
    if(error)setMsg('No se pudo eliminar el gasto: '+error.message)
    else{setMsg('✓ Gasto eliminado');await load()}
    setBusy(false)
  }

  async function addExpense(form){
    const by=`${user?.nombre||''} ${user?.apellido||''}`.trim()||'Tesorería PR'
    const {error}=await supabase.from('pr_tesoreria_movimientos').insert({fecha:form.fecha,tipo:'gasto',categoria:form.categoria,concepto:form.concepto,monto:Number(form.monto||0),metodo:form.metodo,observacion:form.observacion||null,registrado_por_id:user?.id||null,registrado_por_nombre:by})
    if(error)setMsg(error.message);else{setExpenseOpen(false);setMsg('✓ Gasto registrado');await load()}
  }

  function openAmounts(){const drafts={};merged.forEach(item=>{drafts[item.id]=item.due?.monto||''});setAmountDrafts(drafts);setAmountsOpen(true)}

  async function saveBaseAmount(profile){
    const monto=Number(amountDrafts[profile.id]||0)
    if(!Number.isFinite(monto)||monto<=0){setMsg('Ingresá un monto válido para '+profile.nombre+'.');return}
    setBusy(true)
    const {data,error}=await supabase.functions.invoke('pr-tesoreria-montos',{body:{action:'set',periodo,alumno_id:profile.id,monto}})
    if(error)setMsg('No se pudo guardar el monto: '+error.message)
    else if(!data?.ok)setMsg('No se pudo guardar el monto.')
    else{setMsg('✓ Monto actualizado para '+profile.nombre);await load()}
    setBusy(false)
  }

  async function deleteTreasuryStudent(profile){
    if(!String(profile?.id||'').startsWith('tesoreria_')) return
    const ok=window.confirm(`¿Eliminar a ${profile.nombre} de Tesorería? Esta acción solo está disponible para alumnos creados exclusivamente para Tesorería.`)
    if(!ok)return
    setBusy(true)
    const {data,error}=await supabase.functions.invoke('pr-tesoreria-alumnos',{body:{action:'delete',id:profile.id}})
    if(error)setMsg('No se pudo eliminar: '+error.message)
    else if(data?.error==='has_payment_history')setMsg('No se puede eliminar porque ya tiene historial de pagos. Podés pausarlo en su lugar.')
    else if(!data?.ok)setMsg('No se pudo eliminar el alumno.')
    else{setMsg('✓ Alumno eliminado de Tesorería');setSelected(null);await load()}
    setBusy(false)
  }

  async function createTreasuryStudent(form){
    setBusy(true)
    const {data,error}=await supabase.functions.invoke('pr-tesoreria-alumnos',{body:{...form,periodo}})
    if(error)setMsg('No se pudo crear el alumno: '+error.message)
    else if(!data?.ok)setMsg('No se pudo crear el alumno de Tesorería.')
    else{setMsg('✓ Alumno agregado solo a Tesorería');setCreateTreasuryOpen(false);await load()}
    setBusy(false)
  }

  async function sendReminders(){
    setBusy(true);setMsg('Enviando recordatorios…')
    const {data,error}=await supabase.functions.invoke('pr-tesoreria-recordatorios',{body:{periodo}})
    if(error)setMsg('No se pudieron enviar: '+error.message)
    else if(!data?.ok)setMsg(data?.error||'No se confirmó el envío de recordatorios.')
    else setMsg(`✓ Recordatorios enviados: ${data?.sent||0} · omitidos: ${data?.skipped||0} · fallidos: ${data?.failed||0}`)
    setBusy(false)
  }

  async function sendTest(){
    const target=testEmail.trim()
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)){setMsg('Ingresá un email válido para la prueba.');return}
    setBusy(true);setMsg('Enviando prueba…')
    const {data,error}=await supabase.functions.invoke('pr-tesoreria-recordatorios',{body:{periodo,modo_prueba:true,test_email:target}})
    if(error)setMsg('No se pudo enviar la prueba: '+error.message)
    else if(!data?.test)setMsg('La función respondió, pero no confirmó el modo de prueba.')
    else setMsg('✓ Prueba enviada a '+(data?.recipient||target))
    setBusy(false)
  }

  async function toggleEnforcement(){
    if(!isAdmin)return
    const {error}=await supabase.from('pr_tesoreria_config').update({enforcement_enabled:!config.enforcement_enabled,updated_at:new Date().toISOString()}).eq('id',1)
    if(error)setMsg(error.message);else await load()
  }

  return <main className="min-h-screen bg-[#070b13] text-white pb-20 selection:bg-violet-400/30">
    <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1c]/95 shadow-[0_12px_40px_rgba(0,0,0,.3)] backdrop-blur-xl"><div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3"><button onClick={()=>navigate(-1)} className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">← Volver</button><div className="text-center"><p className="text-[10px] font-bold tracking-[.24em] text-violet-300">PUNTA ROLLERS / ADMIN</p><h1 className="text-xl font-black tracking-tight sm:text-2xl">Tesorería<span className="ml-2 text-violet-400">PR</span></h1></div><div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] px-3 py-2 text-[10px] font-bold tracking-wide text-emerald-300">PANEL ADMIN</div></div></div>
    <div className="mx-auto max-w-6xl px-4 pt-6 space-y-6">
      {msg&&<div className="rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm">{msg}</div>}
      <section className="relative overflow-hidden rounded-[26px] border border-violet-400/20 bg-gradient-to-br from-[#232047] via-[#15182c] to-[#0d1524] p-5 shadow-[0_20px_60px_rgba(10,7,35,.35)] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl"/>
        <div className="relative flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-violet-300">Centro de cobranzas</p><h2 className="mt-2 text-3xl font-black capitalize tracking-tight sm:text-5xl">{monthLabel(periodo)}</h2><p className="mt-1 text-xs text-white/50">Vence el día {config?.vencimiento_dia||10} · {lastSynced?'Actualizado '+lastSynced.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'}):'Sin sincronizar'}</p></div><label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-white/45">Período<input aria-label="Seleccionar mes" type="month" value={periodo.slice(0,7)} onChange={e=>setPeriodo(e.target.value+'-01')} className="w-[160px] rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm font-semibold text-white"/></label></div>
        <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4"><div><p className="text-[10px] uppercase tracking-wider text-white/45">Ingresos</p><p className="mt-1 text-xl font-black text-emerald-300 sm:text-2xl">{money(stats.ingresos)}</p></div><div><p className="text-[10px] uppercase tracking-wider text-white/45">Por cobrar</p><p className="mt-1 text-xl font-black text-amber-200 sm:text-2xl">{money(stats.pending.reduce((n,d)=>n+Number(d.monto||0),0)+stats.overdue.reduce((n,d)=>n+Number(d.monto||0),0))}</p></div><div><p className="text-[10px] uppercase tracking-wider text-white/45">Pagados</p><p className="mt-1 text-xl font-black">{stats.paid.length}</p></div><div><p className="text-[10px] uppercase tracking-wider text-white/45">Pendientes</p><p className="mt-1 text-xl font-black">{stats.pending.length+stats.overdue.length}</p></div></div>
      </section>
      <section aria-label="Acciones rápidas" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button onClick={()=>{setFilter('por_cobrar');document.getElementById('tesoreria-alumnos')?.scrollIntoView({behavior:'smooth'})}} className="rounded-2xl bg-violet-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-900/20">Cobrar cuotas →</button>
        <button onClick={()=>{setFilter('todos');document.getElementById('tesoreria-busqueda')?.focus()}} className="rounded-2xl border border-white/10 bg-[#171f30] px-4 py-3 text-sm font-bold">Buscar alumno</button>
        <button onClick={()=>setExpenseOpen(true)} className="rounded-2xl border border-white/10 bg-[#171f30] px-4 py-3 text-sm font-bold">+ Gasto</button>
        <button disabled={busy} onClick={load} className="rounded-2xl border border-white/10 bg-[#171f30] px-4 py-3 text-sm font-bold disabled:opacity-40">{busy?'Actualizando…':'↻ Actualizar'}</button>
      </section>
      <section id="tesoreria-alumnos" className="rounded-[24px] border border-white/10 bg-[#111827] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-300">Gestión de alumnos</p><h3 className="mt-1 text-lg font-black">Cobros y estados</h3></div><span className="rounded-xl bg-white/[.06] px-3 py-1.5 text-xs font-bold text-white/70">{shown.length} resultados</span></div><input id="tesoreria-busqueda" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre o teléfono…" className="w-full rounded-xl border border-white/15 bg-[#0a101c] px-4 py-3.5 text-sm outline-none focus:border-violet-400" aria-label="Buscar alumno"/><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{[['por_cobrar','Por cobrar'],['todos','Todos'],['pagado','Pagados'],['vencido','Vencidos'],['acuerdo','Acuerdos'],['bonificado','Bonificados'],['pausado','Pausados'],['pago_claudio','Claudio'],['pago_lucia','Lucía']].map(([value,label])=><button key={value} onClick={()=>setFilter(value)} aria-pressed={filter===value} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition ${filter===value?'border-violet-400 bg-violet-500 text-white':'border-white/10 bg-white/[.035] text-white/60'}`}>{label}</button>)}</div></section>
      <button onClick={()=>setShowDetails(v=>!v)} aria-expanded={showDetails} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm font-bold"><span>Balance, desglose y herramientas avanzadas</span><span>{showDetails?'− Ocultar':'＋ Ver detalles'}</span></button>
      {showDetails&&<>
      <section aria-label="Estado de mensualidades" className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Pagados" value={stats.paid.length} tone="emerald"/><Stat label="Pendientes" value={stats.pending.length} tone="amber"/><Stat label="Vencidos" value={stats.overdue.length} tone="red"/><Stat label="Acuerdos/bonif." value={stats.special.length} tone="violet"/></section>
      <section aria-label="Balance del período" className="grid md:grid-cols-3 gap-3"><Money label="Ingresos del mes" value={stats.ingresos}/><Money label="Gastos del mes" value={stats.gastos}/><Money label="Saldo operativo" value={stats.saldo} strong/></section>

      <section className="rounded-[24px] border border-violet-400/20 bg-gradient-to-br from-violet-400/[.09] to-transparent p-5 sm:p-6"><div><p className="text-[10px] font-black tracking-[.14em] text-violet-300">CIERRE DE COBRANZAS</p><h3 className="mt-1 text-lg font-black">¿Cuánto ingresó cada uno?</h3></div><div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-[10px] font-black tracking-[.12em] text-white/35">CLAUDIO</p><p className="mt-1 text-2xl font-black">{money(stats.claudio)}</p><p className="mt-1 text-xs text-white/35">Ingresos registrados por transferencia a Claudio</p></div><div className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-[10px] font-black tracking-[.12em] text-white/35">LUCÍA</p><p className="mt-1 text-2xl font-black">{money(stats.lucia)}</p><p className="mt-1 text-xs text-white/35">Ingresos registrados por transferencia a Lucía</p></div><div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4"><p className="text-[10px] font-black tracking-[.12em] text-orange-200">TOTAL</p><p className="mt-1 text-2xl font-black">{money(stats.totalPagado)}</p><p className="mt-1 text-xs text-white/45">Movimientos de mensualidad de todos los medios</p></div></div></section>

      <section className="rounded-[26px] border border-white/10 bg-white/[.03] p-4"><div><p className="text-[10px] font-black tracking-[.14em] text-white/35">GASTOS DEL MES</p><h3 className="mt-1 text-lg font-black">Detalle de gastos</h3></div><div className="mt-3 space-y-2">{moves.filter(x=>x.tipo==='gasto').length===0&&<p className="text-sm text-white/35">Todavía no hay gastos cargados este mes.</p>}{moves.filter(x=>x.tipo==='gasto').map(move=><div key={move.id} className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{move.concepto||'Gasto sin concepto'}</p><p className="mt-1 text-[10px] text-white/35">{move.fecha} · {move.categoria||'otro'}</p></div><p className="text-sm font-black">{money(move.monto)}</p><button disabled={busy} onClick={()=>deleteExpense(move)} className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 disabled:opacity-50">Eliminar</button></div>)}</div></section>

      <section className="rounded-[24px] border border-white/10 bg-[#111827] p-5 shadow-xl shadow-black/10 sm:p-6"><div className="flex flex-col gap-3"><div className="flex flex-col md:flex-row gap-3">{isAdmin&&<button disabled={busy} onClick={openAmounts} className="rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200 px-4 py-3 font-black">⚙ Montos</button>}{isAdmin&&<button disabled={busy} onClick={()=>setCreateTreasuryOpen(true)} className="rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-200 px-4 py-3 font-black">+ Alumno Tesorería</button>}{isAdmin&&<button disabled={busy||today()!==`${periodo.slice(0,7)}-11`} title="Disponible únicamente el día 11 del mes seleccionado" onClick={sendReminders} className="rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-200 px-4 py-3 font-black">{today()===`${periodo.slice(0,7)}-11`?"✉ Enviar recordatorios":"✉ Recordatorios · día 11"}</button>}<button onClick={()=>setExpenseOpen(true)} className="rounded-2xl bg-white text-black px-4 py-3 font-black">+ Registrar gasto</button></div>{isAdmin&&<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[.06] p-3"><p className="text-[10px] font-black tracking-[.14em] text-emerald-300">PRUEBA DE EMAIL</p><div className="mt-2 flex flex-col sm:flex-row gap-2"><input type="email" value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="Email para recibir la prueba" className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"/><button disabled={busy} onClick={sendTest} className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-black disabled:opacity-50">{busy?'Enviando…':'🧪 Enviar prueba'}</button></div><p className="mt-2 text-xs text-white/35">No selecciona alumnos ni registra recordatorios. Solo envía al email que escribas acá.</p></div>}</div></section>
      </>}
      {isAdmin&&amountsOpen&&<section className="rounded-[26px] border border-orange-400/20 bg-orange-500/[.05] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.16em] text-orange-300">MONTOS DEL MES</p><h3 className="mt-1 text-xl font-black capitalize">{monthLabel(periodo)}</h3><p className="mt-1 text-xs text-white/40">Solo visible para administrador. El monto queda como referencia para este alumno y puede modificarse si hay una excepción.</p></div><button onClick={()=>setAmountsOpen(false)} className="rounded-xl border border-white/10 px-3 py-2 text-white/50">✕</button></div><div className="mt-4 space-y-2">{merged.filter(item=>String(item.estado||'').toLowerCase()!=='pausado').map(item=><div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-black/25 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.nombre} {item.apellido||''}</p><p className="text-[10px] text-white/35">{item.due?.estado||'pendiente'}</p></div><input type="number" inputMode="numeric" value={amountDrafts[item.id]??''} onChange={e=>setAmountDrafts(x=>({...x,[item.id]:e.target.value}))} placeholder="Monto" className="w-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-right text-sm"/><button disabled={busy} onClick={()=>saveBaseAmount(item)} className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-black disabled:opacity-50">Guardar</button></div>)}</div></section>}
      {isAdmin&&<section className="rounded-2xl border border-sky-400/20 bg-sky-500/[.06] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-sky-100">Alumnos pendientes sin cuenta vinculada</h3><p className="text-xs text-white/55">Identificá a quienes todavía no tienen un usuario de acceso asociado. Podés contactarlos por WhatsApp para completar su registro.</p></div><button onClick={()=>{setFilter('sin_cuenta');setQuery('')}} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-black">Ver alumnos ({merged.filter(x=>!x.auth_user_id&&['pendiente','vencido'].includes(x.due?.estado||'pendiente')&&String(x.estado||'').toLowerCase()!=='pausado').length})</button></div>{filter==='sin_cuenta'&&<p className="mt-3 text-xs text-sky-100/80">Mostrando perfiles sin cuenta vinculada con mensualidad pendiente o vencida del período seleccionado. Revisá cada inscripción antes de solicitar un nuevo registro.</p>}</section>}
      <section aria-label="Listado de alumnos y mensualidades" className="grid gap-3 lg:grid-cols-2">{shown.length===0&&<div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-7 text-center lg:col-span-2"><p className="text-base font-bold">No hay alumnos con este filtro</p><p className="mt-1 text-sm text-white/45">Probá otra búsqueda o elegí Todos.</p><button onClick={()=>{setFilter('todos');setQuery('')}} className="mt-4 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold">Mostrar todos</button></div>}{shown.map(({due,...p})=>{const [lab,cls]=statusMeta(due,p);return <article key={p.id} className="rounded-[22px] border border-white/10 bg-[#111827] p-4 shadow-[0_10px_30px_rgba(0,0,0,.15)] transition-colors hover:border-violet-400/30 sm:p-5"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl overflow-hidden bg-white/5 grid place-items-center">{p.foto?<img src={p.foto} className="h-full w-full object-cover"/>:'👤'}</div><div className="min-w-0 flex-1"><p className="font-black truncate">{p.nombre} {p.apellido||''}</p><p className="text-xs text-white/35">{p.telefono||'Sin teléfono'}</p>{isAdmin&&filter==='sin_cuenta'&&<div className="mt-2 flex flex-wrap gap-2"><span className="rounded-lg border border-amber-400/20 px-2 py-1 text-[11px] font-bold text-amber-200">Sin cuenta vinculada</span>{p.telefono&&<a href={`https://wa.me/${(digits=>digits.startsWith('598')?digits:`598${digits.replace(/^0/,'')}`)(String(p.telefono).replace(/\D/g,''))}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-200">Contactar por WhatsApp ↗</a>}</div>}<p className={`mt-1 text-[10px] font-black ${p.email?'text-emerald-300':'text-amber-300'}`}>{p.email?'Email OK':'Sin email'}</p></div><span className={`rounded-full border px-3 py-1 text-[9px] font-black ${cls}`}>{lab}</span></div><div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center"><Mini label="Cuota" value={Number(due?.monto||0)>0 ? money(due?.monto) : 'Definir monto'}/><Mini label="Vence" value={due?.vencimiento?new Date(due.vencimiento+'T12:00:00').toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit'}):'10'}/><Mini label="Pago" value={due?.fecha_pago?new Date(due.fecha_pago+'T12:00:00').toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit'}):'—'}/><Mini label="Recibió" value={due?.estado==='pagado' ? (due?.metodo==='Transferencia Lucía'?'Lucía':due?.metodo==='Transferencia Claudio'?'Claudio':due?.metodo||'Otro') : '—'}/></div><button onClick={()=>{setMsg('');setSelected({profile:p,due})}} className="mt-3 w-full rounded-2xl bg-orange-500 py-3 font-black text-black">{due?.estado==='pagado'?'Ver / corregir':'Gestionar pago'}</button></article>})}</section>
      <section className="rounded-[26px] border border-white/10 bg-white/[.03] p-5"><h3 className="font-black text-xl">Regla de acceso</h3><p className="mt-2 text-sm text-white/45">El sistema está preparado para limitar el área privada desde el día 11 si la mensualidad sigue pendiente. Para evitar bloquear alumnos antes de conciliar este mes, la activación se controla desde acá.</p><div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-black/25 p-4"><div><p className="font-black">{config?.enforcement_enabled?'Modo limitado ACTIVO':'Modo limitado PAUSADO'}</p><p className="text-xs text-white/35">{config?.enforcement_enabled?'Se aplica la regla del día 11.':'Primero conciliá los pagos del mes.'}</p></div>{isAdmin&&<button onClick={toggleEnforcement} className={`rounded-2xl px-4 py-3 text-xs font-black ${config?.enforcement_enabled?'bg-red-500':'bg-emerald-500 text-black'}`}>{config?.enforcement_enabled?'Pausar':'Activar'}</button>}</div></section>
    </div>
    {selected&&<PaymentSheet key={selected.profile.id} message={msg} item={selected} config={config} busy={busy} onClose={()=>setSelected(null)} onPay={registerPayment} onSpecial={special} onUpdate={updateStudent} onPause={pauseStudent} onResume={resumeStudent} onDelete={deleteTreasuryStudent}/>}
    {expenseOpen&&<ExpenseSheet onClose={()=>setExpenseOpen(false)} onSave={addExpense}/>} 
    {createTreasuryOpen&&<TreasuryStudentSheet busy={busy} onClose={()=>setCreateTreasuryOpen(false)} onSave={createTreasuryStudent}/>} 
  </main>
}

function Stat({label,value,tone}){const c={emerald:'text-emerald-300',amber:'text-amber-200',red:'text-red-300',violet:'text-violet-300'}[tone];return <div className="rounded-[24px] border border-white/10 bg-white/[.035] p-4"><p className={`text-3xl font-black ${c}`}>{value}</p><p className="mt-1 text-[10px] font-black tracking-[.14em] text-white/35">{label.toUpperCase()}</p></div>}
function Money({label,value,strong}){return <div className={`rounded-[24px] border p-4 ${strong?'border-orange-400/20 bg-orange-500/10':'border-white/10 bg-white/[.035]'}`}><p className="text-xs text-white/35">{label}</p><p className="mt-2 text-2xl font-black">{money(value)}</p></div>}
function Mini({label,value}){return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3"><p className="text-[9px] font-black tracking-[.12em] text-white/30">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>}

function Field({label,children}){return <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-white/35">{label}</span>{children}</label>}
function Sheet({children}){return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"><div className="mx-auto max-w-xl min-h-full grid place-items-center"><div className="w-full rounded-[28px] border border-white/10 bg-[#111] p-5">{children}</div></div></div>}

function PaymentSheet({item,message,busy,onClose,onPay,onSpecial,onUpdate,onPause,onResume,onDelete}){
 const {profile,due}=item
 const isTreasuryOnly=String(profile?.id||'').startsWith('tesoreria_')
 const alreadyPaid=due?.estado==='pagado'
 const [nombre,setNombre]=useState([profile.nombre,profile.apellido].filter(Boolean).join(' '))
 const [telefono,setTelefono]=useState(profile.telefono||'')
 const [email,setEmail]=useState(profile.email||'')
 const [monto,setMonto]=useState(due?.monto||'')
 const [metodo,setMetodo]=useState(due?.metodo||'Transferencia Claudio')
 const [observacion,setObservacion]=useState(due?.observacion||'')
 const [gracia,setGracia]=useState(due?.gracia_hasta||'')
 const saveContact=()=>{
   if(isTreasuryOnly){const parts=nombre.trim().split(/\s+/);onUpdate(profile,{nombre:parts.shift()||'',apellido:parts.join(' ')||null,telefono,email});return}
   onUpdate(profile,{telefono,email})
 }
 return <Sheet><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.16em] text-orange-300">GESTIONAR PAGO</p><h2 className="mt-1 text-2xl font-black">{profile.nombre} {profile.apellido||''}</h2></div><button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-white/50">✕</button></div>{isTreasuryOnly&&<div className="mt-4"><Field label="Nombre del alumno"><input value={nombre} onChange={e=>setNombre(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field></div>}<div className="mt-4 grid gap-3"><Field label="Teléfono"><input value={telefono} onChange={e=>setTelefono(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Email"><input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><button disabled={busy} onClick={saveContact} className="rounded-2xl border border-white/10 py-3 text-sm font-black">{isTreasuryOnly?'GUARDAR DATOS DEL ALUMNO':'GUARDAR CONTACTO'}</button></div><div className="mt-5 border-t border-white/10 pt-5">{message&&<p role="alert" className="mb-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">{message}</p>}<Field label="Importe pagado"><input type="number" value={monto} onChange={e=>setMonto(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xl font-black" placeholder="Ej. 1500"/></Field><div className="mt-3"><Field label="Método"><select value={metodo} onChange={e=>setMetodo(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"><option>Transferencia Claudio</option><option>Transferencia Lucía</option><option>Mercado Pago</option><option>Efectivo</option><option>Otro</option></select></Field></div><div className="mt-3"><Field label="Observación"><input value={observacion} onChange={e=>setObservacion(e.target.value)} placeholder="Opcional" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field></div><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={busy||alreadyPaid} onClick={()=>onPay(profile,{monto,metodo,observacion})} className="rounded-2xl bg-emerald-500 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-40">{alreadyPaid?'YA PAGADO':busy?'GUARDANDO…':'REGISTRAR PAGO'}</button><button disabled={busy||alreadyPaid} onClick={()=>onSpecial(profile,'bonificado')} className="rounded-2xl border border-sky-400/20 bg-sky-500/10 py-3 font-black text-sky-200">BONIFICADO</button><button disabled={busy||alreadyPaid} onClick={()=>onSpecial(profile,'acuerdo',gracia||null)} className="rounded-2xl border border-violet-400/20 bg-violet-500/10 py-3 font-black text-violet-200">ACUERDO</button><button disabled={busy} onClick={()=>profile.estado==='Pausado'?onResume(profile):onPause(profile)} className="rounded-2xl border border-white/10 py-3 font-black">{profile.estado==='Pausado'?'REANUDAR':'PAUSAR'}</button></div><div className="mt-3"><Field label="Gracia / acuerdo hasta"><input type="date" value={gracia} onChange={e=>setGracia(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field></div>{isTreasuryOnly&&<button disabled={busy} onClick={()=>onDelete(profile)} className="mt-4 w-full rounded-2xl border border-red-400/20 bg-red-500/10 py-3 font-black text-red-300">ELIMINAR ALUMNO DE TESORERÍA</button>}</div></Sheet>
}

function ExpenseSheet({onClose,onSave}){const [f,setF]=useState({fecha:today(),categoria:'pista',concepto:'',monto:'',metodo:'Transferencia',observacion:''});const set=(k,v)=>setF(x=>({...x,[k]:v}));return <Sheet><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Registrar gasto</h2><button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2">✕</button></div><div className="mt-4 grid gap-3"><Field label="Fecha"><input type="date" value={f.fecha} onChange={e=>set('fecha',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Categoría"><select value={f.categoria} onChange={e=>set('categoria',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"><option>pista</option><option>equipamiento</option><option>publicidad</option><option>transporte</option><option>honorarios</option><option>otro</option></select></Field><Field label="Concepto"><input value={f.concepto} onChange={e=>set('concepto',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Monto"><input type="number" value={f.monto} onChange={e=>set('monto',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Método"><input value={f.metodo} onChange={e=>set('metodo',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Observación"><input value={f.observacion} onChange={e=>set('observacion',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><div className="grid grid-cols-2 gap-2"><button onClick={onClose} className="rounded-2xl border border-white/10 py-3 font-black">Cancelar</button><button onClick={()=>onSave(f)} className="rounded-2xl bg-white py-3 font-black text-black">Guardar gasto</button></div></div></Sheet>}

function TreasuryStudentSheet({busy,onClose,onSave}){const [f,setF]=useState({nombre:'',monto:'',telefono:'',email:''});const set=(k,v)=>setF(x=>({...x,[k]:v}));return <Sheet><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Alumno solo Tesorería</h2><button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2">✕</button></div><p className="mt-2 text-sm text-white/40">Se crea únicamente para llevar su mensualidad. No tendrá acceso a la plataforma.</p><div className="mt-4 grid gap-3"><Field label="Nombre"><input value={f.nombre} onChange={e=>set('nombre',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Monto mensual"><input type="number" value={f.monto} onChange={e=>set('monto',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Teléfono"><input value={f.telefono} onChange={e=>set('telefono',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><Field label="Email"><input type="email" value={f.email} onChange={e=>set('email',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"/></Field><div className="grid grid-cols-2 gap-2"><button onClick={onClose} className="rounded-2xl border border-white/10 py-3 font-black">Cancelar</button><button disabled={busy} onClick={()=>onSave(f)} className="rounded-2xl bg-violet-500 py-3 font-black text-black">Crear alumno</button></div></div></Sheet>}
