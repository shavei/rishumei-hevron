// Student shell: activates the student token for PostgREST and guards routes.
import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';

export function StudentLayout() {
  const { studentToken, activate, logoutStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (studentToken) activate('student');
  }, [studentToken, activate]);

  if (!studentToken) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-16">
      <header className="flex items-center justify-between py-3">
        <h1 className="text-lg font-bold text-accent">רישומי חברון</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logoutStudent();
              navigate('/login');
            }}
          >
            התנתקות
          </Button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
