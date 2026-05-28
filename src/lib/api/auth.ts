// Auth API wrappers (spec §14.1, §14.2). Return { data, error } shape.
import { supabase } from './supabase';

export interface StudentSession {
  token: string;
  student_id: string;
  full_name: string;
  grade: string;
  class_id: string;
}

type ApiResult<T> = { data: T | null; error: string | null };

export async function studentLogin(idNumber: string): Promise<ApiResult<StudentSession>> {
  const { data, error } = await supabase.rpc('student_login', { p_id_number: idNumber });
  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error };
  return { data: data as StudentSession, error: null };
}

export async function adminLogin(pin: string): Promise<ApiResult<{ token: string }>> {
  const { data, error } = await supabase.rpc('admin_login', { p_pin: pin });
  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error };
  return { data: data as { token: string }, error: null };
}

export async function changeAdminPin(newPin: string): Promise<ApiResult<{ ok: true }>> {
  const { data, error } = await supabase.rpc('change_admin_pin', { p_new_pin: newPin });
  if (error) return { data: null, error: error.message };
  return { data: data as { ok: true }, error: null };
}
