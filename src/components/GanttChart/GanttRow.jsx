import GanttBar from './GanttBar';

function GanttRow({ project, milestones, startDate, pixelsPerDay, onUpdate, getMilestoneStatus }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="w-40 flex-shrink-0 px-2 py-2 font-medium text-sm text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 bg-gray-25 dark:bg-gray-800">
        <div className="truncate" title={project.projectId}>
          {project.projectId}
        </div>
      </div>
      <div className="timeline-area relative flex-1 py-1">
        {milestones.map((milestone) => {
          const start = new Date(startDate);
          const msStart = new Date(milestone.startDate);
          const msEnd = new Date(milestone.endDate);

          const left = Math.max(0, Math.floor((msStart - start) / (1000 * 60 * 60 * 24)) * pixelsPerDay);
          const duration = Math.ceil((msEnd - msStart) / (1000 * 60 * 60 * 24)) + 1;
          const width = duration * pixelsPerDay;
          const status = getMilestoneStatus(milestone);

          return (
            <GanttBar
              key={milestone.id}
              milestone={milestone}
              left={left}
              width={width}
              pixelsPerDay={pixelsPerDay}
              onUpdate={onUpdate}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
}

export default GanttRow;
