/**
 * SyncContext - V21
 * React Context for managing GitHub synchronization state across the app
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { githubApi, GitHubApiError, RateLimitError } from '../services/githubApi';

// Create context
const SyncContext = createContext(null);

// Sync status enum
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline',
};

// Provider component
export function SyncProvider({ children }) {
  // Sync state
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auto-sync settings
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('auto_sync_enabled') === 'true';
  });
  const [syncInterval, setSyncInterval] = useState(() => {
    return parseInt(localStorage.getItem('sync_interval') || '300000', 10); // 5 min default
  });

  // Pending changes tracking
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const pendingChangesRef = useRef(new Set());

  // Load token on mount
  useEffect(() => {
    const token = githubApi.loadToken();
    setHasToken(!!token);

    // Subscribe to githubApi status changes
    const unsubscribe = githubApi.subscribe((status) => {
      setSyncStatus(status);
      if (status === SYNC_STATUS.SUCCESS) {
        setLastSyncTime(new Date().toISOString());
        setLastError(null);
      } else if (status === SYNC_STATUS.ERROR) {
        setLastError(githubApi.lastError);
      }
    });

    return unsubscribe;
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus(SYNC_STATUS.IDLE);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus(SYNC_STATUS.OFFLINE);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSyncEnabled || !hasToken || !isOnline) return;

    const intervalId = setInterval(() => {
      triggerSync().catch(console.error);
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [autoSyncEnabled, hasToken, isOnline, syncInterval]);

  // Save auto-sync settings
  useEffect(() => {
    localStorage.setItem('auto_sync_enabled', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('sync_interval', String(syncInterval));
  }, [syncInterval]);

  // Track pending change for a key
  const addPendingChange = useCallback((key) => {
    pendingChangesRef.current.add(key);
    setHasPendingChanges(pendingChangesRef.current.size > 0);
  }, []);

  // Clear pending change for a key
  const clearPendingChange = useCallback((key) => {
    pendingChangesRef.current.delete(key);
    setHasPendingChanges(pendingChangesRef.current.size > 0);
  }, []);

  // Clear all pending changes
  const clearAllPendingChanges = useCallback(() => {
    pendingChangesRef.current.clear();
    setHasPendingChanges(false);
  }, []);

  // Trigger a sync operation
  const triggerSync = useCallback(async (options = {}) => {
    if (!isOnline) {
      setSyncStatus(SYNC_STATUS.OFFLINE);
      throw new Error('Cannot sync while offline');
    }

    if (!hasToken) {
      throw new Error('GitHub token not configured');
    }

    const { force = false } = options;

    // If not force and no pending changes, skip
    if (!force && pendingChangesRef.current.size === 0) {
      setSyncStatus(SYNC_STATUS.IDLE);
      return { skipped: true, reason: 'no_pending_changes' };
    }

    setSyncStatus(SYNC_STATUS.SYNCING);
    setLastError(null);

    try {
      // Fetch latest data from GitHub
      const { results, errors } = await githubApi.fetchAllData();

      setLastSyncTime(new Date().toISOString());
      setSyncStatus(SYNC_STATUS.SUCCESS);

      // Clear pending changes on successful sync
      clearAllPendingChanges();

      return {
        success: true,
        data: results,
        errors,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      let errorMessage = error.message;
      let errorType = 'generic';

      if (error instanceof RateLimitError) {
        errorType = 'rate_limit';
        errorMessage = `Rate limit exceeded. Resets at ${error.resetTime.toLocaleTimeString()}`;
      } else if (error instanceof GitHubApiError) {
        errorType = 'github_api';
        if (error.status === 401) {
          errorMessage = 'Invalid or expired GitHub token';
        } else if (error.status === 404) {
          errorMessage = 'Data files not found in repository';
        }
      }

      setLastError({
        message: errorMessage,
        type: errorType,
        timestamp: new Date().toISOString(),
      });
      setSyncStatus(SYNC_STATUS.ERROR);

      throw error;
    }
  }, [isOnline, hasToken, clearAllPendingChanges]);

  // Set token
  const setToken = useCallback(async (token) => {
    githubApi.setToken(token || null);
    setHasToken(!!token);

    if (token) {
      // Validate token
      const result = await githubApi.validateToken();
      if (!result.valid) {
        throw new Error(result.error || 'Invalid token');
      }
      // Token is valid, trigger initial sync
      await triggerSync({ force: true });
    }
  }, [triggerSync]);

  // Update sync settings
  const updateSyncSettings = useCallback((settings) => {
    if (settings.autoSyncEnabled !== undefined) {
      setAutoSyncEnabled(settings.autoSyncEnabled);
    }
    if (settings.syncInterval !== undefined) {
      setSyncInterval(settings.syncInterval);
    }
  }, []);

  // Get formatted last sync time
  const getFormattedLastSync = useCallback(() => {
    if (!lastSyncTime) return null;
    const date = new Date(lastSyncTime);
    return {
      relative: getRelativeTime(date),
      absolute: date.toLocaleString(),
    };
  }, [lastSyncTime]);

  // Context value
  const value = {
    // State
    syncStatus,
    lastSyncTime,
    lastError,
    hasToken,
    isOnline,
    autoSyncEnabled,
    syncInterval,
    hasPendingChanges,

    // Actions
    setToken,
    triggerSync,
    addPendingChange,
    clearPendingChange,
    clearAllPendingChanges,
    updateSyncSettings,
    getFormattedLastSync,

    // Utilities
    isSyncing: syncStatus === SYNC_STATUS.SYNCING,
    isError: syncStatus === SYNC_STATUS.ERROR,
    isSuccess: syncStatus === SYNC_STATUS.SUCCESS,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

// Helper: get relative time string
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// Hook to use sync context
export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

// Hook to use sync without requiring provider (returns defaults)
export function useSyncOptional() {
  const context = useContext(SyncContext);
  return context || {
    syncStatus: SYNC_STATUS.IDLE,
    lastSyncTime: null,
    lastError: null,
    hasToken: false,
    isOnline: true,
    autoSyncEnabled: false,
    syncInterval: 300000,
    hasPendingChanges: false,
    setToken: async () => {},
    triggerSync: async () => {},
    addPendingChange: () => {},
    clearPendingChange: () => {},
    clearAllPendingChanges: () => {},
    updateSyncSettings: () => {},
    getFormattedLastSync: () => null,
    isSyncing: false,
    isError: false,
    isSuccess: false,
  };
}

export default SyncContext;
