import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';

// Toast notification types
export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Global toast state singleton
let toastId = 0;
let toasts = [];
let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]));
};

export function useToast() {
  // Use sync external store for global toast state
  const toastsState = useSyncExternalStore(
    (callback) => {
      listeners.push(callback);
      return () => {
        listeners = listeners.filter(l => l !== callback);
      };
    },
    () => toasts,
    () => []
  );

  const addToast = useCallback((message, options = {}) => {
    const {
      type = ToastType.INFO,
      title,
      duration = 5000,
      action,
      dismissible = true,
    } = options;

    const id = ++toastId;
    const toastItem = {
      id,
      message,
      type,
      title,
      duration,
      action,
      dismissible,
      createdAt: Date.now(),
    };

    toasts = [...toasts, toastItem];
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  }, []);

  const clearAll = useCallback(() => {
    toasts = [];
    notifyListeners();
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: ToastType.SUCCESS });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: ToastType.ERROR });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: ToastType.WARNING });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: ToastType.INFO });
  }, [addToast]);

  return {
    toasts: toastsState,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}

// Export a simple notification function for non-hook contexts
export const toast = {
  success: (message, options) => {
    const id = ++toastId;
    const newToast = {
      id,
      message,
      type: ToastType.SUCCESS,
      title: options?.title,
      duration: options?.duration ?? 5000,
      action: options?.action,
      dismissible: options?.dismissible ?? true,
      createdAt: Date.now(),
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    if (newToast.duration > 0) {
      setTimeout(() => toast.dismiss(id), newToast.duration);
    }
    return id;
  },
  error: (message, options) => {
    const id = ++toastId;
    const newToast = {
      id,
      message,
      type: ToastType.ERROR,
      title: options?.title,
      duration: options?.duration ?? 5000,
      action: options?.action,
      dismissible: options?.dismissible ?? true,
      createdAt: Date.now(),
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    if (newToast.duration > 0) {
      setTimeout(() => toast.dismiss(id), newToast.duration);
    }
    return id;
  },
  warning: (message, options) => {
    const id = ++toastId;
    const newToast = {
      id,
      message,
      type: ToastType.WARNING,
      title: options?.title,
      duration: options?.duration ?? 5000,
      action: options?.action,
      dismissible: options?.dismissible ?? true,
      createdAt: Date.now(),
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    if (newToast.duration > 0) {
      setTimeout(() => toast.dismiss(id), newToast.duration);
    }
    return id;
  },
  info: (message, options) => {
    const id = ++toastId;
    const newToast = {
      id,
      message,
      type: ToastType.INFO,
      title: options?.title,
      duration: options?.duration ?? 5000,
      action: options?.action,
      dismissible: options?.dismissible ?? true,
      createdAt: Date.now(),
    };
    toasts = [...toasts, newToast];
    notifyListeners();
    if (newToast.duration > 0) {
      setTimeout(() => toast.dismiss(id), newToast.duration);
    }
    return id;
  },
  dismiss: (id) => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  },
  clear: () => {
    toasts = [];
    notifyListeners();
  },
  getToasts: () => toasts,
};
