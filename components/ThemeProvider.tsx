'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colors, companyName } = useThemeStore();

  useEffect(() => {
    // Atualizar título da página
    document.title = companyName;
    
    // Atualizar CSS custom properties
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }, [colors, companyName]);

  return <>{children}</>;
}