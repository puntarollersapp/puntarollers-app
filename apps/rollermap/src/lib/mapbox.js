import mapboxgl from 'mapbox-gl'
import { supabase } from './supabase'
export let mapboxToken=import.meta.env.VITE_MAPBOX_TOKEN || ''
export async function loadMapboxToken(){
 if(mapboxToken){mapboxgl.accessToken=mapboxToken;return}
 const {data,error}=await supabase.from('pr_rollermap_public_config').select('mapbox_token').eq('id',1).single()
 if(error||!data?.mapbox_token)throw new Error('No se pudo cargar la configuración del mapa. Intentá nuevamente.')
 mapboxToken=data.mapbox_token
 mapboxgl.accessToken=mapboxToken
}
