export default function FilterBar({ typeFilter, onTypeChange, statusFilter, onStatusChange, viewMode, onViewChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select value={typeFilter} onChange={e => onTypeChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="all">全类型</option>
        <option value="web">Web</option>
        <option value="app">App</option>
        <option value="package">Package</option>
      </select>
      <select value={statusFilter} onChange={e => onStatusChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="all">全状态</option>
        <option value="active">Active</option>
        <option value="in_dev">开发中</option>
        <option value="archived">已归档</option>
      </select>
      <div className="flex border border-gray-300 rounded overflow-hidden">
        <button onClick={() => onViewChange('card')}
          className={`px-3 py-2 text-sm ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>
          卡片
        </button>
        <button onClick={() => onViewChange('table')}
          className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>
          表格
        </button>
      </div>
    </div>
  )
}
