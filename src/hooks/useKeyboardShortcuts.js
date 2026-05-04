import { useEffect, useCallback, useRef } from 'react';

/**
 * useKeyboardShortcuts - Hook for managing keyboard shortcuts
 * 
 * @param {Object} shortcuts - Map of keyboard shortcuts to handlers
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether shortcuts are enabled (default: true)
 * @param {boolean} options.disableOnInput - Disable shortcuts when focus is on input/textarea (default: true)
 * @param {string} options.scope - Scope identifier for the shortcuts
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
  const {
    enabled = true,
    disableOnInput = true,
    scope = 'global'
  } = options;

  const shortcutsRef = useRef(shortcuts);

  // Keep shortcuts ref updated
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Check if focus is on an input element
    const isInputElement = e.target.tagName === 'INPUT' || 
                           e.target.tagName === 'TEXTAREA' ||
                           e.target.tagName === 'SELECT' ||
                           e.target.isContentEditable;

    // Skip if disabled on input and focus is on input
    if (disableOnInput && isInputElement) return;

    // Build the key combination string
    const getKeyCombo = (event) => {
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push('ctrl');
      if (event.altKey) parts.push('alt');
      if (event.shiftKey) parts.push('shift');
      
      // Normalize key for cross-platform (Cmd on Mac = Ctrl on Windows/Linux)
      let key = event.key.toLowerCase();
      if (key === 'meta') key = 'ctrl'; // Treat Cmd as Ctrl for combo matching
      if (key === ' ') key = 'space';
      
      parts.push(key);
      return parts.join('+');
    };

    const combo = getKeyCombo(e);

    // Find matching shortcut
    const handler = shortcutsRef.current[combo];
    if (handler) {
      const result = handler(e);
      if (result === false || handler.__preventDefault) {
        e.preventDefault();
      }
    }
  }, [enabled, disableOnInput]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    enabled,
    scope,
  };
}

// Define common keyboard shortcut combinations
export const KeyboardShortcuts = {
  // Action shortcuts
  NEW_PROPOSAL: 'ctrl+n',
  SEARCH: 'ctrl+f',
  SHOW_SHORTCUTS: 'ctrl+/',
  CLOSE_MODAL: 'escape',
  SAVE: 'ctrl+s',
  UNDO: 'ctrl+z',
  
  // Navigation shortcuts
  GO_TO_LIST: 'ctrl+1',
  GO_TO_KANBAN: 'ctrl+2',
  GO_TO_GANTT: 'ctrl+3',
  GO_TO_DASHBOARD: 'ctrl+4',
  
  // View shortcuts
  TOGGLE_THEME: 'ctrl+t',
  TOGGLE_ADVANCED_FILTER: 'ctrl+shift+f',
};

// Get human-readable key label
export function getKeyLabel(keyCombo) {
  const labels = {
    'ctrl': 'Cmd/Ctrl',
    'alt': 'Alt',
    'shift': 'Shift',
    'escape': 'Esc',
    'space': 'Space',
    'n': 'N',
    'f': 'F',
    's': 'S',
    'z': 'Z',
    't': 'T',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
  };

  const parts = keyCombo.split('+');
  return parts.map(part => labels[part] || part.toUpperCase()).join(' + ');
}

export default useKeyboardShortcuts;
