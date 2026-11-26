import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
export default function ReferralCodeField({value,onChange,onValidated,compact=false,lang='es'}){
 const [checking,setChecking]=useState(false),[status,setStatus]=useState(null)
 const revision=useRef(0),en=lang==='en'
 const normalize=v=>String(v||'').replace(/\s+/g,'').toUpperCase()
 async function validate(){
  const code=normalize(value),request=++revision.current
  onChange(code);onValidated?.(null);setStatus(null)
  if(!code){setChecking(false);return}
  setChecking(true)
  try{
   const {data,error}=await supabase.rpc('validate_pr_referral_code',{p_code:code})
   if(request!==revision.current)return
   const row=!error&&Array.isArray(data)?data[0]:null
   if(row){setStatus({ok:true});onValidated?.(row)}else{setStatus({ok:false});onValidated?.(null)}
  }catch{if(request===revision.current)setStatus({ok:false})}
  finally{if(request===revision.current)setChecking(false)}
 }
 return <section aria-label={en?'Referral code':'Código de referido'} style={{marginTop:18,padding:compact?14:18,border:'1px solid #ff005540',borderRadius:18,background:'#ff005509'}}>
  <p style={{margin:0,color:'#ff91b5',fontSize:11,fontWeight:850,letterSpacing:'.12em'}}>AMIGOS PR · {en?'OPTIONAL':'OPCIONAL'}</p>
  <p style={{margin:'9px 0 14px',fontSize:14,lineHeight:1.55,color:'#dedde4'}}>{en?'Invited by a Punta Rollers student? Enter the referral code they shared with you to receive your benefit.':'¿Un alumno de Punta Rollers te invitó a sumarte? Ingresá el código que te compartió para acceder a tu beneficio.'}</p>
  <div style={{display:'flex',gap:8}}>
   <input aria-label={en?'Your referral code':'Tu código de referido'} value={value} onChange={e=>{revision.current++;setChecking(false);onChange(e.target.value.toUpperCase());setStatus(null);onValidated?.(null)}} placeholder={en?'Your referral code':'Tu código de referido'} autoCapitalize="characters" autoComplete="off" style={{minWidth:0,flex:1,borderRadius:12,border:'1px solid #ffffff30',background:'#14151b',color:'#fff',padding:'12px',fontSize:14}}/>
   <button type="button" onClick={validate} disabled={checking||!normalize(value)} style={{borderRadius:12,border:'1px solid #ff005566',background:'#ff005521',color:'#ffb1ca',padding:'0 14px',fontSize:13,fontWeight:800,opacity:(checking||!normalize(value))?0.5:1}}>{checking?(en?'Checking…':'Validando…'):(en?'Apply':'Aplicar')}</button>
  </div>
  <p style={{margin:'10px 0 0',fontSize:12,color:'#b5b5c0',lineHeight:1.45}}>{en?'Optional. If you do not have a code, continue normally.':'Si no tenés código, podés continuar normalmente.'}</p>
  {status&&<p role="status" style={{margin:'10px 0 0',fontSize:13,fontWeight:750,lineHeight:1.5,color:status.ok?'#a7f0bc':'#ffaaaa'}}>{status.ok?(en?'✓ Valid code. Your benefit will be reflected before payment.':'✓ Código válido. Verás tu beneficio antes de pagar.'):(en?'Code not valid or inactive. Check it or leave the field empty.':'Código inválido o inactivo. Revisalo o dejá el campo vacío.')}</p>}
 </section>
}
