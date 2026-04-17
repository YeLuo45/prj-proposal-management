import { useState, useEffect } from 'react'

const emptyForm = { name: '', description: '', type: 'web', status: 'active', url: '', packageUrl: '', tags: '' }

export default function ProposalForm({ proposal, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (proposal) {
      setForm({
        name: proposal.name || '',
        description: proposal.description || '',
        type: proposal.type || 'web',
        status: proposal.status || 'active',
        url: proposal.url || '',
        packageUrl: proposal.packageUrl || '',
        tags: (proposal.tags || []).join(', '),
      })
    }
  }, [proposal])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('名称不能为空')
    onSave({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">{proposal ? '编辑提案' : '新增提案'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如: game-1024" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2} placeholder="项目简介..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="web">🌐 Web</option>
                  <option value="app">📱 App</option>
                  <option value="package">📦 Package</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">✅ Active</option>
                  <option value="in_dev">🔧 开发中</option>
                  <option value="archived">📁 已归档</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">访问链接 (URL)</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">包下载链接</label>
              <input value={form.packageUrl} onChange={e => setForm(f => ({ ...f, packageUrl: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/.../releases/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标签 (逗号分隔)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="react, pwa, 游戏" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
                保存
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
