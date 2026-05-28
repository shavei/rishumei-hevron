// csv-import-validate — parse + normalize + diff against `students` (spec §17).
// Stateless heavy work: the SPA POSTs parsed rows; we return a preview diff and
// persist a csv_import_runs row in `previewing` state for a later commit.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  ALLOWED_GRADES,
  mapHeader,
  normalizeClassId,
  normalizeHebrew,
  normalizeIdNumber,
} from '../_shared/hebrew.ts';

type RawRow = Record<string, string>;
type RowError = { row: number; value: string; reason: string };

interface NormalizedStudent {
  id_number: string;
  full_name: string;
  grade: string;
  class_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { rows } = (await req.json()) as { rows: RawRow[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return jsonResponse({ error: 'empty_file' }, 400);
    }
    if (rows.length > 5000) {
      // allowed with confirmation on the client; flagged here for the UI.
      // (We still process — the warning is surfaced in the preview.)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const errors: RowError[] = [];
    const normalized: NormalizedStudent[] = [];
    const seenIds = new Set<string>();
    const dupes = new Set<string>();

    rows.forEach((raw, i) => {
      const rowNum = i + 2; // header is row 1
      const mapped: Partial<NormalizedStudent> = {};
      for (const [k, v] of Object.entries(raw)) {
        const field = mapHeader(k);
        if (!field || field === 'phone') continue;
        (mapped as Record<string, string>)[field] = v;
      }

      const id = normalizeIdNumber(mapped.id_number ?? '');
      const fullName = normalizeHebrew(mapped.full_name ?? '');
      const grade = normalizeHebrew(mapped.grade ?? '');
      const classId = normalizeClassId(mapped.class_id ?? '');

      if (!id) {
        errors.push({ row: rowNum, value: mapped.id_number ?? '', reason: 'מספר זהות לא תקין' });
        return;
      }
      if (seenIds.has(id)) dupes.add(id);
      seenIds.add(id);

      if (!fullName) {
        errors.push({ row: rowNum, value: '', reason: 'שם חסר' });
        return;
      }
      if (!ALLOWED_GRADES.includes(grade)) {
        errors.push({ row: rowNum, value: grade, reason: `שכבה לא מוכרת. מותר: ${ALLOWED_GRADES.join(', ')}` });
        return;
      }
      normalized.push({ id_number: id, full_name: fullName, grade, class_id: classId });
    });

    // duplicate id_number in CSV => reject the whole import (spec §17.5)
    if (dupes.size > 0) {
      return jsonResponse({ error: 'duplicate_ids', duplicates: [...dupes] }, 400);
    }

    // diff against existing students
    const { data: existing, error: dbErr } = await supabase
      .from('students')
      .select('id, id_number, full_name, grade, class_id, is_active');
    if (dbErr) return jsonResponse({ error: 'db_error', detail: dbErr.message }, 500);

    const byId = new Map((existing ?? []).map((s) => [s.id_number, s]));
    const csvIds = new Set(normalized.map((s) => s.id_number));

    const toCreate: NormalizedStudent[] = [];
    const toUpdate: { id_number: string; changes: Record<string, [string, string]>; reactivate: boolean }[] = [];

    for (const s of normalized) {
      const prev = byId.get(s.id_number);
      if (!prev) {
        toCreate.push(s);
        continue;
      }
      const changes: Record<string, [string, string]> = {};
      for (const f of ['full_name', 'grade', 'class_id'] as const) {
        if (prev[f] !== s[f]) changes[f] = [prev[f], s[f]];
      }
      const reactivate = prev.is_active === false;
      if (Object.keys(changes).length > 0 || reactivate) {
        toUpdate.push({ id_number: s.id_number, changes, reactivate });
      }
    }

    // students present before but missing from CSV => inactivate (only if active)
    const toInactivate = (existing ?? [])
      .filter((s) => s.is_active && !csvIds.has(s.id_number))
      .map((s) => ({ id_number: s.id_number, full_name: s.full_name }));

    const summary = {
      created: toCreate.length,
      updated: toUpdate.length,
      inactivated: toInactivate.length,
      errors: errors.length,
      total_rows: rows.length,
      over_limit: rows.length > 5000,
    };

    const preview = { toCreate, toUpdate, toInactivate, errors };

    const { data: run, error: runErr } = await supabase
      .from('csv_import_runs')
      .insert({ status: 'previewing', summary, errors, preview })
      .select('id')
      .single();
    if (runErr) return jsonResponse({ error: 'db_error', detail: runErr.message }, 500);

    return jsonResponse({ run_id: run.id, summary, preview });
  } catch (e) {
    return jsonResponse({ error: 'parse_error', detail: String(e) }, 400);
  }
});
