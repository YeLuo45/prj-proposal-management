import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import ProposalCard from './components/ProposalCard';
import ProposalForm from './components/ProposalForm';
import { useGitHub } from './hooks/useGitHub';

const ITEMS_PER_PAGE = 12;
const RECENT_PROPOSALS_PER_PROJECT = 3;

function App() {
  const [projects, setProjects] = useState([]);
  const [flatProposals, setFlatProposals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('projects'); // 'projects' | 'card' | 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const { loading, error, fetchProposals, saveProposals } = useGitHub();

  // 初始化暗色模式
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
      setToken(savedToken);
      loadProposals();
    } else {
      setShowTokenInput(true);
    }
  }, []);

  const loadProposals = async () => {
    try {
      const data = await fetchProposals();
      // 支持 v1 扁平格式 {proposals: [...]} 和 v2 嵌套格式 {version: 2, projects: [{proposals: [...]}]}
      if (data.projects && Array.isArray(data.projects)) {
        // v2 嵌套格式：保留完整项目结构
        setProjects(data.projects);
        // 同时生成扁平提案列表供搜索过滤用
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
      console.error('Failed to load proposals:', err);
    }
  };

  const handleSaveToken = (newToken) => {
    localStorage.setItem('github_token', newToken);
    setToken(newToken);
    setShowTokenInput(false);
    loadProposals();
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const filteredProposals = useMemo(() => {
    return flatProposals.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (p.projectName && p.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = filterType === 'all' || p.type === filterType;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [flatProposals, searchQuery, filterType, filterStatus]);

  const filteredProjects = useMemo(() => {
    if (filterType === 'all' && filterStatus === 'all' && !searchQuery) {
      return projects;
    }
    // 当有过滤条件时，保留有匹配提案的项目
    const matchedIds = new Set(filteredProposals.map(p => p.projectId));
    return projects.filter(p => matchedIds.has(p.id));
  }, [projects, filteredProposals, searchQuery, filterType, filterStatus]);

  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProposals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProposals, currentPage]);

  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus]);

  const handleAddProposal = async (newProposal) => {
    const today = new Date().toISOString().split('T')[0];
    const existingToday = flatProposals.filter((p) => p.id.startsWith(`P-${today.replace(/-/g, '')}`));
    const seqNum = String(existingToday.length + 1).padStart(3, '0');
    const id = `P-${today.replace(/-/g, '')}-${seqNum}`;

    const proposal = {
      ...newProposal,
      id,
      createdAt: today,
      updatedAt: today,
    };

    // 新增提案添加到第一个项目（ai-subscription）或新建一个默认项目
    const newProjects = projects.length > 0 ? [...projects] : [];
    if (newProjects.length > 0) {
      newProjects[0].proposals.push(proposal);
      newProjects[0].updatedAt = today;
    }

    const newFlat = [...flatProposals, proposal];
    await saveProposals({ version: 2, projects: newProjects.length > 0 ? newProjects : [{ id: `PRJ-${today.replace(/-/g, '')}-999`, name: '未分类', proposals: [proposal] }] });
    setProjects(newProjects.length > 0 ? newProjects : [{ id: `PRJ-${today.replace(/-/g, '')}-999`, name: '未分类', proposals: [proposal] }]);
    setFlatProposals(newFlat);
    setShowForm(false);
  };

  const handleEditProposal = async (updatedProposal) => {
    const today = new Date().toISOString().split('T')[0];
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

  const handleDeleteProposal = async (id) => {
    if (!confirm('确定要删除这个提案吗？')) return;
    const newProjects = projects.map(project => ({
      ...project,
      proposals: project.proposals.filter(p => p.id !== id),
    })).filter(project => project.proposals.length > 0);
    const newFlat = flatProposals.filter(p => p.id !== id);
    await saveProposals({ version: 2, projects: newProjects });
    setProjects(newProjects);
    setFlatProposals(newFlat);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">设置 GitHub Token</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            请输入 GitHub Personal Access Token 以访问和修改提案数据。
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Header
        onAdd={() => {
          setEditingProposal(null);
          setShowForm(true);
        }}
        onSettings={() => setShowTokenInput(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterBar
            filterType={filterType}
            filterStatus={filterStatus}
            viewMode={viewMode}
            onTypeChange={setFilterType}
            onStatusChange={setFilterStatus}
            onViewModeChange={setViewMode}
          />
        </div>

        {loading && <div className="text-center py-8 text-gray-600 dark:text-gray-300">加载中...</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}

        {!loading && (
          <>
            {viewMode === 'projects' && (
              <>
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  共 {filteredProjects.length} 个项目，{filteredProposals.length} 个提案
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => {
                    const recentProposals = project.proposals
                      .filter(p => {
                        if (filterType !== 'all' && p.type !== filterType) return false;
                        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          return p.name.toLowerCase().includes(q) ||
                            (p.description && p.description.toLowerCase().includes(q)) ||
                            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
                        }
                        return true;
                      })
                      .slice(0, RECENT_PROPOSALS_PER_PROJECT);
                    const hasMore = project.proposals.length > RECENT_PROPOSALS_PER_PROJECT;

                    return (
                      <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{project.id}</span>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{project.name}</h3>
                          </div>
                          <span className="ml-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs whitespace-nowrap">
                            {project.proposals.length} 提案
                          </span>
                        </div>

                        {project.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-3">
                          {recentProposals.map((proposal) => (
                            <div key={proposal.id} className="flex items-center gap-2 text-sm">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                proposal.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                proposal.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {proposal.status}
                              </span>
                              <span className="text-gray-700 dark:text-gray-200 truncate flex-1">{proposal.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                proposal.type === 'web' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                proposal.type === 'app' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              }`}>
                                {proposal.type}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          {project.url && (
                            <button
                              onClick={() => window.open(project.url, '_blank')}
                              className="flex-1 bg-blue-500 text-white py-1.5 rounded hover:bg-blue-600 text-sm"
                            >
                              访问
                            </button>
                          )}
                          {project.gitRepo && (
                            <button
                              onClick={() => window.open(project.gitRepo, '_blank')}
                              className="flex-1 bg-gray-700 dark:bg-gray-600 text-white py-1.5 rounded hover:bg-gray-800 dark:hover:bg-gray-500 text-sm"
                            >
                              仓库
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingProposal(project.proposals[0]);
                              setShowForm(true);
                            }}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                          >
                            {hasMore ? `查看全部 (${project.proposals.length})` : '编辑'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    没有找到匹配的项目
                  </div>
                )}
              </>
            )}

            {viewMode === 'card' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onEdit={() => {
                        setEditingProposal(proposal);
                        setShowForm(true);
                      }}
                      onDelete={() => handleDeleteProposal(proposal.id)}
                      onCopyUrl={handleCopyUrl}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 dark:text-gray-200">
                      第 {currentPage} / {totalPages} 页
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      下一页
                    </button>
                  </div>
                )}

                {filteredProposals.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    没有找到匹配的提案
                  </div>
                )}
              </>
            )}

            {viewMode === 'table' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">项目</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedProposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{proposal.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{proposal.name}</td>
                        <td className="px-4 py-3 text-sm text-indigo-600 dark:text-indigo-400">{proposal.projectName || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            proposal.type === 'web' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            proposal.type === 'app' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {proposal.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            proposal.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            proposal.status === 'archived' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {proposal.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              setEditingProposal(proposal);
                              setShowForm(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 mr-3 dark:text-blue-400"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(proposal.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 dark:text-gray-200">
                      第 {currentPage} / {totalPages} 页
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <ProposalForm
          proposal={editingProposal}
          onSave={editingProposal ? handleEditProposal : handleAddProposal}
          onClose={() => {
            setShowForm(false);
            setEditingProposal(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
