// csv-import-commit — apply a previously previewed diff (spec §17.3, §17.4, §17.6).
// Never deletes a student; never touches system-owned columns except activity
// flags; never writes back to the source.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

interface Preview {
  toCreate: { id_number: string; full_name: string; grade: string; class_id: string }[];
  toUpdate: { id_number: string; changes: Record<string, [string, string]>; reactivate: boolean }[];
  toInactivate: { id_number: string }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { run_id } = (await req.json()) as { run_id: string };
    if (!run_id) return jsonResponse({ error: 'missing_run_id' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: run, error: runErr } = await supabase
      .from('csv_import_runs')
      .select('id, status, preview')
      .eq('id', run_id)
      .single();
    if (runErr || !run) return jsonResponse({ error: 'run_not_found' }, 404);
    if (run.status !== 'previewing') return jsonResponse({ error: 'already_applied' }, 409);

    const preview = run.preview as Preview;
    const now = new Date().toISOString();

    // 1. create new students
    if (preview.toCreate.length > 0) {
      const { error } = await supabase.from('students').insert(
        preview.toCreate.map((s) => ({ ...s, last_imported_at: now })),
      );
      if (error) throw error;
    }

    // 2. update source-owned fields + reactivate when present again
    for (const u of preview.toUpdate) {
      const patch: Record<string, unknown> = { last_imported_at: now };
      for (const [field, [, next]] of Object.entries(u.changes)) patch[field] = next;
      if (u.reactivate) {
        patch.is_active = true;
        patch.inactivated_at = null;
        patch.inactivated_reason = null;
      }
      const { error } = await supabase.from('students').update(patch).eq('id_number', u.id_number);
      if (error) throw error;
    }

    // 3. inactivate students no longer in the CSV (soft; never delete)
    for (const s of preview.toInactivate) {
      const { error } = await supabase
        .from('students')
        .update({ is_active: false, inactivated_at: now, inactivated_reason: 'csv_missing' })
        .eq('id_number', s.id_number);
      if (error) throw error;
    }

    // 4. mark all still-present students as imported now
    const presentIds = [
      ...preview.toCreate.map((s) => s.id_number),
      ...preview.toUpdate.map((s) => s.id_number),
    ];
    if (presentIds.length > 0) {
      await supabase.from('students').update({ last_imported_at: now }).in('id_number', presentIds);
    }

    const summary = {
      created: preview.toCreate.length,
      updated: preview.toUpdate.length,
      inactivated: preview.toInactivate.length,
    };
    await supabase
      .from('csv_import_runs')
      .update({ status: 'committed', finished_at: now, summary })
      .eq('id', run_id);

    return jsonResponse({ status: 'committed', summary });
  } catch (e) {
    return jsonResponse({ error: 'commit_failed', detail: String(e) }, 500);
  }
});
