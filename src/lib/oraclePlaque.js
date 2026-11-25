// Local, independent Oracle image export. No personal data or network storage.
export const ORACLE_WIDTH=1080, ORACLE_HEIGHT=1920
const palettes={fucsia:['#FF0055','#F3F1EC','#191A20'],ivory:['#F3F1EC','#191A20','#FF0055'],dark:['#191A20','#F3F1EC','#FF0055']}
export const isOracleSlide=s=>Boolean(s?.id?.startsWith('humor-')&&[1,2,3].includes(s.oracleNumber)&&s.big&&s.small&&palettes[s.theme])
export function oracleFilename(slide){
 if(!isOracleSlide(slide))throw Error('Invalid Oracle story')
 return 'PR-Oraculo-Roller-2026-0'+slide.oracleNumber+'.png'
}
const timeout=(promise,ms,fallback)=>new Promise(resolve=>{
 const timer=setTimeout(()=>resolve(fallback),ms)
 Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},()=>{clearTimeout(timer);resolve(fallback)})
})
async function getFonts(slide,doc){
 const fonts=doc.fonts
 const specs=['900 100px "Barlow Condensed"','italic 800 100px Fraunces','600 44px Inter']
 return Promise.all(specs.map(async spec=>{
  if(!fonts?.load)return false
  try{return (await timeout(fonts.load(spec,slide.big+' '+slide.small+' '+slide.kicker),4500,[])).length>0}catch{return false}
 }))
}
function getLogo(){
 return new Promise((resolve,reject)=>{
  const img=new Image()
  const finish=ok=>{clearTimeout(timer);img.onload=null;img.onerror=null;ok?resolve(img):reject(Error('Logo unavailable'))}
  const timer=setTimeout(()=>finish(false),5000)
  img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src='/logo.png'
 })
}
export function fitOracleText(ctx,text,{font,size,min=24,width,height,leading=1.1}){
 for(let px=size;px>=min;px-=2){
  ctx.font=font(px)
  const lines=[];let line=''
  for(const word of text.split(/\s+/)){
   const next=line?line+' '+word:word
   if(line&&ctx.measureText(next).width>width){lines.push(line);line=word}else line=next
  }
  if(line)lines.push(line)
  const step=px*leading
  if(lines.every(l=>ctx.measureText(l).width<=width)&&lines.length*step<=height)return {lines,px,step,font:ctx.font,height:lines.length*step}
 }
 throw Error('Oracle text does not fit')
}
export function drawOraclePlaque(ctx,slide,logo,loaded=[false,false,false]){
 if(!isOracleSlide(slide))throw Error('Invalid Oracle story')
 const [bg,fg,accent]=palettes[slide.theme],w=ORACLE_WIDTH,h=ORACLE_HEIGHT
 const serif=px=>'italic 800 '+px+'px '+(loaded[1]?'Fraunces, Georgia, serif':'Georgia, serif')
 const condensed=px=>'900 '+px+'px '+(loaded[0]?'"Barlow Condensed", Impact, sans-serif':'Impact, "Arial Narrow", sans-serif')
 const sans=px=>'600 '+px+'px '+(loaded[2]?'Inter, system-ui, sans-serif':'system-ui, sans-serif')
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h)
 const glow=ctx.createRadialGradient(950,180,0,950,180,1050);glow.addColorStop(0,accent+'45');glow.addColorStop(1,accent+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h)
 const prism=ctx.createLinearGradient(0,0,w,480);for(const [p,c] of [[0,'#FF005500'],[.26,'#FF93B74D'],[.48,'#FFF2BE62'],[.65,'#A4E8F744'],[.82,'#A58AFF33'],[1,'#FF005500']])prism.addColorStop(p,c)
 ctx.save();ctx.translate(540,130);ctx.rotate(-.16);ctx.strokeStyle=prism;ctx.lineWidth=3
 for(const y of [0,95]){ctx.beginPath();ctx.ellipse(0,y,780,160,0,0,Math.PI*2);ctx.stroke()}ctx.restore()
 ctx.fillStyle='#FFF6DCCC';for(const [x,y,r] of [[84,110,8],[260,175,5],[832,100,10],[970,252,5],[115,410,6]]){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r/3,y-r/3);ctx.lineTo(x+r,y);ctx.lineTo(x+r/3,y+r/3);ctx.lineTo(x,y+r);ctx.lineTo(x-r/3,y+r/3);ctx.lineTo(x-r,y);ctx.lineTo(x-r/3,y-r/3);ctx.closePath();ctx.fill()}
 const centerGlow=ctx.createRadialGradient(540,970,10,540,970,710);centerGlow.addColorStop(0,fg+'17');centerGlow.addColorStop(1,fg+'00');ctx.fillStyle=centerGlow;ctx.fillRect(0,460,w,1040)
 ctx.save();ctx.translate(540,1010);ctx.rotate(-.22);const sheen=ctx.createLinearGradient(-700,0,700,0);sheen.addColorStop(0,fg+'00');sheen.addColorStop(.5,fg+'14');sheen.addColorStop(1,fg+'00');ctx.fillStyle=sheen;ctx.fillRect(-700,-150,1400,300);ctx.strokeStyle=fg+'24';ctx.lineWidth=2;for(const y of [-150,150]){ctx.beginPath();ctx.moveTo(-700,y);ctx.lineTo(700,y);ctx.stroke()}ctx.restore()
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg
 const draw=(block,top)=>{ctx.font=block.font;ctx.fillStyle=fg;block.lines.forEach((line,i)=>ctx.fillText(line,540,top+(i+.5)*block.step))}
 const block=(text,font,size,width,height,leading)=>fitOracleText(ctx,text,{font,size,width,height,leading})
 // Essential content stays in the central safe area for Stories.
 const ratio=Math.min(190/logo.width,90/logo.height)
 ctx.fillStyle='#191A20';ctx.fillRect(430,252,220,110);ctx.drawImage(logo,540-logo.width*ratio/2,307-logo.height*ratio/2,logo.width*ratio,logo.height*ratio)
 draw(block('PR WRAPPED 2026',sans,30,860,44,1.1),376)
 const eyebrow=block('LO QUE TUS PATINES DIRÍAN DE VOS · '+slide.oracleNumber+'/3',sans,32,900,90,1.3)
 const title=block(slide.kicker,serif,84,900,112,1.1)
 const main=block(slide.oracleNumber===2?slide.big:slide.big.toLocaleUpperCase('es-UY'),slide.oracleNumber===2?serif:condensed,slide.oracleNumber===2?104:146,900,440,slide.oracleNumber===2?1.08:.98)
 const punch=block(slide.small,sans,48,820,230,1.4)
 const total=eyebrow.height+title.height+main.height+punch.height+42+54+44
 let y=450+(1060-total)/2
 draw(eyebrow,y);y+=eyebrow.height+14;draw(title,y);y+=title.height+14
 ctx.fillStyle=fg;ctx.fillRect(492,y,96,3);y+=68
 draw(main,y);y+=main.height+44;draw(punch,y)
 draw(block('puntarollers.com',sans,30,860,46,1.1),1530)
}
export async function renderOraclePlaque(slide){
 if(!isOracleSlide(slide))throw Error('Invalid Oracle story')
 const [logo,fonts]=await Promise.all([getLogo(),getFonts(slide,document)])
 const canvas=document.createElement('canvas');canvas.width=ORACLE_WIDTH;canvas.height=ORACLE_HEIGHT
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable')
 try{drawOraclePlaque(ctx,slide,logo,fonts);return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG unavailable')),'image/png'))}
 finally{canvas.width=0;canvas.height=0}
}
export function downloadOraclePlaque(blob,filename){
 const url=URL.createObjectURL(blob),a=document.createElement('a')
 try{a.href=url;a.download=filename;document.body.appendChild(a);a.click()}
 finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
}
export async function shareOraclePlaque(blob,filename,nav=navigator,download=downloadOraclePlaque){
 try{
  if(typeof File==='function'&&typeof nav.share==='function'&&typeof nav.canShare==='function'){
   const file=new File([blob],filename,{type:'image/png'})
   if(nav.canShare({files:[file]})){await nav.share({files:[file],title:'El oráculo roller · PR Wrapped 2026'});return 'shared'}
  }
 }catch(e){if(e?.name==='AbortError')return 'cancelled'}
 download(blob,filename);return 'downloaded'
}
