import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import FilterBar from './components/FilterBar'
import ProjectCard from './components/ProjectCard'
import ProjectProposalList from './components/ProjectProposalList'
import ProjectForm from './components/ProjectForm'
import ProposalForm from './components/ProposalForm'
import KanbanBoard from './components/KanbanBoard'
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

  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

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

  // Advanced filter states
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedTags, setSelectedTags] = useState([])
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('savedFilters') || '[]')
    } catch { return [] }
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const PAGE_SIZE = 12

  // Project-level data (flattened for filtering)
  const projects = data?.projects || []

  // Collect all unique tags from all proposals
  const allTags = [...new Set(
    projects.flatMap(prj => prj.proposals?.flatMap(p => p.tags || []) || [])
  )].sort()

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
    const matchDate = (!dateRange.start || prj.proposals?.some(p => p.createdAt >= dateRange.start)) &&
                      (!dateRange.end || prj.proposals?.some(p => p.createdAt <= dateRange.end))
    const matchTags = selectedTags.length === 0 || prj.proposals?.some(p =>
      selectedTags.every(tag => p.tags?.includes(tag))
    )
    return matchSearch && matchType && matchStatus && matchDate && matchTags
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Flatten all proposals for kanban view
  const allProposals = filtered.flatMap(prj =>
    (prj.proposals || []).map(p => ({ ...p, projectName: prj.name, projectId: prj.id }))
  )

  useEffect(() => { setPage(1) }, [search, typeFilter, statusFilter, dateRange, selectedTags])

  // Save filter to localStorage
  const saveFilter = useCallback((name) => {
    const filter = { name, search, typeFilter, statusFilter, dateRange, selectedTags }
    const updated = [...savedFilters.filter(f => f.name !== name), filter]
    setSavedFilters(updated)
    localStorage.setItem('savedFilters', JSON.stringify(updated))
  }, [savedFilters, search, typeFilter, statusFilter, dateRange, selectedTags])

  const loadFilter = useCallback((filter) => {
    setSearch(filter.search || '')
    setTypeFilter(filter.typeFilter || 'all')
    setStatusFilter(filter.statusFilter || 'all')
    setDateRange(filter.dateRange || { start: '', end: '' })
    setSelectedTags(filter.selectedTags || [])
  }, [])

  const deleteFilter = useCallback((name) => {
    const updated = savedFilters.filter(f => f.name !== name)
    setSavedFilters(updated)
    localStorage.setItem('savedFilters', JSON.stringify(updated))
  }, [savedFilters])

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

  // Handle kanban status change (drag & drop)
  const handleStatusChange = useCallback(async (proposalId, projectId, newStatus) => {
    const projects = (data?.projects || []).map(prj =>
      prj.id === projectId
        ? {
            ...prj,
            proposals: prj.proposals.map(p =>
              p.id === proposalId
                ? { ...p, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
                : p
            )
          }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">项目管理系统</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">请输入 GitHub Personal Access Token 以访问数据</p>
          <input
            type="password"
            id="token-input"
            placeholder="***"
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mb-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Header
        onConfig={() => setShowTokenInput(!showTokenInput)}
        showTokenInput={showTokenInput}
        onTokenSave={(t) => { setToken(t); setShowTokenInput(false) }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <SearchBar value={search} onChange={setSearch} />
          <FilterBar
            typeFilter={typeFilter} onTypeChange={setTypeFilter}
            statusFilter={statusFilter} onStatusChange={setStatusFilter}
            viewMode={viewMode} onViewChange={setViewMode}
            dateRange={dateRange} onDateRangeChange={setDateRange}
            selectedTags={selectedTags} onTagsChange={setSelectedTags}
            allTags={allTags}
            savedFilters={savedFilters}
            onSaveFilter={saveFilter}
            onLoadFilter={loadFilter}
            onDeleteFilter={deleteFilter}
            showAdvanced={showAdvanced} onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />
        </div>

        {loading && <p className="text-center py-8 text-gray-500 dark:text-gray-400">加载中...</p>}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
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
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            proposals={allProposals}
            onStatusChange={handleStatusChange}
            onEditProposal={handleEditProposal}
            onDeleteProposal={handleDeleteProposal}
            onCopy={handleCopy}
          />
        ) : viewMode === 'table' ? (
          <table className="w-full bg-white dark:bg-gray-800 rounded shadow mb-6">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">ID</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">项目名称</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">描述</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">提案</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">操作</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">管理</th>
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
                <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">暂无项目</td></tr>
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
              <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">暂无项目</p>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">上一页</button>
            <span className="px-3 py-1 text-gray-700 dark:text-gray-300">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">下一页</button>
          </div>
        )}

        {!selectedProjectId && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">共 {filtered.length} 个项目</p>
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
