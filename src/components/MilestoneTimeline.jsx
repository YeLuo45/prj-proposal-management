const STATUS_COLORS = {
  pending: 'bg-gray-300',
  in_progress: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500'
};

const STATUS_LABELS = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成'
};

export default function MilestoneTimeline({ milestones = [], onEdit }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无里程碑，点击上方按钮添加
      </div>
    );
  }

  // 按 targetDate 排序
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return new Date(a.targetDate) - new Date(b.targetDate);
  });

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200" />

      {/* Milestone nodes */}
      <div className="flex justify-between relative">
        {sortedMilestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => onEdit(milestone)}
          >
            {/* Node circle */}
            <div
              className={`w-8 h-8 rounded-full ${STATUS_COLORS[milestone.status] || STATUS_COLORS.pending} 
                flex items-center justify-center text-white text-sm font-bold z-10
                group-hover:scale-110 transition-transform`}
            >
              {milestone.status === 'completed' ? '✓' : index + 1}
            </div>

            {/* Connector line to next */}
            {index < sortedMilestones.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full h-1 bg-gray-200 -z-10" />
            )}

            {/* Label */}
            <div className="mt-2 text-center max-w-[120px]">
              <p className="font-medium text-gray-800 text-sm truncate">
                {milestone.name}
              </p>
              <p className="text-xs text-gray-500">
                {milestone.targetDate || '未设置日期'}
              </p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs
                ${milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                  milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[milestone.status] || '待开始'}
              </span>
            </div>

            {/* Proposal count */}
            {milestone.proposalIds && milestone.proposalIds.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {milestone.proposalIds.length} 个提案
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Milestone list below */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMilestones.map((milestone) => (
          <div
            key={milestone.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onEdit(milestone)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{milestone.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {milestone.targetDate ? `目标: ${milestone.targetDate}` : '未设置日期'}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs
                ${milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                  milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[milestone.status] || '待开始'}
              </span>
            </div>
            {milestone.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {milestone.description}
              </p>
            )}
            {milestone.proposalIds && milestone.proposalIds.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                关联 {milestone.proposalIds.length} 个提案
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
