/**
 * Restore Service - V28 Enhanced Data Restore
 * Handles data restoration from various backup sources
 */

import { validateBackupData, mergeBackupData } from './backupService';

const RESTORE_STEPS = {
  VALIDATE: 'validate',
  PARSE: 'parse',
  MERGE: 'merge',
  COMPLETE: 'complete'
};

/**
 * Restore result structure
 * @typedef {Object} RestoreResult
 * @property {boolean} success - Whether restore was successful
 * @property {object[]} projects - Restored projects
 * @property {object[]} milestones - Restored milestones
 * @property {number} importedCount - Number of items imported
 * @property {number} skippedCount - Number of items skipped
 * @property {string[]} errors - Error messages
 * @property {string[]} warnings - Warning messages
 */

/**
 * Parse JSON file content
 * @param {string|ArrayBuffer} content - File content
 * @param {string} filename - Original filename
 * @returns {{ data: object, format: string, error?: string }}
 */
export function parseBackupFile(content, filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  try {
    if (ext === 'json') {
      const data = typeof content === 'string' 
        ? JSON.parse(content) 
        : JSON.parse(new TextDecoder().decode(content));
      
      // Check if it's a direct projects array (old format)
      if (Array.isArray(data)) {
        return {
          data: {
            version: 1,
            data: { projects: data, milestones: [] }
          },
          format: 'legacy_json'
        };
      }
      
      return { data, format: 'v4_json' };
    }
    
    return { data: null, format: null, error: `Unsupported file format: .${ext}` };
  } catch (e) {
    return { data: null, format: null, error: `Failed to parse file: ${e.message}` };
  }
}

/**
 * Validate restore data
 * @param {object} data - Parsed backup data
 * @returns {{ valid: boolean, errors: string[], warnings: string[], metadata?: object }}
 */
export function validateRestoreData(data) {
  const errors = [];
  const warnings = [];
  
  // Check structure
  if (!data) {
    errors.push('No data to restore');
    return { valid: false, errors, warnings };
  }
  
  // Handle legacy format
  if (Array.isArray(data)) {
    warnings.push('Legacy backup format detected - all proposals will be imported');
    return {
      valid: true,
      errors,
      warnings,
      metadata: { projectCount: data.length, proposalCount: data.reduce((sum, p) => sum + (p.proposals?.length || 0), 0) }
    };
  }
  
  // Validate new format
  const validation = validateBackupData(data);
  if (!validation.valid) {
    errors.push(validation.error);
    return { valid: false, errors, warnings };
  }
  
  if (validation.warnings) {
    warnings.push(...validation.warnings);
  }
  
  return {
    valid: true,
    errors,
    warnings,
    metadata: data.metadata || {}
  };
}

/**
 * Execute restore operation
 * @param {object} backupData - Validated backup data
 * @param {object[]} existingProjects - Current projects
 * @param {object[]} existingMilestones - Current milestones
 * @param {object} [options] - Restore options
 * @returns {RestoreResult}
 */
export function executeRestore(backupData, existingProjects, existingMilestones = [], options = {}) {
  const result = {
    success: false,
    projects: existingProjects,
    milestones: existingMilestones,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
    warnings: []
  };
  
  try {
    // Extract data based on format
    let importedProjects = [];
    let importedMilestones = [];
    
    if (Array.isArray(backupData)) {
      // Legacy format
      importedProjects = backupData;
    } else if (backupData.data) {
      importedProjects = backupData.data.projects || [];
      importedMilestones = backupData.data.milestones || [];
    } else {
      result.errors.push('Invalid backup data structure');
      return result;
    }
    
    // Validate again after extraction
    const validation = validateRestoreData(importedProjects);
    if (!validation.valid) {
      result.errors.push(...validation.errors);
      return result;
    }
    
    if (validation.warnings) {
      result.warnings.push(...validation.warnings);
    }
    
    // Calculate counts before merge
    const importedProposalCount = importedProjects.reduce(
      (sum, p) => sum + (p.proposals?.length || 0), 0
    );
    
    // Merge or replace based on mode
    const mergeMode = options.mergeMode || 'skip';
    
    if (mergeMode === 'replace') {
      result.projects = importedProjects;
      result.milestones = importedMilestones;
      result.importedCount = importedProposalCount;
    } else {
      result.projects = mergeBackupData(existingProjects, importedProjects, mergeMode === 'merge' ? 'merge' : 'skip');
      
      // Merge milestones if in merge mode
      if (mergeMode === 'merge') {
        const existingMilestoneIds = new Set(existingMilestones.map(m => m.id));
        importedMilestones.forEach(ms => {
          if (!existingMilestoneIds.has(ms.id)) {
            result.milestones.push(ms);
          }
        });
      }
      
      // Calculate actual imported count
      const existingIds = new Set(existingProjects.flatMap(p => 
        p.proposals?.map(prop => prop.id) || []
      ));
      
      result.importedCount = importedProjects.reduce((sum, p) => 
        sum + (p.proposals?.filter(prop => !existingIds.has(prop.id)).length || 0), 0
      );
    }
    
    result.success = true;
    
  } catch (e) {
    result.errors.push(`Restore failed: ${e.message}`);
  }
  
  return result;
}

