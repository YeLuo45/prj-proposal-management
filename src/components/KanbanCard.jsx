import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function KanbanCard({ task, onDelete, isDragging, isMobile, onMoveLeft, onMoveRight }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardContent = (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-300 dark:border-gray-600 cursor-grab active:cursor-grabbing">
      <p className="text-gray-800 dark:text-gray-100 text-sm mb-2 break-words">{task.title}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(task.createdAt).toLocaleDateString('zh-CN')}
        </span>
        <div className="flex gap-1">
          {isMobile && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveLeft();
                }}
                className="text-gray-500 hover:text-blue-500 p-1 text-xs"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveRight();
                }}
                className="text-gray-500 hover:text-blue-500 p-1 text-xs"
              >
                →
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-500 p-1 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );

  if (isDragging) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border-2 border-blue-400 opacity-90">
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
    >
      {cardContent}
    </div>
  );
}

export default KanbanCard;
