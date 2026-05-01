import { useState, useCallback } from 'react'

const STATUS_CONFIG = {
  intake: { label: '待 intake', color: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-300', headerBg: 'bg-gray-500', text: 'text-gray-700 dark:text-gray-300' },
  clarifying: { label: '澄清中', color: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-300', headerBg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' },
  prd_pending_confirmation: { label: 'PRD 待确认', color: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-300', headerBg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  approved_for_dev: { label: '已批准开发', color: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-300', headerBg: 'bg-green-500', text: 'text-green-700 dark:text-green-300' },
  in_dev: { label: '开发中', color: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-300', headerBg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  in_acceptance: { label: '验收中', color: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-300', headerBg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  accepted: { label: '已验收', color: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-300', headerBg: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300' },
  archived: { label: '已归档', color: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-300', headerBg: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-300' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

export default function KanbanBoard({ proposals, onStatusChange, onEditProposal, onDeleteProposal, onCopy }) {
  const [draggedProposal, setDraggedProposal] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  const onDragStart = useCallback((e, proposal) => {
    setDraggedProposal(proposal)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: proposal.id, projectId: proposal.projectId }))
  }, [])

  const onDragOver = useCallback((e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }, [])

  const onDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const onDrop = useCallback((e, newStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    if (draggedProposal && draggedProposal.status !== newStatus) {
      onStatusChange(draggedProposal.id, draggedProposal.projectId, newStatus)
    }
    setDraggedProposal(null)
  }, [draggedProposal, onStatusChange])

  const onDragEnd = useCallback(() => {
    setDraggedProposal(null)
    setDragOverColumn(null)
  }, [])

  // Group proposals by status
  const grouped = {}
  ALL_STATUSES.forEach(status => { grouped[status] = [] })
  proposals.forEach(p => {
    if (grouped[p.status]) {
      grouped[p.status].push(p)
    } else {
      grouped['archived'].push(p)
    }
  })

  // Filter out empty columns at the start and end, but always show at least the columns that have proposals
  const visibleStatuses = ALL_STATUSES.filter(status =>
    proposals.some(p => p.status === status) || grouped[status].length > 0
  )

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {visibleStatuses.map(status => {
          const config = STATUS_CONFIG[status]
          const cards = grouped[status]
          const isOver = dragOverColumn === status

          return (
            <div
              key={status}
              className={`w-72 flex flex-col rounded-lg border-2 ${isOver ? config.border : 'border-transparent'} transition-colors`}
              onDragOver={(e) => onDragOver(e, status)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, status)}
            >
              {/* Column header */}
              <div className={`${config.headerBg} rounded-t-lg px-3 py-2 flex items-center justify-between`}>
                <span className="font-medium text-white text-sm">{config.label}</span>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{cards.length}</span>
              </div>

              {/* Cards container */}
              <div className={`flex-1 ${config.color} rounded-b-lg p-2 min-h-[200px] space-y-2`}>
                {cards.length === 0 ? (
                  <div className={`text-center py-8 text-sm ${config.text} opacity-60`}>
                    拖拽提案到这里
                  </div>
                ) : (
                  cards.map(p => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, p)}
                      onDragEnd={onDragEnd}
                      className={`bg-white dark:bg-gray-800 rounded shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 ${draggedProposal?.id === p.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{p.id}</span>
                        <span className="text-sm">{p.type === 'web' ? '🌐' : p.type === 'app' ? '📱' : '📦'}</span>
                      </div>
                      <h4 className="font-medium text-sm mb-1 text-gray-800 dark:text-gray-200 truncate">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{p.name}</a>
                        ) : p.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                        {p.tags?.length > 3 && (
                          <span className="text-xs text-gray-400">+{p.tags.length - 3}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2">项目: {p.projectName}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditProposal(p.projectId, p)}
                          className="flex-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => onDeleteProposal(p.projectId, p.id)}
                          className="flex-1 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          删除
                        </button>
                      </div>
                      {p.url && (
                        <button
                          onClick={() => onCopy(p.url)}
                          className="w-full mt-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded px-2 py-1"
                        >
                          📋 复制链接
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
