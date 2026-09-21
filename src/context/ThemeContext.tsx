import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  zenMode: boolean;
  toggleZenMode: () => void;
  setZenMode: (zen: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('jasne_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // Domyślnie preferujemy Light Mode zgodnie z wytycznymi marki "JASNE."
      return 'light';
    } catch {
      return 'light';
    }
  });

  const [zenMode, setZenMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jasne_zen_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('jasne_theme', theme);
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        document.body.style.backgroundColor = '#0B0F17';
        document.body.style.color = '#F8FAFC';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        document.body.style.backgroundColor = '#F8FAFC';
        document.body.style.color = '#0F172A';
      }
    } catch (e) {
      console.error('Theme persist error:', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('jasne_zen_mode', String(zenMode));
    } catch (e) {
      console.error('Zen mode persist error:', e);
    }
  }, [zenMode]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleZenMode = () => {
    setZenMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme: setThemeState,
        zenMode,
        toggleZenMode,
        setZenMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
