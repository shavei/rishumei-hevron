// Student + lookup API wrappers (admin, RLS-scoped reads).
import { supabase } from './supabase';

const COLUMNS = 'id, id_number, full_name, grade, class_id, is_active, last_imported_at';

export interface StudentRow {
  id: string;
  id_number: string;
  full_name: string;
  grade: string;
  class_id: string;
  is_active: boolean;
  last_imported_at: string | null;
}

export async function listStudents(opts: { grade?: string; activeOnly?: boolean } = {}) {
  let q = supabase.from('students').select(COLUMNS).order('full_name');
  if (opts.grade) q = q.eq('grade', opts.grade);
  if (opts.activeOnly) q = q.eq('is_active', true);
  return q.returns<StudentRow[]>();
}

export async function listGroups() {
  return supabase.from('groups').select('id, name, description').order('name');
}
