import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SwimlaneCard from './SwimlaneCard';

const STATUS_COLUMNS = [
  { id: 'active', title: '待办 (Todo)', color: 'bg-gray-500' },
  { id: 'in_dev', title: '进行中 (In Progress)', color: 'bg-blue-500' },
  { id: 'done', title: '已完成 (Done)', color: 'bg-green-500' },
];

function SwimlaneRow({ project, collapsedLaneIds, onToggleCollapse, onCardClick }) {
  const isCollapsed = collapsedLaneIds.has(project.id);

  const getProposalsByStatus = (status) => {
    if (status === 'done') {
      return project.proposals.filter(p => p.status === 'archived' || p.status === 'completed');
    }
    return project.proposals.filter(p => p.status === status);
  };

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
      </div>

      {/* Swimlane Content - Columns */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DroppableColumn({ column, proposals, droppableId, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-3 min-h-[120px] transition-colors ${
        isOver
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'bg-white dark:bg-gray-900'
      }`}
    >
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
            />
          ))}
        </div>
      </SortableContext>
      {proposals.length === 0 && (
        <div className="text-center py-4 text-gray-400 dark:text-gray-600 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          拖拽提案到这里
        </div>
      )}
    </div>
  );
}

export default SwimlaneRow;
