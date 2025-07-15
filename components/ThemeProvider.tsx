'use client';

import { useEffect, useState } from 'react';

interface ThemeSettings {
  companyName: string;
  logo?: string;
  colors: {
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
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/theme-settings');
        if (response.ok) {
          const settings: ThemeSettings = await response.json();
          
          // Update document title
          document.title = settings.companyName;
          
          // Update CSS custom properties
          const root = document.documentElement;
          Object.entries(settings.colors).forEach(([key, value]) => {
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, value);
          });
          
          // Store in localStorage for faster subsequent loads
          localStorage.setItem('theme-settings', JSON.stringify(settings));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Try to load from localStorage as fallback
        const cached = localStorage.getItem('theme-settings');
        if (cached) {
          const settings = JSON.parse(cached);
          document.title = settings.companyName;
          const root = document.documentElement;
          Object.entries(settings.colors).forEach(([key, value]) => {
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, value);
          });
        }
      } finally {
        setThemeLoaded(true);
      }
    };

    // Try to load from cache first for immediate application
    const cached = localStorage.getItem('theme-settings');
    if (cached) {
      try {
        const settings = JSON.parse(cached);
        document.title = settings.companyName;
        const root = document.documentElement;
        Object.entries(settings.colors).forEach(([key, value]) => {
          const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssVar, value);
        });
      } catch (error) {
        console.error('Error parsing cached theme:', error);
      }
    }

    loadTheme();
  }, []);

  if (!themeLoaded) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

function SplashScreen() {
  const [settings, setSettings] = useState<ThemeSettings | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('theme-settings');
    if (cached) {
      try {
        setSettings(JSON.parse(cached));
      } catch (error) {
        console.error('Error parsing cached settings:', error);
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-50">
      <div className="text-center text-white">
        {settings?.logo && (
          <img 
            src={settings.logo} 
            alt={settings.companyName} 
            className="h-16 w-auto mx-auto mb-4 animate-pulse"
          />
        )}
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}