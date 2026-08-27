import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type AdminTheme = 'dark' | 'light' | 'system';
export type ResolvedAdminTheme = 'dark' | 'light';

interface AdminThemeContextType {
  theme: AdminTheme;
  resolvedTheme: ResolvedAdminTheme;
  setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => null,
});

const THEME_STORAGE_KEY = 'a1print_admin_theme_v2';

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AdminTheme;
    return saved || 'dark';
  });

  const resolvedTheme = useMemo<ResolvedAdminTheme>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const sysTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(sysTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme: AdminTheme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  return (
    <AdminThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => useContext(AdminThemeContext);
