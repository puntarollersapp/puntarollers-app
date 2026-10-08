import { useMemo, useState } from 'react'
import { addTrainingStep, newTrainingDraft, validateTrainingDraft } from '../../lib/prTrainingModel'

const STORE_KEY = 'pr-next-training-v2-draft'
const PATH_LABEL = { BASE: 'Recorrido A · interno', CONTINUIDAD: 'Recorrido B · interno' }
const EVIDENCE_LABEL = { CONFIRMACION: 'Confirmación', FOTO: 'Foto', VIDEO: 'Video', STRAVA: 'Actividad Strava' }

export default function TrainingBuilderV2() {
  const [draft, setDraft] = useState(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null')
      return parsed && parsed.version === 2 ? parsed : newTrainingDraft()
    } catch { return newTrainingDraft() }
  })
  const [saved, setSaved] = useState('')
  const [preview, setPreview] = useState(false)
  const [notice, setNotice] = useState('')
  const current = JSON.stringify(draft)
  const errors = useMemo(() => validateTrainingDraft(draft), [current])
  const clean = saved === current
  function patch(fields) { setDraft(prev => ({ ...prev, ...fields })); setPreview(false); setNotice('') }
  function updateVariant(path, fn) {
    setDraft(prev => ({ ...prev, variants: prev.variants.map(v => v.path === path ? fn(v) : v) }))
    setPreview(false)
  }
  function updateStep(path, index, fields) {
    updateVariant(path, v => ({ ...v, steps: v.steps.map((s, i) => i === index ? { ...s, ...fields } : s) }))
  }
  function save() {
    try { window.localStorage.setItem(STORE_KEY, current); setSaved(current); setNotice('Borrador guardado en este navegador. No se publicó ni se envió a Supabase.') }
    catch { setNotice('No se pudo guardar en este dispositivo.') }
  }
  function reset() {
    if (!window.confirm('¿Descartar este borrador local?')) return
    try { window.localStorage.removeItem(STORE_KEY) } catch {}
    setDraft(newTrainingDraft()); setSaved(''); setPreview(false); setNotice('Borrador local descartado.')
  }
  return <section className="rounded-[30px] border border-emerald-300/20 bg-[#091310] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-200">PR Training 2.0 · Laboratorio</p><h2 className="mt-2 text-2xl font-black">Constructor por pasos</h2></div>
      <span className="rounded-xl border border-emerald-200/20 px-3 py-2 text-xs text-emerald-100">{clean ? 'Guardado local' : 'Cambios sin guardar'}</span>
    </div>
    <p className="mt-3 text-sm leading-6 text-white/70">Diseñá prácticas y evidencias para cada recorrido. Las variantes son internas y no se mostrarán como niveles comparativos a los alumnos. Este laboratorio no publica tareas reales.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Título<input value={draft.title} maxLength={90} onChange={e => patch({ title: e.target.value })} className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 p-3 text-base" placeholder="Nombre público de la tarea" /></label>
      <label className="text-sm">Ciclo mensual<input type="month" value={draft.cycle} onChange={e => patch({ cycle: e.target.value })} className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 p-3 text-base" /></label>
      <label className="text-sm sm:col-span-2">Objetivo<textarea value={draft.objective} maxLength={1200} onChange={e => patch({ objective: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 p-3 text-base" placeholder="Qué se busca desarrollar" /></label>
    </div>
    {draft.variants.map(variant => <div key={variant.path} className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black">{PATH_LABEL[variant.path]}</h3><label className="text-sm text-white/80">Equipo <select value={variant.equipment} onChange={e => updateVariant(variant.path, v => ({ ...v, equipment: e.target.value }))} className="ml-2 rounded-lg border border-white/20 bg-[#14231d] p-2"><option value="AMBOS">Ambos</option><option value="CON_TACO">Con taco</option><option value="SIN_TACO">Sin taco</option></select></label></div>
      {variant.steps.map((step, index) => <div key={index} className="mt-3 rounded-xl border border-white/10 p-3">
        <div className="flex items-center justify-between gap-3"><strong className="text-sm">{index + 1}. {step.kind === 'PRACTICA' ? 'Práctica' : 'Evidencia'}</strong><button type="button" onClick={() => updateVariant(variant.path, v => ({ ...v, steps: v.steps.filter((_, i) => i !== index) }))} className="rounded-lg border border-red-300/30 px-3 py-2 text-xs">Quitar</button></div>
        <textarea value={step.instructions} maxLength={1600} rows={2} onChange={e => updateStep(variant.path, index, { instructions: e.target.value })} placeholder="Instrucciones claras para este paso" className="mt-3 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-sm" />
        {step.kind === 'EVIDENCIA' && <label className="mt-2 block text-sm">Tipo de evidencia <select value={step.evidence} onChange={e => updateStep(variant.path, index, { evidence: e.target.value })} className="ml-2 rounded-lg border border-white/20 bg-[#14231d] p-2">{Object.entries(EVIDENCE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
      </div>)}
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setDraft(prev => addTrainingStep(prev, variant.path, 'PRACTICA'))} className="rounded-xl border border-emerald-300/40 px-4 py-3 text-sm font-bold">+ Práctica</button><button type="button" onClick={() => setDraft(prev => addTrainingStep(prev, variant.path, 'EVIDENCIA'))} className="rounded-xl border border-cyan-300/40 px-4 py-3 text-sm font-bold">+ Evidencia</button></div>
    </div>)}
    <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={save} className="rounded-xl bg-emerald-200 px-5 py-3 text-sm font-black text-black">Guardar borrador</button><button type="button" disabled={errors.length > 0} onClick={() => setPreview(true)} className="rounded-xl border border-white/20 px-5 py-3 text-sm disabled:opacity-30">Previsualizar</button><button type="button" onClick={reset} className="rounded-xl border border-white/20 px-5 py-3 text-sm">Descartar</button></div>
    {errors.length > 0 && <div className="mt-4 rounded-xl border border-amber-200/20 p-4"><p className="text-sm font-bold">Para previsualizar:</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>}
    <p role="status" aria-live="polite" className="mt-3 text-sm text-emerald-100">{notice}</p>
    {preview && errors.length === 0 && <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-black/30 p-4"><p className="text-xs font-bold text-emerald-200">VISTA PREVIA · NO PUBLICADA</p><h3 className="mt-2 text-xl font-black">{draft.title}</h3><p className="mt-2 text-sm text-white/70">{draft.objective}</p>{draft.variants.map(v => <div key={v.path} className="mt-4"><p className="text-sm font-bold">{PATH_LABEL[v.path]}</p>{v.steps.map((s, i) => <p key={i} className="mt-2 text-sm text-white/80">{i + 1}. {s.kind === 'PRACTICA' ? 'Práctica' : 'Evidencia'}: {s.instructions}</p>)}</div>)}</div>}
  </section>
}
