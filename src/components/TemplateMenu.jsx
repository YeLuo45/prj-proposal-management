import { useState, useEffect } from 'react';
import { getTemplates, saveTemplate, deleteTemplate, PRESET_TEMPLATES } from '../services/templateService';

/**
 * V15: Kanban Template Menu Component
 * 
 * @param {Object} props
 * @param {string} props.currentTemplateId - Currently active template ID
 * @param {Function} props.onTemplateSelect - Callback when template is selected
 * @param {Function} props.onSaveCurrentBoard - Callback to get current board state
 * @param {Array} props.columns - Current columns
 * @param {Array} props.tasks - Current tasks
 */
function TemplateMenu({
  currentTemplateId,
  onTemplateSelect,
  onSaveCurrentBoard,
  columns = [],
  tasks = [],
}) {
  const [templates, setTemplates] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'preset', 'custom'

  // Load templates on mount
  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  // Listen for storage changes to refresh templates
  useEffect(() => {
    const handleStorage = () => setTemplates(getTemplates());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filteredTemplates = templates.filter(t => {
    if (filterType === 'preset') return t.isPreset;
    if (filterType === 'custom') return !t.isPreset;
    return true;
  });

  const currentTemplate = templates.find(t => t.id === currentTemplateId);

  const handleSelectTemplate = (template) => {
    onTemplateSelect(template);
    setShowDropdown(false);
  };

  const handleSaveTemplate = () => {
    if (!saveName.trim()) return;
    
    // Get current board state if callback provided
    let currentColumns = columns;
    let currentTasks = tasks;
    if (onSaveCurrentBoard) {
      const boardState = onSaveCurrentBoard();
      currentColumns = boardState.columns || columns;
      currentTasks = boardState.tasks || tasks;
    }

    const result = saveTemplate(saveName.trim(), saveDescription.trim(), currentColumns, currentTasks);
    if (result.success) {
      setTemplates(result.templates);
      setShowSaveModal(false);
      setSaveName('');
      setSaveDescription('');
    } else {
      alert('保存失败: ' + result.error);
    }
  };

  const handleDeleteTemplate = (id) => {
    const result = deleteTemplate(id);
    if (result.success) {
      setTemplates(result.templates);
      setShowDeleteConfirm(null);
      if (currentTemplateId === id) {
        onTemplateSelect(PRESET_TEMPLATES[0]);
      }
    } else {
      alert('删除失败: ' + result.error);
    }
  };

  const presetCount = PRESET_TEMPLATES.length;
  const customCount = templates.filter(t => !t.isPreset).length;

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        title="看板模板"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
        </svg>
        <span className="hidden sm:inline">模板</span>
        <span className="badge bg-indigo-300 text-xs px-1.5 rounded-full">
          {templates.length}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">看板模板</h3>
              <button
                onClick={() => setShowSaveModal(true)}
                className="text-sm text-indigo-500 hover:text-indigo-600"
              >
                + 保存当前
              </button>
            </div>
            
            {/* Filter tabs */}
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded ${filterType === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                全部 ({templates.length})
              </button>
              <button
                onClick={() => setFilterType('preset')}
                className={`px-2 py-1 rounded ${filterType === 'preset' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                预设 ({presetCount})
              </button>
              <button
                onClick={() => setFilterType('custom')}
                className={`px-2 py-1 rounded ${filterType === 'custom' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                自定义 ({customCount})
              </button>
            </div>
          </div>

          {/* Template List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                暂无模板
              </div>
            ) : (
              filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    currentTemplateId === template.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-gray-100 truncate">
                          {template.name}
                        </span>
                        {template.isPreset && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                            预设
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {template.description || '无描述'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {template.columns?.length || 0} 列
                        </span>
                        <span className="text-xs text-gray-400">
                          •
                        </span>
                        <span className="text-xs text-gray-400">
                          {template.tasks?.length || 0} 任务
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete button for custom templates */}
                    {!template.isPreset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(template.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="删除模板"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Column preview */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(template.columns || []).slice(0, 5).map(col => (
                      <span
                        key={col.id}
                        className={`text-xs px-1.5 py-0.5 rounded ${col.color || 'bg-gray-400'} text-white`}
                      >
                        {col.title.split(' ')[0]}
                      </span>
                    ))}
                    {(template.columns?.length || 0) > 5 && (
                      <span className="text-xs text-gray-400">
                        +{(template.columns?.length || 0) - 5}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            <button
              onClick={() => setShowDropdown(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              保存为模板
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  模板名称 *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="例如：我的项目看板"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述
                </label>
                <textarea
                  value={saveDescription}
                  onChange={e => setSaveDescription(e.target.value)}
                  placeholder="模板描述（可选）"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
                />
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                将保存当前 {columns.length} 列和 {tasks.length} 个任务
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              确认删除
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              确定要删除这个自定义模板吗？此操作无法撤销。
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteTemplate(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateMenu;
