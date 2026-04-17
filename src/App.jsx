import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import FilterBar from './components/FilterBar'
import ProposalCard from './components/ProposalCard'
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
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showTokenInput, setShowTokenInput] = useState(false)

  const PAGE_SIZE = 12

  const filtered = data?.proposals?.filter(p => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchType = typeFilter === 'all' || p.type === typeFilter
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchType && matchStatus
  }) || []

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, typeFilter, statusFilter])

  const handleSave = useCallback(async (proposal) => {
    let proposals = data?.proposals || []
    if (editing) {
      proposals = proposals.map(p => p.id === editing.id ? { ...proposal, id: editing.id, updatedAt: new Date().toISOString().split('T')[0] } : p)
    } else {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const todayProposals = proposals.filter(p => p.id.startsWith(`P-${today}`))
      const seq = String(todayProposals.length + 1).padStart(3, '0')
      const newProposal = { ...proposal, id: `P-${today}-${seq}`, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }
      proposals = [newProposal, ...proposals]
    }
    await saveData({ proposals })
    setShowForm(false)
    setEditing(null)
  }, [data, editing, saveData])

  const handleEdit = useCallback((proposal) => {
    setEditing(proposal)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('确定删除？')) return
    const proposals = (data?.proposals || []).filter(p => p.id !== id)
    await saveData({ proposals })
  }, [data, saveData])

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text)
  }, [])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">提案管理系统</h1>
          <p className="text-gray-600 mb-4 text-sm">请输入 GitHub Personal Access Token 以访问数据</p>
          <input
            type="password"
            id="token-input"
            placeholder="ghp_xxxxxxxxxxxx"
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

        {viewMode === 'table' ? (
          <table className="w-full bg-white rounded shadow mb-6">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">ID</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">名称</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">描述</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">类型</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">状态</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  viewMode="table"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                />
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">暂无提案</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginated.map(p => (
              <ProposalCard
                key={p.id}
                proposal={p}
                viewMode="card"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
              />
            ))}
            {paginated.length === 0 && !loading && (
              <p className="col-span-full text-center text-gray-500 py-8">暂无提案</p>
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

        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 text-sm">共 {filtered.length} 条提案</p>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + 新增提案
          </button>
        </div>
      </div>

      {showForm && (
        <ProposalForm
          proposal={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
