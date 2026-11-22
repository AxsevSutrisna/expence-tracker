import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const readStoredTheme = (): Theme => {
  try {
    return (localStorage.getItem('theme') as Theme) || 'light';
  } catch {
    return 'light';
  }
};

/**
 * Mengelola tema terang/gelap aplikasi: menyetel atribut `data-theme` pada
 * <html> dan menyimpannya di localStorage. Dipakai di semua halaman agar tema
 * tetap konsisten lintas route (mis. Dashboard & Perencana Gaji).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* Penyimpanan bisa gagal (mode privat) — abaikan. */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
}
