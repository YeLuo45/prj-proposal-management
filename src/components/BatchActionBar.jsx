import { useTranslation } from 'react-i18next';

function BatchActionBar({
  selectedCount,
  onBatchStatusChange,
  onBatchMilestone,
  onBatchDelete,
  onBatchExport,
  onBatchTag,
  onCancelSelect,
  visible = true,
}) {
  const { t } = useTranslation();

  if (!visible || selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-4 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
            {selectedCount}
          </span>
          <span className="text-gray-700 dark:text-gray-200">
            {t('batch.selectedCount', { count: selectedCount })}
          </span>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onBatchStatusChange(e.target.value);
                e.target.value = '';
              }
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue=""
          >
            <option value="">{t('batch.moveTo') || '批量移动到...'}</option>
            <option value="active">{t('status.active')}</option>
            <option value="in_dev">{t('status.in_dev')}</option>
            <option value="archived">{t('status.archived')}</option>
          </select>

          {onBatchTag && (
            <button
              onClick={onBatchTag}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 text-sm flex items-center gap-1"
            >
              🏷️ {t('batch.setTags') || '设置标签'}
            </button>
          )}

          <button
            onClick={onBatchMilestone}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm flex items-center gap-1"
          >
            🚩 {t('batch.setMilestone')}
          </button>

          {onBatchExport && (
            <button
              onClick={onBatchExport}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-1"
            >
              📥 {t('batch.exportSelected') || '导出选中'}
            </button>
          )}

          <button
            onClick={onBatchDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center gap-1"
          >
            🗑️ {t('batch.delete')}
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={onCancelSelect}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
          >
            {t('batch.cancelSelect') || '取消选择'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BatchActionBar;
