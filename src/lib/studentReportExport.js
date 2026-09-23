import { reportSheets } from './studentReport'

const clean=(v)=>v==null?'':String(v)
const fileBase=(r)=>`PR_${[r.profile?.nombre,r.profile?.apellido].filter(Boolean).join('_')||'Alumno'}_${r.period}`.replace(/[^a-zA-Z0-9_-]/g,'_')
export async function exportStudentExcel(report){
 const XLSX=await import('xlsx'),wb=XLSX.utils.book_new(),sheets=reportSheets(report)
 Object.entries(sheets).forEach(([name,rows])=>{const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=(rows[0]||[]).map((_,i)=>({wch:Math.min(42,Math.max(12,...rows.slice(0,100).map(r=>clean(r[i]).length+2)))}));XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31))})
 XLSX.writeFile(wb,`${fileBase(report)}.xlsx`)
}
export async function exportStudentPdf(report){
 const [{jsPDF},autoTableModule]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);const autoTable=autoTableModule.default;const doc=new jsPDF({unit:'mm',format:'a4'}),p=report.profile||{},s=report.summary||{},name=[p.nombre,p.apellido].filter(Boolean).join(' ')||'Alumno PR';let y=18
 const title=(t)=>{if(y>270){doc.addPage();y=18}doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(t,14,y);y+=6}
 doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text('PUNTA ROLLERS',14,y);y+=8;doc.setFontSize(15);doc.text('Ficha Deportiva PR',14,y);y+=7;doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(`${name} · Período: ${report.period} · Generado: ${new Date(report.generatedAt).toLocaleDateString('es-UY')}`,14,y);y+=10
 title('Resumen');autoTable(doc,{startY:y,theme:'grid',head:[['Métrica','Valor']],body:[['Actividades inline',s.activities],['Kilómetros',Number(s.km||0).toFixed(1)],['Tiempo en movimiento',`${Math.floor((s.movingSeconds||0)/3600)} h ${Math.floor(((s.movingSeconds||0)%3600)/60)} min`],['Desnivel',`${Math.round(s.elevationMeters||0)} m`],['Velocidad media',s.avgSpeedKmh==null?'No disponible':`${s.avgSpeedKmh.toFixed(1)} km/h`],['Velocidad máxima',s.maxSpeedKmh==null?'No disponible':`${s.maxSpeedKmh.toFixed(1)} km/h`],['Calorías',s.calories??'No disponible'],['Deberes completados',s.tasksCompleted],['Clases realizadas',s.classesDone]],styles:{fontSize:8}});y=doc.lastAutoTable.finalY+9
 title('Actividades Strava · patinaje en línea');autoTable(doc,{startY:y,theme:'striped',head:[['Fecha','Actividad','Km','Tiempo','Vel. media','Desnivel']],body:report.activities.map(a=>[a.fecha_inicio?new Date(a.fecha_inicio).toLocaleDateString('es-UY'):'',a.nombre||'Patinaje',((a.distancia_metros||0)/1000).toFixed(1),`${Math.round((a.tiempo_movimiento_segundos||0)/60)} min`,a.velocidad_media_ms==null?'—':`${(a.velocidad_media_ms*3.6).toFixed(1)} km/h`,a.desnivel_metros==null?'—':`${Math.round(a.desnivel_metros)} m`]),styles:{fontSize:7},headStyles:{fontStyle:'bold'}});y=doc.lastAutoTable.finalY+9
 title('Deberes');autoTable(doc,{startY:y,theme:'grid',head:[['Deber','Categoría','Estado','Completado']],body:report.trainingResults.map(r=>[r.pr_training_tasks?.title||'Deber PR',r.pr_training_tasks?.category||'',r.status||'',r.completed_at?new Date(r.completed_at).toLocaleDateString('es-UY'):'']),styles:{fontSize:7}});y=doc.lastAutoTable.finalY+9
 title('Tomas de tiempo');autoTable(doc,{startY:y,theme:'grid',head:[['Fecha','Distancia','Tiempo','Origen']],body:report.takes.map(t=>[t.fecha||'',t.distancia_km==null?'—':`${t.distancia_km} km`,t.tiempo_segundos==null?'—':`${t.tiempo_segundos} s`,t.origen||'']),styles:{fontSize:7}});y=doc.lastAutoTable.finalY+9
 title('Objetivos');autoTable(doc,{startY:y,theme:'grid',head:[['Objetivo','Estado','Fecha límite','Indicación']],body:report.goals.map(g=>[g.titulo||'',g.estado||'',g.fecha_limite||'',g.indicacion||'']),styles:{fontSize:7}});y=doc.lastAutoTable.finalY+9
 title('Observaciones');autoTable(doc,{startY:y,theme:'grid',head:[['Fecha','Observación']],body:report.notes.map(n=>[n.created_at?new Date(n.created_at).toLocaleDateString('es-UY'):'',n.body||'']),styles:{fontSize:7}})
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(120);doc.text(`Punta Rollers · Informe deportivo · ${i}/${pages}`,14,290)}doc.save(`${fileBase(report)}.pdf`)
}
