import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const ALL_STATUSES = ['active', 'in_dev', 'archived'];
const ALL_TYPES = ['web', 'app', 'package'];

function AdvancedFilter({
  filters,
  onFiltersChange,
  allTags,
  projects,
  matchCount,
  onApply,
  onCancel,
  onClear,
  onSaveFilters,
  onOpenSavedFilters,
  filterLogic = 'OR',
  onFilterLogicChange,
}) {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(filters);
  const [projectSearch, setProjectSearch] = useState('');

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q));
  }, [projects, projectSearch]);

  const toggleStatus = (status) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const toggleType = (type) => {
    setLocalFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const toggleTag = (tag) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
  };

  const handleClear = () => {
    const cleared = {
      statuses: [],
      types: [],
      tags: [],
      projectId: '',
      dateFrom: '',
      dateTo: '',
    };
    setLocalFilters(cleared);
    onClear();
  };

  const handleFilterLogicChange = (logic) => {
    if (onFilterLogicChange) {
      onFilterLogicChange(logic);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
          {t('advancedFilter.title') || '高级筛选'}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleFilterLogicChange('OR')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterLogic === 'OR'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('advancedFilter.matchAny') || '任意匹配'}
            </button>
            <button
              onClick={() => handleFilterLogicChange('AND')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterLogic === 'AND'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('advancedFilter.matchAll') || '全部匹配'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('advancedFilter.status')}</label>
          <div className="space-y-1">
            {ALL_STATUSES.map(status => (
              <label key={status} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.statuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t(`status.${status}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('advancedFilter.type')}</label>
          <div className="space-y-1">
            {ALL_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.types.includes(type)}
                  onChange={() => toggleType(type)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t(`type.${type}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('advancedFilter.tags')}
            {filterLogic === 'AND' && localFilters.tags.length > 0 && (
              <span className="ml-1 text-xs text-blue-500">({t('advancedFilter.allRequired') || '需全部匹配'})</span>
            )}
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {allTags.map(tag => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('advancedFilter.project')}</label>
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder={t('advancedFilter.projectSearch') || '搜索项目...'}
              className="w-full px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <select
              value={localFilters.projectId}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="">{t('filterBar.allProjects')}</option>
              {filteredProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('advancedFilter.createdDate')}</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="flex-1 px-2 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="flex-1 px-2 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('advancedFilter.match')} <span className="font-semibold text-blue-500">{matchCount}</span> {t('advancedFilter.results')}
          </div>
          {onSaveFilters && (
            <button
              onClick={() => onSaveFilters(localFilters)}
              className="ml-3 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              💾 {t('advancedFilter.savePreset') || '保存方案'}
            </button>
          )}
          {onOpenSavedFilters && (
            <button
              onClick={onOpenSavedFilters}
              className="ml-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              📋 {t('advancedFilter.savedPresets') || '已存方案'}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {t('advancedFilter.clear')}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t('advancedFilter.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedFilter;
