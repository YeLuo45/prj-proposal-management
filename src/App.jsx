import { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import ProposalCard from './components/ProposalCard';
import ProposalForm from './components/ProposalForm';
import ProjectCard from './components/ProjectCard';
import ProjectForm from './components/ProjectForm';
import { useGitHub } from './hooks/useGitHub';
import ProjectDetailPage from './pages/ProjectDetailPage';

const ITEMS_PER_PAGE = 12;

function HomePage() {
  const [data, setData] = useState({ projects: [], proposals: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');

  const navigate = useNavigate();
  const { fetchData, saveData, loading, error } = useGitHub();

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      loadData();
    } else {
      setShowTokenInput(true);
    }
  }, []);

  const loadData = async () => {
    try {
      const loadedData = await fetchData();
      setData(loadedData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSaveToken = (newToken) => {
    localStorage.setItem('github_token', newToken);
    setToken(newToken);
    setShowTokenInput(false);
    loadData();
  };

  const handleSelectProject = (projectId) => {
    navigate(`/project/${encodeURIComponent(projectId)}`);
  };

  const handleAddProject = async (newProject) => {
    const today = new Date().toISOString().split('T')[0];
    const existingToday = data.projects.filter(p => p.id.startsWith(`PRJ-${today.replace(/-/g, '')}`));
    const seqNum = String(existingToday.length + 1).padStart(3, '0');
    const id = `PRJ-${today.replace(/-/g, '')}-${seqNum}`;

    const project = {
      ...newProject,
      id,
      createdAt: today,
      updatedAt: today,
      milestones: []
    };

    const newData = {
      ...data,
      projects: [...data.projects, project]
    };
    await saveData(newData);
    setData(newData);
    setShowProjectForm(false);
  };

  const handleEditProject = async (updatedProject) => {
    const today = new Date().toISOString().split('T')[0];
    const newData = {
      ...data,
      projects: data.projects.map(p =>
        p.id === updatedProject.id ? { ...updatedProject, updatedAt: today } : p
      )
    };
    await saveData(newData);
    setData(newData);
    setEditingProject(null);
    setShowProjectForm(false);
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('确定要删除这个项目吗？')) return;
    const newData = {
      ...data,
      projects: data.projects.filter(p => p.id !== id)
    };
    await saveData(newData);
    setData(newData);
  };

  const handleAddProposal = async (newProposal) => {
    const today = new Date().toISOString().split('T')[0];
    const existingToday = data.proposals.filter(p => p.id.startsWith(`P-${today.replace(/-/g, '')}`));
    const seqNum = String(existingToday.length + 1).padStart(3, '0');
    const id = `P-${today.replace(/-/g, '')}-${seqNum}`;

    const proposal = {
      ...newProposal,
      id,
      createdAt: today,
      updatedAt: today,
    };

    const newData = {
      ...data,
      proposals: [...data.proposals, proposal]
    };
    await saveData(newData);
    setData(newData);
    setShowForm(false);
  };

  const handleEditProposal = async (updatedProposal) => {
    const today = new Date().toISOString().split('T')[0];
    const newData = {
      ...data,
      proposals: data.proposals.map(p =>
        p.id === updatedProposal.id ? { ...updatedProposal, updatedAt: today } : p
      )
    };
    await saveData(newData);
    setData(newData);
    setEditingProposal(null);
    setShowForm(false);
  };

  const handleDeleteProposal = async (id) => {
    if (!confirm('确定要删除这个提案吗？')) return;
    const newData = {
      ...data,
      proposals: data.proposals.filter(p => p.id !== id)
    };
    await saveData(newData);
    setData(newData);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

  // 过滤项目
  const filteredProjects = useMemo(() => {
    return data.projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [data.projects, searchQuery]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4">设置 GitHub Token</h1>
          <p className="text-gray-600 mb-4">
            请输入 GitHub Personal Access Token 以访问和修改提案数据。
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="输入 GitHub Token"
            className="w-full px-4 py-2 border rounded-lg mb-4"
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
    <div className="min-h-screen bg-gray-100">
      <Header
        onAdd={() => {
          setEditingProposal(null);
          setShowForm(true);
        }}
        onSettings={() => setShowTokenInput(true)}
        onAddProject={() => {
          setEditingProject(null);
          setShowProjectForm(true);
        }}
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

        {loading && <div className="text-center py-8">加载中...</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}

        {!loading && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">项目列表</h2>
              <button
                onClick={() => setShowProjectForm(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                + 新建项目
              </button>
            </div>

            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode={viewMode}
                    onSelectProject={handleSelectProject}
                    onEditProject={(p) => {
                      setEditingProject(p);
                      setShowProjectForm(true);
                    }}
                    onDeleteProject={handleDeleteProject}
                    onAddProposal={(p) => {
                      setEditingProject(p);
                      setShowForm(true);
                    }}
                    onEditProposal={(p) => {
                      setEditingProposal(p);
                      setShowForm(true);
                    }}
                    onDeleteProposal={handleDeleteProposal}
                    onCopy={handleCopyUrl}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">提案数</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        viewMode={viewMode}
                        onSelectProject={handleSelectProject}
                        onEditProject={(p) => {
                          setEditingProject(p);
                          setShowProjectForm(true);
                        }}
                        onDeleteProject={handleDeleteProject}
                        onAddProposal={() => {}}
                        onEditProposal={() => {}}
                        onDeleteProposal={() => {}}
                        onCopy={handleCopyUrl}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-4 py-2">
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}

            {filteredProjects.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                没有找到匹配的项目
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <ProposalForm
          proposal={editingProposal}
          projectId={editingProject?.id}
          projects={data.projects}
          onSave={editingProposal ? handleEditProposal : handleAddProposal}
          onClose={() => {
            setShowForm(false);
            setEditingProposal(null);
            setEditingProject(null);
          }}
        />
      )}

      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSave={editingProject ? handleEditProject : handleAddProject}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:id" element={<ProjectDetailPageWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProjectDetailPageWrapper() {
  const { id } = useParams();
  const decodedId = decodeURIComponent(id);
  return <ProjectDetailPage projectId={decodedId} />;
}

export default App;
