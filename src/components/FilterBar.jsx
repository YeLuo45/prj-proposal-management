import { useState } from 'react';

function FilterBar({
  viewMode,
  onViewModeChange,
  focusMode,
  onFocusModeChange,
}) {
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);

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

  return (
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
  );
}

export default FilterBar;
