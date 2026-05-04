import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Toast icons for different types
const ToastIcon = ({ type }) => {
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[type] || icons.info;
};

// Toast colors for different types
const toastStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-400 dark:border-green-600',
    text: 'text-green-800 dark:text-green-300',
    icon: 'text-green-500 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-400 dark:border-red-600',
    text: 'text-red-800 dark:text-red-300',
    icon: 'text-red-500 dark:text-red-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-yellow-400 dark:border-yellow-600',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: 'text-yellow-500 dark:text-yellow-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-600',
    text: 'text-blue-800 dark:text-blue-300',
    icon: 'text-blue-500 dark:text-blue-400',
  },
};

function ToastItem({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const style = toastStyles[toast.type] || toastStyles.info;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg
        ${style.bg} ${style.border}
        transform transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        max-w-md w-full
      `}
    >
      <div className={`flex-shrink-0 ${style.icon}`}>
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className={`font-semibold text-sm ${style.text}`}>
            {toast.title}
          </div>
        )}
        <div className={`text-sm ${toast.title ? 'mt-1' : ''} ${style.text}`}>
          {toast.message}
        </div>
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick?.();
              handleDismiss();
            }}
            className={`mt-2 text-sm font-medium underline hover:no-underline ${style.text}`}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {toast.dismissible && (
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${style.text}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ToastContainer({ toasts, onDismiss, position = 'top-right' }) {
  const { t } = useTranslation();

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2`}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Main Toast export with auto-dismiss functionality
function Toast({ toasts, onDismiss, autoDismiss = 5000, position = 'top-right' }) {
  return (
    <ToastContainer toasts={toasts} onDismiss={onDismiss} position={position} />
  );
}

export { Toast, ToastContainer, ToastItem };
export default Toast;
