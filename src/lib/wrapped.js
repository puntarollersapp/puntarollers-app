// PR Wrapped 2026: presentation of server-returned aggregates only.
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const weekdays=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
export const fmt=(v,d=0)=>Number(v).toLocaleString('es-UY',{maximumFractionDigits:d});
const positive=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>0;
export function personality(d){
 if(d.performance?.distances?.some(x=>x.count>1&&x.timeReductionPct>0))return 'Roller en evolución';
 if(d.shifter?.completed>=5)return 'Espíritu competitivo';
 if(d.frames?.frames>=3)return 'Coleccionista de logros';
 if(d.activity?.km>=100)return 'Máquina de kilómetros';
 if(d.attendance?.classes>=8)return 'Constancia sobre ruedas';
 if(positive(d.activity?.km))return 'Explorador sobre ruedas';
 return 'El comienzo de algo grande';
}
export function buildSlides(d){
 const s=[{id:'intro',theme:'dark',kicker:'PR WRAPPED 2026',big:'TU AÑO SOBRE RUEDAS',small:d.name?d.name+', esta es tu historia.':'Esta es tu historia.'}];
 const a=d.attendance,c=d.activity,t=d.duties,h=d.shifter,p=d.performance,f=d.frames;
 const add=(id,theme,kicker,value,unit,small,decimals=0)=>{if(positive(value))s.push({id,theme,kicker,value,unit,small,decimals})};
 add('classes','fucsia','Elegiste ponerte los patines',a?.classes,'clases registradas',a?.busiestMonth?('Tu mes más activo: '+months[a.busiestMonth-1]+'. Día favorito: '+weekdays[a.favoriteWeekday]+'.'):'');
 add('km','dark','Cada kilómetro cuenta',c?.km,'kilómetros en Strava',c?.bestMonth?'Tu mes más fuerte: '+months[c.bestMonth-1]+'.':'',1);
 add('time','ivory','Tiempo sobre ruedas',c?.hours,'horas en movimiento',positive(c?.hours)&&c.hours>=3?'Equivale a unos '+fmt(c.hours/1.5,1)+' partidos de fútbol.':'',1);
 add('manual','dark','También quedó registrado',d.manualActivities,'actividades manuales validadas','Registro independiente; no se suma a los kilómetros de Strava.');
 add('duties','fucsia','No fue suerte. Fue entrenamiento.',t?.approved,'deberes aprobados',t?.techniques?.filter(Boolean).slice(0,4).join(' · ')||'');
 if(d.level)s.push({id:'level',theme:'ivory',kicker:'Tu progresión registrada',big:String(d.level),small:'Cada técnica es un paso más.'});
 if(h?.category||positive(h?.completed)||h?.planCompleted)s.push({id:'shifter',theme:'dark',kicker:'SHIFTER EDITION',big:h.category?'Preparación '+h.category:'Preparación Shifter',small:[positive(h.completed)?h.completed+' desafíos completados':null,h.planCompleted?'Plan de entrenamiento completado':null,'No representa un resultado oficial de carrera.'].filter(Boolean).join(' · ')});
 add('timed','fucsia','Tu mayor rival eras vos',p?.count,'tomas de tiempo','Marcas registradas durante 2026.');
 for(const x of p?.distances||[]){
  if(!positive(x.km)||!positive(x.bestSeconds))continue;
  const time=v=>Math.floor(v/60)+':'+String(Math.round(v%60)).padStart(2,'0');
  s.push({id:'mark-'+x.km,theme:'ivory',kicker:'TU MARCA · '+fmt(x.km,2)+' KM',big:time(x.bestSeconds),small:['Mejor marca registrada.','Primera: '+time(x.firstSeconds)+'. Última: '+time(x.lastSeconds)+'.',x.count>1&&x.timeReductionPct>0?'Redujiste tu tiempo un '+fmt(x.timeReductionPct,1)+'%.':null,'Ritmo: '+time(x.bestPace)+'/km · '+fmt(x.bestSpeed,1)+' km/h.'].filter(Boolean).join(' ')});
 }
 add('goals','dark','Objetivos alcanzados',d.goals,'objetivos completados','Lo que antes parecía imposible hoy es parte de tu historia.');
 if(d.awards?.length)s.push({id:'awards',theme:'fucsia',kicker:'PR AWARDS',big:'Reconocimientos',small:d.awards.map(x=>x.category+' · '+(x.recognition==='winner'?'Premio':'Finalista')).join(' / ')});
 add('frames','ivory','Tu colección creció',f?.frames,'marcos obtenidos',f?.titles?.filter(Boolean).slice(0,4).join(' · ')||'');
 s.push({id:'tag',theme:'dark',kicker:'TU PERSONALIDAD ROLLER',big:personality(d),small:s.length===1?'Este año te animaste a empezar. Y eso ya es un logro.':'Una historia que solo vos podés seguir escribiendo.'});
 s.push({id:'outro',theme:'fucsia',kicker:'Gracias por ser parte de Punta Rollers',big:'2027: LA HISTORIA CONTINÚA',small:'Compartí tu año sobre ruedas.',final:true});
 return s;
}
export function plaqueStats(d){
 const items=[[d.attendance?.classes,'CLASES',0],[d.activity?.km,'KM EN STRAVA',1],[d.activity?.hours,'HORAS RODANDO',1],[d.duties?.approved,'DEBERES APROBADOS',0],[d.shifter?.completed,'DESAFÍOS SHIFTER',0],[d.performance?.count,'TOMAS DE TIEMPO',0],[d.frames?.frames,'MARCOS',0],[d.goals,'OBJETIVOS',0]];
 return items.filter(([v])=>positive(v)).slice(0,4).map(([v,label,precision])=>({value:fmt(v,precision),label}));
}
