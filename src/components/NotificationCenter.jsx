import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast, ToastType } from '../hooks/useToast';

/**
 * NotificationCenter - Notification center panel
 * 
 * Features:
 * - Displays all notifications (toasts history)
 * - Filter by type (success, error, warning, info)
 * - Mark as read/unread
 * - Clear all notifications
 * - Badge count for unread notifications
 */
function NotificationCenter({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen to toast changes
  useEffect(() => {
    const updateNotifications = () => {
      const currentToasts = toast.getToasts();
      setNotifications(currentToasts);
      setUnreadCount(currentToasts.filter(n => !n.read).length);
      // Also update window global for the notification center to access
      window.__toasts = currentToasts;
    };

    // Initial load
    updateNotifications();

    // Poll for updates since we're using a singleton pattern
    const interval = setInterval(updateNotifications, 500);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = useCallback((id) => {
    toast.dismiss(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    toast.clear();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  // Notification type icons and colors
  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      border: 'border-l-green-500',
      icon: 'text-green-500',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-l-red-500',
      icon: 'text-red-500',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      border: 'border-l-yellow-500',
      icon: 'text-yellow-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-l-blue-500',
      icon: 'text-blue-500',
    },
  };

  const NotificationIcon = ({ type }) => {
    const style = typeStyles[type] || typeStyles.info;
    return (
      <div className={`flex-shrink-0 ${style.icon}`}>
        {type === 'success' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {type === 'warning' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        {type === 'info' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {t('notificationCenter.title', 'Notifications')}
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {['all', 'success', 'error', 'warning', 'info'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  filter === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' ? t('notificationCenter.all', 'All') : t(`notificationCenter.${type}`, type)}
              </button>
            ))}
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>{t('notificationCenter.empty', 'No notifications')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredNotifications.map((notification) => {
                  const style = typeStyles[notification.type] || typeStyles.info;
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 ${style.bg} border-l-4 ${style.border} hover:opacity-90 transition-opacity`}
                    >
                      <NotificationIcon type={notification.type} />
                      <div className="flex-1 min-w-0">
                        {notification.title && (
                          <div className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                            {notification.title}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-gray-400"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClearAll}
                className="w-full py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                {t('notificationCenter.clearAll', 'Clear All')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
