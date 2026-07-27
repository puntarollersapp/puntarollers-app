import { useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'

const PLAYLISTS = [
  {
    id: '05gmyPhOhHGAhvzvH8mJ93',
    label: 'PR Session 01',
    eyebrow: 'Sesión destacada',
    description: 'Una selección oficial para activar el cuerpo, encontrar el ritmo y empezar a rodar.',
    accent: '#f0cf70',
    accentSoft: 'rgba(240, 207, 112, 0.18)',
    glow: 'rgba(240, 207, 112, 0.22)',
  },
  {
    id: '5Mq85OCh1KA3azpMnTJgSq',
    label: 'PR Session 02',
    eyebrow: 'Energía PR',
    description: 'Música para acompañar entrenamientos con movimiento, actitud y energía de equipo.',
    accent: '#ff7a59',
    accentSoft: 'rgba(255, 122, 89, 0.18)',
    glow: 'rgba(255, 122, 89, 0.22)',
  },
  {
    id: '5rVVCmRXRAcuNZXQBg0tgJ',
    label: 'PR Session 03',
    eyebrow: 'Modo entrenamiento',
    description: 'Elegí tu ritmo, ajustá los patines y dejá que la música marque la sesión.',
    accent: '#65d7ff',
    accentSoft: 'rgba(101, 215, 255, 0.17)',
    glow: 'rgba(101, 215, 255, 0.22)',
  },
  {
    id: '4y73FZYgyEVOmzxIfRZiM5',
    label: 'PR Session 04',
    eyebrow: 'Sobre ruedas',
    description: 'Una banda sonora para salir, compartir kilómetros y disfrutar cada vuelta.',
    accent: '#a98cff',
    accentSoft: 'rgba(169, 140, 255, 0.18)',
    glow: 'rgba(169, 140, 255, 0.22)',
  },
  {
    id: '0HV6hNSFb71KfobG6UJXZF',
    label: 'PR Session 05',
    eyebrow: 'Subí la intensidad',
    description: 'Una sesión para esos entrenamientos en los que necesitás sostener la motivación.',
    accent: '#ff5f83',
    accentSoft: 'rgba(255, 95, 131, 0.18)',
    glow: 'rgba(255, 95, 131, 0.22)',
  },
  {
    id: '77sFrL35HvQQOA1MlrDbbM',
    label: 'PR Session 06',
    eyebrow: 'Rodada colectiva',
    description: 'Música elegida para acompañar la conexión, la calle y el espíritu de comunidad.',
    accent: '#55e6b1',
    accentSoft: 'rgba(85, 230, 177, 0.17)',
    glow: 'rgba(85, 230, 177, 0.22)',
  },
  {
    id: '6SvoXxfxviMF6CvBF479o3',
    label: 'PR Session 07',
    eyebrow: 'Última vuelta',
    description: 'La sesión ideal para cerrar el entrenamiento arriba y volver con ganas de más.',
    accent: '#ffb84d',
    accentSoft: 'rgba(255, 184, 77, 0.18)',
    glow: 'rgba(255, 184, 77, 0.22)',
  },
]

function spotifyUrl(id) {
  return `https://open.spotify.com/playlist/${id}`
}

function spotifyEmbedUrl(id) {
  return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`
}

function PlayIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
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
    <div className="flex h-16 items-end justify-center gap-1" aria-hidden="true">
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

function SessionArtwork({ playlist, index, compact = false }) {
  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden border border-white/10 ${
        compact ? 'h-[72px] w-[72px] rounded-[21px]' : 'aspect-square w-full rounded-[30px]'
      }`}
      style={{
        background: `radial-gradient(circle at 28% 18%, ${playlist.accentSoft}, transparent 35%), linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.018) 55%, ${playlist.accentSoft})`,
        boxShadow: `0 24px 70px ${playlist.glow}`,
      }}
    >
      <div
        className="absolute -right-[18%] -top-[18%] h-[68%] w-[68%] rounded-full border border-white/10"
        style={{ boxShadow: `inset 0 0 45px ${playlist.glow}` }}
      />
      <div className="absolute -bottom-[28%] -left-[22%] h-[75%] w-[75%] rounded-full border border-white/[0.07]" />
      <div className="absolute inset-[17%] rounded-full border border-white/[0.08]" />
      <div className="absolute inset-[30%] rounded-full border border-white/[0.12]" />

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
          <span className="font-display text-[11px] font-bold text-white/36">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {!compact && (
          <div>
            <Equalizer accent={playlist.accent} />
            <p className="mt-3 font-display text-xl font-bold leading-none text-white">
              MUSIC
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">
              Official session
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SessionSelector({ playlist, index, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-[112px] flex-shrink-0 rounded-[24px] border p-2.5 text-left transition-all active:scale-[0.97] ${
        selected
          ? 'border-white/20 bg-white/[0.085] shadow-[0_15px_40px_rgba(0,0,0,.28)]'
          : 'border-white/[0.065] bg-white/[0.025]'
      }`}
    >
      <SessionArtwork playlist={playlist} index={index} compact />
      <p
        className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ color: selected ? playlist.accent : 'rgba(255,255,255,.28)' }}
      >
        Session {String(index + 1).padStart(2, '0')}
      </p>
      <p className="mt-1 truncate font-display text-sm font-bold text-white/88">
        Escuchar
      </p>
    </button>
  )
}

export default function MusicPage() {
  const [selectedId, setSelectedId] = useState(PLAYLISTS[0].id)
  const [playerVisible, setPlayerVisible] = useState(false)

  const selectedIndex = useMemo(
    () => PLAYLISTS.findIndex((playlist) => playlist.id === selectedId),
    [selectedId]
  )

  const selectedPlaylist = PLAYLISTS[selectedIndex] || PLAYLISTS[0]

  function selectPlaylist(id) {
    setSelectedId(id)
    setPlayerVisible(false)
  }

  function showPlayer() {
    setPlayerVisible(true)
    window.setTimeout(() => {
      document
        .getElementById('pr-music-player')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <AppLayout title="PR Music" showBack>
      <div className="overflow-hidden pb-10">
        <section
          className="relative mx-4 mt-4 overflow-hidden rounded-[34px] border border-white/[0.08] px-5 pb-6 pt-5 shadow-[0_28px_90px_rgba(0,0,0,.42)]"
          style={{
            background: `radial-gradient(circle at 78% 12%, ${selectedPlaylist.glow}, transparent 30%), radial-gradient(circle at 4% 92%, ${selectedPlaylist.accentSoft}, transparent 34%), linear-gradient(150deg, rgba(255,255,255,.07), rgba(255,255,255,.018) 48%, rgba(0,0,0,.18))`,
          }}
        >
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/[0.05]"
            aria-hidden="true"
          />
          <div
            className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/[0.06]"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">El sonido oficial de PR</p>
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

            <p className="mt-4 max-w-[320px] text-sm leading-relaxed text-white/50">
              El ritmo también es parte del entrenamiento. Elegí una sesión y llevá la energía de Punta Rollers con vos.
            </p>

            <div className="mt-6 grid grid-cols-[128px_1fr] items-center gap-5">
              <SessionArtwork
                playlist={selectedPlaylist}
                index={selectedIndex}
              />

              <div className="min-w-0">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ color: selectedPlaylist.accent }}
                >
                  {selectedPlaylist.eyebrow}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-white">
                  {selectedPlaylist.label}
                </h2>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/42">
                  {selectedPlaylist.description}
                </p>

                <button
                  type="button"
                  onClick={showPlayer}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-xs font-extrabold transition-transform active:scale-[0.96]"
                  style={{
                    color: '#09090c',
                    background: selectedPlaylist.accent,
                    boxShadow: `0 12px 30px ${selectedPlaylist.glow}`,
                  }}
                >
                  <PlayIcon size={15} />
                  Reproducir ahora
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/24">
                  Colección actual
                </p>
                <p className="mt-0.5 font-display text-base font-bold text-white/85">
                  7 sesiones oficiales
                </p>
              </div>

              <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[10px] font-semibold text-white/38">
                Powered by Spotify
              </span>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-3 px-5">
            <div>
              <p className="section-label">Tu próxima banda sonora</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">
                Elegí una sesión
              </h2>
            </div>
            <p className="pb-0.5 text-[10px] text-white/24">Deslizá →</p>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PLAYLISTS.map((playlist, index) => (
              <SessionSelector
                key={playlist.id}
                playlist={playlist}
                index={index}
                selected={playlist.id === selectedPlaylist.id}
                onSelect={() => selectPlaylist(playlist.id)}
              />
            ))}
          </div>
        </section>

        <section id="pr-music-player" className="scroll-mt-20 px-4 pt-5">
          <div
            className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.03] shadow-[0_24px_70px_rgba(0,0,0,.34)]"
            style={{ boxShadow: playerVisible ? `0 24px 70px ${selectedPlaylist.glow}` : undefined }}
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

              <a
                href={spotifyUrl(selectedPlaylist.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.035] text-white/45 active:scale-95"
                aria-label="Abrir playlist en Spotify"
              >
                <ExternalIcon />
              </a>
            </div>

            {playerVisible ? (
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
                  Tu sesión está pronta
                </p>
                <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-white/38">
                  Tocá reproducir para cargar Spotify dentro de la app y escuchar esta playlist.
                </p>
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
              </div>
            )}
          </div>
        </section>

        <div className="mx-7 mt-6 flex items-center gap-3 rounded-[22px] border border-white/[0.055] bg-white/[0.02] px-4 py-3.5">
          <span className="text-lg" aria-hidden="true">🎧</span>
          <p className="text-[10px] leading-relaxed text-white/28">
            Las canciones, portadas y cambios de cada playlist se actualizan automáticamente desde Spotify.
          </p>
        </div>
      </div>
    </AppLayout>
  )
                }
