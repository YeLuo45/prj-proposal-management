import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataHealthIndicator from './DataHealthIndicator';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import SyncStatusIndicator from './SyncStatusIndicator';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { githubApi } from '../services/githubApi';
import JSZip from 'jszip';

function Header({ onAdd, onSettings, onShowHistory, onOpenNotifications, onShowShortcuts, onOpenSearch, notificationCount, dataHealth, onOpenExportModal }) {
  const { t } = useTranslation();
  const { errors = [], warnings = [] } = dataHealth || {};
  const location = useLocation();
  const { themeId, setThemeId } = useTheme();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const toggleDarkMode = () => {
    // If currently in a non-light theme, switch to light; otherwise toggle dark
    if (themeId !== 'light') {
      setThemeId('light');
    } else {
      setThemeId(themeId === 'dark' ? 'light' : 'dark');
    }
  };

  const isDark = themeId === 'dark' || themeId === 'forest' || themeId === 'sunset';

  const handleExportBackup = async () => {
    setShowExportMenu(false);
    setExporting(true);
    try {
      // Fetch latest data from GitHub
      const [proposalsRes, milestonesRes] = await Promise.all([
        githubApi.fetchProposals(),
        githubApi.fetchMilestones()
      ]);

      const projects = proposalsRes.data?.projects || proposalsRes.data || [];
      const milestones = milestonesRes.data?.milestones || milestonesRes.data || [];

      // Generate backup JSON with version + exportedAt + data
      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        generator: 'prj-proposals-manager',
        data: { projects, milestones }
      };

      // Create ZIP using JSZip
      const zip = new JSZip();
      zip.file('backup.json', JSON.stringify(backupData, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposals-backup-${new Date().toISOString().split('T')[0].replace(/-/g, '')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('导出失败：' + e.message);
    } finally {
      setExporting(false);
    }
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

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
              title="导出/导入数据"
            >
              {exporting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span className="hidden sm:inline">导出</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                <button
                  onClick={handleExportBackup}
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  导出数据备份
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600"></div>
                <button
                  onClick={() => { setShowExportMenu(false); onOpenExportModal?.(); }}
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  导入数据
                </button>
              </div>
            )}
          </div>

          <LanguageSwitcher />
          
          {/* Theme Switcher - 4 color themes */}
          <ThemeSwitcher />

          {/* Sync Status Indicator */}
          <SyncStatusIndicator compact />
          
          <button
            onClick={toggleDarkMode}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center gap-2"
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
            onClick={onShowHistory}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 flex items-center gap-2"
            title={t('operationHistory.title')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">{t('app.history')}</span>
          </button>
          <button
            onClick={onShowShortcuts}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 flex items-center gap-2"
            title={t('keyboardShortcuts.title') || 'Keyboard Shortcuts'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <kbd className="hidden md:inline text-xs border border-gray-400 dark:border-gray-500 rounded px-1">?</kbd>
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
          <button
            onClick={onSettings}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            {t('app.settings')}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
