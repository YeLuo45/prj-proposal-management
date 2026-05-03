import { useState, useRef, useEffect } from 'react';

function DataHealthIndicator({ errors = [], warnings = [], errorDetails = [] }) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef(null);

  const errorCount = errors.length;
  const warningCount = warnings.length;

  // Determine status
  let status = 'healthy'; // green
  let color = 'bg-green-500';
  let icon = '✓';
  if (errorCount >= 5) {
    status = 'error'; // red
    color = 'bg-red-500';
    icon = '✗';
  } else if (errorCount > 0) {
    status = 'warning'; // yellow
    color = 'bg-yellow-500';
    icon = '⚠';
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  if (errorCount === 0 && warningCount === 0) {
    return null; // Don't show indicator if everything is fine
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={`w-6 h-6 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity`}
        title={`${errorCount} 个错误，${warningCount} 个警告`}
      >
        {icon}
      </button>

      {showPopover && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">数据健康状况</h3>
          </div>
          <div className="p-3 max-h-64 overflow-y-auto">
            {errorCount > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  错误 ({errorCount})
                </div>
                <ul className="space-y-1">
                  {errorDetails.length > 0
                    ? errorDetails.map((err, idx) => (
                        <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                          {err.proposalId && <span className="font-mono">{err.proposalId}: </span>}
                          {err.message}
                        </li>
                      ))
                    : errors.map((err, idx) => (
                        <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                          {typeof err === 'string' ? err : `${err.proposalId}: ${err.message}`}
                        </li>
                      ))
                  }
                </ul>
              </div>
            )}
            {warningCount > 0 && (
              <div>
                <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  警告 ({warningCount})
                </div>
                <ul className="space-y-1">
                  {warnings.map((warn, idx) => (
                    <li key={idx} className="text-xs text-yellow-600 dark:text-yellow-400">
                      {warn.proposalId && <span className="font-mono">{warn.proposalId}: </span>}
                      {warn.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataHealthIndicator;
