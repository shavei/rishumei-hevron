// Edge Function callers (spec §17). Send the active JWT for authorization.
import { FUNCTIONS_BASE } from './supabase';
import { tokenStore } from './tokenStore';

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenStore.getActive() ?? ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

export interface ImportPreview {
  toCreate: { id_number: string; full_name: string; grade: string; class_id: string }[];
  toUpdate: { id_number: string; changes: Record<string, [string, string]>; reactivate: boolean }[];
  toInactivate: { id_number: string; full_name?: string }[];
  errors: { row: number; value: string; reason: string }[];
}

export interface ImportSummary {
  created: number;
  updated: number;
  inactivated: number;
  errors: number;
  total_rows: number;
  over_limit: boolean;
}

export function csvImportValidate(rows: Record<string, string>[]) {
  return callFunction<{ run_id?: string; summary?: ImportSummary; preview?: ImportPreview; error?: string; duplicates?: string[] }>(
    'csv-import-validate',
    { rows },
  );
}

export function csvImportCommit(runId: string) {
  return callFunction<{ status?: string; summary?: ImportSummary; error?: string }>('csv-import-commit', {
    run_id: runId,
  });
}
