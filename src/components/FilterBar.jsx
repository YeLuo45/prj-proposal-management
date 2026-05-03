import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useFilterTemplate from '../hooks/useFilterTemplate';

function FilterBar({
  viewMode,
  onViewModeChange,
  focusMode,
  onFocusModeChange,
  dateRange,
  setDateRange,
  setDateRangeQuick,
  tagLogic,
  setTagLogic,
  onExportFiltered,
  filteredCount,
  query,
  status,
  type,
  projectId,
  tags,
  onApplyTemplate,
}) {
  const { t } = useTranslation();
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { templates, save, remove } = useFilterTemplate();
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const handleProjectChange = (e) => {
    const val = e.target.value;
    onFocusModeChange({ ...focusMode, projectId: val || null });
  };

  const handleStatusChange = (e) => {
    const val = e.target.value;
    onFocusModeChange({ ...focusMode, status: val || null });
  };

  const clearFocus = () => {
    onFocusModeChange({ projectId: null, status: null });
    setShowFocusDropdown(false);
  };

  const isFocusActive = focusMode?.projectId || focusMode?.status;
  const focusProjectName = focusMode?.projectId ? focusMode.projectId : null;

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const filters = {
      query,
      status,
      type,
      projectId,
      tags,
      tagLogic,
      dateRange,
    };
    save(templateName.trim(), filters);
    setTemplateName('');
    setShowSaveTemplate(false);
  };

  const handleTemplateChange = (e) => {
    const val = e.target.value;
    setSelectedTemplateId(val);
    if (val && onApplyTemplate) {
      const template = templates.find(t => t.id === val);
      if (template) {
        onApplyTemplate(template.filters);
      }
    }
  };

  const handleDeleteTemplate = (e, id) => {
    e.stopPropagation();
    remove(id);
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
    }
  };

  const handleDateFieldChange = (e) => {
    setDateRange({ ...dateRange, field: e.target.value });
  };

  const handleDateStartChange = (e) => {
    setDateRange({ ...dateRange, start: e.target.value });
  };

  const handleDateEndChange = (e) => {
    setDateRange({ ...dateRange, end: e.target.value });
  };

  const handleClearDates = () => {
    setDateRange({ field: dateRange.field, start: '', end: '' });
  };

  const hasDateRange = dateRange?.start || dateRange?.end;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onViewModeChange('projects')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'projects' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            {t('filterBar.projects')}
          </button>
          <button
            onClick={() => onViewModeChange('card')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            {t('filterBar.cards')}
          </button>
          <button
            onClick={() => onViewModeChange('swimlane')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'swimlane' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            {t('filterBar.swimlanes')}
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            {t('filterBar.table')}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowFocusDropdown(!showFocusDropdown)}
              className={`px-3 py-2 rounded-lg flex items-center gap-1 ${isFocusActive ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              👁 {t('filterBar.focus')}
            </button>

            {showFocusDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50 min-w-[200px]">
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('filterBar.project') || 'Project'}</label>
                  <select
                    value={focusMode?.projectId || ''}
                    onChange={handleProjectChange}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">{t('filterBar.allProjects')}</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('filterBar.status.label') || 'Status'}</label>
                  <select
                    value={focusMode?.status || ''}
                    onChange={handleStatusChange}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">{t('filterBar.allStatuses')}</option>
                    <option value="active">{t('filterBar.status.active')}</option>
                    <option value="in_dev">{t('filterBar.status.in_dev')}</option>
                    <option value="archived">{t('filterBar.status.archived')}</option>
                  </select>
                </div>
                {isFocusActive && (
                  <button
                    onClick={clearFocus}
                    className="w-full px-2 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t('filterBar.clearFilter')}
                  </button>
                )}
              </div>
            )}
          </div>

          {isFocusActive && !showFocusDropdown && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs flex items-center gap-1">
              👁 {focusProjectName || ''} {focusProjectName && focusMode?.status ? '-' : ''} {focusMode?.status || ''}
              <button
                onClick={clearFocus}
                className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <select
            value={selectedTemplateId || ''}
            onChange={handleTemplateChange}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="">{t('filterBar.currentFilter')}</option>
            {templates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
            ))}
          </select>
          {selectedTemplateId && templates.find(tpl => tpl.id === selectedTemplateId) && (
            <button
              onClick={(e) => handleDeleteTemplate(e, selectedTemplateId)}
              className="text-gray-400 hover:text-red-500 text-sm"
              title={t('filterBar.deleteTemplate')}
            >
              ×
            </button>
          )}
          {showSaveTemplate ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t('filterBar.templateName')}
                className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
              />
              <button
                onClick={handleSaveTemplate}
                className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t('filterBar.save')}
              </button>
              <button
                onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {t('filterBar.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="px-2 py-1.5 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              title={t('filterBar.saveCurrent')}
            >
              💾 {t('filterBar.save')}
            </button>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-1">
          <select
            value={dateRange?.field || 'createdAt'}
            onChange={handleDateFieldChange}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="createdAt">{t('filterBar.createdAt')}</option>
            <option value="updatedAt">{t('filterBar.updatedAt')}</option>
          </select>
          <input
            type="date"
            value={dateRange?.start || ''}
            onChange={handleDateStartChange}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={dateRange?.end || ''}
            onChange={handleDateEndChange}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <button
            onClick={() => setDateRangeQuick('7d')}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('filterBar.last7Days')}
          </button>
          <button
            onClick={() => setDateRangeQuick('30d')}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('filterBar.last30Days')}
          </button>
          <button
            onClick={() => setDateRangeQuick('month')}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('filterBar.thisMonth')}
          </button>
          <button
            onClick={() => setDateRangeQuick('lastMonth')}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('filterBar.lastMonth')}
          </button>
          {hasDateRange && (
            <button
              onClick={handleClearDates}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {t('filterBar.clear')}
            </button>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-1">
          <select
            value={tagLogic || 'OR'}
            onChange={(e) => setTagLogic(e.target.value)}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="OR">{t('filterBar.matchAny')}</option>
            <option value="AND">{t('filterBar.matchAll')}</option>
          </select>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('filterBar.filterResults')}：<span className="font-semibold text-blue-500">{filteredCount || 0}</span> {t('advancedFilter.results')}
          </span>
          <button
            onClick={onExportFiltered}
            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            📥 {t('filterBar.exportCsv')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
