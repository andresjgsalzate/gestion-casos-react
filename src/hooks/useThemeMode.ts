import { useState, useEffect, useCallback } from 'react';

export const useThemeMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Recuperar preferencia del localStorage o usar false por defecto
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev: boolean) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  }, []);

  useEffect(() => {
    // Sincronizar con localStorage cuando cambie el estado
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return {
    isDarkMode,
    toggleTheme,
  };
};
