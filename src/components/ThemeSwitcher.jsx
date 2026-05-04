import { useTheme, themes } from '../contexts/ThemeContext';

function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme();

  const themeOptions = [
    { id: 'light', label: '浅色', color: 'bg-gray-100 border-gray-300' },
    { id: 'dark', label: '深色', color: 'bg-gray-800 border-gray-600' },
    { id: 'forest', label: '森林', color: 'bg-green-900 border-green-700' },
    { id: 'sunset', label: '日落', color: 'bg-orange-900 border-orange-700' },
  ];

  return (
    <div className="relative inline-flex items-center gap-1">
      {themeOptions.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setThemeId(opt.id)}
          title={opt.label}
          className={`
            w-7 h-7 rounded-full border-2 transition-all
            ${opt.color}
            ${themeId === opt.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100'}
          `}
        >
          {themeId === opt.id && (
            <span className="sr-only">{opt.label}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default ThemeSwitcher;
