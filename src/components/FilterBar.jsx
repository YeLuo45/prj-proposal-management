function FilterBar({
  viewMode,
  onViewModeChange,
}) {
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
      </div>
    </div>
  );
}

export default FilterBar;
