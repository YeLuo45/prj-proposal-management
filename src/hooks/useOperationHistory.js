import { useState, useCallback } from 'react';
import { getHistory, pushHistory, updateHistoryRecord } from '../utils/operationHistory';

export function useOperationHistory() {
  const [history, setHistory] = useState(() => getHistory());

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const pushRecord = useCallback((record) => {
    pushHistory(record);
    refreshHistory();
  }, [refreshHistory]);

  const updateRecord = useCallback((recordId, updates) => {
    updateHistoryRecord(recordId, updates);
    refreshHistory();
  }, [refreshHistory]);

  const undoLast = useCallback(() => {
    const currentHistory = getHistory();
    const lastRecord = currentHistory.find(r => !r.undone);
    if (lastRecord) {
      updateHistoryRecord(lastRecord.id, { undone: true });
      refreshHistory();
      return lastRecord;
    }
    return null;
  }, [refreshHistory]);

  const canUndo = history.length > 0 && !history[0]?.undone;

  return {
    history,
    pushRecord,
    updateRecord,
    undoLast,
    canUndo,
    refreshHistory,
  };
}
