/**
 * Draft Service - LocalStorage-based draft management
 * Handles auto-save for proposal editing with 7-day expiry
 */

const DRAFT_PREFIX = 'draft_';
const NEW_DRAFT_PREFIX = 'draft_new_';
const EXPIRY_DAYS = 7;

/**
 * Generate draft key for existing proposal
 */
export const getDraftKey = (proposalId) => {
  const userId = getCurrentUserId();
  return `${DRAFT_PREFIX}${proposalId}_${userId}`;
};

/**
 * Generate draft key for new proposal
 */
export const getNewDraftKey = () => {
  const userId = getCurrentUserId();
  return `${NEW_DRAFT_PREFIX}${userId}`;
};

/**
 * Get current user ID (simplified - uses a constant or generates one)
 */
const getCurrentUserId = () => {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Date.now();
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

/**
 * Save draft to localStorage
 */
export const saveDraft = (key, data) => {
  try {
    const draftData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(draftData));
    return true;
  } catch (e) {
    console.error('Failed to save draft:', e);
    return false;
  }
};

/**
 * Load draft from localStorage
 */
export const loadDraft = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const draftData = JSON.parse(raw);
    
    // Check expiry
    if (draftData.expiry && Date.now() > draftData.expiry) {
      clearDraft(key);
      return null;
    }
    
    return draftData.data;
  } catch (e) {
    console.error('Failed to load draft:', e);
    return null;
  }
};

/**
 * Clear draft from localStorage
 */
export const clearDraft = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to clear draft:', e);
    return false;
  }
};

/**
 * List all drafts (for new proposals)
 */
export const listNewDrafts = () => {
  const drafts = [];
  const userId = getCurrentUserId();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(NEW_DRAFT_PREFIX) && key.includes(userId)) {
      const draft = loadDraft(key);
      if (draft) {
        drafts.push({
          key,
          ...draft,
          timestamp: JSON.parse(localStorage.getItem(key))?.timestamp
        });
      }
    }
  }
  
  return drafts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

/**
 * Clean up expired drafts
 */
export const cleanupExpiredDrafts = () => {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(DRAFT_PREFIX) || key.startsWith(NEW_DRAFT_PREFIX))) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const draftData = JSON.parse(raw);
          if (draftData.expiry && Date.now() > draftData.expiry) {
            keysToRemove.push(key);
          }
        }
      } catch (e) {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  return keysToRemove.length;
};

// Run cleanup on module load
cleanupExpiredDrafts();
