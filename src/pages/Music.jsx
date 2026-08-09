import { useEffect, useMemo, useRef, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MOODS = [
  { id: 'all', label: 'Para hoy', emoji: '✨' },
  { id: 'happy', label: 'Feliz', emoji: '😊' },
  { id: 'motivated', label: 'Motivado', emoji: '🔥' },
  { id: 'competition', label: 'Competencia', emoji: '🏁' },
  { id: 'night', label: 'Noche', emoji: '🌙' },
  { id: 'low', label: 'Bajón', emoji: '💔' },
  { id: 'calm', label: 'Tranquilo', emoji: '😌' },
  { id: 'friends', label: 'Con amigos', emoji: '🛼' },
  { id: 'distance', label: 'Fondo', emoji: '⚡' },
]

const MOOD_RECOMMENDATIONS = {
  all: 0,
  happy: 2,
  motivated: 3,
  competition: 0,
  night: 1,
  low: 4,
  calm: 6,
  friends: 5,
  distance: 6,
}

const TEST_QUESTIONS = [
  {
    id: 'goal',
    eyebrow: 'Pregunta 1 de 3',
    title: '¿Qué necesitás de la música hoy?',
    options: [
      { id: 'activate', label: 'Activarme', emoji: '⚡' },
      { id: 'enjoy', label: 'Disfrutar', emoji: '😊' },
      { id: 'release', label: 'Descargar', emoji: '💥' },
    ],
  },
  {
    id: 'company',
    eyebrow: 'Pregunta 2 de 3',
    title: '¿Cómo vas a rodar?',
    options: [
      { id: 'class', label: 'En clase', emoji: '🛼' },
      { id: 'friends', label: 'Con amigos', emoji: '🤝' },
      { id: 'solo', label: 'A solas', emoji: '🌙' },
    ],
  },
  {
    id: 'vibe',
    eyebrow: 'Pregunta 3 de 3',
    title: '¿Qué vibra te representa?',
    options: [
      { id: 'party', label: 'Fiesta', emoji: '🔥' },
      { id: 'nostalgia', label: 'Nostalgia', emoji: '💿' },
      { id: 'emotion', label: 'Emoción', emoji: '❤️' },
    ],
  },
]

const PLAYLISTS = [
  {
    id: '5rVVCmRXRAcuNZXQBg0tgJ',
    label: 'PR Session',
    shortLabel: 'PR Session',
    eyebrow: 'La banda sonora de Punta Rollers',
    description:
      'Una playlist colaborativa creada con los alumnos de PR. Cada uno sumó canciones que lo representan, lo motivan o simplemente quiere escuchar durante las clases.',
    when:
      'Para los días de clase, entrenamientos grupales y momentos en los que querés sentir que rodás acompañado.',
    energy: 4,
    distance: '6–20 km',
    mood: 'Comunidad, energía y pertenencia',
    moods: ['all', 'happy', 'motivated', 'competition', 'friends', 'distance'],
    accent: '#f0cf70',
    accent2: '#ff8f5a',
    accentSoft: 'rgba(240, 207, 112, 0.18)',
    glow: 'rgba(240, 207, 112, 0.25)',
    icon: '💙',
    badge: 'Creada entre todos',
    recommendation: 'Hoy puede sonar la canción de alguien que rueda a tu lado.',
  },
  {
    id: '5Mq85OCh1KA3azpMnTJgSq',
    label: 'MTV Hits 1 · OldSchool Eras',
    shortLabel: 'MTV Hits',
    eyebrow: 'La época dorada de la tele musical',
    description:
      'Himnos que alguna vez descubrimos mirando videoclips, esperando nuestro tema favorito y creyendo que MTV nunca iba a cambiar.',
    when:
      'Cuando querés entrenar con actitud, nostalgia y una energía que te hace sentir protagonista de tu propio videoclip.',
    energy: 4,
    distance: '8–18 km',
    mood: 'Nostalgia, actitud y libertad',
    moods: ['all', 'happy', 'motivated', 'night', 'friends'],
    accent: '#9c7cff',
    accent2: '#5b8cff',
    accentSoft: 'rgba(156, 124, 255, 0.18)',
    glow: 'rgba(156, 124, 255, 0.24)',
    icon: '📺',
    badge: 'Old school',
    recommendation: 'Subí el volumen: hoy la pista se convierte en videoclip.',
  },
  {
    id: '05gmyPhOhHGAhvzvH8mJ93',
    label: 'Así Sonaban los 2000s',
    shortLabel: 'Los 2000s',
    eyebrow: 'Volver sin pedir permiso',
    description:
      'Pop, hits y recuerdos de una década que sonaba en el MP3, el cyber, los cumpleaños y cada salida con amigos.',
    when:
      'Cuando necesitás levantar el ánimo, cantar sin vergüenza y sumar kilómetros con una sonrisa.',
    energy: 4,
    distance: '6–16 km',
    mood: 'Diversión, recuerdos y buen humor',
    moods: ['all', 'happy', 'motivated', 'friends'],
    accent: '#65d7ff',
    accent2: '#48f0c4',
    accentSoft: 'rgba(101, 215, 255, 0.17)',
    glow: 'rgba(101, 215, 255, 0.24)',
    icon: '💿',
    badge: 'Pura nostalgia',
    recommendation: 'Poné play y volvé a esa época en la que todo parecía más simple.',
  },
  {
    id: '4y73FZYgyEVOmzxIfRZiM5',
    label: 'Reggaetón del Viejito 👌',
    shortLabel: 'Reggaetón',
    eyebrow: 'Perreo con memoria',
    description:
      'Reggaetón de antes, del que sabíamos de principio a fin y que todavía activa algo apenas suena el primer segundo.',
    when:
      'Para entrar en calor, entrenar con ritmo, compartir una rodada o convertir una clase en una fiesta.',
    energy: 5,
    distance: '5–15 km',
    mood: 'Ritmo, seguridad y picardía',
    moods: ['all', 'happy', 'motivated', 'competition', 'night', 'friends'],
    accent: '#ff7a59',
    accent2: '#ffcf4a',
    accentSoft: 'rgba(255, 122, 89, 0.18)',
    glow: 'rgba(255, 122, 89, 0.25)',
    icon: '🔥',
    badge: 'Energía alta',
    recommendation: 'Ideal para una rodada donde nadie se queda quieto.',
  },
  {
    id: '0HV6hNSFb71KfobG6UJXZF',
    label: 'Millennials Dramáticos',
    shortLabel: 'Dramáticos',
    eyebrow: 'Sentirlo todo también cuenta',
    description:
      'Canciones para cantar como si hubieras protagonizado cinco novelas, tres despedidas y un mensaje que nunca llegó.',
    when:
      'Cuando alguien no respondió, necesitás descargar la cabeza o querés transformar el drama en kilómetros.',
    energy: 3,
    distance: '6–12 km',
    mood: 'Catarsis, emoción y liberación',
    moods: ['all', 'low', 'night', 'calm'],
    accent: '#ff5f83',
    accent2: '#c45cff',
    accentSoft: 'rgba(255, 95, 131, 0.18)',
    glow: 'rgba(255, 95, 131, 0.25)',
    icon: '💔',
    badge: 'Catarsis millennial',
    recommendation: 'Que duela la canción, no las piernas.',
  },
  {
    id: '77sFrL35HvQQOA1MlrDbbM',
    label: 'Millennials · Latin Era',
    shortLabel: 'Latin Era',
    eyebrow: 'Latinoamérica en modo recuerdo',
    description:
      'Pop latino, baladas y canciones que marcaron una generación entera entre radios, novelas, fiestas y discos grabados.',
    when:
      'Cuando querés cantar, recordar y rodar con una energía cercana, cálida y completamente nuestra.',
    energy: 3,
    distance: '7–16 km',
    mood: 'Calidez, alegría y conexión',
    moods: ['all', 'happy', 'calm', 'friends', 'night'],
    accent: '#55e6b1',
    accent2: '#54a8ff',
    accentSoft: 'rgba(85, 230, 177, 0.17)',
    glow: 'rgba(85, 230, 177, 0.24)',
    icon: '🌎',
    badge: 'Latin memories',
    recommendation: 'Una rodada para cantar fuerte y pensar menos.',
  },
  {
    id: '6SvoXxfxviMF6CvBF479o3',
    label: 'Nostalgia PR',
    shortLabel: 'Nostalgia PR',
    eyebrow: 'Recuerdos que también ruedan',
    description:
      'Una mezcla emocional para volver a canciones, etapas y momentos que todavía viven en algún rincón de nosotros.',
    when:
      'Para rodar al atardecer, despejarte después de un día largo o regalarte una salida sin presión.',
    energy: 2,
    distance: '8–15 km',
    mood: 'Calma, memoria y aire libre',
    moods: ['all', 'low', 'calm', 'night', 'distance'],
    accent: '#ffb84d',
    accent2: '#ff7f8d',
    accentSoft: 'rgba(255, 184, 77, 0.18)',
    glow: 'rgba(255, 184, 77, 0.24)',
    icon: '🌅',
    badge: 'Para bajar un cambio',
    recommendation: 'Hoy no hace falta correr: alcanza con seguir rodando.',
  },
  {
    id: '',
    label: '❤️🎸 Rock Para El Alma',
    shortLabel: 'Rock Para El Alma',
    eyebrow: 'Respirar, sentir y seguir',
    description:
      'Rock para esos días en los que necesitás bajar un cambio, ordenar la cabeza y dejar que la ruta haga el resto.',
    when:
      'Cuando querés rodar solo, mirar el atardecer, pensar con calma o recomponerte después de un día pesado.',
    energy: 3,
    distance: '8–15 km',
    mood: 'Introspección, fuerza y libertad',
    moods: ['all', 'low', 'calm', 'night', 'distance'],
    accent: '#ef6f6c',
    accent2: '#ffb054',
    accentSoft: 'rgba(239, 111, 108, 0.18)',
    glow: 'rgba(239, 111, 108, 0.24)',
    icon: '🎸',
    badge: 'Rock & corazón',
    recommendation: 'Respirá. No todo entrenamiento consiste en ir más rápido.',
  },
]

const DAILY_PHRASES = [
  'Cada entrenamiento tiene una banda sonora.',
  'Ajustá el casco. Elegí tu canción. Salí a rodar.',
  'Hoy puede ser un gran día para sumar kilómetros.',
  'La música cambia el ritmo. Vos cambiás la historia.',
  'Ponete los patines. La música hace el resto.',
  'No hace falta correr para avanzar.',
]

function spotifyUrl(id) {
  return `https://open.spotify.com/playlist/${id}`
}

function spotifyUri(id) {
  return `spotify:playlist:${id}`
}

function getDayIndex(length) {
  const now = new Date()
  const seed = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`)
  return seed % length
}

function extractSpotifyPlaylistId(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const uriMatch = raw.match(/^spotify:playlist:([A-Za-z0-9]+)$/i)
  if (uriMatch) return uriMatch[1]
  const urlMatch = raw.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/i)
  return urlMatch?.[1] || ''
}

function initials(name) {
  return String(name || 'PR')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function PlayIcon({ size = 22, pause = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {pause ? (
        <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>
      ) : (
        <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.3-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
      )}
    </svg>
  )
}

function ExternalIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>
}

function ChevronIcon({ up = false }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={up ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></svg>
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>
}

function EnergyDots({ value, accent }) {
  return <div className="flex items-center gap-1.5" aria-label={`Energía ${value} de 5`}>
    {[1,2,3,4,5].map((item)=><span key={item} className="h-1.5 w-5 rounded-full" style={{background:item<=value?accent:'rgba(255,255,255,.09)',boxShadow:item<=value?`0 0 10px ${accent}`:'none'}} />)}
  </div>
}

function Equalizer({ accent, active }) {
  const heights = [48,78,58,92,52,74,38,86,62,96,51,71]
  return <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
    {heights.map((height,index)=><span key={index} className="w-[3px] origin-bottom rounded-full opacity-85" style={{height:`${height}%`,background:accent,boxShadow:active?`0 0 9px ${accent}`:'none',animation:active?`prMusicEq ${620+(index%5)*120}ms ease-in-out ${index*45}ms infinite alternate`:'none'}} />)}
  </div>
}

function PlaylistArtwork({ playlist, index, compact = false }) {
  return <div className={`relative flex-shrink-0 overflow-hidden border border-white/10 ${compact?'h-[92px] w-[92px] rounded-[24px]':'aspect-square w-full rounded-[32px]'}`} style={{background:`radial-gradient(circle at 20% 18%, ${playlist.accent}52, transparent 31%),radial-gradient(circle at 82% 82%, ${playlist.accent2}46, transparent 35%),linear-gradient(145deg,#171720 0%,#0a0a0f 58%,${playlist.accentSoft})`,boxShadow:`0 22px 65px ${playlist.glow}`}}>
    <div className="absolute -right-[22%] -top-[22%] h-[72%] w-[72%] rounded-full border border-white/[.09]" />
    <div className="absolute inset-[15%] rounded-full border border-white/[.07]" />
    <div className="absolute bottom-[12%] left-[12%] right-[12%] top-[12%] rounded-full border border-white/[.035]" />
    <div className="absolute inset-0 flex flex-col justify-between p-3.5">
      <div className="flex items-start justify-between">
        <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[8px] font-black tracking-[.17em]" style={{color:playlist.accent}}>PR</span>
        <span className="text-xl">{playlist.icon}</span>
      </div>
      <div>
        {!compact && <Equalizer accent={playlist.accent} active={false} />}
        <p className={`${compact?'text-[11px]':'text-[18px]'} mt-1 font-display font-black leading-[.95] text-white`}>{playlist.shortLabel}</p>
        <p className="mt-1 text-[7px] font-black uppercase tracking-[.17em] text-white/28">PR MUSIC · {String(index+1).padStart(2,'0')}</p>
      </div>
    </div>
  </div>
}

function MoodChip({ mood, selected, accent, onClick }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className="flex min-h-10 flex-shrink-0 items-center gap-2 rounded-full border px-3.5 text-[11px] font-bold transition-all active:scale-[.97]" style={{color:selected?'#08090c':'rgba(255,255,255,.55)',background:selected?accent:'rgba(255,255,255,.035)',borderColor:selected?accent:'rgba(255,255,255,.075)',boxShadow:selected?`0 10px 24px ${accent}32`:'none'}}><span>{mood.emoji}</span>{mood.label}</button>
}

function ProfileBubble({ src, name, size = 'md' }) {
  const dimension = size === 'sm' ? 'h-8 w-8 text-[9px]' : 'h-10 w-10 text-[10px]'
  if (src) return <img src={src} alt="" className={`${dimension} rounded-full border border-white/10 object-cover`} />
  return <span className={`${dimension} grid place-items-center rounded-full border border-white/10 bg-white/[.06] font-black text-white/65`}>{initials(name)}</span>
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
    <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[30px] border border-white/[.1] bg-[#111116] p-5 shadow-2xl" onClick={(event)=>event.stopPropagation()}>
      {children}
    </div>
  </div>
}

function SpotifyPlayer({ playlist, accent, isPlaying, setIsPlaying, onControllerReady }) {
  const hostRef = useRef(null)
  const controllerRef = useRef(null)
  const apiRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(()=>{
    let cancelled = false
    const host = hostRef.current
    if (!host) return undefined

    function create(IFrameAPI) {
      if (cancelled || !hostRef.current || !playlist.id || controllerRef.current) return
      apiRef.current = IFrameAPI
      IFrameAPI.createController(hostRef.current, { width: '100%', height: 152, uri: spotifyUri(playlist.id), theme: 'dark' }, (controller)=>{
        if (cancelled) return
        controllerRef.current = controller
        setReady(true)
        setFailed(false)
        onControllerReady?.(controller)
        controller.addListener?.('playback_update', (event)=>{
          const paused = event?.data?.isPaused
          if (typeof paused === 'boolean') setIsPlaying(!paused)
        })
      })
    }

    if (window.__prSpotifyIframeAPI) {
      create(window.__prSpotifyIframeAPI)
      return ()=>{ cancelled = true }
    }

    const previous = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (IFrameAPI)=>{
      window.__prSpotifyIframeAPI = IFrameAPI
      if (typeof previous === 'function') previous(IFrameAPI)
      create(IFrameAPI)
    }

    let script = document.querySelector('script[data-pr-spotify-iframe-api="1"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      script.dataset.prSpotifyIframeApi = '1'
      script.onerror = ()=>{ if (!cancelled) setFailed(true) }
      document.body.appendChild(script)
    }

    const fallbackTimer = window.setTimeout(()=>{
      if (!cancelled && !controllerRef.current && !window.__prSpotifyIframeAPI) setFailed(true)
    }, 9000)

    return ()=>{
      cancelled = true
      window.clearTimeout(fallbackTimer)
    }
  }, [])

  useEffect(()=>{
    setIsPlaying(false)
    if (!playlist.id) return
    if (controllerRef.current) {
      try {
        controllerRef.current.loadUri(spotifyUri(playlist.id))
        setReady(true)
        setFailed(false)
      } catch {
        setFailed(true)
      }
    }
  }, [playlist.id, setIsPlaying])

  function toggle() {
    if (!playlist.id) return
    if (controllerRef.current) {
      try {
        controllerRef.current.togglePlay()
        return
      } catch {
        setFailed(true)
      }
    }
    hostRef.current?.querySelector('iframe')?.focus()
  }

  return <div className="relative overflow-hidden rounded-[28px] border border-white/[.09] bg-[#0b0b10] shadow-[0_24px_70px_rgba(0,0,0,.35)]">
    <div className="relative overflow-hidden px-4 pb-4 pt-4" style={{background:`radial-gradient(circle at 92% 0%,${playlist.glow},transparent 42%),linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.012))`}}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggle} disabled={!playlist.id} className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full text-[#08090c] shadow-[0_14px_32px_rgba(0,0,0,.35)] transition active:scale-[.94] disabled:opacity-45" style={{background:playlist.accent,boxShadow:`0 12px 32px ${playlist.glow}`}} aria-label={isPlaying?'Pausar':'Reproducir'}><PlayIcon size={21} pause={isPlaying}/></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isPlaying?'animate-pulse':''}`} style={{background:isPlaying?playlist.accent:'rgba(255,255,255,.25)',boxShadow:isPlaying?`0 0 12px ${playlist.accent}`:'none'}} />
            <p className="text-[8px] font-black uppercase tracking-[.17em]" style={{color:isPlaying?playlist.accent:'rgba(255,255,255,.32)'}}>{isPlaying?'Sonando ahora':ready?'Listo para rodar':'Preparando Spotify'}</p>
          </div>
          <p className="mt-1 truncate font-display text-lg font-black text-white">{playlist.label}</p>
          <p className="mt-0.5 text-[9px] text-white/30">Spotify dentro de PR · un toque para reproducir</p>
        </div>
        <Equalizer accent={playlist.accent} active={isPlaying}/>
      </div>
    </div>

    {playlist.id ? <div className="border-t border-white/[.06] bg-black/20 p-2.5">
      <div ref={hostRef} className="min-h-[152px] overflow-hidden rounded-[18px] bg-black/25" />
      {failed && <div className="mt-2 rounded-[16px] border border-white/[.07] bg-white/[.025] p-3 text-center text-[10px] text-white/38">Spotify no terminó de cargar en este navegador. Podés abrir la playlist directamente.</div>}
    </div> : <div className="border-t border-white/[.06] px-5 py-7 text-center"><p className="font-display text-lg font-black text-white">Playlist en preparación</p><p className="mt-1 text-xs text-white/35">El diseño está listo; falta incorporar su enlace de Spotify.</p></div>}

    <div className="flex items-center justify-between border-t border-white/[.055] px-4 py-3">
      <p className="text-[9px] text-white/26">Las canciones se actualizan desde Spotify.</p>
      {playlist.id && <a href={spotifyUrl(playlist.id)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[9px] font-black" style={{color:playlist.accent}}>Abrir Spotify <ExternalIcon/></a>}
    </div>
  </div>
}

export default function MusicPage() {
  const { user } = useAuth()
  const dailyIndex = useMemo(()=>getDayIndex(PLAYLISTS.length),[])
  const dailyPhrase = useMemo(()=>DAILY_PHRASES[getDayIndex(DAILY_PHRASES.length)],[])

  const [selectedId,setSelectedId] = useState(PLAYLISTS[dailyIndex].label)
  const [selectedMood,setSelectedMood] = useState('all')
  const [isPlaying,setIsPlaying] = useState(false)
  const [testOpen,setTestOpen] = useState(false)
  const [testStep,setTestStep] = useState(0)
  const [testAnswers,setTestAnswers] = useState({})
  const [testResult,setTestResult] = useState(null)
  const [recommendOpen,setRecommendOpen] = useState(false)
  const [recommendForm,setRecommendForm] = useState({ url:'', name:'', note:'' })
  const [recommendState,setRecommendState] = useState({ loading:false, message:'', ok:false })
  const [communitySuggestions,setCommunitySuggestions] = useState([])
  const [pendingSuggestions,setPendingSuggestions] = useState([])
  const [suggestionsAvailable,setSuggestionsAvailable] = useState(true)

  const selectedIndex = useMemo(()=>PLAYLISTS.findIndex((playlist)=>playlist.label===selectedId),[selectedId])
  const selectedPlaylist = PLAYLISTS[selectedIndex] || PLAYLISTS[0]
  const dailyPlaylist = PLAYLISTS[dailyIndex]
  const isAdmin = user?.role === 'admin'

  const orderedPlaylists = useMemo(()=>{
    if (selectedMood === 'all') return PLAYLISTS
    return [...PLAYLISTS].sort((a,b)=>Number(b.moods.includes(selectedMood))-Number(a.moods.includes(selectedMood)))
  },[selectedMood])

  useEffect(()=>{
    let alive = true
    async function loadSuggestions() {
      const approved = await supabase.from('pr_music_suggestions').select('id,profile_id,profile_name,profile_photo,spotify_url,spotify_playlist_id,playlist_name,note,status,created_at').eq('status','approved').order('created_at',{ascending:false}).limit(12)
      if (!alive) return
      if (approved.error) {
        if (approved.error.code === '42P01' || /does not exist/i.test(approved.error.message || '')) setSuggestionsAvailable(false)
      } else {
        setSuggestionsAvailable(true)
        setCommunitySuggestions(approved.data || [])
      }

      if (isAdmin) {
        const pending = await supabase.from('pr_music_suggestions').select('*').eq('status','pending').order('created_at',{ascending:false}).limit(30)
        if (!alive) return
        if (!pending.error) setPendingSuggestions(pending.data || [])
      }
    }
    loadSuggestions()
    return ()=>{ alive = false }
  },[isAdmin])

  function selectPlaylist(label) {
    setSelectedId(label)
    setIsPlaying(false)
    window.setTimeout(()=>document.getElementById('pr-music-player')?.scrollIntoView({behavior:'smooth',block:'center'}),80)
  }

  function selectMood(moodId) {
    const playlistIndex = MOOD_RECOMMENDATIONS[moodId] ?? 0
    setSelectedMood(moodId)
    setSelectedId(PLAYLISTS[playlistIndex].label)
    setIsPlaying(false)
  }

  function answerTest(questionId,answerId) {
    const next={...testAnswers,[questionId]:answerId}
    setTestAnswers(next)
    if (testStep < TEST_QUESTIONS.length-1) { setTestStep((current)=>current+1); return }
    let resultIndex=0
    if (next.vibe==='party') resultIndex=3
    if (next.vibe==='nostalgia') resultIndex=2
    if (next.vibe==='emotion') resultIndex=4
    if (next.company==='class') resultIndex=0
    if (next.company==='solo'&&next.goal==='release') resultIndex=6
    if (next.company==='solo'&&next.vibe==='emotion') resultIndex=4
    if (next.company==='friends'&&next.vibe==='nostalgia') resultIndex=1
    if (next.goal==='enjoy'&&next.company==='friends') resultIndex=5
    const result=PLAYLISTS[resultIndex]
    setTestResult(result)
    setSelectedId(result.label)
  }

  function resetTest() { setTestStep(0); setTestAnswers({}); setTestResult(null) }

  async function submitRecommendation(event) {
    event.preventDefault()
    const spotifyPlaylistId=extractSpotifyPlaylistId(recommendForm.url)
    if (!spotifyPlaylistId) {
      setRecommendState({loading:false,ok:false,message:'Pegá un enlace válido de una playlist de Spotify.'})
      return
    }
    if (!user?.id) {
      setRecommendState({loading:false,ok:false,message:'Necesitás iniciar sesión para recomendar una playlist.'})
      return
    }

    setRecommendState({loading:true,ok:false,message:'Enviando recomendación…'})
    const profileName=[user.nombre,user.apellido].filter(Boolean).join(' ').trim() || 'Alumno PR'
    const { error } = await supabase.from('pr_music_suggestions').insert({
      profile_id:user.id,
      profile_name:profileName,
      profile_photo:user.foto || null,
      spotify_url:`https://open.spotify.com/playlist/${spotifyPlaylistId}`,
      spotify_playlist_id:spotifyPlaylistId,
      playlist_name:recommendForm.name.trim() || null,
      note:recommendForm.note.trim() || null,
    })

    if (error) {
      if (error.code === '42P01' || /does not exist/i.test(error.message || '')) {
        setSuggestionsAvailable(false)
        setRecommendState({loading:false,ok:false,message:'El buzón PR Music todavía necesita activar su tabla en Supabase.'})
      } else if (error.code === '23505') {
        setRecommendState({loading:false,ok:false,message:'Ya recomendaste esta playlist. La tenemos guardada 🙌'})
      } else {
        setRecommendState({loading:false,ok:false,message:'No pudimos enviar la recomendación. Probá nuevamente.'})
      }
      return
    }

    setRecommendState({loading:false,ok:true,message:'¡Enviada! PR la va a revisar antes de sumarla a la colección. 🎧'})
    setRecommendForm({url:'',name:'',note:''})
  }

  async function moderateSuggestion(id,status) {
    const { error } = await supabase.from('pr_music_suggestions').update({status,reviewed_at:new Date().toISOString()}).eq('id',id)
    if (error) return
    const item=pendingSuggestions.find((entry)=>entry.id===id)
    setPendingSuggestions((current)=>current.filter((entry)=>entry.id!==id))
    if (status==='approved'&&item) setCommunitySuggestions((current)=>[{...item,status:'approved'},...current].slice(0,12))
  }

  return <AppLayout title="PR Music" showBack>
    <style>{`@keyframes prMusicEq{from{transform:scaleY(.34);opacity:.46}to{transform:scaleY(1);opacity:1}} @keyframes prMusicFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-8px,0)}}`}</style>

    <div className="overflow-hidden pb-12">
      <section className="relative mx-4 mt-4 overflow-hidden rounded-[36px] border border-white/[.085] px-5 pb-5 pt-5 shadow-[0_30px_90px_rgba(0,0,0,.46)]" style={{background:`radial-gradient(circle at 86% 2%,${selectedPlaylist.glow},transparent 34%),radial-gradient(circle at 0% 95%,${selectedPlaylist.accentSoft},transparent 34%),linear-gradient(150deg,#16151d 0%,#0b0b10 52%,#08090d 100%)`}}>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/[.045]"/>
        <div className="absolute -right-5 top-7 h-40 w-40 rounded-full border border-white/[.045]"/>
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">El sonido de nuestra comunidad</p>
              <h1 className="mt-1 font-display text-[40px] font-black leading-none text-white">PR <span style={{color:selectedPlaylist.accent}}>MUSIC</span></h1>
              <p className="mt-3 max-w-[300px] text-[12px] leading-5 text-white/42">{dailyPhrase}</p>
            </div>
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[18px] border border-white/[.08] bg-black/20 text-xl" style={{color:selectedPlaylist.accent,boxShadow:`0 10px 32px ${selectedPlaylist.glow}`}}>♫</div>
          </div>

          <div className="mt-5 grid grid-cols-[112px_1fr] items-center gap-4">
            <PlaylistArtwork playlist={selectedPlaylist} index={selectedIndex}/>
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[.17em]" style={{color:selectedPlaylist.accent}}>{selectedPlaylist.badge}</p>
              <h2 className="mt-1 font-display text-[22px] font-black leading-[1.03] text-white">{selectedPlaylist.label}</h2>
              <p className="mt-2 line-clamp-3 text-[10px] leading-[1.6] text-white/38">{selectedPlaylist.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/[.07] bg-black/20 px-2.5 py-1 text-[8px] font-bold text-white/45">🛼 {selectedPlaylist.distance}</span>
                <span className="rounded-full border border-white/[.07] bg-black/20 px-2.5 py-1 text-[8px] font-bold text-white/45">⚡ {selectedPlaylist.energy}/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pr-music-player" className="scroll-mt-24 px-4 pt-4">
        <SpotifyPlayer playlist={selectedPlaylist} accent={selectedPlaylist.accent} isPlaying={isPlaying} setIsPlaying={setIsPlaying}/>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3 px-5">
          <div><p className="section-label">Elegí según tu energía</p><h2 className="mt-1 font-display text-[25px] font-black text-white">¿Cómo te sentís hoy?</h2></div>
          <p className="pb-1 text-[9px] text-white/22">Deslizá →</p>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOODS.map((mood)=><MoodChip key={mood.id} mood={mood} selected={selectedMood===mood.id} accent={selectedPlaylist.accent} onClick={()=>selectMood(mood.id)}/>) }
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between gap-3 px-5">
          <div><p className="section-label">La colección oficial</p><h2 className="mt-1 font-display text-[25px] font-black text-white">Elegí tu banda sonora</h2></div>
          <p className="pb-1 text-[9px] text-white/22">{PLAYLISTS.filter((item)=>item.id).length} playlists</p>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {orderedPlaylists.map((playlist)=>{
            const index=PLAYLISTS.findIndex((item)=>item.label===playlist.label)
            const selected=playlist.label===selectedPlaylist.label
            return <button key={playlist.label} type="button" onClick={()=>selectPlaylist(playlist.label)} className={`w-[118px] flex-shrink-0 rounded-[25px] border p-2 text-left transition-all active:scale-[.97] ${selected?'border-white/20 bg-white/[.075]':'border-white/[.055] bg-white/[.02]'}`} style={{boxShadow:selected?`0 15px 38px ${playlist.glow}`:'none'}}>
              <PlaylistArtwork playlist={playlist} index={index} compact/>
              <p className="mt-2 truncate text-[8px] font-black uppercase tracking-[.12em]" style={{color:selected?playlist.accent:'rgba(255,255,255,.28)'}}>{playlist.badge}</p>
              <p className="mt-1 line-clamp-2 min-h-[32px] font-display text-[13px] font-black leading-tight text-white/88">{playlist.shortLabel}</p>
            </button>
          })}
        </div>
      </section>

      <section className="mx-4 mt-6">
        <button type="button" onClick={()=>selectPlaylist(dailyPlaylist.label)} className="relative w-full overflow-hidden rounded-[28px] border border-white/[.075] p-4 text-left active:scale-[.99]" style={{background:`radial-gradient(circle at 92% 12%,${dailyPlaylist.glow},transparent 35%),linear-gradient(140deg,${dailyPlaylist.accentSoft},rgba(255,255,255,.018) 58%,rgba(0,0,0,.18))`}}>
          <div className="relative flex items-center gap-3.5">
            <PlaylistArtwork playlist={dailyPlaylist} index={dailyIndex} compact/>
            <div className="min-w-0 flex-1"><p className="text-[8px] font-black uppercase tracking-[.18em]" style={{color:dailyPlaylist.accent}}>🎧 Soundtrack de hoy</p><h3 className="mt-1 font-display text-lg font-black text-white">{dailyPlaylist.label}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/38">{dailyPlaylist.recommendation}</p></div>
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-[#08090c]" style={{background:dailyPlaylist.accent,boxShadow:`0 10px 24px ${dailyPlaylist.glow}`}}><PlayIcon size={14}/></span>
          </div>
        </button>
      </section>

      <section className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={()=>setTestOpen(true)} className="relative overflow-hidden rounded-[26px] border border-white/[.075] bg-white/[.025] p-4 text-left active:scale-[.98]">
          <span className="text-2xl">🎚️</span><p className="mt-3 text-[8px] font-black uppercase tracking-[.15em] text-white/27">No sé qué escuchar</p><h3 className="mt-1 font-display text-lg font-black leading-tight text-white">PR elige por vos</h3><p className="mt-2 text-[9px] leading-4 text-white/30">3 preguntas. 1 playlist.</p>
        </button>
        <button type="button" onClick={()=>setRecommendOpen(true)} className="relative overflow-hidden rounded-[26px] border border-violet-300/15 p-4 text-left active:scale-[.98]" style={{background:'radial-gradient(circle at 90% 0%,rgba(156,124,255,.17),transparent 42%),rgba(255,255,255,.025)'}}>
          <span className="text-2xl">🎧</span><p className="mt-3 text-[8px] font-black uppercase tracking-[.15em] text-violet-300/70">Tu música también cuenta</p><h3 className="mt-1 font-display text-lg font-black leading-tight text-white">Recomendá una playlist</h3><p className="mt-2 text-[9px] leading-4 text-white/30">Pegá el link. PR la revisa.</p>
        </button>
      </section>

      <section className="mx-4 mt-4 rounded-[28px] border border-white/[.065] bg-white/[.02] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[16px] border border-white/[.07] bg-white/[.035] text-lg">⚡</span>
          <div><p className="text-[8px] font-black uppercase tracking-[.16em] text-white/27">Ideal para esta playlist</p><p className="mt-1 text-[12px] font-bold text-white/72">{selectedPlaylist.mood}</p><p className="mt-1 text-[10px] leading-5 text-white/35">{selectedPlaylist.when}</p><div className="mt-3"><EnergyDots value={selectedPlaylist.energy} accent={selectedPlaylist.accent}/></div></div>
        </div>
      </section>

      {communitySuggestions.length>0 && <section className="mt-7">
        <div className="px-5"><p className="section-label">Elegidas por alumnos PR</p><h2 className="mt-1 font-display text-[25px] font-black text-white">La comunidad recomienda</h2><p className="mt-1 text-[10px] text-white/28">Solo aparecen después de ser revisadas por PR.</p></div>
        <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {communitySuggestions.map((item)=><a key={item.id} href={item.spotify_url} target="_blank" rel="noreferrer" className="w-[210px] flex-shrink-0 rounded-[24px] border border-white/[.07] bg-white/[.025] p-3 active:scale-[.98]">
            <div className="flex items-center gap-2.5"><ProfileBubble src={item.profile_photo} name={item.profile_name}/><div className="min-w-0"><p className="truncate text-[10px] font-black text-white/72">{item.profile_name}</p><p className="mt-0.5 text-[8px] text-violet-300/60">recomienda</p></div></div>
            <div className="mt-3 rounded-[17px] border border-violet-300/10 bg-violet-400/[.05] p-3"><p className="line-clamp-2 font-display text-[15px] font-black text-white">{item.playlist_name || 'Playlist de Spotify'}</p>{item.note&&<p className="mt-1 line-clamp-2 text-[9px] leading-4 text-white/30">“{item.note}”</p>}<p className="mt-3 flex items-center gap-1.5 text-[8px] font-black text-violet-300">Abrir en Spotify <ExternalIcon/></p></div>
          </a>)}
        </div>
      </section>}

      {isAdmin && pendingSuggestions.length>0 && <section className="mx-4 mt-7 rounded-[30px] border border-amber-300/15 bg-amber-300/[.035] p-4">
        <p className="text-[8px] font-black uppercase tracking-[.17em] text-amber-300">Solo visible para Admin</p><h2 className="mt-1 font-display text-xl font-black text-white">Playlists por revisar · {pendingSuggestions.length}</h2>
        <div className="mt-4 space-y-2.5">{pendingSuggestions.map((item)=><div key={item.id} className="rounded-[20px] border border-white/[.07] bg-black/20 p-3"><div className="flex items-center gap-2.5"><ProfileBubble src={item.profile_photo} name={item.profile_name} size="sm"/><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black text-white/75">{item.profile_name}</p><p className="truncate text-[9px] text-white/30">{item.playlist_name || item.spotify_url}</p></div><a href={item.spotify_url} target="_blank" rel="noreferrer" className="text-violet-300"><ExternalIcon/></a></div>{item.note&&<p className="mt-2 text-[9px] leading-4 text-white/34">{item.note}</p>}<div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={()=>moderateSuggestion(item.id,'approved')} className="rounded-xl bg-emerald-400/90 py-2 text-[9px] font-black text-black">Aprobar</button><button type="button" onClick={()=>moderateSuggestion(item.id,'rejected')} className="rounded-xl border border-white/[.08] bg-white/[.035] py-2 text-[9px] font-black text-white/50">Descartar</button></div></div>)}</div>
      </section>}

      {!suggestionsAvailable && isAdmin && <div className="mx-5 mt-5 rounded-[18px] border border-amber-300/12 bg-amber-300/[.035] px-4 py-3 text-[9px] leading-4 text-amber-100/55">El módulo de recomendaciones está diseñado pero la tabla <strong>pr_music_suggestions</strong> todavía no está activa en Supabase.</div>}

      <div className="mx-7 mt-6 flex items-center gap-3 rounded-[22px] border border-white/[.05] bg-white/[.018] px-4 py-3.5"><span className="text-lg">🎧</span><p className="text-[9px] leading-relaxed text-white/25">PR Music usa Spotify embebido. Las canciones y los cambios de cada playlist se actualizan automáticamente desde Spotify.</p></div>
    </div>

    <Modal open={testOpen} onClose={()=>setTestOpen(false)}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.17em]" style={{color:selectedPlaylist.accent}}>Test PR Music</p><h2 className="mt-1 font-display text-[26px] font-black text-white">Encontrá tu sesión ideal</h2></div><button type="button" onClick={()=>setTestOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/[.08] bg-white/[.035] text-white/45"><CloseIcon/></button></div>
      {!testResult ? <div className="mt-5"><div className="mb-4 flex gap-2">{TEST_QUESTIONS.map((question,index)=><span key={question.id} className="h-1.5 flex-1 rounded-full" style={{background:index<=testStep?selectedPlaylist.accent:'rgba(255,255,255,.08)',boxShadow:index<=testStep?`0 0 10px ${selectedPlaylist.accent}`:'none'}}/>)}</div><p className="text-[8px] font-black uppercase tracking-[.16em]" style={{color:selectedPlaylist.accent}}>{TEST_QUESTIONS[testStep].eyebrow}</p><h3 className="mt-1 font-display text-xl font-black text-white">{TEST_QUESTIONS[testStep].title}</h3><div className="mt-4 grid grid-cols-3 gap-2">{TEST_QUESTIONS[testStep].options.map((option)=><button key={option.id} type="button" onClick={()=>answerTest(TEST_QUESTIONS[testStep].id,option.id)} className="min-h-[92px] rounded-[20px] border border-white/[.08] bg-white/[.025] px-2 py-3 text-center active:scale-[.96]"><span className="block text-2xl">{option.emoji}</span><span className="mt-2 block text-[10px] font-bold text-white/65">{option.label}</span></button>)}</div></div> : <div className="mt-5 rounded-[24px] border border-white/[.08] bg-white/[.025] p-4"><p className="text-[8px] font-black uppercase tracking-[.18em]" style={{color:testResult.accent}}>Tu resultado</p><div className="mt-3 flex items-center gap-3"><PlaylistArtwork playlist={testResult} index={PLAYLISTS.findIndex((item)=>item.label===testResult.label)} compact/><div className="min-w-0 flex-1"><h3 className="font-display text-xl font-black text-white">{testResult.label}</h3><p className="mt-1 text-[10px] leading-4 text-white/36">{testResult.recommendation}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>{setTestOpen(false);window.setTimeout(()=>document.getElementById('pr-music-player')?.scrollIntoView({behavior:'smooth',block:'center'}),100)}} className="rounded-2xl py-3 text-[10px] font-black text-black" style={{background:testResult.accent}}>Ir al reproductor</button><button type="button" onClick={resetTest} className="rounded-2xl border border-white/[.08] bg-white/[.03] py-3 text-[10px] font-black text-white/45">Otra vez</button></div></div>}
    </Modal>

    <Modal open={recommendOpen} onClose={()=>setRecommendOpen(false)}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.17em] text-violet-300">Comunidad PR Music</p><h2 className="mt-1 font-display text-[26px] font-black text-white">Recomendá una playlist</h2><p className="mt-2 text-[10px] leading-5 text-white/35">Pegá el link de Spotify. PR la revisa y, si encaja con la colección, puede aparecer recomendada por vos.</p></div><button type="button" onClick={()=>setRecommendOpen(false)} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/[.08] bg-white/[.035] text-white/45"><CloseIcon/></button></div>

      <form onSubmit={submitRecommendation} className="mt-5 space-y-3">
        <label className="block"><span className="text-[8px] font-black uppercase tracking-[.14em] text-white/28">Link de playlist *</span><input value={recommendForm.url} onChange={(event)=>setRecommendForm((current)=>({...current,url:event.target.value}))} placeholder="https://open.spotify.com/playlist/..." className="mt-2 min-h-12 w-full rounded-[17px] border border-white/[.08] bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-violet-300/35"/></label>
        <label className="block"><span className="text-[8px] font-black uppercase tracking-[.14em] text-white/28">Nombre <span className="normal-case tracking-normal text-white/16">(opcional)</span></span><input value={recommendForm.name} onChange={(event)=>setRecommendForm((current)=>({...current,name:event.target.value}))} placeholder="Ej: Pop para rodar de noche" maxLength={90} className="mt-2 min-h-12 w-full rounded-[17px] border border-white/[.08] bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-violet-300/35"/></label>
        <label className="block"><span className="text-[8px] font-black uppercase tracking-[.14em] text-white/28">¿Por qué la recomendás? <span className="normal-case tracking-normal text-white/16">(opcional)</span></span><textarea value={recommendForm.note} onChange={(event)=>setRecommendForm((current)=>({...current,note:event.target.value}))} placeholder="Contanos en una línea qué tiene de especial." maxLength={220} rows={3} className="mt-2 w-full resize-none rounded-[17px] border border-white/[.08] bg-black/25 px-3 py-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 focus:border-violet-300/35"/></label>

        {user && <div className="flex items-center gap-2.5 rounded-[17px] border border-white/[.06] bg-white/[.02] p-3"><ProfileBubble src={user.foto} name={[user.nombre,user.apellido].filter(Boolean).join(' ')} size="sm"/><p className="text-[9px] leading-4 text-white/34">Si PR la aprueba, va a aparecer como recomendada por <strong className="text-white/60">{user.nombre || 'vos'}</strong>.</p></div>}

        {recommendState.message&&<div className={`rounded-[16px] border px-3 py-2.5 text-[10px] leading-4 ${recommendState.ok?'border-emerald-300/15 bg-emerald-400/[.05] text-emerald-100/65':'border-amber-300/15 bg-amber-400/[.05] text-amber-100/60'}`}>{recommendState.message}</div>}
        <button type="submit" disabled={recommendState.loading} className="min-h-12 w-full rounded-[17px] bg-violet-400 text-xs font-black text-black shadow-[0_14px_34px_rgba(156,124,255,.22)] disabled:opacity-50">{recommendState.loading?'Enviando…':'Enviar a PR Music'}</button>
      </form>
    </Modal>
  </AppLayout>
}
