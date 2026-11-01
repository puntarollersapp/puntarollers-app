import { supabase } from '../../lib/supabase';
import { buildConversationRanking } from './ranking';

// This module only accesses the dedicated Conversómetro table.
// It never reads or writes attendance, bookings, payments or training data.
const TABLE = 'pr_conversometro_marks';

export async function loadConversationData() {
  const [people, marks] = await Promise.all([
    supabase.from('profiles').select('id,nombre,apellido,foto,role,participa_como_alumno').limit(500),
    supabase.from(TABLE).select('id,student_id,created_at,voided_at').order('created_at',{ascending:false}).limit(10000)
  ]);
  if (people.error) throw people.error;
  if (marks.error) throw marks.error;
  const students = (people.data || [])
    .filter(p => p.role === 'alumno' || p.participa_como_alumno)
    .map(p => ({id:p.id,name:[p.nombre,p.apellido].filter(Boolean).join(' ') || 'Alumno',avatar_url:p.foto,color:'#b25aff'}));
  return {students,marks:marks.data || []};
}

export async function createConversationMark(studentId) {
  if (!studentId) throw new Error('Seleccioná un alumno');
  const {data,error} = await supabase.from(TABLE).insert({student_id:String(studentId)}).select('id,student_id,created_at,voided_at').single();
  if (error) throw error;
  return data;
}

export async function undoConversationMark(studentId) {
  if (!studentId) throw new Error('Seleccioná un alumno');
  // Undo only the newest active mark; RLS verifies the teacher role.
  const {data:recent,error:findError} = await supabase.from(TABLE)
    .select('id').eq('student_id',String(studentId)).is('voided_at',null)
    .order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (findError) throw findError;
  if (!recent) return null;
  const {data,error} = await supabase.from(TABLE).update({voided_at:new Date().toISOString()})
    .eq('id',recent.id).is('voided_at',null).select('id,student_id,created_at,voided_at').maybeSingle();
  if (error) throw error;
  return data;
}

export function getConversationRanking(students,marks,period,now) {
  return buildConversationRanking(students,marks,period,now).filter(p=>p.count>0);
}
