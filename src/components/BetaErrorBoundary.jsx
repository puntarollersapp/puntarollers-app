import React from 'react'
export default class BetaErrorBoundary extends React.Component {
 state={error:null}
 static getDerivedStateFromError(error){return {error}}
 componentDidCatch(error,info){console.error('PR NEXT beta render error',error,info)}
 render(){if(!this.state.error)return this.props.children;return <main style={{minHeight:'100vh',background:'#0c0912',color:'white',padding:'35px 22px',fontFamily:'system-ui'}}><section style={{maxWidth:550,margin:'10vh auto',border:'1px solid #b88ae4',borderRadius:24,padding:25,background:'#24182d'}}><p style={{color:'#d7baff',fontWeight:800}}>PR NEXT · DIAGNÓSTICO BETA</p><h1 style={{fontSize:27}}>Encontramos un error de la aplicación</h1><p>La pantalla negra fue reemplazada por este diagnóstico. Ningún dato de alumnos fue modificado.</p><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:12,color:'#f4d2ff'}}>{String(this.state.error?.message||this.state.error)}</pre><button style={{background:'#d7baff',color:'#111',border:0,padding:13,borderRadius:12,fontWeight:800}} onClick={()=>window.location.assign('/login')}>Volver al acceso</button></section></main>}
}