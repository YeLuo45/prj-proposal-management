import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SyncSettings from '../components/SyncSettings';
import AISettings from '../components/AISettings';
import ImportExportPanel from '../components/ImportExportPanel';
import ExportPanel from '../components/ExportPanel';

function SettingsPage() {
  const { t } = useTranslation();

  // Get projects from localStorage if available
  const [localProjects, setLocalProjects] = useState([]);
  const [localMilestones, setLocalMilestones] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('proposals_data');
      if (stored) {
        const data = JSON.parse(stored);
        setLocalProjects(data.projects || []);
        setLocalMilestones(data.milestones || []);
      }
    } catch (e) {
      console.warn('Failed to load local data:', e);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        ⚙️ {t('app.settings') || '设置'}
      </h1>

      <div className="space-y-6">
        {/* Sync Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            同步设置
          </h2>
          <SyncSettings />
        </section>

        {/* AI Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            AI 设置
          </h2>
          <AISettings />
        </section>

        {/* Import/Export Panel */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            导入/导出
          </h2>
          <ImportExportPanel
            projects={localProjects}
            milestones={localMilestones}
            onImport={(file) => {
              // Handle file import - trigger file input click
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv,.json';
              input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      if (file.name.endsWith('.csv')) {
                        // Handle CSV
                        console.log('CSV file selected');
                      } else if (file.name.endsWith('.json')) {
                        // Handle JSON restore
                        const data = JSON.parse(ev.target.result);
                        localStorage.setItem('proposals_data', JSON.stringify(data));
                        setLocalProjects(data.projects || []);
                        setLocalMilestones(data.milestones || []);
                        alert('恢复成功！');
                      }
                    } catch (err) {
                      alert('处理失败：' + err.message);
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            onRestore={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const data = JSON.parse(e.target.result);
                  localStorage.setItem('proposals_data', JSON.stringify(data));
                  setLocalProjects(data.projects || []);
                  setLocalMilestones(data.milestones || []);
                  alert('恢复成功！');
                } catch (err) {
                  alert('恢复失败：' + err.message);
                }
              };
              reader.readAsText(file);
            }}
          />
        </section>

        {/* PNG/PDF Export Panel */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            导出图片/PDF
          </h2>
          <ExportPanel
            projects={localProjects}
            milestones={localMilestones}
          />
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
