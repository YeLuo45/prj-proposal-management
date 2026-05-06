import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SwimlaneCard from './SwimlaneCard';

const STATUS_COLUMNS = [
  { id: 'active', title: '待办 (Todo)', color: 'bg-gray-500' },
  { id: 'in_dev', title: '进行中 (In Progress)', color: 'bg-blue-500' },
  { id: 'done', title: '已完成 (Done)', color: 'bg-green-500' },
];

function SwimlaneRow({ project, collapsedLaneIds, onToggleCollapse, onCardClick, overId, activeId, isColumnCollapsed, onToggleColumnCollapse, selectedProposalIds, onToggleSelectProposal, filteredColumns }) {
  const isCollapsed = collapsedLaneIds.has(project.id);
  
  // M2: Lane filter state
  const [laneFilter, setLaneFilter] = useState({ query: '', type: '' });
  const [showLaneFilter, setShowLaneFilter] = useState(false);

  // M2: Filtered proposals by lane filter
  const filteredProposals = useMemo(() => {
    return project.proposals.filter(p => {
      const q = laneFilter.query.toLowerCase();
      const matchesQuery = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q);
      const matchesType = !laneFilter.type || p.type === laneFilter.type;
      return matchesQuery && matchesType;
    });
  }, [project.proposals, laneFilter]);

  // Use external filtered columns if provided (from global swimlane search), otherwise use internal filter
  const getProposalsByStatus = (status) => {
    // If filteredColumns is provided by parent (global swimlane search), use it
    if (filteredColumns) {
      if (status === 'done') {
        return filteredColumns.done;
      }
      return filteredColumns[status] || [];
    }
    
    // Otherwise use internal lane filter
    const sourceProposals = laneFilter.query || laneFilter.type ? filteredProposals : project.proposals;
    if (status === 'done') {
      return sourceProposals.filter(p => p.status === 'archived' || p.status === 'completed');
    }
    return sourceProposals.filter(p => p.status === status);
  };

  const clearLaneFilter = () => {
    setLaneFilter({ query: '', type: '' });
  };

  const hasActiveFilter = laneFilter.query || laneFilter.type;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Swimlane Header - Clickable to collapse/expand */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer select-none"
        onClick={() => onToggleCollapse(project.id)}
      >
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            {project.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {project.id}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {STATUS_COLUMNS.map(col => {
            const count = getProposalsByStatus(col.id).length;
            return (
              <span key={col.id} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${col.color.replace('bg-', 'bg-')}`}></span>
                {col.title.split(' ')[0]} {count}
              </span>
            );
          })}
        </div>
        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs">
          {project.proposals.length} 提案
        </span>
        {/* M2: Lane filter toggle button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLaneFilter(!showLaneFilter);
          }}
          className={`px-2 py-1 rounded text-xs ${hasActiveFilter ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
        >
          🔍 筛选
        </button>
      </div>

      {/* M2: Lane filter panel */}
      {showLaneFilter && !isCollapsed && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <input
            type="text"
            value={laneFilter.query}
            onChange={(e) => setLaneFilter(prev => ({ ...prev, query: e.target.value }))}
            placeholder="搜索提案..."
            className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          />
          <select
            value={laneFilter.type}
            onChange={(e) => setLaneFilter(prev => ({ ...prev, type: e.target.value }))}
            className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">全部类型</option>
            <option value="web">Web</option>
            <option value="app">App</option>
            <option value="library">Library</option>
          </select>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearLaneFilter();
            }}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            清除
          </button>
        </div>
      )}

      {/* Swimlane Content - Columns - Horizontal scroll on mobile */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 kanban-scroll-container">
          {STATUS_COLUMNS.map(column => {
            const columnProposals = getProposalsByStatus(column.id);
            const droppableId = `${project.id}:${column.id}`;

            return (
              <DroppableColumn
                key={column.id}
                column={column}
                proposals={columnProposals}
                droppableId={droppableId}
                onCardClick={onCardClick}
                isDropTarget={overId === droppableId && activeId !== droppableId}
                isCollapsed={isColumnCollapsed ? isColumnCollapsed(project.id, column.id) : false}
                onToggleCollapse={() => onToggleColumnCollapse(project.id, column.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DroppableColumn({ column, proposals, droppableId, onCardClick, isDropTarget, isCollapsed, onToggleCollapse }) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  // M1: Column collapse button
  const toggleBtn = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleCollapse();
      }}
      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      title={isCollapsed ? '展开' : '折叠'}
    >
      {isCollapsed ? '▶' : '▼'}
    </button>
  );

  // M1: Collapsed view
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        className="p-3 min-h-[120px] bg-white dark:bg-gray-900 relative"
      >
        {toggleBtn}
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          {proposals.length} 项
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`p-3 min-h-[120px] transition-colors relative ${
        isOver || isDropTarget
          ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400 ring-inset'
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      {toggleBtn}
      <div className={`${column.color} text-white text-xs px-2 py-1 rounded-t mb-2 inline-block`}>
        {column.title}
      </div>
      <SortableContext
        items={proposals.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {proposals.map(proposal => (
            <SwimlaneCard
              key={proposal.id}
              proposal={proposal}
              onClick={() => onCardClick(proposal)}
              selected={selectedProposalIds?.includes(proposal.id)}
              onToggleSelect={onToggleSelectProposal}
            />
          ))}
        </div>
      </SortableContext>
      {proposals.length === 0 && (
        <div className={`text-center py-4 text-sm border-2 border-dashed rounded-lg transition-all ${
          isDropTarget 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600'
        }`}>
          拖拽提案到这里
        </div>
      )}
    </div>
  );
}

export default SwimlaneRow;
