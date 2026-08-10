export function clampAvatarEnergy(value) {
  return Math.max(0, Math.min(100, Number(value) || 0))
}

export function calculateAvatarProgress(rows = []) {
  const activities = Array.isArray(rows) ? rows : []
  const kilometers = activities.reduce(
    (total, activity) =>
      total + (Number(activity?.distancia_metros) || 0) / 1000,
    0
  )
  const sessions = activities.length
  const energy = clampAvatarEnergy(
    Math.min(82, kilometers / 3) + Math.min(18, sessions * 0.8)
  )

  const level =
    kilometers >= 500
      ? 'Leyenda PR'
      : kilometers >= 250
        ? 'Motor PR'
        : kilometers >= 100
          ? 'Ritmo PR'
          : kilometers >= 25
            ? 'En movimiento'
            : 'Primeras vueltas'

  return { energy, kilometers, sessions, level }
}
