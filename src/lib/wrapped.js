// PR Wrapped 2026: presentation of server-returned aggregates only.
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const fmt=(v,d=0)=>Number(v).toLocaleString('es-UY',{maximumFractionDigits:d});
const positive=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>0;
export function personality(d){
 if(d.performance?.distances?.some(x=>x.count>1&&x.timeReductionPct>0))return 'Roller en evolución';
 if(d.shifter?.completed>=5)return 'Espíritu competitivo';
 if(d.frames?.frames>=3)return 'Coleccionista de logros';
 if(d.activity?.km>=100)return 'Máquina de kilómetros';
 if(positive(d.activity?.km))return 'Explorador sobre ruedas';
 return 'El comienzo de algo grande';
}
const tracks={
 'Roller en evolución':['Harder, Better, Faster, Stronger','Daft Punk','1KE9mE3nrYM9ZtUTZpcxSt','Porque cada intento cuenta.'],
 'Espíritu competitivo':["Don’t Stop Me Now",'Queen','0p24EtuK24h0puuFcF0fdC','Una canción para las ganas de ir por más.'],
 'Coleccionista de logros':['The Nights','Avicii','5q3WmXzOGexzRsl2MMqhfx','Para guardar momentos que valen la pena.'],
 'Máquina de kilómetros':['The Nights','Avicii','5q3WmXzOGexzRsl2MMqhfx','Para salir a sumar nuevas historias.'],
 'Explorador sobre ruedas':['Send Me On My Way','Rusted Root','28ZcNpDof0Lnl0doY1E9s0','Para perderse en una buena rodada.'],
 'El comienzo de algo grande':["Don’t Stop Believin’",'Journey','1sbBhiEnhgUrAe6xm3fzGO','Todo gran recorrido empieza con un paso.']
};
const song=(a)=>({title:a[0],artist:a[1],url:'https://open.spotify.com/track/'+a[2],description:a[3]});
const jokeBank=[
 {id:'rotate',big:'Tus ruedas te piden un favor.',small:'En 2027, rotalas de vez en cuando. ¡Siempre las mismas terminan haciendo el trabajo pesado!',icon:'wheel'},
 {id:'vacation',big:'Tus patines quieren vacaciones.',small:'El problema es que, cada vez que decís «una vueltita más», les cancelás los planes.',icon:'skate'},
 {id:'new-wheels',big:'Tus patines ya hicieron su carta a Papá Noel.',small:'Pidieron ruedas nuevas. Dicen que no es una indirecta… pero vos entendiste.',icon:'wheel'},
 {id:'bonus',big:'Tu freno quiere cobrar aguinaldo.',small:'Dice que, si tiene que trabajar en cada bajada, merece un extra a fin de año.',icon:'brake'},
 {id:'union',big:'Tus ruedas quieren formar un sindicato.',small:'Su primer reclamo es una rotación y el segundo, que dejes de decir «es la última vuelta».',icon:'wheel'},
 {id:'talk',big:'¿Podés tener una conversación sin hablar de patines?',small:'El oráculo dice que sí. Hasta que alguien menciona ruedas y terminás explicándole hasta cómo se frena en T.',icon:'skate'},
 {id:'snack',big:'Tus patines conocen tu debilidad.',small:'La mejor parte de una rodada es la excusa para ir a comer algo después. Ellos también lo saben.',icon:'skate'},
 {id:'brake',big:'Tu taco también tiene deseos para 2027.',small:'Pide que practiques otras frenadas. A veces quiere descansar y dejar que las ruedas hagan lo suyo.',icon:'brake'},
 {id:'distance',big:'Tus ruedas ya tienen historias para un libro.',small:'Con los kilómetros que registraste, podrían escribir sus memorias. El título: «Una vueltita más».',icon:'wheel',when:d=>Number(d.activity?.km)>=50},
 {id:'practice',big:'Los conos del entrenamiento te mandan saludos.',small:'Con tantos deberes aprobados, ya te consideran parte de la familia. Dicen que te esperan en 2027.',icon:'skate',when:d=>Number(d.duties?.approved)>0},
 {id:'clock',big:'El cronómetro quiere la revancha.',small:'Después de tus tomas de tiempo, se quedó pensando qué marca vas a conseguir el próximo año.',icon:'brake',when:d=>Number(d.performance?.count)>0},
 {id:'shifter',big:'Tus patines escuchan «Shifter» y se ponen nerviosos.',small:'Dicen que, cuando preparás un desafío, nunca saben cuántas vueltas les esperan.',icon:'skate',when:d=>Boolean(d.shifter?.category||d.shifter?.completed)}
];
function hash(s){let n=2166136261;for(const ch of String(s)){n=Math.imul(n^ch.charCodeAt(0),16777619)}return n>>>0}
export function humorSlides(d,seed=''){
 const key=seed||[d.year,d.name,d.lastInitial].join('|');
 const eligible=jokeBank.filter(j=>!j.when||j.when(d));
 const chosen=eligible.sort((a,b)=>hash(key+'|'+a.id)-hash(key+'|'+b.id)).slice(0,3);
 return chosen.map((j,i)=>({id:'humor-'+j.id,theme:['fucsia','ivory','dark'][i],kicker:'El oráculo roller',oracleNumber:i+1,big:j.big,small:j.small,humor:j.icon}));
}
const badgeKey=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function buildSlides(d,seed=''){
 const s=[{id:'intro',theme:'dark',kicker:'PR WRAPPED 2026',big:'TU AÑO SOBRE RUEDAS',small:d.name?d.name+', esta es tu historia.':'Esta es tu historia.'}];
 // QR attendance began late in 2026; it cannot represent the full year.
 const c=d.activity,t=d.duties,h=d.shifter,p=d.performance,f=d.frames;
 const add=(id,theme,kicker,value,unit,small,decimals=0)=>{if(positive(value))s.push({id,theme,kicker,value,unit,small,decimals})};
 add('km','dark','Cada kilómetro cuenta',c?.km,'kilómetros en Strava',c?.bestMonth?'Tu mes más fuerte: '+months[c.bestMonth-1]+'.':'',1);
 add('time','ivory','Tiempo sobre ruedas',c?.hours,'horas en movimiento',positive(c?.hours)&&c.hours>=3?'Equivale a unos '+fmt(c.hours/1.5,1)+' partidos de fútbol.':'',1);
 add('manual','dark','También quedó registrado',d.manualActivities,'actividades manuales validadas','Registro independiente; no se suma a los kilómetros de Strava.');
 add('duties','fucsia','No fue suerte. Fue entrenamiento.',t?.approved,'deberes aprobados',t?.techniques?.filter(Boolean).slice(0,4).join(' · ')||'');
 if(d.level)s.push({id:'level',theme:'ivory',kicker:'Tu progresión registrada',big:String(d.level),small:'Cada técnica es un paso más.'});
 if(h?.category||positive(h?.completed)||h?.planCompleted)s.push({id:'shifter',theme:'dark',kicker:'SHIFTER EDITION',big:h.category?'Preparación '+h.category:'Preparación Shifter',small:[positive(h.completed)?h.completed+' desafíos completados':null,h.planCompleted?'Plan de entrenamiento completado':null,'No representa un resultado oficial de carrera.'].filter(Boolean).join(' · ')});
 add('timed','fucsia','Tu mayor rival eras vos',p?.count,'tomas de tiempo','Marcas registradas durante 2026.');
 for(const x of p?.distances||[]){
  if(!positive(x.km)||!positive(x.bestSeconds))continue;
  const time=v=>{const n=Math.round(v);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
  s.push({id:'mark-'+x.km,theme:'ivory',kicker:'TU MARCA · '+fmt(x.km,2)+' KM',big:time(x.bestSeconds),small:['Mejor marca registrada.','Primera: '+time(x.firstSeconds)+'. Última: '+time(x.lastSeconds)+'.',x.count>1&&x.timeReductionPct>0?'Redujiste tu tiempo un '+fmt(x.timeReductionPct,1)+'%.':null,'Ritmo: '+time(x.bestPace)+'/km · '+fmt(x.bestSpeed,1)+' km/h.'].filter(Boolean).join(' ')});
 }
 add('goals','dark','Objetivos alcanzados',d.goals,'objetivos completados','Lo que antes parecía imposible hoy es parte de tu historia.');
 if(d.awards?.length)s.push({id:'awards',theme:'fucsia',kicker:'PR AWARDS',big:'Reconocimientos',small:d.awards.map(x=>x.category+' · '+(x.recognition==='winner'?'Premio':'Finalista')).join(' / ')});
 add('frames','ivory','Tu colección creció',f?.frames,'marcos obtenidos',f?.titles?.filter(Boolean).slice(0,4).join(' · ')||'');
 const badges=[...new Map((Array.isArray(d.badges)?d.badges:[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>[badgeKey(x),x])).values()];
 if(badges.length)s.push({id:'badges',theme:'dark',kicker:'TU COLECCIÓN PR · 2026',value:badges.length,unit:badges.length===1?'insignia obtenida':'insignias obtenidas',small:'Cada logro cuenta una parte de tu historia.',badges});
 s.push({id:'tag',theme:'dark',kicker:'TU PERSONALIDAD ROLLER',big:personality(d),small:s.length===1?'Este año te animaste a empezar. Y eso ya es un logro.':'Una historia que solo vos podés seguir escribiendo.'});
 s.push({id:'soundtrack',theme:'dark',kicker:'TU SOUNDTRACK ROLLER · 2026',song:song(tracks[personality(d)]||tracks['El comienzo de algo grande']),small:'Una recomendación elegida según tu personalidad roller, no tu historial de escucha.'});
 s.push(...humorSlides(d,seed));
 s.push({id:'believe',theme:'fucsia',kicker:'ASÍ SE SIENTEN TUS PATINES CUANDO RODÁS',song:song(['Believe','Cher','17mBmo8BfRtqRwm1R2cBVa','Porque cuando las ruedas empiezan a girar, todo se siente mejor.']),small:'El himno de todos los rollers PR.'});
 s.push({id:'outro',theme:'fucsia',kicker:'Gracias por ser parte de Punta Rollers',big:'2027: LA HISTORIA CONTINÚA',small:'Compartí tu PR Wrapped en las historias de Instagram o en tus redes. ¡Mostrale al mundo tu año sobre ruedas!',share:true});
 s.push({id:'flexion',theme:'fucsia',kicker:'Y RECORDÁ, COMO DICE CLAUDIO…',big:'¡FLEXIONEN!',small:'Por un 2027 más flexionado, con buena postura y muchísimos kilómetros felices.',humor:'flex',final:true});
 return s;
}
export function plaqueStats(d){
 const items=[[d.activity?.km,'KM EN STRAVA',1],[d.activity?.hours,'HORAS RODANDO',1],[d.duties?.approved,'DEBERES APROBADOS',0],[d.shifter?.completed,'DESAFÍOS SHIFTER',0],[d.performance?.count,'TOMAS DE TIEMPO',0],[d.frames?.frames,'MARCOS',0],[d.goals,'OBJETIVOS',0]];
 return items.filter(([v])=>positive(v)).slice(0,4).map(([v,label,precision])=>({value:fmt(v,precision),label}));
}
