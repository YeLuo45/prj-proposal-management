import { useMemo, useState, useRef, useEffect } from 'react';
import GanttHeader from './GanttHeader.jsx';
import GanttRow from './GanttRow.jsx';
import GanttTodayLine from './GanttTodayLine.jsx';
import GanttTooltip from './GanttTooltip.jsx';
import GanttDependencyArrows from './GanttDependencyArrows.jsx';
import { calculateCriticalPath } from '../../utils/criticalPath.js';

const PADDING_DAYS = 7;
const PIXELS_PER_DAY = 40;

const ZOOM_PIXELS_PER_DAY = {
  day: 40,
  week: 17,
  month: 3.3,
};

function GanttChart({ projects, onUpdateMilestone, getMilestoneStatus, zoom = 'day' }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const pixelsPerDay = ZOOM_PIXELS_PER_DAY[zoom] || ZOOM_PIXELS_PER_DAY.day;

  // Flatten all milestones for critical path calculation
  const allMilestones = useMemo(() => {
    return projects.flatMap(p => p.milestones);
  }, [projects]);

  // Calculate critical path
  const criticalPath = useMemo(() => {
    return calculateCriticalPath(allMilestones);
  }, [allMilestones]);

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const start = new Date(firstDay);
    start.setDate(start.getDate() - PADDING_DAYS);

    let end = new Date(lastDay);
    end.setDate(end.getDate() + PADDING_DAYS);

    // Extend if milestones go beyond
    allMilestones.forEach(ms => {
      const msStart = new Date(ms.startDate);
      const msEnd = new Date(ms.endDate);
      if (msStart < start) start.setDate(msStart.getDate() - PADDING_DAYS);
      if (msEnd > end) end.setDate(msEnd.getDate() + PADDING_DAYS);
    });

    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  }, [allMilestones]);

  const totalDays = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const totalWidth = totalDays * pixelsPerDay;

  const handleBarMouseEnter = (milestone, e) => {
    setTooltip({ milestone, x: e.clientX, y: e.clientY });
  };

  const handleBarMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="gantt-container bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden" ref={containerRef}>
      <GanttHeader startDate={startDate} endDate={endDate} pixelsPerDay={pixelsPerDay} zoom={zoom} />

      {/* Critical Path Legend */}
      {criticalPath.size > 0 && (
        <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
            <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
            <span>关键路径已启用 - {criticalPath.size} 个任务在关键路径上</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div style={{ minWidth: totalWidth }}>
          {/* Today line overlay */}
          <div className="relative">
            <GanttTodayLine startDate={startDate} pixelsPerDay={pixelsPerDay} />

            {/* SVG Dependency Arrows Layer */}
            <GanttDependencyArrows 
              projects={projects}
              milestones={allMilestones}
              startDate={startDate}
              pixelsPerDay={pixelsPerDay}
            />

            {/* Project rows */}
            {projects.map((project) => (
              <div key={project.projectId} onMouseLeave={handleBarMouseLeave}>
                <GanttRow
                  project={project}
                  milestones={project.milestones}
                  startDate={startDate}
                  pixelsPerDay={pixelsPerDay}
                  onUpdate={onUpdateMilestone}
                  getMilestoneStatus={getMilestoneStatus}
                  zoom={zoom}
                  criticalPath={criticalPath}
                />
              </div>
            ))}

            {projects.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                暂无里程碑数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global tooltip */}
      {tooltip && (
        <GanttTooltip milestone={tooltip.milestone} position={{ x: tooltip.x, y: tooltip.y }} />
      )}
    </div>
  );
}

export default GanttChart;
export { ZOOM_PIXELS_PER_DAY };
