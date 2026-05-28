// export-build — server-side export generation (spec §30, Appendix E).
// Streams a single file to the browser; never assembled in the SPA.
// v1 implements xlsx (multi-sheet, RTL, Hebrew). PDF/CSV/JSON share the loader.
//
// NOTE: this is the Phase 10 scaffold. The data-loading + status-derivation
// helpers are wired; the ExcelJS workbook assembly is stubbed where marked.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'json';

interface ExportRequest {
  registration_id: string;
  format: ExportFormat;
  include_pii?: boolean; // names always; id/phone only on explicit opt-in (spec §10)
}

function deriveStatus(seenAt: string | null, hasResponse: boolean): string {
  if (hasResponse) return 'ענה';
  if (seenAt) return 'ראה ולא ענה';
  return 'טרם נצפה';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { registration_id, format } = (await req.json()) as ExportRequest;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: reg } = await supabase
    .from('registrations')
    .select('id, title, questions_schema')
    .eq('id', registration_id)
    .single();
  if (!reg) return jsonResponse({ error: 'not_found' }, 404);

  const { data: targets } = await supabase
    .from('registration_targets')
    .select('student_id, student_snapshot, seen_at, removed_at')
    .eq('registration_id', registration_id)
    .is('removed_at', null);

  const { data: responses } = await supabase
    .from('responses')
    .select('student_id, values, responded_at, submitted_via, last_edited_by_admin_at')
    .eq('registration_id', registration_id);

  const respByStudent = new Map((responses ?? []).map((r) => [r.student_id, r]));

  const rows = (targets ?? []).map((t) => {
    const r = respByStudent.get(t.student_id);
    return {
      name: t.student_snapshot.full_name,
      grade: t.student_snapshot.grade,
      class_id: t.student_snapshot.class_id,
      status: deriveStatus(t.seen_at, !!r),
      seen_at: t.seen_at,
      responded_at: r?.responded_at ?? null,
      values: r?.values ?? {},
      edited_by_admin: r?.submitted_via === 'admin_on_behalf' || !!r?.last_edited_by_admin_at,
    };
  });

  if (format === 'json') {
    return jsonResponse({ registration: reg.title, rows });
  }

  // TODO(phase-10): build ExcelJS workbook (RTL, freeze row 1, text-format IDs),
  // pdfmake PDF with embedded Hebrew font, and native CSV per Appendix E.
  // Return as a Blob with Content-Disposition: attachment.
  return jsonResponse({ status: 'not_implemented', format, row_count: rows.length }, 501);
});
