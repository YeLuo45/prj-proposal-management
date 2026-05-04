/**
 * Backup Service - V28 Enhanced Data Backup
 * Handles automated and manual backups of proposals data
 */

import { downloadFile } from '../utils/csvExporter';

const BACKUP_VERSION = 4;
const BACKUP_KEY_PREFIX = 'proposals_backup_';
const MAX_LOCAL_BACKUPS = 10;

/**
 * Backup metadata structure
 * @typedef {Object} BackupMetadata
 * @property {string} id - Unique backup ID
 * @property {string} filename - Original filename
 * @property {number} version - Backup version
 * @property {string} createdAt - ISO timestamp
 * @property {number} projectCount - Number of projects
 * @property {number} proposalCount - Number of proposals
 * @property {number} milestoneCount - Number of milestones
 * @property {number} fileSize - File size in bytes
 */

/**
 * Generate backup data structure
 * @param {object[]} projects - Projects array
 * @param {object[]} milestones - Milestones array
 * @param {object} [options] - Backup options
 * @returns {object} - Backup data object
 */
export function generateBackupData(projects, milestones, options = {}) {
  const allProposals = projects.flatMap(p => p.proposals || []);
  const timestamp = new Date().toISOString();
  
  return {
    version: BACKUP_VERSION,
    generatedAt: timestamp,
    generator: 'prj-proposals-manager V28',
    options: {
      includeHistory: options.includeHistory ?? false,
      includeSettings: options.includeSettings ?? true,
      compressed: false,
      ...options
    },
    metadata: {
      projectCount: projects.length,
      proposalCount: allProposals.length,
      milestoneCount: milestones.length,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        proposalCount: p.proposals?.length || 0
      }))
    },
    data: {
      projects,
      milestones
    }
  };
}

/**
 * Create a backup record for local storage tracking
 * @param {object} backupData - The backup data object
 * @param {string} filename - Backup filename
 * @returns {BackupMetadata} - Backup metadata
 */
function createBackupMetadata(backupData, filename) {
  return {
    id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    filename,
    version: BACKUP_VERSION,
    createdAt: backupData.generatedAt,
    projectCount: backupData.metadata.projectCount,
    proposalCount: backupData.metadata.proposalCount,
    milestoneCount: backupData.metadata.milestoneCount,
    fileSize: new Blob([JSON.stringify(backupData)]).size
  };
}

/**
 * Download backup as JSON file
 * @param {object[]} projects - Projects data
 * @param {object[]} milestones - Milestones data
 * @param {object} [options] - Backup options
 */
export function downloadBackup(projects, milestones, options = {}) {
  const backupData = generateBackupData(projects, milestones, options);
  const filename = `proposals-backup-${new Date().toISOString().split('T')[0]}.json`;
  const content = JSON.stringify(backupData, null, 2);
  
  downloadFile(content, filename, 'application/json');
  
  // Update local backup registry
  saveBackupRegistry(backupData, filename);
  
  return { filename, metadata: backupData.metadata };
}

/**
 * Save backup metadata to local registry
 * @param {object} backupData - Backup data
 * @param {string} filename - Filename
 */
function saveBackupRegistry(backupData, filename) {
  try {
    const registry = getBackupRegistry();
    const metadata = createBackupMetadata(backupData, filename);
    
    registry.unshift(metadata);
    
    // Keep only MAX_LOCAL_BACKUPS
    if (registry.length > MAX_LOCAL_BACKUPS) {
      registry.splice(MAX_LOCAL_BACKUPS);
    }
    
    localStorage.setItem(`${BACKUP_KEY_PREFIX}registry`, JSON.stringify(registry));
  } catch (e) {
    console.warn('Failed to save backup registry:', e);
  }
}

/**
 * Get local backup registry
 * @returns {BackupMetadata[]}
 */
export function getBackupRegistry() {
  try {
    const registry = localStorage.getItem(`${BACKUP_KEY_PREFIX}registry`);
    return registry ? JSON.parse(registry) : [];
  } catch {
    return [];
  }
}

/**
 * Get backup by ID from local registry
 * @param {string} backupId - Backup ID
 * @returns {BackupMetadata|null}
 */
export function getBackupById(backupId) {
  const registry = getBackupRegistry();
  return registry.find(b => b.id === backupId) || null;
}

/**
 * Delete backup from local registry
 * @param {string} backupId - Backup ID to delete
 */
export function deleteBackupRecord(backupId) {
  const registry = getBackupRegistry();
  const filtered = registry.filter(b => b.id !== backupId);
  localStorage.setItem(`${BACKUP_KEY_PREFIX}registry`, JSON.stringify(filtered));
}

/**
 * Clear all local backup records
 */
export function clearBackupRegistry() {
  localStorage.removeItem(`${BACKUP_KEY_PREFIX}registry`);
}

/**
 * Create timestamped backup entry for auto-backup
 * @param {object[]} projects - Current projects
 * @param {object[]} milestones - Current milestones
 * @returns {object} - Backup entry with timestamp
 */
