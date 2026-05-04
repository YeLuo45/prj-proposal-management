import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSavedFilters, saveFilter, deleteFilter, updateFilter } from '../utils/savedFiltersStore';

function SavedFilters({ onApply, onClose, currentFilters }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState([]);
  const [showSave, setShowSave] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setFilters(getSavedFilters());
  }, []);

  const handleSave = () => {
    if (!filterName.trim()) return;
    const result = saveFilter(filterName.trim(), currentFilters);
    setFilters(result.filters);
    setFilterName('');
    setShowSave(false);
  };

  const handleDelete = (id) => {
    if (!confirm(t('savedFilters.confirmDelete') || '确定删除此筛选方案？')) return;
    const result = deleteFilter(id);
    setFilters(result.filters);
  };

  const handleApply = (filter) => {
    onApply(filter.filters);
    onClose();
  };

  const handleRename = (id) => {
    if (!editName.trim()) return;
    const result = updateFilter(id, { name: editName.trim() });
    setFilters(result.filters);
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t('savedFilters.title') || '筛选方案'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {showSave ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder={t('savedFilters.namePlaceholder') || '输入方案名称'}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => { setShowSave(false); setFilterName(''); }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              {t('savedFilters.saveCurrent') || '保存当前筛选'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filters.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="text-4xl mb-2">📋</div>
              <p>{t('savedFilters.empty') || '暂无保存的筛选方案'}</p>
              <p className="text-sm mt-1">{t('savedFilters.emptyHint') || '设置好筛选条件后点击上方按钮保存'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filters.map((filter) => (
                <div
                  key={filter.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {editingId === filter.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(filter.id);
                          if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                        }}
                      />
                      <button
                        onClick={() => handleRename(filter.id)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditName(''); }}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => handleApply(filter)}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {filter.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(filter.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {renderFilterSummary(filter.filters, t)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => { setEditingId(filter.id); setEditName(filter.name); }}
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title={t('savedFilters.rename') || '重命名'}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(filter.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title={t('common.delete')}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderFilterSummary(filters, t) {
  const parts = [];
  if (filters.statuses?.length) {
    parts.push(`${t('advancedFilter.status')}: ${filters.statuses.join(', ')}`);
  }
  if (filters.types?.length) {
    parts.push(`${t('advancedFilter.type')}: ${filters.types.join(', ')}`);
  }
  if (filters.tags?.length) {
    parts.push(`${t('advancedFilter.tags')}: ${filters.tags.slice(0, 3).join(', ')}${filters.tags.length > 3 ? '...' : ''}`);
  }
  if (filters.projectId) {
    parts.push(`${t('advancedFilter.project')}: ${filters.projectId}`);
  }
  if (filters.dateFrom || filters.dateTo) {
    parts.push(`${filters.dateFrom || '...'} ~ ${filters.dateTo || '...'}`);
  }
  return parts.length > 0 ? parts.join(' | ') : t('savedFilters.noFilters') || '无筛选条件';
}

export default SavedFilters;
