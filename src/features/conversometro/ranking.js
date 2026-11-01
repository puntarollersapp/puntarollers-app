// Conversómetro PR — pure ranking logic, independent of attendance and bookings.
export const PERIODS = ['semana', 'mes', 'historico'];

// Uruguay is UTC−03 year-round. Calculate boundaries independently of device timezone.
const UY_OFFSET_MS = 3 * 60 * 60 * 1000;
export function startOfPeriod(period, now = new Date()) {
  if (period === 'historico') return null;
  if (period !== 'semana' && period !== 'mes') throw new Error('Período desconocido');
  const uy = new Date(new Date(now).getTime() - UY_OFFSET_MS);
  if (!Number.isFinite(uy.getTime())) throw new Error('Fecha inválida');
  const year = uy.getUTCFullYear();
  const month = uy.getUTCMonth();
  const day = uy.getUTCDate();
  const mondayOffset = (uy.getUTCDay() + 6) % 7;
  const boundary = period === 'semana'
    ? Date.UTC(year, month, day - mondayOffset)
    : Date.UTC(year, month, 1);
  return new Date(boundary + UY_OFFSET_MS);
}

export function buildConversationRanking(students, marks, period = 'mes', now = new Date()) {
  const start = startOfPeriod(period, now);
  const totals = new Map();
  for (const mark of marks) {
    if (mark.voided_at) continue;
    const timestamp = new Date(mark.created_at);
    if (!Number.isFinite(timestamp.getTime())) continue;
    if (timestamp > now || (start && timestamp < start)) continue;
    const key = String(mark.student_id);
    totals.set(key, (totals.get(key) || 0) + 1);
  }
  return students.map(student => ({
    ...student,
    count: totals.get(String(student.id)) || 0
  })).sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name), 'es'));
}

export function makeLocalMark(studentId, now = new Date()) {
  if (!studentId) throw new Error('Falta seleccionar alumno');
  return {
    id: crypto.randomUUID(),
    student_id: String(studentId),
    created_at: now.toISOString(),
    voided_at: null
  };
}
