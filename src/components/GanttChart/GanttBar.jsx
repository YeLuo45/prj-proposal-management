import { useState, useRef, useEffect, useMemo } from 'react';

const STATUS_COLORS = {
  pending: { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-600', fill: '#9ca3af' },
  in_progress: { bg: 'bg-blue-400', border: 'border-blue-500', text: 'text-blue-900', fill: '#60a5fa' },
  completed: { bg: 'bg-green-400', border: 'border-green-500', text: 'text-green-900', fill: '#4ade80' },
  overdue: { bg: 'bg-red-400', border: 'border-red-500', text: 'text-red-900', fill: '#f87171' },
};

// Critical path highlight colors
const CRITICAL_COLORS = {
  pending: { bg: 'bg-orange-300', border: 'border-orange-400', text: 'text-orange-900', fill: '#fb923c' },
  in_progress: { bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-orange-900', fill: '#fb923c' },
  completed: { bg: 'bg-green-400', border: 'border-green-500', text: 'text-green-900', fill: '#4ade80' },
  overdue: { bg: 'bg-red-400', border: 'border-red-500', text: 'text-red-900', fill: '#f87171' },
};

function GanttBar({ milestone, left, width, pixelsPerDay, onUpdate, status, zoom = 'day', isCriticalPath = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const barRef = useRef(null);
  const startXRef = useRef(0);
  const originalStartRef = useRef(null);
  const originalEndRef = useRef(null);
  const originalProgressRef = useRef(null);

  // Use critical path colors if on critical path
  const colors = isCriticalPath 
    ? (CRITICAL_COLORS[status] || CRITICAL_COLORS.pending)
    : (STATUS_COLORS[status] || STATUS_COLORS.pending);

  const handleMouseDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    startXRef.current = e.clientX;
    originalStartRef.current = milestone.startDate;
    originalEndRef.current = milestone.endDate;
    originalProgressRef.current = milestone.progress || 0;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startXRef.current;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      if (dragMode === 'left') {
        const newStart = addDays(originalStartRef.current, deltaDays);
        if (newStart <= milestone.endDate) {
          onUpdate(milestone.id, { startDate: newStart });
        }
      } else if (dragMode === 'right') {
        const newEnd = addDays(originalEndRef.current, deltaDays);
        if (newEnd >= milestone.startDate) {
          onUpdate(milestone.id, { endDate: newEnd });
        }
      } else if (dragMode === 'move') {
        if (deltaDays !== 0) {
          const newStart = addDays(originalStartRef.current, deltaDays);
          const newEnd = addDays(originalEndRef.current, deltaDays);
          onUpdate(milestone.id, { startDate: newStart, endDate: newEnd });
        }
      } else if (dragMode === 'progress') {
        const barWidth = barRef.current?.offsetWidth || width;
        const progressDelta = Math.round((deltaX / barWidth) * 100);
        const newProgress = Math.max(0, Math.min(100, originalProgressRef.current + progressDelta));
        onUpdate(milestone.id, { progress: newProgress });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragMode, milestone.id, milestone.startDate, milestone.endDate, milestone.progress, pixelsPerDay, width, onUpdate]);

  const handleMouseEnter = (e) => {
    if (!isDragging) {
      setTooltip({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleMouseMoveForTooltip = (e) => {
    if (tooltip) {
      setTooltip({ x: e.clientX, y: e.clientY });
    }
  };

  const progress = milestone.progress || 0;
  const progressWidth = `${progress}%`;

  // Render as milestone diamond
  if (milestone.isMilestone) {
    const diamondSize = Math.min(24, Math.max(width, 16));
    const centerX = left + width / 2;
    const rowHeight = 40;
    const centerY = rowHeight / 2;
    
    return (
      <div className="absolute" style={{ left: centerX - diamondSize / 2, top: (centerY - diamondSize / 2) + 8, zIndex: 15 }}>
        <svg 
          width={diamondSize} 
          height={diamondSize} 
          viewBox={`0 0 ${diamondSize} ${diamondSize}`}
          className={`cursor-pointer transition-all hover:scale-125 ${isCriticalPath ? 'drop-shadow-lg' : ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Diamond shape - rotated square */}
          <polygon
            points={`${diamondSize / 2},0 ${diamondSize},${diamondSize / 2} ${diamondSize / 2},${diamondSize} 0,${diamondSize / 2}`}
            fill={colors.fill}
            stroke={colors.border.replace('border-', '')}
            strokeWidth="2"
            className={isCriticalPath ? 'animate-pulse' : ''}
          />
          {/* Inner highlight */}
          <polygon
            points={`${diamondSize / 2},${diamondSize * 0.2} ${diamondSize * 0.8},${diamondSize / 2} ${diamondSize / 2},${diamondSize * 0.8} ${diamondSize * 0.2},${diamondSize / 2}`}
            fill="white"
            fillOpacity="0.3"
          />
        </svg>
        
        {/* Milestone label */}
        <div 
          className={`absolute whitespace-nowrap text-xs font-medium ${colors.text} left-1/2 -translate-x-1/2 mt-1`}
          style={{ maxWidth: 80 }}
        >
          {milestone.name.length > 8 ? milestone.name.substring(0, 8) + '...' : milestone.name}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute z-50 bg-gray-800 text-white text-xs rounded px-2 py-1 -translate-x-1/2 left-1/2 mt-8 whitespace-nowrap shadow-lg">
            <div className="font-semibold">{milestone.name}</div>
            <div className="text-gray-300">{milestone.startDate} ~ {milestone.endDate}</div>
            <div className="text-gray-300">里程碑节点</div>
          </div>
        )}
      </div>
    );
  }

  // Regular task bar with progress
  return (
    <div className="relative">
      <div
        ref={barRef}
        className={`absolute h-7 rounded cursor-grab ${colors.bg} ${colors.border} border shadow-sm hover:shadow-md transition-shadow ${
          isDragging ? 'cursor-grabbing shadow-lg opacity-90' : ''
        } ${isCriticalPath ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}
        style={{ left, width: Math.max(width, 20) }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMoveForTooltip}
      >
        {/* Left handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-l"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        />

        {/* Right handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r"
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        />

        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-l pointer-events-none"
          style={{ width: progressWidth }}
        />

        {/* Progress drag handle */}
        {progress > 0 && progress < 100 && (
          <div
            className="absolute top-0 bottom-0 cursor-ew-resize hover:bg-white/30"
            style={{ left: progressWidth, width: 4, marginLeft: -2 }}
            onMouseDown={(e) => handleMouseDown(e, 'progress')}
          />
        )}

        {/* Label */}
        <div className={`px-2 h-full flex items-center text-xs font-medium ${colors.text} overflow-hidden whitespace-nowrap`}>
          {width > 60 && milestone.name}
          {width > 100 && (
            <span className="ml-auto pr-1 text-xs opacity-75">{progress}%</span>
          )}
        </div>

        {/* Critical path indicator */}
        {isCriticalPath && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="关键路径" />
        )}
      </div>

      {/* Tooltip rendered by parent */}
    </div>
  );
}

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export default GanttBar;
export { STATUS_COLORS, CRITICAL_COLORS };
