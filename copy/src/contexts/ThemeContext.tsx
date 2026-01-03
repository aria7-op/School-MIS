import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  ReactNode,
} from 'react';

const LIGHT_THEME = {
  dark: false,
  colors: {
    primary: '#6366f1',
    background: '#ffffff',
    card: '#f8f9fa',
    text: '#212529',
    border: '#dee2e6',
    notification: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    secondary: '#8b5cf6',
    textSecondary: '#6b7280',
    gray: '#6b7280',
  },
};

const DARK_THEME = {
  dark: true,
  colors: {
    primary: '#6366f1',
    background: '#18181b',
    card: '#23232a',
    text: '#f3f4f6',
    border: '#27272a',
    notification: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    secondary: '#8b5cf6',
    textSecondary: '#a1a1aa',
    gray: '#a1a1aa',
  },
};

const THEME_KEY = 'app_theme_mode';

interface ThemeContextType {
  theme: typeof LIGHT_THEME;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const deriveInitialMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<'light' | 'dark'>(() => deriveInitialMode());
  const [theme, setTheme] = useState(mode === 'dark' ? DARK_THEME : LIGHT_THEME);

  useEffect(() => {
    setTheme(mode === 'dark' ? DARK_THEME : LIGHT_THEME);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_KEY, mode);
      }
    } catch {
      // ignore storage errors
    }
  }, [mode]);

  const setMode = (newMode: 'light' | 'dark') => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useIsomorphicLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.setAttribute('data-theme', mode);
    }
  }, [mode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.setAttribute('data-theme', mode);
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
};
