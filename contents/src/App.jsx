import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import ProposalCard from './components/ProposalCard';
import ProposalForm from './components/ProposalForm';
import { useGitHub } from './hooks/useGitHub';

const ITEMS_PER_PAGE = 12;

function App() {
  const [proposals, setProposals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const { loading, error, fetchProposals, saveProposals } = useGitHub();

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
      let flatProposals = [];
      if (data.projects && Array.isArray(data.projects)) {
        // v2 嵌套格式：提取所有提案并标注项目名
        flatProposals = data.projects.flatMap(project =>
          (project.proposals || []).map(p => ({
            ...p,
            projectName: project.name,
            projectUrl: project.url,
            projectGitRepo: project.gitRepo,
          }))
        );
      } else if (data.proposals && Array.isArray(data.proposals)) {
        flatProposals = data.proposals;
      }
      setProposals(flatProposals);
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

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = filterType === 'all' || p.type === filterType;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [proposals, searchQuery, filterType, filterStatus]);

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
    const existingToday = proposals.filter((p) => p.id.startsWith(`P-${today.replace(/-/g, '')}`));
    const seqNum = String(existingToday.length + 1).padStart(3, '0');
    const id = `P-${today.replace(/-/g, '')}-${seqNum}`;

    const proposal = {
      ...newProposal,
      id,
      createdAt: today,
      updatedAt: today,
    };

    const newProposals = [...proposals, proposal];
    await saveProposals({ proposals: newProposals });
    setProposals(newProposals);
    setShowForm(false);
  };

  const handleEditProposal = async (updatedProposal) => {
    const today = new Date().toISOString().split('T')[0];
    const newProposals = proposals.map((p) =>
      p.id === updatedProposal.id ? { ...updatedProposal, updatedAt: today } : p
    );
    await saveProposals({ proposals: newProposals });
    setProposals(newProposals);
    setEditingProposal(null);
    setShowForm(false);
  };

  const handleDeleteProposal = async (id) => {
    if (!confirm('确定要删除这个提案吗？')) return;
    const newProposals = proposals.filter((p) => p.id !== id);
    await saveProposals({ proposals: newProposals });
    setProposals(newProposals);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

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
            {viewMode === 'card' ? (
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
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedProposals.map((proposal) => (
                      <tr key={proposal.id}>
                        <td className="px-4 py-3 text-sm">{proposal.id}</td>
                        <td className="px-4 py-3 text-sm">{proposal.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            proposal.type === 'web' ? 'bg-blue-100 text-blue-800' :
                            proposal.type === 'app' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {proposal.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            proposal.status === 'active' ? 'bg-green-100 text-green-800' :
                            proposal.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
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
                            className="text-blue-500 hover:text-blue-700 mr-3"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(proposal.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
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

            {filteredProposals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                没有找到匹配的提案
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
