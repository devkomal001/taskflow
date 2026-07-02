import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('taskflow_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to dark mode for SaaS look
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      // Set CSS variables for dark mode
      root.style.setProperty('--app-bg', '#030B24');
      root.style.setProperty('--main-bg', '#030B24');
      root.style.setProperty('--surface', '#07153D');
      root.style.setProperty('--surface-2', '#0b1c4f');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#A0AEC0');
      root.style.setProperty('--border', 'rgba(40, 108, 252, 0.15)');
      document.body.style.backgroundColor = '#030B24';
      document.body.style.color = '#FFFFFF';
    } else {
      root.classList.remove('dark');
      // Set CSS variables for light mode
      root.style.setProperty('--app-bg', '#f4f6fa');
      root.style.setProperty('--main-bg', '#eef2f8');
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--surface-2', '#f8fafc');
      root.style.setProperty('--text-primary', '#0d1e3d');
      root.style.setProperty('--text-secondary', 'rgba(13, 30, 61, 0.6)');
      root.style.setProperty('--border', 'rgba(40, 108, 252, 0.1)');
      document.body.style.backgroundColor = '#f4f6fa';
      document.body.style.color = '#0d1e3d';
    }
    localStorage.setItem('taskflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
