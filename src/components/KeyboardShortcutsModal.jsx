import { useTranslation } from 'react-i18next';
import { getKeyLabel, KeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function KeyboardShortcutsModal({ onClose }) {
  const { t } = useTranslation();

  const shortcuts = [
    {
      category: t('keyboardShortcuts.categories.actions') || 'Actions',
      items: [
        { key: KeyboardShortcuts.NEW_PROPOSAL, label: t('keyboardShortcuts.newProposal') || 'New Proposal' },
        { key: KeyboardShortcuts.SEARCH, label: t('keyboardShortcuts.search') || 'Search' },
        { key: KeyboardShortcuts.SHOW_SHORTCUTS, label: t('keyboardShortcuts.showShortcuts') || 'Show Shortcuts' },
        { key: KeyboardShortcuts.CLOSE_MODAL, label: t('keyboardShortcuts.closeModal') || 'Close Modal' },
        { key: KeyboardShortcuts.SAVE, label: t('keyboardShortcuts.save') || 'Save' },
        { key: KeyboardShortcuts.UNDO, label: t('keyboardShortcuts.undo') || 'Undo' },
      ],
    },
    {
      category: t('keyboardShortcuts.categories.navigation') || 'Navigation',
      items: [
        { key: KeyboardShortcuts.GO_TO_LIST, label: t('keyboardShortcuts.goToList') || 'Go to List' },
        { key: KeyboardShortcuts.GO_TO_KANBAN, label: t('keyboardShortcuts.goToKanban') || 'Go to Kanban' },
        { key: KeyboardShortcuts.GO_TO_GANTT, label: t('keyboardShortcuts.goToGantt') || 'Go to Gantt' },
        { key: KeyboardShortcuts.GO_TO_DASHBOARD, label: t('keyboardShortcuts.goToDashboard') || 'Go to Dashboard' },
      ],
    },
    {
      category: t('keyboardShortcuts.categories.view') || 'View',
      items: [
        { key: KeyboardShortcuts.TOGGLE_THEME, label: t('keyboardShortcuts.toggleTheme') || 'Toggle Theme' },
        { key: KeyboardShortcuts.TOGGLE_ADVANCED_FILTER, label: t('keyboardShortcuts.toggleAdvancedFilter') || 'Toggle Advanced Filter' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {t('keyboardShortcuts.title') || 'Keyboard Shortcuts'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="space-y-6">
            {shortcuts.map((group) => (
              <div key={group.category}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {group.category}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div 
                      key={item.key}
                      className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <span className="text-gray-700 dark:text-gray-200">{item.label}</span>
                      <kbd className="px-3 py-1.5 text-sm font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600 shadow-sm">
                        {getKeyLabel(item.key)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('keyboardShortcuts.hint') || 'Press Esc to close'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
