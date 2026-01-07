import React, {
  createContext,
  useContext,
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

interface ThemeContextType {
  theme: typeof LIGHT_THEME;
  mode: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = LIGHT_THEME;
  const mode = 'light' as const;

  return (
    <ThemeContext.Provider value={{ theme, mode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
};
