import { supabase } from '../../lib/supabase';
import { buildConversationRanking } from './ranking';

// This module only accesses the dedicated Conversómetro table.
// It never reads or writes attendance, bookings, payments or training data.
const TABLE = 'pr_conversometro_marks';

export async function loadConversationData(isStaff = false) {
  // Non-staff see only the minimal public projection of participants.
  // They must not query private profile fields or depend on staff RLS.
  const [participants, marks, directory] = await Promise.all([
    supabase.rpc('pr_conversometro_participants'),
    supabase.from(TABLE).select('id,student_id,created_at,voided_at').order('created_at',{ascending:false}).limit(10000),
    isStaff ? supabase.from('profiles').select('id,nombre,apellido,foto,role,participa_como_alumno').limit(500) : Promise.resolve({data:[],error:null})
  ]);
  if (participants.error) throw participants.error;
  if (marks.error) throw marks.error;
  if (isStaff && directory.error) throw directory.error;
  const profiles = new Map((participants.data || []).map(p => [String(p.id),{
    id:p.id,name:p.name || 'Alumno',avatar_url:p.avatar_url,color:'#b25aff'
  }]));
  if (isStaff) for (const p of directory.data || []) {
    if (p.role === 'alumno' || p.participa_como_alumno) {
      profiles.set(String(p.id),{
        id:p.id,name:[p.nombre,p.apellido].filter(Boolean).join(' ') || 'Alumno',avatar_url:p.foto,color:'#b25aff'
      });
    }
  }
  return {students:[...profiles.values()],marks:marks.data || []};
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
