function GanttTooltip({ milestone, position }) {
  if (!milestone) return null;

  const statusColors = {
    pending: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    overdue: 'bg-red-500',
  };

  const statusLabels = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已延期',
  };

  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-48 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -110%)',
      }}
    >
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {milestone.name}
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[milestone.status]}`}></span>
          <span className="text-gray-600 dark:text-gray-300">{statusLabels[milestone.status]}</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          开始: {milestone.startDate}
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          结束: {milestone.endDate}
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          项目: {milestone.projectId}
        </div>
        {milestone.proposalIds && milestone.proposalIds.length > 0 && (
          <div className="text-gray-500 dark:text-gray-400">
            关联: {milestone.proposalIds.length} 个提案
          </div>
        )}
      </div>
      <div className="absolute left-1/2 -bottom-1.5 transform -translate-x-1/2">
        <div className="w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45"></div>
      </div>
    </div>
  );
}

export default GanttTooltip;
