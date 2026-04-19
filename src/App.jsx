import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import FilterBar from './components/FilterBar'
import ProjectCard from './components/ProjectCard'
import ProjectProposalList from './components/ProjectProposalList'
import ProjectForm from './components/ProjectForm'
import ProposalForm from './components/ProposalForm'
import { useGitHub } from './hooks/useGitHub'

const OWNER = 'YeLuo45'
const REPO = 'proposals-manager'
const FILE_PATH = 'data/proposals.json'

export default function App() {
  const { token, setToken, data, saveData, loading, error, clearError } = useGitHub({
    owner: OWNER,
    repo: REPO,
    path: FILE_PATH,
  })

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('card')
  const [page, setPage] = useState(1)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingProposal, setEditingProposal] = useState(null)
  const [editingProposalProjectId, setEditingProposalProjectId] = useState(null)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  const PAGE_SIZE = 12

  // Project-level data (flattened for filtering)
  const projects = data?.projects || []

  const filtered = projects.filter(prj => {
    const matchSearch =
      !search ||
      prj.name.toLowerCase().includes(search.toLowerCase()) ||
      prj.description?.toLowerCase().includes(search.toLowerCase()) ||
      prj.proposals?.some(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    const matchType = typeFilter === 'all' || prj.proposals?.some(p => p.type === typeFilter)
    const matchStatus = statusFilter === 'all' || prj.proposals?.some(p => p.status === statusFilter)
    return matchSearch && matchType && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, typeFilter, statusFilter])

  // Project CRUD
  const handleSaveProject = useCallback(async (projectData) => {
    let projects = data?.projects || []
    if (editingProject) {
      projects = projects.map(p => p.id === editingProject.id
        ? { ...p, ...projectData, updatedAt: new Date().toISOString().split('T')[0] }
        : p)
    } else {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const todayProjects = projects.filter(p => p.id.startsWith(`PRJ-${today}`))
      const seq = String(todayProjects.length + 1).padStart(3, '0')
      const newProject = {
        ...projectData,
        id: `PRJ-${today}-${seq}`,
        proposals: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      projects = [newProject, ...projects]
    }
    await saveData({ version: 2, projects })
    setShowProjectForm(false)
    setEditingProject(null)
  }, [data, editingProject, saveData])

  const handleDeleteProject = useCallback(async (id) => {
    if (!window.confirm('确定删除？删除项目会同时删除其下所有提案。')) return
    const projects = (data?.projects || []).filter(p => p.id !== id)
    await saveData({ version: 2, projects })
  }, [data, saveData])

  // Proposal CRUD
  const handleAddProposal = useCallback((project) => {
    setEditingProposal(null)
    setEditingProposalProjectId(project.id)
    setShowProposalForm(true)
  }, [])

  const handleEditProposal = useCallback((projectId, proposal) => {
    setEditingProposal(proposal)
    setEditingProposalProjectId(projectId)
    setShowProposalForm(true)
  }, [])

  const handleSaveProposal = useCallback(async (proposalData) => {
    let projects = data?.projects || []
    if (editingProposal) {
      // Update existing proposal
      projects = projects.map(prj => ({
        ...prj,
        proposals: prj.proposals.map(p =>
          p.id === editingProposal.id
            ? { ...p, ...proposalData, updatedAt: new Date().toISOString().split('T')[0] }
            : p
        )
      }))
    } else {
      // Create new proposal under the project
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const project = projects.find(p => p.id === editingProposalProjectId)
      const todayProposals = project?.proposals?.filter(p => p.id.startsWith(`P-${today}`)) || []
      const seq = String(todayProposals.length + 1).padStart(3, '0')
      const newProposal = {
        ...proposalData,
        id: `P-${today}-${seq}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      projects = projects.map(prj =>
        prj.id === editingProposalProjectId
          ? { ...prj, proposals: [...(prj.proposals || []), newProposal], updatedAt: new Date().toISOString().split('T')[0] }
          : prj
      )
    }
    await saveData({ version: 2, projects })
    setShowProposalForm(false)
    setEditingProposal(null)
    setEditingProposalProjectId(null)
  }, [data, editingProposal, editingProposalProjectId, saveData])

  const handleDeleteProposal = useCallback(async (projectId, proposalId) => {
    if (!window.confirm('确定删除此提案？')) return
    const projects = (data?.projects || []).map(prj =>
      prj.id === projectId
        ? { ...prj, proposals: prj.proposals.filter(p => p.id !== proposalId) }
        : prj
    )
    await saveData({ version: 2, projects })
  }, [data, saveData])

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text)
  }, [])

  const handleSelectProject = useCallback((projectId) => {
    setSelectedProjectId(projectId)
  }, [])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">项目管理系统</h1>
          <p className="text-gray-600 mb-4 text-sm">请输入 GitHub Personal Access Token 以访问数据</p>
          <input
            type="password"
            id="token-input"
            placeholder="***"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
          />
          <button
            className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            onClick={() => {
              const input = document.getElementById('token-input')
              if (input.value) setToken(input.value)
            }}
          >
            确定
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Token 需要 repo 权限。数据将保存在 {OWNER}/{REPO} 仓库中。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onConfig={() => setShowTokenInput(!showTokenInput)}
        showTokenInput={showTokenInput}
        onTokenSave={(t) => { setToken(t); setShowTokenInput(false) }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <SearchBar value={search} onChange={setSearch} />
          <FilterBar
            typeFilter={typeFilter} onTypeChange={setTypeFilter}
            statusFilter={statusFilter} onStatusChange={setStatusFilter}
            viewMode={viewMode} onViewChange={setViewMode}
          />
        </div>

        {loading && <p className="text-center py-8 text-gray-500">加载中...</p>}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <button className="float-right" onClick={clearError}>x</button>
            {error}
          </div>
        )}

        {selectedProjectId ? (
          <ProjectProposalList
            project={projects.find(p => p.id === selectedProjectId)}
            onBack={() => setSelectedProjectId(null)}
            onAddProposal={handleAddProposal}
            onEditProposal={handleEditProposal}
            onDeleteProposal={handleDeleteProposal}
            onCopy={handleCopy}
          />
        ) : viewMode === 'table' ? (
          <table className="w-full bg-white rounded shadow mb-6">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">ID</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">项目名称</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">描述</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">提案</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">操作</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">管理</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(prj => (
                <ProjectCard
                  key={prj.id}
                  project={prj}
                  viewMode="table"
                  onSelectProject={handleSelectProject}
                  onEditProject={(p) => { setEditingProject(p); setShowProjectForm(true) }}
                  onDeleteProject={handleDeleteProject}
                  onAddProposal={handleAddProposal}
                  onEditProposal={handleEditProposal}
                  onDeleteProposal={handleDeleteProposal}
                  onCopy={handleCopy}
                />
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">暂无项目</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginated.map(prj => (
              <ProjectCard
                key={prj.id}
                project={prj}
                viewMode="card"
                onSelectProject={handleSelectProject}
                onEditProject={(p) => { setEditingProject(p); setShowProjectForm(true) }}
                onDeleteProject={handleDeleteProject}
                onAddProposal={handleAddProposal}
                onEditProposal={handleEditProposal}
                onDeleteProposal={handleDeleteProposal}
                onCopy={handleCopy}
              />
            ))}
            {paginated.length === 0 && !loading && (
              <p className="col-span-full text-center text-gray-500 py-8">暂无项目</p>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
          </div>
        )}

        {!selectedProjectId && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 text-sm">共 {filtered.length} 个项目</p>
          <button
            onClick={() => { setEditingProject(null); setShowProjectForm(true) }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + 新增项目
          </button>
        </div>
        )}
      </div>

      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSave={handleSaveProject}
          onClose={() => { setShowProjectForm(false); setEditingProject(null) }}
        />
      )}

      {showProposalForm && (
        <ProposalForm
          proposal={editingProposal}
          projectId={editingProposalProjectId}
          onSave={handleSaveProposal}
          onClose={() => { setShowProposalForm(false); setEditingProposal(null); setEditingProposalProjectId(null) }}
        />
      )}
    </div>
  )
}
