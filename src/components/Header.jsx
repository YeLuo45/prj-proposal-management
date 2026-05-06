import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataHealthIndicator from './DataHealthIndicator';
import SyncStatusIndicator from './SyncStatusIndicator';
import { useTheme } from '../contexts/ThemeContext';

function Header({ onAdd, onShowHistory, onOpenNotifications, onShowShortcuts, onOpenSearch, notificationCount, dataHealth, onOpenExportModal }) {
  const { t } = useTranslation();
  const { errors = [], warnings = [] } = dataHealth || {};
  const location = useLocation();
  const { themeId } = useTheme();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path) => {
    const base = 'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors';
    return isActive(path)
      ? `${base} bg-blue-500 text-white dark:bg-blue-600`
      : `${base} bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700`;
  };

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
          <Link to="/settings" className={navLinkClass('/settings')}>
            ⚙️ {t('app.settings')}
          </Link>

          {/* Sync Status Indicator */}
          <SyncStatusIndicator compact />
          {errors.length > 0 && (
            <div title={`${errors.length} ${t('dataHealth.errors')}，${warnings.length} ${t('dataHealth.warnings')}`}>
              <div className="flex items-center gap-2">
                <DataHealthIndicator errors={errors} warnings={warnings} errorDetails={errors} />
              </div>
            </div>
          )}
          <button
            onClick={onOpenNotifications}
            className="relative bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 flex items-center gap-2"
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
            onClick={onOpenSearch}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 flex items-center gap-2"
            title="搜索 (Cmd+K)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <kbd className="hidden md:inline text-xs border border-gray-400 dark:border-gray-500 rounded px-1">K</kbd>
          </button>
          <button
            onClick={onAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span> {t('app.addProposal')}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
