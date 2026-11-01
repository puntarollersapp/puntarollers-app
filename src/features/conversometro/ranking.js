// Conversómetro PR — pure ranking logic, independent of attendance and bookings.
export const PERIODS = ['semana', 'mes', 'historico'];

export function startOfPeriod(period, now = new Date()) {
  if (period === 'historico') return null;
  const date = new Date(now);
  if (period === 'semana') {
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  } else if (period === 'mes') {
    date.setDate(1);
  } else {
    throw new Error('Período desconocido');
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildConversationRanking(students, marks, period = 'mes', now = new Date()) {
  const start = startOfPeriod(period, now);
  const totals = new Map();
  for (const mark of marks) {
    if (mark.voided_at) continue;
    const timestamp = new Date(mark.created_at);
    if (!Number.isFinite(timestamp.getTime())) continue;
    if (start && timestamp < start) continue;
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
