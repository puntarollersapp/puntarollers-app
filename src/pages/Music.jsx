import { useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'

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

function spotifyEmbedUrl(id) {
  return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`
}

function getDayIndex(length) {
  const now = new Date()
  const seed = Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`
  )

  return seed % length
}

function PlayIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.3-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
    </svg>
  )
}

function HeadphonesIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M18 19v-5a2 2 0 0 1 2-2h1v7a2 2 0 0 1-2 2h-1Z" />
      <path d="M6 19v-5a2 2 0 0 0-2-2H3v7a2 2 0 0 0 2 2h1Z" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  )
}

function Equalizer({ accent }) {
  const heights = [38, 62, 48, 78, 55, 88, 44, 70, 34, 58, 82, 46]

  return (
    <div className="flex h-14 items-end justify-center gap-1" aria-hidden="true">
      {heights.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-1 rounded-full opacity-80"
          style={{
            height: `${height}%`,
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
      ))}
    </div>
  )
}

function EnergyDots({ value, accent }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Energía ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((item) => (
        <span
          key={item}
          className="h-1.5 w-5 rounded-full"
          style={{
            background: item <= value ? accent : 'rgba(255,255,255,.1)',
            boxShadow: item <= value ? `0 0 10px ${accent}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

function PlaylistArtwork({ playlist, index, compact = false }) {
  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden border border-white/10 ${
        compact ? 'h-[76px] w-[76px] rounded-[22px]' : 'aspect-square w-full rounded-[30px]'
      }`}
      style={{
        background: `radial-gradient(circle at 20% 18%, ${playlist.accentSoft}, transparent 34%), radial-gradient(circle at 82% 78%, ${playlist.accent2}30, transparent 34%), linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.018) 55%, ${playlist.accentSoft})`,
        boxShadow: `0 24px 70px ${playlist.glow}`,
      }}
    >
      <div className="absolute -right-[18%] -top-[18%] h-[68%] w-[68%] rounded-full border border-white/10" />
      <div className="absolute -bottom-[28%] -left-[22%] h-[75%] w-[75%] rounded-full border border-white/[0.07]" />
      <div className="absolute inset-[17%] rounded-full border border-white/[0.08]" />

      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <span
            className="rounded-full border px-2 py-1 text-[9px] font-black tracking-[0.17em]"
            style={{
              borderColor: `${playlist.accent}38`,
              color: playlist.accent,
              background: 'rgba(5,5,8,.34)',
            }}
          >
            PR
          </span>
          <span className="font-display text-lg" aria-hidden="true">
            {playlist.icon}
          </span>
        </div>

        {!compact && (
          <div>
            <Equalizer accent={playlist.accent} />
            <p className="mt-2 font-display text-lg font-bold leading-tight text-white">
              {playlist.shortLabel}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/35">
              PR Music · {String(index + 1).padStart(2, '0')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MoodChip({ mood, selected, accent, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex min-h-11 flex-shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all active:scale-[0.96]"
      style={{
        color: selected ? '#09090c' : 'rgba(255,255,255,.58)',
        background: selected ? accent : 'rgba(255,255,255,.035)',
        borderColor: selected ? accent : 'rgba(255,255,255,.08)',
        boxShadow: selected ? `0 10px 26px ${accent}35` : 'none',
      }}
    >
      <span aria-hidden="true">{mood.emoji}</span>
      {mood.label}
    </button>
  )
}

function PlaylistSelector({ playlist, index, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-[132px] flex-shrink-0 rounded-[25px] border p-2.5 text-left transition-all duration-300 active:scale-[0.97] ${
        selected
          ? 'border-white/20 bg-white/[0.085] shadow-[0_15px_40px_rgba(0,0,0,.28)]'
          : 'border-white/[0.065] bg-white/[0.025]'
      }`}
    >
      <PlaylistArtwork playlist={playlist} index={index} compact />
      <p
        className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.13em]"
        style={{ color: selected ? playlist.accent : 'rgba(255,255,255,.28)' }}
      >
        {playlist.badge}
      </p>
      <p className="mt-1 line-clamp-2 min-h-[36px] font-display text-sm font-bold leading-tight text-white/88">
        {playlist.shortLabel}
      </p>
    </button>
  )
}

export default function MusicPage() {
  const dailyIndex = useMemo(() => getDayIndex(PLAYLISTS.length), [])
  const dailyPhrase = useMemo(() => DAILY_PHRASES[getDayIndex(DAILY_PHRASES.length)], [])

  const [selectedId, setSelectedId] = useState(PLAYLISTS[dailyIndex].label)
  const [selectedMood, setSelectedMood] = useState('all')
  const [playerVisible, setPlayerVisible] = useState(false)
  const [testStep, setTestStep] = useState(0)
  const [testAnswers, setTestAnswers] = useState({})
  const [testResult, setTestResult] = useState(null)

  const orderedPlaylists = useMemo(() => {
    if (selectedMood === 'all') {
      return PLAYLISTS
    }

    return [...PLAYLISTS].sort((a, b) => {
      const aMatches = a.moods.includes(selectedMood) ? 1 : 0
      const bMatches = b.moods.includes(selectedMood) ? 1 : 0
      return bMatches - aMatches
    })
  }, [selectedMood])

  const selectedIndex = useMemo(
    () => PLAYLISTS.findIndex((playlist) => playlist.label === selectedId),
    [selectedId]
  )

  const selectedPlaylist = PLAYLISTS[selectedIndex] || PLAYLISTS[0]
  const dailyPlaylist = PLAYLISTS[dailyIndex]

  function selectPlaylist(label) {
    setSelectedId(label)
    setPlayerVisible(false)
  }

  function selectMood(moodId) {
    const playlistIndex = MOOD_RECOMMENDATIONS[moodId] ?? 0
    setSelectedMood(moodId)
    selectPlaylist(PLAYLISTS[playlistIndex].label)
  }

  function answerTest(questionId, answerId) {
    const nextAnswers = { ...testAnswers, [questionId]: answerId }
    setTestAnswers(nextAnswers)

    if (testStep < TEST_QUESTIONS.length - 1) {
      setTestStep((current) => current + 1)
      return
    }

    let resultIndex = 0

    if (nextAnswers.vibe === 'party') resultIndex = 3
    if (nextAnswers.vibe === 'nostalgia') resultIndex = 2
    if (nextAnswers.vibe === 'emotion') resultIndex = 4
    if (nextAnswers.company === 'class') resultIndex = 0
    if (nextAnswers.company === 'solo' && nextAnswers.goal === 'release') resultIndex = 6
    if (nextAnswers.company === 'solo' && nextAnswers.vibe === 'emotion') resultIndex = 4
    if (nextAnswers.company === 'friends' && nextAnswers.vibe === 'nostalgia') resultIndex = 1
    if (nextAnswers.goal === 'enjoy' && nextAnswers.company === 'friends') resultIndex = 5

    const result = PLAYLISTS[resultIndex]
    setTestResult(result)
    selectPlaylist(result.label)
  }

  function resetTest() {
    setTestStep(0)
    setTestAnswers({})
    setTestResult(null)
  }

  function showPlayer() {
    if (!selectedPlaylist.id) {
      return
    }

    setPlayerVisible(true)
    window.setTimeout(() => {
      document
        .getElementById('pr-music-player')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <AppLayout title="PR Music" showBack>
      <div className="overflow-hidden pb-12">
        <section
          className="relative mx-4 mt-4 overflow-hidden rounded-[36px] border border-white/[0.08] px-5 pb-6 pt-5 shadow-[0_28px_90px_rgba(0,0,0,.42)] transition-all duration-500"
          style={{
            background: `radial-gradient(circle at 82% 8%, ${selectedPlaylist.glow}, transparent 32%), radial-gradient(circle at 5% 94%, ${selectedPlaylist.accentSoft}, transparent 36%), linear-gradient(150deg, rgba(255,255,255,.075), rgba(255,255,255,.018) 48%, rgba(0,0,0,.2))`,
          }}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/[0.05]" />
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/[0.06]" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">El sonido de nuestra comunidad</p>
                <h1 className="mt-1 font-display text-[38px] font-extrabold leading-none text-white">
                  PR <span style={{ color: selectedPlaylist.accent }}>MUSIC</span>
                </h1>
              </div>

              <div
                className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[18px] border"
                style={{
                  color: selectedPlaylist.accent,
                  borderColor: `${selectedPlaylist.accent}32`,
                  background: selectedPlaylist.accentSoft,
                }}
              >
                <HeadphonesIcon />
              </div>
            </div>

            <p className="mt-4 max-w-[325px] text-sm leading-relaxed text-white/52">
              {dailyPhrase}
            </p>

            <div className="mt-6 grid grid-cols-[128px_1fr] items-center gap-5">
              <PlaylistArtwork playlist={selectedPlaylist} index={selectedIndex} />

              <div className="min-w-0">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.17em]"
                  style={{ color: selectedPlaylist.accent }}
                >
                  {selectedPlaylist.eyebrow}
                </p>
                <h2 className="mt-1 font-display text-[22px] font-bold leading-tight text-white">
                  {selectedPlaylist.label}
                </h2>
                <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-white/44">
                  {selectedPlaylist.description}
                </p>

                <button
                  type="button"
                  onClick={showPlayer}
                  disabled={!selectedPlaylist.id}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-xs font-extrabold transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-55"
                  style={{
                    color: '#09090c',
                    background: selectedPlaylist.accent,
                    boxShadow: `0 12px 30px ${selectedPlaylist.glow}`,
                  }}
                >
                  <PlayIcon size={15} />
                  {selectedPlaylist.id ? 'Reproducir ahora' : 'Próximamente'}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
              <div className="rounded-[20px] border border-white/[0.07] bg-black/15 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/27">
                  Distancia sugerida
                </p>
                <p className="mt-1 font-display text-base font-bold text-white/88">
                  {selectedPlaylist.distance}
                </p>
              </div>
              <div className="rounded-[20px] border border-white/[0.07] bg-black/15 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/27">
                  Energía
                </p>
                <div className="mt-2">
                  <EnergyDots value={selectedPlaylist.energy} accent={selectedPlaylist.accent} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="px-5">
            <p className="section-label">Elegí según tu energía</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">
              ¿Cómo te sentís hoy?
            </h2>
          </div>

          <div className="mt-4 flex gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MOODS.map((mood) => (
              <MoodChip
                key={mood.id}
                mood={mood}
                selected={selectedMood === mood.id}
                accent={selectedPlaylist.accent}
                onClick={() => selectMood(mood.id)}
              />
            ))}
          </div>
        </section>

        <section className="mx-4 mt-7">
          <div
            className="relative overflow-hidden rounded-[32px] border border-white/[0.09] p-5 shadow-[0_24px_70px_rgba(0,0,0,.34)]"
            style={{
              background: `radial-gradient(circle at 92% 10%, ${selectedPlaylist.glow}, transparent 34%), linear-gradient(145deg, rgba(255,255,255,.065), rgba(255,255,255,.018))`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Test PR Music</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  Encontrá tu sesión ideal
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-white/42">
                  Tres respuestas rápidas y te recomendamos una playlist para tu próxima rodada.
                </p>
              </div>
              <span
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border text-xl"
                style={{
                  borderColor: `${selectedPlaylist.accent}35`,
                  background: selectedPlaylist.accentSoft,
                }}
              >
                🎚️
              </span>
            </div>

            {!testResult ? (
              <div className="mt-5">
                <div className="mb-4 flex gap-2">
                  {TEST_QUESTIONS.map((question, index) => (
                    <span
                      key={question.id}
                      className="h-1.5 flex-1 rounded-full transition-all"
                      style={{
                        background:
                          index <= testStep ? selectedPlaylist.accent : 'rgba(255,255,255,.09)',
                        boxShadow:
                          index <= testStep ? `0 0 10px ${selectedPlaylist.accent}` : 'none',
                      }}
                    />
                  ))}
                </div>

                <p
                  className="text-[9px] font-black uppercase tracking-[0.17em]"
                  style={{ color: selectedPlaylist.accent }}
                >
                  {TEST_QUESTIONS[testStep].eyebrow}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-white">
                  {TEST_QUESTIONS[testStep].title}
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {TEST_QUESTIONS[testStep].options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => answerTest(TEST_QUESTIONS[testStep].id, option.id)}
                      className="min-h-[88px] rounded-[20px] border border-white/[0.08] bg-black/15 px-2 py-3 text-center transition-all active:scale-[0.96]"
                    >
                      <span className="block text-xl" aria-hidden="true">{option.emoji}</span>
                      <span className="mt-2 block text-[11px] font-bold text-white/72">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                <p
                  className="text-[9px] font-black uppercase tracking-[0.18em]"
                  style={{ color: testResult.accent }}
                >
                  Tu resultado
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <PlaylistArtwork
                    playlist={testResult}
                    index={PLAYLISTS.findIndex((item) => item.label === testResult.label)}
                    compact
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl font-bold text-white">{testResult.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/44">{testResult.recommendation}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={showPlayer}
                    disabled={!testResult.id}
                    className="min-h-11 rounded-2xl text-xs font-extrabold disabled:opacity-50"
                    style={{ color: '#09090c', background: testResult.accent }}
                  >
                    Reproducir
                  </button>
                  <button
                    type="button"
                    onClick={resetTest}
                    className="min-h-11 rounded-2xl border border-white/[0.09] bg-white/[0.035] text-xs font-bold text-white/55"
                  >
                    Hacerlo otra vez
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mx-4 mt-7">
          <button
            type="button"
            onClick={() => selectPlaylist(dailyPlaylist.label)}
            className="relative w-full overflow-hidden rounded-[30px] border border-white/[0.08] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,.3)] active:scale-[0.99]"
            style={{
              background: `radial-gradient(circle at 92% 14%, ${dailyPlaylist.glow}, transparent 33%), linear-gradient(140deg, ${dailyPlaylist.accentSoft}, rgba(255,255,255,.025) 55%, rgba(0,0,0,.16))`,
            }}
          >
            <div className="relative flex items-center gap-4">
              <PlaylistArtwork playlist={dailyPlaylist} index={dailyIndex} compact />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[9px] font-black uppercase tracking-[0.18em]"
                  style={{ color: dailyPlaylist.accent }}
                >
                  🎧 Recomendación de hoy
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  {dailyPlaylist.label}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/42">
                  {dailyPlaylist.recommendation}
                </p>
              </div>
              <span
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full"
                style={{
                  color: '#08090c',
                  background: dailyPlaylist.accent,
                  boxShadow: `0 10px 24px ${dailyPlaylist.glow}`,
                }}
              >
                <PlayIcon size={15} />
              </span>
            </div>
          </button>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3 px-5">
            <div>
              <p className="section-label">La colección oficial</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">
                Elegí tu banda sonora
              </h2>
            </div>
            <p className="pb-0.5 text-[10px] text-white/24">Deslizá →</p>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {orderedPlaylists.map((playlist) => {
              const originalIndex = PLAYLISTS.findIndex((item) => item.label === playlist.label)

              return (
                <PlaylistSelector
                  key={playlist.label}
                  playlist={playlist}
                  index={originalIndex}
                  selected={playlist.label === selectedPlaylist.label}
                  onSelect={() => selectPlaylist(playlist.label)}
                />
              )
            })}
          </div>
        </section>

        <section className="px-4 pt-5">
          <div
            className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,.3)]"
            style={{ boxShadow: `0 24px 70px ${selectedPlaylist.glow}` }}
          >
            <div className="flex items-start gap-3">
              <span
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border text-xl"
                style={{
                  borderColor: `${selectedPlaylist.accent}32`,
                  background: selectedPlaylist.accentSoft,
                }}
              >
                {selectedPlaylist.icon}
              </span>
              <div>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.18em]"
                  style={{ color: selectedPlaylist.accent }}
                >
                  ¿Cuándo escucharla?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {selectedPlaylist.when}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/27">
                Estado recomendado
              </p>
              <p className="mt-1 font-display text-base font-bold text-white/88">
                {selectedPlaylist.mood}
              </p>
            </div>
          </div>
        </section>

        <section id="pr-music-player" className="scroll-mt-20 px-4 pt-5">
          <div
            className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.03]"
            style={{
              boxShadow: playerVisible ? `0 24px 70px ${selectedPlaylist.glow}` : undefined,
            }}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] p-4">
              <div
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border"
                style={{
                  color: selectedPlaylist.accent,
                  borderColor: `${selectedPlaylist.accent}32`,
                  background: selectedPlaylist.accentSoft,
                }}
              >
                <PlayIcon size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/28">
                  Reproductor PR
                </p>
                <h3 className="mt-0.5 truncate font-display text-lg font-bold text-white">
                  {selectedPlaylist.label}
                </h3>
              </div>

              {selectedPlaylist.id && (
                <a
                  href={spotifyUrl(selectedPlaylist.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.035] text-white/45 active:scale-95"
                  aria-label="Abrir playlist en Spotify"
                >
                  <ExternalIcon />
                </a>
              )}
            </div>

            {playerVisible && selectedPlaylist.id ? (
              <div className="p-3">
                <div className="overflow-hidden rounded-[22px] bg-black/25">
                  <iframe
                    key={selectedPlaylist.id}
                    title={selectedPlaylist.label}
                    src={spotifyEmbedUrl(selectedPlaylist.id)}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="block"
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[190px] flex-col items-center justify-center px-7 py-8 text-center">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full border"
                  style={{
                    color: selectedPlaylist.accent,
                    borderColor: `${selectedPlaylist.accent}30`,
                    background: selectedPlaylist.accentSoft,
                  }}
                >
                  <PlayIcon size={23} />
                </div>
                <p className="mt-4 font-display text-xl font-bold text-white">
                  {selectedPlaylist.id ? 'Tu playlist está pronta' : 'Playlist en preparación'}
                </p>
                <p className="mt-2 max-w-[285px] text-xs leading-relaxed text-white/38">
                  {selectedPlaylist.id
                    ? 'Tocá reproducir para cargar Spotify dentro de la app.'
                    : 'El diseño ya está listo. Solo falta incorporar el enlace de Spotify de esta playlist.'}
                </p>
                {selectedPlaylist.id && (
                  <button
                    type="button"
                    onClick={showPlayer}
                    className="mt-5 rounded-2xl border px-5 py-3 text-xs font-extrabold active:scale-[0.97]"
                    style={{
                      color: selectedPlaylist.accent,
                      borderColor: `${selectedPlaylist.accent}35`,
                      background: selectedPlaylist.accentSoft,
                    }}
                  >
                    Cargar reproductor
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="mx-7 mt-6 flex items-center gap-3 rounded-[22px] border border-white/[0.055] bg-white/[0.02] px-4 py-3.5">
          <span className="text-lg" aria-hidden="true">🎧</span>
          <p className="text-[10px] leading-relaxed text-white/28">
            Las canciones y los cambios de cada playlist se actualizan automáticamente desde Spotify.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
