/**
 * Version Service - LocalStorage-based version history
 * Stores up to 10 versions per proposal
 */

const VERSIONS_PREFIX = 'versions_';
const MAX_VERSIONS = 10;

/**
 * Generate version key for a proposal
 */
export const getVersionKey = (proposalId) => {
  return `${VERSIONS_PREFIX}${proposalId}`;
};

/**
 * Save a new version snapshot
 */
export const saveVersion = (proposalId, data, label = null) => {
  try {
    const key = getVersionKey(proposalId);
    const versions = listVersions(proposalId);
    
    const newVersion = {
      timestamp: Date.now(),
      label,
      data
    };
    
    // Add new version at the beginning
    versions.unshift(newVersion);
    
    // Keep only the latest MAX_VERSIONS
    const trimmedVersions = versions.slice(0, MAX_VERSIONS);
    
    localStorage.setItem(key, JSON.stringify(trimmedVersions));
    return true;
  } catch (e) {
    console.error('Failed to save version:', e);
    return false;
  }
};

/**
 * List all versions for a proposal
 */
export const listVersions = (proposalId) => {
  try {
    const key = getVersionKey(proposalId);
    const raw = localStorage.getItem(key);
    
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to list versions:', e);
    return [];
  }
};

/**
 * Get a specific version by timestamp
 */
export const getVersion = (proposalId, timestamp) => {
  try {
    const versions = listVersions(proposalId);
    return versions.find(v => v.timestamp === timestamp) || null;
  } catch (e) {
    console.error('Failed to get version:', e);
    return null;
  }
};

/**
 * Get version at index (0 = latest)
 */
export const getVersionAtIndex = (proposalId, index) => {
  const versions = listVersions(proposalId);
  return versions[index] || null;
};

/**
 * Clear all versions for a proposal
 */
export const clearVersions = (proposalId) => {
  try {
    const key = getVersionKey(proposalId);
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to clear versions:', e);
    return false;
  }
};

/**
 * Delete a specific version
 */
export const deleteVersion = (proposalId, timestamp) => {
  try {
    const key = getVersionKey(proposalId);
    const versions = listVersions(proposalId);
    const filtered = versions.filter(v => v.timestamp !== timestamp);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Failed to delete version:', e);
    return false;
  }
};

/**
 * Update version label
 */
export const updateVersionLabel = (proposalId, timestamp, label) => {
  try {
    const key = getVersionKey(proposalId);
    const versions = listVersions(proposalId);
    const version = versions.find(v => v.timestamp === timestamp);
    
    if (version) {
      version.label = label;
      localStorage.setItem(key, JSON.stringify(versions));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to update version label:', e);
    return false;
  }
};
