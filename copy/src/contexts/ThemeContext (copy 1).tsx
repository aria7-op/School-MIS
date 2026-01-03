import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<'light' | 'dark'>('light');
  const [theme, setTheme] = useState(LIGHT_THEME);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        setModeState(stored);
        setTheme(stored === 'dark' ? DARK_THEME : LIGHT_THEME);
      } else {
        // Always default to light mode
        setModeState('light');
        setTheme(LIGHT_THEME);
      }
    })();
  }, []);

  const setMode = (newMode: 'light' | 'dark') => {
    setModeState(newMode);
    setTheme(newMode === 'dark' ? DARK_THEME : LIGHT_THEME);
    AsyncStorage.setItem(THEME_KEY, newMode);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
