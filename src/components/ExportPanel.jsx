import { useState, useRef } from 'react';
import { exportToPNG, exportToPDF } from '../utils/exportUtils';
import { exportProjectsToCSV, downloadFile } from '../utils/csvExporter';
import { downloadJSONBackup } from '../utils/jsonBackup';

function ExportPanel({ projects, milestones, exportRef }) {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState(null);

  const handleExportPNG = async () => {
    if (!exportRef?.current) {
      alert('无可导出内容');
      return;
    }
    setLoading(true);
    setExportType('png');
    try {
      await exportToPNG(exportRef.current, `proposals-${Date.now()}`, {
        scale: 2,
      });
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('PNG导出失败：' + err.message);
    } finally {
      setLoading(false);
      setExportType(null);
    }
  };

  const handleExportPDF = async () => {
    if (!exportRef?.current) {
      alert('无可导出内容');
      return;
    }
    setLoading(true);
    setExportType('pdf');
    try {
      await exportToPDF(exportRef.current, `proposals-${Date.now()}`, 'portrait', {
        scale: 2,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF导出失败：' + err.message);
    } finally {
      setLoading(false);
      setExportType(null);
    }
  };

  const handleExportCSV = () => {
    const csv = exportProjectsToCSV(projects);
    downloadFile(csv, `proposals-${Date.now()}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    downloadJSONBackup(projects, milestones);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        📊 导出 / 导入
      </h3>

      <div className="space-y-3">
        {/* PNG/PDF Export */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">可视化导出</p>
          <div className="flex gap-2">
            <button
              onClick={handleExportPNG}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && exportType === 'png' ? (
                <span className="animate-spin">⏳</span>
              ) : (
                '📷 PNG'
              )}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && exportType === 'pdf' ? (
                <span className="animate-spin">⏳</span>
              ) : (
                '📄 PDF'
              )}
            </button>
          </div>
        </div>

        {/* CSV Export */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">数据导出</p>
          <button
            onClick={handleExportCSV}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📥 CSV导出
          </button>
        </div>

        {/* JSON Backup */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">完整备份</p>
          <button
            onClick={handleExportJSON}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            💾 JSON备份导出
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        PNG/PDF将导出当前屏幕可见内容
      </p>
    </div>
  );
}

export default ExportPanel;
