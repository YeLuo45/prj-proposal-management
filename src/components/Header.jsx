import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataHealthIndicator from './DataHealthIndicator';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import SyncStatusIndicator from './SyncStatusIndicator';
import { useTheme } from '../contexts/ThemeContext';

function Header({ onAdd, onSettings, onShowHistory, onOpenNotifications, onShowShortcuts, notificationCount, dataHealth }) {
  const { t } = useTranslation();
  const { errors = [], warnings = [] } = dataHealth || {};
  const location = useLocation();
  const { themeId, setThemeId } = useTheme();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path) => {
    const base = 'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors';
    return isActive(path)
      ? `${base} bg-blue-500 text-white`
      : `${base} bg-gray-500 text-white hover:bg-gray-600`;
  };

  const toggleDarkMode = () => {
    // If currently in a non-light theme, switch to light; otherwise toggle dark
    if (themeId !== 'light') {
      setThemeId('light');
    } else {
      setThemeId(themeId === 'dark' ? 'light' : 'dark');
    }
  };

  const isDark = themeId === 'dark' || themeId === 'forest' || themeId === 'sunset';

  return (
    <header className="bg-white dark:bg-gray-800 shadow desktop-header">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('app.title')}</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/" className={navLinkClass('/')}>
            {t('app.list')}
          </Link>
          <Link to="/kanban" className={navLinkClass('/kanban')}>
            {t('app.kanban')}
          </Link>
          <Link to="/gantt" className={navLinkClass('/gantt')}>
            {t('app.gantt')}
          </Link>
          <Link to="/dashboard" className={navLinkClass('/dashboard')}>
            {t('app.dashboard')}
          </Link>
          <Link to="/marketplace" className={navLinkClass('/marketplace')}>
            📦 模板市场
          </Link>
          
          <LanguageSwitcher />
          
          {/* Theme Switcher - 4 color themes */}
          <ThemeSwitcher />

          {/* Sync Status Indicator */}
          <SyncStatusIndicator compact />
          
          <button
            onClick={toggleDarkMode}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            title={isDark ? t('app.switchToLight') : t('app.switchToDark')}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          {errors.length > 0 && (
            <div title={`${errors.length} ${t('dataHealth.errors')}，${warnings.length} ${t('dataHealth.warnings')}`}>
              <div className="flex items-center gap-2">
                <DataHealthIndicator errors={errors} warnings={warnings} errorDetails={errors} />
              </div>
            </div>
          )}
          <button
            onClick={onOpenNotifications}
            className="relative bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            title={t('notificationCenter.title')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={onShowHistory}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            title={t('operationHistory.title')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">{t('app.history')}</span>
          </button>
          <button
            onClick={onShowShortcuts}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            title={t('keyboardShortcuts.title') || 'Keyboard Shortcuts'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <kbd className="hidden md:inline text-xs border border-gray-400 dark:border-gray-500 rounded px-1">?</kbd>
          </button>
          <button
            onClick={onAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <span>+</span> {t('app.addProposal')}
          </button>
          <button
            onClick={onSettings}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            {t('app.settings')}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
