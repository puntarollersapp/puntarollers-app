import {useEffect,useRef,useState} from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {loadMapboxToken} from '../../../apps/rollermap/src/lib/mapbox'

const DEFAULT_CENTER=[-54.95,-34.9]
const GOLD='#d7b45a'
const SOURCE='explorer-route'
const LAYER='explorer-route-line'

function markerEl(label){
 const el=document.createElement('div')
 el.className='rx-map-marker'
 el.innerHTML=`<span>${label}</span>`
 return el
}
export default function ExplorerMap({points,onChange}){
 const container=useRef(null),mapRef=useRef(null),markers=useRef([]),pointsRef=useRef(points),changeRef=useRef(onChange)
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[locating,setLocating]=useState(false)
 useEffect(()=>{pointsRef.current=points},[points])
 useEffect(()=>{changeRef.current=onChange},[onChange])
 useEffect(()=>{let active=true,map
 ;(async()=>{try{
   await loadMapboxToken()
   if(!active||!container.current)return
   if(!mapboxgl.supported())throw new Error('Este dispositivo no admite el mapa interactivo.')
   map=new mapboxgl.Map({container:container.current,style:'mapbox://styles/mapbox/dark-v11',center:DEFAULT_CENTER,zoom:12.5,minZoom:5,maxZoom:19,pitchWithRotate:false,maxBounds:[[-62,-36],[-52,-28]]})
   mapRef.current=map
   map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right')
   map.addControl(new mapboxgl.ScaleControl({unit:'metric'}),'bottom-left')
   map.on('load',()=>{
     if(!active)return
     map.addSource(SOURCE,{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[]}}})
     map.addLayer({id:LAYER,type:'line',source:SOURCE,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':GOLD,'line-width':5,'line-opacity':.95}})
     map.on('click',e=>changeRef.current?.([...pointsRef.current,{lng:e.lngLat.lng,lat:e.lngLat.lat}]))
     setReady(true)
   })
 }catch(e){if(active)setError(e?.message||'No se pudo cargar el mapa')}})()
 return()=>{active=false;markers.current.forEach(m=>m.remove());markers.current=[];map?.remove();mapRef.current=null}},[])
 useEffect(()=>{
   const map=mapRef.current;if(!ready||!map)return
   const src=map.getSource(SOURCE)
   src?.setData({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:points.map(p=>[p.lng,p.lat])}})
   markers.current.forEach(m=>m.remove());markers.current=[]
   points.forEach((p,i)=>{
     const label=i===0?'A':i===points.length-1?'B':String(i)
     const m=new mapboxgl.Marker({element:markerEl(label),anchor:'center',draggable:true}).setLngLat([p.lng,p.lat]).addTo(map)
     m.on('dragend',()=>{const ll=m.getLngLat(),next=pointsRef.current.map((item,n)=>n===i?{...item,lng:ll.lng,lat:ll.lat}:item);changeRef.current?.(next)})
     markers.current.push(m)
   })
 },[points,ready])
 function locate(){
   if(!navigator.geolocation){setError('Este dispositivo no permite acceder a tu ubicación.');return}
   setLocating(true);setError('')
   navigator.geolocation.getCurrentPosition(({coords})=>{
     mapRef.current?.flyTo({center:[coords.longitude,coords.latitude],zoom:15,essential:true})
     setLocating(false)
   },()=>{setError('No pudimos obtener tu ubicación. Podés seguir usando el mapa manualmente.');setLocating(false)},{enableHighAccuracy:true,timeout:10000})
 }
 function fit(){
   if(points.length<2||!mapRef.current)return
   const bounds=new mapboxgl.LngLatBounds([points[0].lng,points[0].lat],[points[0].lng,points[0].lat])
   points.slice(1).forEach(p=>bounds.extend([p.lng,p.lat]))
   mapRef.current.fitBounds(bounds,{padding:70,maxZoom:16,duration:600})
 }
 return <div className="rx-realmap-wrap">
   <div ref={container} className="rx-realmap"/>
   <div className="rx-map-tools"><button type="button" onClick={locate} disabled={locating}>{locating?'Ubicando…':'◎ Mi ubicación'}</button>{points.length>1&&<button type="button" onClick={fit}>Encuadrar</button>}</div>
   {!ready&&!error&&<div className="rx-map-loading">Cargando mapa real…</div>}
   {error&&<div className="rx-map-error">{error}</div>}
   <div className="rx-map-help">{points.length===0?'Tocá el punto exacto donde comienza el tramo':points.length===1?'Ahora marcá el siguiente punto':'Seguí tocando la calle para acompañar curvas y cruces · podés arrastrar cualquier punto para corregirlo'}</div>
 </div>
}
