function MilestoneCard({ milestone, onClick }) {
  const statusColors = {
    pending: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
  };

  const statusLabels = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group"
    >
      {/* Node circle */}
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full ${statusColors[milestone.status]} ${
            milestone.status === 'in_progress' ? 'animate-pulse' : ''
          }`}
        />
        <div className="mt-2 text-center">
          <div className="font-medium text-gray-800 dark:text-gray-100 text-sm">
            {milestone.name}
          </div>
          {milestone.targetDate && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {milestone.targetDate}
            </div>
          )}
          <div className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
            milestone.status === 'pending' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
            milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          }`}>
            {statusLabels[milestone.status]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MilestoneCard;
