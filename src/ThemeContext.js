import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  console.log('🎨 ThemeProvider initializing...');
  
  const [isDark, setIsDark] = useState(() => {
    // Safely handle localStorage and window objects
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('theme');
        if (saved) {
          console.log('📱 Loaded saved theme:', saved);
          return saved === 'dark';
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('🌙 System prefers dark:', prefersDark);
        return prefersDark;
      } catch (error) {
        console.warn('⚠️ Error accessing localStorage or matchMedia:', error);
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const value = {
    isDark,
    toggleTheme,
    theme: isDark ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
