import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';

/**
 * ExportBackupModal - Import/Export ZIP backup with preview
 * Supports drag & drop or file selection of .zip backups
 */
function ExportBackupModal({ isOpen, onClose, onImport, currentProjects = [], currentMilestones = [] }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const parseZipFile = async (selectedFile) => {
    setError(null);
    setLoading(true);
    setFile(selectedFile);

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(selectedFile);
      
      const backupJson = contents.file('backup.json');
      if (!backupJson) {
        setError('无效的备份文件：未找到 backup.json');
        setLoading(false);
        return;
      }

      const backupContent = await backupJson.async('string');
      const backupData = JSON.parse(backupContent);

      // Validate backup structure
      if (!backupData.data || !Array.isArray(backupData.data.projects)) {
        setError('无效的备份文件结构');
        setLoading(false);
        return;
      }

      // Generate preview comparing current vs imported
      const importedProjects = backupData.data.projects || [];
      const importedMilestones = backupData.data.milestones || [];
      
      const currentProposalCount = currentProjects.reduce((sum, p) => sum + (p.proposals?.length || 0), 0);
      const importedProposalCount = importedProjects.reduce((sum, p) => sum + (p.proposals?.length || 0), 0);

      const currentProjectIds = new Set(currentProjects.map(p => p.id));
      const importedProjectIds = new Set(importedProjects.map(p => p.id));
      
      const newProjects = importedProjects.filter(p => !currentProjectIds.has(p.id));
      const duplicateProjects = importedProjects.filter(p => currentProjectIds.has(p.id));

      const currentProposalIds = new Set(
        currentProjects.flatMap(p => p.proposals?.map(prop => prop.id) || [])
      );
      
      let newProposals = 0;
      let existingProposals = 0;
      importedProjects.forEach(p => {
        (p.proposals || []).forEach(prop => {
          if (currentProposalIds.has(prop.id)) existingProposals++;
          else newProposals++;
        });
      });

      setPreview({
        version: backupData.version,
        exportedAt: backupData.exportedAt || backupData.generatedAt,
        source: backupData.generator || 'Unknown',
        stats: {
          currentProjects: currentProjects.length,
          currentProposals: currentProposalCount,
          currentMilestones: currentMilestones.length,
          importedProjects: importedProjects.length,
          importedProposals: importedProposalCount,
          importedMilestones: importedMilestones.length,
        },
        newProjects: newProjects.length,
        duplicateProjects: duplicateProjects.length,
        newProposals,
        existingProposals,
        data: backupData.data,
      });
    } catch (e) {
      setError('解析备份文件失败：' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      parseZipFile(droppedFile);
    } else {
      setError('请选择 .zip 格式的备份文件');
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      parseZipFile(selectedFile);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !preview.data) return;
    setLoading(true);
    try {
      await onImport(preview.data);
      handleClose();
    } catch (e) {
      setError('导入失败：' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            📦 导入数据备份
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Drop Zone */}
          {!preview && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                拖拽 .zip 备份文件到此处
              </p>
              <p className="text-gray-400 text-sm mb-4">或</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                选择文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Loading */}
          {loading && !preview && (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-2">⏳</div>
              <p className="text-gray-500">正在解析备份文件...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && !loading && (
            <div className="space-y-4">
              {/* Backup Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📋</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">备份信息</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>版本：v{preview.version || '?'}</p>
                  <p>导出时间：{preview.exportedAt ? new Date(preview.exportedAt).toLocaleString() : '未知'}</p>
                  <p>来源：{preview.source}</p>
                </div>
              </div>

              {/* Stats Comparison */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📊</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">数据对比</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">当前数据</p>
                    <p className="font-medium">项目 {preview.stats.currentProjects} · 提案 {preview.stats.currentProposals} · 里程碑 {preview.stats.currentMilestones}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">导入数据</p>
                    <p className="font-medium">项目 {preview.stats.importedProjects} · 提案 {preview.stats.importedProposals} · 里程碑 {preview.stats.importedMilestones}</p>
                  </div>
                </div>
              </div>

              {/* Change Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📈</span>
                  <span className="font-medium text-blue-700 dark:text-blue-300">变更预览</span>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-green-600 dark:text-green-400">
                    + {preview.newProjects} 个新项目
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400">
                    ~ {preview.duplicateProjects} 个重复项目（将跳过）
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    + {preview.newProposals} 个新提案
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400">
                    ~ {preview.existingProposals} 个重复提案（将跳过）
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          {preview && (
            <button
              onClick={() => { setPreview(null); setFile(null); }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              重新选择
            </button>
          )}
          <button
            onClick={handleConfirmImport}
            disabled={!preview || loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                导入中...
              </>
            ) : (
              <>
                ✅ 确认导入
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportBackupModal;
