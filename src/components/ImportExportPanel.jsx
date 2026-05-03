import { useState, useRef } from 'react';
import { exportProjectsToCSV, downloadFile } from '../utils/csvExporter';
import { downloadJSONBackup } from '../utils/jsonBackup';
import CsvPreviewTable from './CsvPreviewTable';

function ImportExportPanel({ projects, milestones, onImport, onRestore }) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  
  // Use refs for file inputs
  const csvInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const handleExportCSV = () => {
    const csv = exportProjectsToCSV(projects);
    downloadFile(csv, `proposals-${Date.now()}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    downloadJSONBackup(projects, milestones);
  };

  const handleCSVFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onImport(file);
    setShowImportModal(true);
    e.target.value = '';
  };

  const handleJSONFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onRestore(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">导入 / 导出</h3>

      <div className="space-y-3">
        {/* CSV Export */}
        <button onClick={handleExportCSV} className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          CSV导出
        </button>

        {/* JSON Backup */}
        <button onClick={handleExportJSON} className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          JSON备份导出
        </button>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* CSV Import */}
        <button onClick={() => csvInputRef.current?.click()} className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
          导入CSV
        </button>
        <input
          type="file"
          ref={csvInputRef}
          onChange={handleCSVFileSelect}
          accept=".csv"
          className="hidden"
        />

        {/* JSON Restore */}
        <button onClick={() => jsonInputRef.current?.click()} className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
          从备份恢复
        </button>
        <input
          type="file"
          ref={jsonInputRef}
          onChange={handleJSONFileSelect}
          accept=".json"
          className="hidden"
        />
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">从备份恢复</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              恢复操作会自动备份当前数据。确定要从备份文件恢复吗？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportExportPanel;
