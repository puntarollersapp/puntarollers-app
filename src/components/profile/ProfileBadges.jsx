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

export default function ProfileBadges({ badges = [] }) {
  const featured = badges.slice(0, 3)
  const remaining = badges.slice(3)

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-pr-gold/25 bg-gradient-to-br from-[#211708] via-[#111016] to-[#07070b] shadow-[0_28px_90px_rgba(212,175,55,0.10)]">
      <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-pr-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-orange-400/[0.08] blur-3xl pointer-events-none" />

      <div className="relative p-5 border-b border-pr-gold/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label text-pr-gold">
              Colección personal
            </p>

            <h2 className="font-display text-[30px] leading-none text-white mt-2">
              Mis insignias
            </h2>

            <p className="text-white/40 text-xs mt-3 leading-relaxed max-w-[270px]">
              Reconocimientos que cuentan tu evolución, constancia y espíritu dentro de Punta Rollers.
            </p>
          </div>

          <div className="w-14 h-14 rounded-[20px] border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-2xl shrink-0">
            🏅
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <div className="rounded-[22px] border border-white/[0.07] bg-black/25 p-4">
            <p className="font-display text-[30px] leading-none text-pr-gold">
              {badges.length}
            </p>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.14em] mt-2">
              Conseguidas
            </p>
          </div>

          <div className="rounded-[22px] border border-white/[0.07] bg-black/25 p-4">
            <p className="font-display text-[30px] leading-none text-white">
              {badges.length ? 'Activa' : 'Inicial'}
            </p>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.14em] mt-2">
              Colección
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-5">
        {!badges.length ? (
          <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-6 text-center">
            <div className="w-16 h-16 rounded-[22px] border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-3xl mx-auto">
              🏅
            </div>

            <h3 className="font-display text-2xl text-white mt-4">
              Tu colección comienza acá
            </h3>

            <p className="text-white/35 text-sm mt-2 leading-relaxed">
              Cuando el equipo PR te otorgue una insignia, aparecerá en esta sección.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {featured.map((badge) => {
                const image = getBadgeImage(badge.titulo)

                return (
                  <article
                    key={badge.id}
                    className="rounded-[24px] border border-pr-gold/15 bg-gradient-to-b from-pr-gold/[0.10] to-white/[0.025] p-3 text-center min-w-0"
                  >
                    <div className="aspect-square rounded-[20px] overflow-hidden border border-pr-gold/15 bg-black/30 grid place-items-center">
                      {image ? (
                        <img
                          src={image}
                          alt={badge.titulo}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl">🏅</span>
                      )}
                    </div>

                    <p className="text-white text-[11px] font-bold leading-tight mt-3 line-clamp-2">
                      {badge.titulo}
                    </p>
                  </article>
                )
              })}
            </div>

            <div className="space-y-3 mt-5">
              {badges.map((badge) => {
                const image = getBadgeImage(badge.titulo)

                return (
                  <article
                    key={`detail-${badge.id}`}
                    className="rounded-[25px] border border-white/[0.07] bg-white/[0.025] p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 shrink-0 rounded-[22px] overflow-hidden border border-pr-gold/15 bg-black/30 grid place-items-center">
                        {image ? (
                          <img
                            src={image}
                            alt={badge.titulo}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-3xl">🏅</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-bold text-sm leading-tight">
                              {badge.titulo}
                            </p>

                            <p className="text-pr-gold text-[9px] font-bold uppercase tracking-[0.14em] mt-1">
                              Insignia PR
                            </p>
                          </div>

                          <span className="rounded-full border border-pr-gold/15 bg-pr-gold/10 px-2 py-1 text-pr-gold text-[8px] font-bold uppercase">
                            Obtenida
                          </span>
                        </div>

                        {badge.descripcion && (
                          <p className="text-white/45 text-xs mt-3 leading-relaxed">
                            {badge.descripcion}
                          </p>
                        )}

                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <p className="text-white/25 text-[10px]">
                            {formatDate(badge.fecha)}
                            {badge.creado_por_nombre
                              ? ` · Otorgada por ${badge.creado_por_nombre}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {remaining.length > 0 && (
              <p className="text-white/25 text-[10px] text-center mt-4">
                Mostrando tu colección completa de {badges.length} insignias.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

