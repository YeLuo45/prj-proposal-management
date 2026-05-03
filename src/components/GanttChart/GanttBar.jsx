import { useState, useRef, useEffect } from 'react';

const STATUS_COLORS = {
  pending: { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-600' },
  in_progress: { bg: 'bg-blue-400', border: 'border-blue-500', text: 'text-blue-900' },
  completed: { bg: 'bg-green-400', border: 'border-green-500', text: 'text-green-900' },
  overdue: { bg: 'bg-red-400', border: 'border-red-500', text: 'text-red-900' },
};

function GanttBar({ milestone, left, width, pixelsPerDay, onUpdate, status }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'left' | 'right' | 'move'
  const [tooltip, setTooltip] = useState(null);
  const barRef = useRef(null);
  const startXRef = useRef(0);
  const originalStartRef = useRef(null);
  const originalEndRef = useRef(null);

  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;

  const handleMouseDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    startXRef.current = e.clientX;
    originalStartRef.current = milestone.startDate;
    originalEndRef.current = milestone.endDate;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startXRef.current;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      if (deltaDays === 0) return;

      const newStart = addDays(originalStartRef.current, deltaDays);
      const newEnd = addDays(originalEndRef.current, deltaDays);

      if (dragMode === 'left') {
        onUpdate(milestone.id, { startDate: newStart });
      } else if (dragMode === 'right') {
        onUpdate(milestone.id, { endDate: newEnd });
      } else if (dragMode === 'move') {
        onUpdate(milestone.id, { startDate: newStart, endDate: newEnd });
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
  }, [isDragging, dragMode, milestone.id, pixelsPerDay, onUpdate]);

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

  return (
    <div className="relative">
      <div
        ref={barRef}
        className={`absolute h-7 rounded cursor-grab ${colors.bg} ${colors.border} border shadow-sm hover:shadow-md transition-shadow ${
          isDragging ? 'cursor-grabbing shadow-lg opacity-90' : ''
        }`}
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

        {/* Label */}
        <div className={`px-2 h-full flex items-center text-xs font-medium ${colors.text} overflow-hidden whitespace-nowrap`}>
          {width > 60 && milestone.name}
        </div>
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
