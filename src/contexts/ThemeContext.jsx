import { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  light: {
    id: 'light',
    name: '浅色',
    bg: 'bg-gray-100',
    bgAlt: 'bg-white',
    text: 'text-gray-800',
    textAlt: 'text-gray-600',
    border: 'border-gray-200',
    primary: 'bg-blue-500',
    primaryHover: 'bg-blue-600',
    primaryText: 'text-white',
  },
  dark: {
    id: 'dark',
    name: '深色',
    bg: 'bg-gray-900',
    bgAlt: 'bg-gray-800',
    text: 'text-gray-100',
    textAlt: 'text-gray-300',
    border: 'border-gray-700',
    primary: 'bg-blue-600',
    primaryHover: 'bg-blue-700',
    primaryText: 'text-white',
  },
  forest: {
    id: 'forest',
    name: '森林',
    bg: 'bg-green-950',
    bgAlt: 'bg-green-900',
    text: 'text-green-100',
    textAlt: 'text-green-300',
    border: 'border-green-800',
    primary: 'bg-green-600',
    primaryHover: 'bg-green-700',
    primaryText: 'text-white',
  },
  sunset: {
    id: 'sunset',
    name: '日落',
    bg: 'bg-orange-950',
    bgAlt: 'bg-orange-900',
    text: 'text-orange-100',
    textAlt: 'text-orange-300',
    border: 'border-orange-800',
    primary: 'bg-orange-500',
    primaryHover: 'bg-orange-600',
    primaryText: 'text-white',
  },
};

const ThemeContext = createContext({
  theme: themes.light,
  themeId: 'light',
  setThemeId: () => {},
  themes,
});

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('themeId') || 'light';
  });

  useEffect(() => {
    // Remove all theme classes
    Object.values(themes).forEach(t => {
      document.documentElement.classList.remove(`theme-${t.id}`);
    });
    // Add current theme
    document.documentElement.classList.add(`theme-${themeId}`);
    localStorage.setItem('themeId', themeId);
    
    // Also handle dark mode for compatibility
    if (themeId === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ theme: themes[themeId], themeId, setThemeId, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export { themes };
