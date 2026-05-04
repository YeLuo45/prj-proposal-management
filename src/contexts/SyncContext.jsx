/**
 * SyncContext - V25
 * React Context for managing GitHub synchronization state across the app
 * Enhanced with GitHub Issues integration and auto-sync support
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { githubApi, GitHubApiError, RateLimitError } from '../services/githubApi';
import { githubIssues, GitHubIssuesError } from '../services/githubIssues';

// Create context
const SyncContext = createContext(null);

// Sync status enum
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline',
  SYNCING_ISSUES: 'syncing_issues',
  SYNCING_DATA: 'syncing_data',
};

// Sync type enum
export const SYNC_TYPE = {
  DATA: 'data',
  ISSUES: 'issues',
  ALL: 'all',
};

// Provider component
export function SyncProvider({ children }) {
  // Sync state
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [syncType, setSyncType] = useState(SYNC_TYPE.DATA);
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
  const [autoSyncIssues, setAutoSyncIssues] = useState(() => {
    return localStorage.getItem('auto_sync_issues') === 'true';
  });
  const [issuesSyncInterval, setIssuesSyncInterval] = useState(() => {
    return parseInt(localStorage.getItem('issues_sync_interval') || '60000', 10); // 1 min default for issues
  });

  // Pending changes tracking
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const pendingChangesRef = useRef(new Set());

  // Issues state
  const [issues, setIssues] = useState([]);
  const [lastIssuesSync, setLastIssuesSync] = useState(null);
  const [issuesError, setIssuesError] = useState(null);

  // Sync listeners
  const syncListenersRef = useRef(new Set());

  // Load token on mount
  useEffect(() => {
    const token = githubApi.loadToken();
    const issuesToken = githubIssues.loadToken();
    setHasToken(!!token || !!issuesToken);

    // Subscribe to githubApi status changes
    const unsubscribeApi = githubApi.subscribe((status) => {
      if (status === SYNC_STATUS.SUCCESS) {
        setSyncStatus(SYNC_STATUS.SUCCESS);
        setLastSyncTime(new Date().toISOString());
        setLastError(null);
      } else if (status === SYNC_STATUS.ERROR) {
        setSyncStatus(SYNC_STATUS.ERROR);
      } else if (status === SYNC_STATUS.SYNCING) {
        setSyncStatus(SYNC_STATUS.SYNCING);
      }
    });

    // Subscribe to githubIssues status changes
    const unsubscribeIssues = githubIssues.subscribe(() => {
      // Issues changed, notify listeners
      syncListenersRef.current.forEach(listener => listener('issues'));
    });

    return () => {
      unsubscribeApi();
      unsubscribeIssues();
    };
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

  // Auto-sync interval for data files
  useEffect(() => {
    if (!autoSyncEnabled || !hasToken || !isOnline) return;

    const intervalId = setInterval(() => {
      triggerDataSync({ force: false, silent: true }).catch(console.error);
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [autoSyncEnabled, hasToken, isOnline, syncInterval]);

  // Auto-sync interval for issues
  useEffect(() => {
    if (!autoSyncIssues || !hasToken || !isOnline) return;

    const intervalId = setInterval(() => {
      triggerIssuesSync({ force: false, silent: true }).catch(console.error);
    }, issuesSyncInterval);

    return () => clearInterval(intervalId);
  }, [autoSyncIssues, hasToken, isOnline, issuesSyncInterval]);

  // Save auto-sync settings
  useEffect(() => {
    localStorage.setItem('auto_sync_enabled', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('sync_interval', String(syncInterval));
  }, [syncInterval]);

  useEffect(() => {
    localStorage.setItem('auto_sync_issues', String(autoSyncIssues));
  }, [autoSyncIssues]);

  useEffect(() => {
    localStorage.setItem('issues_sync_interval', String(issuesSyncInterval));
  }, [issuesSyncInterval]);

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

  // Subscribe to sync events
  const subscribeToSync = useCallback((listener) => {
    syncListenersRef.current.add(listener);
    return () => syncListenersRef.current.delete(listener);
  }, []);

  // Trigger data sync operation
  const triggerDataSync = useCallback(async (options = {}) => {
    const { force = false, silent = false } = options;

    if (!isOnline) {
      if (!silent) setSyncStatus(SYNC_STATUS.OFFLINE);
      throw new Error('Cannot sync while offline');
    }

    if (!hasToken) {
      if (!silent) setSyncStatus(SYNC_STATUS.ERROR);
      throw new Error('GitHub token not configured');
    }

    // If not force and no pending changes, skip
    if (!force && pendingChangesRef.current.size === 0) {
      if (!silent) setSyncStatus(SYNC_STATUS.IDLE);
      return { skipped: true, reason: 'no_pending_changes' };
    }

    if (!silent) setSyncStatus(SYNC_STATUS.SYNCING_DATA);

    try {
      // Fetch latest data from GitHub
      const { results, errors } = await githubApi.fetchAllData();

      setLastSyncTime(new Date().toISOString());
      if (!silent) setSyncStatus(SYNC_STATUS.SUCCESS);

      // Clear pending changes on successful sync
      clearAllPendingChanges();

      // Notify listeners
      syncListenersRef.current.forEach(listener => listener('data'));

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
      if (!silent) setSyncStatus(SYNC_STATUS.ERROR);

      throw error;
    }
  }, [isOnline, hasToken, clearAllPendingChanges]);

  // Trigger issues sync operation
  const triggerIssuesSync = useCallback(async (options = {}) => {
    const { force = false, silent = false } = options;

    if (!isOnline) {
      if (!silent) setSyncStatus(SYNC_STATUS.OFFLINE);
      throw new Error('Cannot sync issues while offline');
    }

    if (!hasToken) {
      if (!silent) setSyncStatus(SYNC_STATUS.ERROR);
      throw new Error('GitHub token not configured');
    }

    if (!silent) setSyncStatus(SYNC_STATUS.SYNCING_ISSUES);

    try {
      // Fetch all issues
      const openIssues = await githubIssues.listIssues({ state: 'open', per_page: 100 });
      const closedIssues = await githubIssues.listIssues({ state: 'closed', per_page: 100 });
      
      const allIssues = [...openIssues, ...closedIssues];
      setIssues(allIssues);
      setLastIssuesSync(new Date().toISOString());
      setIssuesError(null);

      if (!silent) setSyncStatus(SYNC_STATUS.SUCCESS);

      // Notify listeners
      syncListenersRef.current.forEach(listener => listener('issues'));

      return {
        success: true,
        issues: allIssues,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      let errorMessage = error.message;
      let errorType = 'generic';

      if (error instanceof RateLimitError) {
        errorType = 'rate_limit';
        errorMessage = `Rate limit exceeded. Resets at ${error.resetTime.toLocaleTimeString()}`;
      } else if (error instanceof GitHubIssuesError) {
        errorType = 'github_api';
        if (error.status === 401) {
          errorMessage = 'Invalid or expired GitHub token';
        }
      }

      setIssuesError({
        message: errorMessage,
        type: errorType,
        timestamp: new Date().toISOString(),
      });
      if (!silent) setSyncStatus(SYNC_STATUS.ERROR);

      throw error;
    }
  }, [isOnline, hasToken]);

  // Trigger full sync (both data and issues)
  const triggerSync = useCallback(async (options = {}) => {
    const { force = true } = options;

    setSyncType(SYNC_TYPE.ALL);

    const results = {
      data: null,
      issues: null,
      errors: [],
    };

    try {
      // Sync data files
      if (autoSyncEnabled || force) {
        const dataResult = await triggerDataSync({ force, silent: true });
        results.data = dataResult;
      }
    } catch (error) {
      results.errors.push({ type: 'data', error: error.message });
    }

    try {
      // Sync issues
      if (autoSyncIssues || force) {
        const issuesResult = await triggerIssuesSync({ force, silent: true });
        results.issues = issuesResult;
      }
    } catch (error) {
      results.errors.push({ type: 'issues', error: error.message });
    }

    // Set final status
    if (results.errors.length === 0) {
      setSyncStatus(SYNC_STATUS.SUCCESS);
    } else if (results.errors.length < 2) {
      setSyncStatus(SYNC_STATUS.SUCCESS); // Partial success
    } else {
      setSyncStatus(SYNC_STATUS.ERROR);
      setLastError({
        message: 'Some syncs failed',
        type: 'partial_failure',
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }, [autoSyncEnabled, autoSyncIssues, triggerDataSync, triggerIssuesSync]);

  // Set token
  const setToken = useCallback(async (token) => {
    githubApi.setToken(token || null);
    githubIssues.setToken(token || null);
    setHasToken(!!token);

    if (token) {
      // Validate token
      const result = await githubIssues.validateToken();
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
    if (settings.autoSyncIssues !== undefined) {
      setAutoSyncIssues(settings.autoSyncIssues);
    }
    if (settings.issuesSyncInterval !== undefined) {
      setIssuesSyncInterval(settings.issuesSyncInterval);
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

  // Get formatted last issues sync time
  const getFormattedLastIssuesSync = useCallback(() => {
    if (!lastIssuesSync) return null;
    const date = new Date(lastIssuesSync);
    return {
      relative: getRelativeTime(date),
      absolute: date.toLocaleString(),
    };
  }, [lastIssuesSync]);

  // Find issues for a specific proposal
  const findProposalIssues = useCallback((proposalId) => {
    return issues.filter(issue => 
      issue.body?.includes(proposalId) ||
      issue.title?.includes(proposalId)
    );
  }, [issues]);

  // Context value
  const value = {
    // State
    syncStatus,
    syncType,
    lastSyncTime,
    lastError,
    hasToken,
    isOnline,
    autoSyncEnabled,
    syncInterval,
    autoSyncIssues,
    issuesSyncInterval,
    hasPendingChanges,
    issues,
    lastIssuesSync,
    issuesError,

    // Actions
    setToken,
    triggerSync,
    triggerDataSync,
    triggerIssuesSync,
    addPendingChange,
    clearPendingChange,
    clearAllPendingChanges,
    updateSyncSettings,
    getFormattedLastSync,
    getFormattedLastIssuesSync,
    subscribeToSync,
    findProposalIssues,

    // Utilities
    isSyncing: syncStatus === SYNC_STATUS.SYNCING || 
                syncStatus === SYNC_STATUS.SYNCING_DATA || 
                syncStatus === SYNC_STATUS.SYNCING_ISSUES,
    isSyncingData: syncStatus === SYNC_STATUS.SYNCING_DATA,
    isSyncingIssues: syncStatus === SYNC_STATUS.SYNCING_ISSUES,
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
  return context || getDefaultSyncContext();
}

function getDefaultSyncContext() {
  return {
    syncStatus: SYNC_STATUS.IDLE,
    syncType: SYNC_TYPE.DATA,
    lastSyncTime: null,
    lastError: null,
    hasToken: false,
    isOnline: true,
    autoSyncEnabled: false,
    syncInterval: 300000,
    autoSyncIssues: false,
    issuesSyncInterval: 60000,
    hasPendingChanges: false,
    issues: [],
    lastIssuesSync: null,
    issuesError: null,
    setToken: async () => {},
    triggerSync: async () => {},
    triggerDataSync: async () => {},
    triggerIssuesSync: async () => {},
    addPendingChange: () => {},
    clearPendingChange: () => {},
    clearAllPendingChanges: () => {},
    updateSyncSettings: () => {},
    getFormattedLastSync: () => null,
    getFormattedLastIssuesSync: () => null,
    subscribeToSync: () => () => {},
    findProposalIssues: () => [],
    isSyncing: false,
    isSyncingData: false,
    isSyncingIssues: false,
    isError: false,
    isSuccess: false,
  };
}

export default SyncContext;
