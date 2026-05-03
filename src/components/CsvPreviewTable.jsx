import { useState, useEffect } from 'react';

function ImportResultModal({ result, onClose }) {
  const { imported = 0, skipped = 0, updated = 0, errors = [] } = result || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">导入结果</h3>

        <div className="space-y-2 mb-4">
          {imported > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>成功导入 {imported} 个提案</span>
            </div>
          )}
          {updated > 0 && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>更新 {updated} 个提案</span>
            </div>
          )}
          {skipped > 0 && (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>跳过 {skipped} 个提案</span>
            </div>
          )}
          {errors.length > 0 && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{errors.length} 个错误</span>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg max-h-40 overflow-y-auto">
            <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

function CsvPreviewTable({ rows, errors, validRows, existingIds, newIds, onClose, onConfirm, importMode, onImportModeChange }) {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  const previewRows = rows?.slice(0, 10) || [];
  const hasErrors = errors && errors.length > 0;

  const handleConfirm = () => {
    if (onConfirm) {
      const res = onConfirm();
      setResult(res);
      setShowResult(true);
    }
  };

  if (showResult && result) {
    return <ImportResultModal result={result} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">CSV 导入预览</h3>

        {/* Error Summary */}
        {hasErrors && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">
              发现 {errors.length} 个错误
            </p>
            <ul className="text-sm text-red-500 dark:text-red-400 mt-1 max-h-20 overflow-y-auto">
              {errors.slice(0, 5).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
              {errors.length > 5 && <li>...还有 {errors.length - 5} 个错误</li>}
            </ul>
          </div>
        )}

        {/* Stats */}
        {existingIds && newIds && (
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              有效行数：{validRows?.length || 0}
            </span>
            <span className="text-yellow-600 dark:text-yellow-400">
              重复ID：{existingIds.length} 个
            </span>
            <span className="text-green-600 dark:text-green-400">
              新ID：{newIds.length} 个
            </span>
          </div>
        )}

        {/* Preview Table */}
        <div className="flex-1 overflow-auto mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">名称</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">类型</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">状态</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">项目ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {previewRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{row.id}</td>
                  <td className="px-3 py-2 text-gray-800 dark:text-gray-200 truncate max-w-xs">{row.name}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      row.type === 'web' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      row.type === 'app' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      row.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      row.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.projectId}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows?.length > 10 && (
            <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
              还有 {rows.length - 10} 行未显示
            </div>
          )}
        </div>

        {/* Import Mode Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            导入模式
          </label>
          <div className="flex gap-4">
            {[
              { value: 'skip', label: '跳过', desc: '跳过已存在的提案' },
              { value: 'overwrite', label: '覆盖', desc: '用CSV数据覆盖已存在' },
              { value: 'new_only', label: '新ID', desc: '已存在的分配新ID' }
            ].map(mode => (
              <label key={mode.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value={mode.value}
                  checked={importMode === mode.value}
                  onChange={() => onImportModeChange?.(mode.value)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {mode.label}：<span className="text-gray-500">{mode.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={hasErrors || !validRows?.length}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  );
}

export default CsvPreviewTable;