export function createAutoBackup(projects, milestones) {
  const backupData = generateBackupData(projects, milestones, {
    includeHistory: false,
    includeSettings: false
  });
  
  const entry = {
    timestamp: Date.now(),
    dateStr: new Date().toISOString(),
    data: backupData
  };
  
  // Store in localStorage with key based on date
  const dateKey = new Date().toISOString().split('T')[0];
  const autoBackupKey = `${BACKUP_KEY_PREFIX}auto_${dateKey}`;
  
  try {
    // Keep only last 7 auto backups
    const existingBackups = JSON.parse(localStorage.getItem(`${BACKUP_KEY_PREFIX}auto_list`) || '[]');
    existingBackups.unshift({ key: autoBackupKey, timestamp: entry.timestamp });
    
    const trimmed = existingBackups.slice(0, 7);
    localStorage.setItem(`${BACKUP_KEY_PREFIX}auto_list`, JSON.stringify(trimmed));
    
    localStorage.setItem(autoBackupKey, JSON.stringify(entry.data));
  } catch (e) {
    console.warn('Failed to create auto backup:', e);
  }
  
  return entry;
}

/**
 * Get auto backups list
 * @returns {Array<{key: string, timestamp: number, dateStr: string}>}
 */
export function getAutoBackupsList() {
  try {
    return JSON.parse(localStorage.getItem(`${BACKUP_KEY_PREFIX}auto_list`) || '[]');
  } catch {
    return [];
  }
}

/**
 * Restore from auto backup
 * @param {string} dateKey - Date key (YYYY-MM-DD)
 * @returns {object|null} - Restored backup data or null
 */
export function getAutoBackup(dateKey) {
  try {
    const key = `${BACKUP_KEY_PREFIX}auto_${dateKey}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Validate backup data structure
 * @param {object} data - Backup data to validate
 * @returns {{ valid: boolean, error?: string, warnings?: string[] }}
 */
export function validateBackupData(data) {
  const warnings = [];
  
  if (!data) {
    return { valid: false, error: 'Backup data is empty or null' };
  }
  
  if (!data.version) {
    warnings.push('Missing version field - may be an old backup format');
  }
  
  if (!Array.isArray(data.data?.projects)) {
    return { valid: false, error: 'Invalid backup: projects must be an array' };
  }
  
  if (!Array.isArray(data.data?.milestones)) {
    warnings.push('Missing milestones array - will be initialized empty');
  }
  
  // Check for version compatibility
  if (data.version && data.version > BACKUP_VERSION) {
    return { 
      valid: false, 
      error: `Backup version ${data.version} is newer than supported version ${BACKUP_VERSION}` 
    };
  }
  
  // Validate projects structure
  data.data.projects.forEach((project, idx) => {
    if (!project.id) {
      warnings.push(`Project at index ${idx} missing ID`);
    }
    if (!project.name) {
      warnings.push(`Project at index ${idx} missing name`);
    }
    if (!Array.isArray(project.proposals)) {
      warnings.push(`Project "${project.name || idx}" proposals is not an array`);
    }
  });
  
  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Merge imported backup with existing data
 * @param {object[]} existingProjects - Current projects
 * @param {object[]} importedProjects - Projects from backup
 * @param {'skip' | 'overwrite' | 'merge'} mode - Merge mode
 * @returns {object[]} - Merged projects
 */
export function mergeBackupData(existingProjects, importedProjects, mode = 'skip') {
  if (mode === 'overwrite') {
    return importedProjects;
  }
  
  if (mode === 'merge') {
    const merged = [...existingProjects];
    const existingIds = new Set(existingProjects.map(p => p.id));
    
    importedProjects.forEach(imported => {
      if (existingIds.has(imported.id)) {
        // Merge proposals
        const existing = merged.find(p => p.id === imported.id);
        const existingProposalIds = new Set(existing.proposals?.map(p => p.id) || []);
        
        (imported.proposals || []).forEach(proposal => {
          if (!existingProposalIds.has(proposal.id)) {
            existing.proposals = existing.proposals || [];
            existing.proposals.push(proposal);
          }
        });
      } else {
        merged.push(imported);
      }
    });
    
    return merged;
  }
  
  // skip mode - don't add anything that exists
  const existingIds = new Set(existingProjects.map(p => p.id));
  const newProjects = importedProjects.filter(p => !existingIds.has(p.id));
  
  return [...existingProjects, ...newProjects];
}

/**
 * Generate backup filename with timestamp
 * @param {string} [prefix] - Custom prefix
 * @returns {string}
 */
export function generateBackupFilename(prefix = 'proposals-backup') {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}-${dateStr}-${timeStr}.json`;
}

export default {
  BACKUP_VERSION,
  MAX_LOCAL_BACKUPS,
  generateBackupData,
  downloadBackup,
  getBackupRegistry,
  getBackupById,
  deleteBackupRecord,
  clearBackupRegistry,
  createAutoBackup,
  getAutoBackupsList,
  getAutoBackup,
  validateBackupData,
  mergeBackupData,
  generateBackupFilename
};
