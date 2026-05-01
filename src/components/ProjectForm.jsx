import { useState, useEffect } from 'react'

const emptyForm = { name: '', description: '', url: '', gitRepo: '', domain: '' }

const DOMAIN_OPTIONS = [
  '游戏', 'AI', '量化交易', '工具', 'Web应用', '移动应用', '数据分析',
  '效率工具', '娱乐', '教育', '社交', '电商', '物联网', '区块链', '其他'
]

export default function ProjectForm({ project, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        url: project.url || '',
        gitRepo: project.gitRepo || '',
        domain: project.domain || '',
      })
    }
  }, [project])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('名称不能为空')
    onSave(form)
  }

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{project ? '编辑项目' : '新增项目'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目名称 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="如: my-awesome-project" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputClass}
                rows={2} placeholder="项目简介..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">访问链接 (URL)</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className={inputClass}
                placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub 仓库链接</label>
              <input value={form.gitRepo} onChange={e => setForm(f => ({ ...f, gitRepo: e.target.value }))}
                className={inputClass}
                placeholder="https://github.com/YeLuo45/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">业务领域</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                className={inputClass}>
                <option value="">请选择领域（可选）</option>
                {DOMAIN_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
                保存
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
