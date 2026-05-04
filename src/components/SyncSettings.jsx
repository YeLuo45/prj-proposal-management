/**
 * SyncSettings - V21
 * Settings panel for GitHub synchronization configuration
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSync, SYNC_STATUS } from '../contexts/SyncContext';
import { githubApi } from '../services/githubApi';

export default function SyncSettings() {
  const { t } = useTranslation();
  const {
    hasToken,
    isOnline,
    autoSyncEnabled,
    syncInterval,
    lastSyncTime,
    syncStatus,
    lastError,
    setToken,
    triggerSync,
    updateSyncSettings,
    getFormattedLastSync,
    isSyncing,
  } = useSync();

  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [repoInfo, setRepoInfo] = useState(null);

  // Load current token for display
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setTokenInput(token);
    }
  }, []);

  // Fetch repo info when token is set
  useEffect(() => {
    if (hasToken) {
      githubApi.getRepoInfo()
        .then(info => setRepoInfo(info))
        .catch(() => setRepoInfo(null));
    }
  }, [hasToken]);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      setTokenError('Token cannot be empty');
      return;
    }

    setIsValidating(true);
    setTokenError(null);
    setTokenSaved(false);

    try {
      await setToken(tokenInput.trim());
      setTokenSaved(true);
      setTimeout(() => setTokenSaved(false), 2000);
    } catch (e) {
      setTokenError(e.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearToken = () => {
    setToken(null);
    setTokenInput('');
    setTokenSaved(false);
    setTokenError(null);
    setRepoInfo(null);
  };

  const handleManualSync = async () => {
    try {
      await triggerSync({ force: true });
    } catch (e) {
      // Error is handled by context
    }
  };

  const handleAutoSyncToggle = () => {
    updateSyncSettings({ autoSyncEnabled: !autoSyncEnabled });
  };

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 60000) {
      updateSyncSettings({ syncInterval: value });
    }
  };

  const formatInterval = (ms) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const lastSync = getFormattedLastSync();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        🔄 {t('syncSettings.title') || '同步设置'}
      </h2>

      {/* Token Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('syncSettings.githubToken') || 'GitHub Token'}
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {t('syncSettings.tokenDescription') || '用于访问和修改 GitHub 仓库中的数据。Token 仅存储在本地浏览器。'}
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showToken ? 'text' : 'password'}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={t('syncSettings.tokenPlaceholder') || 'ghp_xxxxxxxxxxxx'}
              className="w-full border rounded-lg px-3 py-2 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showToken ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <button
            onClick={handleSaveToken}
            disabled={isValidating}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg"
          >
            {isValidating ? t('syncSettings.validating') || '验证中...' : t('common.save')}
          </button>
          {hasToken && (
            <button
              onClick={handleClearToken}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              {t('common.delete')}
            </button>
          )}
        </div>

        {tokenError && (
          <p className="mt-2 text-sm text-red-500">❌ {tokenError}</p>
        )}
        {tokenSaved && (
          <p className="mt-2 text-sm text-green-500">✅ {t('syncSettings.tokenSaved') || 'Token 已保存'}</p>
        )}

        {/* Repo Info */}
        {repoInfo && (
          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{repoInfo.full_name}</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">{repoInfo.description}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('syncSettings.branch') || '分支'}: {repoInfo.default_branch}
              {repoInfo.archived && <span className="ml-2 text-orange-500">📦 Archived</span>}
            </p>
          </div>
        )}
      </div>

      {/* Auto Sync Settings */}
      {hasToken && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  {t('syncSettings.autoSync') || '自动同步'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {t('syncSettings.autoSyncDescription') || '定期自动从 GitHub 拉取最新数据'}
                </p>
              </div>
              <button
                onClick={handleAutoSyncToggle}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoSyncEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    autoSyncEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sync Interval */}
          {autoSyncEnabled && (
            <div className="mb-4 pl-4 border-l-2 border-blue-500">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('syncSettings.syncInterval') || '同步间隔'}
              </label>
              <select
                value={syncInterval}
                onChange={handleIntervalChange}
                className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value={60000}>1 min</option>
                <option value={180000}>3 min</option>
                <option value={300000}>5 min</option>
                <option value={600000}>10 min</option>
                <option value={1800000}>30 min</option>
                <option value={3600000}>1 hour</option>
              </select>
              <span className="ml-2 text-sm text-gray-500">
                ({formatInterval(syncInterval)})
              </span>
            </div>
          )}

          {/* Manual Sync */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  {t('syncSettings.manualSync') || '手动同步'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lastSync
                    ? `${t('syncSettings.lastSync') || '上次同步'}: ${lastSync.relative}`
                    : t('syncSettings.neverSynced') || '从未同步'}
                </p>
              </div>
              <button
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {t('syncSettings.syncing') || '同步中...'}
                  </>
                ) : (
                  <>
                    🔄 {t('syncSettings.syncNow') || '立即同步'}
                  </>
                )}
              </button>
            </div>

            {/* Last Sync Info */}
            {lastSync && (
              <p className="mt-2 text-xs text-gray-500">
                {lastSync.absolute}
              </p>
            )}

            {/* Error Display */}
            {syncStatus === SYNC_STATUS.ERROR && lastError && (
              <div className="mt-3 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-200">
                  ❌ {lastError.message}
                </p>
              </div>
            )}
          </div>

          {/* Sync Status */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              {t('syncSettings.status') || '同步状态'}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              {syncStatus === SYNC_STATUS.SUCCESS && (
                <>
                  <span className="text-green-500">✅</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('syncSettings.statusSuccess') || '已同步'}
                  </span>
                </>
              )}
              {syncStatus === SYNC_STATUS.ERROR && (
                <>
                  <span className="text-red-500">❌</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('syncSettings.statusError') || '同步失败'}
                  </span>
                </>
              )}
              {syncStatus === SYNC_STATUS.SYNCING && (
                <>
                  <span className="animate-spin">🔄</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('syncSettings.statusSyncing') || '同步中...'}
                  </span>
                </>
              )}
              {syncStatus === SYNC_STATUS.IDLE && (
                <>
                  <span className="text-gray-400">⚪</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('syncSettings.statusIdle') || '空闲'}
                  </span>
                </>
              )}
              {syncStatus === SYNC_STATUS.OFFLINE && (
                <>
                  <span className="text-yellow-500">⚠️</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('syncSettings.statusOffline') || '离线'}
                  </span>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Offline Warning */}
      {!isOnline && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-200">
            ⚠️ {t('syncSettings.offlineWarning') || '当前处于离线模式，无法同步数据'}
          </p>
        </div>
      )}
    </div>
  );
}
