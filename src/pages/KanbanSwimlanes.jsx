import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { useGitHub } from '../hooks/useGitHub';
import SwimlaneRow from '../components/SwimlaneRow';
import SwimlaneCard from '../components/SwimlaneCard';
import ProposalForm from '../components/ProposalForm';

const STATUS_COLUMNS = [
  { id: 'active', title: '待办 (Todo)', color: 'bg-gray-500' },
  { id: 'in_dev', title: '进行中 (In Progress)', color: 'bg-blue-500' },
  { id: 'done', title: '已完成 (Done)', color: 'bg-green-500' },
];

// embeddedMode: 当作为 App.jsx 嵌入式组件使用时，接收外部数据和回调
function KanbanSwimlanes({ projects: propProjects, proposals: propProposals, onUpdateProposal, focusMode }) {
  const { projectId } = useParams();
  
  // 判断是否为嵌入式模式（有外部传入数据）
  const isEmbedded = propProjects !== undefined || propProposals !== undefined;
  
  // 嵌入式模式：使用外部传入的数据
  const [internalProjects, setInternalProjects] = useState([]);
  const [internalProposals, setInternalProposals] = useState([]);
  
  // 统一的数据源
  const projects = isEmbedded ? (propProjects || internalProjects) : internalProjects;
  const setProjects = isEmbedded ? () => {} : setInternalProjects;
  const flatProposals = isEmbedded ? (propProposals || internalProposals) : internalProposals;
  const setFlatProposals = isEmbedded ? () => {} : setInternalProposals;
  
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null); // 用于拖拽高亮
  const [collapsedLaneIds, setCollapsedLaneIds] = useState(() => {
    // 从 localStorage 恢复折叠状态
    try {
      return new Set(JSON.parse(localStorage.getItem('swimlanes_collapsed') || '[]'));
    } catch { return new Set(); }
  });
  
  // M1: Column collapse state
  const [collapsedColumns, setCollapsedColumns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kanban_column_collapsed') || '{}'); }
    catch { return {}; }
  });
  const [loading, setLoading] = useState(!isEmbedded);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { loading: ghLoading, fetchProposals, saveProposals } = useGitHub();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      loadProposals();
    } else {
      setShowTokenInput(true);
      setLoading(false);
    }
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await fetchProposals();
      if (data.projects && Array.isArray(data.projects)) {
        setProjects(data.projects);
        const flat = data.projects.flatMap(project =>
          (project.proposals || []).map(p => ({
            ...p,
            projectName: project.name,
            projectUrl: project.url,
            projectGitRepo: project.gitRepo,
            projectId: project.id,
          }))
        );
        setFlatProposals(flat);
      } else if (data.proposals && Array.isArray(data.proposals)) {
        setProjects([]);
        setFlatProposals(data.proposals);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build lanes data from projects
  const lanes = useMemo(() => {
    let filteredProjects = projects;

    // Filter by projectId if viewing single project
    if (projectId) {
      filteredProjects = projects.filter(p => p.id === projectId);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredProjects = filteredProjects.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return filteredProjects.map(project => ({
      project,
      columns: {
        active: project.proposals.filter(p => p.status === 'active'),
        in_dev: project.proposals.filter(p => p.status === 'in_dev'),
        done: project.proposals.filter(p => p.status === 'archived' || p.status === 'completed'),
      },
    }));
  }, [projects, projectId, searchQuery]);

  const activeProposal = useMemo(() => {
    if (!activeId) return null;
    return flatProposals.find(p => p.id === activeId);
  }, [activeId, flatProposals]);

  const findProjectByProposalId = (proposalId) => {
    return projects.find(p => p.proposals.some(prop => prop.id === proposalId));
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) {
      setOverId(null);
      return;
    }

    setOverId(over.id);

    // over.id format: "projectId:status"
    const [targetProjectId, targetStatus] = over.id.split(':');
    const proposal = flatProposals.find(p => p.id === active.id);
    if (!proposal) return;

    // Check if proposal is in a different project or status changed
    const sourceProject = findProjectByProposalId(active.id);
    if (!sourceProject) return;

    // If moving to a different status within same project, update local state optimistically
    if (sourceProject.id === targetProjectId && proposal.status !== targetStatus) {
      setProjects(prev => prev.map(p => {
        if (p.id === targetProjectId) {
          return {
            ...p,
            proposals: p.proposals.map(prop => {
              if (prop.id === active.id) {
                return { ...prop, status: targetStatus };
              }
              return prop;
            }),
          };
        }
        return p;
      }));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setOverId(null);
    setActiveId(null);

    if (!over) return;

    // over.id format: "projectId:status"
    const [targetProjectId, targetStatus] = over.id.split(':');
    const proposal = flatProposals.find(p => p.id === active.id);
    if (!proposal) return;

    const sourceProject = findProjectByProposalId(active.id);
    if (!sourceProject) return;

    // Don't allow cross-project moves
    if (sourceProject.id !== targetProjectId) {
      alert('暂不支持跨项目移动提案');
      return;
    }

    // If status actually changed
    if (proposal.status !== targetStatus) {
      const today = new Date().toISOString().split('T')[0];
      
      if (isEmbedded && onUpdateProposal) {
        // 嵌入式模式：通知外部更新
        await onUpdateProposal({ ...proposal, status: targetStatus, updatedAt: today });
        return;
      }
      
      // 独立模式：自己处理保存
      const updatedProjects = projects.map(p => {
        if (p.id === targetProjectId) {
          return {
            ...p,
            updatedAt: today,
            proposals: p.proposals.map(prop => {
              if (prop.id === active.id) {
                return { ...prop, status: targetStatus, updatedAt: today };
              }
              return prop;
            }),
          };
        }
        return p;
      });

      try {
        await saveProposals({ version: 2, projects: updatedProjects });
        setProjects(updatedProjects);
        setFlatProposals(prev => prev.map(p =>
          p.id === active.id ? { ...p, status: targetStatus, updatedAt: today } : p
        ));
      } catch (err) {
        alert('保存失败: ' + err.message);
        loadProposals();
      }
    }
  };

  // 持久化折叠状态到 localStorage
  useEffect(() => {
    localStorage.setItem('swimlanes_collapsed', JSON.stringify([...collapsedLaneIds]));
  }, [collapsedLaneIds]);
  
  // M1: 持久化列折叠状态
  useEffect(() => {
    localStorage.setItem('kanban_column_collapsed', JSON.stringify(collapsedColumns));
  }, [collapsedColumns]);

  const handleToggleCollapse = (projectId) => {
    setCollapsedLaneIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // M1: Toggle column collapse
  const toggleColumnCollapse = (projectId, status) => {
    const key = `${projectId}:${status}`;
    setCollapsedColumns(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  // M1: Check if column is collapsed
  const isColumnCollapsed = (projectId, status) => {
    return !!collapsedColumns[`${projectId}:${status}`];
  };

  const handleCardClick = (proposal) => {
    setEditingProposal(proposal);
    setShowForm(true);
  };

  const handleEditProposal = async (updatedProposal) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (isEmbedded && onUpdateProposal) {
      // 嵌入式模式：通知外部处理保存
      await onUpdateProposal({ ...updatedProposal, updatedAt: today });
      setEditingProposal(null);
      setShowForm(false);
      return;
    }
    
    // 独立模式：自己处理保存
    const newProjects = projects.map(project => ({
      ...project,
      proposals: project.proposals.map(p =>
        p.id === updatedProposal.id ? { ...updatedProposal, updatedAt: today } : p
      ),
      updatedAt: project.proposals.some(p => p.id === updatedProposal.id) ? today : project.updatedAt,
    }));
    const newFlat = flatProposals.map(p =>
      p.id === updatedProposal.id ? { ...updatedProposal, updatedAt: today } : p
    );
    await saveProposals({ version: 2, projects: newProjects });
    setProjects(newProjects);
    setFlatProposals(newFlat);
    setEditingProposal(null);
    setShowForm(false);
  };

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">设置 GitHub Token</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            请输入 GitHub Personal Access Token 以访问和修改提案数据。
          </p>
          <input
            type="password"
            placeholder="输入 GitHub Token"
            className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            保存 Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbedded ? 'bg-gray-100 dark:bg-gray-900 transition-colors' : 'min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors'}>
      {/* Header - only show in standalone mode */}
      {!isEmbedded && (
        <header className="bg-white dark:bg-gray-800 shadow desktop-header">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {projectId ? '项目看板' : '看板泳道'}
              </h1>
              {!projectId && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {lanes.length} 个泳道
                </span>
              )}
          </div>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索泳道..."
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
            />
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
            <Link
              to="/"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              返回
            </Link>
          </div>
        </div>
        </header>
      )}

      {/* Column Headers - Desktop only */}
      {!projectId && (
        <div className="hidden md:block bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
              项目 / 状态
            </div>
            {STATUS_COLUMNS.map(col => (
              <div key={col.id} className="px-4 py-3 text-center">
                <span className={`${col.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                  {col.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Swimlane Content */}
      <div className="container mx-auto px-4 py-6">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {lanes.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  没有找到匹配的项目
                </div>
              ) : (
                lanes.map(lane => (
                  <SwimlaneRow
                    key={lane.project.id}
                    project={lane.project}
                    collapsedLaneIds={collapsedLaneIds}
                    onToggleCollapse={handleToggleCollapse}
                    onCardClick={handleCardClick}
                    overId={overId}
                    activeId={activeId}
                    isColumnCollapsed={isColumnCollapsed}
                    onToggleColumnCollapse={toggleColumnCollapse}
                  />
                ))
              )}
            </div>

            <DragOverlay>
              {activeProposal ? (
                <SwimlaneCard
                  proposal={activeProposal}
                  isDragging
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Mobile scroll hint */}
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 md:hidden">
          ← 左右滑动查看更多列 →
        </div>

        {showForm && (
          <ProposalForm
            proposal={editingProposal}
            onSave={handleEditProposal}
            onClose={() => {
              setShowForm(false);
              setEditingProposal(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default KanbanSwimlanes;
