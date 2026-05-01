import { useState, useRef } from 'react'

export default function FilterBar({
  typeFilter, onTypeChange,
  statusFilter, onStatusChange,
  viewMode, onViewChange,
  dateRange, onDateRangeChange,
  selectedTags, onTagsChange,
  allTags,
  savedFilters, onSaveFilter, onLoadFilter, onDeleteFilter,
  showAdvanced, onToggleAdvanced,
  // Batch operations
  onBatchArchive,
  onBatchTag,
  hasSelectedProposals,
  selectedCount,
  // Import/Export
  onExportJSON,
  onExportCSV,
  onImportCSV,
}) {
  const [filterName, setFilterName] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [showSavedDropdown, setShowSavedDropdown] = useState(false)
  const [showBatchTagModal, setShowBatchTagModal] = useState(false)
  const [batchTagInput, setBatchTagInput] = useState('')
  const fileInputRef = useRef(null)

  const statusOptions = [
    { value: 'all', label: '全状态' },
    { value: 'intake', label: '待 intake' },
    { value: 'clarifying', label: '澄清中' },
    { value: 'prd_pending_confirmation', label: 'PRD 待确认' },
    { value: 'approved_for_dev', label: '已批准开发' },
    { value: 'in_dev', label: '开发中' },
    { value: 'in_acceptance', label: '验收中' },
    { value: 'accepted', label: '已验收' },
    { value: 'archived', label: '已归档' },
  ]

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleSave = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim())
      setFilterName('')
    }
  }

  const handleBatchTagApply = () => {
    if (batchTagInput.trim()) {
      const tags = batchTagInput.split(',').map(t => t.trim()).filter(Boolean)
      onBatchTag(tags)
      setBatchTagInput('')
      setShowBatchTagModal(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onImportCSV(file)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select value={typeFilter} onChange={e => onTypeChange(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
        <option value="all">全类型</option>
        <option value="web">Web</option>
        <option value="app">App</option>
        <option value="package">Package</option>
      </select>

      <select value={statusFilter} onChange={e => onStatusChange(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
        {statusOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* View mode toggle */}
      <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        <button onClick={() => onViewChange('card')}
          className={`px-3 py-2 text-sm ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
          卡片
        </button>
        <button onClick={() => onViewChange('table')}
          className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
          表格
        </button>
        <button onClick={() => onViewChange('kanban')}
          className={`px-3 py-2 text-sm ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
          看板
        </button>
      </div>

      {/* Advanced filter toggle */}
      <button
        onClick={onToggleAdvanced}
        className={`px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded ${showAdvanced ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
      >
        {showAdvanced ? '收起筛选' : '高级筛选'}
      </button>

      {/* Batch operations - only show when proposals are selected */}
      {hasSelectedProposals && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            已选 {selectedCount} 个提案
          </span>
          <button
            onClick={onBatchArchive}
            className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded px-2 py-1"
          >
            批量归档
          </button>
          <button
            onClick={() => setShowBatchTagModal(true)}
            className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded px-2 py-1"
          >
            批量打标签
          </button>
        </div>
      )}

      {/* Import/Export buttons */}
      <div className="flex gap-2">
        <div className="relative">
          <button
            onClick={handleImportClick}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            📥 导入 CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <button
          onClick={onExportJSON}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          📤 导出 JSON
        </button>
        <button
          onClick={onExportCSV}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          📊 导出 CSV
        </button>
      </div>

      {/* Batch tag modal */}
      {showBatchTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">批量添加标签</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              为选中的 {selectedCount} 个提案添加标签（逗号分隔）
            </p>
            <input
              type="text"
              value={batchTagInput}
              onChange={e => setBatchTagInput(e.target.value)}
              placeholder="react, pwa, 游戏"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              onKeyDown={e => e.key === 'Enter' && handleBatchTagApply()}
            />
            <div className="flex gap-3">
              <button
                onClick={handleBatchTagApply}
                className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
              >
                应用
              </button>
              <button
                onClick={() => setShowBatchTagModal(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="w-full flex flex-wrap gap-3 items-end mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          {/* Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">创建日期范围</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => onDateRangeChange({ ...dateRange, start: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => onDateRangeChange({ ...dateRange, end: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Multi-tag filter */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs text-gray-500 dark:text-gray-400">标签筛选</label>
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-left bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 min-w-[120px] hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {selectedTags.length === 0 ? '选择标签' : `${selectedTags.length} 个标签`}
            </button>
            {showTagDropdown && allTags.length > 0 && (
              <div className="absolute z-10 top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto min-w-[150px]">
                {allTags.map(tag => (
                  <label key={tag} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className="rounded"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Clear selected tags */}
          {selectedTags.length > 0 && (
            <button
              onClick={() => onTagsChange([])}
              className="text-sm text-red-500 hover:text-red-700 px-2 py-1"
            >
              清除标签
            </button>
          )}

          {/* Saved filters */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs text-gray-500 dark:text-gray-400">已保存筛选</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 min-w-[100px]"
              >
                {savedFilters.length > 0 ? `${savedFilters.length} 个筛选` : '无'}
              </button>
              {showSavedDropdown && savedFilters.length > 0 && (
                <div className="absolute z-10 top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg min-w-[150px]">
                  {savedFilters.map(f => (
                    <div key={f.name} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <button
                        onClick={() => { onLoadFilter(f); setShowSavedDropdown(false) }}
                        className="text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600"
                      >
                        {f.name}
                      </button>
                      <button
                        onClick={() => onDeleteFilter(f.name)}
                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">保存当前筛选</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                placeholder="筛选名称"
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 w-28"
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              <button
                onClick={handleSave}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
