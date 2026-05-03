import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SwimlaneCard({ proposal, onClick, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: proposal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'in_dev':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived':
      case 'completed':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'web':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'app':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'feature':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const cardContent = (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 break-words">
          {proposal.name}
        </h4>
        <span className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${getStatusColor(proposal.status)}`}>
          {proposal.status === 'active' ? '待办' : proposal.status === 'in_dev' ? '进行中' : proposal.status === 'archived' ? '已归档' : '完成'}
        </span>
      </div>
      {proposal.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {proposal.description}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {proposal.type && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${getTypeColor(proposal.type)}`}>
              {proposal.type}
            </span>
          )}
          {proposal.priority && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              proposal.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
              proposal.priority === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {proposal.priority === 'high' ? '高' : proposal.priority === 'medium' ? '中' : '低'}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {proposal.id}
        </span>
      </div>
    </div>
  );

  if (isDragging) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border-2 border-blue-400 opacity-90 rotate-2">
        {cardContent}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {cardContent}
    </div>
  );
}

export default SwimlaneCard;
