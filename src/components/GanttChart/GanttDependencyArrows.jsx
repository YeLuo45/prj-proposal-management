import { useMemo } from 'react';

/**
 * GanttDependencyArrows - Renders SVG arrows between dependent tasks
 */
function GanttDependencyArrows({ 
  projects, 
  milestones, 
  startDate, 
  pixelsPerDay,
  rowHeight = 40 
}) {
  const arrows = useMemo(() => {
    const result = [];
    const milestoneMap = new Map();
    
    // Build milestone lookup
    milestones.forEach(ms => {
      milestoneMap.set(ms.id, ms);
    });

    // Calculate position for a milestone
    const getMilestonePosition = (ms) => {
      const start = new Date(startDate);
      const msStart = new Date(ms.startDate);
      const msEnd = new Date(ms.endDate);
      
      const left = Math.max(0, Math.floor((msStart - start) / (1000 * 60 * 60 * 24)) * pixelsPerDay);
      const endLeft = Math.floor((msEnd - start) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
      const duration = Math.ceil((msEnd - msStart) / (1000 * 60 * 60 * 24)) + 1;
      const width = duration * pixelsPerDay;
      
      // Find the project row index
      let projectIndex = 0;
      for (let i = 0; i < projects.length; i++) {
        if (projects[i].projectId === ms.projectId) {
          projectIndex = i;
          break;
        }
      }
      
      const y = projectIndex * rowHeight + rowHeight / 2 + 8; // 8px offset for row padding
      
      return {
        left,
        endLeft,
        width,
        centerX: left + width / 2,
        centerY: y,
        // For milestone diamonds
        diamondCenterX: left + width / 2,
        diamondY: y,
      };
    };

    // Draw arrows for each dependency
    milestones.forEach(ms => {
      if (ms.dependencies && ms.dependencies.length > 0) {
        const targetPos = getMilestonePosition(ms);
        
        ms.dependencies.forEach(depId => {
          const depMs = milestoneMap.get(depId);
          if (!depMs) return;
          
          // Only show dependencies within the same project for clarity
          const sourcePos = getMilestonePosition(depMs);
          
          // Calculate arrow path
          const startX = sourcePos.endLeft;
          const startY = sourcePos.centerY;
          const endX = targetPos.left;
          const endY = targetPos.centerY;
          
          // Skip if invalid coordinates
          if (endX <= startX) return;
          
          result.push({
            id: `${depId}-${ms.id}`,
            startX,
            startY,
            endX,
            endY,
            sourceId: depId,
            targetId: ms.id,
          });
        });
      }
    });

    return result;
  }, [projects, milestones, startDate, pixelsPerDay, rowHeight]);

  if (arrows.length === 0) return null;

  // Calculate SVG bounds
  const maxX = Math.max(...arrows.map(a => Math.max(a.startX, a.endX)), 1000);
  const maxY = Math.max(...arrows.map(a => Math.max(a.startY, a.endY)), 200);

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-10"
      style={{
        width: maxX + 50,
        height: maxY + 20,
      }}
      overflow="visible"
    >
      <defs>
        {/* Arrow marker */}
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="#6366f1"
            className="opacity-70"
          />
        </marker>
        {/* Critical path arrow marker */}
        <marker
          id="arrowhead-critical"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="#f97316"
          />
        </marker>
        {/* Hover effect filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {arrows.map((arrow) => {
        // Create a curved path for the dependency arrow
        const midX = (arrow.startX + arrow.endX) / 2;
        const pathHeight = 15;
        
        // Determine if either milestone is on critical path
        const isSourceCritical = milestones.find(m => m.id === arrow.sourceId)?.isCriticalPath;
        const isTargetCritical = milestones.find(m => m.id === arrow.targetId)?.isCriticalPath;
        const isCritical = isSourceCritical || isTargetCritical;
        
        const strokeColor = isCritical ? '#f97316' : '#6366f1';
        const markerEnd = isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)';

        // Build path
        let d;
        if (Math.abs(arrow.endY - arrow.startY) < 5) {
          // Same row - simple horizontal arrow with slight curve
          d = `M ${arrow.startX} ${arrow.startY} C ${midX} ${arrow.startY - pathHeight} ${midX} ${arrow.endY - pathHeight} ${arrow.endX} ${arrow.endY}`;
        } else {
          // Different rows - use bezier curves
          d = `M ${arrow.startX} ${arrow.startY} 
               C ${arrow.startX + 30} ${arrow.startY} 
                 ${arrow.endX - 30} ${arrow.endY} 
                 ${arrow.endX} ${arrow.endY}`;
        }

        return (
          <g key={arrow.id} className="dependency-arrow">
            {/* Shadow path for better visibility */}
            <path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeOpacity="0.5"
            />
            {/* Main arrow path */}
            <path
              d={d}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeDasharray={isCritical ? "5,3" : "none"}
              markerEnd={markerEnd}
              className="transition-all duration-300"
              filter={isCritical ? "url(#glow)" : "none"}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default GanttDependencyArrows;
