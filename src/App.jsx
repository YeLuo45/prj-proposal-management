import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import AdvancedFilter from './components/AdvancedFilter';
import SavedFilters from './components/SavedFilters';
import ProposalCard from './components/ProposalCard';
import ProjectCard from './components/ProjectCard';
import ProposalForm from './components/ProposalForm';
import BatchActionBar from './components/BatchActionBar';
import MilestoneSelectModal from './components/MilestoneSelectModal';
import KanbanSwimlanes from './pages/KanbanSwimlanes';
import ImportExportPanel from './components/ImportExportPanel';
import CsvPreviewTable from './components/CsvPreviewTable';
import AISettings from './components/AISettings';
import SyncSettings from './components/SyncSettings';
import ExportPanel from './components/ExportPanel';
import ExportBackupModal from './components/ExportBackupModal';
import ThemeSwitcher from './components/ThemeSwitcher';
import { useGitHub } from './hooks/useGitHub';
import { useFavorites } from './hooks/useFavorites';
import { githubApi } from './services/githubApi';
import { useOperationHistory } from './hooks/useOperationHistory';
import { useValidation } from './hooks/useDataValidator';
import ValidationAlert from './components/ValidationAlert';
import UndoToast from './components/UndoToast';
import OperationHistoryDrawer from './components/OperationHistoryDrawer';
import OfflineIndicator from './components/OfflineIndicator';
import { useTheme } from './contexts/ThemeContext';
import Toast, { ToastContainer } from './components/Toast';
import NotificationCenter from './components/NotificationCenter';
import { toast } from './hooks/useToast';
import { useKeyboardShortcuts, KeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import GlobalSearch from './components/GlobalSearch';
import { useGlobalSearch } from './hooks/useGlobalSearch';
import { validateProjects } from './utils/dataValidator';
import { downloadAllCSVs, downloadFilteredCSVs, downloadFile, exportFavoritesToCSV } from './utils/csvExporter';
import { parseCSV, validateCSVImport, executeCSVImport } from './utils/csvImporter';
import { generateBackup, restoreFromBackup, downloadJSONBackup } from './utils/jsonBackup';
import { classifyProposal, generateSummary, getAPIKey } from './utils/aiService';
import { findDuplicates } from './utils/duplicateDetector';

const ITEMS_PER_PAGE = 12;
const RECENT_PROPOSALS_PER_PROJECT = 3;

function App() {
  const { t } = useTranslation();
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastOperationDesc, setLastOperationDesc] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // M3: 专注模式状态
  const [focusMode, setFocusMode] = useState({ projectId: null, status: null });

  // V9: 日期范围筛选
  const [dateRange, setDateRange] = useState({ field: 'createdAt', start: '', end: '' });
  // V9: 标签匹配逻辑
  const [tagLogic, setTagLogic] = useState('OR');
  // V9: 选中的模板ID
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // V24: Saved Filters Modal
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [filterLogic, setFilterLogic] = useState('OR');

  // Favorites view state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoritesMultiSelect, setFavoritesMultiSelect] = useState(false);
  const [selectedFavorites, setSelectedFavorites] = useState([]);

  // V10: AI 功能状态
  const [aiRecommendations, setAiRecommendations] = useState({ type: null, tags: [] });
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // 导入/导出状态
  const [importMode, setImportMode] = useState('skip');
  const [parsedCSV, setParsedCSV] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showKeyboardShortcutsModal, setShowKeyboardShortcutsModal] = useState(false);
  const [showExportBackupModal, setShowExportBackupModal] = useState(false);

  // Theme state from context
  const { theme, themeId, setThemeId } = useTheme();

  // Export ref for PNG/PDF
  const exportRef = useRef(null);

  const { loading, error, fetchProposals, saveProposals } = useGitHub();
  const { favorites, favoritesList, toggleFavorite, pinFavorite } = useFavorites();
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

  // Keyboard shortcuts
  const shortcuts = {
    [KeyboardShortcuts.NEW_PROPOSAL]: () => {
      setEditingProposal(null);
      setShowForm(true);
    },
    [KeyboardShortcuts.SEARCH]: () => {
      document.querySelector('input[type="text"]')?.focus();
    },
    [KeyboardShortcuts.SHOW_SHORTCUTS]: () => {
      setShowKeyboardShortcutsModal(true);
    },
    [KeyboardShortcuts.CLOSE_MODAL]: () => {
      if (showKeyboardShortcutsModal) setShowKeyboardShortcutsModal(false);
      if (showSettingsModal) setShowSettingsModal(false);
      if (showForm) setShowForm(false);
      if (showAdvanced) setShowAdvanced(false);
      if (showImportPreview) setShowImportPreview(false);
      if (showMilestoneModal) setShowMilestoneModal(false);
    },
    [KeyboardShortcuts.SAVE]: () => {
      // Save action - trigger form submission if form is open
      if (showForm) {
        document.querySelector('form')?.requestSubmit();
      }
    },
    [KeyboardShortcuts.UNDO]: () => {
      if (canUndo) handleUndo();
    },
    [KeyboardShortcuts.GO_TO_LIST]: () => {
      window.location.href = '/';
    },
    [KeyboardShortcuts.GO_TO_KANBAN]: () => {
      window.location.href = '/kanban';
    },
    [KeyboardShortcuts.GO_TO_GANTT]: () => {
      window.location.href = '/gantt';
    },
    [KeyboardShortcuts.GO_TO_DASHBOARD]: () => {
      window.location.href = '/dashboard';
    },
    [KeyboardShortcuts.GO_TO_SETTINGS]: () => {
      window.location.href = '/settings';
    },
    [KeyboardShortcuts.TOGGLE_THEME]: () => {
      setThemeId(themeId === 'dark' ? 'light' : 'dark');
    },
    [KeyboardShortcuts.TOGGLE_ADVANCED_FILTER]: () => {
      setShowAdvanced(prev => !prev);
    },
  };

  useKeyboardShortcuts(shortcuts, { enabled: true });

  // Global Search (Cmd/Ctrl+K)
  const globalSearch = useGlobalSearch(flatProposals, milestones);

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
            projectGitPages: project.githubPages,
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
            projectGitPages: project.githubPages,
        projectId: project.id,
      }))
    );
  };

  const handleCSVExport = () => {
    downloadAllCSVs(projects);
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

      // V24: Filter logic (AND/OR for statuses and types combination)
      const statusMatch = advancedFilters.statuses.length === 0 ||
        (filterLogic === 'AND'
          ? advancedFilters.statuses.every(s => p.status === s)
          : advancedFilters.statuses.includes(p.status));
      const typeMatch = advancedFilters.types.length === 0 ||
        (filterLogic === 'AND'
          ? advancedFilters.types.every(t => p.type === t)
          : advancedFilters.types.includes(p.type));
      // V9: Tag logic (AND/OR)
      const tagMatch = advancedFilters.tags.length === 0 ||
        (tagLogic === 'AND'
          ? advancedFilters.tags.every(t => p.tags?.includes(t))
          : advancedFilters.tags.some(t => p.tags?.includes(t)));
      const matchesProject = !advancedFilters.projectId ||
        p.projectId === advancedFilters.projectId;
      const matchesDate = (!advancedFilters.dateFrom ||
        p.createdAt >= advancedFilters.dateFrom) &&
        (!advancedFilters.dateTo || p.createdAt <= advancedFilters.dateTo);

      return matchesSearch && statusMatch && typeMatch &&
             tagMatch && matchesProject && matchesDate;
    });
  }, [flatProposals, searchQuery, advancedFilters, tagLogic, filterLogic]);

  // V9: Date range filtering (after tag filtering)
  const dateFiltered = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return filteredProposals;
    return filteredProposals.filter(p => {
      const dateStr = p[dateRange.field];
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [filteredProposals, dateRange]);

  const filteredProjects = useMemo(() => {
    if (advancedFilters.statuses.length === 0 && advancedFilters.types.length === 0 &&
        advancedFilters.tags.length === 0 && !advancedFilters.projectId &&
        !advancedFilters.dateFrom && !advancedFilters.dateTo && !searchQuery &&
        !dateRange.start && !dateRange.end) {
      return projects;
    }
    const matchedIds = new Set(dateFiltered.map(p => p.projectId));
    return projects.filter(p => matchedIds.has(p.id));
  }, [projects, dateFiltered, searchQuery, advancedFilters, dateRange]);

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

  // Favorites filtered projects (sorted by most recent first)
  const favoritesFilteredProjects = useMemo(() => {
    if (!showFavoritesOnly) return focusFilteredProjects;
    const favIds = new Set(Object.keys(favorites));
    const sortedFavProjects = focusFilteredProjects
      .filter(p => favIds.has(p.id))
      .sort((a, b) => {
        const timeA = favorites[a.id] || '';
        const timeB = favorites[b.id] || '';
        return timeB.localeCompare(timeA);
      });
    return sortedFavProjects;
  }, [focusFilteredProjects, favorites, showFavoritesOnly]);

  // M3: Focus mode flat proposals
  const focusFilteredProposals = useMemo(() => {
    return focusFilteredProjects.flatMap(project =>
      project.proposals.map(p => ({
        ...p,
        projectName: project.name,
        projectUrl: project.url,
        projectGitRepo: project.gitRepo,
            projectGitPages: project.githubPages,
        projectId: project.id,
      }))
    );
  }, [focusFilteredProjects]);

  // Favorites filtered proposals
  const favoritesFilteredProposals = useMemo(() => {
    if (!showFavoritesOnly) return focusFilteredProposals;
    const favIds = new Set(Object.keys(favorites));
    return focusFilteredProposals
      .filter(p => favIds.has(p.projectId))
      .sort((a, b) => {
        const timeA = favorites[a.projectId] || '';
        const timeB = favorites[b.projectId] || '';
        return timeB.localeCompare(timeA);
      });
  }, [focusFilteredProposals, favorites, showFavoritesOnly]);

  const paginatedProposals = useMemo(() => {
    const source = showFavoritesOnly ? favoritesFilteredProposals : dateFiltered;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return source.slice(start, start + ITEMS_PER_PAGE);
  }, [dateFiltered, favoritesFilteredProposals, showFavoritesOnly, currentPage]);

  const totalPages = Math.ceil((showFavoritesOnly ? favoritesFilteredProposals.length : dateFiltered.length) / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, advancedFilters, dateRange, tagLogic, showFavoritesOnly]);

  const handleAdvancedApply = () => {
    updateUrl(advancedFilters);
    setShowAdvanced(false);
  };

  const handleAdvancedClear = () => {
    const cleared = { statuses: [], types: [], tags: [], projectId: '', dateFrom: '', dateTo: '' };
    setAdvancedFilters(cleared);
    updateUrl(cleared);
  };

  // V9: Date range quick presets
  const setDateRangeQuick = (preset) => {
    const now = new Date();
    const toDateStr = (d) => d.toISOString().split('T')[0];
    const start = new Date();
    if (preset === '7d') { start.setDate(now.getDate() - 7); setDateRange({ field: dateRange.field, start: toDateStr(start), end: toDateStr(now) }); }
    else if (preset === '30d') { start.setDate(now.getDate() - 30); setDateRange({ field: dateRange.field, start: toDateStr(start), end: toDateStr(now) }); }
    else if (preset === 'month') { start.setDate(1); setDateRange({ field: dateRange.field, start: toDateStr(start), end: toDateStr(now) }); }
    else if (preset === 'lastMonth') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateRange({ field: dateRange.field, start: toDateStr(last), end: toDateStr(lastEnd) });
    }
  };

  // V9: Export filtered proposals
  const handleExportFiltered = () => {
    downloadFilteredCSVs(dateFiltered, projects);
  };

  // V9: Apply filters from template
  const setFiltersFromTemplate = (filters) => {
    setSearchQuery(filters.query || '');
    setAdvancedFilters(prev => ({
      ...prev,
      statuses: filters.status ? [filters.status] : [],
      types: filters.type ? [filters.type] : [],
      projectId: filters.projectId || '',
      tags: filters.tags || [],
    }));
    setTagLogic(filters.tagLogic || 'OR');
    setDateRange(filters.dateRange || { field: 'createdAt', start: '', end: '' });
  };

  // V10: AI handlers
  const handleAIClassify = async (description) => {
    const apiKey = getAPIKey();
    if (!apiKey || !description) return;
    setLoadingAI(true);
    try {
      const result = await classifyProposal(description, apiKey);
      setAiRecommendations({ type: result.type, tags: result.tags || [] });
    } finally {
      setLoadingAI(false);
    }
  };

  // Favorites batch management
  const handleToggleFavoritesMultiSelect = () => {
    setFavoritesMultiSelect(!favoritesMultiSelect);
    if (favoritesMultiSelect) {
      setSelectedFavorites([]); // Clear selection when exiting multi-select mode
    }
  };

  const handleToggleFavoriteSelect = (projectId) => {
    setSelectedFavorites(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleBatchRemoveFavorites = async () => {
    if (!confirm(`确定要从收藏中移除 ${selectedFavorites.length} 个项目吗？`)) return;
    for (const id of selectedFavorites) {
      await toggleFavorite(id);
    }
    setSelectedFavorites([]);
    setFavoritesMultiSelect(false);
  };

  const handleExportFavorites = () => {
    const csv = exportFavoritesToCSV(favorites, projects);
    if (!csv) {
      alert('没有可导出的收藏');
      return;
    }
    downloadFile(csv, `favorites-${Date.now()}.csv`, 'text/csv');
  };

  const handleDuplicateCheck = (proposal) => {
    const dupes = findDuplicates(proposal, flatProposals);
    setDuplicateWarnings(dupes);
    return dupes;
  };

  const handleSaveWithAI = async (updated) => {
    // Check duplicates first
    const dupes = handleDuplicateCheck(updated);
    if (dupes.length > 0) return; // show warnings, block save

    // Normal save
    await saveProposals(updated);

    // Generate summary if description > 50 chars
    const apiKey = getAPIKey();
    if (updated.description?.length > 50 && apiKey) {
      setLoadingAI(true);
      try {
        const summary = await generateSummary(updated.description, apiKey);
        if (summary) {
          // Update proposal with aiSummary field
          const updatedWithSummary = {
            ...updated,
            aiSummary: summary,
          };
          await saveProposals(updatedWithSummary);
        }
      } finally {
        setLoadingAI(false);
      }
    }
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

    // V10: Check duplicates first (skip self)
    const dupes = findDuplicates(updatedProposal, flatProposals);
    if (dupes.length > 0) {
      setDuplicateWarnings(dupes);
      return; // block save, show warnings
    }

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

    // V10: Generate AI summary if description > 50 chars
    const apiKey = getAPIKey();
    if (updatedProposal.description?.length > 50 && apiKey) {
      setLoadingAI(true);
      try {
        const summary = await generateSummary(updatedProposal.description, apiKey);
        if (summary) {
          const updatedWithSummary = {
            ...updatedProposal,
            aiSummary: summary,
            updatedAt: today,
          };
          await saveProposals({ version: 3, projects: newProjects.map(project => ({
            ...project,
            proposals: project.proposals.map(p =>
              p.id === updatedProposal.id ? updatedWithSummary : p
            )
          }))});
          setFlatProposals(newFlat.map(p =>
            p.id === updatedProposal.id ? { ...p, aiSummary: summary } : p
          ));
        }
      } finally {
        setLoadingAI(false);
      }
    }

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
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">{t('token.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('token.description')}
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t('token.placeholder')}
            className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <button
            onClick={() => handleSaveToken(token)}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            {t('token.save')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <OfflineIndicator />
      <Header
        onAdd={() => {
          setEditingProposal(null);
          setShowForm(true);
        }}
        onOpenSearch={globalSearch.openSearch}
        onShowHistory={() => setShowHistoryDrawer(true)}
        onOpenNotifications={() => setShowNotificationCenter(true)}
        onShowShortcuts={() => setShowKeyboardShortcutsModal(true)}
        onOpenSearch={globalSearch.openSearch}
        notificationCount={0}
        dataHealth={{ errors: validationErrors, warnings: validationWarnings }}
        onOpenExportModal={() => setShowExportBackupModal(true)}
      />

      <div className="container mx-auto px-4 py-6" ref={exportRef}>
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
            dateRange={dateRange}
            setDateRange={setDateRange}
            setDateRangeQuick={setDateRangeQuick}
            tagLogic={tagLogic}
            setTagLogic={setTagLogic}
            onExportFiltered={handleExportFiltered}
            filteredCount={dateFiltered.length}
            query={searchQuery}
            status={advancedFilters.statuses[0] || ''}
            type={advancedFilters.types[0] || ''}
            projectId={advancedFilters.projectId}
            tags={advancedFilters.tags}
            onApplyTemplate={setFiltersFromTemplate}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
            favoritesCount={Object.keys(favorites).length}
            favoritesMultiSelect={favoritesMultiSelect}
            onToggleFavoritesMultiSelect={handleToggleFavoritesMultiSelect}
            selectedFavorites={selectedFavorites}
            onBatchRemoveFavorites={handleBatchRemoveFavorites}
            onExportFavorites={handleExportFavorites}
          />
        </div>

        {showAdvanced && (
          <AdvancedFilter
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            allTags={allTags}
            projects={projects}
            matchCount={dateFiltered.length}
            onApply={handleAdvancedApply}
            onCancel={() => setShowAdvanced(false)}
            onClear={handleAdvancedClear}
            onSaveFilters={() => setShowSavedFilters(true)}
            onOpenSavedFilters={() => setShowSavedFilters(true)}
            filterLogic={filterLogic}
            onFilterLogicChange={setFilterLogic}
          />
        )}

        {loading && <div className="text-center py-8 text-gray-600 dark:text-gray-300">{t('common.loading')}</div>}
        {error && <div className="text-red-500 text-center py-4">{error}</div>}

        {!loading && (
          <>
            {viewMode === 'projects' && (
              <>
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  {showFavoritesOnly
                    ? (favoritesFilteredProjects.length === 0 ? '暂无收藏的项目' : `已收藏 ${favoritesFilteredProjects.length} 个项目`)
                    : (searchQuery || advancedFilters.statuses.length > 0 || advancedFilters.types.length > 0 || dateRange.start || dateRange.end
                    ? `找到 ${dateFiltered.length} 个提案`
                    : `共 ${filteredProjects.length} 个项目，${dateFiltered.length} 个提案`)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoritesFilteredProjects.map((project) => {
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
                    const hasMore = (project.proposals?.length || 0) > RECENT_PROPOSALS_PER_PROJECT;

                    return (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        recentProposals={recentProposals}
                        hasMore={hasMore}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        onPinFavorite={pinFavorite}
                        favoritesMultiSelect={favoritesMultiSelect}
                        selectedFavorites={selectedFavorites}
                        onToggleFavoriteSelect={handleToggleFavoriteSelect}
                      />
                    );
                  })}
                </div>

                {favoritesFilteredProjects.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {showFavoritesOnly ? '还没有收藏任何项目 ⭐' : '没有找到匹配的项目'}
                  </div>
                )}
              </>
            )}

            {viewMode === 'card' && (
              <>
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  {showFavoritesOnly
                    ? (favoritesFilteredProposals.length === 0 ? '暂无收藏的提案' : `已收藏 ${favoritesFilteredProposals.length} 个提案`)
                    : `找到 <span className="font-semibold text-blue-500">${dateFiltered.length}</span> 个提案`}
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

                {(showFavoritesOnly ? favoritesFilteredProposals.length : dateFiltered.length) === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {showFavoritesOnly ? '还没有收藏任何提案 ⭐' : '没有找到匹配的提案'}
                  </div>
                )}
              </>
            )}

            {viewMode === 'swimlane' && (
              <KanbanSwimlanes
                projects={favoritesFilteredProjects}
                proposals={favoritesFilteredProposals}
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
        onBatchExport={() => {
          const selected = flatProposals.filter(p => selectedIds.has(p.id));
          downloadFilteredCSVs(selected, projects);
        }}
        onCancelSelect={() => setSelectedIds(new Set())}
      />

      {/* 保存的筛选方案弹窗 */}
      {showSavedFilters && (
        <SavedFilters
          currentFilters={advancedFilters}
          onApply={(filters) => {
            setAdvancedFilters(filters);
            updateUrl(filters);
          }}
          onClose={() => setShowSavedFilters(false)}
        />
      )}

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
            setAiRecommendations({ type: null, tags: [] });
            setDuplicateWarnings([]);
          }}
          aiRecommendations={aiRecommendations}
          setAiRecommendations={setAiRecommendations}
          duplicateWarnings={duplicateWarnings}
          setDuplicateWarnings={setDuplicateWarnings}
          loadingAI={loadingAI}
          handleAIClassify={handleAIClassify}
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
              {/* Sync Settings */}
              <SyncSettings />

              {/* AI Settings */}
              <AISettings />

              {/* Import/Export Panel */}
              <ImportExportPanel
                projects={projects}
                milestones={milestones}
                onImport={handleCSVFileSelect}
                onRestore={handleJSONRestore}
              />

              {/* PNG/PDF Export Panel */}
              <ExportPanel
                projects={projects}
                milestones={milestones}
                exportRef={exportRef}
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

      {/* Toast Notifications */}
      <ToastContainer position="top-right" />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Export Backup Modal */}
      <ExportBackupModal
        isOpen={showExportBackupModal}
        onClose={() => setShowExportBackupModal(false)}
        onImport={async (data) => {
          // Merge imported data with skip duplicates
          const importedProjects = data.projects || [];
          const importedMilestones = data.milestones || [];
          const currentProjectIds = new Set(projects.map(p => p.id));
          const currentProposalIds = new Set(
            projects.flatMap(p => p.proposals?.map(prop => prop.id) || [])
          );

          // Filter out duplicates
          const newProjects = importedProjects.filter(p => !currentProjectIds.has(p.id));
          const mergedProjects = [...projects, ...newProjects];

          const newProposals = [];
          mergedProjects.forEach(p => {
            if (!currentProposalIds.has(p.id)) {
              // This is a new project, add all its proposals
            }
          });

          // Merge milestones
          const existingMilestoneIds = new Set(milestones.map(m => m.id));
          const newMilestones = importedMilestones.filter(m => !existingMilestoneIds.has(m.id));
          const mergedMilestones = [...milestones, ...newMilestones];

          // Save to GitHub
          await githubApi.saveProposals({ projects: mergedProjects });
          await githubApi.saveMilestones({ milestones: mergedMilestones });

          // Update local state
          setProjects(mergedProjects);
          setMilestones(mergedMilestones);
          setFlatProposals(flattenProposals(mergedProjects));

          alert('导入成功！');
        }}
        currentProjects={projects}
        currentMilestones={milestones}
      />

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowKeyboardShortcutsModal(false)} />
      )}

      {/* Global Search Modal (Cmd/Ctrl+K) */}
      <GlobalSearch {...globalSearch} />
    </div>
  );
}

export default App;
