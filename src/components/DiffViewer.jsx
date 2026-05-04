import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Simple line-by-line diff viewer
 * @param {string} oldText - Original text
 * @param {string} newText - Modified text
 * @param {Object} options - Display options
 */
export const DiffViewer = ({ oldText, newText, oldLabel = 'Previous', newLabel = 'Current' }) => {
  const { t } = useTranslation();
  
  const diffLines = useMemo(() => {
    const oldLines = (oldText || '').split('\n');
    const newLines = (newText || '').split('\n');
    
    const result = [];
    let oldIdx = 0;
    let newIdx = 0;
    
    // Simple LCS-based diff
    const lcs = computeLCS(oldLines, newLines);
    let lcsIdx = 0;
    
    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      if (lcsIdx < lcs.length && oldIdx < oldLines.length && newIdx < newLines.length) {
        const lcsLine = lcs[lcsIdx];
        
        // Lines before LCS in old
        while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcsLine) {
          result.push({ type: 'removed', content: oldLines[oldIdx] });
          oldIdx++;
        }
        
        // Lines before LCS in new
        while (newIdx < newLines.length && newLines[newIdx] !== lcsLine) {
          result.push({ type: 'added', content: newLines[newIdx] });
          newIdx++;
        }
        
        // LCS line - unchanged
        if (lcsIdx < lcs.length) {
          result.push({ type: 'unchanged', content: lcsLine });
          oldIdx++;
          newIdx++;
          lcsIdx++;
        }
      } else {
        // Remaining old lines
        while (oldIdx < oldLines.length) {
          result.push({ type: 'removed', content: oldLines[oldIdx] });
          oldIdx++;
        }
        
        // Remaining new lines
        while (newIdx < newLines.length) {
          result.push({ type: 'added', content: newLines[newIdx] });
          newIdx++;
        }
      }
    }
    
    return result;
  }, [oldText, newText]);

  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    return { added, removed };
  }, [diffLines]);

  const getLineClass = (type) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'removed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getLinePrefix = (type) => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      default:
        return ' ';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b">
        <div className="flex gap-4 text-sm">
          <span className="text-green-600">+{stats.added} {t('diff.added') || 'added'}</span>
          <span className="text-red-600">-{stats.removed} {t('diff.removed') || 'removed'}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">{newLabel}</span>
          <span className="text-gray-400">vs</span>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">{oldLabel}</span>
        </div>
      </div>
      
      {/* Diff content */}
      <div className="font-mono text-sm overflow-x-auto">
        {diffLines.map((line, idx) => (
          <div
            key={idx}
            className={`px-4 py-0.5 flex ${getLineClass(line.type)}`}
          >
            <span className="w-6 text-center opacity-50 select-none flex-shrink-0">
              {getLinePrefix(line.type)}
            </span>
            <span className="whitespace-pre-wrap break-all">{line.content || ' '}</span>
          </div>
        ))}
        
        {diffLines.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            {t('diff.noChanges') || 'No changes'}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compute LCS (Longest Common Subsequence) for diff
 */
const computeLCS = (arr1, arr2) => {
  const m = arr1.length;
  const n = arr2.length;
  
  // Build DP table
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find LCS
  const lcs = [];
  let i = m;
  let j = n;
  
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
};

/**
 * Compare two objects and return diff
 */
export const getObjectDiff = (oldObj, newObj) => {
  const diffs = [];
  
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {})
  ]);
  
  allKeys.forEach(key => {
    const oldVal = JSON.stringify(oldObj?.[key]);
    const newVal = JSON.stringify(newObj?.[key]);
    
    if (oldVal !== newVal) {
      diffs.push({
        key,
        oldValue: oldObj?.[key],
        newValue: newObj?.[key]
      });
    }
  });
  
  return diffs;
};

export default DiffViewer;
