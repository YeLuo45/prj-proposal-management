import { useState } from 'react';

function ValidationAlert({ errors = [], onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  if (errors.length === 0) return null;

  return (
    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠</span>
          <span className="font-medium">发现 {errors.length} 个数据问题</span>
        </div>
        <span className="text-sm">
          {expanded ? '点击收起' : '点击查看详情'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-red-200 dark:border-red-800 pt-3">
          <ul className="space-y-2">
            {errors.map((err, idx) => (
              <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                <span className="font-mono text-xs">{err.proposalId}: </span>
                {err.message}
              </li>
            ))}
          </ul>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              忽略
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ValidationAlert;
