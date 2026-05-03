import { useState } from 'react';
import useFilterTemplate from '../hooks/useFilterTemplate';

function FilterBar({
  viewMode,
  onViewModeChange,
  focusMode,
  onFocusModeChange,
  // M2: Date range
  dateRange,
  setDateRange,
  setDateRangeQuick,
  // M3: Tag logic
  tagLogic,
  setTagLogic,
  // M4: Export
  onExportFiltered,
  filteredCount,
  // Filter values for template
  query,
  status,
  type,
  projectId,
  tags,
  // Template application
  onApplyTemplate,
}) {
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);
  // M1: Template save form
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
  
  // Get project name for badge
  const focusProjectName = focusMode?.projectId ? focusMode.projectId : null;

  // M1: Handle template save
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

  // M1: Handle template select
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

  // M1: Handle template delete
  const handleDeleteTemplate = (e, id) => {
    e.stopPropagation();
    remove(id);
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
    }
  };

  // M2: Date field change
  const handleDateFieldChange = (e) => {
    setDateRange({ ...dateRange, field: e.target.value });
  };

  // M2: Date input change
  const handleDateStartChange = (e) => {
    setDateRange({ ...dateRange, start: e.target.value });
  };

  const handleDateEndChange = (e) => {
    setDateRange({ ...dateRange, end: e.target.value });
  };

  // M2: Clear dates
  const handleClearDates = () => {
    setDateRange({ field: dateRange.field, start: '', end: '' });
  };

  const hasDateRange = dateRange?.start || dateRange?.end;

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: View mode + Focus controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onViewModeChange('projects')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'projects' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            项目
          </button>
          <button
            onClick={() => onViewModeChange('card')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            卡片
          </button>
          <button
            onClick={() => onViewModeChange('swimlane')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'swimlane' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            泳道
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            列表
          </button>
          
          {/* M3: Focus mode button */}
          <div className="relative">
            <button
              onClick={() => setShowFocusDropdown(!showFocusDropdown)}
              className={`px-3 py-2 rounded-lg flex items-center gap-1 ${isFocusActive ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              👁 专注
            </button>
            
            {/* Focus mode dropdown */}
            {showFocusDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50 min-w-[200px]">
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">项目</label>
                  <select
                    value={focusMode?.projectId || ''}
                    onChange={handleProjectChange}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">全部项目</option>
                    <option value="PRJ-001">PRJ-001</option>
                    <option value="PRJ-002">PRJ-002</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">状态</label>
                  <select
                    value={focusMode?.status || ''}
                    onChange={handleStatusChange}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">全部状态</option>
                    <option value="active">待办 (Todo)</option>
                    <option value="in_dev">进行中 (In Progress)</option>
                    <option value="archived">已完成 (Done)</option>
                  </select>
                </div>
                {isFocusActive && (
                  <button
                    onClick={clearFocus}
                    className="w-full px-2 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* M3: Focus mode active badge */}
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

      {/* Row 2: M1 Template + M2 Date Range + M3 Tag Logic */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* M1: Template selector */}
        <div className="flex items-center gap-1">
          <select
            value={selectedTemplateId || ''}
            onChange={handleTemplateChange}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="">当前筛选</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {selectedTemplateId && templates.find(t => t.id === selectedTemplateId) && (
            <button
              onClick={(e) => handleDeleteTemplate(e, selectedTemplateId)}
              className="text-gray-400 hover:text-red-500 text-sm"
              title="删除模板"
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
                placeholder="模板名称"
                className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
              />
              <button
                onClick={handleSaveTemplate}
                className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
              <button
                onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="px-2 py-1.5 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              title="保存当前筛选"
            >
              💾 保存
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* M2: Date range controls */}
        <div className="flex items-center gap-1">
          <select
            value={dateRange?.field || 'createdAt'}
            onChange={handleDateFieldChange}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="createdAt">创建时间</option>
            <option value="updatedAt">更新时间</option>
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
            近7天
          </button>
          <button
            onClick={() => setDateRangeQuick('30d')}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            近30天
          </button>
          <button
            onClick={() => setDateRangeQuick('month')}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            本月
          </button>
          <button
            onClick={() => setDateRangeQuick('lastMonth')}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            上月
          </button>
          {hasDateRange && (
            <button
              onClick={handleClearDates}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              清除
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* M3: Tag logic toggle */}
        <div className="flex items-center gap-1">
          <select
            value={tagLogic || 'OR'}
            onChange={(e) => setTagLogic(e.target.value)}
            className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="OR">任意匹配(OR)</option>
            <option value="AND">全部匹配(AND)</option>
          </select>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* M4: Filtered export */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            当前筛选结果：<span className="font-semibold text-blue-500">{filteredCount || 0}</span> 条
          </span>
          <button
            onClick={onExportFiltered}
            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            📥 导出 CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
