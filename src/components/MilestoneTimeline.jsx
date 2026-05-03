import MilestoneCard from './MilestoneCard';

function MilestoneTimeline({ milestones, onMilestoneClick }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无里程碑，请点击「添加里程碑」创建
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline container */}
      <div className="flex overflow-x-auto pb-4">
        <div className="flex items-start gap-0 min-w-max">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex items-start">
              {/* Milestone node */}
              <MilestoneCard
                milestone={milestone}
                onClick={() => onMilestoneClick(milestone)}
              />
              
              {/* Connector line (except for last item) */}
              {index < milestones.length - 1 && (
                <div className="flex items-center h-4 mx-2">
                  <div className="w-16 md:w-24 h-0.5 bg-gray-300 dark:bg-gray-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              待开始: {milestones.filter(m => m.status === 'pending').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">
              进行中: {milestones.filter(m => m.status === 'in_progress').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              已完成: {milestones.filter(m => m.status === 'completed').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MilestoneTimeline;
