import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

function OperationHistoryDrawer({ isOpen, onClose, history = [], onUndo }) {
  const { t } = useTranslation();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(i18n.language === 'en' ? 'en-US' : 'zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action) => {
    const badges = {
      create: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: t('operationHistory.create') },
      update: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: t('operationHistory.update') },
      delete: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', label: t('operationHistory.delete') },
      batch_update: { bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', label: t('operationHistory.batchUpdate') },
      batch_delete: { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: t('operationHistory.batchDelete') },
    };
    const badge = badges[action] || { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: action };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('operationHistory.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t('operationHistory.noOperations')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      record.undone ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(record.action)}
                          {record.undone && (
                            <span className="text-xs text-gray-400 line-through">{t('operationHistory.undone')}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {record.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatTime(record.timestamp)}
                        </div>
                      </div>
                      {!record.undone && onUndo && (
                        <button
                          onClick={() => onUndo(record.id)}
                          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          {t('operationHistory.revoke')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default OperationHistoryDrawer;
