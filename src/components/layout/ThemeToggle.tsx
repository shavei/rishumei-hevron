import { useTheme } from '@/store/theme';
import { Button } from '@/components/ui/Button';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="החלף מצב תצוגה">
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}
