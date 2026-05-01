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

export default function KanbanBoard({ proposals, onStatusChange, onEditProposal, onDeleteProposal, onCopy, onCopyProposal, onQuickAddProposal }) {
  const [draggedProposal, setDraggedProposal] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [collapsedColumns, setCollapsedColumns] = useState({})
  const [hoveredCard, setHoveredCard] = useState(null)
  const [addingToStatus, setAddingToStatus] = useState(null)

  const toggleCollapse = useCallback((status) => {
    setCollapsedColumns(prev => ({ ...prev, [status]: !prev[status] }))
  }, [])

  const onDragStart = useCallback((e, proposal) => {
    setDraggedProposal(proposal)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: proposal.id, projectId: proposal.projectId }))
  }, [])

  const onDragOver = useCallback((e, status, index) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
    setDragOverIndex(index)
  }, [])

  const onDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null)
      setDragOverIndex(null)
    }
  }, [])

  const onDrop = useCallback((e, newStatus, index) => {
    e.preventDefault()
    setDragOverColumn(null)
    setDragOverIndex(null)
    if (draggedProposal && draggedProposal.status !== newStatus) {
      onStatusChange(draggedProposal.id, draggedProposal.projectId, newStatus)
    }
    setDraggedProposal(null)
  }, [draggedProposal, onStatusChange])

  const onDragEnd = useCallback(() => {
    setDraggedProposal(null)
    setDragOverColumn(null)
    setDragOverIndex(null)
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

  const handleQuickAdd = useCallback((status) => {
    setAddingToStatus(status)
    // Trigger the quick add through callback with the status
    onQuickAddProposal(status)
  }, [onQuickAddProposal])

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {ALL_STATUSES.map(status => {
          const config = STATUS_CONFIG[status]
          const cards = grouped[status]
          const isOver = dragOverColumn === status
          const isCollapsed = collapsedColumns[status]

          return (
            <div
              key={status}
              className={`w-72 flex flex-col rounded-lg border-2 transition-colors ${
                isOver ? config.border : 'border-transparent'
              } ${isCollapsed ? 'w-12' : ''}`}
            >
              {/* Column header */}
              <div
                className={`${config.headerBg} rounded-t-lg px-3 py-2 flex items-center justify-between cursor-pointer hover:opacity-90`}
                onClick={() => toggleCollapse(status)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{isCollapsed ? '▶' : '▼'}</span>
                  <span className="font-medium text-white text-sm">{config.label}</span>
                </div>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{cards.length}</span>
              </div>

              {/* Quick add button */}
              {!isCollapsed && (
                <button
                  onClick={() => handleQuickAdd(status)}
                  className={`${config.headerBg} bg-opacity-90 hover:bg-opacity-100 text-white text-xs py-1 px-2 transition-colors`}
                >
                  + 快速添加
                </button>
              )}

              {/* Cards container */}
              {!isCollapsed && (
                <div
                  className={`flex-1 ${config.color} rounded-b-lg p-2 min-h-[200px] space-y-2`}
                  onDragLeave={onDragLeave}
                >
                  {cards.length === 0 ? (
                    <div className={`text-center py-8 text-sm ${config.text} opacity-60`}>
                      拖拽提案到这里
                    </div>
                  ) : (
                    cards.map((p, index) => (
                      <div key={p.id}>
                        {/* Drop indicator line */}
                        {isOver && dragOverIndex === index && draggedProposal?.id !== p.id && (
                          <div className={`h-1 ${config.headerBg} rounded mb-2 animate-pulse`} />
                        )}
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, p)}
                          onDragEnd={onDragEnd}
                          onDragOver={(e) => onDragOver(e, status, index + 1)}
                          onDragEnter={(e) => e.preventDefault()}
                          onClick={() => onEditProposal(p.projectId, p)}
                          onMouseEnter={() => setHoveredCard(p.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={`bg-white dark:bg-gray-800 rounded shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 ${
                            draggedProposal?.id === p.id ? 'opacity-50 scale-95' : ''
                          } ${hoveredCard === p.id ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{p.id}</span>
                            <span className="text-sm">{p.type === 'web' ? '🌐' : p.type === 'app' ? '📱' : '📦'}</span>
                          </div>
                          <h4 className="font-medium text-sm mb-1 text-gray-800 dark:text-gray-200 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                            {p.url ? (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={e => e.stopPropagation()}>{p.name}</a>
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

                          {/* Action buttons */}
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEditProposal(p.projectId, p) }}
                              className="flex-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              编辑
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onCopyProposal(p.projectId, p) }}
                              className="flex-1 text-xs text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 rounded px-2 py-1 hover:bg-green-50 dark:hover:bg-green-900/30"
                            >
                              复制
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteProposal(p.projectId, p.id) }}
                              className="flex-1 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              删除
                            </button>
                          </div>
                          {p.url && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onCopy(p.url) }}
                              className="w-full mt-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded px-2 py-1"
                            >
                              📋 复制链接
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {/* Drop indicator at end of list */}
                  {isOver && dragOverIndex === cards.length && (
                    <div className={`h-1 ${config.headerBg} rounded animate-pulse`} />
                  )}
                </div>
              )}
              {/* Collapsed state */}
              {isCollapsed && (
                <div className={`${config.color} rounded-b-lg p-2 min-h-[60px] flex items-center justify-center`}>
                  <span className={`text-xs ${config.text} writing-mode-vertical`}>
                    {cards.length} 个
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  )
}
