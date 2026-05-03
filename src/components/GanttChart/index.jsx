import { useMemo, useState, useRef, useEffect } from 'react';
import GanttHeader from './GanttHeader.jsx';
import GanttRow from './GanttRow.jsx';
import GanttTodayLine from './GanttTodayLine.jsx';
import GanttTooltip from './GanttTooltip.jsx';

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

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const start = new Date(firstDay);
    start.setDate(start.getDate() - PADDING_DAYS);

    let end = new Date(lastDay);
    end.setDate(end.getDate() + PADDING_DAYS);

    // Extend if milestones go beyond
    projects.forEach(project => {
      project.milestones.forEach(ms => {
        const msStart = new Date(ms.startDate);
        const msEnd = new Date(ms.endDate);
        if (msStart < start) start.setDate(msStart.getDate() - PADDING_DAYS);
        if (msEnd > end) end.setDate(msEnd.getDate() + PADDING_DAYS);
      });
    });

    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  }, [projects]);

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

      <div className="overflow-x-auto">
        <div style={{ minWidth: totalWidth }}>
          {/* Today line overlay */}
          <div className="relative">
            <GanttTodayLine startDate={startDate} pixelsPerDay={pixelsPerDay} />

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
