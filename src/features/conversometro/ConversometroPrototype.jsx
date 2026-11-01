import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

/** Conversómetro PR — isolated visual prototype. No production writes. */
const demo = [{id:'preview-teacher',name:'Claudio',count:25,color:'#d48aff'}];
function isAuthorizedPreviewUser(user) { return Boolean(user && (user.role === 'admin' || user.role === 'profesor' || user.esProfesor)); }
export default function ConversometroPrototype({ students = demo, marks = [], onMark, canMark = false }) {
  const { user } = useAuth();
  const [local, setLocal] = useState({});
  const [extraStudents, setExtraStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [directory, setDirectory] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  useEffect(() => {
    let alive = true;
    if (students !== demo) return;
    if (user?.id) { setTeacherProfile({id:user.id,nombre:user.nombre,apellido:user.apellido,foto:user.foto}); return; }
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;
      const { data, error } = await supabase.from('profiles').select('id,nombre,apellido,foto').eq('auth_user_id',uid).maybeSingle();
      if (alive && !error && data) setTeacherProfile(data);
    })().catch(() => {});
    return () => { alive = false; };
  }, [students,user?.id,user?.nombre,user?.apellido,user?.foto]);
  const [period, setPeriod] = useState('Mes');
  const previewEditor = isAuthorizedPreviewUser(user);
  const allowMark = canMark || (students === demo && previewEditor);
  const isDemo = students === demo;
  const previewStudents = isDemo
    ? [...(teacherProfile ? [{...demo[0],id:teacherProfile.id,name:[teacherProfile.nombre,teacherProfile.apellido].filter(Boolean).join(' ')||'Claudio',avatar_url:teacherProfile.foto}] : demo), ...extraStudents]
    : students;
  const ranking = useMemo(() => previewStudents.map(s=>({...s,count:(s.count||0)+(local[s.id]||0)})).filter(s=>s.count>0).sort((a,b)=>b.count-a.count),[previewStudents,local]);
  const total = ranking.reduce((n,s)=>n+s.count,0);
  const monthly = useMemo(() => {
    const counts = new Map();
    for (const item of marks) {
      if (item.voided_at || !item.created_at) continue;
      const date = new Date(item.created_at);
      if (!Number.isFinite(date.getTime()) || date > new Date()) continue;
      const uy = new Date(date.getTime() - 3 * 60 * 60 * 1000);
      const key = uy.getUTCFullYear() + '-' + String(uy.getUTCMonth() + 1).padStart(2,'0');
      counts.set(key,(counts.get(key)||0)+1);
    }
    return [...counts].sort(([a],[b])=>a.localeCompare(b)).slice(-12).map(([key,count])=>({
      key,count,label:new Intl.DateTimeFormat('es-UY',{month:'short',year:'2-digit',timeZone:'UTC'}).format(new Date(key+'-01T12:00:00Z'))
    }));
  },[marks]);
  const maxMonth = Math.max(1,...monthly.map(m=>m.count));
  const peak = monthly.reduce((best,m)=>!best||m.count>best.count?m:best,null);
  useEffect(() => {
    if (!isDemo || !previewEditor) return;
    let active = true;
    supabase.from('profiles').select('id,nombre,apellido,foto,role,participa_como_alumno').order('nombre').limit(250).then(({data,error}) => {
      if (active && !error) setDirectory((data||[]).filter(p=>p.role==='alumno'||p.participa_como_alumno).map(p=>({
        id:p.id,name:[p.nombre,p.apellido].filter(Boolean).join(' ')||'Alumno',avatar_url:p.foto,count:0,color:'#b25aff'
      })));
    });
    return () => {active=false};
  },[isDemo,previewEditor]);
  const matches = studentSearch.trim() ? directory.filter(p=>p.name.toLowerCase().includes(studentSearch.trim().toLowerCase()) && !ranking.some(s=>s.id===p.id)).slice(0,8) : [];
  const addStudent = p => {setExtraStudents(old=>old.some(s=>s.id===p.id)?old:[...old,p]);setLocal(old=>({...old,[p.id]:Math.max(1,(old[p.id]||0)+1)}));setStudentSearch('');};
  const undo = s => {
    if (!allowMark || !isDemo) return;
    setLocal(p => ({...p,[s.id]:Math.max(-s.count,(p[s.id]||0)-1)}));
  };
  const mark = s => {
    if (!allowMark) return;
    if (onMark) onMark(s.id);
    else setLocal(p=>({...p,[s.id]:(p[s.id]||0)+1}));
  };
  return <main className="cm-root">
    <div className="cm-spark cm-spark-a" aria-hidden="true">😂</div>
    <div className="cm-spark cm-spark-b" aria-hidden="true">💬</div>
    <div className="cm-spark cm-spark-c" aria-hidden="true">🤣</div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;700;800;900&display=swap');
      .cm-root{min-height:100vh;background:radial-gradient(ellipse at 50% 5%,#35115d 0%,#100927 45%,#080c1e 100%);color:white;padding:clamp(16px,4vw,50px);font-family:system-ui,-apple-system,sans-serif;overflow:hidden}
      .cm-root *{box-sizing:border-box}
      .cm-analytics{max-width:1050px;margin:30px auto;padding:clamp(16px,3vw,28px);border:1px solid #9e55e877;border-radius:24px;background:linear-gradient(135deg,#2a1248dd,#0c1029ee)}
      .cm-analytics h2{font-family:'Archivo Black',system-ui;font-size:clamp(19px,3vw,28px);margin:0 0 8px}
      .cm-analytics-desc{color:#d7c4e9;font-size:13px;line-height:1.6}
      .cm-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:20px}
      .cm-chart-card{padding:16px;border:1px solid #ffffff25;border-radius:18px;background:#120d2d}
      .cm-chart-card h3{font-size:16px;margin:0 0 15px}
      .cm-chart-row{display:grid;grid-template-columns:minmax(65px,115px) 1fr 35px;align-items:center;gap:9px;margin:12px 0;font-size:12px}
      .cm-chart-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .cm-chart-track{height:14px;background:#312148;border-radius:30px;overflow:hidden}
      .cm-chart-fill{height:100%;background:linear-gradient(90deg,#9343ee,#d5ff70);border-radius:30px}
      .cm-month-bars{display:flex;gap:8px;align-items:end;min-height:175px;overflow-x:auto;padding:10px 0}
      .cm-month-item{flex:1;min-width:45px;display:flex;flex-direction:column;align-items:center;justify-content:end;gap:6px;font-size:11px}
      .cm-month-item .cm-month-bar{width:80%;max-width:35px;min-height:4px;background:linear-gradient(#d5ff70,#a03eff);border-radius:8px 8px 2px 2px}
      .cm-chart-empty{padding:28px 10px;text-align:center;color:#cab3df;font-size:13px;line-height:1.6}
      @media(max-width:650px){.cm-chart-grid{grid-template-columns:1fr}}

      .cm-student-picker{max-width:700px;margin:15px auto 25px;padding:18px;border:1px solid #a85df877;border-radius:20px;background:#24103e}
      .cm-student-picker label{display:block;font-weight:900;margin-bottom:10px}
      .cm-student-picker input{width:100%;padding:13px;border:1px solid #a85df8;border-radius:12px;background:#110a24;color:white;font:inherit}
      .cm-student-picker button{display:flex;justify-content:space-between;width:100%;padding:12px;border:0;border-bottom:1px solid #ffffff22;background:transparent;color:white;text-align:left;cursor:pointer}
      .cm-student-picker button b{color:#d5ff70}

      .cm-root{position:relative;font-family:'DM Sans',system-ui,sans-serif}
      .cm-root:before{content:'';position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(#d9adff 1px,transparent 1px);background-size:29px 29px;opacity:.11;mask-image:linear-gradient(#000,transparent 65%)}
      .cm-hero{position:relative;z-index:1;max-width:1060px}
      .cm-eyebrow{display:inline-flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:10px 17px;border:1px solid #cb77f755;border-radius:999px;background:#8c39d31c;color:#e9c2ff;font-size:clamp(9px,1.4vw,12px);font-weight:900;letter-spacing:.13em;margin-bottom:25px}
      .cm-live-dot{height:8px;width:8px;border-radius:50%;background:#b3ff65;box-shadow:0 0 14px #b3ff65;animation:cm-pulse 2s infinite}
      .cm-title-wrap{display:flex;align-items:center;justify-content:center;gap:clamp(5px,2vw,22px)}
      .cm-hero .cm-title-wrap h1{font-family:'Archivo Black',Impact,sans-serif;font-weight:900;font-size:clamp(29px,6.8vw,87px);letter-spacing:-.065em;transform:rotate(-1deg);text-shadow:3px 5px 0 #7b28c6,0 0 34px #ad43ff99}
      .cm-hero .cm-title-wrap h1 span{color:#d5ff70}
      .cm-title-emoji{font-size:clamp(28px,5vw,62px);filter:drop-shadow(0 0 16px #bd69ff);animation:cm-bob 3s ease-in-out infinite}
      .cm-title-emoji-right{animation-delay:-1.5s}
      .cm-hero .cm-tagline{font-size:clamp(19px,3.2vw,34px);font-weight:900;font-style:normal;color:#fff;margin:20px auto 0;letter-spacing:-.045em}
      .cm-tagline span{color:#d5ff70}
      .cm-intro{max-width:710px;margin:24px auto 26px;padding:22px 26px;border:1px solid #ce90ff44;border-radius:25px;background:linear-gradient(145deg,#50207677,#160f35a8);box-shadow:0 20px 65px #0004,inset 0 1px #ffffff25}
      .cm-intro strong{display:block;font-size:clamp(15px,2vw,19px);line-height:1.5}
      .cm-intro p{font-style:normal;font-size:clamp(13px,1.7vw,16px);line-height:1.7;color:#e0d3ee;margin:10px 0}
      .cm-intro-note{display:inline-block;color:#e9b8ff;font-size:12px;font-weight:800}
      .cm-mini-marquee{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:15px auto 25px}
      .cm-mini-marquee span{padding:7px 11px;border-radius:10px;background:#f3c2ff12;border:1px solid #ffffff1e;font-size:10px;font-weight:900;letter-spacing:.09em;color:#eacfff;transform:rotate(-2deg)}
      .cm-mini-marquee span:nth-child(even){transform:rotate(3deg);color:#d5ff70}
      .cm-spark{position:absolute;z-index:0;font-size:clamp(30px,5vw,58px);opacity:.32;pointer-events:none;animation:cm-bob 4s ease-in-out infinite}
      .cm-spark-a{top:65px;left:5%}.cm-spark-b{top:310px;right:4%;animation-delay:-2s}.cm-spark-c{top:520px;left:2%;animation-delay:-1s}
      @keyframes cm-bob{50%{transform:translateY(-13px) rotate(8deg)}}@keyframes cm-pulse{50%{opacity:.35;transform:scale(.75)}}
      @media(prefers-reduced-motion:reduce){.cm-spark,.cm-title-emoji,.cm-live-dot{animation:none!important}}
      .cm-hero{text-align:center;margin:10px auto 30px}.cm-hero h1{font-size:clamp(36px,8vw,88px);line-height:1;letter-spacing:-.06em;margin:0;color:#fff;text-shadow:0 5px 0 #7226be,0 0 35px #a43eff;font-weight:1000}.cm-hero p{font-size:clamp(16px,3vw,26px);margin:18px 0;color:#f4d9ff;font-style:italic}
      .cm-ranking-help{font-size:12px;color:#d9c1f3;margin:-8px 0 18px;line-height:1.5}.cm-demo-notice{max-width:800px;margin:0 auto 20px;padding:12px 16px;border:1px solid #d4b0ff55;border-radius:15px;background:#29164b;color:#f5d8ff;text-align:center;font-size:13px;font-weight:800}
      .cm-period button:disabled{cursor:not-allowed;opacity:.6}
      .cm-stats{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:1050px;margin:0 auto 15px;flex-wrap:wrap}.cm-pill{border:1px solid #9a55ed;background:#20103c;border-radius:18px;padding:12px 18px;box-shadow:0 0 22px #7124ba44}.cm-pill strong{color:#ffd95c;font-size:25px}.cm-period{display:flex;gap:6px}.cm-period button{border:1px solid #6832a2;color:#ddd;background:#24113d;border-radius:20px;padding:9px 14px;cursor:pointer}.cm-period button[aria-pressed=true]{background:#9134e6;color:white}
      .cm-jars{display:flex;align-items:end;justify-content:center;gap:clamp(8px,2vw,28px);max-width:1200px;margin:45px auto 45px;min-height:290px}.cm-item{flex:1;min-width:0;text-align:center}.cm-count{display:inline-block;font-size:clamp(16px,3vw,29px);font-weight:900;padding:7px 17px;border:2px solid var(--glow);border-radius:16px;background:#190e31;box-shadow:0 0 18px var(--glow);margin-bottom:15px}.cm-jar{position:relative;height:clamp(145px,23vw,280px);border:3px solid #a6c4ff;border-top:10px solid var(--glow);border-radius:18px 18px 30px 30px;background:linear-gradient(110deg,#ffffff24,transparent 28%,#ffffff12 80%,#ffffff40);box-shadow:inset 0 0 22px #9ac8ff44,0 0 26px color-mix(in srgb,var(--glow) 55%,transparent);overflow:hidden;display:flex;align-content:end;justify-content:center;align-items:end;flex-wrap:wrap-reverse;gap:3px;padding:12px 5px}.cm-ball{width:clamp(18px,3.3vw,37px);height:clamp(18px,3.3vw,37px);border-radius:50%;background:linear-gradient(135deg,#fff,var(--glow));border:2px solid #fff8;display:grid;place-items:center;color:#241039;font-size:clamp(9px,1.6vw,15px);font-weight:900;overflow:hidden;animation:cm-drop .4s ease-out both}.cm-ball img{width:100%;height:100%;object-fit:cover}.cm-name{margin:16px auto 0;background:var(--glow);color:#120b21;border-radius:25px;padding:8px 4px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@keyframes cm-drop{from{transform:translateY(-80px);opacity:0}to{transform:translateY(0);opacity:1}}
      .cm-panel{max-width:1050px;margin:auto;border:1px solid #8137dc;border-radius:24px;background:#120d2bd9;padding:clamp(16px,3vw,30px);box-shadow:0 0 50px #631ac52a}.cm-panel h2{margin:0 0 20px;font-size:clamp(20px,3vw,30px)}.cm-row{display:grid;grid-template-columns:28px 40px minmax(80px,180px) 1fr 36px auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #ffffff18}.cm-avatar{width:38px;height:38px;border-radius:50%;background:#6832a2;display:grid;place-items:center;overflow:hidden}.cm-avatar img{width:100%;height:100%;object-fit:cover}.cm-bar{height:11px;background:#292143;border-radius:20px;overflow:hidden}.cm-fill{height:100%;border-radius:20px;background:var(--glow);transition:width .35s}.cm-add{background:#8a36e4;color:white;border:0;border-radius:10px;padding:8px 12px;cursor:pointer;font-weight:800}.cm-add:disabled{opacity:.35;cursor:default}.cm-actions{display:flex;gap:5px;justify-content:flex-end}.cm-actions button{min-width:37px;min-height:40px;touch-action:manipulation}.cm-sub{background:#472362;color:#f7d9ff}.cm-foot{text-align:center;color:#b7a4d6;margin:25px auto;font-size:13px}
      @media(max-width:650px){.cm-jars{overflow-x:auto;justify-content:flex-start;padding:20px 2px}.cm-item{flex:0 0 110px}.cm-jar{height:185px}.cm-row{grid-template-columns:18px 30px minmax(70px,1fr) minmax(35px,70px) 25px auto;gap:5px;font-size:12px}.cm-avatar{width:30px;height:30px}.cm-add{padding:7px}.cm-actions button{min-width:34px}.cm-panel{border-radius:16px}}
      @media(max-width:440px){
        .cm-root{padding:18px 10px calc(30px + env(safe-area-inset-bottom,0px))}
        .cm-panel{padding:12px 9px}
        .cm-row{grid-template-columns:18px 28px minmax(0,1fr) 27px 75px;gap:5px}
        .cm-row .cm-bar{display:none}
        .cm-row strong{overflow-wrap:anywhere;font-size:11px}
        .cm-actions{gap:3px}
        .cm-actions button{min-width:36px;min-height:44px;padding:6px}
        .cm-period{flex-wrap:wrap}
        .cm-stats{justify-content:center}
        .cm-hero .cm-title-wrap h1{font-size:clamp(23px,7vw,36px)}
        .cm-title-emoji{font-size:23px}
      }
      @media(prefers-reduced-motion:reduce){.cm-ball{animation:none}}
    `}</style>
    <header className="cm-hero">
      <div className="cm-eyebrow"><span className="cm-live-dot"/> PUNTA ROLLERS PRESENTA <span>✦</span> EL EXPERIMENTO MÁS CHARLATÁN</div>
      <div className="cm-title-wrap"><span className="cm-title-emoji" aria-hidden="true">🗣️</span><h1>CONVERS<span>Ó</span>METRO</h1><span className="cm-title-emoji cm-title-emoji-right" aria-hidden="true">😂</span></div>
      
      <div className="cm-intro"><strong>En Punta Rollers las ruedas giran… ¡y las conversaciones también! 🤭</strong><p>Cada vez que alguien se distrae charlando en clase, el profe suma una bolita a su frasco. Cuantas más charlas, más se llena. ¿Quién se lleva la corona de la lengua más rápida? 👑</p><span className="cm-intro-note">Una competencia en broma, con mucho humor y cero drama. 💜</span></div>
      <div className="cm-mini-marquee" aria-hidden="true"><span>💬 BLA BLA BLA</span><span>😂 JA JA JA</span><span>🎤 ¡TE ESCUCHAMOS!</span><span>🤫 SHHH…</span></div>
    </header>
    {isDemo && <p className="cm-demo-notice" role="status">🎨 Demostración visual: 25 marcas simuladas para mostrar cómo se llena el frasco. No se guardan como llamadas de atención reales.</p>}
    {isDemo && previewEditor && <section className="cm-student-picker">
      <label htmlFor="cm-search">💬 Simular primera marca de un alumno</label>
      <input id="cm-search" autoComplete="off" type="search" placeholder="Buscar alumno…" value={studentSearch} onChange={e=>setStudentSearch(e.target.value)}/>
      {matches.map(p=><button type="button" key={p.id} onClick={()=>addStudent(p)}>{p.name} <b>+1</b></button>)}
    </section>}
    <div className="cm-stats"><div className="cm-pill">💬 Total de conversaciones: <strong>{total}</strong></div><div className="cm-period">{['Semana','Mes','Histórico'].map(p=><button key={p} aria-pressed={period===p} onClick={()=>setPeriod(p)} disabled={isDemo} title={isDemo?'Disponible cuando se conecten los registros reales':undefined}>{p}</button>)}</div></div>
    <section className="cm-jars" aria-label="Frascos de conversaciones">{ranking.slice(0,5).map((s,i)=><div className="cm-item" key={s.id} style={{'--glow':s.color||'#a45aff'}}><div className="cm-count">{i===0?'👑 ':''}{s.count}</div><div className="cm-jar">{Array.from({length:Math.min(s.count,100)},(_,j)=><div className="cm-ball" key={j} style={{animationDelay:Math.min(j*25,300)+'ms'}}>{s.avatar_url?<img src={s.avatar_url} alt=""/>:s.name.slice(0,1)}</div>)}</div><div className="cm-name">{s.name}</div></div>)}</section>
    <section className="cm-panel"><h2>🏆 Ranking de conversadores</h2><p className="cm-ranking-help">Los alumnos aparecerán acá cuando reciban su primera marca. Los que tengan cero no ocupan lugar.</p>{ranking.map((s,i)=><div className="cm-row" key={s.id} style={{'--glow':s.color||'#a45aff'}}><b>{i+1}</b><span className="cm-avatar">{s.avatar_url?<img src={s.avatar_url} alt=""/>:s.name.slice(0,1)}</span><strong>{s.name}</strong><div className="cm-bar"><div className="cm-fill" style={{width:(ranking[0].count?100*s.count/ranking[0].count:0)+'%'}}/></div><b>{s.count}</b><span className="cm-actions"><button className="cm-add cm-sub" disabled={!allowMark || !isDemo || s.count<=0} onClick={()=>undo(s)} aria-label={'Quitar una marca de '+s.name}>−1</button><button className="cm-add" disabled={!allowMark} onClick={()=>mark(s)} aria-label={'Sumar una llamada de atención a '+s.name}>+1</button></span></div>)}</section>
    <section className="cm-analytics" aria-label="Estadísticas del Conversómetro">
      <h2>📊 EL LABORATORIO DEL BLA BLA BLA</h2>
      <p className="cm-analytics-desc">¿Quién habla más? ¿En qué mes volaron más bolitas? Las estadísticas crecen con las marcas registradas. {isDemo?'Los datos de este ejemplo son simulados.':''}</p>
      <div className="cm-chart-grid">
        <div className="cm-chart-card"><h3>🏆 Los más charlatanes</h3>
          {ranking.length ? ranking.slice(0,7).map(s=><div className="cm-chart-row" key={s.id}><span title={s.name}>{s.name}</span><div className="cm-chart-track"><div className="cm-chart-fill" style={{width:(ranking[0].count?100*s.count/ranking[0].count:0)+'%'}}/></div><strong>{s.count}</strong></div>) : <p className="cm-chart-empty">Aún no hay marcas.</p>}
        </div>
        <div className="cm-chart-card"><h3>📅 Mes a mes</h3>
          {monthly.length ? <><div className="cm-month-bars">{monthly.map(m=><div className="cm-month-item" key={m.key}><b>{m.count}</b><div className="cm-month-bar" style={{height:(10+135*m.count/maxMonth)+'px'}}/><span>{m.label}</span></div>)}</div><p className="cm-analytics-desc">👑 Mes más charlatán: <strong>{peak.label}</strong> ({peak.count} marcas)</p></> : <p className="cm-chart-empty">🗓️ Este gráfico se activará cuando haya marcas reales con fecha. Todavía no existe un historial mensual para mostrar.</p>}
        </div>
      </div>
    </section>
    <p className="cm-foot">Punta Rollers · Un juego para mejorar la atención en clase</p>
  </main>;
}
