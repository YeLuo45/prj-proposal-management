import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTodos } from '../hooks/useTodos';
import KanbanColumn from '../components/KanbanColumn';
import KanbanCard from '../components/KanbanCard';

const COLUMNS = [
  { id: 'todo', title: '待办 (Todo)', color: 'bg-gray-500' },
  { id: 'inProgress', title: '进行中 (In Progress)', color: 'bg-blue-500' },
  { id: 'done', title: '已完成 (Done)', color: 'bg-green-500' },
];

function KanbanBoard() {
  const [todos, setTodos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskText, setNewTaskText] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const { fetchTodos, saveTodos } = useTodos();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      loadTodos();
    } else {
      setShowTokenInput(true);
      setLoading(false);
    }
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await fetchTodos();
      setTodos(data.todos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = (newToken) => {
    localStorage.setItem('github_token', newToken);
    setToken(newToken);
    setShowTokenInput(false);
    loadTodos();
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTodosByColumn = (columnId) => {
    return todos.filter((todo) => todo.column === columnId);
  };

  const findColumn = (id) => {
    if (todos.find((t) => t.id === id)) {
      return todos.find((t) => t.id === id).column;
    }
    return id;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = findColumn(active.id);
    const overColumn = findColumn(over.id);

    if (activeColumn !== overColumn) {
      setTodos((items) => {
        const activeIndex = items.findIndex((t) => t.id === active.id);
        const updatedItems = [...items];
        updatedItems[activeIndex] = { ...updatedItems[activeIndex], column: overColumn };
        return updatedItems;
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeColumn = findColumn(active.id);
    const overColumn = findColumn(over.id);

    if (activeColumn === overColumn) {
      const columnTodos = todos.filter((t) => t.column === activeColumn);
      const activeIndex = columnTodos.findIndex((t) => t.id === active.id);
      const overIndex = columnTodos.findIndex((t) => t.id === over.id);

      if (activeIndex !== overIndex) {
        const reordered = arrayMove(columnTodos, activeIndex, overIndex);
        const otherTodos = todos.filter((t) => t.column !== activeColumn);
        const updatedTodos = [...otherTodos, ...reordered];

        setTodos(updatedTodos);
        await saveTodos({ todos: updatedTodos });
      }
    } else {
      await saveTodos({ todos });
    }
  };

  const handleAddTask = async (columnId) => {
    const text = newTaskText[columnId]?.trim();
    if (!text) return;

    const newTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: text,
      column: columnId,
      createdAt: new Date().toISOString(),
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    await saveTodos({ todos: updatedTodos });
    setNewTaskText((prev) => ({ ...prev, [columnId]: '' }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    const updatedTodos = todos.filter((t) => t.id !== taskId);
    setTodos(updatedTodos);
    await saveTodos({ todos: updatedTodos });
  };

  const handleMoveTask = async (taskId, direction) => {
    const task = todos.find((t) => t.id === taskId);
    if (!task) return;

    const currentColumnIndex = COLUMNS.findIndex((c) => c.id === task.column);
    let targetColumn;

    if (direction === 'left' && currentColumnIndex > 0) {
      targetColumn = COLUMNS[currentColumnIndex - 1].id;
    } else if (direction === 'right' && currentColumnIndex < COLUMNS.length - 1) {
      targetColumn = COLUMNS[currentColumnIndex + 1].id;
    } else {
      return;
    }

    const updatedTodos = todos.map((t) =>
      t.id === taskId ? { ...t, column: targetColumn } : t
    );
    setTodos(updatedTodos);
    await saveTodos({ todos: updatedTodos });
  };

  const activeTask = activeId ? todos.find((t) => t.id === activeId) : null;

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">设置 GitHub Token</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            请输入 GitHub Personal Access Token 以访问和修改待办事项数据。
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="输入 GitHub Token"
            className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <button
            onClick={() => handleSaveToken(token)}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            保存 Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">看板视图</h1>
            <button
              onClick={toggleDarkMode}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
              title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          <Link
            to="/"
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            返回列表
          </Link>
        </div>

        {loading && <div className="text-center py-8 text-gray-600 dark:text-gray-300">加载中...</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}

        {!loading && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  todos={getTodosByColumn(column.id)}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  newTaskText={newTaskText[column.id] || ''}
                  onNewTaskTextChange={(text) =>
                    setNewTaskText((prev) => ({ ...prev, [column.id]: text }))
                  }
                  isMobile={isMobile}
                  onMoveTask={handleMoveTask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <KanbanCard
                  task={activeTask}
                  isDragging
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default KanbanBoard;
