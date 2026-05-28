// The ONLY realtime subscription in the app (spec §15). Scoped to a single
// registration_id; invalidates monitor queries on target/response changes.
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/api/supabase';

export function useMonitorRealtime(registrationId: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!registrationId) return;
    const invalidate = () => qc.invalidateQueries({ queryKey: ['monitor', registrationId] });
    const channel = supabase
      .channel(`monitor:${registrationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'responses', filter: `registration_id=eq.${registrationId}` },
        invalidate,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registration_targets', filter: `registration_id=eq.${registrationId}` },
        invalidate,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [registrationId, qc]);
}
