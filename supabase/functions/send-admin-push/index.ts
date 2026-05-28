// send-admin-push — best-effort Web Push to all admin devices (spec §31, Appendix D).
// "admin" is one logical actor; every admin device shares the same bucket.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

interface AdminPushPayload {
  kind: string;
  title: string;
  body: string;
  url: string;
  severity: 'info' | 'warn' | 'urgent';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const payload = (await req.json()) as AdminPushPayload;
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
    .from('push_subscriptions_admin')
    .select('id, subscription');

  let attempted = 0;
  let failed = 0;
  const notification = JSON.stringify(payload);

  for (const sub of subs ?? []) {
    attempted++;
    try {
      await webpush.sendNotification(sub.subscription, notification);
    } catch (err) {
      failed++;
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from('push_subscriptions_admin').delete().eq('id', sub.id);
      }
    }
  }

  return jsonResponse({ attempted, failed });
});
