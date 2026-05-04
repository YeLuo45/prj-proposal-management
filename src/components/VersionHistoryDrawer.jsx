import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { listVersions, clearVersions } from '../utils/versionService';
import { getObjectDiff } from './DiffViewer';

/**
 * Version History Drawer Component
 * Displays version list, preview, diff view, and restore functionality
 */
const VersionHistoryDrawer = ({ 
  isOpen, 
  onClose, 
  proposalId,
  currentData,
  onRestore 
}) => {
  const { t } = useTranslation();
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load versions when drawer opens
  useEffect(() => {
    if (isOpen && proposalId) {
      const loadedVersions = listVersions(proposalId);
      setVersions(loadedVersions);
    }
  }, [isOpen, proposalId]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setCompareMode(false);
  };

  const handleCompare = () => {
    setCompareMode(true);
  };

  const handleRestore = (version) => {
    if (window.confirm(t('versionHistory.confirmRestore') || 'Restore this version?')) {
      onRestore(version.data);
      onClose();
    }
  };

  const handleClearAll = () => {
    clearVersions(proposalId);
    setVersions([]);
    setSelectedVersion(null);
    setShowClearConfirm(false);
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const formatFieldName = (key) => {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const renderFieldDiff = (oldValue, newValue, fieldName) => {
    if (oldValue === newValue) {
      return (
        <div key={fieldName} className="py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500">{formatFieldName(fieldName)}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{String(newValue || '(empty)')}</div>
        </div>
      );
    }

    return (
      <div key={fieldName} className="py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-500">{formatFieldName(fieldName)}</div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm">
            <div className="text-xs text-red-500 mb-1">- {t('diff.removed') || 'Removed'}</div>
            <div className="text-red-700 dark:text-red-300 line-through">{String(oldValue || '(empty)')}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm">
            <div className="text-xs text-green-500 mb-1">+ {t('diff.added') || 'Added'}</div>
            <div className="text-green-700 dark:text-green-300">{String(newValue || '(empty)')}</div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {t('versionHistory.title') || 'Version History'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <div>{t('versionHistory.noVersions') || 'No version history'}</div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Version List */}
              <div className="border-b dark:border-gray-700">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('versionHistory.versions') || 'Versions'} ({versions.length})
                  </span>
                  {versions.length > 0 && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      {t('versionHistory.clearAll') || 'Clear All'}
                    </button>
                  )}
                </div>
                
                {/* Version items - show latest 3 by default */}
                <div className="max-h-48 overflow-y-auto">
                  {versions.slice(0, 3).map((version, idx) => (
                    <div
                      key={version.timestamp}
                      onClick={() => handleVersionSelect(version)}
                      className={`px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                        selectedVersion?.timestamp === version.timestamp
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {version.label || `${t('versionHistory.version') || 'Version'} ${versions.length - idx}`}
                        </span>
                        <span className="text-xs text-gray-500">{formatTimestamp(version.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  
                  {versions.length > 3 && (
                    <details className="px-4 py-2">
                      <summary className="text-xs text-blue-500 cursor-pointer">
                        {t('versionHistory.showMore') || `Show ${versions.length - 3} more versions`}
                      </summary>
                      <div className="mt-2">
                        {versions.slice(3).map((version, idx) => (
                          <div
                            key={version.timestamp}
                            onClick={() => handleVersionSelect(version)}
                            className={`py-2 cursor-pointer border-t border-gray-100 dark:border-gray-700 ${
                              selectedVersion?.timestamp === version.timestamp
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {version.label || `${t('versionHistory.version') || 'Version'} ${versions.length - 3 - idx}`}
                              </span>
                              <span className="text-xs text-gray-500">{formatTimestamp(version.timestamp)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              {/* Selected Version Preview */}
              {selectedVersion && (
                <div className="flex-1 overflow-y-auto">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('versionHistory.preview') || 'Preview'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCompare}
                        className={`text-xs px-2 py-1 rounded ${
                          compareMode 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {t('versionHistory.compareWithCurrent') || 'Compare'}
                      </button>
                      <button
                        onClick={() => handleRestore(selectedVersion)}
                        className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                      >
                        {t('versionHistory.restore') || 'Restore'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    {compareMode ? (
                      // Diff view
                      <div>
                        {Object.keys(selectedVersion.data || {}).map(key => {
                          const diff = getObjectDiff(
                            selectedVersion.data[key],
                            currentData?.[key]
                          );
                          if (diff && diff.length > 0) {
                            return diff.map(d => renderFieldDiff(
                              d.oldValue, 
                              d.newValue, 
                              d.key
                            ));
                          }
                          return renderFieldDiff(
                            selectedVersion.data?.[key],
                            currentData?.[key],
                            key
                          );
                        })}
                      </div>
                    ) : (
                      // Preview view
                      <div className="space-y-2">
                        {Object.entries(selectedVersion.data || {}).map(([key, value]) => (
                          <div key={key} className="py-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-500 mb-1">
                              {formatFieldName(key)}
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {Array.isArray(value) ? value.join(', ') : String(value || '(empty)')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear All Confirmation */}
        {showClearConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                {t('versionHistory.confirmClear') || 'Clear All Versions?'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('versionHistory.confirmClearMsg') || 'This will permanently delete all version history.'}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistoryDrawer;
