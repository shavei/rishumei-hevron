// send-student-push — best-effort Web Push to a student's devices (spec §31, Appendix D).
// Transport: RFC 8291 / VAPID. Reuses the attendance project's VAPID transport pattern.
// On 404/410 from the push service, increment failure_count and prune stale subs.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

interface StudentPushPayload {
  student_id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const payload = (await req.json()) as StudentPushPayload;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const { data: subs } = await supabase
    .from('push_subscriptions_student')
    .select('id, subscription')
    .eq('student_id', payload.student_id);

  let attempted = 0;
  let failed = 0;
  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    kind: payload.kind,
  });

  for (const sub of subs ?? []) {
    attempted++;
    try {
      await webpush.sendNotification(sub.subscription, notification);
    } catch (err) {
      failed++;
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from('push_subscriptions_student').delete().eq('id', sub.id);
      } else {
        await supabase.rpc('increment_push_failure', { p_table: 'student', p_id: sub.id }).catch(() => {});
      }
    }
  }

  return jsonResponse({ attempted, failed });
});
