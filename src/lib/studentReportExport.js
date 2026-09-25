import { reportSheets, studentDisplayName, PERIOD_LABELS } from './studentReport'

const clean=(v)=>v==null?'':String(v)
const fileBase=(r)=>`PR_${studentDisplayName(r.profile).replace(/\s+/g,'_')}_${r.period}`.replace(/[^a-zA-Z0-9_-]/g,'_')
const escXml=(s)=>clean(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const colName=(n)=>{let s='';for(let x=n+1;x;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s}
const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}

function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function u16(n){return[n&255,(n>>>8)&255]}function u32(n){return[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function zipStore(files){const enc=new TextEncoder(),chunks=[],central=[];let offset=0;for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);const local=new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),0,0]);chunks.push(local,name,data);const cent=new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),0,0,0,0,0,0,0,0,0,0,...u32(offset)]);central.push(cent,name);offset+=local.length+name.length+data.length}const centralSize=central.reduce((s,x)=>s+x.length,0),end=new Uint8Array([80,75,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),0,0]);return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}

function sheetXml(rows){
  const maxCols=Math.max(1,...rows.map(r=>r.length))
  const widths=Array.from({length:maxCols},(_,ci)=>{
    const max=Math.max(8,...rows.slice(0,250).map(r=>clean(r[ci]).length))
    return Math.min(42,Math.max(10,max+2))
  })
  const xmlRows=rows.map((r,ri)=>`<row r="${ri+1}">${r.map((v,ci)=>{const ref=`${colName(ci)}${ri+1}`;if(typeof v==='number'&&Number.isFinite(v))return`<c r="${ref}"><v>${v}</v></c>`;return`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`}).join('')}</row>`).join('')
  const cols=`<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
  const endRef=`${colName(maxCols-1)}${Math.max(1,rows.length)}`
  return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${xmlRows}</sheetData><autoFilter ref="A1:${endRef}"/></worksheet>`
}

