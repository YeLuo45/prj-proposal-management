import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import AdvancedFilter from './components/AdvancedFilter';
import ProposalCard from './components/ProposalCard';
import ProposalForm from './components/ProposalForm';
import BatchActionBar from './components/BatchActionBar';
import MilestoneSelectModal from './components/MilestoneSelectModal';
import KanbanSwimlanes from './pages/KanbanSwimlanes';
import ImportExportPanel from './components/ImportExportPanel';
import CsvPreviewTable from './components/CsvPreviewTable';
import { useGitHub } from './hooks/useGitHub';
import { useOperationHistory } from './hooks/useOperationHistory';
import { useValidation } from './hooks/useDataValidator';
import ValidationAlert from './components/ValidationAlert';
import UndoToast from './components/UndoToast';
import OperationHistoryDrawer from './components/OperationHistoryDrawer';
import { validateProjects } from './utils/dataValidator';
import { exportProjectsToCSV, downloadFile } from './utils/csvExporter';
import { parseCSV, validateCSVImport, executeCSVImport } from './utils/csvImporter';
import { generateBackup, restoreFromBackup, downloadJSONBackup } from './utils/jsonBackup';

const ITEMS_PER_PAGE = 12;
const RECENT_PROPOSALS_PER_PROJECT = 3;

