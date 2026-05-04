/**
 * SyncStatusIndicator - V21
 * Compact component showing GitHub sync status in the header or status bar
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSync, SYNC_STATUS } from '../contexts/SyncContext';

export default function SyncStatusIndicator({ compact = false, showLabel = true }) {
  const { t } = useTranslation();
  const {
    syncStatus,
    lastSyncTime,
    lastError,
    hasToken,
    isOnline,
    autoSyncEnabled,
    triggerSync,
    getFormattedLastSync,
    isSyncing,
  } = useSync();

  const [showTooltip, setShowTooltip] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Pulse animation when syncing
  useEffect(() => {
    if (isSyncing) {
      setPulse(true);
    } else {
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  const lastSync = getFormattedLastSync();

  // Get status icon and color
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: '⚠️',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
        label: t('syncStatus.offline') || '离线',
      };
    }
    if (!hasToken) {
      return {
        icon: '🔑',
        color: 'text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        label: t('syncStatus.notConnected') || '未连接',
      };
    }
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return {
          icon: '🔄',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          label: t('syncStatus.syncing') || '同步中',
        };
      case SYNC_STATUS.SUCCESS:
        return {
          icon: '✅',
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900',
          label: t('syncStatus.synced') || '已同步',
        };
      case SYNC_STATUS.ERROR:
        return {
          icon: '❌',
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900',
          label: t('syncStatus.error') || '同步错误',
        };
      case SYNC_STATUS.OFFLINE:
        return {
          icon: '⚠️',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          label: t('syncStatus.offline') || '离线',
        };
      default:
        return {
          icon: '⚪',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          label: t('syncStatus.idle') || '空闲',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleClick = () => {
    if (hasToken && isOnline && !isSyncing) {
      triggerSync({ force: true }).catch(() => {});
    }
  };

  // Compact mode: just the icon with tooltip
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`flex items-center justify-center w-8 h-8 rounded-full ${statusConfig.bgColor} ${pulse ? 'animate-pulse' : ''} transition-all hover:scale-110`}
          title={statusConfig.label}
        >
          <span className={`text-lg ${pulse ? 'animate-spin' : ''}`}>
            {statusConfig.icon}
          </span>
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{statusConfig.icon}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {statusConfig.label}
              </span>
            </div>

            {lastSync && (
              <p className="text-xs text-gray-500 mb-1">
                {t('syncStatus.lastSync') || '上次同步'}: {lastSync.relative}
              </p>
            )}

            {lastError && (
              <p className="text-xs text-red-500 mt-2">
                ❌ {lastError.message}
              </p>
            )}

            {autoSyncEnabled && hasToken && (
              <p className="text-xs text-green-500 mt-2">
                🔄 {t('syncStatus.autoSyncOn') || '自动同步已开启'}
              </p>
            )}

            {hasToken && !isSyncing && (
              <p className="text-xs text-gray-400 mt-2">
                {t('syncStatus.clickToSync') || '点击立即同步'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode: icon + label
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bgColor} ${pulse ? 'animate-pulse' : ''} transition-all cursor-pointer hover:opacity-80`}
      onClick={handleClick}
    >
      <span className={`text-lg ${pulse ? 'animate-spin' : ''}`}>
        {statusConfig.icon}
      </span>
      {showLabel && (
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          {lastSync && (
            <span className="text-xs text-gray-500">
              {lastSync.relative}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Mini version for embedding in other components
export function SyncStatusMini({ className = '' }) {
  const { syncStatus, isSyncing } = useSync();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isSyncing) {
      setPulse(true);
    } else {
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  const getIcon = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING: return '🔄';
      case SYNC_STATUS.SUCCESS: return '✅';
      case SYNC_STATUS.ERROR: return '❌';
      case SYNC_STATUS.OFFLINE: return '⚠️';
      default: return '⚪';
    }
  };

  return (
    <span className={`inline-flex items-center ${pulse ? 'animate-pulse' : ''} ${className}`}>
      <span className={pulse ? 'animate-spin' : ''}>{getIcon()}</span>
    </span>
  );
}

// Badge version for notifications
export function SyncStatusBadge({ showText = true }) {
  const { t } = useTranslation();
  const { syncStatus, isSyncing } = useSync();

  const getConfig = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return { icon: '🔄', text: t('syncStatus.syncing') || '同步中', bg: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' };
      case SYNC_STATUS.SUCCESS:
        return { icon: '✅', text: t('syncStatus.synced') || '已同步', bg: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' };
      case SYNC_STATUS.ERROR:
        return { icon: '❌', text: t('syncStatus.error') || '错误', bg: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' };
      case SYNC_STATUS.OFFLINE:
        return { icon: '⚠️', text: t('syncStatus.offline') || '离线', bg: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' };
      default:
        return { icon: '⚪', text: t('syncStatus.idle') || '空闲', bg: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' };
    }
  };

  const config = getConfig();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${isSyncing ? 'animate-pulse' : ''}`}>
      <span className={isSyncing ? 'animate-spin' : ''}>{config.icon}</span>
      {showText && config.text}
    </span>
  );
}
