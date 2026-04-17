function FilterBar({
  filterType,
  filterStatus,
  viewMode,
  onTypeChange,
  onStatusChange,
  onViewModeChange,
}) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <label className="text-gray-600">类型:</label>
        <select
          value={filterType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部</option>
          <option value="web">Web</option>
          <option value="app">App</option>
          <option value="package">Package</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-gray-600">状态:</label>
        <select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部</option>
          <option value="active">Active</option>
          <option value="in_dev">In Dev</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewModeChange('card')}
          className={`px-3 py-2 rounded-lg ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          卡片
        </button>
        <button
          onClick={() => onViewModeChange('table')}
          className={`px-3 py-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          列表
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
