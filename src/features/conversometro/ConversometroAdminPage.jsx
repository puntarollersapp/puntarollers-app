import React,{useCallback,useEffect,useState} from 'react';
import {useAuth} from '../../lib/auth';
import ConversometroAdmin from './ConversometroAdmin';
import {loadConversationData,addConversationMarks,undoConversationMark} from './data';
const isStaff=user=>Boolean(user&&(user.role==='admin'||user.role==='profesor'||user.esProfesor));
export default function ConversometroAdminPage(){
 const {user}=useAuth();
 const [state,setState]=useState({loading:true,students:[],marks:[],error:''});
 const [saving,setSaving]=useState(false);
 const [ready,setReady]=useState(false);
 const refresh=useCallback(async()=>{
  try{const data=await loadConversationData(true);setState({loading:false,...data,error:''});setReady(true)}
  catch(e){setReady(false);setState(prev=>({...prev,loading:false,error:e?.message||'Error al cargar alumnos'}))}
 },[]);
 useEffect(()=>{if(isStaff(user))refresh()},[user?.id,user?.role,user?.esProfesor,refresh]);
 const mutate=async(action,...args)=>{
  if(saving||!isStaff(user))return;
  setSaving(true);
  try{await action(...args);await refresh()}
  catch(e){setState(prev=>({...prev,error:e?.message||'Error al guardar'}))}
  finally{setSaving(false)}
 };
 if(!isStaff(user))return <div role="alert">No tenés permisos para acceder al control del Conversómetro.</div>;
 if(state.loading)return <div role="status" style={{padding:30}}>Cargando alumnos…</div>;
 if(!ready)return <main role="alert" style={{padding:24,color:'#fff',background:'#100927',minHeight:'50vh'}}><h1>Control de charlas no disponible</h1><p>{state.error}</p><button type="button" onClick={refresh} style={{padding:12}}>Reintentar</button></main>;
 return <ConversometroAdmin students={state.students} marks={state.marks} saving={saving} error={state.error}
 onAdd={(id,n)=>mutate(addConversationMarks,id,n)} onUndo={id=>mutate(undoConversationMark,id)}/>;
}
