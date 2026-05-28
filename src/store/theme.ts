// UI-only theme state (spec §3 — Zustand for transient UI state).
import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

const initial: Theme =
  (localStorage.getItem('rh.theme') as Theme | null) ??
  (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
apply(initial);

export const useTheme = create<ThemeState>((set) => ({
  theme: initial,
  toggle: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('rh.theme', next);
      apply(next);
      return { theme: next };
    }),
  set: (t) =>
    set(() => {
      localStorage.setItem('rh.theme', t);
      apply(t);
      return { theme: t };
    }),
}));