function App() {
  const [projects, setProjects] = useState([]);
  const [flatProposals, setFlatProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('projects');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastOperationDesc, setLastOperationDesc] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // M3: 专注模式状态
  const [focusMode, setFocusMode] = useState({ projectId: null, status: null });

  // 导入/导出状态
  const [importMode, setImportMode] = useState('skip');
  const [parsedCSV, setParsedCSV] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { loading, error, fetchProposals, saveProposals } = useGitHub();
  const { history, pushRecord, updateRecord, undoLast, canUndo, refreshHistory } = useOperationHistory();
  const { errors: validatorErrors, warnings: validatorWarnings } = useValidation(projects, milestones);

  // 高级筛选状态
  const [advancedFilters, setAdvancedFilters] = useState({
    statuses: [],
    types: [],
    tags: [],
    projectId: '',
    dateFrom: '',
    dateTo: '',
  });

  // 从 URL 同步筛选状态
  useEffect(() => {
    const statuses = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const types = searchParams.get('type')?.split(',').filter(Boolean) || [];
    const tags = searchParams.get('tag')?.split(',').filter(Boolean) || [];
    const projectId = searchParams.get('project') || '';
    const dateFrom = searchParams.get('from') || '';
    const dateTo = searchParams.get('to') || '';
    setAdvancedFilters({ statuses, types, tags, projectId, dateFrom, dateTo });
  }, [searchParams]);

  // 初始化暗色模式
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      loadProposals();
    } else {
      setShowTokenInput(true);
    }
  }, []);

  // Run validation after projects/milestones load
  useEffect(() => {
    if (projects.length > 0) {
      const result = validateProjects(projects, milestones);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
    }
  }, [projects, milestones]);

  // Ctrl+Z undo handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && canUndo) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo]);

  // Undo toast timer
  useEffect(() => {
    if (showUndoToast) {
      const timer = setTimeout(() => setShowUndoToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showUndoToast]);

  const loadProposals = async () => {
    try {
      const data = await fetchProposals();
      if (data.projects && Array.isArray(data.projects)) {
        setProjects(data.projects);
        const flat = data.projects.flatMap(project =>
          (project.proposals || []).map(p => ({
            ...p,
            projectName: project.name,
            projectUrl: project.url,
            projectGitRepo: project.gitRepo,
            projectId: project.id,
          }))
        );
        setFlatProposals(flat);
      } else if (data.proposals && Array.isArray(data.proposals)) {
        setProjects([]);
        setFlatProposals(data.proposals);
      }
      // 加载里程碑
      try {
        const milestonesRes = await fetch('/data/milestones.json');
        if (milestonesRes.ok) {
          const milestonesData = await milestonesRes.json();
          setMilestones(milestonesData.milestones || []);
        }
      } catch (e) {
        console.warn('Failed to load milestones:', e);
      }
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

  // 导入/导出处理函数
  const flattenProposals = (projectsData) => {
    return projectsData.flatMap(project =>
      (project.proposals || []).map(p => ({
        ...p,
        projectName: project.name,
        projectUrl: project.url,
        projectGitRepo: project.gitRepo,
        projectId: project.id,
      }))
    );
  };

  const handleCSVExport = () => {
    const csv = exportProjectsToCSV(projects);
    downloadFile(csv, `proposals-${Date.now()}.csv`, 'text/csv');
  };

  const handleJSONExport = () => {
    downloadJSONBackup(projects, milestones);
  };

  const handleCSVFileSelect = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows } = parseCSV(e.target.result);
      const result = validateCSVImport(rows, projects);
      setParsedCSV({ rows, ...result });
      setShowImportPreview(true);
    };
    reader.readAsText(file);
  };

  const handleCSVImportConfirm = async () => {
    if (!parsedCSV) return;
    const { projects: updated, imported, skipped, updated: updatedCount } = executeCSVImport(parsedCSV.validRows, projects, importMode);
    setProjects(updated);
    setFlatProposals(flattenProposals(updated));
    await saveProposals(updated);
    setShowImportPreview(false);
    setParsedCSV(null);
    return { imported, skipped, updated: updatedCount, errors: [] };
  };

  const handleJSONRestore = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const { projects: restored, error } = restoreFromBackup(data);
        if (error) { alert(error); return; }
        // 自动备份当前数据
        handleJSONExport();
        setProjects(restored);
        setFlatProposals(flattenProposals(restored));
        await saveProposals(restored);
        alert('恢复成功！');
      } catch (err) {
        alert('恢复失败：' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Handle undo operation
  const handleUndo = useCallback(async () => {
    const lastRecord = undoLast();
    if (!lastRecord) return;

    // For create: delete the proposal
    // For update/batch_update: restore before state
    // For delete: cannot easily undo (skip)
    try {
      if (lastRecord.action === 'create') {
        // Undo create = delete
        const newProjects = projects.map(project => ({
          ...project,
          proposals: project.proposals.filter(p => p.id !== lastRecord.targetId)
        })).filter(project => project.proposals.length > 0);
        await saveProposals({ version: 3, projects: newProjects });
        setProjects(newProjects);
        setFlatProposals(flatProposals.filter(p => p.id !== lastRecord.targetId));
      } else if (lastRecord.action === 'update' && lastRecord.before) {
        // Restore before state
        const restoredProjects = projects.map(project => ({
          ...project,
          proposals: project.proposals.map(p =>
            p.id === lastRecord.targetId ? { ...lastRecord.before, updatedAt: new Date().toISOString().split('T')[0] } : p
          )
        }));
        await saveProposals({ version: 3, projects: restoredProjects });
        setProjects(restoredProjects);
        setFlatProposals(flatProposals.map(p =>
          p.id === lastRecord.targetId ? { ...lastRecord.before, updatedAt: new Date().toISOString().split('T')[0] } : p
        ));
      }
      refreshHistory();
    } catch (err) {
      console.error('Undo failed:', err);
      alert('撤销失败：' + err.message);
    }
    setShowUndoToast(false);
  }, [projects, flatProposals, undoLast, saveProposals, refreshHistory]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // 更新 URL
  const updateUrl = useCallback((filters) => {
    const params = new URLSearchParams();
    if (filters.statuses.length) params.set('status', filters.statuses.join(','));
    if (filters.types.length) params.set('type', filters.types.join(','));
    if (filters.tags.length) params.set('tag', filters.tags.join(','));
    if (filters.projectId) params.set('project', filters.projectId);
    if (filters.dateFrom) params.set('from', filters.dateFrom);
    if (filters.dateTo) params.set('to', filters.dateTo);
    setSearchParams(params);
  }, [setSearchParams]);

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set();
    flatProposals.forEach(p => {
      if (p.tags) p.tags.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [flatProposals]);

  // 扩展搜索范围：ID、GitHub仓库URL、部署URL、负责人
  const filteredProposals = useMemo(() => {
    return flatProposals.filter((p) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = !q || (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(q))) ||
        (p.projectName && p.projectName.toLowerCase().includes(q)) ||
        (p.gitRepo && p.gitRepo.toLowerCase().includes(q)) ||
        (p.url && p.url.toLowerCase().includes(q)) ||
        (p.owner && p.owner.toLowerCase().includes(q))
      );

      const matchesStatus = advancedFilters.statuses.length === 0 ||
        advancedFilters.statuses.includes(p.status);
      const matchesType = advancedFilters.types.length === 0 ||
        advancedFilters.types.includes(p.type);
      const matchesTags = advancedFilters.tags.length === 0 ||
        advancedFilters.tags.some(t => p.tags?.includes(t));
      const matchesProject = !advancedFilters.projectId ||
        p.projectId === advancedFilters.projectId;
      const matchesDate = (!advancedFilters.dateFrom ||
        p.createdAt >= advancedFilters.dateFrom) &&
        (!advancedFilters.dateTo || p.createdAt <= advancedFilters.dateTo);

      return matchesSearch && matchesStatus && matchesType &&
             matchesTags && matchesProject && matchesDate;
    });
  }, [flatProposals, searchQuery, advancedFilters]);

  const filteredProjects = useMemo(() => {
    if (advancedFilters.statuses.length === 0 && advancedFilters.types.length === 0 &&
        advancedFilters.tags.length === 0 && !advancedFilters.projectId &&
        !advancedFilters.dateFrom && !advancedFilters.dateTo && !searchQuery) {
      return projects;
    }
    const matchedIds = new Set(filteredProposals.map(p => p.projectId));
    return projects.filter(p => matchedIds.has(p.id));
  }, [projects, filteredProposals, searchQuery, advancedFilters]);

  // M3: Focus mode filtered projects
  const focusFilteredProjects = useMemo(() => {
    if (!focusMode.projectId && !focusMode.status) return filteredProjects;
    return filteredProjects.map(project => ({
      ...project,
      proposals: project.proposals.filter(p =>
        (!focusMode.projectId || p.projectId === focusMode.projectId) &&
        (!focusMode.status || p.status === focusMode.status)
      )
    })).filter(p => p.proposals.length > 0);
  }, [filteredProjects, focusMode]);

  // M3: Focus mode flat proposals
  const focusFilteredProposals = useMemo(() => {
    return focusFilteredProjects.flatMap(project =>
      project.proposals.map(p => ({
        ...p,
        projectName: project.name,
        projectUrl: project.url,
        projectGitRepo: project.gitRepo,
        projectId: project.id,
      }))
    );
  }, [focusFilteredProjects]);

  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProposals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProposals, currentPage]);

  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, advancedFilters]);

  const handleAdvancedApply = () => {
    updateUrl(advancedFilters);
    setShowAdvanced(false);
  };

  const handleAdvancedClear = () => {
    const cleared = { statuses: [], types: [], tags: [], projectId: '', dateFrom: '', dateTo: '' };
    setAdvancedFilters(cleared);
    updateUrl(cleared);
  };

  const handleAddProposal = async (newProposal) => {
    const today = new Date().toISOString().split('T')[0];
    const existingToday = flatProposals.filter((p) => p.id.startsWith(`P-${today.replace(/-/g, '')}`));
    const seqNum = String(existingToday.length + 1).padStart(3, '0');
    const id = `P-${today.replace(/-/g, '')}-${seqNum}`;

    const proposal = {
      ...newProposal,
      id,
      createdAt: today,
      updatedAt: today,
    };

    const newProjects = projects.length > 0 ? [...projects] : [];
    if (newProjects.length > 0) {
      newProjects[0].proposals.push(proposal);
      newProjects[0].updatedAt = today;
    }

    const newFlat = [...flatProposals, proposal];
    await saveProposals({ version: 3, projects: newProjects.length > 0 ? newProjects : [{ id: `PRJ-${today.replace(/-/g, '')}-999`, name: '未分类', proposals: [proposal] }] });
    setProjects(newProjects.length > 0 ? newProjects : [{ id: `PRJ-${today.replace(/-/g, '')}-999`, name: '未分类', proposals: [proposal] }]);
    setFlatProposals(newFlat);
    setShowForm(false);
    // Push history record
    pushRecord({
      timestamp: new Date().toISOString(),
      action: 'create',
      target: 'proposal',
      targetId: proposal.id,
      description: `创建提案 ${proposal.name}`,
      before: null,
      after: proposal,
    });
    setLastOperationDesc(`创建提案 ${proposal.name}`);
    setShowUndoToast(true);
  };

  const handleEditProposal = async (updatedProposal) => {
    const today = new Date().toISOString().split('T')[0];
    // Find original proposal for history
    const originalProposal = flatProposals.find(p => p.id === updatedProposal.id);
    const newProjects = projects.map(project => ({
      ...project,
      proposals: project.proposals.map(p =>
        p.id === updatedProposal.id ? { ...updatedProposal, updatedAt: today } : p
      ),
      updatedAt: project.proposals.some(p => p.id === updatedProposal.id) ? today : project.updatedAt,
    }));
    const newFlat = flatProposals.map(p =>
      p.id === updatedProposal.id ? { ...updatedProposal, updatedAt: today } : p
    );
    await saveProposals({ version: 3, projects: newProjects });
    setProjects(newProjects);
    setFlatProposals(newFlat);
    setEditingProposal(null);
    setShowForm(false);
    // Push history record
    pushRecord({
      timestamp: new Date().toISOString(),
      action: 'update',
      target: 'proposal',
      targetId: updatedProposal.id,
      description: `更新提案 ${updatedProposal.name}`,
      before: originalProposal,
      after: { ...updatedProposal, updatedAt: today },
    });
    setLastOperationDesc(`更新提案 ${updatedProposal.name}`);
    setShowUndoToast(true);
  };

  const handleDeleteProposal = async (id) => {
    if (!confirm('确定要删除这个提案吗？此操作不可恢复。')) return;
    // Find proposal for history
    const deletedProposal = flatProposals.find(p => p.id === id);
    const newProjects = projects.map(project => ({
      ...project,
      proposals: project.proposals.filter(p => p.id !== id),
    })).filter(project => project.proposals.length > 0);
    const newFlat = flatProposals.filter(p => p.id !== id);
    await saveProposals({ version: 3, projects: newProjects });
    setProjects(newProjects);
    setFlatProposals(newFlat);
    // Push history record (delete cannot be undone easily)
    if (deletedProposal) {
      pushRecord({
        timestamp: new Date().toISOString(),
        action: 'delete',
        target: 'proposal',
        targetId: id,
        description: `删除提案 ${deletedProposal.name}`,
        before: deletedProposal,
        after: null,
      });
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

  // 批量选择切换
  const handleToggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 全选当前页
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedProposals.length) {
      // 取消全选
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedProposals.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      // 全选
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedProposals.forEach(p => next.add(p.id));
        return next;
      });
    }
  }, [paginatedProposals, selectedIds.size]);

  // 批量移动状态
  const handleBatchStatusChange = async (newStatus) => {
    if (!newStatus) return;
    const today = new Date().toISOString().split('T')[0];
    // Get selected proposals for history
    const selectedProposals = flatProposals.filter(p => selectedIds.has(p.id));
    const updatedProjects = projects.map(project => ({
      ...project,
      proposals: project.proposals.map(p =>
        selectedIds.has(p.id) ? { ...p, status: newStatus, updatedAt: today } : p
      )
    }));
    const updatedFlat = flatProposals.map(p =>
      selectedIds.has(p.id) ? { ...p, status: newStatus, updatedAt: today } : p
    );
    await saveProposals({ version: 3, projects: updatedProjects });
    setProjects(updatedProjects);
    setFlatProposals(updatedFlat);
    setSelectedIds(new Set());
    // Push history record for batch
    pushRecord({
      timestamp: new Date().toISOString(),
      action: 'batch_update',
      target: 'proposal',
      targetId: `${selectedIds.size} 个提案`,
      description: `批量修改 ${selectedIds.size} 个提案状态为 ${newStatus}`,
      before: selectedProposals,
      after: updatedFlat.filter(p => selectedIds.has(p.id)),
    });
    setLastOperationDesc(`批量修改 ${selectedIds.size} 个提案状态`);
    setShowUndoToast(true);
    alert(`已将 ${selectedIds.size} 个提案移动到${newStatus === 'active' ? '待办' : newStatus === 'in_dev' ? '进行中' : '已完成'}`);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (!confirm(`确定删除 ${selectedIds.size} 个提案？此操作不可恢复。`)) return;
    // Get selected proposals for history
    const selectedProposals = flatProposals.filter(p => selectedIds.has(p.id));
    const updatedProjects = projects
      .map(project => ({
        ...project,
        proposals: project.proposals.filter(p => !selectedIds.has(p.id))
      }))
      .filter(project => project.proposals.length > 0);
    const updatedFlat = flatProposals.filter(p => !selectedIds.has(p.id));
    await saveProposals({ version: 3, projects: updatedProjects });
    setProjects(updatedProjects);
    setFlatProposals(updatedFlat);
    setSelectedIds(new Set());
    // Push history record for batch delete
    pushRecord({
      timestamp: new Date().toISOString(),
      action: 'batch_delete',
      target: 'proposal',
      targetId: `${selectedIds.size} 个提案`,
      description: `批量删除 ${selectedIds.size} 个提案`,
      before: selectedProposals,
      after: null,
    });
    setLastOperationDesc(`批量删除 ${selectedIds.size} 个提案`);
    setShowUndoToast(true);
  };

  // 批量关联里程碑
  const handleBatchMilestone = async (milestoneId, milestoneName) => {
    const today = new Date().toISOString().split('T')[0];
    // Get selected proposals for history
    const selectedProposals = flatProposals.filter(p => selectedIds.has(p.id));
    const updatedProjects = projects.map(project => ({
      ...project,
      proposals: project.proposals.map(p =>
        selectedIds.has(p.id) ? { ...p, milestoneId, updatedAt: today } : p
      )
    }));
    const updatedFlat = flatProposals.map(p =>
      selectedIds.has(p.id) ? { ...p, milestoneId, updatedAt: today } : p
    );
    await saveProposals({ version: 3, projects: updatedProjects });
    setProjects(updatedProjects);
    setFlatProposals(updatedFlat);
    setSelectedIds(new Set());
    setShowMilestoneModal(false);
    // Push history record
    pushRecord({
      timestamp: new Date().toISOString(),
      action: 'batch_update',
      target: 'proposal',
      targetId: `${selectedIds.size} 个提案`,
      description: `批量关联 ${selectedIds.size} 个提案到「${milestoneName}」`,
      before: selectedProposals,
      after: updatedFlat.filter(p => selectedIds.has(p.id)),
    });
    setLastOperationDesc(`批量关联 ${selectedIds.size} 个提案到里程碑`);
    setShowUndoToast(true);
    alert(`已将 ${selectedIds.size} 个提案关联到「${milestoneName}」`);
  };

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">设置 GitHub Token</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            请输入 GitHub Personal Access Token 以访问和修改提案数据。
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="输入 GitHub Token"
            className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Header
        onAdd={() => {
          setEditingProposal(null);
          setShowForm(true);
        }}
        onSettings={() => setShowSettingsModal(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onShowHistory={() => setShowHistoryDrawer(true)}
        dataHealth={{ errors: validationErrors, warnings: validationWarnings }}
      />

      <div className="container mx-auto px-4 py-6">
        {validationErrors.length > 0 && (
          <ValidationAlert
            errors={validationErrors}
            onDismiss={() => setValidationErrors([])}
          />
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onAdvancedClick={() => setShowAdvanced(prev => !prev)}
            showAdvanced={showAdvanced}
          />
          <FilterBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
          />
        </div>

        {showAdvanced && (
          <AdvancedFilter
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            allTags={allTags}
            projects={projects}
            matchCount={filteredProposals.length}
            onApply={handleAdvancedApply}
            onCancel={() => setShowAdvanced(false)}
            onClear={handleAdvancedClear}
          />
        )}

        {loading && <div className="text-center py-8 text-gray-600 dark:text-gray-300">加载中...</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}

        {!loading && (
          <>
            {viewMode === 'projects' && (
              <>
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || advancedFilters.statuses.length > 0 || advancedFilters.types.length > 0
                    ? `找到 ${filteredProposals.length} 个提案`
                    : `共 ${filteredProjects.length} 个项目，${filteredProposals.length} 个提案`}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => {
                    const recentProposals = project.proposals
                      .filter(p => {
                        if (advancedFilters.statuses.length > 0 && !advancedFilters.statuses.includes(p.status)) return false;
                        if (advancedFilters.types.length > 0 && !advancedFilters.types.includes(p.type)) return false;
                        if (advancedFilters.tags.length > 0 && !advancedFilters.tags.some(t => p.tags?.includes(t))) return false;
                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          return p.id.toLowerCase().includes(q) ||
                            p.name.toLowerCase().includes(q) ||
                            (p.description && p.description.toLowerCase().includes(q)) ||
                            (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
                            (p.gitRepo && p.gitRepo.toLowerCase().includes(q)) ||
                            (p.url && p.url.toLowerCase().includes(q)) ||
                            (p.owner && p.owner.toLowerCase().includes(q));
                        }
                        return true;
                      })
                      .slice(0, RECENT_PROPOSALS_PER_PROJECT);
                    const hasMore = project.proposals.length > RECENT_PROPOSALS_PER_PROJECT;

                    return (
                      <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{project.id}</span>
                            <Link to={`/project/${project.id}`} className="block">
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate hover:text-blue-500 dark:hover:text-blue-400">{project.name}</h3>
                            </Link>
                          </div>
                          <span className="ml-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs whitespace-nowrap">
                            {project.proposals.length} 提案
                          </span>
                        </div>

                        {project.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-3">
                          {recentProposals.map((proposal) => (
                            <div key={proposal.id} className="flex items-center gap-2 text-sm">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                proposal.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                proposal.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {proposal.status}
                              </span>
                              <span className="text-gray-700 dark:text-gray-200 truncate flex-1">{proposal.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                proposal.type === 'web' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                proposal.type === 'app' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              }`}>
                                {proposal.type}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          {project.url && (
                            <button
                              onClick={() => window.open(project.url, '_blank')}
                              className="flex-1 bg-blue-500 text-white py-1.5 rounded hover:bg-blue-600 text-sm"
                            >
                              访问
                            </button>
                          )}
                          {project.gitRepo && (
                            <button
                              onClick={() => window.open(project.gitRepo, '_blank')}
                              className="flex-1 bg-gray-700 dark:bg-gray-600 text-white py-1.5 rounded hover:bg-gray-800 dark:hover:bg-gray-500 text-sm"
                            >
                              仓库
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingProposal(project.proposals[0]);
                              setShowForm(true);
                            }}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                          >
                            {hasMore ? `查看全部 (${project.proposals.length})` : '编辑'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    没有找到匹配的项目
                  </div>
                )}
              </>
            )}

            {viewMode === 'card' && (
              <>
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  找到 <span className="font-semibold text-blue-500">{filteredProposals.length}</span> 个提案
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      searchQuery={searchQuery}
                      selectedIds={selectedIds}
                      onToggleSelect={handleToggleSelect}
                      onEdit={() => {
                        setEditingProposal(proposal);
                        setShowForm(true);
                      }}
                      onDelete={() => handleDeleteProposal(proposal.id)}
                      onCopyUrl={handleCopyUrl}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 dark:text-gray-200">
                      第 {currentPage} / {totalPages} 页
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      下一页
                    </button>
                  </div>
                )}

                {filteredProposals.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    没有找到匹配的提案
                  </div>
                )}
              </>
            )}

            {viewMode === 'swimlane' && (
              <KanbanSwimlanes
                projects={focusFilteredProjects}
                proposals={focusFilteredProposals}
                onUpdateProposal={handleEditProposal}
                focusMode={focusMode}
              />
            )}

            {viewMode === 'table' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === paginatedProposals.length && paginatedProposals.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-500 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">项目</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedProposals.map((proposal) => {
                      const isSelected = selectedIds.has(proposal.id);
                      return (
                        <tr key={proposal.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(proposal.id)}
                              className="w-4 h-4 text-blue-500 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{proposal.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{proposal.name}</td>
                          <td className="px-4 py-3 text-sm text-indigo-600 dark:text-indigo-400">{proposal.projectName || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              proposal.type === 'web' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              proposal.type === 'app' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                            }`}>
                              {proposal.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              proposal.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              proposal.status === 'archived' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
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
                              className="text-blue-500 hover:text-blue-700 mr-3 dark:text-blue-400"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteProposal(proposal.id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 dark:text-gray-200">
                      第 {currentPage} / {totalPages} 页
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 dark:text-gray-200"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 批量操作栏 */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        onBatchStatusChange={handleBatchStatusChange}
        onBatchMilestone={() => setShowMilestoneModal(true)}
        onBatchDelete={handleBatchDelete}
        onCancelSelect={() => setSelectedIds(new Set())}
      />

      {/* 里程碑选择弹窗 */}
      {showMilestoneModal && (
        <MilestoneSelectModal
          milestones={milestones}
          onSelect={handleBatchMilestone}
          onClose={() => setShowMilestoneModal(false)}
        />
      )}

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

      <UndoToast
        visible={showUndoToast}
        description={lastOperationDesc}
        onUndo={handleUndo}
        onDismiss={() => setShowUndoToast(false)}
      />

      <OperationHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        history={history}
        onUndo={(recordId) => {
          // Mark as undone in history
          const record = history.find(r => r.id === recordId);
          if (record && !record.undone) {
            updateRecord(recordId, { undone: true });
          }
        }}
      />

      {/* Settings Modal with Import/Export */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">设置</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* GitHub Token Section */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GitHub Token</h3>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="输入 GitHub Token"
                  className="w-full px-4 py-2 border rounded-lg mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <button
                  onClick={() => {
                    handleSaveToken(token);
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  保存 Token
                </button>
              </div>

              {/* Import/Export Panel */}
              <ImportExportPanel
                projects={projects}
                milestones={milestones}
                onImport={handleCSVFileSelect}
                onRestore={handleJSONRestore}
              />
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Preview Modal */}
      {showImportPreview && parsedCSV && (
        <CsvPreviewTable
          rows={parsedCSV.rows}
          errors={parsedCSV.errors}
          validRows={parsedCSV.validRows}
          existingIds={parsedCSV.existingIds}
          newIds={parsedCSV.newIds}
          importMode={importMode}
          onImportModeChange={setImportMode}
          onClose={() => {
            setShowImportPreview(false);
            setParsedCSV(null);
          }}
          onConfirm={handleCSVImportConfirm}
        />
      )}
    </div>
  );
}

export default App;
