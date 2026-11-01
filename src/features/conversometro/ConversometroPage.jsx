import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import ConversometroPrototype from './ConversometroPrototype';
import { createConversationMark, loadConversationData, undoConversationMark } from './data';

const authorized = user => Boolean(user && (user.role === 'admin' || user.role === 'profesor' || user.esProfesor));

export default function ConversometroPage() {
  const { user } = useAuth();
  const [state,setState] = useState({loading:true,ready:false,students:[],marks:[],error:''});
  const [saving,setSaving] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const data = await loadConversationData(authorized(user));
      setState({loading:false,ready:true,...data,error:''});
    } catch (err) {
      setState(previous=>({...previous,loading:false,ready:false,error:err?.message||'No se pudo cargar el Conversómetro'}));
    }
  },[user?.id,user?.role,user?.esProfesor]);
  useEffect(()=>{
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus',onFocus);
    return ()=>window.removeEventListener('focus',onFocus);
  },[refresh]);
  const mutate = async (action,id) => {
    if (!authorized(user) || saving || !state.ready) return;
    setSaving(true);
    try {
      await action(id);
      await refresh();
    } catch (err) {
      setState(previous=>({...previous,error:err?.message||'No se pudo guardar la marca'}));
    } finally {
      setSaving(false);
    }
  };
  if (state.loading) return <div role="status" style={{minHeight:'60vh',display:'grid',placeItems:'center',background:'#100927',color:'#fff'}}>💬 Preparando el Conversómetro…</div>;
  if (!state.ready) return <main role="alert" style={{minHeight:'65vh',padding:'40px 18px',background:'#100927',color:'#fff',textAlign:'center'}}>
    <h1>💬 Conversómetro temporalmente no disponible</h1>
    <p>No se pudieron cargar las marcas. No se mostrarán datos simulados como si fueran reales.</p>
    <p style={{color:'#e4b6ff'}}>{state.error}</p>
    <button type="button" onClick={refresh} style={{padding:'12px 22px',borderRadius:12,border:0,background:'#d9ff7d',fontWeight:800}}>Reintentar</button>
  </main>;
  return <>
    {state.error && <div role="alert" style={{padding:12,background:'#451a45',color:'#fff'}}>{state.error}</div>}
    <ConversometroPrototype students={state.students} marks={state.marks} canMark={authorized(user)&&!saving}
      onMark={id=>mutate(createConversationMark,id)}
      onUndo={id=>mutate(undoConversationMark,id)}/>
  </>;
}
