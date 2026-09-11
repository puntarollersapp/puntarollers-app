import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const money = (v) => new Intl.NumberFormat('es-UY',{style:'currency',currency:'UYU',maximumFractionDigits:0}).format(Number(v||0))
const monthLabel = (d) => new Date(d+'T12:00:00').toLocaleDateString('es-UY',{month:'long',year:'numeric'})
const today = () => new Date().toISOString().slice(0,10)
const currentPeriod = () => new Date().toISOString().slice(0,7)+'-01'

function statusMeta(row,profile){
  if(String(profile?.estado||'').toLowerCase()==='pausado') return ['PAUSADO','bg-white/10 text-white/50 border-white/10']
  if(row?.estado==='pagado') return ['PAGADO','bg-emerald-500/15 text-emerald-300 border-emerald-400/20']
  if(row?.estado==='bonificado') return ['BONIFICADO','bg-sky-500/15 text-sky-300 border-sky-400/20']
  if(row?.estado==='acuerdo') return ['ACUERDO','bg-violet-500/15 text-violet-300 border-violet-400/20']
  if(row?.estado==='vencido') return ['VENCIDO','bg-red-500/15 text-red-300 border-red-400/20']
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
  const [filter,setFilter]=useState('todos')
  const [busy,setBusy]=useState(false)
  const [selected,setSelected]=useState(null)
  const [expenseOpen,setExpenseOpen]=useState(false)
  const [msg,setMsg]=useState('')

  const isAdmin = user?.role==='admin'

  async function load(){
    setBusy(true)
    setMsg('')
    try{
      await supabase.rpc('pr_asegurar_mensualidades',{p_periodo:periodo})
      await supabase.rpc('pr_actualizar_estado_mensualidades')
      const [{data:p,error:pe},{data:d,error:de},{data:m,error:me},{data:c,error:ce}] = await Promise.all([
        supabase.from('profiles').select('id,nombre,apellido,telefono,email,foto,role,estado,es_solo_personalizadas').eq('role','alumno').neq('estado','Inactivo').eq('es_solo_personalizadas',false).order('nombre'),
        supabase.from('pr_mensualidades').select('*').eq('periodo',periodo).order('created_at'),
        supabase.from('pr_tesoreria_movimientos').select('*').gte('fecha',periodo).lt('fecha',new Date(new Date(periodo+'T12:00:00').setMonth(new Date(periodo+'T12:00:00').getMonth()+1)).toISOString().slice(0,10)).order('fecha',{ascending:false}),
        supabase.from('pr_tesoreria_config').select('*').eq('id',1).single()
      ])
      if(pe||de||me||ce) throw new Error(pe?.message||de?.message||me?.message||ce?.message)
      setProfiles((p||[]).filter(x=>!String(x.id).startsWith('personal_')))
      setDues(d||[]);setMoves(m||[]);setConfig(c)
    }catch(e){setMsg('No se pudo cargar Tesorería: '+e.message)}
    finally{setBusy(false)}
  }

  useEffect(()=>{load()},[periodo])

  const merged=useMemo(()=>profiles.map(p=>({...p,due:dues.find(d=>d.alumno_id===p.id)})),[profiles,dues])
  const shown=useMemo(()=>merged.filter(x=>{
    const q=query.trim().toLowerCase()
    const okq=!q||`${x.nombre||''} ${x.apellido||''} ${x.telefono||''}`.toLowerCase().includes(q)
    const paused=String(x.estado||'').toLowerCase()==='pausado'
    const st=x.due?.estado||'pendiente'
    const okf=filter==='pausado' ? paused : (!paused && (filter==='todos'||st===filter))
    return okq&&okf
  }),[merged,query,filter])

  const stats=useMemo(()=>{
    const paid=dues.filter(x=>x.estado==='pagado')
    const special=dues.filter(x=>['bonificado','acuerdo'].includes(x.estado))
    const pending=dues.filter(x=>x.estado==='pendiente')
    const overdue=dues.filter(x=>x.estado==='vencido')
    const ingresos=moves.filter(x=>x.tipo==='ingreso').reduce((a,b)=>a+Number(b.monto||0),0)
    const gastos=moves.filter(x=>x.tipo==='gasto').reduce((a,b)=>a+Number(b.monto||0),0)
    return {paid,special,pending,overdue,ingresos,gastos,saldo:ingresos-gastos}
  },[dues,moves])

  async function registerPayment(profile, form){
    if(!Number(form.monto) || Number(form.monto) <= 0){
      setMsg('Ingresá el importe real que pagó el alumno.')
      return
    }
    setBusy(true)
    const by=`${user?.nombre||''} ${user?.apellido||''}`.trim()||'Tesorería PR'
    const {error}=await supabase.rpc('pr_registrar_mensualidad',{
      p_alumno_id:profile.id,p_periodo:periodo,p_monto:Number(form.monto||0),
      p_fecha_pago:today(),p_metodo:form.metodo,p_observacion:form.observacion||null,
      p_registrado_por_id:user?.id||null,p_registrado_por_nombre:by
    })
    if(error)setMsg(error.message);else{setMsg('✓ Pago registrado y alumno habilitado');setSelected(null);await load()}
    setBusy(false)
  }

  async function special(profile,estado,gracia_hasta=null){
    setBusy(true)
    const by=`${user?.nombre||''} ${user?.apellido||''}`.trim()||'Tesorería PR'
    const {error}=await supabase.rpc('pr_marcar_mensualidad_especial',{
      p_alumno_id:profile.id,p_periodo:periodo,p_estado:estado,p_gracia_hasta:gracia_hasta,
      p_observacion:estado==='bonificado'?'Bonificación PR':'Acuerdo de pago',
      p_registrado_por_id:user?.id||null,p_registrado_por_nombre:by
    })
    if(error)setMsg(error.message);else{setMsg('✓ Estado actualizado');setSelected(null);await load()}
    setBusy(false)
  }

  async function updateStudent(profile, updates){
    setBusy(true)
    const {error}=await supabase.from('profiles').update(updates).eq('id',profile.id)
    if(error)setMsg('No se pudo actualizar el perfil: '+error.message)
    else{setMsg('✓ Perfil actualizado');setSelected(null);await load()}
    setBusy(false)
  }

  async function pauseStudent(profile){
    await updateStudent(profile,{estado:'Pausado'})
  }

  async function resumeStudent(profile){
    await updateStudent(profile,{estado:'Activo'})
  }

  async function addExpense(form){
    const by=`${user?.nombre||''} ${user?.apellido||''}`.trim()||'Tesorería PR'
    const {error}=await supabase.from('pr_tesoreria_movimientos').insert({
      fecha:form.fecha,tipo:'gasto',categoria:form.categoria,concepto:form.concepto,
      monto:Number(form.monto||0),metodo:form.metodo,observacion:form.observacion||null,
      registrado_por_id:user?.id||null,registrado_por_nombre:by
    })
    if(error)setMsg(error.message);else{setExpenseOpen(false);setMsg('✓ Gasto registrado');await load()}
  }

  async function sendReminders(){
    setBusy(true); setMsg('Enviando recordatorios…')
    const {data,error}=await supabase.functions.invoke('pr-tesoreria-recordatorios',{body:{periodo}})
    if(error) setMsg('No se pudieron enviar: '+error.message)
    else setMsg(`✓ Recordatorios enviados: ${data?.sent||0} · omitidos: ${data?.skipped||0}`)
    setBusy(false)
  }

  async function sendTest(){
    setBusy(true);setMsg('Enviando prueba…')
    const {data,error}=await supabase.functions.invoke('pr-tesoreria-recordatorios',{body:{periodo,modo_prueba:true}})
    if(error)setMsg('No se pudo enviar la prueba: '+error.message)
    else if(!data?.test)setMsg('La función respondió, pero no confirmó el modo de prueba.')
    else setMsg('✓ Prueba enviada a '+(data?.recipient||'tu email de administrador'))
    setBusy(false)
  }

  async function toggleEnforcement(){
    if(!isAdmin)return
    const {error}=await supabase.from('pr_tesoreria_config').update({enforcement_enabled:!config.enforcement_enabled,updated_at:new Date().toISOString()}).eq('id',1)
    if(error)setMsg(error.message);else await load()
  }

  return <main className="min-h-screen bg-[#070707] text-white pb-16">
    <div className="sticky top-0 z-40 border-b border-white/10 bg-[#090909]/95 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
        <button onClick={()=>navigate(-1)} className="rounded-2xl border border-white/10 px-3 py-2 text-sm">← Volver</button>
        <div className="text-center"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">PUNTA ROLLERS</p><h1 className="text-xl font-black">PR Tesorería</h1></div>
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 px-3 py-2 text-[10px] font-black text-emerald-300">SEGURO</div>
      </div>
    </div>

    <div className="mx-auto max-w-6xl px-4 pt-5 space-y-5">
      {msg&&<div className="rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm">{msg}</div>}

      <section className="overflow-hidden rounded-[30px] border border-orange-400/20 bg-gradient-to-br from-[#28130a] via-[#111] to-[#080808] p-5 sm:p-7">
        <p className="text-[10px] font-black tracking-[.22em] text-orange-300">CONTROL MENSUAL</p>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div><h2 className="text-4xl sm:text-5xl font-black tracking-tight capitalize">{monthLabel(periodo)}</h2><p className="mt-2 text-sm text-white/50">Último día de pago: <b className="text-white">10 de cada mes</b>. Pagás el mes, no 31 días.</p></div>
          <input type="month" value={periodo.slice(0,7)} onChange={e=>setPeriodo(e.target.value+'-01')} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-bold"/>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Pagados" value={stats.paid.length} tone="emerald"/>
        <Stat label="Pendientes" value={stats.pending.length} tone="amber"/>
        <Stat label="Vencidos" value={stats.overdue.length} tone="red"/>
        <Stat label="Acuerdos/bonif." value={stats.special.length} tone="violet"/>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <Money label="Ingresos del mes" value={stats.ingresos}/>
        <Money label="Gastos del mes" value={stats.gastos}/>
        <Money label="Saldo operativo" value={stats.saldo} strong/>
      </section>

      <section className="rounded-[26px] border border-white/10 bg-white/[.035] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar alumno o teléfono…" className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"/>
          <button disabled={busy} onClick={sendTest} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200 px-4 py-3 font-black">🧪 Enviar prueba</button><button disabled={busy} onClick={sendReminders} className="rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-200 px-4 py-3 font-black">✉ Recordatorios</button><button onClick={()=>setExpenseOpen(true)} className="rounded-2xl bg-white text-black px-4 py-3 font-black">+ Registrar gasto</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {['todos','pagado','pendiente','vencido','acuerdo','bonificado','pausado'].map(x=><button key={x} onClick={()=>setFilter(x)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black border ${filter===x?'bg-orange-500 text-black border-orange-400':'border-white/10 text-white/45'}`}>{x.toUpperCase()}</button>)}
        </div>
      </section>

      <section className="space-y-3">
        {shown.map(({due,...p})=>{
          const [lab,cls]=statusMeta(due,p)
          return <article key={p.id} className="rounded-[26px] border border-white/10 bg-[#111] p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white/5 grid place-items-center">{p.foto?<img src={p.foto} className="h-full w-full object-cover"/>:'👤'}</div>
              <div className="min-w-0 flex-1"><p className="font-black truncate">{p.nombre} {p.apellido||''}</p><p className="text-xs text-white/35">{p.telefono||'Sin teléfono'}</p><p className={`mt-1 text-[10px] font-black ${p.email?'text-emerald-300':'text-amber-300'}`}>{p.email?'Email OK':'Sin email'}</p></div>
              <span className={`rounded-full border px-3 py-1 text-[9px] font-black ${cls}`}>{lab}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Mini label="Cuota" value={due?.estado==='pagado' ? money(due?.monto) : 'Definir monto'}/>
              <Mini label="Vence" value={due?.vencimiento?new Date(due.vencimiento+'T12:00:00').toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit'}):'10'}/>
              <Mini label="Pago" value={due?.fecha_pago?new Date(due.fecha_pago+'T12:00:00').toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit'}):'—'}/>
            </div>
            <button onClick={()=>setSelected({profile:p,due})} className="mt-3 w-full rounded-2xl bg-orange-500 py-3 font-black text-black">{due?.estado==='pagado'?'Ver / corregir':'Gestionar pago'}</button>
          </article>
        })}
      </section>

      <section className="rounded-[26px] border border-white/10 bg-white/[.03] p-5">
        <h3 className="font-black text-xl">Regla de acceso</h3>
        <p className="mt-2 text-sm text-white/45">El sistema está preparado para limitar el área privada desde el día 11 si la mensualidad sigue pendiente. Para evitar bloquear alumnos antes de conciliar este mes, la activación se controla desde acá.</p>
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-black/25 p-4">
          <div><p className="font-black">{config?.enforcement_enabled?'Modo limitado ACTIVO':'Modo limitado PAUSADO'}</p><p className="text-xs text-white/35">{config?.enforcement_enabled?'Se aplica la regla del día 11.':'Primero conciliá los pagos del mes.'}</p></div>
          {isAdmin&&<button onClick={toggleEnforcement} className={`rounded-2xl px-4 py-3 text-xs font-black ${config?.enforcement_enabled?'bg-red-500':'bg-emerald-500 text-black'}`}>{config?.enforcement_enabled?'Pausar':'Activar'}</button>}
        </div>
      </section>
    </div>

    {selected&&<PaymentSheet item={selected} config={config} busy={busy} onClose={()=>setSelected(null)} onPay={registerPayment} onSpecial={special} onUpdate={updateStudent} onPause={pauseStudent} onResume={resumeStudent}/>} 
    {expenseOpen&&<ExpenseSheet onClose={()=>setExpenseOpen(false)} onSave={addExpense}/>}
  </main>
}

function Stat({label,value,tone}){const c={emerald:'text-emerald-300',amber:'text-amber-200',red:'text-red-300',violet:'text-violet-300'}[tone];return <div className="rounded-[24px] border border-white/10 bg-white/[.035] p-4"><p className={`text-3xl font-black ${c}`}>{value}</p><p className="mt-1 text-[10px] font-black tracking-[.14em] text-white/35">{label.toUpperCase()}</p></div>}
function Money({label,value,strong}){return <div className={`rounded-[24px] border p-4 ${strong?'border-orange-400/20 bg-orange-500/10':'border-white/10 bg-white/[.035]'}`}><p className="text-xs text-white/35">{label}</p><p className="mt-1 text-2xl font-black">{money(value)}</p></div>}
function Mini({label,value}){return <div className="rounded-2xl bg-white/[.04] p-3"><p className="text-[9px] text-white/30 uppercase">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>}

function PaymentSheet({item,config,busy,onClose,onPay,onSpecial,onUpdate,onPause,onResume}){
 const [monto,setMonto]=useState(item.due?.estado==='pagado' && item.due?.monto ? item.due.monto : '')
 const [metodo,setMetodo]=useState('Transferencia Claudio')
 const [observacion,setObservacion]=useState('')
 const [gracia,setGracia]=useState('')
 const [email,setEmail]=useState(item.profile.email||'')
 const [telefono,setTelefono]=useState(item.profile.telefono||'')
 const paused=String(item.profile.estado||'').toLowerCase()==='pausado'
 return <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 flex items-end justify-center">
  <div className="w-full max-w-xl rounded-[30px] border border-white/10 bg-[#111] p-5 max-h-[90vh] overflow-y-auto">
   <div className="flex justify-between gap-3"><div><p className="text-[10px] text-orange-300 font-black tracking-[.15em]">REGISTRAR / GESTIONAR</p><h3 className="text-2xl font-black mt-1">{item.profile.nombre} {item.profile.apellido||''}</h3></div><button onClick={onClose}>✕</button></div>
   <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 mt-4 text-xs text-orange-100">El importe no es fijo. Ingresá el monto real de este alumno según su cuota, descuento o modalidad.</div>
   <Field label="Importe"><input type="number" inputMode="numeric" placeholder="Ej. 1500" value={monto} onChange={e=>setMonto(e.target.value)}/></Field>
   <p className="mt-2 text-[11px] text-white/35">Al confirmar, el sistema registra automáticamente la fecha de hoy. La cuota corresponde al mes seleccionado.</p>
   <Field label="Método"><select value={metodo} onChange={e=>setMetodo(e.target.value)}><option>Transferencia Claudio</option><option>Transferencia Lucía</option><option>Mercado Pago</option><option>Efectivo</option><option>Otro</option></select></Field>
   <Field label="Observación"><input value={observacion} onChange={e=>setObservacion(e.target.value)} placeholder="Opcional"/></Field>
   <button disabled={busy} onClick={()=>onPay(item.profile,{monto,metodo,observacion})} className="w-full mt-4 rounded-2xl bg-emerald-500 py-4 text-black font-black">✓ CONFIRMAR PAGO DEL MES</button>
   <div className="mt-5 border-t border-white/10 pt-5">
    <p className="text-xs font-black text-white/50">Datos de contacto</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Field label="WhatsApp"><input value={telefono} onChange={e=>setTelefono(e.target.value)} placeholder="Ej. 099123456"/></Field><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nombre@email.com"/></Field></div>
    <button disabled={busy} onClick={()=>onUpdate(item.profile,{telefono:telefono.trim()||null,email:email.trim()||null})} className="w-full mt-3 rounded-2xl border border-white/10 bg-white/[.06] py-3 text-xs font-black">GUARDAR CONTACTO EN SU PERFIL</button>
   </div>
   <div className="mt-5 border-t border-white/10 pt-5">
    <p className="text-xs font-black text-white/50">Asistencia</p>
    <p className="mt-1 text-xs text-white/35">Si este mes no está asistiendo, podés pausarlo. No se elimina y después podés reactivarlo.</p>
    <button disabled={busy} onClick={()=>paused?onResume(item.profile):onPause(item.profile)} className={`w-full mt-3 rounded-2xl py-3 text-xs font-black ${paused?'bg-emerald-500 text-black':'bg-white/10 text-white'}`}>{paused?'REACTIVAR ALUMNO':'MARCAR COMO NO ESTÁ ASISTIENDO'}</button>
   </div>
   <div className="mt-5 border-t border-white/10 pt-5">
    <p className="text-xs font-black text-white/50">Excepciones</p>
    <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>onSpecial(item.profile,'bonificado')} className="rounded-2xl bg-sky-500/15 border border-sky-400/20 py-3 text-xs font-black text-sky-300">BONIFICAR MES</button><button onClick={()=>onSpecial(item.profile,'acuerdo',gracia||null)} className="rounded-2xl bg-violet-500/15 border border-violet-400/20 py-3 text-xs font-black text-violet-300">ACUERDO</button></div>
    <Field label="Gracia hasta"><input type="date" value={gracia} onChange={e=>setGracia(e.target.value)}/></Field>
   </div>
  </div>
 </div>
}
function ExpenseSheet({onClose,onSave}){
 const [f,setF]=useState({fecha:today(),categoria:'pista',concepto:'',monto:'',metodo:'Transferencia',observacion:''})
 const set=(k,v)=>setF(x=>({...x,[k]:v}))
 return <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 flex items-end justify-center"><div className="w-full max-w-xl rounded-[30px] border border-white/10 bg-[#111] p-5">
  <div className="flex justify-between"><h3 className="text-2xl font-black">Registrar gasto PR</h3><button onClick={onClose}>✕</button></div>
  <div className="grid grid-cols-2 gap-3 mt-4"><Field label="Fecha"><input type="date" value={f.fecha} onChange={e=>set('fecha',e.target.value)}/></Field><Field label="Monto"><input type="number" value={f.monto} onChange={e=>set('monto',e.target.value)}/></Field></div>
  <Field label="Categoría"><select value={f.categoria} onChange={e=>set('categoria',e.target.value)}><option value="pista">Pista</option><option value="materiales">Materiales</option><option value="uniformes">Uniformes</option><option value="eventos">Eventos</option><option value="otro">Otro</option></select></Field>
  <Field label="Concepto"><input value={f.concepto} onChange={e=>set('concepto',e.target.value)} placeholder="Ej. Alquiler pista cerrada"/></Field>
  <Field label="Método"><input value={f.metodo} onChange={e=>set('metodo',e.target.value)}/></Field>
  <button onClick={()=>onSave(f)} className="w-full mt-4 rounded-2xl bg-white py-4 text-black font-black">GUARDAR GASTO</button>
 </div></div>
}
function Field({label,children}){return <label className="block mt-3"><span className="text-[10px] font-black tracking-[.12em] text-white/35">{label.toUpperCase()}</span><div className="[&>input]:mt-1 [&>input]:w-full [&>input]:rounded-2xl [&>input]:border [&>input]:border-white/10 [&>input]:bg-black/30 [&>input]:px-4 [&>input]:py-3 [&>select]:mt-1 [&>select]:w-full [&>select]:rounded-2xl [&>select]:border [&>select]:border-white/10 [&>select]:bg-black [&>select]:px-4 [&>select]:py-3">{children}</div></label>}
