'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
}

interface ThemeState {
  colors: ThemeColors;
  companyName: string;
  logo: string;
  setColors: (colors: Partial<ThemeColors>) => void;
  setCompanyName: (name: string) => void;
  setLogo: (logo: string) => void;
  resetToDefault: () => void;
}

const defaultColors: ThemeColors = {
  primary: '222.2 84% 4.9%',
  primaryForeground: '210 40% 98%',
  secondary: '210 40% 96%',
  secondaryForeground: '222.2 84% 4.9%',
  accent: '210 40% 96%',
  accentForeground: '222.2 84% 4.9%',
  background: '0 0% 100%',
  foreground: '222.2 84% 4.9%',
  muted: '210 40% 96%',
  mutedForeground: '215.4 16.3% 46.9%',
  border: '214.3 31.8% 91.4%',
  input: '214.3 31.8% 91.4%',
  ring: '222.2 84% 4.9%',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colors: defaultColors,
      companyName: 'Loja de Bijuterias',
      logo: '',
      
      setColors: (newColors) =>
        set((state) => ({
          colors: { ...state.colors, ...newColors },
        })),
      
      setCompanyName: (name) =>
        set({ companyName: name }),
      
      setLogo: (logo) =>
        set({ logo }),
      
      resetToDefault: () =>
        set({
          colors: defaultColors,
          companyName: 'Ponto Dourado',
          logo: '',
        }),
    }),
    {
      name: 'theme-store',
    }
  )
);