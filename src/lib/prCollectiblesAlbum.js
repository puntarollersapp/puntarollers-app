import {PR_COLLECTIBLES_CATALOG} from './prCollectiblesCatalog'
import {getBadgeImage,normalizeBadgeTitle} from './badges'
import {frontFor,officialBack,visualRarity} from './prCollectiblesArt'
const tones={common:['plata','#c9d3de'],holo:['holo','#56e7d2'],epic:['oro','#f4c965'],legendary:['prisma','#ad8aff'],limited:['navidad','#ff6196']}
const escapeXml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const motifs={
 attendance:'M100 68v90h90V68z M100 94h90 M120 60v20 M170 60v20 M124 125l15 15 28-31',
 attendance_outdoor:'M65 154l55-75 40 45 27-29 48 59 M74 68a21 21 0 1 0 42 0 21 21 0 1 0-42 0',
 attendance_indoor:'M65 150l35-74h100l35 74z M80 136h140 M150 76v74 M100 101h100',
 distance_total:'M72 143c20-96 136 46 156-50 M72 143l0-26m0 26h26 M228 93v26m0-26h-26',
 distance_single:'M55 132h190 M75 108h95 M100 84h105 M195 72l45 60-45 34',
 weekly_streak:'M150 45c12 41 49 48 49 86a49 49 0 1 1-98 0c0-22 20-36 24-53 3 15 14 22 25 23 8-16 5-37 0-56z',
 duties_total:'M99 65h102v112H99z M114 92h72 M114 118h72 M114 145h45 M173 140l11 11 24-26',
 duties_full_months:'M90 70h120v100H90z M90 96h120 M115 60v25 M185 60v25 M119 130l22 20 42-43',
 verified_group_outings:'M68 150l42-83 40 83 M150 150l42-83 40 83 M95 125h110',
 clinics:'M65 87l85-37 85 37-85 37z M91 100v44c35 25 83 25 118 0v-44 M235 90v63',
 verified_events:'M67 80h166v82H67z M67 108h166 M150 80v82 M103 124h24 M174 124h24',
 verified_event:'M69 71h162v93H69z M93 87h114 M93 148h114 M150 90l8 23 25 2-19 16 6 23-20-13-20 13 6-23-19-16 25-2z',
 manual_event:'M150 49l15 42 45 1-36 28 13 43-37-26-37 26 13-43-36-28 45-1z',
 badge:'M150 50l50 30v60l-50 30-50-30V80z M125 109l17 18 36-39'
}
export function collectibleArtwork(c){
 const [_,tone]=tones[c.rarity]||tones.common
 const rule=c.rule, metric=rule.target?String(rule.target):String(c.number).padStart(3,'0')
 const category=rule.type.replace('badge_or_','')
 const shape=motifs[category]||motifs.badge
 const angle=(c.number*19)%360
 const rings=Array.from({length:5},(_,i)=>'<circle cx="150" cy="118" r="'+(46+i*14)+'" fill="none" stroke="'+tone+'" stroke-opacity="'+(.12-i*.015)+'" stroke-dasharray="'+(8+c.number%12)+' '+(5+i*2)+'"/>').join('')
 const lines=Array.from({length:12},(_,i)=>'<path d="M-50 '+(i*19)+' L350 '+(i*19+160)+'" stroke="'+tone+'" opacity=".08"/>').join('')
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 235"><defs><radialGradient id="bg"><stop stop-color="'+tone+'" stop-opacity=".45"/><stop offset="1" stop-color="#0c0d15"/></radialGradient><linearGradient id="metal" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="'+tone+'"/><stop offset="1" stop-color="#525b73"/></linearGradient></defs><rect width="300" height="235" fill="url(#bg)"/><g transform="rotate('+angle+' 150 118)">'+lines+rings+'</g><path d="'+shape+'" stroke="#000" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" fill="none" opacity=".55" transform="translate(0 3)"/><path d="'+shape+'" stroke="url(#metal)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" fill="none"/><rect x="12" y="12" width="276" height="211" rx="13" fill="none" stroke="'+tone+'" stroke-opacity=".38"/><text x="24" y="32" fill="'+tone+'" font-size="9" font-weight="800" font-family="monospace" letter-spacing="2">PR / '+escapeXml(c.code)+'</text><text x="276" y="205" text-anchor="end" fill="#fff" font-size="25" font-family="sans-serif" font-weight="900">'+escapeXml(metric)+'</text></svg>'
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)
}
export function ruleDescription(c){
 const r=c.rule,t=r.target
 if(r.type==='badge')return 'Otorgada mediante un reconocimiento oficial de Punta Rollers.'
 if(r.type.includes('distance'))return r.type.includes('single')?'Registrá '+t+' km en una salida válida.':'Acumulá '+t+' km de patinaje registrado.'
 if(r.type==='attendance')return 'Registrá '+t+' asistencias verificadas.'
 if(r.type==='attendance_outdoor')return 'Asistí a una clase al aire libre.'
 if(r.type==='attendance_indoor')return 'Asistí a una clase en pista.'
 if(r.type==='weekly_streak')return 'Mantené '+t+' semanas consecutivas de constancia.'
 if(r.type==='duties_total')return 'Completá un deber aprobado.'
 if(r.type==='duties_full_months')return 'Completá todos los deberes de '+t+(t===1?' mes.':' meses.')
 if(r.type.includes('clinics'))return 'Participá en '+t+(t===1?' clínica verificada.':' clínicas verificadas.')
 return 'Participación verificada por el equipo PR.'
}
export function buildCollectibles({badges=[],grants=[],metrics={},previewEligible=[]}){
 const bmap=new Map(badges.map(b=>[normalizeBadgeTitle(b.titulo),b]))
 const gmap=new Map(grants.map(g=>[g.card_code,g]))
 return PR_COLLECTIBLES_CATALOG.map(c=>{
  const rule=c.rule, badge=(rule.aliases||[]).map(s=>bmap.get(normalizeBadgeTitle(s))).find(Boolean),g=gmap.get(c.code)
  const value=metrics[rule.type.replace('badge_or_','')]
  // Before launch the administrator can preview eligible cards without persisting grants.
  const earned=Boolean(badge||g||previewEligible.includes(c.number))
  const frontArt=frontFor(c.code),upcoming=!frontArt
  const locked=!earned||upcoming
  const rarity=visualRarity(c)
  const art=badge&&getBadgeImage(badge.titulo)||collectibleArtwork(c)
  return {...c,id:c.code,number:c.number,total:50,source:c.rarity,rarity,category:rarity,locked,earned,upcoming,frontArt,backArt:officialBack,
   subtitle:c.countsTowardMain?'Colección 001':'Edición limitada',art,description:g?.reason||badge?.descripcion||ruleDescription(c),date:badge?.fecha||g?.granted_at,by:badge?.creado_por_nombre||'',progress:typeof value==='number'&&rule.target?Math.min(1,value/rule.target):null,progressValue:value,progressTarget:rule.target}
 })
}
