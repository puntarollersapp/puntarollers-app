// Original, locally synthesized instrumental. No third-party samples or music streams.
export async function createWrappedSound(){
 const Audio=window.AudioContext||window.webkitAudioContext
 if(!Audio)throw Error('Audio unavailable')
 const ctx=new Audio();const output=ctx.createGain();output.gain.value=.085;output.connect(ctx.destination)
 let timer=null,closed=false,beat=0,next=0
 const hz=n=>440*2**((n-69)/12)
 function tone(note,at,len,vol,type='sine'){
  const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.value=hz(note);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(vol,at+.035);g.gain.exponentialRampToValueAtTime(.0001,at+len);osc.connect(g);g.connect(output);osc.onended=()=>{osc.disconnect();g.disconnect()};osc.start(at);osc.stop(at+len+.02)
 }
 const chords=[[57,60,64,71],[53,57,60,67],[55,59,62,69],[52,55,59,64]]
 const step=.29
 function schedule(){
  if(closed||ctx.state!=='running')return
  if(next<ctx.currentTime)next=ctx.currentTime+.06
  while(next<ctx.currentTime+.18){const chord=chords[Math.floor(beat/16)%4],pos=beat%16
   if(pos%4===0)tone(chord[0]-12,next,.25,.32,'sine')
   if(pos%4===2)tone(chord[0],next,.15,.12,'triangle')
   if(pos===0||pos===8)for(const n of chord)tone(n,next,1.9,.055,'sine')
   if([1,4,7,10,13].includes(pos))tone(chord[[0,2,3,1,2][[1,4,7,10,13].indexOf(pos)]]+12,next,.42,.095,'triangle')
   beat++;next+=step
  }
 }
 try{await ctx.resume();next=ctx.currentTime+.08;schedule();timer=setInterval(schedule,70)}catch(e){await ctx.close().catch(()=>{});throw e}
 return {stop(){if(closed)return;closed=true;clearInterval(timer);output.gain.value=0;ctx.close().catch(()=>{})}}
}
