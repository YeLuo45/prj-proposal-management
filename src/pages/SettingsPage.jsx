import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import SyncSettings from '../components/SyncSettings';
import AISettings from '../components/AISettings';
import ImportExportPanel from '../components/ImportExportPanel';
import ExportPanel from '../components/ExportPanel';
import ThemeSwitcher from '../components/ThemeSwitcher';
import LanguageSwitcher from '../components/LanguageSwitcher';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="设置" />

      <div className="container mx-auto px-4 py-6 max-w-4xl">

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

        {/* Theme Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            主题设置
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">当前主题：</span>
            <ThemeSwitcher />
          </div>
        </section>

        {/* Language Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            语言设置
          </h2>
          <LanguageSwitcher />
        </section>

        {/* Version Info */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            版本信息
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400 w-20">版本：</span>
              <span className="font-mono text-gray-800 dark:text-gray-200">{window.__APP_VERSION__}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400 w-20">构建：</span>
              <span className="font-mono text-gray-800 dark:text-gray-200">{window.__BUILD_TIME__}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400 w-20">Commit：</span>
              <span className="font-mono text-gray-800 dark:text-gray-200">{window.__GIT_COMMIT__}</span>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            键盘快捷键
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">,</kbd>
              <span>打开设置</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">?</kbd>
              <span>快捷键列表</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Z</kbd>
              <span>撤销</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">S</kbd>
              <span>保存</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
              <span>关闭弹窗</span>
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}

export default SettingsPage;
