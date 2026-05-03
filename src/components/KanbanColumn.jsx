import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

function KanbanColumn({ column, todos, onAddTask, onDeleteTask, newTaskText, onNewTaskTextChange, isMobile, onMoveTask }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onAddTask(column.id);
    }
  };

  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 flex flex-col h-full">
      <div className={`${column.color} text-white px-4 py-2 rounded-t-lg -mx-4 -mt-4 mb-4`}>
        <h2 className="font-bold text-lg">{column.title}</h2>
        <span className="text-sm opacity-80">{todos.length} 项</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
        <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {todos.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onDelete={() => onDeleteTask(task.id)}
              isMobile={isMobile}
              onMoveLeft={() => onMoveTask(task.id, 'left')}
              onMoveRight={() => onMoveTask(task.id, 'right')}
            />
          ))}
        </SortableContext>
      </div>

      <div className="mt-4 space-y-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => onNewTaskTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`添加任务到 ${column.title.split(' ')[0]}...`}
          className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
        />
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border transition-colors"
        >
          添加
        </button>
      </div>
    </div>
  );
}

export default KanbanColumn;
