// Admin shell: activates the admin token and guards admin routes.
import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: 'סקירה', end: true },
  { to: '/admin/registrations', label: 'רישומים' },
  { to: '/admin/students', label: 'תלמידים' },
  { to: '/admin/import', label: 'ייבוא CSV' },
  { to: '/admin/settings', label: 'הגדרות' },
];

export function AdminLayout() {
  const { adminToken, activate, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminToken) activate('admin');
  }, [adminToken, activate]);

  if (!adminToken) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <h1 className="text-lg font-bold text-accent">רישומי חברון · ניהול</h1>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm transition',
                  isActive ? 'bg-accent text-accent-fg' : 'text-text-muted hover:bg-bg-2',
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logoutAdmin();
              navigate('/admin/login');
            }}
          >
            יציאה
          </Button>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
