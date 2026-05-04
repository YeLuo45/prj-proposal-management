/**
 * Critical Path Calculation Utility
 * Implements forward and backward pass to find the critical path in a project network
 */

/**
 * Calculate the critical path for a set of milestones with dependencies
 * @param {Array} milestones - Array of milestone objects with dependencies
 * @returns {Set} Set of milestone IDs that are on the critical path
 */
export function calculateCriticalPath(milestones) {
  if (!milestones || milestones.length === 0) return new Set();

  // Build adjacency list and reverse adjacency list
  const adjList = new Map(); // milestone -> [dependents]
  const revAdjList = new Map(); // milestone -> [dependencies]
  const milestoneMap = new Map(); // id -> milestone
  
  // Initialize
  milestones.forEach(ms => {
    adjList.set(ms.id, []);
    revAdjList.set(ms.id, []);
    milestoneMap.set(ms.id, ms);
  });

  // Build edges
  milestones.forEach(ms => {
    if (ms.dependencies && ms.dependencies.length > 0) {
      ms.dependencies.forEach(depId => {
        if (adjList.has(depId) && adjList.has(ms.id)) {
          adjList.get(depId).push(ms.id); // depId -> ms (depId must finish before ms)
          revAdjList.get(ms.id).push(depId); // ms depends on depId
        }
      });
    }
  });

  // Calculate earliest start (ES) and earliest finish (EF)
  const ES = new Map();
  const EF = new Map();
  
  const calculateES = (msId) => {
    if (ES.has(msId)) return ES.get(msId);
    
    const ms = milestoneMap.get(msId);
    const deps = revAdjList.get(msId) || [];
    
    if (deps.length === 0) {
      // No dependencies, starts at day 0
      ES.set(msId, 0);
    } else {
      // Max of all predecessors' EF
      let maxEF = 0;
      deps.forEach(depId => {
        const depEF = calculateEF(depId);
        maxEF = Math.max(maxEF, depEF);
      });
      ES.set(msId, maxEF);
    }
    
    return ES.get(msId);
  };

  const calculateEF = (msId) => {
    if (EF.has(msId)) return EF.get(msId);
    
    const ms = milestoneMap.get(msId);
    const es = calculateES(msId);
    const duration = getDuration(ms.startDate, ms.endDate);
    
    EF.set(msId, es + duration);
    return EF.get(msId);
  };

  // Calculate for all milestones
  milestones.forEach(ms => {
    calculateES(ms.id);
    calculateEF(ms.id);
  });

  // Find project end time
  const projectEnd = Math.max(...Array.from(EF.values()), 0);

  // Calculate latest start (LS) and latest finish (LF) using backward pass
  const LS = new Map();
  const LF = new Map();

  const calculateLF = (msId) => {
    if (LF.has(msId)) return LF.get(msId);
    
    const ms = milestoneMap.get(msId);
    const dependents = adjList.get(msId) || [];
    
    if (dependents.length === 0) {
      // No dependents, must finish by project end
      LF.set(msId, projectEnd);
    } else {
      // Min of all successors' LS
      let minLS = Infinity;
      dependents.forEach(depId => {
        const depLS = calculateLS(depId);
        minLS = Math.min(minLS, depLS);
      });
      LF.set(msId, minLS);
    }
    
    return LF.get(msId);
  };

  const calculateLS = (msId) => {
    if (LS.has(msId)) return LS.get(msId);
    
    const ms = milestoneMap.get(msId);
    const lf = calculateLF(msId);
    const duration = getDuration(ms.startDate, ms.endDate);
    
    LS.set(msId, lf - duration);
    return LS.get(msId);
  };

  // Calculate LS for all milestones
  milestones.forEach(ms => {
    calculateLF(ms.id);
    calculateLS(ms.id);
  });

  // Find critical path: tasks where ES == LS (zero float)
  const criticalPath = new Set();
  
  milestones.forEach(ms => {
    const es = ES.get(ms.id);
    const ls = LS.get(ms.id);
    
    // Critical if slack (float) is zero or very small
    // Allow tiny floating point tolerance
    if (Math.abs(ls - es) < 0.01) {
      criticalPath.add(ms.id);
    }
  });

  return criticalPath;
}

/**
 * Get duration in days between two dates
 */
function getDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if a milestone is on the critical path
 */
export function isOnCriticalPath(criticalPathSet, milestoneId) {
  return criticalPathSet.has(milestoneId);
}

/**
 * Get the total project duration in days
 */
export function getProjectDuration(milestones, criticalPath) {
  if (!milestones || milestones.length === 0) return 0;
  
  let maxEnd = 0;
  let maxCriticalEnd = 0;
  
  milestones.forEach(ms => {
    const end = getDuration(ms.startDate, ms.endDate);
    if (end > maxEnd) maxEnd = end;
    
    if (criticalPath && criticalPath.has(ms.id)) {
      if (end > maxCriticalEnd) maxCriticalEnd = end;
    }
  });
  
  return { totalDuration: maxEnd, criticalPathDuration: maxCriticalEnd };
}
