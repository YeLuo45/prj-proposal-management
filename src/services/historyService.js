/**
 * HistoryService - V20 Collaboration Enhancement
 * Manages history tracking for proposals and milestones
 */

const HISTORY_KEY = 'proposals_history_v2';
const MAX_HISTORY = 200;

const ENTITY_TYPES = {
  PROPOSAL: 'proposal',
  MILESTONE: 'milestone',
  PROJECT: 'project',
};

const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

export { ENTITY_TYPES, ACTION_TYPES };

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Get all history records, optionally filtered
 */
export function getAllHistory(filters = {}) {
  let history = getHistory();
  
  if (filters.entityType) {
    history = history.filter(h => h.entityType === filters.entityType);
  }
  if (filters.entityId) {
    history = history.filter(h => h.entityId === filters.entityId);
  }
  if (filters.projectId) {
    history = history.filter(h => h.projectId === filters.projectId);
  }
  if (filters.actionType) {
    history = history.filter(h => h.action === filters.actionType);
  }
  
  return history;
}

/**
 * Get history for a specific entity
 */
export function getEntityHistory(entityType, entityId) {
  return getAllHistory({ entityType, entityId });
}

/**
 * Get history for a project (all entities)
 */
export function getProjectHistory(projectId) {
  return getAllHistory({ projectId }).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

/**
 * Add a new history record
 */
export function addHistoryRecord(record) {
  const history = getHistory();
  const newRecord = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...record,
  };
  
  history.unshift(newRecord);
  
  // Keep only MAX_HISTORY records
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }
  
  saveHistory(history);
  return newRecord;
}

/**
 * Record a create action
 */
export function recordCreate(entityType, entity, projectId) {
  return addHistoryRecord({
    action: ACTION_TYPES.CREATE,
    entityType,
    entityId: entity.id,
    entityName: entity.name || entity.title || 'Untitled',
    projectId,
    changes: {
      created: { ...entity },
    },
    description: `Created ${entityType}: ${entity.name || entity.title || entity.id}`,
  });
}

/**
 * Record an update action
 */
export function recordUpdate(entityType, entityId, before, after, projectId) {
  const changes = {};
  
  // Calculate what changed
  Object.keys(after).forEach(key => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = {
        from: before[key],
        to: after[key],
      };
    }
  });
  
  return addHistoryRecord({
    action: ACTION_TYPES.UPDATE,
    entityType,
    entityId,
    entityName: after.name || after.title || entityId,
    projectId,
    changes,
    before: { ...before },
    after: { ...after },
    description: `Updated ${entityType}: ${after.name || after.title || entityId}`,
  });
}

/**
 * Record a delete action
 */
export function recordDelete(entityType, entity, projectId) {
  return addHistoryRecord({
    action: ACTION_TYPES.DELETE,
    entityType,
    entityId: entity.id,
    entityName: entity.name || entity.title || 'Untitled',
    projectId,
    changes: {
      deleted: { ...entity },
    },
    description: `Deleted ${entityType}: ${entity.name || entity.title || entity.id}`,
  });
}

/**
 * Get timeline grouped by date
 */
export function getTimelineByDate(projectId) {
  const history = getProjectHistory(projectId);
  const grouped = {};
  
  history.forEach(record => {
    const date = record.timestamp.split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(record);
  });
  
  return Object.entries(grouped).map(([date, records]) => ({
    date,
    records,
  }));
}

/**
 * Clear all history
 */
export function clearAllHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Clear history for a specific project
 */
export function clearProjectHistory(projectId) {
  const history = getHistory().filter(h => h.projectId !== projectId);
  saveHistory(history);
}

export default {
  ENTITY_TYPES,
  ACTION_TYPES,
  getAllHistory,
  getEntityHistory,
  getProjectHistory,
  addHistoryRecord,
  recordCreate,
  recordUpdate,
  recordDelete,
  getTimelineByDate,
  clearAllHistory,
  clearProjectHistory,
};