/**
 * Create restore preview showing what will be imported
 * @param {object} backupData - Backup data to preview
 * @param {object[]} existingProjects - Current projects
 * @returns {{ newProjects: object[], duplicateProjects: object[], newProposals: number, existingProposals: number }}
 */
export function createRestorePreview(backupData, existingProjects) {
  let importedProjects = [];
  
  if (Array.isArray(backupData)) {
    importedProjects = backupData;
  } else if (backupData.data) {
    importedProjects = backupData.data.projects || [];
  }
  
  const existingProjectIds = new Set(existingProjects.map(p => p.id));
  const existingProposalIds = new Set(
    existingProjects.flatMap(p => p.proposals?.map(prop => prop.id) || [])
  );
  
  const newProjects = importedProjects.filter(p => !existingProjectIds.has(p.id));
  const duplicateProjects = importedProjects.filter(p => existingProjectIds.has(p.id));
  
  let newProposals = 0;
  let existingProposals = 0;
  
  importedProjects.forEach(p => {
    (p.proposals || []).forEach(prop => {
      if (existingProposalIds.has(prop.id)) {
        existingProposals++;
      } else {
        newProposals++;
      }
    });
  });
  
  return {
    newProjects,
    duplicateProjects,
    newProposals,
    existingProposals,
    totalProjects: importedProjects.length,
    totalProposals: importedProjects.reduce((sum, p) => sum + (p.proposals?.length || 0), 0)
  };
}

/**
 * Read and restore from File object
 * @param {File} file - File to restore from
 * @param {object[]} currentProjects - Current projects
 * @param {object[]} currentMilestones - Current milestones
 * @param {object} [options] - Restore options
 * @returns {Promise<RestoreResult>}
 */
export async function restoreFromFile(file, currentProjects, currentMilestones = [], options = {}) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      const { data, format, error } = parseBackupFile(content, file.name);
      
      if (error) {
        resolve({
          success: false,
          projects: currentProjects,
          milestones: currentMilestones,
          importedCount: 0,
          skippedCount: 0,
          errors: [error],
          warnings: []
        });
        return;
      }
      
      // Validate
      const validation = validateRestoreData(data);
      if (!validation.valid) {
        resolve({
          success: false,
          projects: currentProjects,
          milestones: currentMilestones,
          importedCount: 0,
          skippedCount: 0,
          errors: validation.errors,
          warnings: validation.warnings || []
        });
        return;
      }
      
      // Execute restore
      const result = executeRestore(data, currentProjects, currentMilestones, options);
      result.warnings.push(...validation.warnings);
      
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        projects: currentProjects,
        milestones: currentMilestones,
        importedCount: 0,
        skippedCount: 0,
        errors: ['Failed to read file'],
        warnings: []
      });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Restore from auto backup
 * @param {string} dateKey - Date key (YYYY-MM-DD)
 * @param {object[]} currentProjects - Current projects
 * @param {object[]} currentMilestones - Current milestones
 * @param {object} [options] - Restore options
 * @returns {RestoreResult}
 */
export function restoreFromAutoBackup(dateKey, currentProjects, currentMilestones = [], options = {}) {
  // Import getAutoBackup dynamically to avoid circular dependency
  let autoBackup = null;
  try {
    const { getAutoBackup } = require('./backupService');
    autoBackup = getAutoBackup(dateKey);
  } catch {
    // fallback
  }
  
  if (!autoBackup) {
    return {
      success: false,
      projects: currentProjects,
      milestones: currentMilestones,
      importedCount: 0,
      skippedCount: 0,
      errors: [`No auto backup found for ${dateKey}`],
      warnings: []
    };
  }
  
  const validation = validateRestoreData(autoBackup);
  if (!validation.valid) {
    return {
      success: false,
      projects: currentProjects,
      milestones: currentMilestones,
      importedCount: 0,
      skippedCount: 0,
      errors: validation.errors,
      warnings: validation.warnings || []
    };
  }
  
  const result = executeRestore(autoBackup, currentProjects, currentMilestones, options);
  result.warnings.push(...validation.warnings);
  
  return result;
}

/**
 * Get restore history from local storage
 * @returns {Array<{ timestamp: number, filename: string, success: boolean, importedCount: number }>}
 */
export function getRestoreHistory() {
  try {
    const history = localStorage.getItem('proposals_restore_history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Add entry to restore history
 * @param {object} entry - Restore history entry
 */
export function addRestoreHistory(entry) {
  try {
    const history = getRestoreHistory();
    history.unshift({
      timestamp: Date.now(),
      ...entry
    });
    
    // Keep only last 20 entries
    const trimmed = history.slice(0, 20);
    localStorage.setItem('proposals_restore_history', JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save restore history:', e);
  }
}

/**
 * Clear restore history
 */
export function clearRestoreHistory() {
  localStorage.removeItem('proposals_restore_history');
}

export default {
  RESTORE_STEPS,
  parseBackupFile,
  validateRestoreData,
  executeRestore,
  createRestorePreview,
  restoreFromFile,
  restoreFromAutoBackup,
  getRestoreHistory,
  addRestoreHistory,
  clearRestoreHistory
};
