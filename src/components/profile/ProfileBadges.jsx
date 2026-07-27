const BADGE_IMAGES = {
  'travesia la barra 19k': '/insignias-pr/travesia-la-barra-19k.png',
  'primer evento pr': '/insignias-pr/primer-evento-pr.png',
  'rodador frecuente': '/insignias-pr/rodador-frecuente.png',
  'espiritu pr': '/insignias-pr/espiritu-pr.png',
  'primeros 6k': '/insignias-pr/primeros-6k.png',
  'primeros 10k': '/insignias-pr/primeros-10k.png',
  'ya frena en t': '/insignias-pr/frena-en-t.png',
  'frena en t': '/insignias-pr/frena-en-t.png',
  'ya frena con taco': '/insignias-pr/frena-con-taco.png',
  'frena con taco': '/insignias-pr/frena-con-taco.png',
  'buen companero': '/insignias-pr/buen-companero.png',
  'actitud positiva': '/insignias-pr/actitud-positiva.png',
  'entrenador potencial': '/insignias-pr/entrenador-potencial.png',
}

function normalizeBadgeTitle(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getBadgeImage(title) {
  return BADGE_IMAGES[normalizeBadgeTitle(title)] || ''
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getCollectionLevel(total) {
  if (total >= 10) return 'Colección legendaria'
  if (total >= 7) return 'Colección avanzada'
  if (total >= 4) return 'Colección en crecimiento'
  if (total >= 1) return 'Primeros logros'
  return 'Colección inicial'
}

function getNextMilestone(total) {
  const milestones = [1, 3, 5, 10, 15, 20]
  const next = milestones.find((milestone) => milestone > total)

  if (!next) {
    return {
      target: total,
      remaining: 0,
      progress: 100,
      label: 'Colección consolidada',
    }
  }

  const previous = [...milestones]
    .reverse()
    .find((milestone) => milestone <= total) || 0

  const range = next - previous
  const completed = total - previous
  const progress = range > 0 ? Math.round((completed / range) * 100) : 100

  return {
    target: next,
    remaining: next - total,
    progress,
    label: `Próximo hito: ${next} insignias`,
  }
}

function BadgeArtwork({ badge, size = 'large' }) {
  const image = getBadgeImage(badge.titulo)
  const sizeClasses =
    size === 'featured'
      ? 'aspect-square rounded-[24px]'
      : 'w-[76px] h-[76px] rounded-[22px]'

  return (
    <div
      className={`${sizeClasses} overflow-hidden border border-pr-gold/20 bg-gradient-to-br from-pr-gold/[0.12] to-black/40 grid place-items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}
    >
      {image ? (
        <img
          src={image}
          alt={badge.titulo}
          className="w-full h-full object-contain"
        />
      ) : (
        <span className={size === 'featured' ? 'text-4xl' : 'text-3xl'}>
          🏅
        </span>
      )}
    </div>
  )
}

export default function ProfileBadges({ badges = [] }) {
  const featured = badges.slice(0, 3)
  const collectionLevel = getCollectionLevel(badges.length)
  const milestone = getNextMilestone(badges.length)

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-pr-gold/25 bg-gradient-to-br from-[#251906] via-[#111016] to-[#07070b] shadow-[0_30px_100px_rgba(212,175,55,0.12)]">
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-pr-gold/[0.12] blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-24 w-64 h-64 rounded-full bg-orange-400/[0.07] blur-3xl pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pr-gold/55 to-transparent pointer-events-none" />

      <header className="relative p-5 pb-6 border-b border-pr-gold/10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-pr-gold/15 bg-pr-gold/[0.08] px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pr-gold shadow-[0_0_10px_rgba(212,175,55,0.9)]" />
              <span className="text-pr-gold text-[9px] font-bold uppercase tracking-[0.16em]">
                Colección personal
              </span>
            </div>

            <h2 className="font-display text-[34px] leading-none text-white mt-4">
              Mis insignias
            </h2>

            <p className="text-white/42 text-xs mt-3 leading-relaxed max-w-[285px]">
              Cada insignia representa una meta, una evolución o una forma de vivir el espíritu Punta Rollers.
            </p>
          </div>

          <div className="relative w-16 h-16 shrink-0 rounded-[23px] border border-pr-gold/25 bg-gradient-to-br from-pr-gold/20 to-pr-gold/[0.04] grid place-items-center shadow-[0_14px_40px_rgba(212,175,55,0.12)]">
            <span className="text-3xl">🏅</span>
            {!!badges.length && (
              <span className="absolute -right-1.5 -top-1.5 min-w-6 h-6 px-1.5 rounded-full border-2 border-[#181107] bg-pr-gold text-black text-[10px] font-black grid place-items-center">
                {badges.length}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-6">
          <div className="rounded-[23px] border border-white/[0.07] bg-black/25 p-4">
            <p className="font-display text-[32px] leading-none text-pr-gold">
              {badges.length}
            </p>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.15em] mt-2">
              Conseguidas
            </p>
          </div>

          <div className="rounded-[23px] border border-white/[0.07] bg-black/25 p-4">
            <p className="text-white font-bold text-sm leading-tight min-h-[32px] flex items-center">
              {collectionLevel}
            </p>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.15em] mt-2">
              Estado actual
            </p>
          </div>
        </div>

        {!!badges.length && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4 mt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white text-xs font-bold">{milestone.label}</p>
                <p className="text-white/30 text-[10px] mt-1">
                  {milestone.remaining
                    ? `Te faltan ${milestone.remaining} para llegar.`
                    : 'Tu colección ya alcanzó todos los hitos actuales.'}
                </p>
              </div>

              <span className="text-pr-gold text-xs font-black shrink-0">
                {milestone.progress}%
              </span>
            </div>

            <div className="h-2 rounded-full bg-black/40 overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9d7414] via-pr-gold to-[#ffe7a0] transition-all duration-500"
                style={{ width: `${milestone.progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="relative p-5">
        {!badges.length ? (
          <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-7 text-center">
            <div className="relative w-20 h-20 rounded-[28px] border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-4xl mx-auto shadow-[0_18px_45px_rgba(212,175,55,0.10)]">
              🏅
              <div className="absolute inset-2 rounded-[20px] border border-pr-gold/10" />
            </div>

            <h3 className="font-display text-[28px] leading-none text-white mt-5">
              Tu colección comienza acá
            </h3>

            <p className="text-white/35 text-sm mt-3 leading-relaxed max-w-[290px] mx-auto">
              Cuando el equipo PR te otorgue una insignia, aparecerá en esta sección como parte de tu historia.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            <section>
              <div className="flex items-end justify-between gap-3 mb-3">
                <div>
                  <p className="text-pr-gold text-[9px] font-bold uppercase tracking-[0.16em]">
                    Selección principal
                  </p>
                  <h3 className="font-display text-[24px] leading-none text-white mt-1.5">
                    Destacadas
                  </h3>
                </div>

                <span className="text-white/25 text-[10px]">
                  {featured.length} de {badges.length}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {featured.map((badge, index) => (
                  <article
                    key={badge.id || `${badge.titulo}-${index}`}
                    className="relative min-w-0 rounded-[26px] border border-pr-gold/15 bg-gradient-to-b from-pr-gold/[0.10] to-white/[0.025] p-2.5 text-center shadow-[0_12px_34px_rgba(0,0,0,0.18)]"
                  >
                    <span className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full border border-pr-gold/20 bg-black/60 text-pr-gold text-[8px] font-black grid place-items-center backdrop-blur-sm">
                      {index + 1}
                    </span>

                    <BadgeArtwork badge={badge} size="featured" />

                    <p className="text-white text-[11px] font-bold leading-tight mt-3 line-clamp-2 min-h-[28px]">
                      {badge.titulo}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between gap-3 mb-3">
                <div>
                  <p className="text-pr-gold text-[9px] font-bold uppercase tracking-[0.16em]">
                    Historial completo
                  </p>
                  <h3 className="font-display text-[24px] leading-none text-white mt-1.5">
                    Tu colección
                  </h3>
                </div>

                <span className="rounded-full border border-pr-gold/15 bg-pr-gold/[0.08] px-2.5 py-1 text-pr-gold text-[9px] font-bold">
                  {badges.length} total
                </span>
              </div>

              <div className="space-y-3">
                {badges.map((badge, index) => (
                  <article
                    key={`detail-${badge.id || `${badge.titulo}-${index}`}`}
                    className="group relative overflow-hidden rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-4"
                  >
                    <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-pr-gold/50 to-transparent" />

                    <div className="flex items-start gap-4">
                      <BadgeArtwork badge={badge} />

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm leading-tight">
                              {badge.titulo}
                            </p>

                            <p className="text-pr-gold text-[9px] font-bold uppercase tracking-[0.14em] mt-1.5">
                              Insignia PR
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full border border-pr-gold/15 bg-pr-gold/10 px-2 py-1 text-pr-gold text-[8px] font-bold uppercase">
                            Obtenida
                          </span>
                        </div>

                        {badge.descripcion && (
                          <p className="text-white/45 text-xs mt-3 leading-relaxed">
                            {badge.descripcion}
                          </p>
                        )}

                        {(badge.fecha || badge.creado_por_nombre) && (
                          <div className="mt-3 pt-3 border-t border-white/[0.06]">
                            <p className="text-white/25 text-[10px] leading-relaxed">
                              {formatDate(badge.fecha)}
                              {badge.fecha && badge.creado_por_nombre ? ' · ' : ''}
                              {badge.creado_por_nombre
                                ? `Otorgada por ${badge.creado_por_nombre}`
                                : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  )
}
