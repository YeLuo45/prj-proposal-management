const HISTORY_KEY = 'proposals_history';
const MAX_HISTORY = 100;

export { HISTORY_KEY, MAX_HISTORY };

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function pushHistory(record) {
  const history = getHistory();
  history.unshift({ ...record, id: `hist_${Date.now()}`, undone: false });
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function updateHistoryRecord(recordId, updates) {
  const history = getHistory();
  const idx = history.findIndex(r => r.id === recordId);
  if (idx !== -1) {
    history[idx] = { ...history[idx], ...updates };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
