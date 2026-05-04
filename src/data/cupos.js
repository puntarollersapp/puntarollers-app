export const defaultCupos = {
  miercoles: {
    principiantes: 6,
    avanzado: 3
  },
  sabado: {
    kids: 5,
    adultos: 4
  }
}

export function getCupos() {
  const stored = localStorage.getItem("cuposPR")
  return stored ? JSON.parse(stored) : defaultCupos
}

export function saveCupos(data) {
  localStorage.setItem("cuposPR", JSON.stringify(data))
}
