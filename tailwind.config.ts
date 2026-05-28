import type { Config } from 'tailwindcss';
import rtl from 'tailwindcss-rtl';

// Colors map to CSS variables (see src/styles/tokens.css) so dark mode is a
// data-attribute swap, never a second Tailwind palette.
const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--rh-bg)',
        'bg-2': 'var(--rh-bg-2)',
        surface: 'var(--rh-surface)',
        border: 'var(--rh-border)',
        text: 'var(--rh-text)',
        'text-muted': 'var(--rh-text-muted)',
        'text-subtle': 'var(--rh-text-subtle)',
        accent: 'var(--rh-accent)',
        'accent-fg': 'var(--rh-accent-fg)',
        success: 'var(--rh-success)',
        warning: 'var(--rh-warning)',
        danger: 'var(--rh-danger)',
        info: 'var(--rh-info)',
      },
      borderRadius: {
        sm: 'var(--rh-radius-sm)',
        md: 'var(--rh-radius-md)',
        lg: 'var(--rh-radius-lg)',
        xl: 'var(--rh-radius-xl)',
      },
      boxShadow: {
        sm: 'var(--rh-shadow-sm)',
        md: 'var(--rh-shadow-md)',
        lg: 'var(--rh-shadow-lg)',
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [rtl],
};

export default config;
