import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TemplateCard from './TemplateCard';
import TemplateRating from './TemplateRating';
import {
  getAllTemplates,
  getBuiltinTemplates,
  getCustomTemplates,
  searchTemplates,
  deleteCustomTemplate,
  getFavorites,
  downloadTemplate,
  exportAllTemplates,
  importTemplatesBulk,
  parseTemplateFile,
  getMarketplaceStats,
  recordTemplateUsage,
} from '../services/templateMarketplaceService';
import { TEMPLATE_CATEGORIES, getPopularTemplates, getTopRatedTemplates, getCategoryDisplayName } from '../data/builtinTemplates';

/**
 * V30: Template Marketplace Component
 * Full-page template marketplace with search, categories, ratings, and import/export
 */
function TemplateMarketplace({ onApplyTemplate, onClose }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'rating', 'recent', 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState([]);

  // Load initial data
  useEffect(() => {
    setFavorites(getFavorites());
    setStats(getMarketplaceStats());
  }, []);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = getAllTemplates();

    // Filter by favorites if enabled
    if (showFavorites) {
      templates = templates.filter(t => favorites.includes(t.id));
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        templates = [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'rating':
        templates = [...templates].sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
        templates = [...templates].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
      case 'name':
        templates = [...templates].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return templates;
  }, [searchQuery, selectedCategory, sortBy, showFavorites, favorites]);

  // Quick access lists
  const popularTemplates = useMemo(() => getPopularTemplates(5), []);
  const topRatedTemplates = useMemo(() => getTopRatedTemplates(5), []);

  const categories = Object.values(TEMPLATE_CATEGORIES);

  const handleApplyTemplate = async (template) => {
    await recordTemplateUsage(template.id);
    if (onApplyTemplate) {
      onApplyTemplate(template);
    }
  };

  const handleDeleteTemplate = (id) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    const result = deleteCustomTemplate(id);
    if (result.success) {
      setStats(getMarketplaceStats());
      setFavorites(getFavorites());
    }
  };

  const handleExportAll = () => {
    const result = exportAllTemplates();
    if (result.success) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `templates-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseTemplateFile(file);
      const result = importTemplatesBulk(data);
      
      if (result.imported.length > 0) {
        alert(`成功导入 ${result.imported.length} 个模板`);
        setStats(getMarketplaceStats());
        setFavorites(getFavorites());
      }
      
      if (result.skipped.length > 0) {
        console.warn('Skipped:', result.skipped);
      }
      
      if (result.errors.length > 0) {
        setImportError(`错误: ${result.errors.map(e => e.error).join(', ')}`);
      }
      
      setShowImportModal(false);
    } catch (err) {
      setImportError(err.message);
    }
  };

  const handleExportSelected = () => {
    if (selectedForExport.length === 0) {
      alert('请先选择要导出的模板');
      return;
    }
    
    selectedForExport.forEach(id => {
      const template = getAllTemplates().find(t => t.id === id);
      if (template) {
        downloadTemplate(id, `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`);
      }
    });
    setShowExportModal(false);
    setSelectedForExport([]);
  };

  const toggleExportSelection = (id) => {
    setSelectedForExport(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const categoryNames = {
    all: '全部',
    agile: '敏捷开发',
    project: '项目管理',
    product: '产品管理',
    bug: 'Bug追踪',
    research: '技术研究',
    marketing: '市场营销',
    infrastructure: '运维管理',
    documentation: '文档编写',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                📦 模板市场
              </h1>
              {stats && (
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{stats.totalTemplates} 模板</span>
                  <span>•</span>
                  <span>{stats.builtinCount} 预设</span>
                  <span>•</span>
                  <span>{stats.customCount} 自定义</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
              >
                导出模板
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm"
              >
                导入模板
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板名称、描述或标签..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                  selectedCategory === 'all' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {categoryNames[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* Second row: Sort, View mode, Favorites toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm"
              >
                <option value="popular">最受欢迎</option>
                <option value="rating">评分最高</option>
                <option value="recent">最新添加</option>
                <option value="name">名称 A-Z</option>
              </select>

              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                  showFavorites 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill={showFavorites ? 'currentColor' : 'none'} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                我的收藏 ({favorites.length})
              </button>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Access Section */}
        {!showFavorites && !searchQuery && selectedCategory === 'all' && (
          <div className="mb-8">
            {/* Popular Templates */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="text-xl">🔥</span> 热门模板
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {popularTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    compact
                    onApply={handleApplyTemplate}
                    onPreview={(t) => setShowPreviewModal(t)}
                  />
                ))}
              </div>
            </div>

            {/* Top Rated Templates */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="text-xl">⭐</span> 评分最高
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topRatedTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    compact
                    onApply={handleApplyTemplate}
                    onPreview={(t) => setShowPreviewModal(t)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {showFavorites ? '收藏的模板' : '全部模板'}: {filteredTemplates.length} 个
          {searchQuery && ` (搜索: "${searchQuery}")`}
          {selectedCategory !== 'all' && ` (分类: ${categoryNames[selectedCategory]})`}
        </div>

        {/* Template Grid/List */}
        {filteredTemplates.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={handleApplyTemplate}
                onPreview={(t) => setShowPreviewModal(t)}
                onEdit={null}
                onDelete={(id) => handleDeleteTemplate(id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
              {showFavorites ? '暂无收藏的模板' : '没有找到模板'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {showFavorites 
                ? '去模板市场收藏一些模板吧！' 
                : '尝试调整搜索条件或分类筛选'
              }
            </p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              导入模板
            </h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                  id="template-import-input"
                />
                <label
                  htmlFor="template-import-input"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">点击选择 JSON 文件</span>
                  <span className="text-xs text-gray-400 mt-1">支持单个或批量模板文件</span>
                </label>
              </div>

              {importError && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {importError}
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>支持以下格式:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>单个模板导出文件</li>
                  <li>批量模板导出文件</li>
                  <li>完整备份文件（含收藏夹、评分等）</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowImportModal(false); setImportError(''); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              导出模板
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={handleExportAll}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <div className="font-medium text-gray-800 dark:text-gray-100">导出全部数据</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">包含所有自定义模板、收藏夹和评分</div>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="font-medium text-gray-800 dark:text-gray-100 mb-2">选择模板导出:</div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {getAllTemplates().map(template => (
                    <label
                      key={template.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedForExport.includes(template.id)}
                        onChange={() => toggleExportSelection(template.id)}
                        className="w-4 h-4 text-indigo-500 rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{template.name}</span>
                      {template.isBuiltin && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">预设</span>
                      )}
                    </label>
                  ))}
                </div>
                {selectedForExport.length > 0 && (
                  <button
                    onClick={handleExportSelected}
                    className="mt-3 w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600"
                  >
                    导出所选 ({selectedForExport.length})
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowExportModal(false); setSelectedForExport([]); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPreviewModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Category color bar */}
            <div className={`h-2 rounded-t-xl mb-4 ${
              showPreviewModal.category === 'agile' ? 'bg-blue-500' :
              showPreviewModal.category === 'bug' ? 'bg-red-500' :
              showPreviewModal.category === 'product' ? 'bg-pink-500' :
              showPreviewModal.category === 'project' ? 'bg-purple-500' :
              showPreviewModal.category === 'marketing' ? 'bg-orange-500' :
              showPreviewModal.category === 'infrastructure' ? 'bg-gray-500' :
              showPreviewModal.category === 'documentation' ? 'bg-green-500' :
              'bg-indigo-500'
            }`} />

            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {showPreviewModal.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {showPreviewModal.description}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-indigo-500">{showPreviewModal.rating?.toFixed(1) || '0.0'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">评分</div>
                <TemplateRating value={showPreviewModal.rating || 0} size="sm" className="justify-center mt-1" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-500">{showPreviewModal.usageCount?.toLocaleString() || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">使用次数</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-500">{showPreviewModal.columns?.length || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">列数</div>
              </div>
            </div>

            {/* Columns Preview */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">列配置</h3>
              <div className="flex gap-2 flex-wrap">
                {(showPreviewModal.columns || []).map((col, idx) => (
                  <div
                    key={col.id || idx}
                    className={`px-3 py-1.5 rounded-lg text-white ${col.color || 'bg-gray-500'}`}
                  >
                    {col.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal Fields */}
            {showPreviewModal.proposalTemplate?.fields?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">提案字段</h3>
                <div className="flex gap-2 flex-wrap">
                  {(showPreviewModal.proposalTemplate.fields || []).map((field, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                    >
                      {field}
                      {showPreviewModal.proposalTemplate.required?.includes(field) && (
                        <span className="text-red-500 ml-0.5">*</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {showPreviewModal.tags?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">标签</h3>
                <div className="flex gap-2 flex-wrap">
                  {showPreviewModal.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  handleApplyTemplate(showPreviewModal);
                  setShowPreviewModal(null);
                }}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                应用此模板
              </button>
              <button
                onClick={() => setShowPreviewModal(null)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateMarketplace;
