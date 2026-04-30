import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('theme');
      return (stored as Theme) || 'system';
    } catch (e) {
      return 'system';
    }
  });

  const prefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'system') {
      if (prefersDark()) root.classList.add('dark');
      else root.classList.remove('dark');
    } else if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }, [theme]);

  // Listen to system preference changes when in 'system' mode
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler as any);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler as any);
    };
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  const isDark = theme === 'dark' || (theme === 'system' && prefersDark());

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
