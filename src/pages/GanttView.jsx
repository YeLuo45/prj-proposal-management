import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import GanttChart from '../components/GanttChart/index.jsx';
import { useGanttData } from '../hooks/useGanttData.js';

const STATUS_LABELS = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已延期',
};

const STATUS_COLORS = {
  pending: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  overdue: 'bg-red-500',
};

const ZOOM_OPTIONS = [
  { id: 'day', label: '日', icon: '📅' },
  { id: 'week', label: '周', icon: '📆' },
  { id: 'month', label: '月', icon: '📆' },
];

function GanttView() {
  const {
    milestones,
    loading,
    error,
    loadMilestones,
    updateMilestone,
    getMilestoneStatus,
    groupByProject,
    allProjectIds,
    allStatuses,
  } = useGanttData();

  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState(['pending', 'in_progress', 'overdue']);
  const [showCompleted, setShowCompleted] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [zoom, setZoom] = useState('day');
  const [viewMode, setViewMode] = useState('gantt'); // 'gantt' or 'kanban'

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const filteredMilestones = useMemo(() => {
    return milestones.filter(ms => {
      // Project filter
      if (selectedProjects.length > 0 && !selectedProjects.includes(ms.projectId)) {
        return false;
      }
      // Status filter
      const status = getMilestoneStatus(ms);
      if (!showCompleted && status === 'completed') return false;
      if (!selectedStatuses.includes(status)) return false;
      return true;
    });
  }, [milestones, selectedProjects, selectedStatuses, showCompleted, getMilestoneStatus]);

  const groupedProjects = useMemo(() => {
    return groupByProject(filteredMilestones);
  }, [filteredMilestones, groupByProject]);

  const handleUpdateMilestone = async (id, updates) => {
    await updateMilestone(id, updates);
  };

  const toggleProject = (projectId) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(p => p !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  if (loading && milestones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">甘特图视图</h1>
            <button
              onClick={toggleDarkMode}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
              title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          <Link
            to="/"
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            返回列表
          </Link>
        </div>

        {/* View Mode Switcher + Zoom Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-6">
            {/* View Mode Switcher */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">视图模式</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    viewMode === 'gantt'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  甘特图
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  看板
                </button>
              </div>
            </div>

            {/* Zoom Controls - Only show in Gantt view */}
            {viewMode === 'gantt' && (
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">时间缩放</div>
                <div className="flex gap-1">
                  {ZOOM_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setZoom(option.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        zoom === option.id
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Project Filter */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">项目筛选</div>
              <div className="flex flex-wrap gap-2">
                {allProjectIds.map(projectId => (
                  <button
                    key={projectId}
                    onClick={() => toggleProject(projectId)}
                    className={`px-2 py-1 text-xs rounded border ${
                      selectedProjects.includes(projectId) || selectedProjects.length === 0
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {projectId}
                  </button>
                ))}
                {selectedProjects.length === 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">全部</span>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">状态筛选</div>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-2 py-1 text-xs rounded border flex items-center gap-1 ${
                      selectedStatuses.includes(status)
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`}></span>
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Hide Completed Toggle */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">显示</div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                显示已完成
              </label>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {loading && milestones.length > 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">保存中...</div>
        )}

        {/* Gantt Chart */}
        {viewMode === 'gantt' && (
          <GanttChart
            projects={groupedProjects}
            onUpdateMilestone={handleUpdateMilestone}
            getMilestoneStatus={getMilestoneStatus}
            zoom={zoom}
          />
        )}

        {/* Kanban View - Simple kanban by status */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['pending', 'in_progress', 'overdue', 'completed'].map(status => {
              const statusMilestones = filteredMilestones.filter(ms => getMilestoneStatus(ms) === status);
              return (
                <div key={status} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`}></span>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">{STATUS_LABELS[status]}</h3>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">({statusMilestones.length})</span>
                  </div>
                  <div className="space-y-2">
                    {statusMilestones.map(ms => (
                      <div key={ms.id} className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-200 truncate">{ms.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {ms.startDate} ~ {ms.endDate}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{ms.projectId}</div>
                      </div>
                    ))}
                    {statusMilestones.length === 0 && (
                      <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">暂无</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hint */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          {viewMode === 'gantt' && '提示：拖拽条形图左边缘调整开始日期，右边缘调整结束日期，中间移动整条里程碑，拖拽进度条调整进度'}
          {viewMode === 'kanban' && '提示：切换到甘特图视图进行时间范围拖拽调整'}
        </div>
      </div>
    </div>
  );
}

export default GanttView;
