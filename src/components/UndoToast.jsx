import { useEffect } from 'react';

function UndoToast({ visible, description, onUndo, onDismiss }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 dark:bg-gray-700 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4">
        <div className="flex-1">
          <div className="font-medium">操作已完成</div>
          {description && (
            <div className="text-sm text-gray-300 mt-1">{description}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
          >
            撤销
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
          >
            忽略
          </button>
        </div>
      </div>
    </div>
  );
}

export default UndoToast;
