// Shown when Supabase env vars are not set. Makes the "blank page" situation
// immediately legible instead of a silent network error.
import { isSupabaseConfigured } from '@/lib/api/supabase';

export function UnconfiguredBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: 9999,
        background: '#d97706',
        color: '#fff',
        padding: '10px 16px',
        fontSize: 14,
        textAlign: 'center',
        direction: 'rtl',
      }}
    >
      ⚠️ משתני הסביבה של Supabase אינם מוגדרים —{' '}
      <code style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '1px 5px' }}>
        VITE_SUPABASE_URL
      </code>{' '}
      ו-
      <code style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '1px 5px' }}>
        VITE_SUPABASE_ANON_KEY
      </code>{' '}
      נדרשים. ההתחברות לא תפעל עד להגדרתם.
    </div>
  );
}