export async function exportStudentExcel(report){
  const entries=Object.entries(reportSheets(report))
  const files=[
    {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${entries.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
    {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${entries.map(([name],i)=>`<sheet name="${escXml(name.slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`},
    {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`},
    ...entries.map(([,rows],i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXml(rows)}))
  ]
  download(zipStore(files),`${fileBase(report)}.xlsx`)
}

const ascii=(s)=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ')
const pdfEsc=(s)=>ascii(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')
function wrap(text,max=92){const words=ascii(text).split(/\s+/).filter(Boolean),out=[];let line='';for(const w of words){if((line+' '+w).trim().length>max){if(line)out.push(line);line=w}else line=(line+' '+w).trim()}if(line)out.push(line);return out.length?out:['']}

function makePdfPages(blocks){
  const pages=[];let page=[];let used=0
  const maxUnits=49
  const push=(line)=>{const units=line.gap?line.gap:1;if(used+units>maxUnits){pages.push(page);page=[];used=0}page.push(line);used+=units}
  blocks.forEach(block=>{
    if(block.section){if(used>0)push({text:'',gap:1});push({text:block.section,bold:true,size:12,gap:1.4})}
    ;(block.lines||[]).forEach(line=>{
      const data=typeof line==='string'?{text:line}:line
      wrap(data.text,data.max||92).forEach((text,index)=>push({...data,text,gap:index===0?(data.gap||1):1}))
    })
  })
  if(page.length||!pages.length)pages.push(page)
  return pages
}

function buildPdf(blocks,meta={}){
  const pages=makePdfPages(blocks),objs=[]
  objs[1]='<< /Type /Catalog /Pages 2 0 R >>'
  objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  const pageIds=[],contentIds=[];let id=5
  pages.forEach(()=>{pageIds.push(id++);contentIds.push(id++)})
  objs[2]=`<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(x=>x+' 0 R').join(' ')}] >>`
  pages.forEach((lines,idx)=>{
    const cmds=[
      'BT','/F2 15 Tf','48 806 Td',`(${pdfEsc(meta.title||'PUNTA ROLLERS')}) Tj`,
      '/F1 8 Tf','0 -14 Td',`(${pdfEsc(meta.subtitle||'Ficha Deportiva PR')}) Tj`,
      '/F1 7 Tf','440 0 Td',`(${idx+1}/${pages.length}) Tj`,'-440 0 Td','0 -18 Td'
    ]
    let currentFont='F1',currentSize=9
    lines.forEach(line=>{
      const font=line.bold?'F2':'F1',size=line.size||9
      if(font!==currentFont||size!==currentSize){cmds.push(`/${font} ${size} Tf`);currentFont=font;currentSize=size}
      cmds.push(`0 -${Math.round(13*(line.gap||1))} Td`,`(${pdfEsc(line.text)}) Tj`)
    })
    cmds.push('ET')
    const stream=cmds.join('\n'),pageId=pageIds[idx],contentId=contentIds[idx]
    objs[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    objs[contentId]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })
  let pdf='%PDF-1.4\n',offsets=[0]
  for(let i=1;i<objs.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`}
  const xref=pdf.length
  pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`
  for(let i=1;i<objs.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n'
  pdf+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf],{type:'application/pdf'})
}

const duration=(seconds)=>{const s=Math.max(0,Number(seconds)||0),h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?`${h} h ${m} min`:`${m} min`}
const metric=(v,d=1)=>v==null?'No disponible':Number(v).toLocaleString('es-UY',{maximumFractionDigits:d})

export async function exportStudentPdf(report){
  const s=report.summary||{},p=report.profile||{},name=studentDisplayName(p),period=report.periodLabel||PERIOD_LABELS[report.period]||report.period
  const groups=(p.grupos_info||[]).map(g=>g?.titulo||g?.nombre||g).filter(Boolean).join(' · ')
  const blocks=[
    {section:'PERFIL',lines:[
      {text:name,bold:true,size:13},
      `Periodo: ${period} | Generado: ${new Date(report.generatedAt).toLocaleDateString('es-UY')}`,
      `Ciudad: ${p.ciudad||'--'} | Grupos: ${groups||'--'}`,
    ]},
    {section:'RESUMEN DEPORTIVO',lines:[
      `${s.activities||0} actividades inline | ${metric(s.km)} km | ${duration(s.movingSeconds)} en movimiento`,
      `Desnivel: ${metric(s.elevationMeters,0)} m | Vel. media: ${metric(s.avgSpeedKmh)} km/h | Mejor media: ${metric(s.bestAvgSpeedKmh)} km/h`,
      `Vel. maxima: ${metric(s.maxSpeedKmh)} km/h | Actividad mas larga: ${metric(s.longestKm)} km`,
      `FC media: ${metric(s.avgHeartRate,0)} ppm | FC maxima: ${metric(s.maxHeartRate,0)} ppm | Sesiones con FC: ${s.heartRateActivities||0}`,
      `Cadencia media: ${metric(s.avgCadence)} | Esfuerzo medio: ${metric(s.avgEffort)} | Calorias: ${s.calories==null?'No disponible':metric(s.calories,0)}`,
      `Deberes completados: ${s.tasksCompleted||0} | Clases realizadas: ${s.classesDone||0}`,
    ]},
    {section:'ACTIVIDADES STRAVA · PATINAJE INLINE',lines:report.activities.map(a=>{
      const extras=[
        a.desnivel_metros!=null?`+${metric(a.desnivel_metros,0)} m`:null,
        a.frecuencia_cardiaca_media!=null?`FC ${metric(a.frecuencia_cardiaca_media,0)}`:null,
        a.calorias!=null?`${metric(a.calorias,0)} kcal`:null,
      ].filter(Boolean).join(' | ')
      return `${a.fecha_inicio?new Date(a.fecha_inicio).toLocaleDateString('es-UY'):''} | ${a.nombre||'Patinaje'} | ${metric((Number(a.distancia_metros)||0)/1000)} km | ${duration(a.tiempo_movimiento_segundos)} | ${a.velocidad_media_ms==null?'vel. --':metric(Number(a.velocidad_media_ms)*3.6)+' km/h'}${extras?' | '+extras:''}`
    })},
    {section:'DEBERES',lines:report.trainingResults.length?report.trainingResults.map(r=>`${r.pr_training_tasks?.title||'Deber PR'} | ${r.pr_training_tasks?.category||'--'} | ${r.status||'Pendiente'}`):['Sin deberes registrados en este periodo.']},
    {section:'TOMAS DE TIEMPO',lines:report.takes.length?report.takes.map(t=>`${t.fecha||''} | Toma ${t.numero_toma||'--'} | ${t.distancia_km??'--'} km | ${t.tiempo_segundos??'--'} s${t.devolucion?' | '+t.devolucion:''}`):['Sin tomas registradas en este periodo.']},
    {section:'OBJETIVOS',lines:report.goals.length?report.goals.map(g=>`${g.titulo||'Objetivo'} | ${g.distancia_km??'--'} km | objetivo ${g.tiempo_objetivo_segundos??'--'} s | ${g.estado||'--'}${g.fecha_limite?' | limite '+g.fecha_limite:''}${g.indicacion?' | '+g.indicacion:''}`):['Sin objetivos registrados en este periodo.']},
    {section:'ASISTENCIA',lines:report.reservations.length?report.reservations.map(r=>`${r.pr_personal_disponibilidad?.fecha||r.fecha_reserva||''} | ${r.estado||'Reserva'} | ${r.pr_personal_disponibilidad?.hora_inicio||'--'}-${r.pr_personal_disponibilidad?.hora_fin||'--'}`):['Sin clases/reservas registradas en este periodo.']},
    {section:'OBSERVACIONES DEL PROFESOR',lines:report.notes.length?report.notes.map(n=>`${n.created_at?new Date(n.created_at).toLocaleDateString('es-UY'):''} | ${n.body||''}`):['Sin observaciones registradas en este periodo.']},
  ]
  download(buildPdf(blocks,{title:'PUNTA ROLLERS',subtitle:`Ficha Deportiva PR · ${name}`}),`${fileBase(report)}.pdf`)
}
